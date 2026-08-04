/* ============================================================
   original_number_span.js
   Original Number Span (ONS) - experimental pilot
   Independently generated sequences; no NACC digit strings.
   ============================================================ */
'use strict';

(function() {
  var ONS_VERSION = '0.1.0-pilot';
  var ONS_SEQUENCE_VERSION = 'ons-controlled-0.1';

  var SEQUENCES = {
    forward: [
      { span: 3, trial: 1, digits: [4,9,2] }, { span: 3, trial: 2, digits: [7,1,5] },
      { span: 4, trial: 1, digits: [6,2,9,4] }, { span: 4, trial: 2, digits: [3,8,1,7] },
      { span: 5, trial: 1, digits: [8,3,6,1,9] }, { span: 5, trial: 2, digits: [2,7,4,9,5] },
      { span: 6, trial: 1, digits: [5,9,2,7,1,6] }, { span: 6, trial: 2, digits: [8,1,4,9,3,7] },
      { span: 7, trial: 1, digits: [3,8,5,1,9,4,7] }, { span: 7, trial: 2, digits: [6,2,9,5,1,8,4] },
      { span: 8, trial: 1, digits: [7,3,9,1,6,2,8,5] }, { span: 8, trial: 2, digits: [4,8,2,7,1,9,5,3] },
      { span: 9, trial: 1, digits: [2,7,4,9,1,6,3,8,5] }, { span: 9, trial: 2, digits: [8,3,6,1,9,4,7,2,5] }
    ],
    backward: [
      { span: 2, trial: 1, digits: [4,7] }, { span: 2, trial: 2, digits: [9,2] },
      { span: 3, trial: 1, digits: [6,1,8] }, { span: 3, trial: 2, digits: [3,9,5] },
      { span: 4, trial: 1, digits: [7,2,9,4] }, { span: 4, trial: 2, digits: [5,8,1,6] },
      { span: 5, trial: 1, digits: [9,3,7,1,5] }, { span: 5, trial: 2, digits: [2,8,4,6,1] },
      { span: 6, trial: 1, digits: [4,9,2,7,5,1] }, { span: 6, trial: 2, digits: [8,3,6,1,9,4] },
      { span: 7, trial: 1, digits: [5,1,8,3,9,2,6] }, { span: 7, trial: 2, digits: [7,4,9,1,6,3,8] },
      { span: 8, trial: 1, digits: [6,2,9,4,1,7,3,8] }, { span: 8, trial: 2, digits: [3,8,5,1,9,2,7,4] }
    ]
  };

  window.ONSState = { forward: [], backward: [], stopped: { forward: false, backward: false } };

  function expectedResponse(item, condition) {
    var values = item.digits.slice();
    return (condition === 'backward' ? values.reverse() : values).join('');
  }

  function scoreCondition(results) {
    results = Array.isArray(results) ? results : [];
    var administered = results.filter(function(r) { return r && r.administered !== false; });
    var correct = administered.filter(function(r) { return r.correct; });
    var longest = correct.length ? Math.max.apply(null, correct.map(function(r) { return r.span; })) : 0;
    var bySpan = {};
    administered.forEach(function(r) {
      bySpan[r.span] = bySpan[r.span] || [];
      bySpan[r.span].push(!!r.correct);
    });
    var discontinuedAt = null;
    Object.keys(bySpan).map(Number).sort(function(a,b) { return a-b; }).some(function(span) {
      if (bySpan[span].length >= 2 && bySpan[span].slice(0,2).every(function(v) { return !v; })) {
        discontinuedAt = span;
        return true;
      }
      return false;
    });
    return {
      totalCorrect: correct.length,
      longestSpan: longest,
      trialsAdministered: administered.length,
      discontinuedAtSpan: discontinuedAt
    };
  }

  function shouldAdminister(condition, item) {
    if (window.ONSState.stopped[condition]) return false;
    var atSpan = window.ONSState[condition].filter(function(r) { return r.span === item.span; });
    return !(atSpan.length >= 2 && atSpan.every(function(r) { return !r.correct; }));
  }

  window.ONSScoring = {
    scoreCondition: scoreCondition,
    expectedResponse: expectedResponse,
    sequences: SEQUENCES
  };

  function displayElement() {
    return document.getElementById('jspsych-content') ||
      document.querySelector('.jspsych-content') ||
      document.getElementById('jspsych-target');
  }

  function speakDigits(digits, onDone) {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      onDone(false, null);
      return;
    }
    window.speechSynthesis.cancel();
    var voice = window.speechSynthesis.getVoices().filter(function(v) {
      return /^en(-|_)/i.test(v.lang || '');
    })[0] || window.speechSynthesis.getVoices()[0] || null;
    digits.forEach(function(digit, index) {
      setTimeout(function() {
        var utterance = new SpeechSynthesisUtterance(String(digit));
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      }, index * 1000);
    });
    setTimeout(function() {
      onDone(true, voice ? { name: voice.name, lang: voice.lang } : null);
    }, digits.length * 1000 + 350);
  }

  function conditionInstructions(condition) {
    var backward = condition === 'backward';
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">ETI Core · Auditory working memory</span>'
        + '<h2>Original Number Span — ' + (backward ? 'Backward' : 'Forward') + '</h2>'
        + '<p>You will hear one digit each second. Repeat the digits '
        + (backward ? '<strong>in reverse order</strong>.' : '<strong>in the same order</strong>.') + '</p>'
        + '<p>The examiner will enter the spoken response. Do not use the keypad yourself.</p>'
        + '<p class="osr-fineprint">Pilot playback uses the device speech voice and is not standardized. Frozen recorded digits are required before research use.</p></div>',
      choices: ['Begin ' + (backward ? 'backward' : 'forward') + ' span'],
      data: { task_name: 'original_number_span', phase: condition + '_instructions', task_version: ONS_VERSION }
    };
  }

  function spanTrial(condition, item) {
    return {
      timeline: [{
        type: jsPsychCallFunction,
        async: true,
        func: function(done) {
          var display = displayElement();
          var entered = '';
          var played = false;
          var playbackCount = 0;
          var voiceInfo = null;
          var startedAt = Date.now();
          var correctExpected = expectedResponse(item, condition);

          display.innerHTML = '<div class="ons-shell"><div class="ons-header"><div><span class="osr-kicker">Examiner-assisted entry</span>'
            + '<h2>' + (condition === 'forward' ? 'Forward' : 'Backward') + ' · span ' + item.span + ' · trial ' + item.trial + '</h2></div>'
            + '<span class="ons-progress">' + (condition === 'forward' ? 'A' : 'B') + item.span + '.' + item.trial + '</span></div>'
            + '<div class="ons-play-card"><p id="ons-status">Select play when the participant is ready.</p>'
            + '<button class="battery-btn primary" id="ons-play">Play digit sequence</button>'
            + '<button class="battery-btn" id="ons-reveal">Examiner fallback: reveal digits</button>'
            + '<p id="ons-fallback" class="ons-fallback" hidden></p></div>'
            + '<div class="ons-entry-card"><p>Enter the participant\'s spoken response:</p>'
            + '<output id="ons-response" class="ons-response" aria-live="polite">—</output>'
            + '<div class="ons-keypad">' + [1,2,3,4,5,6,7,8,9,0].map(function(d) {
              return '<button class="ons-digit" data-digit="' + d + '">' + d + '</button>';
            }).join('') + '</div><div class="ons-actions">'
            + '<button class="battery-btn" id="ons-backspace">Delete last</button>'
            + '<button class="battery-btn" id="ons-no-response">No response</button>'
            + '<button class="battery-btn primary" id="ons-submit" disabled>Submit trial</button></div></div>'
            + '<p class="osr-fineprint">Keyboard digits and Backspace are supported. A connected gamepad can move focus and activate keypad buttons.</p></div>';

          var responseEl = document.getElementById('ons-response');
          var submit = document.getElementById('ons-submit');
          function renderEntry() {
            responseEl.textContent = entered || '—';
            submit.disabled = !played;
          }
          function appendDigit(value) {
            if (!played || entered.length >= item.span + 2) return;
            entered += String(value);
            renderEntry();
          }
          Array.prototype.forEach.call(document.querySelectorAll('.ons-digit'), function(button) {
            button.onclick = function() { appendDigit(button.getAttribute('data-digit')); };
          });
          document.getElementById('ons-backspace').onclick = function() {
            entered = entered.slice(0, -1); renderEntry();
          };
          document.getElementById('ons-no-response').onclick = function() {
            if (!played) return; entered = ''; submit.disabled = false; submit.click();
          };
          document.getElementById('ons-reveal').onclick = function() {
            document.getElementById('ons-fallback').hidden = false;
            document.getElementById('ons-fallback').textContent = 'Read at one digit per second: ' + item.digits.join(' · ');
          };
          document.getElementById('ons-play').onclick = function() {
            playbackCount += 1;
            played = true;
            submit.disabled = true;
            document.getElementById('ons-status').textContent = 'Playing…';
            speakDigits(item.digits, function(supported, voice) {
              voiceInfo = voice;
              document.getElementById('ons-status').textContent = supported
                ? 'Sequence complete. Listen to the participant response.'
                : 'Speech playback unavailable. Use the examiner fallback.';
              renderEntry();
            });
          };
          function keyHandler(event) {
            if (/^[0-9]$/.test(event.key)) appendDigit(event.key);
            if (event.key === 'Backspace') { entered = entered.slice(0, -1); renderEntry(); }
          }
          document.addEventListener('keydown', keyHandler);
          submit.onclick = function() {
            document.removeEventListener('keydown', keyHandler);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            var result = {
              task_name: 'original_number_span',
              task_version: ONS_VERSION,
              sequence_version: ONS_SEQUENCE_VERSION,
              phase: condition + '_trial',
              condition: condition,
              span: item.span,
              trial_within_span: item.trial,
              stimulus_digits: item.digits.join(''),
              expected_response: correctExpected,
              entered_response: entered,
              correct: entered === correctExpected,
              playback_count: playbackCount,
              playback_standardized: false,
              playback_voice_name: voiceInfo ? voiceInfo.name : null,
              playback_voice_lang: voiceInfo ? voiceInfo.lang : null,
              response_entry_duration_ms: Date.now() - startedAt
            };
            window.ONSState[condition].push(result);
            window.BatteryData.addTrials(result);
            var atSpan = window.ONSState[condition].filter(function(r) { return r.span === item.span; });
            if (atSpan.length === 2 && atSpan.every(function(r) { return !r.correct; })) {
              window.ONSState.stopped[condition] = true;
            }
            done();
          };
        }
      }],
      conditional_function: function() { return shouldAdminister(condition, item); }
    };
  }

  function saveConditionTrial(condition) {
    return {
      type: jsPsychCallFunction,
      func: function() {
        var scored = scoreCondition(window.ONSState[condition]);
        var summary = window.BatteryData.taskSummaries.original_number_span || {};
        summary['ons_' + condition + '_total_correct'] = scored.totalCorrect;
        summary['ons_' + condition + '_longest_span'] = scored.longestSpan;
        summary['ons_' + condition + '_trials_administered'] = scored.trialsAdministered;
        summary['ons_' + condition + '_discontinued_at_span'] = scored.discontinuedAtSpan;
        summary.ons_task_version = ONS_VERSION;
        summary.ons_sequence_version = ONS_SEQUENCE_VERSION;
        summary.ons_audio_standardized = false;
        window.BatteryData.setTaskSummary('original_number_span', summary);
      },
      data: { task_name: 'original_number_span', phase: condition + '_summary', task_version: ONS_VERSION }
    };
  }

  function buildOriginalNumberSpanTimeline() {
    window.ONSState.forward = [];
    window.ONSState.backward = [];
    window.ONSState.stopped.forward = false;
    window.ONSState.stopped.backward = false;
    var timeline = [conditionInstructions('forward')];
    SEQUENCES.forward.forEach(function(item) { timeline.push(spanTrial('forward', item)); });
    timeline.push(saveConditionTrial('forward'));
    timeline.push(conditionInstructions('backward'));
    SEQUENCES.backward.forEach(function(item) { timeline.push(spanTrial('backward', item)); });
    timeline.push(saveConditionTrial('backward'));
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: function() {
        var s = window.BatteryData.taskSummaries.original_number_span || {};
        return '<div class="osr-card"><h2>Original Number Span complete</h2>'
          + '<p>Forward correct trials: <strong>' + (s.ons_forward_total_correct == null ? 'N/A' : s.ons_forward_total_correct) + '</strong></p>'
          + '<p>Backward correct trials: <strong>' + (s.ons_backward_total_correct == null ? 'N/A' : s.ons_backward_total_correct) + '</strong></p>'
          + '<p class="osr-fineprint">Experimental pilot scores; not NACC Number Span scores.</p></div>';
      },
      choices: ['Continue battery'],
      data: { task_name: 'original_number_span', phase: 'end', task_version: ONS_VERSION }
    });
    return timeline;
  }

  window.buildOriginalNumberSpanTimeline = buildOriginalNumberSpanTimeline;
})();
