/* ============================================================
   object_location_memory.js
   ============================================================
   Object-Location Memory Task
   Baseline measure of spatial associative memory.

   Structure:
     Practice block: 3 objects, feedback on retrieval
     Main blocks 1-3: 8 objects each, no feedback

   Each block:
     Encoding phase  : 8 objects shown at unique locations (25s)
     Delay phase     : blank screen + fixation cross (15s)
     Retrieval phase : object cue shown, participant clicks remembered location

   Stimuli:
     Neutral object images when imagePath is present, otherwise coloured
     placeholder shapes with emoji + text labels.

   Exports (global): buildObjectLocationTimeline()
   ============================================================ */
'use strict';

/* ── Object stimulus definitions ─────────────────────────────
   Each entry: { id, label, emoji, color, imagePath? }
   ─────────────────────────────────────────────────────────── */
const OLM_OBJECTS = [
  { id: 'clock',      label: 'Clock',      emoji: '\u23F0', color: '#5c6bc0', imagePath: 'assets/images/objects/clock.jpg' },
  { id: 'lamp',       label: 'Lamp',       emoji: '\uD83D\uDCA1', color: '#ffa726', imagePath: 'assets/images/objects/lamp.jpg' },
  { id: 'book',       label: 'Book',       emoji: '\uD83D\uDCDA', color: '#66bb6a', imagePath: 'assets/images/objects/book.jpg' },
  { id: 'key',        label: 'Key',        emoji: '\uD83D\uDD11', color: '#ef5350', imagePath: 'assets/images/objects/key.jpg' },
  { id: 'cup',        label: 'Cup',        emoji: '\u2615', color: '#26a69a', imagePath: 'assets/images/objects/cup.jpg' },
  { id: 'chair',      label: 'Chair',      emoji: '\uD83E\uDE91', color: '#ab47bc', imagePath: 'assets/images/objects/chair.jpg' },
  { id: 'apple',      label: 'Apple',      emoji: '\uD83C\uDF4E', color: '#ec407a', imagePath: 'assets/images/objects/apple.jpg' },
  { id: 'pencil',     label: 'Pencil',     emoji: '\u270F', color: '#78909c', imagePath: 'assets/images/objects/pencil.jpg' },
  { id: 'bag',        label: 'Bag',        emoji: '\uD83D\uDC5C', color: '#8d6e63', imagePath: 'assets/images/objects/bag.jpg' },
  { id: 'bottle',     label: 'Bottle',     emoji: '\uD83C\uDF76', color: '#29b6f6', imagePath: 'assets/images/objects/bottle.jpg' },
  { id: 'basket',     label: 'Basket',     emoji: '\uD83E\uDDFA', color: '#d4e157', imagePath: 'assets/images/objects/basket.jpg' },
  { id: 'scissors',   label: 'Scissors',   emoji: '\u2702', color: '#ff7043', imagePath: 'assets/images/objects/scissors.jpg' },
  { id: 'ruler',      label: 'Ruler',      emoji: '\uD83D\uDCCF', color: '#42a5f5', imagePath: 'assets/images/objects/ruler.jpg' },
  { id: 'umbrella',   label: 'Umbrella',   emoji: '\u2602', color: '#26c6da', imagePath: 'assets/images/objects/umbrella.jpg' },
  { id: 'shoe',       label: 'Shoe',       emoji: '\uD83D\uDC5F', color: '#7e57c2', imagePath: 'assets/images/objects/shoe.jpg' },
  { id: 'candle',     label: 'Candle',     emoji: '\uD83D\uDD6F', color: '#ffca28', imagePath: 'assets/images/objects/candle.jpg' },
  { id: 'plate',      label: 'Plate',      emoji: '\uD83C\uDF7D', color: '#9ccc65', imagePath: 'assets/images/objects/plate.jpg' },
  { id: 'box',        label: 'Box',        emoji: '\uD83D\uDCE6', color: '#ffd54f', imagePath: 'assets/images/objects/box.jpg' },
  { id: 'spoon',      label: 'Spoon',      emoji: '\uD83E\uDD44', color: '#80cbc4', imagePath: 'assets/images/objects/spoon.jpg' },
  { id: 'comb',       label: 'Comb',       emoji: '\uD83E\uDEAE', color: '#aed581', imagePath: 'assets/images/objects/comb.jpg' },
  { id: 'toothbrush', label: 'Toothbrush', emoji: '\uD83E\uDE65', color: '#ffe082', imagePath: 'assets/images/objects/toothbrush.jpg' },
  { id: 'stone',      label: 'Stone',      emoji: '\uD83E\uDEA8', color: '#a1887f' },
  { id: 'brush',      label: 'Brush',      emoji: '\uD83E\uDDF9', color: '#4db6ac' },
  { id: 'flower',     label: 'Flower',     emoji: '\uD83C\uDF38', color: '#f48fb1' }
];

