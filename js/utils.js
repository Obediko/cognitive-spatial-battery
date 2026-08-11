/* ============================================================
   utils.js - Shared utilities for the cognitive/spatial battery
   ============================================================
   Exports (globals):
     BatteryData        - in-session data store
     exportAllCSV()     - download all trials as CSV
     exportAllJSON()    - download trials + summary as JSON
     exportTaskCSV()    - download one task's trials as CSV
     buildSummary()     - compute derived summary statistics
     getTimestamp()     - ISO timestamp
     getWindowSize()    - display geometry object
     euclideanDistance()
     angleBetween()
     signedAngularError()
     shuffle()
     mean() / median()
   ============================================================ */
'use strict';

/* ── PILOT MODE ─────────────────────────────────────────────
   Set PILOT_MODE = true to use shortened timings for development.
   Set to false for real data collection.
   ─────────────────────────────────────────────────────────── */
window.PILOT_MODE = false;

/* Timing constants - adjusted by pilot mode */
window.TIMING = {
  olm_encoding_ms:  window.PILOT_MODE ?  5000 : 25000,
  olm_delay_ms:     window.PILOT_MODE ?  3000 : 15000,
  sp_study_ms:      window.PILOT_MODE ?  4000 : 10000,
};

/* ── Input modality and crash recovery ─────────────────────── */
window.BatteryInput = { current: 'unknown', gamepadConnected: false };

if (typeof window.addEventListener === 'function') {
  window.addEventListener('pointerdown', function(event) {
    window.BatteryInput.current = event.pointerType === 'touch' ? 'touch' : 'pointer';
  }, true);
  window.addEventListener('keydown', function() {
    window.BatteryInput.current = 'keyboard';
  }, true);
  window.addEventListener('gamepadconnected', function() {
    window.BatteryInput.gamepadConnected = true;
    window.BatteryInput.current = 'gamepad';
  });
  window.addEventListener('gamepaddisconnected', function() {
    window.BatteryInput.gamepadConnected = false;
  });
}

function batteryRecoveryKey(participantId) {
  return 'csb-recovery-v1:' + encodeURIComponent(String(participantId || ''));
}

function batteryCheckpointPayload() {
  return {
    saved_at: getTimestamp(),
    participantId: window.BatteryData.participantId,
    sessionStart: window.BatteryData.sessionStart,
    trials: window.BatteryData.trials,
    taskSummaries: window.BatteryData.taskSummaries,
    batteryChoice: window.BatteryData.batteryChoice || null,
    sessionStatus: window.BatteryData.sessionStatus || 'in_progress',
    taskState: {
      ocfCopyCompletedAt: window.OCFState ? window.OCFState.copyCompletedAt : null
    }
  };
}

function checkpointBatterySession() {
  if (!window.BatteryData.participantId || !window.localStorage) return false;
  try {
    var payload = batteryCheckpointPayload();
    window.localStorage.setItem(batteryRecoveryKey(window.BatteryData.participantId), JSON.stringify(payload));
    if (window.BatteryRemoteSync) window.BatteryRemoteSync.queueCheckpoint(payload);
    return true;
  } catch (error) {
    console.warn('Battery recovery checkpoint could not be saved:', error);
    window.BatteryData.recoveryCheckpointFailed = true;
    var existing = document.getElementById('battery-recovery-warning');
    if (!existing && document.body) {
      var warning = document.createElement('div');
      warning.id = 'battery-recovery-warning';
      warning.style.cssText = 'position:fixed;right:1rem;bottom:1rem;z-index:10000;background:#7f1d1d;color:#fff;padding:.7rem 1rem;border-radius:8px;max-width:360px;font-size:.82rem;';
      warning.textContent = 'Automatic crash recovery could not be saved. Export data before closing or reloading this tab.';
      document.body.appendChild(warning);
    }
    return false;
  }
}

