/* ============================================================
   number_span.js
   Number Span (ONS) - forward and backward digit span, pilot implementation
   ============================================================ */
'use strict';

(function() {
  var NS_VERSION = '0.2.0-pilot';
  var NS_SEQUENCE_VERSION = 'ons-controlled-form-a-1.0';
  var NS_AUDIO_BASE = 'assets/audio/digits/';
  var NS_ONSET_INTERVAL_MS = 1000; // nominal onset spacing; actual onsets are recorded
  var NS_AUDIO_LOAD_TIMEOUT_MS = 15000;
  var NS_POST_SEQUENCE_BUFFER_MS = 600; // extra pause after the last digit before responding
  var NS_IS_GERMAN = window.BatteryLanguage && window.BatteryLanguage.get() === 'de';

  var NS_FORWARD_MIN_LENGTH = 3;
  var NS_FORWARD_MAX_LENGTH = 9;
  var NS_BACKWARD_MIN_LENGTH = 2;
  var NS_BACKWARD_MAX_LENGTH = 8;
  var NS_TRIALS_PER_LENGTH = 2;

  var NS_INSTRUCTION_FILES = {
    forward: NS_AUDIO_BASE + (NS_IS_GERMAN ? 'ons_forward_instruction_de_v2.wav' : 'ons_forward_instruction_v1.wav'),
    backward: NS_AUDIO_BASE + (NS_IS_GERMAN ? 'ons_backward_instruction_de_v2.wav' : 'ons_backward_instruction_v1.wav')
  };

  function nsDigitFile(d) {
    return NS_AUDIO_BASE + 'digit_' + d + (NS_IS_GERMAN ? '_de_v2.wav' : '_v1.wav');
  }

  window.NSState = {
    version: NS_VERSION,
    audioStandardized: true,
    digitBlobUrls: {},       // digit -> object URL (preloaded once)
    playbackOnsets: [],     // planned and observed audio starts for timing QA
    discontinued: { forward: false, backward: false },
    lengthPassed: { forward: {}, backward: {} } // length -> boolean, at least one correct trial
  };

  function nsDisplay() {
    return document.getElementById('jspsych-content') ||
      document.querySelector('.jspsych-content') ||
      document.getElementById('jspsych-target');
  }

  function nsEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Loads a file as a Blob and returns an object URL. Rejects on error/timeout
  // rather than hanging, so callers can fall back to another playback method.
  function nsLoadAsBlobUrl(src) {
    return new Promise(function(resolve, reject) {
      var settled = false;
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timeoutId = setTimeout(function() {
        if (settled) return;
        settled = true;
        if (controller) controller.abort();
        reject(new Error('timeout loading ' + src));
      }, NS_AUDIO_LOAD_TIMEOUT_MS);

      fetch(src, controller ? { signal: controller.signal } : undefined).then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.blob();
      }).then(function(blob) {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(URL.createObjectURL(blob));
      }).catch(function(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  // Preloads all ten digit files plus both instruction files once. If any
  // file is missing, the task pauses for a retry. Browser speech synthesis is
  // intentionally never substituted because it would change administration.
  function nsPreloadAudio() {
    var jobs = [];
    window.NSState.audioStandardized = true;
    for (var d = 0; d <= 9; d++) {
      (function(digit) {
        jobs.push(
          nsLoadAsBlobUrl(nsDigitFile(digit)).then(function(url) {
            window.NSState.digitBlobUrls[digit] = url;
          }).catch(function() {
            window.NSState.audioStandardized = false;
          })
        );
      })(d);
    }
    ['forward', 'backward'].forEach(function(direction) {
      jobs.push(
        nsLoadAsBlobUrl(NS_INSTRUCTION_FILES[direction]).then(function(url) {
          NS_INSTRUCTION_FILES[direction + 'BlobUrl'] = url;
        }).catch(function() {
          window.NSState.audioStandardized = false;
        })
      );
    });
    return Promise.all(jobs);
  }

  function nsPlayInstruction(direction, statusEl, button) {
    if (button) button.disabled = true;
    if (statusEl) statusEl.textContent = 'Playing…';
    var url = NS_INSTRUCTION_FILES[direction + 'BlobUrl'];
    var finished = false;
    var instructionTimer = setTimeout(function() { finish(false); }, 30000);
    var finish = function(preserveStatus) {
      if (finished) return;
      finished = true;
      clearTimeout(instructionTimer);
      if (statusEl && !preserveStatus) statusEl.textContent = '';
      if (button) button.disabled = false;
    };
    if (url) {
      var el = new Audio(url);
      el.addEventListener('ended', function() { finish(false); }, { once: true });
      el.addEventListener('error', function() {
        window.NSState.audioStandardized = false;
        if (statusEl) statusEl.textContent = NS_IS_GERMAN
          ? 'Die standardisierte Aufnahme konnte nicht abgespielt werden. Bitte erneut versuchen.'
          : 'The standardized recording could not be played. Please retry.';
        finish(true);
      }, { once: true });
      el.play().catch(function() {
        window.NSState.audioStandardized = false;
        if (statusEl) statusEl.textContent = NS_IS_GERMAN
          ? 'Die standardisierte Aufnahme konnte nicht abgespielt werden. Bitte erneut versuchen.'
          : 'The standardized recording could not be played. Please retry.';
        finish(true);
      });
    } else {
      window.NSState.audioStandardized = false;
      if (statusEl) statusEl.textContent = NS_IS_GERMAN
        ? 'Die standardisierte Aufnahme ist nicht geladen. Bitte laden Sie die Aufgabe erneut.'
        : 'The standardized recording is not loaded. Please reload the task.';
      finish(true);
    }
  }

  function nsInstructionTrial(direction) {
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">ETI Core · Working memory</span>'
        + '<h2>' + (NS_IS_GERMAN ? (direction === 'forward' ? 'Zahlenspanne — vorwärts' : 'Zahlenspanne — rückwärts') : (direction === 'forward' ? 'Number Span — Forward' : 'Number Span — Backward')) + '</h2>'
        + '<p>' + (NS_IS_GERMAN
          ? ('Sie hören einzelne Ziffern. Wiederholen Sie die Ziffern anschließend ' + (direction === 'forward' ? 'in derselben Reihenfolge.' : 'in umgekehrter Reihenfolge.'))
          : ('You will hear a series of digits, one at a time. When the sequence ends, repeat the digits ' + (direction === 'forward' ? 'in the same order.' : 'in reverse order.'))) + '</p>'
        + '<button class="battery-btn" id="ns-replay-instructions" type="button">' + (NS_IS_GERMAN ? 'Anweisung erneut abspielen' : 'Replay instructions audio') + '</button>'
        + '<p id="ns-instruction-status" class="osr-status" aria-live="polite"></p></div>',
      choices: ['Continue'],
      data: { task_name: 'number_span', phase: 'instructions', direction: direction, task_version: NS_VERSION },
      on_load: function() {
        var button = document.getElementById('ns-replay-instructions');
        var status = document.getElementById('ns-instruction-status');
        if (button) button.addEventListener('click', function() { nsPlayInstruction(direction, status, button); });
        nsPlayInstruction(direction, status, button);
      }
    };
  }

  // Versioned, investigator-controlled Form A. Every participant receives
  // the same items unless a future, separately versioned form is selected.
  var NS_CONTROLLED_SEQUENCES = {
    forward: {
      3: [[4,9,2],[7,1,5]],
      4: [[6,2,9,4],[3,8,1,7]],
      5: [[8,3,6,1,9],[2,7,4,9,5]],
      6: [[5,9,2,7,1,6],[8,1,4,9,3,7]],
      7: [[3,8,5,1,9,4,7],[6,2,9,5,1,8,4]],
      8: [[7,3,9,1,6,2,8,5],[4,8,2,7,1,9,5,3]],
      9: [[2,7,4,9,1,6,3,8,5],[8,3,6,1,9,4,7,2,5]]
    },
    backward: {
      2: [[4,7],[9,2]],
      3: [[6,1,8],[3,9,5]],
      4: [[7,2,9,4],[5,8,1,6]],
      5: [[9,3,7,1,5],[2,8,4,6,1]],
      6: [[4,9,2,7,5,1],[8,3,6,1,9,4]],
      7: [[5,1,8,3,9,2,6],[7,4,9,1,6,3,8]],
      8: [[6,2,9,4,1,7,3,8],[3,8,5,1,9,2,7,4]]
    }
  };

  function nsControlledSequence(direction, length, trialIndex) {
    var byLength = NS_CONTROLLED_SEQUENCES[direction] && NS_CONTROLLED_SEQUENCES[direction][length];
    if (!byLength || !byLength[trialIndex - 1]) {
      throw new Error('No controlled Number Span item for ' + direction + ' length ' + length + ' trial ' + trialIndex);
    }
    return byLength[trialIndex - 1].slice();
  }

  // Plays with nominal one-second spacing, records actual starts, and always
  // resolves via a hard deadline even if a browser rejects or stalls media.
  function nsPlaySequence(sequence) {
    return new Promise(function(resolve) {
      var resolved = false;
      var startedAt = performance.now();
      var hardDeadline = setTimeout(finish, sequence.length * NS_ONSET_INTERVAL_MS + NS_AUDIO_LOAD_TIMEOUT_MS);

      function finish() {
        if (resolved) return;
        resolved = true;
        clearTimeout(hardDeadline);
        setTimeout(resolve, NS_POST_SEQUENCE_BUFFER_MS);
      }

      sequence.forEach(function(digit, index) {
        var planned = startedAt + index * NS_ONSET_INTERVAL_MS;
        setTimeout(function() {
          var observed = performance.now();
          window.NSState.playbackOnsets.push({
            sequence_digit_index: index,
            digit: digit,
            planned_onset_ms: planned,
            observed_onset_ms: observed,
            onset_error_ms: observed - planned
          });
          var url = window.NSState.digitBlobUrls[digit];
          if (url) {
            var el = new Audio(url);
            if (index === sequence.length - 1) {
              el.addEventListener('ended', finish, { once: true });
              el.addEventListener('error', finish, { once: true });
            }
            el.play().catch(function() {
              window.NSState.audioStandardized = false;
              if (index === sequence.length - 1) finish();
            });
          } else {
            window.NSState.audioStandardized = false;
            if (index === sequence.length - 1) finish();
          }
        }, index * NS_ONSET_INTERVAL_MS);
      });
    });
  }

  function nsExpectedResponse(direction, sequence) {
    var seq = direction === 'forward' ? sequence : sequence.slice().reverse();
    return seq.join('');
  }

  function nsSequenceTrial(direction, length, trialIndex) {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = nsDisplay();
        var sequence = nsControlledSequence(direction, length, trialIndex);
        display.innerHTML = '<div class="osr-card osr-listening"><span class="osr-kicker">'
          + (NS_IS_GERMAN ? (direction === 'forward' ? 'Vorwärts' : 'Rückwärts') : (direction === 'forward' ? 'Forward span' : 'Backward span')) + ' · ' + (NS_IS_GERMAN ? 'Länge ' : 'length ') + length
          + ' · ' + (NS_IS_GERMAN ? 'Durchgang ' : 'trial ') + trialIndex + '</span>'
          + '<div class="osr-soundmark" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>'
          + '<h2>' + (NS_IS_GERMAN ? 'Hören Sie auf die Ziffern' : 'Listen for the digits') + '</h2><p id="ns-play-status" class="osr-status" aria-live="polite">...</p></div>';

        var status = document.getElementById('ns-play-status');
        if (status) status.textContent = 'Playing…';

        nsPlaySequence(sequence).then(function() {
          var expected = nsExpectedResponse(direction, sequence);
          display.innerHTML = '<div class="osr-card"><span class="osr-kicker">'
            + (NS_IS_GERMAN ? (direction === 'forward' ? 'Vorwärts' : 'Rückwärts') : (direction === 'forward' ? 'Forward span' : 'Backward span')) + ' · ' + (NS_IS_GERMAN ? 'Länge ' : 'length ') + length
            + ' · ' + (NS_IS_GERMAN ? 'Durchgang ' : 'trial ') + trialIndex + '</span>'
            + '<h2>' + (NS_IS_GERMAN ? 'Geben Sie die erinnerten Ziffern ein' : 'Enter the digits you remember') + '</h2>'
            + '<p class="osr-fineprint">' + (NS_IS_GERMAN ? 'Verwenden Sie nur Ziffern und die verlangte Reihenfolge.' : 'Use digits only and enter them in the requested order.') + '</p>'
            + '<input type="text" id="ns-response-input" inputmode="numeric" pattern="[0-9]*" '
            + 'style="font-size:1.4rem;letter-spacing:0.15em;text-align:center;width:100%;max-width:320px;padding:0.5em;margin:0.6em 0" '
            + 'placeholder="' + (NS_IS_GERMAN ? 'Nur Ziffern' : 'Digits only') + '" autocomplete="off">'
            + '<div id="ns-digit-pad" style="display:grid;grid-template-columns:repeat(5,minmax(48px,1fr));gap:.4rem;max-width:420px;margin:.5rem auto">'
            + [1,2,3,4,5,6,7,8,9,0].map(function(digit) { return '<button class="battery-btn ns-digit-key" type="button" data-digit="' + digit + '">' + digit + '</button>'; }).join('')
            + '<button class="battery-btn" id="ns-delete" type="button" style="grid-column:span 2">' + (NS_IS_GERMAN ? 'Löschen' : 'Delete') + '</button></div>'
            + '<button class="battery-btn primary" id="ns-score-trial" type="button">' + (NS_IS_GERMAN ? 'Antwort senden' : 'Submit response') + '</button>'
            + '<p id="ns-score-status" class="osr-status" aria-live="polite"></p></div>';

          var input = document.getElementById('ns-response-input');
          var scoreButton = document.getElementById('ns-score-trial');
          if (input) input.focus();
          Array.prototype.forEach.call(document.querySelectorAll('.ns-digit-key'), function(button) {
            button.addEventListener('click', function() {
              if (input) input.value += button.getAttribute('data-digit');
            });
          });
          var deleteButton = document.getElementById('ns-delete');
          if (deleteButton) deleteButton.addEventListener('click', function() {
            if (input) input.value = input.value.slice(0, -1);
          });

          function scoreTrial() {
            var response = (input ? input.value : '').replace(/[^0-9]/g, '');
            var correct = response === expected;
            window.BatteryData.addTrials({
              task_name: 'number_span',
              task_version: NS_VERSION,
              sequence_version: NS_SEQUENCE_VERSION,
              phase: 'trial',
              direction: direction,
              span_length: length,
              trial_index: trialIndex,
              presented_sequence: sequence.join(''),
              expected_response: expected,
              participant_response: response,
              correct: correct,
              audio_standardized: window.NSState.audioStandardized,
              playback_onsets: window.NSState.playbackOnsets.splice(0)
            });
            if (correct) window.NSState.lengthPassed[direction][length] = true;
            done({ correct: correct });
          }

          if (scoreButton) scoreButton.addEventListener('click', scoreTrial);
          if (input) input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') scoreTrial();
          });
        });
      }
    };
  }

  // After both trials at a length have run, decide whether to discontinue
  // that direction (both trials at this length were incorrect).
  function nsCheckDiscontinueTrial(direction, length) {
    return {
      type: jsPsychCallFunction,
      func: function() {
        var passed = !!window.NSState.lengthPassed[direction][length];
        if (!passed) window.NSState.discontinued[direction] = true;
      },
      data: { task_name: 'number_span', phase: 'discontinue_check', direction: direction, span_length: length }
    };
  }

  function nsLengthBlock(direction, length) {
    var trials = [];
    for (var t = 1; t <= NS_TRIALS_PER_LENGTH; t++) {
      trials.push(nsSequenceTrial(direction, length, t));
    }
    trials.push(nsCheckDiscontinueTrial(direction, length));
    return {
      timeline: trials,
      conditional_function: function() { return !window.NSState.discontinued[direction]; }
    };
  }

  function nsDirectionTimeline(direction) {
    var min = direction === 'forward' ? NS_FORWARD_MIN_LENGTH : NS_BACKWARD_MIN_LENGTH;
    var max = direction === 'forward' ? NS_FORWARD_MAX_LENGTH : NS_BACKWARD_MAX_LENGTH;
    var blocks = [nsInstructionTrial(direction)];
    for (var length = min; length <= max; length++) {
      blocks.push(nsLengthBlock(direction, length));
    }
    return blocks;
  }

  function nsFinalizeTrial() {
    return {
      type: jsPsychCallFunction,
      func: function() {
        var rows = window.BatteryData.trials.filter(function(row) {
          return row.task_name === 'number_span' && row.phase === 'trial';
        });
        function longestPassedLength(direction) {
          var lengths = Object.keys(window.NSState.lengthPassed[direction])
            .map(Number).filter(function(len) { return window.NSState.lengthPassed[direction][len]; });
          return lengths.length ? Math.max.apply(null, lengths) : 0;
        }
        Object.keys(window.NSState.digitBlobUrls).forEach(function(key) {
          window.BatteryReliability.revokeObjectUrl(window.NSState.digitBlobUrls[key]);
        });
        ['forward', 'backward'].forEach(function(direction) {
          window.BatteryReliability.revokeObjectUrl(NS_INSTRUCTION_FILES[direction + 'BlobUrl']);
        });
        window.BatteryData.setTaskSummary('number_span', {
          ns_forward_span: longestPassedLength('forward'),
          ns_backward_span: longestPassedLength('backward'),
          ns_forward_correct_trials: rows.filter(function(r) { return r.direction === 'forward' && r.correct; }).length,
          ns_backward_correct_trials: rows.filter(function(r) { return r.direction === 'backward' && r.correct; }).length,
          ns_audio_standardized: window.NSState.audioStandardized,
          ns_audio_set_version: NS_IS_GERMAN ? 'ons-audio-de-thorsten-2.0-pilot' : 'ons-audio-en-kokoro-1.0-pilot',
          ns_task_version: NS_VERSION,
          ns_sequence_version: NS_SEQUENCE_VERSION
        });
      }
    };
  }

  function nsPreloadTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = nsDisplay();
        function load() {
          display.innerHTML = '<div class="osr-card"><span class="osr-kicker">ETI Core · Working memory</span>'
            + '<h2>' + (NS_IS_GERMAN ? 'Audio für die Zahlenspanne wird vorbereitet…' : 'Preparing number span audio…') + '</h2>'
            + '<p class="osr-status" aria-live="polite">' + (NS_IS_GERMAN ? 'Dies dauert nur einen Moment.' : 'This only takes a moment.') + '</p></div>';
          nsPreloadAudio().then(function() {
            if (window.NSState.audioStandardized) {
              done({ audio_preload_complete: true });
              return;
            }
            display.innerHTML = '<div class="osr-card"><span class="osr-kicker">ETI Core · Working memory</span>'
              + '<h2>' + (NS_IS_GERMAN ? 'Audio konnte nicht vollständig geladen werden' : 'Audio did not load completely') + '</h2>'
              + '<p class="osr-error">' + (NS_IS_GERMAN
                ? 'Die Aufgabe wurde angehalten, damit keine nicht standardisierte Computerstimme verwendet wird.'
                : 'The task is paused so that a non-standardized computer voice is never substituted.') + '</p>'
              + '<button class="battery-btn primary" id="ns-retry-preload" type="button">'
              + (NS_IS_GERMAN ? 'Standardisiertes Audio erneut laden' : 'Retry standardized audio') + '</button></div>';
            document.getElementById('ns-retry-preload').addEventListener('click', load);
          });
        }
        load();
      }
    };
  }

  function buildNumberSpanTimeline() {
    return [nsPreloadTrial()]
      .concat(nsDirectionTimeline('forward'))
      .concat(nsDirectionTimeline('backward'))
      .concat([nsFinalizeTrial()]);
  }

  window.buildNumberSpanTimeline = buildNumberSpanTimeline;

  // Exposed for deterministic unit testing (see tests/number_span.test.js).
  // Pure logic only — no DOM/Audio/fetch dependencies.
  window.NSScoring = {
    controlledSequence: nsControlledSequence,
    sequenceVersion: NS_SEQUENCE_VERSION,
    expectedResponse: nsExpectedResponse,
    shouldDiscontinue: function(lengthPassedAtThisLength) { return !lengthPassedAtThisLength; }
  };
})();
