/* ============================================================
   number_span.js
   Number Span (ONS) - forward and backward digit span, pilot implementation
   ============================================================ */
'use strict';

(function() {
  var NS_VERSION = '0.1.0-pilot';
  var NS_AUDIO_BASE = 'assets/audio/digits/';
  var NS_ONSET_INTERVAL_MS = 1000; // exact onset-to-onset spacing between digits
  var NS_AUDIO_LOAD_TIMEOUT_MS = 8000;
  var NS_POST_SEQUENCE_BUFFER_MS = 600; // extra pause after the last digit before responding

  var NS_FORWARD_MIN_LENGTH = 3;
  var NS_FORWARD_MAX_LENGTH = 9;
  var NS_BACKWARD_MIN_LENGTH = 2;
  var NS_BACKWARD_MAX_LENGTH = 8;
  var NS_TRIALS_PER_LENGTH = 2;

  var NS_INSTRUCTION_FILES = {
    forward: NS_AUDIO_BASE + 'ons_forward_instruction_v1.wav',
    backward: NS_AUDIO_BASE + 'ons_backward_instruction_v1.wav'
  };

  function nsDigitFile(d) {
    return NS_AUDIO_BASE + 'digit_' + d + '_v1.wav';
  }

  window.NSState = {
    version: NS_VERSION,
    audioStandardized: true, // flipped to false the first time any file fails to load/play
    digitBlobUrls: {},       // digit -> object URL (preloaded once)
    usedSequences: {},       // 'direction:length' -> array of previously used sequence strings
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
      var timeoutId = setTimeout(function() {
        if (settled) return;
        settled = true;
        reject(new Error('timeout loading ' + src));
      }, NS_AUDIO_LOAD_TIMEOUT_MS);

      fetch(src).then(function(response) {
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
  // file is missing, ns audio playback falls back to speechSynthesis for the
  // affected digit(s)/instruction(s) and NSState.audioStandardized is set to
  // false so the session can be flagged for review.
  function nsPreloadAudio() {
    var jobs = [];
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

  // Speaks a single digit (or short instruction) with the browser voice as a
  // fallback when the standardized file for it failed to load.
  function nsSpeakFallback(text) {
    return new Promise(function(resolve) {
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        resolve();
        return;
      }
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onend = function() { resolve(); };
      utterance.onerror = function() { resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }

  function nsPlayInstruction(direction, statusEl, button) {
    if (button) button.disabled = true;
    if (statusEl) statusEl.textContent = 'Playing…';
    var url = NS_INSTRUCTION_FILES[direction + 'BlobUrl'];
    var finish = function() {
      if (statusEl) statusEl.textContent = '';
      if (button) button.disabled = false;
    };
    if (url) {
      var el = new Audio(url);
      el.addEventListener('ended', finish, { once: true });
      el.addEventListener('error', function() {
        if (statusEl) statusEl.textContent = 'Standardized audio unavailable, using fallback voice…';
        nsSpeakFallback(direction === 'forward'
          ? 'You will hear a series of digits, one digit at a time. When the sequence ends, repeat the digits in the same order.'
          : 'You will hear a series of digits, one digit at a time. When the sequence ends, repeat the digits in reverse order.'
        ).then(finish);
      }, { once: true });
      el.play().catch(function() { finish(); });
    } else {
      if (statusEl) statusEl.textContent = 'Standardized audio unavailable, using fallback voice…';
      nsSpeakFallback(direction === 'forward'
        ? 'You will hear a series of digits, one digit at a time. When the sequence ends, repeat the digits in the same order.'
        : 'You will hear a series of digits, one digit at a time. When the sequence ends, repeat the digits in reverse order.'
      ).then(finish);
    }
  }

  function nsInstructionTrial(direction) {
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">ETI Core · Working memory</span>'
        + '<h2>' + (direction === 'forward' ? 'Number Span — Forward' : 'Number Span — Backward') + '</h2>'
        + '<p>You will hear a series of digits, one at a time. When the sequence ends, repeat the digits '
        + (direction === 'forward' ? 'in the same order.' : 'in reverse order.') + '</p>'
        + '<button class="battery-btn" id="ns-replay-instructions" type="button">Replay instructions audio</button>'
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

  // Generates a random digit sequence of the given length: no immediately
  // repeated digit, no run of 3+ consecutive ascending or descending digits,
  // and not identical to a sequence already used at this direction/length in
  // this session.
  function nsGenerateSequence(direction, length) {
    var key = direction + ':' + length;
    var used = window.NSState.usedSequences[key] || (window.NSState.usedSequences[key] = []);

    function hasLongRun(seq) {
      var ascRun = 1, descRun = 1;
      for (var i = 1; i < seq.length; i++) {
        if (seq[i] === seq[i - 1] + 1) { ascRun++; descRun = 1; } else if (seq[i] === seq[i - 1] - 1) { descRun++; ascRun = 1; } else { ascRun = 1; descRun = 1; }
        if (ascRun >= 3 || descRun >= 3) return true;
      }
      return false;
    }

    var attempt, key2, tries = 0;
    do {
      attempt = [];
      for (var i = 0; i < length; i++) {
        var next;
        do { next = Math.floor(Math.random() * 10); } while (i > 0 && next === attempt[i - 1]);
        attempt.push(next);
      }
      key2 = attempt.join('');
      tries++;
    } while ((hasLongRun(attempt) || used.indexOf(key2) !== -1) && tries < 50);

    used.push(key2);
    return attempt;
  }

  // Plays a digit sequence with exact one-second onset-to-onset spacing.
  // Resolves once the final digit's clip has finished playing (or its
  // scheduled slot has elapsed, for fallback speech which may run long).
  function nsPlaySequence(sequence) {
    return new Promise(function(resolve) {
      var lastSlotDone = Promise.resolve();
      sequence.forEach(function(digit, index) {
        setTimeout(function() {
          var url = window.NSState.digitBlobUrls[digit];
          if (url) {
            var el = new Audio(url);
            el.play().catch(function() { /* ignore; onset schedule is unaffected */ });
            if (index === sequence.length - 1) {
              el.addEventListener('ended', function() { resolve(); }, { once: true });
              el.addEventListener('error', function() { setTimeout(resolve, NS_POST_SEQUENCE_BUFFER_MS); }, { once: true });
            }
          } else {
            window.NSState.audioStandardized = false;
            if (index === sequence.length - 1) {
              nsSpeakFallback(String(digit)).then(function() { setTimeout(resolve, NS_POST_SEQUENCE_BUFFER_MS); });
            } else {
              nsSpeakFallback(String(digit));
            }
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
        var sequence = nsGenerateSequence(direction, length);
        display.innerHTML = '<div class="osr-card osr-listening"><span class="osr-kicker">'
          + (direction === 'forward' ? 'Forward span' : 'Backward span') + ' · length ' + length
          + ' · trial ' + trialIndex + '</span>'
          + '<div class="osr-soundmark" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>'
          + '<h2>Listen for the digits</h2><p id="ns-play-status" class="osr-status" aria-live="polite">Preparing audio…</p></div>';

        var status = document.getElementById('ns-play-status');
        if (status) status.textContent = 'Playing…';

        nsPlaySequence(sequence).then(function() {
          var expected = nsExpectedResponse(direction, sequence);
          display.innerHTML = '<div class="osr-card"><span class="osr-kicker">'
            + (direction === 'forward' ? 'Forward span' : 'Backward span') + ' · length ' + length
            + ' · trial ' + trialIndex + '</span>'
            + '<h2>Examiner: enter participant\'s response</h2>'
            + '<p class="osr-fineprint">Enter the digits exactly as spoken, in the order the participant said them (digits only).</p>'
            + '<input type="text" id="ns-response-input" inputmode="numeric" pattern="[0-9]*" '
            + 'style="font-size:1.4rem;letter-spacing:0.15em;text-align:center;width:100%;max-width:320px;padding:0.5em;margin:0.6em 0" '
            + 'placeholder="Digits only" autocomplete="off">'
            + '<button class="battery-btn primary" id="ns-score-trial" type="button">Score &amp; continue</button>'
            + '<p id="ns-score-status" class="osr-status" aria-live="polite"></p></div>';

          var input = document.getElementById('ns-response-input');
          var scoreButton = document.getElementById('ns-score-trial');
          if (input) input.focus();

          function scoreTrial() {
            var response = (input ? input.value : '').replace(/[^0-9]/g, '');
            var correct = response === expected;
            window.BatteryData.addTrials({
              task_name: 'number_span',
              task_version: NS_VERSION,
              phase: 'trial',
              direction: direction,
              span_length: length,
              trial_index: trialIndex,
              presented_sequence: sequence.join(''),
              expected_response: expected,
              examiner_response: response,
              correct: correct,
              audio_standardized: window.NSState.audioStandardized
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
        window.BatteryData.setTaskSummary('number_span', {
          ns_forward_span: longestPassedLength('forward'),
          ns_backward_span: longestPassedLength('backward'),
          ns_forward_correct_trials: rows.filter(function(r) { return r.direction === 'forward' && r.correct; }).length,
          ns_backward_correct_trials: rows.filter(function(r) { return r.direction === 'backward' && r.correct; }).length,
          ns_audio_standardized: window.NSState.audioStandardized,
          ns_task_version: NS_VERSION
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
        display.innerHTML = '<div class="osr-card"><span class="osr-kicker">ETI Core · Working memory</span>'
          + '<h2>Preparing number span audio…</h2>'
          + '<p class="osr-status" aria-live="polite">This only takes a moment.</p></div>';
        nsPreloadAudio().then(function() { done(); });
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
    generateSequence: nsGenerateSequence,
    expectedResponse: nsExpectedResponse,
    shouldDiscontinue: function(lengthPassedAtThisLength) { return !lengthPassedAtThisLength; }
  };
})();
