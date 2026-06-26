/* ============================================================
visual_sequencing_set_shifting.js
============================================================
Computerized Visual Sequencing and Set-Shifting Task
(NOT the Trail Making Test - do not label it as such)

Condition A - Sequencing:   click 1 -> 2 -> 3 ... -> 25
Condition B - Set-Shifting: click 1->A->2->B->3->C ... ->13->M

Practice:
  Sequencing  1-8 (with feedback)
  Set-Shifting 1->A->2->B->3->C->4->D (with feedback)

Main trials:
  One full sequencing trial, then one full set-shifting trial.
  No feedback during main trials (optional brief error note).

Exports (global): buildVisualSequencingTimeline()
============================================================ */
'use strict';

/* ── Layout constants ─────────────────────────────────────── */
const VS_RADIUS      = 26;   // target circle radius in px
const VS_MIN_DIST    = 72;   // minimum centre-to-centre distance in px
const VS_EDGE_MARGIN = 55;   // minimum distance from canvas edge in px
const VS_ERROR_MS    = 600;  // duration of error flash

/* ── Helper: get jsPsych display area without destroying its wrapper ── */
function vsGetDisplayEl() {
  /* jsPsych 7 wraps content in: jspsych-target > .jspsych-content-wrapper > #jspsych-content */
  return document.getElementById('jspsych-content')
      || document.querySelector('.jspsych-content')
      || document.getElementById('jspsych-target');
}

/* ── Sequence generators ──────────────────────────────────── */
function vsSeqNumbers(count) {
  return Array.from({ length: count }, function(_, i) { return String(i + 1); });
}
function vsSeqSetShifting() {
  var nums = Array.from({ length: 13 }, function(_, i) { return String(i + 1); });
  var lets = 'ABCDEFGHIJKLM'.split('');
  var out  = [];
  for (var i = 0; i < 13; i++) { out.push(nums[i]); out.push(lets[i]); }
  return out;
}

/* ── Non-overlapping position generator ───────────────────── */
function vsGenPositions(count, W, H) {
  var positions   = [];
  var attempts    = 0;
  var maxAttempts = count * 200;
  while (positions.length < count && attempts < maxAttempts) {
    attempts++;
    var x  = VS_EDGE_MARGIN + Math.random() * (W - 2 * VS_EDGE_MARGIN);
    var y  = VS_EDGE_MARGIN + Math.random() * (H - 2 * VS_EDGE_MARGIN);
    var ok = positions.every(function(p) { return euclideanDistance(x, y, p.x, p.y) >= VS_MIN_DIST; });
    if (ok) positions.push({ x: Math.round(x), y: Math.round(y) });
  }
  return positions;
}

/* ── Core trial (async jsPsychCallFunction) ─────────────────
 * Uses vsGetDisplayEl() to find jsPsych's inner content div,
 * so the content-wrapper is never destroyed and jsPsych can
 * advance to the next trial correctly.
 */
