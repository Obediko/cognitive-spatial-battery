/* ============================================================
   spatial_pointing.js
   ============================================================
   2D Spatial Pointing Task
   Baseline measure of spatial orientation / directional memory.
   Total duration target: < 5 minutes.

   Structure:
     Study phase : 6 landmarks placed in a circular arena (shown for SP_STUDY_MS)
     Practice    : 2 trials with feedback
     Main        : 18 trials - 6 targets x 3 start positions each (shuffled)
                   Target is hidden; participant clicks arena boundary to indicate direction.

   Response method: click anywhere on the arena canvas.
     The angle from the start position to the click point is taken as the response.
     Primary outcome: angular error in degrees.

   Exports (global): buildSpatialPointingTimeline()
   ============================================================ */
'use strict';

/* ── Landmark definitions ────────────────────────────────── */
const SP_LANDMARKS = [
  { id: 'tree',    label: 'Tree',    emoji: '\uD83C\uDF33', color: '#2e7d32' },
  { id: 'house',   label: 'House',   emoji: '\uD83C\uDFE0', color: '#5c6bc0' },
  { id: 'flag',    label: 'Flag',    emoji: '\uD83D\uDEA9', color: '#e53935' },
  { id: 'bench',   label: 'Bench',   emoji: '\uD83E\uDE91', color: '#8d6e63' },
  { id: 'fountain',label: 'Fountain',emoji: '\u26F2',        color: '#0288d1' },
  { id: 'tower',   label: 'Tower',   emoji: '\uD83D\uDDFC', color: '#6d4c41' }
];

/* ── Arena constants ─────────────────────────────────────── */
const SP_ARENA_R    = 240;  // radius of circular arena in px
const SP_ARENA_SIZE = SP_ARENA_R * 2 + 20; // canvas bounding box
const SP_LM_R       = 0.72; // landmark radius as fraction of arena radius

/* ── Landmark positions (fixed angles, evenly spaced) ───── */
function spGetLandmarkPositions(cx, cy) {
  const angleStep = (2 * Math.PI) / SP_LANDMARKS.length;
  return SP_LANDMARKS.map((lm, i) => {
    const angle = i * angleStep - Math.PI / 2; // start at top
    return {
      ...lm,
      x: cx + SP_LM_R * SP_ARENA_R * Math.cos(angle),
      y: cy + SP_LM_R * SP_ARENA_R * Math.sin(angle),
      canonicalAngle: (angle * 180 / Math.PI + 360) % 360
    };
  });
}

/* ── Start positions (3 fixed positions inside arena) ───── */
function spGetStartPositions(cx, cy) {
  return [
    { id: 'north', x: cx,            y: cy - SP_ARENA_R * 0.35 },
    { id: 'south', x: cx,            y: cy + SP_ARENA_R * 0.35 },
    { id: 'east',  x: cx + SP_ARENA_R * 0.35, y: cy }
  ];
}

/* ── Draw arena on canvas ─────────────────────────────────── */
function spDrawArena(ctx, cx, cy, landmarks, startPos, showLandmarks, chosenAngle) {
  /* Clear */
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  /* Arena circle */
  ctx.beginPath();
  ctx.arc(cx, cy, SP_ARENA_R, 0, 2 * Math.PI);
  ctx.fillStyle = '#0d1b2a';
  ctx.fill();
  ctx.strokeStyle = '#3a6186';
  ctx.lineWidth = 2;
  ctx.stroke();

  /* Cardinal direction tick marks */
  ctx.strokeStyle = 'rgba(168,216,234,0.2)';
  ctx.lineWidth = 1;
  [0, 90, 180, 270].forEach(deg => {
    const rad = deg * Math.PI / 180;
    const x1 = cx + (SP_ARENA_R - 12) * Math.cos(rad);
    const y1 = cy + (SP_ARENA_R - 12) * Math.sin(rad);
    const x2 = cx + SP_ARENA_R * Math.cos(rad);
    const y2 = cy + SP_ARENA_R * Math.sin(rad);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });

  /* Landmarks (only visible during study or if shown) */
  if (showLandmarks) {
    landmarks.forEach(lm => {
      /* Dot */
      ctx.beginPath(); ctx.arc(lm.x, lm.y, 18, 0, 2 * Math.PI);
      ctx.fillStyle = lm.color; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

      /* Emoji */
      ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lm.emoji, lm.x, lm.y);

      /* Label */
      const labelX = cx + (lm.x - cx) * 1.18;
      const labelY = cy + (lm.y - cy) * 1.18;
      ctx.font = 'bold 11px Segoe UI,Arial,sans-serif';
      ctx.fillStyle = '#cdd9e5'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lm.label, labelX, labelY);
    });
  }

  /* Start position marker */
  if (startPos) {
    ctx.beginPath(); ctx.arc(startPos.x, startPos.y, 9, 0, 2 * Math.PI);
    ctx.fillStyle = '#a8d8ea'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = 'bold 9px Segoe UI,Arial,sans-serif';
    ctx.fillStyle = '#0d1b2a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('S', startPos.x, startPos.y);
  }

  /* Chosen direction arrow */
  if (chosenAngle !== null && startPos) {
    const rad = chosenAngle * Math.PI / 180;
    const arrowLen = SP_ARENA_R * 0.85;
    const ex = startPos.x + arrowLen * Math.cos(rad);
    const ey = startPos.y + arrowLen * Math.sin(rad);
    ctx.beginPath(); ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(ex, ey);
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2.5; ctx.stroke();
    /* Arrowhead */
    const headLen = 12, headAngle = 0.4;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - headLen * Math.cos(rad - headAngle), ey - headLen * Math.sin(rad - headAngle));
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - headLen * Math.cos(rad + headAngle), ey - headLen * Math.sin(rad + headAngle));
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2; ctx.stroke();
  }
}

