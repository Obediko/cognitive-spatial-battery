/* ============================================================
   animal_semantic_fluency.js
   Animal Semantic Fluency (ASF-60) - pilot implementation
   ============================================================ */
'use strict';

(function() {
  var ASF_VERSION = '0.1.0-pilot';
  var ASF_DICTIONARY_VERSION = 'asf60-en-0.1';
  var ASF_TIME_LIMIT_MS = window.PILOT_MODE ? 15000 : 60000;

  window.ASFState = {
    audio: null,
    audioUrl: null,
    promptUsed: false,
    endedEarly: false,
    microphoneProblem: false
  };

  function asfDisplay() {
    return document.getElementById('jspsych-content') ||
      document.querySelector('.jspsych-content') ||
      document.getElementById('jspsych-target');
  }

  function asfEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function asfFilename(extension) {
    var pid = window.BatteryData.participantId || 'unknown';
    var date = new Date().toISOString().slice(0, 10);
    return pid + '_' + date + '_animal_fluency.' + extension;
  }

  function asfExtension(mime) {
    if (/ogg/i.test(mime || '')) return 'ogg';
    if (/mp4/i.test(mime || '')) return 'm4a';
    return 'webm';
  }

  function downloadASFAudio() {
    if (!window.ASFState.audio) return;
    var blob = window.ASFState.audio;
    triggerDownload(blob, asfFilename(asfExtension(blob.type)), blob.type || 'audio/webm');
  }
  window.downloadASFAudio = downloadASFAudio;

  function asfInstructionTrial() {
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">ETI Core · Semantic fluency</span>'
        + '<h2>Animal Naming</h2>'
        + '<p>You will name as many different animals as you can before the one-minute timer ends.</p>'
        + '<div class="info-box"><p>Say each response clearly.</p>'
        + '<p>Keep going until the timer stops, even if you pause.</p>'
        + '<p>Your response will be recorded locally for examiner scoring.</p></div>'
        + '<p class="osr-fineprint">No recording or response is uploaded.</p></div>',
      choices: ['Continue to practice'],
      data: { task_name: 'animal_semantic_fluency', phase: 'instructions', task_version: ASF_VERSION }
    };
  }

  function asfPracticeTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = asfDisplay();
        display.innerHTML = '<div class="osr-card"><span class="osr-kicker">Practice</span>'
          + '<h2>Try a different category first</h2>'
          + '<p class="osr-prompt">Name two things that people use for writing.</p>'
          + '<p>Say your answers aloud to the examiner.</p>'
          + '<div class="asf-practice-actions">'
          + '<button class="battery-btn primary" id="asf-practice-understood">Examiner: understood</button>'
          + '<button class="battery-btn" id="asf-practice-repeat">Examiner: re-explain once</button></div>'
          + '<p id="asf-practice-note" class="osr-status"></p></div>';
        var repeatUsed = false;
        document.getElementById('asf-practice-repeat').addEventListener('click', function() {
          repeatUsed = true;
          document.getElementById('asf-practice-note').textContent =
            'Explain that both answers must belong to the same requested group. Do not use animal examples.';
          this.disabled = true;
        });
        document.getElementById('asf-practice-understood').addEventListener('click', function() {
          window.BatteryData.addTrials({
            task_name: 'animal_semantic_fluency',
            task_version: ASF_VERSION,
            phase: 'practice',
            practice_category: 'writing implements',
            practice_reexplanation_used: repeatUsed
          });
          done();
        });
      }
    };
  }

  function asfMicrophoneTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = asfDisplay();
        display.innerHTML = '<div class="osr-card"><span class="osr-kicker">Device check</span>'
          + '<h2>Microphone access</h2><p>Allow microphone access when your browser asks.</p>'
          + '<button class="battery-btn primary" id="asf-mic-check">Check microphone</button>'
          + '<p id="asf-mic-status" class="osr-status" aria-live="polite"></p></div>';
        var button = document.getElementById('asf-mic-check');
        var status = document.getElementById('asf-mic-status');
        button.addEventListener('click', function() {
          button.disabled = true;
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
            window.ASFState.microphoneProblem = true;
            status.innerHTML = '<span class="osr-error">Recording is not supported in this browser.</span>';
            button.textContent = 'Continue with protocol flag';
            button.disabled = false;
            button.onclick = function() { done(); };
            return;
          }
          navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
            stream.getTracks().forEach(function(track) { track.stop(); });
            status.innerHTML = '<span class="osr-success">Microphone is ready.</span>';
            setTimeout(function() { done(); }, 500);
          }).catch(function(error) {
            window.ASFState.microphoneProblem = true;
            status.innerHTML = '<span class="osr-error">Microphone unavailable: '
              + asfEscape(error && error.message ? error.message : 'permission denied') + '</span>';
            button.textContent = 'Continue with protocol flag';
            button.disabled = false;
            button.onclick = function() { done(); };
          });
        });
      }
    };
  }

  function asfTone() {
    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      var ctx = new AudioContextClass();
      var oscillator = ctx.createOscillator();
      var gain = ctx.createGain();
      oscillator.frequency.value = 660;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
      oscillator.onended = function() { ctx.close(); };
    } catch (error) {
      /* Tone failure does not invalidate the timed visual start. */
    }
  }

  function asfMainTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = asfDisplay();
        var totalSeconds = Math.round(ASF_TIME_LIMIT_MS / 1000);
        display.innerHTML = '<div class="osr-card asf-main"><span class="osr-kicker">Timed task</span>'
          + '<h2>Name different animals</h2>'
          + '<p>You have ' + totalSeconds + ' seconds. Keep going until the timer stops.</p>'
          + '<button class="battery-btn primary" id="asf-start">Start</button>'
          + '<div id="asf-live" hidden><div class="asf-timer-ring" id="asf-timer-ring">'
          + '<strong id="asf-time">' + totalSeconds + '</strong><span>seconds</span></div>'
          + '<div class="osr-recording-indicator"><span class="osr-recording-dot"></span> Recording locally</div>'
          + '<label class="osr-examiner-flag"><input type="checkbox" id="asf-prompt-used"> '
          + 'Examiner used the single neutral reminder</label>'
          + '<button class="battery-btn asf-emergency" id="asf-end-early">Examiner: end early</button></div>'
          + '<p id="asf-status" class="osr-status" aria-live="polite"></p></div>';

        var startButton = document.getElementById('asf-start');
        var live = document.getElementById('asf-live');
        var timeText = document.getElementById('asf-time');
        var ring = document.getElementById('asf-timer-ring');
        var status = document.getElementById('asf-status');
        var recorder = null;
        var stream = null;
        var chunks = [];
        var startedAt = null;
        var timer = null;
        var finished = false;

        function addTrialAndDone(blob, duration) {
          var promptUsed = document.getElementById('asf-prompt-used').checked;
          window.ASFState.promptUsed = promptUsed;
          if (blob) {
            window.ASFState.audio = blob;
            if (window.ASFState.audioUrl) URL.revokeObjectURL(window.ASFState.audioUrl);
            window.ASFState.audioUrl = URL.createObjectURL(blob);
          }
          window.BatteryData.addTrials({
            task_name: 'animal_semantic_fluency',
            task_version: ASF_VERSION,
            scoring_dictionary_version: ASF_DICTIONARY_VERSION,
            phase: 'category_generation',
            category: 'animals',
            time_limit_ms: ASF_TIME_LIMIT_MS,
            actual_duration_ms: duration,
            response_audio_filename: blob ? asfFilename(asfExtension(blob.type)) : null,
            response_audio_mime_type: blob ? blob.type : null,
            prompt_used: promptUsed,
            ended_early: window.ASFState.endedEarly,
            microphone_problem: window.ASFState.microphoneProblem,
            review_status: 'unscored'
          });
          done();
        }

        function finishTrial(early) {
          if (finished) return;
          finished = true;
          clearInterval(timer);
          window.ASFState.endedEarly = !!early;
          var duration = startedAt ? Date.now() - startedAt : 0;
          if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = function() {
              var blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
              if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
              addTrialAndDone(blob, duration);
            };
            recorder.stop();
          } else {
            if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
            addTrialAndDone(null, duration);
          }
        }

        function beginWithStream(activeStream) {
          stream = activeStream;
          var preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
          var mime = preferred.find(function(type) {
            return typeof MediaRecorder.isTypeSupported !== 'function' || MediaRecorder.isTypeSupported(type);
          }) || '';
          recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
          recorder.ondataavailable = function(event) {
            if (event.data && event.data.size) chunks.push(event.data);
          };
          recorder.start(250);
          startTimedPeriod();
        }

        function startTimedPeriod() {
          startedAt = Date.now();
          asfTone();
          startButton.hidden = true;
          live.hidden = false;
          status.textContent = 'Begin naming animals now.';
          timer = setInterval(function() {
            var elapsed = Date.now() - startedAt;
            var remaining = Math.max(0, ASF_TIME_LIMIT_MS - elapsed);
            var seconds = Math.ceil(remaining / 1000);
            timeText.textContent = seconds;
            var progress = remaining / ASF_TIME_LIMIT_MS;
            ring.style.setProperty('--asf-progress', String(progress * 360) + 'deg');
            if (remaining <= 0) finishTrial(false);
          }, 100);
        }

        startButton.addEventListener('click', function() {
          startButton.disabled = true;
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
            window.ASFState.microphoneProblem = true;
            status.innerHTML = '<span class="osr-error">No audio recording; examiner must transcribe live.</span>';
            startTimedPeriod();
            return;
          }
          navigator.mediaDevices.getUserMedia({ audio: true }).then(beginWithStream).catch(function(error) {
            window.ASFState.microphoneProblem = true;
            status.innerHTML = '<span class="osr-error">No audio recording; examiner must transcribe live.</span>';
            startTimedPeriod();
          });
        });

        document.getElementById('asf-end-early').addEventListener('click', function() {
          if (window.confirm('End the timed task early and mark it incomplete?')) finishTrial(true);
        });
      }
    };
  }

  function asfScoringTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = asfDisplay();
        var audio = window.ASFState.audioUrl;
        display.innerHTML = '<div class="osr-review asf-review"><div class="osr-review-header"><div>'
          + '<span class="osr-kicker">Examiner only</span><h2>Animal Fluency scoring</h2></div>'
          + '<div class="osr-score-totals"><strong id="asf-valid-total">0</strong><span>valid unique</span>'
          + '<strong id="asf-error-total">0</strong><span>other</span></div></div>'
          + '<div class="warning-box">Move the participant away from the screen before scoring.</div>'
          + (audio ? '<audio controls class="osr-audio-review" src="' + audio + '"></audio>'
            : '<p class="osr-error">No audio was captured. Use the live transcript if available.</p>')
          + '<label class="osr-transcript-label">Transcript'
          + '<textarea id="asf-transcript" rows="6" placeholder="Enter one response per line, or separate responses with commas or semicolons."></textarea></label>'
          + '<div class="asf-parser-actions"><button class="battery-btn" id="asf-parse">Create response rows</button>'
          + '<button class="battery-btn" id="asf-add-row">Add response</button></div>'
          + '<div id="asf-duplicate-warning" class="asf-duplicate-warning" hidden></div>'
          + '<div class="asf-response-table"><div class="asf-response-head">'
          + '<span>Response</span><span>Canonical label</span><span>Decision</span><span>Note</span><span></span></div>'
          + '<div id="asf-response-body"></div></div>'
          + '<div class="asf-counts"><span>Repetitions <strong id="asf-repetitions">0</strong></span>'
          + '<span>Rule violations <strong id="asf-violations">0</strong></span>'
          + '<span>Uncertain <strong id="asf-uncertain">0</strong></span>'
          + '<span>Unreviewed <strong id="asf-unreviewed">0</strong></span></div>'
          + '<div class="osr-review-actions"><button class="battery-btn primary" id="asf-save">Save review</button>'
          + '<button class="battery-btn" id="asf-defer">Defer scoring</button>'
          + (audio ? '<button class="battery-btn download" id="asf-download">Download audio</button>' : '')
          + '</div></div>';

        var body = document.getElementById('asf-response-body');

        function normalise(value) {
          return String(value || '').trim().toLocaleLowerCase('en').replace(/[.?!]+$/g, '');
        }

        function makeRow(response) {
          var row = document.createElement('div');
          row.className = 'asf-response-row';
          row.innerHTML = '<input class="asf-verbatim" aria-label="Verbatim response" value="' + asfEscape(response || '') + '">'
            + '<input class="asf-canonical" aria-label="Canonical label" value="' + asfEscape(normalise(response)) + '">'
            + '<select class="asf-decision" aria-label="Scoring decision">'
            + '<option value="unreviewed">Unreviewed</option><option value="valid">Valid</option>'
            + '<option value="repetition">Repetition</option><option value="rule_violation">Rule violation</option>'
            + '<option value="uncertain">Uncertain</option></select>'
            + '<input class="asf-note" aria-label="Scoring note">'
            + '<button class="asf-remove" aria-label="Remove response">&times;</button>';
          row.querySelector('.asf-remove').addEventListener('click', function() {
            row.remove();
            updateCounts();
          });
          Array.prototype.forEach.call(row.querySelectorAll('input,select'), function(control) {
            control.addEventListener('input', updateCounts);
            control.addEventListener('change', updateCounts);
          });
          body.appendChild(row);
        }

        function rowObjects() {
          return Array.prototype.map.call(body.querySelectorAll('.asf-response-row'), function(row) {
            return {
              response: row.querySelector('.asf-verbatim').value.trim(),
              canonical: normalise(row.querySelector('.asf-canonical').value),
              decision: row.querySelector('.asf-decision').value,
              note: row.querySelector('.asf-note').value.trim() || null
            };
          }).filter(function(row) { return row.response || row.canonical; });
        }

        function counts() {
          var rows = rowObjects();
          var validLabels = new Set(rows.filter(function(row) {
            return row.decision === 'valid' && row.canonical;
          }).map(function(row) { return row.canonical; }));
          return {
            valid: validLabels.size,
            repetitions: rows.filter(function(row) { return row.decision === 'repetition'; }).length,
            violations: rows.filter(function(row) { return row.decision === 'rule_violation'; }).length,
            uncertain: rows.filter(function(row) { return row.decision === 'uncertain'; }).length,
            unreviewed: rows.filter(function(row) { return row.decision === 'unreviewed'; }).length,
            rows: rows
          };
        }

        function updateCounts() {
          var c = counts();
          document.getElementById('asf-valid-total').textContent = c.valid;
          document.getElementById('asf-error-total').textContent = c.repetitions + c.violations + c.uncertain + c.unreviewed;
          document.getElementById('asf-repetitions').textContent = c.repetitions;
          document.getElementById('asf-violations').textContent = c.violations;
          document.getElementById('asf-uncertain').textContent = c.uncertain;
          document.getElementById('asf-unreviewed').textContent = c.unreviewed;

          var valid = c.rows.filter(function(row) { return row.decision === 'valid' && row.canonical; });
          var seen = new Set();
          var duplicates = new Set();
          valid.forEach(function(row) {
            if (seen.has(row.canonical)) duplicates.add(row.canonical);
            seen.add(row.canonical);
          });
          var warning = document.getElementById('asf-duplicate-warning');
          if (duplicates.size) {
            warning.hidden = false;
            warning.textContent = 'Duplicate valid canonical labels count once: ' + Array.from(duplicates).join(', ');
          } else {
            warning.hidden = true;
            warning.textContent = '';
          }
        }

        document.getElementById('asf-parse').addEventListener('click', function() {
          var entries = document.getElementById('asf-transcript').value
            .split(/[\n,;]+/).map(function(value) { return value.trim(); }).filter(Boolean);
          body.innerHTML = '';
          entries.forEach(makeRow);
          updateCounts();
        });
        document.getElementById('asf-add-row').addEventListener('click', function() {
          makeRow('');
          updateCounts();
        });
        var dl = document.getElementById('asf-download');
        if (dl) dl.addEventListener('click', downloadASFAudio);

        document.getElementById('asf-save').addEventListener('click', function() {
          var c = counts();
          if (c.unreviewed) {
            window.alert('Classify every response before saving, or defer scoring.');
            return;
          }
          var trial = window.BatteryData.trials.slice().reverse().find(function(row) {
            return row.task_name === 'animal_semantic_fluency' && row.phase === 'category_generation';
          });
          var status = c.uncertain ? 'provisional' : 'examiner_verified';
          if (trial) {
            trial.transcript = document.getElementById('asf-transcript').value.trim() || null;
            trial.response_rows = JSON.stringify(c.rows);
            trial.total_valid_unique = c.valid;
            trial.repetitions = c.repetitions;
            trial.rule_violations = c.violations;
            trial.uncertain_responses = c.uncertain;
            trial.review_status = status;
            trial.scored_at = getTimestamp();
          }
          window.BatteryData.setTaskSummary('animal_semantic_fluency', {
            asf_total_valid_unique: c.valid,
            asf_repetitions: c.repetitions,
            asf_rule_violations: c.violations,
            asf_uncertain_responses: c.uncertain,
            asf_prompt_used: window.ASFState.promptUsed,
            asf_ended_early: window.ASFState.endedEarly,
            asf_review_status: status,
            asf_task_version: ASF_VERSION,
            asf_dictionary_version: ASF_DICTIONARY_VERSION
          });
          done();
        });
        document.getElementById('asf-defer').addEventListener('click', function() {
          window.BatteryData.setTaskSummary('animal_semantic_fluency', {
            asf_total_valid_unique: null,
            asf_prompt_used: window.ASFState.promptUsed,
            asf_ended_early: window.ASFState.endedEarly,
            asf_review_status: 'deferred',
            asf_task_version: ASF_VERSION,
            asf_dictionary_version: ASF_DICTIONARY_VERSION
          });
          done();
        });
        makeRow('');
        updateCounts();
      }
    };
  }

  function asfEndTrial() {
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">ETI Core</span>'
        + '<h2>Animal Naming complete</h2><p>The recording and score remain local to this browser session.</p>'
        + '<p class="osr-fineprint">Download all data and audio before closing the tab.</p></div>',
      choices: ['Continue battery'],
      data: { task_name: 'animal_semantic_fluency', phase: 'end', task_version: ASF_VERSION }
    };
  }

  function buildAnimalFluencyTimeline() {
    return [
      asfInstructionTrial(),
      asfPracticeTrial(),
      asfMicrophoneTrial(),
      asfMainTrial(),
      asfScoringTrial(),
      asfEndTrial()
    ];
  }

  window.buildAnimalFluencyTimeline = buildAnimalFluencyTimeline;
})();