function loadBatteryCheckpoint(participantId, options) {
  options = options || {};
  if (!window.localStorage) return false;
  try {
    var raw = window.localStorage.getItem(batteryRecoveryKey(participantId));
    if (!raw) return false;
    var saved = JSON.parse(raw);
    if (!saved || saved.participantId !== participantId || !Array.isArray(saved.trials)) return false;
    if (options.confirm !== false &&
        !window.confirm('A saved session for this participant ID was found. Restore its trials, summaries and local recordings?')) {
      return false;
    }
    window.BatteryData.participantId = saved.participantId;
    window.BatteryData.sessionStart = saved.sessionStart;
    window.BatteryData.trials = saved.trials;
    window.BatteryData.taskSummaries = saved.taskSummaries || {};
    window.BatteryData.batteryChoice = saved.batteryChoice || null;
    window.BatteryData.sessionStatus = saved.sessionStatus || 'in_progress';
    if (window.OCFState) {
      window.OCFState.copyCompletedAt = saved.taskState && saved.taskState.ocfCopyCompletedAt
        ? saved.taskState.ocfCopyCompletedAt : null;
      ['copy', 'delayed'].forEach(function(phase) {
        var row = saved.trials.slice().reverse().find(function(item) {
          return item.task_name === 'original_complex_figure' && item.phase === phase + '_drawing';
        });
        if (row && row.stroke_data) {
          try { window.OCFState[phase + 'Strokes'] = JSON.parse(row.stroke_data); } catch (error) { console.warn(error); }
        }
        if (row) window.OCFState[phase + 'Incomplete'] = !!row.incomplete;
      });
    }
    var asfRow = saved.trials.slice().reverse().find(function(item) {
      return item.task_name === 'animal_semantic_fluency' && item.phase === 'category_generation';
    });
    if (asfRow && window.ASFState) {
      window.ASFState.promptUsed = !!asfRow.prompt_used;
      window.ASFState.endedEarly = !!asfRow.ended_early;
      window.ASFState.microphoneProblem = !!asfRow.microphone_problem;
    }
    var osrRows = saved.trials.filter(function(item) {
      return item.task_name === 'original_story_recall' && item.phase === 'free_recall';
    });
    if (window.OSRState) {
      osrRows.forEach(function(row) {
        if (row.condition) window.OSRState.neutralPromptUsed[row.condition] = !!row.neutral_prompt_used;
        if (row.microphone_problem) window.OSRState.protocolFlags.microphone_problem = true;
      });
    }
    return true;
  } catch (error) {
    console.warn('Battery recovery checkpoint could not be restored:', error);
    return false;
  }
}

function restoreBatteryCheckpoint(participantId) {
  return loadBatteryCheckpoint(participantId, { confirm: true });
}

function listBatteryCheckpoints() {
  if (!window.localStorage) return [];
  var sessions = [];
  for (var i = 0; i < window.localStorage.length; i += 1) {
    var key = window.localStorage.key(i);
    if (!key || key.indexOf('csb-recovery-v1:') !== 0) continue;
    try {
      var saved = JSON.parse(window.localStorage.getItem(key));
      if (!saved || !saved.participantId || !Array.isArray(saved.trials)) continue;
      sessions.push({
        participantId: saved.participantId,
        savedAt: saved.saved_at || null,
        sessionStart: saved.sessionStart || null,
        sessionStatus: saved.sessionStatus || 'in_progress',
        batteryChoice: saved.batteryChoice || null,
        trialCount: saved.trials.length
      });
    } catch (error) {
      console.warn('Ignoring unreadable battery checkpoint:', key);
    }
  }
  return sessions.sort(function(a, b) {
    return String(b.savedAt || '').localeCompare(String(a.savedAt || ''));
  });
}

function clearBatteryCheckpoint() {
  if (!window.localStorage || !window.BatteryData.participantId) return;
  window.localStorage.removeItem(batteryRecoveryKey(window.BatteryData.participantId));
}