/* ── Study phase ──────────────────────────────────────────── */
function buildSPStudy() {
  return {
    type: jsPsychCallFunction,
    async: true,
    func(done) {
      const studyMs = window.TIMING.sp_study_ms;
      const display = document.getElementById('jspsych-target');
      display.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.id = 'sp-wrapper';
      wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-family:Segoe UI,Arial,sans-serif;gap:10px;';

      const title = document.createElement('div');
      title.style.cssText = 'color:#a8d8ea;font-size:1rem;font-weight:bold;text-align:center;';
      title.textContent = 'Study Phase - Remember the locations of all 6 landmarks.';

      const canvas = document.createElement('canvas');
      canvas.id = 'sp-arena';
      canvas.width  = SP_ARENA_SIZE;
      canvas.height = SP_ARENA_SIZE;
      canvas.style.cssText = 'display:block;border-radius:50%;';

      const countdown = document.createElement('div');
      countdown.style.cssText = 'color:#8899aa;font-size:0.85rem;text-align:center;';

      wrapper.appendChild(title); wrapper.appendChild(canvas); wrapper.appendChild(countdown);
      display.appendChild(wrapper);

      const cx = SP_ARENA_SIZE / 2, cy = SP_ARENA_SIZE / 2;
      const landmarks = spGetLandmarkPositions(cx, cy);
      /* Store landmarks globally for retrieval trials */
      window._spLandmarks    = landmarks;
      window._spStartPositions = spGetStartPositions(cx, cy);
      window._spArenaCenter  = { cx, cy };

      const ctx = canvas.getContext('2d');
      spDrawArena(ctx, cx, cy, landmarks, null, true, null);

      let remaining = Math.round(studyMs / 1000);
      countdown.textContent = 'Time to study: ' + remaining + 's';
      const tick = setInterval(() => {
        remaining--;
        countdown.textContent = remaining > 0 ? 'Time to study: ' + remaining + 's' : 'Time\'s up!';
      }, 1000);

      setTimeout(() => { clearInterval(tick); display.innerHTML = ''; done(); }, studyMs);
    }
  };
}

