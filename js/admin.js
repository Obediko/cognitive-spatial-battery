/* Authenticated cross-device examiner scoring checkpoint. */
'use strict';
(function() {
  var remoteSessions = [];

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function status(message) { document.getElementById('admin-status').textContent = message || ''; }
  function api(path, options) {
    return fetch(path, Object.assign({ credentials: 'same-origin' }, options || {})).then(function(response) {
      if (!response.ok) return response.json().catch(function() { return {}; }).then(function(body) {
        var error = new Error(body.error || ('Request failed (' + response.status + ')'));
        error.status = response.status; throw error;
      });
      return response.status === 204 ? null : response.json();
    });
  }
  function hasTask(name) { return window.BatteryData.trials.some(function(row) { return row.task_name === name; }); }
  function summaryValue(value, suffix) {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return 'Not scored';
    return escapeHtml(value) + (suffix || '');
  }
  function checkpointPayload() {
    return {
      saved_at: getTimestamp(), participantId: BatteryData.participantId,
      sessionStart: BatteryData.sessionStart, trials: BatteryData.trials,
      taskSummaries: BatteryData.taskSummaries, batteryChoice: BatteryData.batteryChoice || null,
      sessionStatus: BatteryData.sessionStatus || 'in_progress',
      taskState: { ocfCopyCompletedAt: window.OCFState ? window.OCFState.copyCompletedAt : null }
    };
  }
  function adminCompletionTrial() {
    return { type: jsPsychCallFunction, async: true, func: function() {
      BatteryData.sessionStatus = 'examiner_review_complete';
      checkpointBatterySession();
      var summary = buildSummary();
      var target = document.getElementById('jspsych-content') || document.querySelector('.jspsych-content') || document.getElementById('jspsych-target');
      target.innerHTML = '<div class="osr-card" style="max-width:900px;margin:0 auto;"><span class="osr-kicker">Examiner checkpoint</span>'
        + '<h2>Review complete</h2><p>Participant ID: <strong>' + escapeHtml(BatteryData.participantId) + '</strong></p>'
        + '<table class="summary-table"><tr><th>Measure</th><th>Verified/provisional value</th></tr>'
        + '<tr><td>Story immediate verbatim</td><td>' + summaryValue(summary.osr_immediate_verbatim, ' / 44') + '</td></tr>'
        + '<tr><td>Story delayed verbatim</td><td>' + summaryValue(summary.osr_delayed_verbatim, ' / 44') + '</td></tr>'
        + '<tr><td>Animal Fluency</td><td>' + summaryValue(summary.asf_total_valid_unique) + '</td></tr>'
        + '<tr><td>Visual Naming uncued</td><td>' + summaryValue(summary.ovn_total_uncued) + '</td></tr>'
        + '<tr><td>Complex Figure copy</td><td>' + summaryValue(summary.ocf_copy_score, ' / 17') + '</td></tr>'
        + '<tr><td>Complex Figure delayed</td><td>' + summaryValue(summary.ocf_delayed_score, ' / 17') + '</td></tr>'
        + '<tr><td>Number Span forward / backward</td><td>' + summaryValue(summary.ns_forward_span)
        + ' / ' + summaryValue(summary.ns_backward_span) + '</td></tr>'
        + '<tr><td>Sequencing / set-shifting time</td><td>' + summaryValue(summary.completion_time_sequencing_ms, ' ms')
        + ' / ' + summaryValue(summary.completion_time_set_shifting_ms, ' ms') + '</td></tr>'
        + '<tr><td>Object-Location Memory mean error</td><td>' + summaryValue(summary.olm_mean_euclidean_error_px, ' px') + '</td></tr>'
        + '<tr><td>Spatial Pointing mean absolute error</td><td>' + summaryValue(summary.sp_mean_absolute_angular_error_deg, '°') + '</td></tr></table>'
        + '<div style="display:flex;gap:.6rem;flex-wrap:wrap;justify-content:center;margin-top:1rem;">'
        + '<button class="battery-btn download" id="admin-export-csv">Download trials CSV</button>'
        + '<button class="battery-btn download" id="admin-export-json">Download full JSON</button>'
        + '<button class="battery-btn download" id="admin-export-summary">Download summary JSON</button></div>'
        + '<p class="osr-fineprint">Verified scoring has been synchronized. Automatic suggestions remain provisional unless examiner-verified.</p>'
        + '<p><a href="admin.html">Return to session list</a></p></div>';
      document.getElementById('admin-export-csv').onclick = exportAllCSV;
      document.getElementById('admin-export-json').onclick = exportAllJSON;
      document.getElementById('admin-export-summary').onclick = exportSummaryJSON;
    }};
  }
  function buildReviewTimeline(alreadyReviewed) {
    var timeline = [{ type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">Examiner only</span><h2>Scoring checkpoint</h2>'
        + '<p>Session <strong>' + escapeHtml(BatteryData.participantId) + '</strong> is loaded.</p>'
        + '<div class="warning-box">Confirm that the participant can no longer see or operate this screen.</div></div>',
      choices: ['Begin examiner review'], data: { battery_phase: 'admin_checkpoint' } }];
    if (!alreadyReviewed) {
      if (hasTask('original_story_recall')) timeline = timeline.concat(buildOSRReviewTimeline());
      if (hasTask('animal_semantic_fluency')) timeline = timeline.concat(buildAnimalFluencyReviewTimeline());
      if (hasTask('original_visual_naming')) timeline = timeline.concat(buildOriginalVisualNamingReviewTimeline());
      if (hasTask('original_complex_figure')) timeline = timeline.concat(buildOCFReviewTimeline());
    }
    timeline.push(adminCompletionTrial()); return timeline;
  }
  function startLoadedReview(priorStatus) {
    var alreadyReviewed = priorStatus === 'examiner_review_complete';
    if (!alreadyReviewed) { BatteryData.sessionStatus = 'examiner_review_in_progress'; checkpointBatterySession(); }
    document.getElementById('admin-shell').hidden = true;
    initJsPsych({ display_element: 'jspsych-target', on_finish: function() {} }).run(buildReviewTimeline(alreadyReviewed));
  }
  function startLocal(participantId) {
    if (!loadBatteryCheckpoint(participantId, { confirm: false })) return status('No local checkpoint was found.');
    var prior = BatteryData.sessionStatus;
    restoreBatteryArtifacts(participantId).then(function() { startLoadedReview(prior); })
      .catch(function(error) { status('Recordings could not be restored: ' + error.message); });
  }
  function installRemoteCheckpoint(data) {
    var saved = data.checkpoint;
    BatteryRemoteSync.setAdminRemoteId(data.session.remoteId);
    localStorage.setItem('csb-recovery-v1:' + encodeURIComponent(saved.participantId), JSON.stringify(saved));
    return Promise.all((data.artifactKeys || []).map(function(key) {
      return fetch('/api/admin-artifact?id=' + encodeURIComponent(data.session.remoteId) + '&key=' + encodeURIComponent(key),
        { credentials: 'same-origin' }).then(function(response) {
          if (!response.ok) throw new Error('An audio artifact could not be downloaded.');
          return response.blob();
        }).then(function(blob) {
          var parts = key.split('/');
          return BatteryArtifactStore.put(batteryArtifactKey(saved.participantId, parts[0], parts[1]), blob);
        });
    })).then(function() {
      if (!loadBatteryCheckpoint(saved.participantId, { confirm: false })) throw new Error('Remote checkpoint could not be opened.');
      return restoreBatteryArtifacts(saved.participantId).then(function() { startLoadedReview(saved.sessionStatus); });
    });
  }
  function loadRemote(id) {
    status('Downloading checkpoint and recordings…');
    api('/api/admin-sessions?id=' + encodeURIComponent(id)).then(installRemoteCheckpoint)
      .catch(function(error) { status(error.message); });
  }
  function deleteRemote(id, participantId) {
    if (!confirm('Delete the ongoing session for ' + participantId + ' and all of its remote recordings? This cannot be undone.')) return;
    var password = prompt('Re-enter the admin password to confirm deletion:');
    if (!password) return;
    api('/api/admin-sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, password: password }) }).then(function() {
        status('Ongoing session deleted.'); return refreshRemote();
      }).catch(function(error) { status(error.message); });
  }
  function renderRemote() {
    var box = document.getElementById('admin-remote-session-list');
    if (!remoteSessions.length) { box.innerHTML = '<p class="osr-fineprint">No remote sessions found.</p>'; return; }
    box.innerHTML = remoteSessions.map(function(s) {
      var ongoing = ['in_progress','examiner_review_in_progress','scoring_in_progress'].indexOf(s.sessionStatus) >= 0;
      return '<div style="display:flex;gap:.5rem;align-items:center;margin:.45rem 0;"><button class="battery-btn primary remote-load" data-id="'
        + escapeHtml(s.remoteId) + '" style="flex:1;display:flex;justify-content:space-between;"><strong>'
        + escapeHtml(s.participantId) + '</strong><span>' + escapeHtml(s.sessionStatus) + ' · ' + s.trialCount + ' rows</span></button>'
        + (ongoing ? '<button class="battery-btn remote-delete" data-id="' + escapeHtml(s.remoteId)
        + '" data-pid="' + escapeHtml(s.participantId) + '">Delete ongoing</button>' : '') + '</div>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.remote-load'), function(b) { b.onclick = function() { loadRemote(b.dataset.id); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.remote-delete'), function(b) { b.onclick = function() { deleteRemote(b.dataset.id, b.dataset.pid); }; });
  }
  function renderLocal() {
    var sessions = listBatteryCheckpoints(), box = document.getElementById('admin-local-session-list');
    if (!sessions.length) { box.innerHTML = '<p class="osr-fineprint">No local sessions found.</p>'; return; }
    box.innerHTML = sessions.map(function(s) { return '<button class="battery-btn local-load" data-pid="' + escapeHtml(s.participantId)
      + '" style="display:flex;width:100%;justify-content:space-between;margin:.4rem 0;"><strong>' + escapeHtml(s.participantId)
      + '</strong><span>' + escapeHtml(s.sessionStatus) + ' · ' + s.trialCount + ' rows</span></button>'; }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.local-load'), function(b) { b.onclick = function() { startLocal(b.dataset.pid); }; });
  }
  function refreshRemote() {
    return api('/api/admin-sessions').then(function(data) {
      remoteSessions = data.sessions || []; renderRemote(); renderLocal();
      document.getElementById('admin-login-panel').hidden = true;
      document.getElementById('admin-sessions-panel').hidden = false;
    }).catch(function(error) {
      if (error.status !== 401) document.getElementById('admin-login-panel').querySelector('.warning-box').textContent = error.message;
    });
  }
  window.addEventListener('load', function() {
    document.getElementById('admin-login').onclick = function() {
      var input = document.getElementById('admin-password');
      api('/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input.value }) }).then(function() { input.value = ''; return refreshRemote(); })
        .catch(function(error) { input.value = ''; document.getElementById('admin-login-panel').querySelector('.warning-box').textContent = error.message; });
    };
    document.getElementById('admin-logout').onclick = function() {
      api('/api/admin-login', { method: 'DELETE' }).finally(function() { location.reload(); });
    };
    refreshRemote();
  });
})();