// Standard controller navigation for buttons and form controls. The complex
// figure task owns its drawing cursor, so global navigation pauses there.
(function startGamepadNavigation() {
  if (!window.requestAnimationFrame || !navigator.getGamepads) return;
  var previous = {};
  var lastMove = 0;
  function pressOnce(key, pressed, action) {
    if (pressed && !previous[key]) action();
    previous[key] = pressed;
  }
  function loop(now) {
    var pads = navigator.getGamepads();
    var pad = pads && Array.prototype.find.call(pads, function(p) { return p; });
    if (pad && !document.getElementById('ocf-canvas')) {
      var controls = Array.prototype.slice.call(document.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
      )).filter(function(el) { return el.offsetParent !== null; });
      var current = controls.indexOf(document.activeElement);
      var axis = pad.axes && pad.axes.length > 1 ? pad.axes[1] : 0;
      var up = axis < -0.55 || (pad.buttons[12] && pad.buttons[12].pressed);
      var down = axis > 0.55 || (pad.buttons[13] && pad.buttons[13].pressed);
      if ((up || down) && now - lastMove > 220 && controls.length) {
        current = current < 0 ? 0 : (current + (down ? 1 : -1) + controls.length) % controls.length;
        controls[current].focus();
        window.BatteryInput.current = 'gamepad';
        lastMove = now;
      }
      pressOnce('activate', !!(pad.buttons[0] && pad.buttons[0].pressed), function() {
        if (document.activeElement && typeof document.activeElement.click === 'function') {
          document.activeElement.click();
          window.BatteryInput.current = 'gamepad';
        }
      });
    }
    window.requestAnimationFrame(loop);
  }
  window.requestAnimationFrame(loop);
})();