/* Block assignments (indices into OLM_OBJECTS, 8 per block) */
const OLM_BLOCK_INDICES = {
  practice: [0, 1, 2],             // 3 objects
  main_1:   [3, 4, 5, 6, 7, 8, 9, 10],
  main_2:   [11, 12, 13, 14, 15, 16, 17, 18],
  main_3:   [19, 20, 21, 22, 23, 0, 1, 2]  // re-use some with new positions
};

/* ── Arena layout constants ───────────────────────────────── */
const OLM_EDGE   = 70;  // px from arena edge
const OLM_MINDIST = 130; // min centre-to-centre between objects

/* ── Generate non-overlapping positions ──────────────────── */
function olmGenPositions(count, W, H) {
  const positions = [];
  let attempts = 0;
  while (positions.length < count && attempts < count * 300) {
    attempts++;
    const x = OLM_EDGE + Math.random() * (W - 2 * OLM_EDGE);
    const y = OLM_EDGE + Math.random() * (H - 2 * OLM_EDGE);
    const ok = positions.every(p => euclideanDistance(x, y, p.x, p.y) >= OLM_MINDIST);
    if (ok) positions.push({ x: Math.round(x), y: Math.round(y) });
  }
  return positions;
}

/* ── Render an object on the arena ───────────────────────── */
function olmRenderObject(obj, x, y, arenaEl, clickable = false) {
  const el = document.createElement('div');
  el.className = 'olm-object' + (clickable ? ' clickable' : '');
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  el.dataset.objId = obj.id;

  function renderPlaceholder() {
    const shape = document.createElement('div');
    shape.className = 'olm-shape';
    shape.style.background = obj.color;
    shape.textContent = obj.emoji;
    el.appendChild(shape);
  }

  if (obj.imagePath) {
    // Real image mode
    const img = document.createElement('img');
    img.src = obj.imagePath;
    img.alt = obj.label;
    img.style.cssText = 'width:56px;height:56px;object-fit:contain;border-radius:8px;display:block;margin:0 auto';
    img.addEventListener('error', () => {
      img.remove();
      renderPlaceholder();
    }, { once: true });
    el.appendChild(img);
  } else {
    // Placeholder shape mode
    renderPlaceholder();
  }

  const lbl = document.createElement('div');
  lbl.className = 'olm-label';
  lbl.textContent = obj.label;
  el.appendChild(lbl);

  arenaEl.appendChild(el);
  return el;
}

/* ── ENCODING PHASE ─────────────────────────────────────────
   Shows 8 objects at random positions for a fixed duration.
   ─────────────────────────────────────────────────────────── */
function buildOLMEncoding(blockNum, blockObjects, positions, trialType) {
  const durationMs = window.TIMING.olm_encoding_ms;
  return {
    type: jsPsychCallFunction,
    async: true,
    func(done) {
      const W = Math.min(window.innerWidth - 20, 900);
      const H = Math.min(window.innerHeight - 130, 600);

      const display = document.getElementById('jspsych-target');
      display.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;font-family:Segoe UI,Arial,sans-serif;';

      const title = document.createElement('div');
      title.style.cssText = 'color:#a8d8ea;font-size:0.95rem;margin-bottom:8px;text-align:center;';
      title.innerHTML = '<strong>' + (trialType === 'practice' ? 'Practice - ' : 'Block ' + blockNum + ' - ') + 'Encoding</strong> &nbsp;|&nbsp; Study the object locations.';

      const arena = document.createElement('div');
      arena.className = 'olm-arena';
      arena.style.width = W + 'px';
      arena.style.height = H + 'px';

      const countdown = document.createElement('div');
      countdown.style.cssText = 'color:#8899aa;font-size:0.85rem;margin-top:8px;text-align:center;';

      wrapper.appendChild(title);
      wrapper.appendChild(arena);
      wrapper.appendChild(countdown);
      display.appendChild(wrapper);

      /* Place all objects */
      blockObjects.forEach((obj, i) => {
        const pos = positions[i] || { x: OLM_EDGE, y: OLM_EDGE + i * 80 };
        olmRenderObject(obj, pos.x, pos.y, arena, false);
      });

      /* Countdown display */
      let remaining = Math.round(durationMs / 1000);
      countdown.textContent = 'Time remaining: ' + remaining + 's';
      const tick = setInterval(() => {
        remaining--;
        countdown.textContent = remaining > 0 ? 'Time remaining: ' + remaining + 's' : 'Time\'s up!';
      }, 1000);

      setTimeout(() => {
        clearInterval(tick);
        display.innerHTML = '';
        done();
      }, durationMs);
    }
  };
}