function buildVSTrial(opts) {
  var condition    = opts.condition;
  var trial_type   = opts.trial_type;
  var sequence     = opts.sequence;
  var showFeedback = opts.showFeedback;

  return {
    type:  jsPsychCallFunction,
    async: true,
    func:  function(done) {
      var W = Math.min(window.innerWidth  - 20,  920);
      var H = Math.min(window.innerHeight - 120, 660);

      var positions = vsGenPositions(sequence.length, W, H);

      /* ── Build DOM inside jsPsych's content element ── */
      var display = vsGetDisplayEl();
      display.innerHTML = '';

      var wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'width:100%;height:100%;font-family:Segoe UI,Arial,sans-serif;';

      var condLabel = condition === 'sequencing'
        ? (trial_type === 'practice' ? 'Practice - Sequencing'   : 'Sequencing')
        : (trial_type === 'practice' ? 'Practice - Set-Shifting' : 'Set-Shifting');

      var statusBar = document.createElement('div');
      statusBar.className   = 'vs-status-bar';
      statusBar.innerHTML   = '<strong>' + condLabel + '</strong> &nbsp;|&nbsp; Click targets in correct order.';

      var canvas   = document.createElement('div');
      canvas.className      = 'vs-container';
      canvas.style.width    = W + 'px';
      canvas.style.height   = H + 'px';

      var errorMsg = document.createElement('div');
      errorMsg.className    = 'vs-error-msg';

      wrapper.appendChild(statusBar);
      wrapper.appendChild(canvas);
      wrapper.appendChild(errorMsg);
      display.appendChild(wrapper);

      /* ── State ── */
      var nextIdx       = 0;
      var totalErrors   = 0;
      var trialRows     = [];
      var trialStart    = performance.now();
      var lastClickTime = trialStart;

      /* ── Create target circles ── */
      sequence.forEach(function(label, idx) {
        var pos = positions[idx] || { x: VS_EDGE_MARGIN + idx * 30, y: VS_EDGE_MARGIN };

        var el        = document.createElement('div');
        el.className  = 'vs-target';
        el.textContent = label;
        el.style.width  = (VS_RADIUS * 2) + 'px';
        el.style.height = (VS_RADIUS * 2) + 'px';
        el.style.left   = (pos.x - VS_RADIUS) + 'px';
        el.style.top    = (pos.y - VS_RADIUS) + 'px';

        el.addEventListener('click', function onClick(e) {
          var now       = performance.now();
          var isCorrect = (idx === nextIdx);
          var rt        = Math.round(now - lastClickTime);
          var cumTime   = Math.round(now - trialStart);

          trialRows.push({
            task_name:             'visual_sequencing_set_shifting',
            condition:             condition,
            trial_type:            trial_type,
            target_sequence:       JSON.stringify(sequence),
            target_positions_json: JSON.stringify(positions),
            click_number:          trialRows.length + 1,
            clicked_label:         label,
            expected_label:        sequence[nextIdx] || '',
            click_x:               Math.round(e.clientX),
            click_y:               Math.round(e.clientY),
            correct_click:         isCorrect,
            click_rt_ms:           rt,
            cumulative_trial_time_ms: cumTime,
            total_errors_so_far:   totalErrors + (isCorrect ? 0 : 1),
            completion_time_ms:    null,
            total_errors:          null
          });

          if (isCorrect) {
            lastClickTime = now;
            el.classList.add('correct');
            el.removeEventListener('click', onClick);
            el.style.pointerEvents = 'none';
            nextIdx++;

            if (nextIdx >= sequence.length) {
              var completionTime = Math.round(performance.now() - trialStart);
              trialRows.forEach(function(r) {
                r.completion_time_ms = completionTime;
                r.total_errors       = totalErrors;
              });

              window.BatteryData.addTrials(trialRows);

              var existing = window.BatteryData.taskSummaries['visual_sequencing_set_shifting'] || {};
              if (condition === 'sequencing') {
                existing.completion_time_sequencing_ms = completionTime;
                existing.errors_sequencing             = totalErrors;
              } else {
                existing.completion_time_set_shifting_ms = completionTime;
                existing.errors_set_shifting             = totalErrors;
                if (existing.completion_time_sequencing_ms != null) {
                  existing.set_shifting_cost_ms = completionTime - existing.completion_time_sequencing_ms;
                  existing.set_shifting_ratio   = +(completionTime / existing.completion_time_sequencing_ms).toFixed(4);
                }
              }
              window.BatteryData.setTaskSummary('visual_sequencing_set_shifting', existing);

              setTimeout(function() { done(); }, 350);
            }

          } else {
            totalErrors++;
            if (showFeedback) {
              el.classList.add('error');
              errorMsg.textContent = 'Wrong target - continue from "' + sequence[nextIdx] + '"';
              setTimeout(function() {
                el.classList.remove('error');
                errorMsg.textContent = '';
              }, VS_ERROR_MS);
            } else {
              el.classList.add('error');
              setTimeout(function() { el.classList.remove('error'); }, 300);
            }
          }
        });

        canvas.appendChild(el);
      });
    }
  };
}

/* ── Instruction screens ──────────────────────────────────── */
function vsFullInstructions() {
  return {
    type: jsPsychInstructions,
    pages: [
      '<div style="max-width:700px;margin:0 auto;text-align:left">'
      + '<h2 style="color:#a8d8ea">Visual Sequencing and Set-Shifting Task</h2>'
      + '<p>This task has two parts.</p>'
      + '<p><strong>Part A - Sequencing</strong><br>'
      + 'Circles labelled 1 to 25 will appear scattered on the screen. '
      + 'Click them in <em>ascending numerical order</em>: 1 &rarr; 2 &rarr; 3 &hellip; &rarr; 25. '
      + 'Work as quickly and accurately as possible.</p>'
      + '<p><strong>Part B - Set-Shifting</strong><br>'
      + 'Circles containing <em>both numbers and letters</em> will appear. '
      + 'Click them in <em>alternating</em> order: '
      + '<strong>1 &rarr; A &rarr; 2 &rarr; B &rarr; 3 &rarr; C &hellip; &rarr; 13 &rarr; M</strong>.</p>'
      + '<p>If you click the wrong target, a brief message will appear. '
      + '<strong>Do not stop</strong> - keep going from the last correct target.</p>'
      + '<p>We will start with a short practice for each part. Press <strong>Next</strong> to begin.</p>'
      + '</div>'
    ],
    show_clickable_nav: true,
    button_label_next: 'Next &rarr;',
    data: { task_name: 'visual_sequencing_set_shifting', phase: 'instructions' }
  };
}