/* ── Single pointing trial ────────────────────────────────── */
function buildSPTrial(trialNum, targetLandmark, startPosObj, practiceOrMain, showFeedback) {
  return {
    type: jsPsychCallFunction,
    async: true,
    func(done) {
      const display  = document.getElementById('jspsych-target');
      display.innerHTML = '';

      const lm  = window._spLandmarks.find(l => l.id === targetLandmark.id) || targetLandmark;
      const sp  = startPosObj;
      const { cx, cy } = window._spArenaCenter;

      /* Correct angle from start to target */
      const correctAngle = angleBetween(sp.x, sp.y, lm.x, lm.y);

      const wrapper = document.createElement('div');
      wrapper.id = 'sp-wrapper';
      wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;font-family:Segoe UI,Arial,sans-serif;gap:10px;';

      const label = document.createElement('div');
      label.id = 'sp-cue-label';
      label.innerHTML = 'Point toward: <strong>' + lm.emoji + ' ' + lm.label + '</strong>';

      const canvas = document.createElement('canvas');
      canvas.id = 'sp-arena';
      canvas.width  = SP_ARENA_SIZE;
      canvas.height = SP_ARENA_SIZE;
      canvas.style.cssText = 'display:block;border-radius:50%;cursor:crosshair;';

      const hint = document.createElement('div');
      hint.id = 'sp-hint';
      hint.textContent = 'Click anywhere on the arena to indicate the direction. Confirm with the button.';

      const confirmBtn = document.createElement('button');
      confirmBtn.id = 'sp-confirm-btn';
      confirmBtn.textContent = 'Confirm Direction';
      confirmBtn.disabled = true;

      const progress = document.createElement('div');
      progress.style.cssText = 'color:#8899aa;font-size:0.8rem;text-align:center;';
      progress.textContent = (practiceOrMain === 'practice' ? 'Practice ' : 'Trial ') + trialNum + (practiceOrMain === 'main' ? '/18' : '/2');

      wrapper.appendChild(label); wrapper.appendChild(canvas); wrapper.appendChild(hint);
      wrapper.appendChild(confirmBtn); wrapper.appendChild(progress);
      display.appendChild(wrapper);

      const ctx = canvas.getContext('2d');
      /* Draw arena WITHOUT the target landmark shown */
      spDrawArena(ctx, cx, cy, window._spLandmarks, sp, false, null);

      let chosenAngle = null;
      const startTime = performance.now();

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        /* Only update preview if inside arena circle */
        if (euclideanDistance(mx, my, cx, cy) <= SP_ARENA_R + 20) {
          const previewAngle = angleBetween(sp.x, sp.y, mx, my);
          spDrawArena(ctx, cx, cy, window._spLandmarks, sp, false, previewAngle);
        }
      });

      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        if (euclideanDistance(mx, my, cx, cy) > SP_ARENA_R + 30) return; /* outside arena */
        chosenAngle = angleBetween(sp.x, sp.y, mx, my);
        spDrawArena(ctx, cx, cy, window._spLandmarks, sp, false, chosenAngle);
        confirmBtn.disabled = false;
        hint.textContent = 'Direction set. Click "Confirm Direction" to proceed, or click again to change.';
      });

      confirmBtn.addEventListener('click', () => {
        if (chosenAngle === null) return;
        const rt = Math.round(performance.now() - startTime);

        /* Compute angular errors */
        const signed  = +signedAngularError(chosenAngle, correctAngle).toFixed(2);
        const absErr  = +Math.abs(signed).toFixed(2);

        const row = {
          task_name:                    'spatial_pointing',
          practice_or_main:             practiceOrMain,
          trial_number:                 trialNum,
          target_object:                lm.label,
          target_id:                    lm.id,
          target_x:                     Math.round(lm.x),
          target_y:                     Math.round(lm.y),
          start_x:                      Math.round(sp.x),
          start_y:                      Math.round(sp.y),
          start_id:                     sp.id,
          correct_angle_degrees:        +correctAngle.toFixed(2),
          chosen_angle_degrees:         +chosenAngle.toFixed(2),
          signed_angular_error_degrees: signed,
          absolute_angular_error_degrees: absErr,
          response_time_ms:             rt,
          arena_radius_px:              SP_ARENA_R,
          arena_center_x:               Math.round(cx),
          arena_center_y:               Math.round(cy)
        };
        window.BatteryData.addTrials(row);

        if (showFeedback) {
          /* Show correct direction briefly */
          spDrawArena(ctx, cx, cy, window._spLandmarks, sp, true, chosenAngle);
          const corrRad = correctAngle * Math.PI / 180;
          const ex = sp.x + SP_ARENA_R * 0.85 * Math.cos(corrRad);
          const ey = sp.y + SP_ARENA_R * 0.85 * Math.sin(corrRad);
          ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(ex, ey);
          ctx.strokeStyle = '#66bb6a'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 3]); ctx.stroke();
          ctx.setLineDash([]);
          hint.innerHTML = '<span style="color:#66bb6a">Correct direction shown in green.</span> &nbsp; Your response in yellow. &nbsp; Error: <strong>' + absErr.toFixed(1) + '&deg;</strong>';
          confirmBtn.disabled = true;
          setTimeout(() => { display.innerHTML = ''; done(); }, 2000);
        } else {
          display.innerHTML = '';
          done();
        }
      });
    }
  };
}