/* ── DELAY PHASE ─────────────────────────────────────────────
   Blank screen with fixation cross for fixed duration.
   ─────────────────────────────────────────────────────────── */
function buildOLMDelay(blockNum, trialType) {
  const durationMs = window.TIMING.olm_delay_ms;
  return {
    type: jsPsychCallFunction,
    async: true,
    func(done) {
      const display = document.getElementById('jspsych-target');
      display.innerHTML =
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px">' +
        '<div class="fixation">+</div>' +
        '<div style="color:#8899aa;font-size:0.85rem">' + (trialType === 'practice' ? 'Practice - ' : 'Block ' + blockNum + ' - ') + 'Delay period</div>' +
        '</div>';
      setTimeout(() => { display.innerHTML = ''; done(); }, durationMs);
    }
  };
}

/* ── RETRIEVAL PHASE ─────────────────────────────────────────
   Shows one object cue at a time; participant clicks remembered location.
   Returns array of one jsPsychCallFunction trial per object.
   ─────────────────────────────────────────────────────────── */
function buildOLMRetrieval(blockNum, blockObjects, positions, retrievalOrder, trialType, showFeedback) {
  const W = () => Math.min(window.innerWidth - 20, 900);
  const H = () => Math.min(window.innerHeight - 140, 600);

  const trials = retrievalOrder.map((objIdx, trialIdx) => {
    const obj    = blockObjects[objIdx];
    const corrX  = positions[objIdx].x;
    const corrY  = positions[objIdx].y;

    return {
      type: jsPsychCallFunction,
      async: true,
      func(done) {
        const cW = W(), cH = H();
        const display = document.getElementById('jspsych-target');
        display.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;font-family:Segoe UI,Arial,sans-serif;gap:8px;';

        /* Cue display at top */
        const cueArea = document.createElement('div');
        cueArea.style.cssText = 'text-align:center;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;';

        const cueLabel = document.createElement('div');
        cueLabel.style.cssText = 'color:#a8d8ea;font-size:1rem;font-weight:bold;';
        cueLabel.textContent = (trialType === 'practice' ? 'Practice - ' : 'Block ' + blockNum + ' - ') + 'Retrieval ' + (trialIdx + 1) + '/' + retrievalOrder.length;

        const cueObj = document.createElement('div');
        cueObj.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:4px;';

        if (obj.imagePath) {
          const img = document.createElement('img');
          img.src = obj.imagePath; img.alt = obj.label;
          img.style.cssText = 'width:52px;height:52px;object-fit:contain;border-radius:8px;border:2px solid #3a6186;';
          img.addEventListener('error', () => {
            img.remove();
            const shape = document.createElement('div');
            shape.className = 'olm-shape';
            shape.style.cssText += 'background:' + obj.color + ';width:52px;height:52px;';
            shape.textContent = obj.emoji;
            cueObj.insertBefore(shape, cueObj.firstChild);
          }, { once: true });
          cueObj.appendChild(img);
        } else {
          const shape = document.createElement('div');
          shape.className = 'olm-shape';
          shape.style.cssText += 'background:' + obj.color + ';width:52px;height:52px;';
          shape.textContent = obj.emoji;
          cueObj.appendChild(shape);
        }

        const cueName = document.createElement('div');
        cueName.style.cssText = 'color:#e0e0e0;font-size:1.1rem;font-weight:bold;';
        cueName.textContent = 'Point to: ' + obj.label;
        cueObj.appendChild(cueName);

        cueArea.appendChild(cueLabel);
        cueArea.appendChild(cueObj);

        const arena = document.createElement('div');
        arena.className = 'olm-arena';
        arena.style.cssText = 'width:' + cW + 'px;height:' + cH + 'px;cursor:crosshair;';

        const hint = document.createElement('div');
        hint.style.cssText = 'color:#8899aa;font-size:0.8rem;text-align:center;';
        hint.textContent = 'Click the location where you think the ' + obj.label + ' was.';

        wrapper.appendChild(cueArea);
        wrapper.appendChild(arena);
        wrapper.appendChild(hint);
        display.appendChild(wrapper);

        /* Crosshair cursor tracker */
        let crosshairEl = null;
        arena.addEventListener('mousemove', (e) => {
          const rect = arena.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;
          if (!crosshairEl) {
            crosshairEl = document.createElement('div');
            crosshairEl.className = 'olm-crosshair';
            crosshairEl.style.cssText = 'position:absolute;pointer-events:none;';
            const vline = document.createElement('div'); vline.style.cssText = 'position:absolute;width:1px;height:100%;background:rgba(168,216,234,0.3);';
            const hline = document.createElement('div'); hline.style.cssText = 'position:absolute;height:1px;width:100%;background:rgba(168,216,234,0.3);';
            crosshairEl.appendChild(vline); crosshairEl.appendChild(hline);
            arena.appendChild(crosshairEl);
          }
          crosshairEl.querySelectorAll('div')[0].style.left = mx + 'px';
          crosshairEl.querySelectorAll('div')[1].style.top  = my + 'px';
        });

        const startTime = performance.now();

        arena.addEventListener('click', function onArenaClick(e) {
          arena.removeEventListener('click', onArenaClick);
          arena.style.cursor = 'default';

          const rect   = arena.getBoundingClientRect();
          const respX  = Math.round(e.clientX - rect.left);
          const respY  = Math.round(e.clientY - rect.top);
          const rt     = Math.round(performance.now() - startTime);

          /* Compute Euclidean error in px */
          const errPx  = +euclideanDistance(respX, respY, corrX, corrY).toFixed(2);
          /* Normalized error: divide by arena diagonal */
          const diagPx = Math.sqrt(cW * cW + cH * cH);
          const normErr = +(errPx / diagPx).toFixed(4);

          /* Record trial */
          const row = {
            task_name:           'object_location_memory',
            trial_type:          trialType,
            block_number:        blockNum,
            trial_number:        trialIdx + 1,
            object_id:           obj.id,
            object_label:        obj.label,
            object_image_path:   obj.imagePath || 'placeholder',
            correct_x:           corrX,
            correct_y:           corrY,
            response_x:          respX,
            response_y:          respY,
            response_time_ms:    rt,
            euclidean_error_px:  errPx,
            normalized_error:    normErr,
            arena_width_px:      cW,
            arena_height_px:     cH,
            encoding_duration_ms: window.TIMING.olm_encoding_ms,
            delay_duration_ms:    window.TIMING.olm_delay_ms,
            retrieval_order:     JSON.stringify(retrievalOrder),
            object_positions_json: JSON.stringify(positions)
          };
          window.BatteryData.addTrials(row);

          /* Visual feedback */
          if (showFeedback) {
            const respDot = document.createElement('div');
            respDot.style.cssText = 'position:absolute;width:14px;height:14px;border-radius:50%;background:#a8d8ea;transform:translate(-50%,-50%);pointer-events:none;';
            respDot.style.left = respX + 'px'; respDot.style.top = respY + 'px';
            arena.appendChild(respDot);

            const corrDot = document.createElement('div');
            corrDot.style.cssText = 'position:absolute;width:14px;height:14px;border-radius:50%;background:#66bb6a;border:2px solid #fff;transform:translate(-50%,-50%);pointer-events:none;';
            corrDot.style.left = corrX + 'px'; corrDot.style.top = corrY + 'px';
            arena.appendChild(corrDot);

            hint.style.color = '#66bb6a';
            hint.textContent = 'Correct location shown in green. Your response in blue. Error: ' + errPx.toFixed(0) + ' px';

            setTimeout(() => { display.innerHTML = ''; done(); }, 1800);
          } else {
            setTimeout(() => { display.innerHTML = ''; done(); }, 200);
          }
        });
      }
    };
  });

  return trials;
}