function vsReadyScreen(condition, isPractice) {
  var label = condition === 'sequencing' ? 'Sequencing' : 'Set-Shifting';
  var kind  = isPractice ? 'Practice' : 'Main Trial';
  var desc  = condition === 'sequencing'
    ? (isPractice
        ? 'Click circles <strong>1 &rarr; 2 &rarr; &hellip; &rarr; 8</strong> in order.'
        : 'Click circles <strong>1 &rarr; 2 &rarr; &hellip; &rarr; 25</strong> in order.')
    : (isPractice
        ? 'Click in order: <strong>1 &rarr; A &rarr; 2 &rarr; B &rarr; 3 &rarr; C &rarr; 4 &rarr; D</strong>.'
        : 'Click in order: <strong>1 &rarr; A &rarr; 2 &rarr; B &rarr; &hellip; &rarr; 13 &rarr; M</strong>.');
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:600px;margin:0 auto;text-align:center">'
            + '<h3 style="color:#a8d8ea">' + kind + ' - ' + label + '</h3>'
            + '<p>' + desc + '</p>'
            + (isPractice
                ? '<p style="color:#66bb6a">Feedback will be shown during practice.</p>'
                : '<p style="color:#8899aa">No feedback during the main trial. Keep going if you make an error.</p>')
            + '<p style="color:#8899aa;font-size:0.85rem">Click <strong>Start</strong> when ready.</p>'
            + '</div>',
    choices: ['Start'],
    data: { task_name: 'visual_sequencing_set_shifting', phase: isPractice ? 'practice_ready' : 'main_ready', condition: condition }
  };
}

/* ── Build complete VS timeline ───────────────────────────── */
function buildVisualSequencingTimeline(randomizeOrder) {
  randomizeOrder = randomizeOrder || false;
  var conditions = randomizeOrder
    ? shuffle(['sequencing', 'set_shifting'])
    : ['sequencing', 'set_shifting'];

  var practiceSeqSeq   = vsSeqNumbers(8);
  var practiceShiftSeq = vsSeqSetShifting().slice(0, 8);
  var mainSeqSeq       = vsSeqNumbers(25);
  var mainShiftSeq     = vsSeqSetShifting();

  var timeline = [vsFullInstructions()];

  conditions.forEach(function(cond) {
    if (cond === 'sequencing') {
      timeline.push(
        vsReadyScreen('sequencing', true),
        buildVSTrial({ condition: 'sequencing', trial_type: 'practice', sequence: practiceSeqSeq,   showFeedback: true  }),
        vsReadyScreen('sequencing', false),
        buildVSTrial({ condition: 'sequencing', trial_type: 'main',     sequence: mainSeqSeq,       showFeedback: false })
      );
    } else {
      timeline.push(
        vsReadyScreen('set_shifting', true),
        buildVSTrial({ condition: 'set_shifting', trial_type: 'practice', sequence: practiceShiftSeq, showFeedback: true  }),
        vsReadyScreen('set_shifting', false),
        buildVSTrial({ condition: 'set_shifting', trial_type: 'main',     sequence: mainShiftSeq,     showFeedback: false })
      );
    }
  });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: '<div style="max-width:600px;margin:0 auto;text-align:center">'
            + '<h3 style="color:#a8d8ea">Visual Sequencing Task Complete</h3>'
            + '<p style="color:#8899aa">You may download the data for this task now, or wait until the end of the full battery.</p>'
            + '</div>',
    choices: ['Download Task CSV', 'Continue Battery'],
    data: { task_name: 'visual_sequencing_set_shifting', phase: 'end' },
    on_finish: function(data) {
      if (data.response === 0) exportTaskCSV('visual_sequencing_set_shifting');
    }
  });

  return timeline;
}
