/* ============================================================
   animal_semantic_fluency.js
   Animal Semantic Fluency (ASF-60) - pilot implementation
   ============================================================ */
'use strict';

(function() {
  var ASF_VERSION = '0.2.0-pilot';
  var ASF_DICTIONARY_VERSION = 'asf60-en-0.1';
  var ASF_TIME_LIMIT_MS = window.PILOT_MODE ? 15000 : 60000;
  var ASF_IS_GERMAN = window.BatteryLanguage && window.BatteryLanguage.get() === 'de';
  if (ASF_IS_GERMAN) ASF_DICTIONARY_VERSION = 'asf60-de-0.1-pilot';

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

  function asfNormalise(value) {
    if (window.BatteryLanguage) return window.BatteryLanguage.normalise(value);
    return String(value || '').trim().toLocaleLowerCase('en').replace(/[.?!]+$/g, '');
  }

  function asfSummariseRows(rows) {
    rows = Array.isArray(rows) ? rows : [];
    var validLabels = new Set(rows.filter(function(row) {
      return row.decision === 'valid' && row.canonical;
    }).map(function(row) { return asfNormalise(row.canonical); }));
    return {
      valid: validLabels.size,
      repetitions: rows.filter(function(row) { return row.decision === 'repetition'; }).length,
      violations: rows.filter(function(row) { return row.decision === 'rule_violation'; }).length,
      uncertain: rows.filter(function(row) { return row.decision === 'uncertain'; }).length,
      unreviewed: rows.filter(function(row) { return row.decision === 'unreviewed'; }).length,
      rows: rows
    };
  }

  function asfFinaliseScore(summary, endedEarly) {
    if (endedEarly) return { status: 'incomplete', total: null };
    if (summary.unreviewed) return { status: 'unreviewed', total: null };
    if (summary.uncertain) return { status: 'provisional', total: null };
    return { status: 'examiner_verified', total: summary.valid };
  }

  window.ASFScoring = {
    normalise: asfNormalise,
    summariseRows: asfSummariseRows,
    finaliseScore: asfFinaliseScore
  };

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
      stimulus: ASF_IS_GERMAN
        ? '<div class="osr-card"><span class="osr-kicker">ETI-Kern · Semantische Wortflüssigkeit</span><h2>Tiere nennen</h2>'
          + '<p>Nennen Sie innerhalb einer Minute so viele verschiedene Tiere wie möglich.</p>'
          + '<div class="info-box"><p>Sprechen Sie jedes Wort deutlich aus.</p><p>Machen Sie bis zum Ende weiter, auch wenn Sie kurz stocken.</p>'
          + '<p>Ihre Antwort wird für die spätere Auswertung aufgezeichnet.</p></div></div>'
        : '<div class="osr-card"><span class="osr-kicker">ETI Core · Semantic fluency</span>'
          + '<h2>Animal Naming</h2><p>You will name as many different animals as you can before the one-minute timer ends.</p>'
          + '<div class="info-box"><p>Say each response clearly.</p><p>Keep going until the timer stops, even if you pause.</p>'
          + '<p>Your response will be recorded locally for examiner scoring.</p></div></div>',
      choices: [ASF_IS_GERMAN ? 'Weiter zur Übung' : 'Continue to practice'],
      data: { task_name: 'animal_semantic_fluency', phase: 'instructions', task_version: ASF_VERSION }
    };
  }

  function asfPracticeTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = asfDisplay();
        display.innerHTML = ASF_IS_GERMAN
          ? '<div class="osr-card"><span class="osr-kicker">Übung</span><h2>Versuchen Sie zuerst eine andere Kategorie</h2>'
            + '<p>Drücken Sie auf „Übung starten“. Nennen Sie danach laut zwei Dinge, die Menschen zum Schreiben benutzen.</p>'
            + '<button class="battery-btn primary" id="asf-practice-action">Übung starten</button>'
            + '<p id="asf-practice-status" class="osr-status" aria-live="polite"></p></div>'
          : '<div class="osr-card"><span class="osr-kicker">Practice</span><h2>Try a different category first</h2>'
            + '<p>Press “Start practice,” then say aloud two things that people use for writing.</p>'
            + '<button class="battery-btn primary" id="asf-practice-action">Start practice</button>'
            + '<p id="asf-practice-status" class="osr-status" aria-live="polite"></p></div>';
        var button = document.getElementById('asf-practice-action');
        var status = document.getElementById('asf-practice-status');
        var startedAt = null;
        button.addEventListener('click', function() {
          if (!startedAt) {
            startedAt = Date.now();
            status.textContent = ASF_IS_GERMAN
              ? 'Nennen Sie jetzt zwei Dinge, die Menschen zum Schreiben benutzen.'
              : 'Now say two things that people use for writing.';
            button.textContent = ASF_IS_GERMAN ? 'Übung beenden' : 'Finish practice';
            return;
          }
          window.BatteryData.addTrials({
            task_name: 'animal_semantic_fluency',
            task_version: ASF_VERSION,
            phase: 'practice',
            practice_category: 'writing implements',
            practice_duration_ms: Date.now() - startedAt,
            practice_self_administered: true
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
        display.innerHTML = '<div class="osr-card"><span class="osr-kicker">' + (ASF_IS_GERMAN ? 'Geräteprüfung' : 'Device check') + '</span>'
          + '<h2>' + (ASF_IS_GERMAN ? 'Mikrofonzugriff' : 'Microphone access') + '</h2><p>'
          + (ASF_IS_GERMAN ? 'Erlauben Sie den Mikrofonzugriff, wenn Ihr Browser danach fragt.' : 'Allow microphone access when your browser asks.') + '</p>'
          + '<button class="battery-btn primary" id="asf-mic-check">' + (ASF_IS_GERMAN ? 'Mikrofon prüfen' : 'Check microphone') + '</button>'
          + '<p id="asf-mic-status" class="osr-status" aria-live="polite"></p></div>';
        var button = document.getElementById('asf-mic-check');
        var status = document.getElementById('asf-mic-status');
        button.addEventListener('click', function() {
          button.disabled = true;
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
            window.ASFState.microphoneProblem = true;
            status.innerHTML = '<span class="osr-error">' + (ASF_IS_GERMAN ? 'Dieser Browser unterstützt keine Aufnahme.' : 'Recording is not supported in this browser.') + '</span>';
            button.textContent = ASF_IS_GERMAN ? 'Mit Protokollvermerk fortfahren' : 'Continue with protocol flag';
            button.disabled = false;
            button.onclick = function() { done(); };
            return;
          }
          window.BatteryReliability.requestMicrophone(12000).then(function(stream) {
            stream.getTracks().forEach(function(track) { track.stop(); });
            status.innerHTML = '<span class="osr-success">' + (ASF_IS_GERMAN ? 'Das Mikrofon ist bereit.' : 'Microphone is ready.') + '</span>';
            setTimeout(function() { done(); }, 500);
          }).catch(function(error) {
            window.ASFState.microphoneProblem = true;
            status.innerHTML = '<span class="osr-error">' + (ASF_IS_GERMAN ? 'Mikrofon nicht verfügbar: ' : 'Microphone unavailable: ')
              + asfEscape(error && error.message ? error.message : 'permission denied') + '</span>';
            button.textContent = ASF_IS_GERMAN ? 'Mit Protokollvermerk fortfahren' : 'Continue with protocol flag';
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
        display.innerHTML = '<div class="osr-card asf-main"><span class="osr-kicker">' + (ASF_IS_GERMAN ? 'Die eigentliche Aufgabe' : 'The real task') + '</span>'
          + '<h2>' + (ASF_IS_GERMAN ? 'Nennen Sie verschiedene Tiere' : 'Name different animals') + '</h2>'
          + '<p>' + (ASF_IS_GERMAN ? ('Die eigentliche Aufgabe beginnt gleich. Sie haben ' + totalSeconds + ' Sekunden. Machen Sie weiter, bis die Zeit endet.') : ('The real task is about to begin. You have ' + totalSeconds + ' seconds. Keep going until the timer stops.')) + '</p>'
          + '<button class="battery-btn primary" id="asf-start">' + (ASF_IS_GERMAN ? 'Starten' : 'Start') + '</button>'
          + '<div id="asf-live" hidden><div class="asf-timer-ring" id="asf-timer-ring">'
          + '<strong id="asf-time">' + totalSeconds + '</strong><span>' + (ASF_IS_GERMAN ? 'Sekunden' : 'seconds') + '</span></div>'
          + '<div class="osr-recording-indicator" id="asf-recording-indicator"><span class="osr-recording-dot"></span> ' + (ASF_IS_GERMAN ? 'Lokale Aufnahme läuft' : 'Recording locally') + '</div>'
          + '<label class="osr-examiner-flag"><input type="checkbox" id="asf-prompt-used"> '
          + (ASF_IS_GERMAN ? 'Die Prüfperson verwendete die einmalige neutrale Erinnerung' : 'Examiner used the single neutral reminder') + '</label>'
          + '<button class="battery-btn asf-emergency" id="asf-end-early">' + (ASF_IS_GERMAN ? 'Prüfperson: vorzeitig beenden' : 'Examiner: end early') + '</button></div>'
          + '<p id="asf-status" class="osr-status" aria-live="polite"></p></div>';

        var startButton = document.getElementById('asf-start');
        var live = document.getElementById('asf-live');
        var timeText = document.getElementById('asf-time');
        var ring = document.getElementById('asf-timer-ring');
        var status = document.getElementById('asf-status');
        var recordingIndicator = document.getElementById('asf-recording-indicator');
        var earlyButton = document.getElementById('asf-end-early');
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
            window.BatteryArtifactStore.put(
              batteryArtifactKey(window.BatteryData.participantId, 'asf', 'main'),
              blob
            );
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
          startButton.disabled = true;
          earlyButton.disabled = true;
          clearInterval(timer);
          window.ASFState.endedEarly = !!early;
          var duration = startedAt ? Date.now() - startedAt : 0;
          if (recorder && recorder.state !== 'inactive') {
            window.BatteryReliability.stopRecorder(recorder, chunks, 3000).then(function(result) {
              if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
              if (result && result.timedOut) window.ASFState.microphoneProblem = true;
              addTrialAndDone(result && result.blob ? result.blob : null, duration);
            });
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
          startTimedPeriod(true);
        }

        function startTimedPeriod(isRecording) {
          startedAt = Date.now();
          asfTone();
          startButton.disabled = false;
          startButton.textContent = ASF_IS_GERMAN ? 'Stopp' : 'Stop';
          startButton.classList.add('asf-stop');
          live.hidden = false;
          if (!isRecording) {
            recordingIndicator.innerHTML = ASF_IS_GERMAN
              ? 'Timer läuft; Audio wird nicht aufgenommen.'
              : 'Timer running; audio is not being recorded.';
          }
          status.textContent = ASF_IS_GERMAN ? 'Beginnen Sie jetzt, Tiere zu nennen.' : 'Begin naming animals now.';
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
          if (startedAt) {
            finishTrial(true);
            return;
          }
          startButton.disabled = true;
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
            window.ASFState.microphoneProblem = true;
            status.innerHTML = '<span class="osr-error">' + (ASF_IS_GERMAN ? 'Keine Audioaufnahme; die Prüfperson muss live transkribieren.' : 'No audio recording; examiner must transcribe live.') + '</span>';
            startTimedPeriod(false);
            return;
          }
          window.BatteryReliability.requestMicrophone(12000).then(beginWithStream).catch(function(error) {
            window.ASFState.microphoneProblem = true;
            status.innerHTML = '<span class="osr-error">' + (ASF_IS_GERMAN ? 'Keine Audioaufnahme; die Prüfperson muss live transkribieren.' : 'No audio recording; examiner must transcribe live.') + '</span>';
            startTimedPeriod(false);
          });
        });

        document.getElementById('asf-end-early').addEventListener('click', function() {
          if (window.confirm(ASF_IS_GERMAN ? 'Die Zeitaufgabe vorzeitig beenden und als unvollständig markieren?' : 'End the timed task early and mark it incomplete?')) finishTrial(true);
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
          + '<textarea id="asf-transcript" rows="6" placeholder="Whisper will suggest a transcript; one response per line works best."></textarea></label>'
          + '<p id="asf-asr-status" class="osr-status" aria-live="polite"></p>'
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
        var asrOutcome = { attempted: false, succeeded: false, model: null };
        var reviewActive = true;
        var priorTrial = window.BatteryData.trials.slice().reverse().find(function(row) {
          return row.task_name === 'animal_semantic_fluency' && row.phase === 'category_generation' && row.response_rows;
        });
        var priorRows = [];
        if (priorTrial) {
          try { priorRows = JSON.parse(priorTrial.response_rows) || []; } catch (error) { priorRows = []; }
        }

        var normalise = asfNormalise;

        function makeRow(response) {
          var classified = window.BatteryLexicons
            ? window.BatteryLexicons.animals.classify(response, null, window.BatteryData.language)
            : { canonical: normalise(response), decision: 'unreviewed' };
          var row = document.createElement('div');
          row.className = 'asf-response-row';
          row.innerHTML = '<input class="asf-verbatim" aria-label="Verbatim response" value="' + asfEscape(response || '') + '">'
            + '<input class="asf-canonical" aria-label="Canonical label" value="' + asfEscape(classified.canonical || normalise(response)) + '">'
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
          if (response) row.querySelector('.asf-decision').value = classified.decision || 'unreviewed';
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
          return asfSummariseRows(rowObjects());
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

        function parseTranscriptIntoRows() {
          var entries = document.getElementById('asf-transcript').value
            .split(/[\n,;]+/).map(function(value) { return value.trim(); }).filter(Boolean);
          body.innerHTML = '';
          entries.forEach(makeRow);
          updateCounts();
        }

        var asrStatus = document.getElementById('asf-asr-status');
        if (priorRows.length) {
          document.getElementById('asf-transcript').value = priorTrial.transcript || priorRows.map(function(row) { return row.response; }).join('\n');
          priorRows.forEach(function(saved) {
            makeRow(saved.response || '');
            var row = body.lastElementChild;
            row.querySelector('.asf-canonical').value = saved.canonical || '';
            row.querySelector('.asf-decision').value = saved.decision || 'unreviewed';
            row.querySelector('.asf-note').value = saved.note || '';
          });
          updateCounts();
          asrStatus.textContent = 'Saved scoring decisions loaded. Review and change them as needed.';
        } else if (window.ASFState.audio && window.OSRTranscription && typeof window.OSRTranscription.transcribeBlob === 'function') {
          asrOutcome.attempted = true;
          asrOutcome.model = window.OSRTranscription.modelId;
          asrStatus.textContent = 'Loading local Whisper transcription…';
          window.OSRTranscription.transcribeBlob(window.ASFState.audio, function(progress) {
            if (reviewActive) asrStatus.textContent = 'Loading local Whisper model… ' + Math.round(progress) + '%';
          }).then(function(transcript) {
            if (!reviewActive || !document.getElementById('asf-transcript')) return;
            document.getElementById('asf-transcript').value = transcript
              .replace(/[.!?]+\s*/g, '\n')
              .replace(/,\s*/g, '\n')
              .trim();
            parseTranscriptIntoRows();
            asrOutcome.succeeded = true;
            asrStatus.textContent = 'Whisper suggestion ready. Verify the audio, response boundaries, spelling and every scoring decision.';
          }).catch(function(error) {
            if (!reviewActive) return;
            asrStatus.textContent = 'Automatic transcription unavailable: ' + (error && error.message ? error.message : 'unknown error') + '. Transcribe manually.';
          });
        } else {
          asrStatus.textContent = 'No local audio available for automatic transcription.';
        }

        document.getElementById('asf-parse').addEventListener('click', parseTranscriptIntoRows);
        document.getElementById('asf-add-row').addEventListener('click', function() {
          makeRow('');
          updateCounts();
        });
        var dl = document.getElementById('asf-download');
        if (dl) dl.addEventListener('click', downloadASFAudio);

        document.getElementById('asf-save').addEventListener('click', function() {
          reviewActive = false;
          var c = counts();
          if (c.unreviewed) {
            window.alert('Classify every response before saving, or defer scoring.');
            return;
          }
          var trial = window.BatteryData.trials.slice().reverse().find(function(row) {
            return row.task_name === 'animal_semantic_fluency' && row.phase === 'category_generation';
          });
          var finalised = asfFinaliseScore(c, window.ASFState.endedEarly);
          if (trial) {
            trial.transcript = document.getElementById('asf-transcript').value.trim() || null;
            trial.transcript_source = asrOutcome.succeeded ? 'local_whisper_examiner_reviewed' : 'examiner_manual';
            trial.asr_attempted = asrOutcome.attempted;
            trial.asr_model = asrOutcome.model;
            trial.response_rows = JSON.stringify(c.rows);
            trial.total_valid_unique = finalised.total;
            trial.total_valid_unique_raw = c.valid;
            trial.repetitions = c.repetitions;
            trial.rule_violations = c.violations;
            trial.uncertain_responses = c.uncertain;
            trial.review_status = finalised.status;
            trial.scored_at = getTimestamp();
          }
          window.BatteryData.setTaskSummary('animal_semantic_fluency', {
            asf_total_valid_unique: finalised.total,
            asf_total_valid_unique_raw: c.valid,
            asf_repetitions: c.repetitions,
            asf_rule_violations: c.violations,
            asf_uncertain_responses: c.uncertain,
            asf_prompt_used: window.ASFState.promptUsed,
            asf_ended_early: window.ASFState.endedEarly,
            asf_review_status: finalised.status,
            asf_task_version: ASF_VERSION,
            asf_dictionary_version: ASF_DICTIONARY_VERSION
          });
          done();
        });
        document.getElementById('asf-defer').addEventListener('click', function() {
          reviewActive = false;
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
        if (!priorRows.length) {
          makeRow('');
          updateCounts();
        }
      }
    };
  }

  function asfEndTrial() {
    var completeHeading = ASF_IS_GERMAN ? 'Tiere nennen abgeschlossen' : 'Animal Naming complete';
    var completeText = ASF_IS_GERMAN
      ? 'Die Aufnahme und der Score bleiben lokal in dieser Browsersitzung.'
      : 'The recording and score remain local to this browser session.';
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">ETI Core</span>'
        + '<h2>' + completeHeading + '</h2><p>' + completeText + '</p>'
        + '<p class="osr-fineprint">' + (ASF_IS_GERMAN ? 'Laden Sie alle Daten und Audiodateien herunter, bevor Sie den Tab schließen.' : 'Download all data and audio before closing the tab.') + '</p></div>',
      choices: [ASF_IS_GERMAN ? 'Testbatterie fortsetzen' : 'Continue battery'],
      data: { task_name: 'animal_semantic_fluency', phase: 'end', task_version: ASF_VERSION }
    };
  }

  function buildAnimalFluencyTimeline() {
    return [
      asfInstructionTrial(),
      asfPracticeTrial(),
      asfMicrophoneTrial(),
      asfMainTrial(),
      asfEndTrial()
    ];
  }

  function buildAnimalFluencyReviewTimeline() {
    return [asfScoringTrial()];
  }

  window.buildAnimalFluencyTimeline = buildAnimalFluencyTimeline;
  window.buildAnimalFluencyReviewTimeline = buildAnimalFluencyReviewTimeline;
})();