/* ── Instructions ─────────────────────────────────────────── */
function spInstructions() {
  return {
    type: jsPsychInstructions,
    pages: [
      `<div style="max-width:700px;margin:0 auto;text-align:left">
        <h2 style="color:#a8d8ea">Spatial Pointing Task</h2>
        <p>You will first study the positions of <strong>6 landmarks</strong> placed inside a circular arena.
        Take your time to remember each landmark\'s location.</p>
        <p>After the study phase, you will complete <strong>pointing trials</strong>:</p>
        <ul style="margin-left:1.5em;line-height:1.8">
          <li>A <strong>start position (S)</strong> is shown inside the arena.</li>
          <li>A <strong>target landmark</strong> is named — but <em>not shown</em>.</li>
          <li>Click on the arena to indicate the <em>direction</em> from your start
          position toward the remembered target.</li>
          <li>Confirm your response with the button.</li>
        </ul>
        <p>We will start with 2 practice trials with feedback, then 18 main trials.</p>
        <p style="color:#8899aa;font-size:0.9rem">Press <strong>Next</strong> to begin the study phase.</p>
      </div>`
    ],
    show_clickable_nav: true,
    button_label_next: 'Next &rarr;',
    data: { task_name: 'spatial_pointing', phase: 'instructions' }
  };
}

/* ── Build complete spatial pointing timeline ─────────────── */
function buildSpatialPointingTimeline() {
  const timeline = [spInstructions(), buildSPStudy()];

  /* Practice trials: 2 trials */
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="max-width:600px;margin:0 auto;text-align:center">
      <h3 style="color:#a8d8ea">Practice Trials (2)</h3>
      <p>Feedback will be shown after each practice trial.</p>
      <p style="color:#8899aa;font-size:0.85rem">Click <strong>Start</strong> when ready.</p>
    </div>`,
    choices: ['Start Practice'],
    data: { task_name: 'spatial_pointing', phase: 'practice_ready' }
  });

  /* Practice: pick 2 landmark/start combos */
  const practiceTargets = [SP_LANDMARKS[0], SP_LANDMARKS[3]]; // tree and bench
  const practiceCombos  = [
    { target: practiceTargets[0], startIdx: 0 },
    { target: practiceTargets[1], startIdx: 1 }
  ];
  practiceCombos.forEach((combo, i) => {
    timeline.push({
      type: jsPsychCallFunction,
      async: true,
      func(done) {
        const sp = window._spStartPositions ? window._spStartPositions[combo.startIdx] : { id: 'p', x: SP_ARENA_SIZE/2, y: SP_ARENA_SIZE/2 - 80 };
        /* Rebuild trial with runtime data */
        buildSPTrial(i + 1, combo.target, sp, 'practice', true).func(done);
      }
    });
  });

  /* Main trials: 18 = 6 targets x 3 start positions, shuffled */
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="max-width:600px;margin:0 auto;text-align:center">
      <h3 style="color:#a8d8ea">Main Trials (18)</h3>
      <p>No feedback will be given during the main trials.</p>
      <p style="color:#8899aa;font-size:0.85rem">Click <strong>Start</strong> when ready.</p>
    </div>`,
    choices: ['Start Main Trials'],
    data: { task_name: 'spatial_pointing', phase: 'main_ready' }
  });

  /* Generate 18 trial combos: each of 6 landmarks x 3 start positions */
  const mainCombos = [];
  SP_LANDMARKS.forEach(lm => {
    [0, 1, 2].forEach(startIdx => {
      mainCombos.push({ target: lm, startIdx });
    });
  });
  const shuffledCombos = shuffle(mainCombos);

  shuffledCombos.forEach((combo, i) => {
    timeline.push({
      type: jsPsychCallFunction,
      async: true,
      func(done) {
        const startPositions = window._spStartPositions || spGetStartPositions(SP_ARENA_SIZE/2, SP_ARENA_SIZE/2);
        const sp = startPositions[combo.startIdx];
        buildSPTrial(i + 1, combo.target, sp, 'main', false).func(done);
      }
    });
  });

  /* End-of-task download option */
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="max-width:600px;margin:0 auto;text-align:center">
      <h3 style="color:#a8d8ea">Spatial Pointing Task Complete</h3>
      <p style="color:#8899aa">Download task data now or continue.</p>
    </div>`,
    choices: ['Download Task CSV', 'Continue Battery'],
    data: { task_name: 'spatial_pointing', phase: 'end' },
    on_finish(data) {
      if (data.response === 0) exportTaskCSV('spatial_pointing');
    }
  });

  return timeline;
}
