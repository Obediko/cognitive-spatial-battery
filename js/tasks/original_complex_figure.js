/* ============================================================
   original_complex_figure.js
   Original Complex Figure (OCF-17) - experimental pilot
   Original geometry; not the Benson Complex Figure.
   ============================================================ */
'use strict';

(function() {
  var OCF_VERSION = '0.2.0-pilot';
  var OCF_STIMULUS_VERSION = 'ocf17-0.1';
  var COPY_LIMIT_MS = 4 * 60 * 1000;
  var DELAY_MIN_MS = window.PILOT_MODE ? 10000 : 10 * 60 * 1000;
  var DELAY_TARGET_MS = window.PILOT_MODE ? 20000 : 12 * 60 * 1000;
  var DELAY_MAX_MS = window.PILOT_MODE ? 30000 : 15 * 60 * 1000;
  window.OCFDelayPolicy = {
    minMs: DELAY_MIN_MS,
    targetMs: DELAY_TARGET_MS,
    maxMs: DELAY_MAX_MS
  };
  var OCF_IS_GERMAN = window.BatteryLanguage && window.BatteryLanguage.get() === 'de';

  window.OCFState = {
    copyCompletedAt: null,
    copyStrokes: [],
    delayedStrokes: [],
    copyIncomplete: false,
    delayedIncomplete: false
  };

  var elements = [
    ['frame','Six-sided outer frame','Recognisable closed six-sided polygon','Large upright frame centred on the page'],
    ['diagonals','Crossing diagonals','Two lines intersect within the frame','Lines connect opposite frame regions and cross near centre'],
    ['circle','Upper-left circle','Recognisably round closed shape','Inside the upper-left sector without touching frame'],
    ['diamond','Lower-right diamond','Four-sided diamond-like shape','Inside the lower-right sector without touching frame'],
    ['left_arc','Left external arc','Single smooth outward arc','Attached to or very near the middle-left frame edge'],
    ['top_flag','Top pennant','Vertical staff plus triangular pennant','Outside and above the upper frame region'],
    ['bottom_step','Lower step','Three-segment step or notch','Outside and below the lower-central frame region'],
    ['right_fork','Right fork','Stem ending in three rays','Outside and attached to the middle-right frame edge']
  ];
  var elementsDe = [
    ['frame','Sechseckiger Außenrahmen','Erkennbares geschlossenes sechseckiges Polygon','Großer aufrechter Rahmen, mittig auf der Seite'],
    ['diagonals','Sich kreuzende Diagonalen','Zwei Linien schneiden sich innerhalb des Rahmens','Linien verbinden gegenüberliegende Rahmenbereiche und kreuzen sich nahe der Mitte'],
    ['circle','Kreis oben links','Erkennbar runde geschlossene Form','Im oberen linken Bereich, ohne den Rahmen zu berühren'],
    ['diamond','Raute unten rechts','Vierseitige rautenähnliche Form','Im unteren rechten Bereich, ohne den Rahmen zu berühren'],
    ['left_arc','Äußerer Bogen links','Ein einzelner glatter, nach außen gerichteter Bogen','An oder sehr nahe an der mittleren linken Rahmenkante'],
    ['top_flag','Fähnchen oben','Senkrechter Stab mit dreieckigem Fähnchen','Außerhalb und oberhalb des oberen Rahmenbereichs'],
    ['bottom_step','Stufe unten','Dreiteilige Stufe oder Einkerbung','Außerhalb und unterhalb des unteren mittleren Rahmenbereichs'],
    ['right_fork','Gabel rechts','Stiel, der in drei Strahlen endet','Außerhalb und an der mittleren rechten Rahmenkante befestigt']
  ];

  function figureParts(variant) {
    var circle = variant === 1 ? '<path d="M320 210l24 24-24 24-24-24z"/>' : '<circle cx="180" cy="125" r="24"/>';
    var diamond = variant === 1 ? '<circle cx="180" cy="125" r="24"/>' : '<path d="M320 210l24 24-24 24-24-24z"/>';
    var left = variant === 2 ? '<path d="M70 180q-58-52 0-100"/>' : '<path d="M70 180q-58 52 0 100"/>';
    var flag = variant === 3 ? '<path d="M270 70V24l-34 18 34 18"/>' : '<path d="M230 70V24l34 18-34 18"/>';
    var diagonals = variant === 2 ? '<path d="M130 70l230 110M130 290l230-110"/>' : '<path d="M130 70l230 220M360 70L130 290"/>';
    return '<path d="M130 70h230l60 110-60 110H130L70 180z"/>'
      + diagonals + circle + diamond + left + flag
      + '<path d="M205 290v34h50v-34"/>'
      + '<path d="M420 180h38M458 180l28-24M458 180l32 0M458 180l28 24"/>';
  }

  function figureSvg(variant, className) {
    return '<svg class="' + (className || 'ocf-model') + '" viewBox="0 0 520 360" role="img" aria-label="Original abstract complex figure">'
      + '<g class="ocf-figure-line">' + figureParts(variant || 0) + '</g></svg>';
  }

  function scoreElements(rows, bonus, incomplete) {
    rows = Array.isArray(rows) ? rows : [];
    var elementPoints = rows.reduce(function(total, row) {
      return total + (row.accuracy ? 1 : 0) + (row.placement ? 1 : 0);
    }, 0);
    var bonusAllowed = rows.length === 8 && rows.every(function(row) {
      return row.accuracy && row.placement;
    });
    var bonusPoint = bonus && bonusAllowed ? 1 : 0;
    return {
      elementPoints: elementPoints,
      bonus: bonusPoint,
      rawTotal: elementPoints + bonusPoint,
      total: incomplete ? null : elementPoints + bonusPoint,
      status: incomplete ? 'incomplete' : 'examiner_verified'
    };
  }

  function suggestElements(strokes) {
    strokes = (Array.isArray(strokes) ? strokes : []).filter(function(stroke) {
      return Array.isArray(stroke) && stroke.length >= 2;
    });
    var metrics = strokes.map(function(stroke) {
      var xs = stroke.map(function(point) { return point.x; });
      var ys = stroke.map(function(point) { return point.y; });
      var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
      var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
      var width = maxX - minX, height = maxY - minY;
      var first = stroke[0], last = stroke[stroke.length - 1];
      var closeDistance = Math.hypot(last.x - first.x, last.y - first.y);
      var length = 0;
      for (var i = 1; i < stroke.length; i += 1) {
        length += Math.hypot(stroke[i].x - stroke[i - 1].x, stroke[i].y - stroke[i - 1].y);
      }
      return {
        minX: minX, maxX: maxX, minY: minY, maxY: maxY,
        width: width, height: height, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
        closed: closeDistance < Math.max(0.05, Math.min(width, height) * 0.45),
        length: length
      };
    });
    function any(predicate) { return metrics.some(predicate); }
    function count(predicate) { return metrics.filter(predicate).length; }
    var frame = any(function(m) { return m.width > 0.45 && m.height > 0.40 && m.length > 1.1; });
    var centralLong = count(function(m) {
      return m.width > 0.30 && m.height > 0.28 && m.cx > 0.28 && m.cx < 0.72 && m.cy > 0.28 && m.cy < 0.72;
    });
    var circle = any(function(m) {
      var ratio = m.height ? m.width / m.height : 0;
      return m.closed && ratio > 0.55 && ratio < 1.55 && m.width < 0.28 && m.cx < 0.50 && m.cy < 0.52;
    });
    var diamond = any(function(m) {
      var ratio = m.height ? m.width / m.height : 0;
      return m.closed && ratio > 0.45 && ratio < 1.8 && m.width < 0.30 && m.cx > 0.50 && m.cy > 0.45;
    });
    var suggestions = {
      frame: { accuracy: frame, placement: frame && any(function(m) { return m.cx > 0.35 && m.cx < 0.65; }) },
      diagonals: { accuracy: centralLong >= 2, placement: centralLong >= 2 },
      circle: { accuracy: circle, placement: circle },
      diamond: { accuracy: diamond, placement: diamond },
      left_arc: {
        accuracy: any(function(m) { return m.cx < 0.30 && m.height > 0.12; }),
        placement: any(function(m) { return m.cx < 0.30 && m.cy > 0.30 && m.cy < 0.75; })
      },
      top_flag: {
        accuracy: any(function(m) { return m.cy < 0.30 && m.height > 0.08; }),
        placement: any(function(m) { return m.cy < 0.30 && m.cx > 0.28 && m.cx < 0.62; })
      },
      bottom_step: {
        accuracy: any(function(m) { return m.cy > 0.68 && m.width > 0.08; }),
        placement: any(function(m) { return m.cy > 0.68 && m.cx > 0.30 && m.cx < 0.65; })
      },
      right_fork: {
        accuracy: count(function(m) { return m.cx > 0.70 && m.width > 0.05; }) >= 2,
        placement: any(function(m) { return m.cx > 0.72 && m.cy > 0.30 && m.cy < 0.70; })
      }
    };
    return elements.map(function(element) {
      var value = suggestions[element[0]] || { accuracy: false, placement: false };
      return { element_id: element[0], accuracy: value.accuracy, placement: value.placement };
    });
  }

  window.OCFScoring = {
    scoreElements: scoreElements,
    suggestElements: suggestElements,
    elementCount: elements.length,
    maximum: 17
  };

  function displayElement() {
    return document.getElementById('jspsych-content') ||
      document.querySelector('.jspsych-content') ||
      document.getElementById('jspsych-target');
  }

  function drawingTrial(phase, showModel) {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = displayElement();
        var strokes = [];
        var current = null;
        var startedAt = Date.now();
        var finished = false;
        var timer = null;
        var raf = null;
        var gpCursor = { x: 320, y: 240, drawing: false, last: 0 };

        display.innerHTML = '<div class="ocf-shell"><div class="ocf-heading"><div><span class="osr-kicker">' + (OCF_IS_GERMAN ? 'Komplexe Figur' : 'Original Complex Figure') + '</span>'
          + '<h2>' + (OCF_IS_GERMAN ? (showModel ? 'Kopieren Sie die Figur' : 'Zeichnen Sie die Figur aus dem Gedächtnis') : (showModel ? 'Copy the design' : 'Draw the design from memory')) + '</h2></div>'
          + '<div class="ocf-timer"><strong id="ocf-time">4:00</strong><span>' + (OCF_IS_GERMAN ? 'verbleibend' : 'remaining') + '</span></div></div>'
          + '<p>' + (OCF_IS_GERMAN
            ? (showModel ? 'Kopieren Sie die Figur so genau wie möglich.' : 'Zeichnen Sie so viel wie möglich von der früheren Figur. Die Vorlage wird nicht gezeigt.')
            : (showModel ? 'Copy the design as accurately as possible. You may draw with touch, stylus, mouse or a connected gamepad.' : 'Draw as much of the earlier design as you can remember. The original is not shown.')) + '</p>'
          + '<div class="ocf-workspace">' + (showModel ? '<div class="ocf-model-card">' + figureSvg(0, 'ocf-model') + '</div>' : '')
          + '<div class="ocf-canvas-wrap"><canvas id="ocf-canvas" width="640" height="480" aria-label="' + (OCF_IS_GERMAN ? 'Zeichenfläche' : 'Drawing area') + '"></canvas>'
          + '<div id="ocf-gamepad-cursor" class="ocf-gamepad-cursor" hidden></div></div></div>'
          + '<div class="ocf-toolbar"><button class="battery-btn" id="ocf-undo">' + (OCF_IS_GERMAN ? 'Letzten Strich rückgängig' : 'Undo stroke') + '</button>'
          + '<button class="battery-btn" id="ocf-clear">' + (OCF_IS_GERMAN ? 'Neu beginnen' : 'Start over') + '</button>'
          + '<button class="battery-btn primary" id="ocf-finish">' + (OCF_IS_GERMAN ? 'Zeichnung beenden' : 'Finish drawing') + '</button>'
          + '<button class="battery-btn ocf-incomplete" id="ocf-incomplete">' + (OCF_IS_GERMAN ? 'Nicht durchführbar' : 'Cannot complete') + '</button></div>'
          + '<p class="osr-fineprint">' + (OCF_IS_GERMAN ? 'Gamepad: Mit dem linken Stick oder Steuerkreuz bewegen. Zum Zeichnen die Haupttaste gedrückt halten.' : 'Gamepad: move with left stick or D-pad; hold the primary button to draw.') + '</p></div>';

        var canvas = document.getElementById('ocf-canvas');
        var ctx = canvas.getContext('2d');
        var cursorEl = document.getElementById('ocf-gamepad-cursor');
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a';

        function pointFromEvent(event) {
          var rect = canvas.getBoundingClientRect();
          return {
            x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
          };
        }

        function redraw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          strokes.forEach(function(stroke) {
            if (!stroke.length) return;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x * canvas.width, stroke[0].y * canvas.height);
            stroke.slice(1).forEach(function(p) {
              ctx.lineTo(p.x * canvas.width, p.y * canvas.height);
            });
            ctx.stroke();
          });
        }

        var activePointerId = null;

        function beginPointer(event) {
          if (finished || activePointerId !== null) return;
          event.preventDefault();
          activePointerId = event.pointerId;
          current = [pointFromEvent(event)];
          strokes.push(current);
          try { canvas.setPointerCapture(event.pointerId); } catch (captureError) { /* capture is optional */ }
          redraw();
        }

        function movePointer(event) {
          if (finished || current === null || event.pointerId !== activePointerId) return;
          if (event.pointerType === 'mouse' && event.buttons === 0) {
            endPointer(event);
            return;
          }
          event.preventDefault();
          var samples = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
          samples.forEach(function(sample) {
            current.push(pointFromEvent(sample));
          });
          redraw();
        }

        function endPointer(event) {
          if (activePointerId === null || (event && event.pointerId !== activePointerId)) return;
          if (event) event.preventDefault();
          try {
            if (canvas.hasPointerCapture && canvas.hasPointerCapture(activePointerId)) {
              canvas.releasePointerCapture(activePointerId);
            }
          } catch (captureError) { /* already released */ }
          current = null;
          activePointerId = null;
          redraw();
        }

        canvas.addEventListener('pointerdown', beginPointer);
        canvas.addEventListener('pointermove', movePointer);
        canvas.addEventListener('pointerup', endPointer);
        canvas.addEventListener('pointercancel', endPointer);
        canvas.addEventListener('lostpointercapture', function(event) {
          if (event.pointerId === activePointerId) {
            current = null;
            activePointerId = null;
            redraw();
          }
        });
        window.addEventListener('pointerup', endPointer);

        function gamepadLoop(timestamp) {
          var pads = navigator.getGamepads ? navigator.getGamepads() : [];
          var pad = Array.prototype.find.call(pads, function(p) { return p; });
          if (pad) {
            cursorEl.hidden = false;
            var dt = gpCursor.last ? Math.min(32, timestamp - gpCursor.last) : 16;
            gpCursor.last = timestamp;
            var ax = Math.abs(pad.axes[0] || 0) > 0.15 ? pad.axes[0] : 0;
            var ay = Math.abs(pad.axes[1] || 0) > 0.15 ? pad.axes[1] : 0;
            var dx = ((pad.buttons[15] && pad.buttons[15].pressed) ? 1 : 0) - ((pad.buttons[14] && pad.buttons[14].pressed) ? 1 : 0);
            var dy = ((pad.buttons[13] && pad.buttons[13].pressed) ? 1 : 0) - ((pad.buttons[12] && pad.buttons[12].pressed) ? 1 : 0);
            gpCursor.x = Math.max(0, Math.min(canvas.width, gpCursor.x + (ax + dx) * dt * 0.35));
            gpCursor.y = Math.max(0, Math.min(canvas.height, gpCursor.y + (ay + dy) * dt * 0.35));
            var rect = canvas.getBoundingClientRect();
            cursorEl.style.left = (gpCursor.x / canvas.width * rect.width) + 'px';
            cursorEl.style.top = (gpCursor.y / canvas.height * rect.height) + 'px';
            var pressed = !!(pad.buttons[0] && pad.buttons[0].pressed);
            if (pressed && !gpCursor.drawing) {
              current = [{ x: gpCursor.x / canvas.width, y: gpCursor.y / canvas.height }];
              strokes.push(current);
            } else if (pressed && current) {
              current.push({ x: gpCursor.x / canvas.width, y: gpCursor.y / canvas.height });
              redraw();
            } else if (!pressed && gpCursor.drawing) {
              current = null;
            }
            gpCursor.drawing = pressed;
          } else {
            cursorEl.hidden = true;
          }
          raf = requestAnimationFrame(gamepadLoop);
        }
        raf = requestAnimationFrame(gamepadLoop);

        function finish(incomplete) {
          if (finished) return;
          finished = true;
          clearInterval(timer);
          cancelAnimationFrame(raf);
          window.removeEventListener('pointerup', endPointer);
          var duration = Date.now() - startedAt;
          strokes = strokes.map(function(stroke) {
            return window.BatteryReliability.decimateStroke(stroke, 0.0025, 1200);
          });
          if (phase === 'copy') {
            window.OCFState.copyStrokes = strokes;
            window.OCFState.copyCompletedAt = Date.now();
            window.OCFState.copyIncomplete = !!incomplete;
          } else {
            window.OCFState.delayedStrokes = strokes;
            window.OCFState.delayedIncomplete = !!incomplete;
          }
          window.BatteryData.addTrials({
            task_name: 'original_complex_figure',
            task_version: OCF_VERSION,
            stimulus_version: OCF_STIMULUS_VERSION,
            phase: phase + '_drawing',
            stroke_data: JSON.stringify(strokes),
            stroke_count: strokes.length,
            drawing_duration_ms: duration,
            drawing_started_at: new Date(startedAt).toISOString(),
            drawing_completed_at: new Date().toISOString(),
            input_pointer_supported: typeof PointerEvent !== 'undefined',
            input_gamepad_seen: !cursorEl.hidden,
            incomplete: !!incomplete
          });
          done();
        }

        document.getElementById('ocf-undo').onclick = function() {
          strokes.pop();
          redraw();
        };
        document.getElementById('ocf-clear').onclick = function() {
          if (window.confirm(OCF_IS_GERMAN ? 'Die gesamte Zeichnung löschen und neu beginnen?' : 'Clear the entire drawing and start again?')) {
            strokes = [];
            current = null;
            activePointerId = null;
            redraw();
          }
        };
        document.getElementById('ocf-finish').onclick = function() { finish(false); };
        document.getElementById('ocf-incomplete').onclick = function() {
          if (window.confirm(OCF_IS_GERMAN ? 'Diesen Abschnitt beenden und als unvollständig markieren?' : 'End this phase and mark it incomplete?')) finish(true);
        };

        var timeEl = document.getElementById('ocf-time');
        timer = setInterval(function() {
          var remaining = Math.max(0, COPY_LIMIT_MS - (Date.now() - startedAt));
          var seconds = Math.ceil(remaining / 1000);
          timeEl.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
          if (remaining <= 0) finish(false);
        }, 250);
      }
    };
  }

  function replaySvg(strokes) {
    var paths = (strokes || []).map(function(stroke) {
      if (!stroke.length) return '';
      return '<path d="M' + stroke.map(function(p, i) {
        return (i ? 'L' : '') + Math.round(p.x * 640) + ' ' + Math.round(p.y * 480);
      }).join(' ') + '"/>';
    }).join('');
    return '<svg class="ocf-replay" viewBox="0 0 640 480"><g>' + paths + '</g></svg>';
  }

  function scoringTrial(phase) {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = displayElement();
        var strokes = phase === 'copy' ? window.OCFState.copyStrokes : window.OCFState.delayedStrokes;
        var incomplete = phase === 'copy' ? window.OCFState.copyIncomplete : window.OCFState.delayedIncomplete;
        var priorScore = window.BatteryData.trials.slice().reverse().find(function(row) {
          return row.task_name === 'original_complex_figure' && row.phase === phase + '_scoring';
        }) || null;
        var priorElements = [];
        if (priorScore && priorScore.element_scores) {
          try { priorElements = JSON.parse(priorScore.element_scores); } catch (error) { priorElements = []; }
        }
        var scoringElements = OCF_IS_GERMAN ? elementsDe : elements;
        var rows = scoringElements.map(function(e, i) {
          var previous = priorElements.find(function(item) { return item.element_id === e[0]; }) || {};
          return '<div class="ocf-score-row" data-index="' + i + '"><div><strong>' + (i + 1) + '. ' + e[1] + '</strong>'
            + '<small>A: ' + e[2] + '<br>P: ' + e[3] + '</small></div>'
            + '<label><input type="checkbox" class="ocf-accuracy"' + (previous.accuracy ? ' checked' : '') + '> ' + (OCF_IS_GERMAN ? 'Genauigkeit' : 'Accuracy') + '</label>'
            + '<label><input type="checkbox" class="ocf-placement"' + (previous.placement ? ' checked' : '') + '> ' + (OCF_IS_GERMAN ? 'Position' : 'Placement') + '</label></div>';
        }).join('');
        display.innerHTML = '<div class="ocf-score-shell"><div><span class="osr-kicker">' + (OCF_IS_GERMAN ? 'Nur für die Prüfperson' : 'Examiner only') + '</span>'
          + '<h2>' + (OCF_IS_GERMAN ? (phase === 'copy' ? 'Kopie auswerten' : 'Verzögerte Wiedergabe auswerten') : (phase === 'copy' ? 'Copy scoring' : 'Delayed recall scoring')) + '</h2></div>'
          + '<div class="ocf-score-layout"><div class="ocf-replay-card">' + replaySvg(strokes) + '</div>'
          + '<div class="ocf-score-panel">' + rows
          + '<button class="battery-btn" id="ocf-suggest-score">' + (OCF_IS_GERMAN ? 'Vorläufige Computer-Vorschläge erzeugen' : 'Generate provisional computer suggestions') + '</button>'
          + '<p class="osr-fineprint">' + (OCF_IS_GERMAN ? 'Nur experimentelle Hilfe. Die Prüfperson muss jedes Kästchen prüfen und bestätigen; dies ist kein validierter automatischer Score.' : 'Experimental aid only. The examiner must inspect and confirm every box; this is not a validated automatic score.') + '</p>'
          + '<label class="ocf-bonus"><input type="checkbox" id="ocf-bonus"' + (priorScore && priorScore.bonus ? ' checked' : '') + '> ' + (OCF_IS_GERMAN ? 'Globaler Bonus: alle Elemente genau, richtig positioniert und proportional' : 'Global bonus: all elements accurate, correctly placed and proportionate') + '</label>'
          + '<div class="ocf-live-score">' + (OCF_IS_GERMAN ? 'Aktueller Score ' : 'Current score ') + '<strong id="ocf-total">0</strong> / 17</div>'
          + '<button class="battery-btn primary" id="ocf-save-score">' + (OCF_IS_GERMAN ? 'Score speichern' : 'Save score') + '</button></div></div></div>';

        function collect() {
          return Array.prototype.map.call(document.querySelectorAll('.ocf-score-row'), function(row, i) {
            return {
              element_id: elements[i][0],
              accuracy: row.querySelector('.ocf-accuracy').checked,
              placement: row.querySelector('.ocf-placement').checked
            };
          });
        }
        function update() {
          var score = scoreElements(collect(), document.getElementById('ocf-bonus').checked, incomplete);
          document.getElementById('ocf-total').textContent = score.rawTotal;
        }
        Array.prototype.forEach.call(document.querySelectorAll('input'), function(input) {
          input.addEventListener('change', update);
        });
        update();
        var suggestionUsed = false;
        var suggestionRows = null;
        document.getElementById('ocf-suggest-score').onclick = function() {
          suggestionRows = suggestElements(strokes);
          suggestionRows.forEach(function(suggestion, i) {
            var row = document.querySelectorAll('.ocf-score-row')[i];
            row.querySelector('.ocf-accuracy').checked = suggestion.accuracy;
            row.querySelector('.ocf-placement').checked = suggestion.placement;
          });
          suggestionUsed = true;
          update();
        };
        document.getElementById('ocf-save-score').onclick = function() {
          var rowsData = collect();
          var score = scoreElements(rowsData, document.getElementById('ocf-bonus').checked, incomplete);
          window.BatteryData.trials = window.BatteryData.trials.filter(function(row) {
            return !(row.task_name === 'original_complex_figure' && row.phase === phase + '_scoring');
          });
          window.BatteryData.addTrials({
            task_name: 'original_complex_figure',
            task_version: OCF_VERSION,
            stimulus_version: OCF_STIMULUS_VERSION,
            phase: phase + '_scoring',
            element_scores: JSON.stringify(rowsData),
            element_points: score.elementPoints,
            bonus: score.bonus,
            total_score: score.total,
            total_score_raw: score.rawTotal,
            review_status: score.status,
            automated_suggestion_used: suggestionUsed,
            automated_suggestion: suggestionRows ? JSON.stringify(suggestionRows) : null,
            automated_suggestion_version: suggestionUsed ? 'ocf-rule-aid-0.1-unvalidated' : null
          });
          var key = phase === 'copy' ? 'ocf_copy' : 'ocf_delayed';
          var previous = window.BatteryData.taskSummaries.original_complex_figure || {};
          previous[key + '_score'] = score.total;
          previous[key + '_score_raw'] = score.rawTotal;
          previous[key + '_status'] = score.status;
          previous.ocf_task_version = OCF_VERSION;
          previous.ocf_stimulus_version = OCF_STIMULUS_VERSION;
          if (phase === 'delayed') {
            var delayedDrawing = window.BatteryData.trials.slice().reverse().find(function(row) {
              return row.task_name === 'original_complex_figure' && row.phase === 'delayed_drawing';
            });
            var delayedStartedAt = delayedDrawing && delayedDrawing.drawing_started_at
              ? Date.parse(delayedDrawing.drawing_started_at)
              : delayedDrawing && delayedDrawing.timestamp
                ? Date.parse(delayedDrawing.timestamp) - (delayedDrawing.drawing_duration_ms || 0) : null;
            previous.ocf_delay_duration_ms = window.OCFState.copyCompletedAt && delayedStartedAt
              ? delayedStartedAt - window.OCFState.copyCompletedAt
              : previous.ocf_delay_duration_ms ?? null;
          }
          window.BatteryData.setTaskSummary('original_complex_figure', previous);
          done();
        };
      }
    };
  }

  function memoryWarningTrial() {
    return {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<div class="osr-card">' + figureSvg(0, 'ocf-model ocf-memory-model')
        + '<h2>' + (OCF_IS_GERMAN ? 'Merken Sie sich diese Figur' : 'Remember this design') + '</h2><p>'
        + (OCF_IS_GERMAN ? 'Sie werden sie später aus dem Gedächtnis zeichnen.' : 'You will draw it again from memory later.') + '</p></div>',
      choices: 'NO_KEYS',
      trial_duration: 5000,
      data: { task_name: 'original_complex_figure', phase: 'memory_warning', task_version: OCF_VERSION }
    };
  }

  function delayGateTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = displayElement();
        var timer = null;
        if (!window.OCFState.copyCompletedAt) {
          display.innerHTML = '<div class="osr-card"><span class="osr-kicker">' + (OCF_IS_GERMAN ? 'Verzögerte Figurenwiedergabe' : 'Delayed figure recall') + '</span>'
            + '<h2>' + (OCF_IS_GERMAN ? 'Zeitpunkt der Kopie nicht verfügbar' : 'Copy timestamp unavailable') + '</h2>'
            + '<p class="osr-error">' + (OCF_IS_GERMAN ? 'Das Erinnerungsintervall kann nicht überprüft werden. Die verzögerte Wiedergabe darf nicht als protokollgültig gewertet werden.' : 'The retention interval cannot be verified. Delayed recall must not be scored as protocol-valid.') + '</p>'
            + '<button class="battery-btn primary" id="ocf-delay-unavailable">' + (OCF_IS_GERMAN ? 'Fortfahren und als nicht verfügbar markieren' : 'Continue and mark unavailable') + '</button></div>';
          document.getElementById('ocf-delay-unavailable').onclick = function() {
            window.BatteryData.addTrials({
              task_name: 'original_complex_figure',
              task_version: OCF_VERSION,
              phase: 'delay_gate',
              delay_duration_ms: null,
              delay_out_of_window: true,
              delay_failure_reason: 'copy_timestamp_missing'
            });
            window.OCFState.delayedIncomplete = true;
            done();
          };
          return;
        }

        function render() {
          var elapsed = Date.now() - window.OCFState.copyCompletedAt;
          var ready = elapsed >= DELAY_MIN_MS;
          var late = elapsed > DELAY_MAX_MS;
          var remaining = Math.max(0, DELAY_MIN_MS - elapsed);
          display.innerHTML = '<div class="osr-card"><span class="osr-kicker">' + (OCF_IS_GERMAN ? 'Verzögerte Figurenwiedergabe' : 'Delayed figure recall') + '</span>'
            + '<h2>' + (ready ? (OCF_IS_GERMAN ? 'Bereit für die verzögerte Zeichnung' : 'Ready for delayed drawing') : (OCF_IS_GERMAN ? 'Erinnerungsintervall läuft' : 'Retention interval in progress')) + '</h2>'
            + '<p>' + (OCF_IS_GERMAN ? 'Vergangene Zeit: <strong>' : 'Elapsed time: <strong>') + (elapsed / 60000).toFixed(1) + (OCF_IS_GERMAN ? ' Minuten</strong></p>' : ' minutes</strong></p>')
            + (!ready ? '<p>' + (OCF_IS_GERMAN ? 'Zwischen Kopie und verzögerter Wiedergabe müssen mindestens 10 Minuten liegen. Verbleibende Zeit: <strong>' : 'This task requires at least 10 minutes between copy and delayed recall. Time remaining: <strong>')
              + Math.ceil(remaining / 1000) + (OCF_IS_GERMAN ? ' Sekunden</strong>.</p>' : ' seconds</strong>.</p>') : '')
            + (late ? '<p class="osr-error">' + (OCF_IS_GERMAN ? 'Das vorgesehene Zeitfenster von 10 bis 15 Minuten wurde überschritten. Die Abweichung wird dokumentiert.' : 'The planned 10–15 minute window has been exceeded; the deviation will be recorded.') + '</p>' : '')
            + '<button class="battery-btn primary" id="ocf-delay-ready" ' + (ready ? '' : 'disabled') + '>' + (OCF_IS_GERMAN ? 'Verzögerte Wiedergabe beginnen' : 'Begin delayed recall') + '</button></div>';
          var button = document.getElementById('ocf-delay-ready');
          button.onclick = function() {
            clearInterval(timer);
            window.BatteryData.addTrials({
              task_name: 'original_complex_figure',
              task_version: OCF_VERSION,
              phase: 'delay_gate',
              delay_duration_ms: elapsed,
              delay_out_of_window: late
            });
            done();
          };
        }
        render();
        timer = setInterval(render, 1000);
      }
    };
  }

  function recognitionTrial() {
    var order = [2,0,3,1];
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = displayElement();
        display.innerHTML = '<div class="ocf-recognition"><span class="osr-kicker">' + (OCF_IS_GERMAN ? 'Wiedererkennen' : 'Recognition') + '</span>'
          + '<h2>' + (OCF_IS_GERMAN ? 'Welche Figur haben Sie zuvor kopiert?' : 'Which design did you copy earlier?') + '</h2><div class="ocf-foil-grid">'
          + order.map(function(variant, i) {
            return '<button class="ocf-foil" data-variant="' + variant + '" aria-label="Recognition option ' + (i + 1) + '">'
              + figureSvg(variant, 'ocf-foil-svg') + '<span>' + (OCF_IS_GERMAN ? 'Auswahl ' : 'Option ') + (i + 1) + '</span></button>';
          }).join('') + '</div></div>';
        Array.prototype.forEach.call(document.querySelectorAll('.ocf-foil'), function(button) {
          button.onclick = function() {
            var chosen = Number(button.getAttribute('data-variant'));
            var correct = chosen === 0;
            window.BatteryData.addTrials({
              task_name: 'original_complex_figure',
              task_version: OCF_VERSION,
              phase: 'recognition',
              recognition_variant_selected: chosen,
              recognition_correct: correct
            });
            var summary = window.BatteryData.taskSummaries.original_complex_figure || {};
            summary.ocf_recognition_correct = correct;
            window.BatteryData.setTaskSummary('original_complex_figure', summary);
            done();
          };
        });
      }
    };
  }

  function buildOCFImmediateTimeline() {
    return [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: '<div class="osr-card"><span class="osr-kicker">ETI Core · Visuoconstruction</span>'
          + '<h2>' + (OCF_IS_GERMAN ? 'Komplexe Figur' : 'Original Complex Figure') + '</h2><p>'
          + (OCF_IS_GERMAN ? 'Kopieren Sie eine abstrakte Figur in den Zeichenbereich.' : 'Copy an abstract design using the drawing area.') + '</p>'
          + '<p class="osr-fineprint">This is an original experimental figure, not the Benson figure.</p></div>',
        choices: [OCF_IS_GERMAN ? 'Kopieren beginnen' : 'Begin copy'],
        data: { task_name: 'original_complex_figure', phase: 'instructions', task_version: OCF_VERSION }
      },
      drawingTrial('copy', true),
      memoryWarningTrial()
    ];
  }

  function buildOCFDelayedTimeline() {
    return [
      delayGateTrial(),
      drawingTrial('delayed', false),
      recognitionTrial(),
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
          var s = window.BatteryData.taskSummaries.original_complex_figure || {};
          return '<div class="osr-card"><h2>' + (OCF_IS_GERMAN ? 'Antworten zur komplexen Figur wurden gespeichert' : 'Complex Figure responses captured') + '</h2>'
            + '<p>' + (OCF_IS_GERMAN ? 'Die Kopie, die verzögerte Zeichnung und die Wiedererkennungsantwort wurden gespeichert.' : 'The copy, delayed drawing and recognition response have been saved.') + '</p>'
            + '<p class="osr-fineprint">' + (OCF_IS_GERMAN ? 'Die Zeichnungen werden nach Abschluss der Testsitzung ausgewertet.' : 'Drawing scores will be reviewed after participant testing.') + '</p></div>';
        },
        choices: [OCF_IS_GERMAN ? 'Testbatterie fortsetzen' : 'Continue battery'],
        data: { task_name: 'original_complex_figure', phase: 'end', task_version: OCF_VERSION }
      }
    ];
  }

  function buildOCFReviewTimeline() {
    return [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: '<div class="osr-card"><span class="osr-kicker">' + (OCF_IS_GERMAN ? 'Auswertung durch die Prüfperson' : 'Examiner review') + '</span>'
          + '<h2>' + (OCF_IS_GERMAN ? 'Komplexe Figur auswerten' : 'Complex Figure scoring') + '</h2><p>' + (OCF_IS_GERMAN ? 'Bewerten Sie die gespeicherte Kopie und die verzögerte Zeichnung. Die teilnehmende Person wird nicht mehr benötigt.' : 'Score the saved copy and delayed drawing. The participant is no longer required.') + '</p></div>',
        choices: [OCF_IS_GERMAN ? 'Figurenbewertung beginnen' : 'Begin figure review'],
        data: { task_name: 'original_complex_figure', phase: 'review_intro', task_version: OCF_VERSION }
      },
      scoringTrial('copy'),
      scoringTrial('delayed')
    ];
  }

  window.buildOCFImmediateTimeline = buildOCFImmediateTimeline;
  window.buildOCFDelayedTimeline = buildOCFDelayedTimeline;
  window.buildOCFReviewTimeline = buildOCFReviewTimeline;
})();