/* ── Reliability helpers ───────────────────────────────────── */
window.BatteryReliability = (function() {
  var DEFAULT_TIMEOUT_MS = 12000;

  function withTimeout(promise, timeoutMs, label) {
    timeoutMs = timeoutMs || DEFAULT_TIMEOUT_MS;
    return new Promise(function(resolve, reject) {
      var settled = false;
      var timer = setTimeout(function() {
        if (settled) return;
        settled = true;
        reject(new Error((label || 'operation') + ' timed out after ' + timeoutMs + ' ms'));
      }, timeoutMs);
      Promise.resolve(promise).then(function(value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      }).catch(function(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  function requestMicrophone(timeoutMs) {
    timeoutMs = timeoutMs || DEFAULT_TIMEOUT_MS;
    return new Promise(function(resolve, reject) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new Error('Microphone capture is unavailable'));
        return;
      }
      var settled = false;
      var timer = setTimeout(function() {
        if (settled) return;
        settled = true;
        reject(new Error('Microphone permission timed out'));
      }, timeoutMs);
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
        if (settled) {
          stream.getTracks().forEach(function(track) { track.stop(); });
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve(stream);
      }).catch(function(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  function stopRecorder(recorder, chunks, timeoutMs) {
    timeoutMs = timeoutMs || 3000;
    return new Promise(function(resolve) {
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      var settled = false;
      var mime = recorder.mimeType || 'audio/webm';
      var previousStop = recorder.onstop;
      function finish(timedOut) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        recorder.onstop = timedOut ? null : (previousStop || null);
        resolve({
          blob: chunks && chunks.length ? new Blob(chunks, { type: mime }) : null,
          timedOut: !!timedOut
        });
      }
      recorder.onstop = function(event) {
        if (typeof previousStop === 'function') {
          try { previousStop.call(recorder, event); } catch (error) { console.warn(error); }
        }
        finish(false);
      };
      var timer = setTimeout(function() { finish(true); }, timeoutMs);
      try { recorder.stop(); } catch (error) { finish(true); }
    });
  }

  function revokeObjectUrl(url) {
    if (!url || typeof URL === 'undefined' || !URL.revokeObjectURL) return;
    try { URL.revokeObjectURL(url); } catch (error) { console.warn(error); }
  }

  function decimateStroke(stroke, minimumDistance, maximumPoints) {
    stroke = Array.isArray(stroke) ? stroke : [];
    minimumDistance = minimumDistance || 0.0025;
    maximumPoints = maximumPoints || 1200;
    if (stroke.length <= 2) return stroke.slice();
    var kept = [stroke[0]];
    var last = stroke[0];
    for (var i = 1; i < stroke.length - 1; i += 1) {
      var point = stroke[i];
      var dx = point.x - last.x;
      var dy = point.y - last.y;
      if (Math.sqrt(dx * dx + dy * dy) >= minimumDistance) {
        kept.push(point);
        last = point;
      }
    }
    kept.push(stroke[stroke.length - 1]);
    if (kept.length <= maximumPoints) return kept;
    var stride = (kept.length - 1) / (maximumPoints - 1);
    return Array.from({ length: maximumPoints }, function(_, index) {
      return kept[Math.min(kept.length - 1, Math.round(index * stride))];
    });
  }

  function installGamepadPointer(canvas, onSelect, options) {
    options = options || {};
    if (!canvas || !navigator.getGamepads || !window.requestAnimationFrame) return function() {};
    var parent = canvas.parentElement;
    var cursor = document.createElement('div');
    cursor.className = 'battery-gamepad-pointer';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.style.cssText = 'position:absolute;width:22px;height:22px;border:3px solid #0f172a;'
      + 'background:#fbbf24;border-radius:50%;transform:translate(-50%,-50%);'
      + 'box-shadow:0 0 0 2px #fff;pointer-events:none;z-index:20;display:none;';
    if (parent && getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
    if (parent) parent.appendChild(cursor);
    var logicalWidth = options.width || canvas.width || canvas.getBoundingClientRect().width;
    var logicalHeight = options.height || canvas.height || canvas.getBoundingClientRect().height;
    var x = logicalWidth / 2;
    var y = logicalHeight / 2;
    var lastTime = 0;
    var previousPressed = false;
    var stopped = false;
    var raf = null;

    function loop(now) {
      if (stopped) return;
      var pads = navigator.getGamepads();
      var pad = pads && Array.prototype.find.call(pads, function(item) { return item; });
      if (pad) {
        var dt = Math.min(40, lastTime ? now - lastTime : 16);
        lastTime = now;
        var dead = 0.18;
        var ax = Math.abs(pad.axes[0] || 0) > dead ? pad.axes[0] : 0;
        var ay = Math.abs(pad.axes[1] || 0) > dead ? pad.axes[1] : 0;
        ax += ((pad.buttons[15] && pad.buttons[15].pressed) ? 1 : 0)
          - ((pad.buttons[14] && pad.buttons[14].pressed) ? 1 : 0);
        ay += ((pad.buttons[13] && pad.buttons[13].pressed) ? 1 : 0)
          - ((pad.buttons[12] && pad.buttons[12].pressed) ? 1 : 0);
        x = Math.max(0, Math.min(logicalWidth, x + ax * dt * (options.speed || 0.45)));
        y = Math.max(0, Math.min(logicalHeight, y + ay * dt * (options.speed || 0.45)));
        var rect = canvas.getBoundingClientRect();
        cursor.style.display = 'block';
        cursor.style.left = (x / logicalWidth * rect.width) + 'px';
        cursor.style.top = (y / logicalHeight * rect.height) + 'px';
        var pressed = !!(pad.buttons[0] && pad.buttons[0].pressed);
        if (pressed && !previousPressed && typeof onSelect === 'function') {
          window.BatteryInput.current = 'gamepad';
          onSelect(x, y);
        }
        previousPressed = pressed;
      } else {
        cursor.style.display = 'none';
        previousPressed = false;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return function() {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
    };
  }

  return {
    withTimeout: withTimeout,
    requestMicrophone: requestMicrophone,
    stopRecorder: stopRecorder,
    revokeObjectUrl: revokeObjectUrl,
    decimateStroke: decimateStroke,
    installGamepadPointer: installGamepadPointer
  };
})();

/* ── Recoverable large artifacts (audio) ───────────────────── */
window.BatteryArtifactStore = (function() {
  var DB_NAME = 'cognitive-spatial-battery-artifacts-v1';
  var STORE_NAME = 'artifacts';

  function open() {
    if (!window.indexedDB) return Promise.reject(new Error('IndexedDB unavailable'));
    return window.BatteryReliability.withTimeout(new Promise(function(resolve, reject) {
      var request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function() {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
          request.result.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = function() { resolve(request.result); };
      request.onerror = function() { reject(request.error || new Error('IndexedDB open failed')); };
    }), 5000, 'Artifact storage');
  }

  function transaction(mode, action) {
    return open().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE_NAME, mode);
        var store = tx.objectStore(STORE_NAME);
        var request = action(store);
        request.onsuccess = function() { resolve(request.result); };
        request.onerror = function() { reject(request.error || new Error('Artifact operation failed')); };
        tx.oncomplete = function() { db.close(); };
        tx.onabort = function() { db.close(); };
      });
    });
  }

  function put(key, blob) {
    if (!key || !blob) return Promise.resolve(false);
    return transaction('readwrite', function(store) {
      return store.put({ blob: blob, savedAt: Date.now(), mimeType: blob.type || null }, key);
    }).then(function() {
      var match = String(key).match(/^battery\/([^/]+)\/(osr|asf|ovn)\/(.+)$/);
      if (match && window.BatteryRemoteSync) {
        var beforeUpload = typeof batteryCheckpointPayload === 'function'
          ? window.BatteryRemoteSync.queueCheckpoint(batteryCheckpointPayload())
          : Promise.resolve();
        beforeUpload.then(function() {
          window.BatteryRemoteSync.uploadArtifact(match[1], match[2], match[3], blob);
        });
      }
      return true;
    }).catch(function(error) {
      console.warn('Artifact could not be saved:', error);
      return false;
    });
  }

  function get(key) {
    return transaction('readonly', function(store) { return store.get(key); })
      .catch(function() { return null; });
  }

  return { put: put, get: get };
})();

function batteryArtifactKey(participantId, task, slot) {
  return 'battery/' + String(participantId || 'unknown') + '/' + task + '/' + slot;
}

function restoreBatteryArtifacts(participantId) {
  if (!participantId || !window.BatteryArtifactStore) return Promise.resolve(false);
  var jobs = [
    ['osr', 'immediate'], ['osr', 'delayed'], ['asf', 'main']
  ];
  for (var i = 0; i < 32; i += 1) jobs.push(['ovn', String(i)]);
  return Promise.all(jobs.map(function(job) {
    return window.BatteryArtifactStore.get(batteryArtifactKey(participantId, job[0], job[1]))
      .then(function(record) {
        if (!record || !record.blob) return;
        if (job[0] === 'osr' && window.OSRState) {
          window.OSRState.audio[job[1]] = record.blob;
          window.OSRState.audioUrls[job[1]] = URL.createObjectURL(record.blob);
        } else if (job[0] === 'asf' && window.ASFState) {
          window.ASFState.audio = record.blob;
          window.ASFState.audioUrl = URL.createObjectURL(record.blob);
        } else if (job[0] === 'ovn' && window.OVNState) {
          var index = Number(job[1]);
          window.OVNState.itemAudio[index] = record.blob;
          window.OVNState.itemAudioUrls[index] = URL.createObjectURL(record.blob);
        }
      });
  })).then(function() { return true; });
}

/* ── Global in-session data store ─────────────────────────── */
window.BatteryData = {
  participantId: '',
  sessionStart: null,
  trials: [],
  taskSummaries: {},
  batteryChoice: null,
  sessionStatus: 'in_progress',

  /* Push one or more row objects. Auto-stamps participant_id, timestamp, window. */
  addTrials(rows) {
    const stamp = getTimestamp();
    const win   = getWindowSize();
    const arr   = Array.isArray(rows) ? rows : [rows];
    arr.forEach(r => {
      r.participant_id      = this.participantId;
      r.timestamp           = r.timestamp || stamp;
      r.window_width_px     = win.width;
      r.window_height_px    = win.height;
      r.screen_width_px     = win.screenWidth;
      r.screen_height_px    = win.screenHeight;
      r.device_pixel_ratio  = win.devicePixelRatio;
      r.input_modality      = r.input_modality || window.BatteryInput.current;
      r.gamepad_connected   = window.BatteryInput.gamepadConnected;
      this.trials.push(r);
    });
    checkpointBatterySession();
  },

  setTaskSummary(taskName, obj) {
    this.taskSummaries[taskName] = obj;
    checkpointBatterySession();
  }
};

/* ── Helpers ──────────────────────────────────────────────── */
function getTimestamp() { return new Date().toISOString(); }

function getWindowSize() {
  return {
    width:  window.innerWidth,
    height: window.innerHeight,
    screenWidth:  window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1
  };
}

function euclideanDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/* Returns angle in degrees [0, 360), clockwise from east (right) */
function angleBetween(fromX, fromY, toX, toY) {
  let deg = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);
  return (deg + 360) % 360;
}

/* Signed angular error [-180, +180]. Positive = clockwise overshoot. */
function signedAngularError(chosen, correct) {
  let diff = chosen - correct;
  while (diff >  180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

/* Fisher-Yates shuffle (returns new array) */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mean(arr) {
  const v = arr.filter(x => x !== null && x !== undefined && !isNaN(x));
  if (!v.length) return null;
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function median(arr) {
  const v = arr.filter(x => x !== null && x !== undefined && !isNaN(x));
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/* ── Build battery-level summary ──────────────────────────── */
function buildSummary() {
  const bd = window.BatteryData;
  const osr = bd.taskSummaries['original_story_recall'] || {};
  const asf = bd.taskSummaries['animal_semantic_fluency'] || {};
  const vs = bd.taskSummaries['visual_sequencing_set_shifting'] || {};
  const ns = bd.taskSummaries['number_span'] || {};
  const ovn = bd.taskSummaries['original_visual_naming'] || {};
  const ocf = bd.taskSummaries['original_complex_figure'] || {};

  /* Object-Location Memory - main trials only */
  const olmTrials  = bd.trials.filter(r => r.task_name === 'object_location_memory' && r.trial_type === 'main');
  const olmErrors  = olmTrials.map(r => r.euclidean_error_px).filter(v => v != null && !isNaN(v));
  const olmNorm    = olmTrials.map(r => r.normalized_error).filter(v => v != null && !isNaN(v));
  const olmRT      = olmTrials.map(r => r.response_time_ms).filter(v => v != null && !isNaN(v));
  const olmMissing = olmTrials.filter(r => r.response_x == null).length;

  /* Block-wise mean errors */
  const olmBlockMeans = {};
  [1, 2, 3].forEach(b => {
    const bVals = olmTrials.filter(r => r.block_number === b)
                           .map(r => r.euclidean_error_px).filter(v => v != null && !isNaN(v));
    olmBlockMeans['olm_block_' + b + '_mean_error_px'] = mean(bVals);
  });

  /* Spatial Pointing - main trials only */
  const spTrials = bd.trials.filter(r => r.task_name === 'spatial_pointing' && r.practice_or_main === 'main');
  const spAbs    = spTrials.map(r => r.absolute_angular_error_degrees).filter(v => v != null && !isNaN(v));
  const spSigned = spTrials.map(r => r.signed_angular_error_degrees).filter(v => v != null && !isNaN(v));
  const spRT     = spTrials.map(r => r.response_time_ms).filter(v => v != null && !isNaN(v));

  const sessionEnd = new Date();
  const totalDur   = bd.sessionStart ? (sessionEnd - new Date(bd.sessionStart)) : null;

  return {
    participant_id: bd.participantId,
    session_start:  bd.sessionStart,
    session_end:    sessionEnd.toISOString(),
    total_battery_duration_ms: totalDur,
    pilot_mode: window.PILOT_MODE,

    /* Original Story Recall */
    osr_immediate_verbatim:  osr.osr_immediate_verbatim  ?? null,
    osr_delayed_verbatim:    osr.osr_delayed_verbatim    ?? null,
    osr_immediate_paraphrase: osr.osr_immediate_paraphrase ?? null,
    osr_delayed_paraphrase:   osr.osr_delayed_paraphrase   ?? null,
    osr_delay_duration_ms:    osr.osr_delay_duration_ms    ?? null,
    osr_delay_out_of_window:  osr.osr_delay_out_of_window  ?? null,
    osr_story_audio_standardized: osr.osr_story_audio_standardized ?? null,
    osr_task_version:         osr.osr_task_version         ?? null,
    osr_dictionary_version:   osr.osr_dictionary_version   ?? null,

    /* Animal Semantic Fluency */
    asf_total_valid_unique: asf.asf_total_valid_unique ?? null,
    asf_total_valid_unique_raw: asf.asf_total_valid_unique_raw ?? null,
    asf_repetitions: asf.asf_repetitions ?? null,
    asf_rule_violations: asf.asf_rule_violations ?? null,
    asf_uncertain_responses: asf.asf_uncertain_responses ?? null,
    asf_prompt_used: asf.asf_prompt_used ?? null,
    asf_ended_early: asf.asf_ended_early ?? null,
    asf_review_status: asf.asf_review_status ?? null,
    asf_task_version: asf.asf_task_version ?? null,
    asf_dictionary_version: asf.asf_dictionary_version ?? null,

    /* Original Visual Naming */
    ovn_total_with_semantic: ovn.ovn_total_with_semantic ?? null,
    ovn_total_uncued: ovn.ovn_total_uncued ?? null,
    ovn_items_administered: ovn.ovn_items_administered ?? null,
    ovn_review_status: ovn.ovn_review_status ?? null,
    ovn_task_version: ovn.ovn_task_version ?? null,

    /* Original Complex Figure */
    ocf_copy_score: ocf.ocf_copy_score ?? null,
    ocf_delayed_score: ocf.ocf_delayed_score ?? null,
    ocf_recognition_correct: ocf.ocf_recognition_correct ?? null,
    ocf_delay_duration_ms: ocf.ocf_delay_duration_ms ?? null,
    ocf_task_version: ocf.ocf_task_version ?? null,

    /* Visual Sequencing / Set-Shifting */
    completion_time_sequencing_ms:   vs.completion_time_sequencing_ms  ?? null,
    completion_time_set_shifting_ms: vs.completion_time_set_shifting_ms ?? null,
    set_shifting_cost_ms:            vs.set_shifting_cost_ms            ?? null,
    set_shifting_ratio:              vs.set_shifting_ratio              ?? null,
    errors_sequencing:               vs.errors_sequencing               ?? null,
    errors_set_shifting:             vs.errors_set_shifting             ?? null,

    /* Object-Location Memory */
    olm_mean_euclidean_error_px:    mean(olmErrors),
    olm_median_euclidean_error_px:  median(olmErrors),
    olm_mean_normalized_error:      mean(olmNorm),
    olm_response_time_mean_ms:      mean(olmRT),
    olm_missing_responses:          olmMissing,
    ...olmBlockMeans,

    /* Spatial Pointing */
    sp_mean_absolute_angular_error_deg:   mean(spAbs),
    sp_median_absolute_angular_error_deg: median(spAbs),
    sp_signed_bias_deg:                   mean(spSigned),
    sp_response_time_mean_ms:             mean(spRT),

    /* Number Span */
    ns_forward_span: ns.ns_forward_span ?? null,
    ns_backward_span: ns.ns_backward_span ?? null,
    ns_forward_correct_trials: ns.ns_forward_correct_trials ?? null,
    ns_backward_correct_trials: ns.ns_backward_correct_trials ?? null,
    ns_audio_standardized: ns.ns_audio_standardized ?? null,
    ns_task_version: ns.ns_task_version ?? null,
    ns_sequence_version: ns.ns_sequence_version ?? null,

    /* Browser/display info */
    window_width_px:    window.innerWidth,
    window_height_px:   window.innerHeight,
    screen_width_px:    window.screen.width,
    screen_height_px:   window.screen.height,
    device_pixel_ratio: window.devicePixelRatio || 1,
    user_agent:         navigator.userAgent
  };
}

/* ── CSV serialiser ───────────────────────────────────────── */
function toCSV(rows) {
  if (!rows || !rows.length) return '';
  /* Collect all unique keys across all rows for a stable header */
  const keySet = new Set();
  rows.forEach(r => Object.keys(r).forEach(k => keySet.add(k)));
  const keys = Array.from(keySet);
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return keys.join(',') + '\n' + rows.map(r => keys.map(k => escape(r[k])).join(',')).join('\n');
}

/* ── Download helper ──────────────────────────────────────── */
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 600);
}

/* ── Public export functions ──────────────────────────────── */
function exportAllCSV() {
  const pid  = window.BatteryData.participantId || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(toCSV(window.BatteryData.trials), pid + '_' + date + '_trials.csv', 'text/csv');
}

function exportAllJSON() {
  const pid  = window.BatteryData.participantId || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  const payload = { summary: buildSummary(), trials: window.BatteryData.trials, taskSummaries: window.BatteryData.taskSummaries };
  triggerDownload(JSON.stringify(payload, null, 2), pid + '_' + date + '_battery.json', 'application/json');
}

function exportTaskCSV(taskName) {
  const pid  = window.BatteryData.participantId || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  const rows = window.BatteryData.trials.filter(r => r.task_name === taskName);
  triggerDownload(toCSV(rows), pid + '_' + date + '_' + taskName + '.csv', 'text/csv');
}

function exportSummaryJSON() {
  const pid  = window.BatteryData.participantId || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(JSON.stringify(buildSummary(), null, 2), pid + '_' + date + '_summary.json', 'application/json');
}