/* ── Build one complete block ─────────────────────────────── */
function buildOLMBlock(blockNum, blockIndices, trialType, showFeedback) {
  const blockObjects = blockIndices.map(i => OLM_OBJECTS[i]);
  const W = Math.min(window.innerWidth - 20, 900);
  const H = Math.min(window.innerHeight - 140, 600);
  const positions      = olmGenPositions(blockObjects.length, W || 900, H || 600);
  const retrievalOrder = shuffle(Array.from({ length: blockObjects.length }, (_, i) => i));

  return [
    buildOLMEncoding(blockNum, blockObjects, positions, trialType),
    buildOLMDelay(blockNum, trialType),
    ...buildOLMRetrieval(blockNum, blockObjects, positions, retrievalOrder, trialType, showFeedback)
  ];
}

/* ── Instructions ─────────────────────────────────────────── */
function olmInstructions() {
  return {
    type: jsPsychInstructions,
    pages: [
      `<div style="max-width:700px;margin:0 auto;text-align:left">
        <h2 style="color:#a8d8ea">Object-Location Memory Task</h2>
        <p>In this task, you will see <strong>8 everyday objects</strong> placed at different
        locations on the screen. Your job is to remember <em>where each object was</em>.</p>
        <p>Each trial has three phases:</p>
        <ol style="margin-left:1.5em;line-height:1.8">
          <li><strong>Encoding</strong> — Study the object locations for 25 seconds.</li>
          <li><strong>Delay</strong> — A short blank interval with a fixation cross.</li>
          <li><strong>Retrieval</strong> — Each object is shown as a cue. Click where you
          think it was on the screen.</li>
        </ol>
        <p>There are 3 blocks of 8 objects each, plus a short practice block first.</p>
        <p>No feedback will be given during the main blocks.</p>
        <p style="color:#8899aa;font-size:0.9rem">Press <strong>Next</strong> to start the practice.</p>
      </div>`
    ],
    show_clickable_nav: true,
    button_label_next: 'Next &rarr;',
    data: { task_name: 'object_location_memory', phase: 'instructions' }
  };
}

function olmBlockReady(blockNum, isPractice) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="max-width:600px;margin:0 auto;text-align:center">
      <h3 style="color:#a8d8ea">${isPractice ? 'Practice Block' : 'Block ' + blockNum + ' of 3'}</h3>
      <p>Study the ${isPractice ? '3' : '8'} object locations during the encoding phase.</p>
      <p style="color:#8899aa;font-size:0.85rem">Click <strong>Start</strong> when ready.</p>
    </div>`,
    choices: ['Start'],
    data: { task_name: 'object_location_memory', phase: isPractice ? 'practice_ready' : 'block_ready', block_number: blockNum }
  };
}

/* ── Build complete OLM timeline ──────────────────────────── */
function buildObjectLocationTimeline() {
  const timeline = [olmInstructions()];

  /* Practice block (3 objects, with feedback) */
  timeline.push(olmBlockReady(0, true));
  timeline.push(...buildOLMBlock(0, OLM_BLOCK_INDICES.practice, 'practice', true));

  /* Main blocks (8 objects each, no feedback) */
  [['main_1', 1], ['main_2', 2], ['main_3', 3]].forEach(([key, num]) => {
    timeline.push(olmBlockReady(num, false));
    timeline.push(...buildOLMBlock(num, OLM_BLOCK_INDICES[key], 'main', false));
  });

  /* End-of-task download option */
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="max-width:600px;margin:0 auto;text-align:center">
      <h3 style="color:#a8d8ea">Object-Location Memory Task Complete</h3>
      <p style="color:#8899aa">Download task data now or continue to the next task.</p>
    </div>`,
    choices: ['Download Task CSV', 'Continue Battery'],
    data: { task_name: 'object_location_memory', phase: 'end' },
    on_finish(data) {
      if (data.response === 0) exportTaskCSV('object_location_memory');
    }
  });

  return timeline;
}
