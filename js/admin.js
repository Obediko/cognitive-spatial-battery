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
  function scoreWithStatus(value, statusName, suffix) {
    if (value !== null && value !== undefined && !(typeof value === 'number' && isNaN(value))) {
      return summaryValue(value, suffix);
    }
    var labels = {
      provisional: 'Needs review: one or more responses are uncertain',
      unreviewed: 'Needs review: one or more responses are unclassified',
      deferred: 'Scoring was deferred',
      incomplete: 'Incomplete administration; no final score calculated'
    };
    return escapeHtml(labels[statusName] || 'Not scored yet');
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
      var asf = BatteryData.taskSummaries.animal_semantic_fluency || {};
      var ovn = BatteryData.taskSummaries.original_visual_naming || {};
      var target = document.getElementById('jspsych-content') || document.querySelector('.jspsych-content') || document.getElementById('jspsych-target');
      var etiRows = [];
      if (hasTask('original_story_recall')) etiRows.push(
        '<tr><td>Story Recall analogue, immediate: total units recalled, verbatim scoring</td><td>' + summaryValue(summary.osr_immediate_verbatim) + '</td><td>0–44</td></tr>',
        '<tr><td>Story Recall analogue, delayed: total units recalled, verbatim scoring</td><td>' + summaryValue(summary.osr_delayed_verbatim) + '</td><td>0–44</td></tr>');
      if (hasTask('animal_semantic_fluency')) etiRows.push('<tr><td>Animal Fluency analogue: total valid unique animals named in 60 seconds</td><td>'
        + scoreWithStatus(summary.asf_total_valid_unique, asf.asf_review_status) + '</td><td>0–77</td></tr>');
      if (hasTask('original_visual_naming')) etiRows.push('<tr><td>Visual Naming analogue: total correct without a cue</td><td>'
        + scoreWithStatus(summary.ovn_total_uncued, ovn.ovn_review_status) + '</td><td>0–32</td></tr>');
      if (hasTask('original_complex_figure')) etiRows.push(
        '<tr><td>Complex Figure analogue: total score for copy</td><td>' + summaryValue(summary.ocf_copy_score) + '</td><td>0–17</td></tr>',
        '<tr><td>Complex Figure analogue: total score following delay</td><td>' + summaryValue(summary.ocf_delayed_score) + '</td><td>0–17</td></tr>');
      if (hasTask('number_span')) etiRows.push(
        '<tr><td>Number Span forward analogue: number of correct trials</td><td>' + summaryValue(summary.ns_forward_correct_trials) + '</td><td>0–14</td></tr>',
        '<tr><td>Number Span backward analogue: number of correct trials</td><td>' + summaryValue(summary.ns_backward_correct_trials) + '</td><td>0–14</td></tr>');
      var extraSections = '';
      if (hasTask('visual_sequencing_set_shifting')) extraSections += '<h3>Trail comparators (not ETI inputs)</h3><table class="summary-table">'
        + '<tr><td>Trail A / Trail B analogue time</td><td>' + summaryValue(summary.completion_time_sequencing_ms == null ? null : summary.completion_time_sequencing_ms / 1000, ' sec')
        + ' / ' + summaryValue(summary.completion_time_set_shifting_ms == null ? null : summary.completion_time_set_shifting_ms / 1000, ' sec') + '</td></tr></table>';
      var spatialRows = [];
      if (hasTask('object_location_memory')) spatialRows.push('<tr><td>Object-Location Memory mean error</td><td>' + summaryValue(summary.olm_mean_euclidean_error_px, ' px') + '</td></tr>');
      if (hasTask('spatial_pointing')) spatialRows.push('<tr><td>Spatial Pointing mean absolute error</td><td>' + summaryValue(summary.sp_mean_absolute_angular_error_deg, '°') + '</td></tr>');
      if (spatialRows.length) extraSections += '<h3>Additional spatial outcomes (not ETI inputs)</h3><table class="summary-table">' + spatialRows.join('') + '</table>';
      target.innerHTML = '<div class="osr-card individual-result" style="max-width:900px;margin:0 auto;"><span class="osr-kicker">Examiner checkpoint</span>'
        + '<h2>Review complete</h2><p>Participant ID: <strong>' + escapeHtml(BatteryData.participantId) + '</strong></p>'
        + '<h3>Eight ETI analogue inputs</h3><p class="osr-fineprint">NACC-style raw-score labels and ranges. These original tasks are analogues, not NACC instrument scores.</p>'
        + '<table class="summary-table"><tr><th>Measure</th><th>Raw value</th><th>Expected range</th></tr>' + etiRows.join('') + '</table>'
        + '<div class="info-box"><p><strong>How to read these values:</strong> Story Recall counts verified details out of 44. Animal Fluency counts distinct valid animal names. Visual Naming counts pictures named correctly without help. Complex Figure counts reproduced elements out of 17. Number Span counts correctly repeated trials in each direction.</p>'
        + '<p>These are task scores, not diagnoses or norm-referenced interpretations.</p></div>'
        + extraSections
        + '<div style="display:flex;gap:.6rem;flex-wrap:wrap;justify-content:center;margin-top:1rem;">'
        + '<button class="battery-btn download" id="admin-export-csv">Download trials CSV</button>'
        + '<button class="battery-btn download" id="admin-export-json">Download full JSON</button>'
        + '<button class="battery-btn download" id="admin-export-summary">Download summary JSON</button>'
        + '<button class="battery-btn download" id="admin-export-package">Download research package</button>'
        + '<button class="battery-btn" id="admin-print-individual">Print individual result</button></div>'
        + '<p class="osr-fineprint">Verified scoring has been synchronized. Automatic suggestions remain provisional unless examiner-verified.</p>'
        + '<p><a href="admin.html">Return to session list</a></p></div>';
      document.getElementById('admin-export-csv').onclick = exportAllCSV;
      document.getElementById('admin-export-json').onclick = exportAllJSON;
      document.getElementById('admin-export-summary').onclick = exportSummaryJSON;
      document.getElementById('admin-export-package').onclick = function() {
        if (window.BatteryReporting) window.BatteryReporting.exportResearchPackage();
      };
      document.getElementById('admin-print-individual').onclick = function() { window.print(); };
    }};
  }
  function buildReviewTimeline(alreadyReviewed) {
    var timeline = [{ type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">Examiner only</span><h2>Scoring checkpoint</h2>'
        + '<p>Session <strong>' + escapeHtml(BatteryData.participantId) + '</strong> is loaded.</p>'
        + '<div class="warning-box">Confirm that the participant can no longer see or operate this screen.</div></div>',
      choices: [alreadyReviewed ? 'Review and rescore session' : 'Begin examiner review'], data: { battery_phase: 'admin_checkpoint' } }];
    if (hasTask('original_story_recall')) timeline = timeline.concat(buildOSRReviewTimeline());
    if (hasTask('animal_semantic_fluency')) timeline = timeline.concat(buildAnimalFluencyReviewTimeline());
    if (hasTask('original_visual_naming')) timeline = timeline.concat(buildOriginalVisualNamingReviewTimeline());
    if (hasTask('original_complex_figure')) timeline = timeline.concat(buildOCFReviewTimeline());
    timeline.push(adminCompletionTrial()); return timeline;
  }
  function startLoadedReview(priorStatus) {
    var alreadyReviewed = priorStatus === 'examiner_review_complete';
    BatteryData.sessionStatus = 'examiner_review_in_progress';
    checkpointBatterySession();
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
    if (!confirm('Permanently delete the remote session for ' + participantId + ' and all of its uploaded recordings and drawings? This cannot be undone.')) return;
    var password = prompt('Re-enter the admin password to confirm deletion:');
    if (!password) return;
    api('/api/admin-sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, password: password }) }).then(function() {
        status('Remote session and uploaded artifacts deleted.'); return refreshRemote();
      }).catch(function(error) { status(error.message); });
  }
  function deleteLocal(participantId) {
    if (!confirm('Permanently delete the local session for ' + participantId + ' and all recordings stored in this browser? This cannot be undone.')) return;
    status('Deleting local session…');
    BatteryArtifactStore.deleteParticipant(participantId).then(function() {
      localStorage.removeItem('csb-recovery-v1:' + encodeURIComponent(participantId));
      status('Local session and browser artifacts deleted.');
      renderLocal();
    }).catch(function(error) { status('Local deletion failed: ' + error.message); });
  }
  function renderRemote() {
    var box = document.getElementById('admin-remote-session-list');
    if (!remoteSessions.length) { box.innerHTML = '<p class="osr-fineprint">No remote sessions found.</p>'; return; }
    box.innerHTML = remoteSessions.map(function(s) {
      return '<div style="display:flex;gap:.5rem;align-items:center;margin:.45rem 0;"><button class="battery-btn primary remote-load" data-id="'
        + escapeHtml(s.remoteId) + '" style="flex:1;display:flex;justify-content:space-between;"><strong>'
        + escapeHtml(s.participantId) + '</strong><span>' + escapeHtml(s.sessionStatus) + ' · ' + s.trialCount + ' rows</span></button>'
        + '<button class="battery-btn remote-delete" data-id="' + escapeHtml(s.remoteId)
        + '" data-pid="' + escapeHtml(s.participantId) + '">Delete remote</button></div>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.remote-load'), function(b) { b.onclick = function() { loadRemote(b.dataset.id); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.remote-delete'), function(b) { b.onclick = function() { deleteRemote(b.dataset.id, b.dataset.pid); }; });
  }
  function renderLocal() {
    var sessions = listBatteryCheckpoints(), box = document.getElementById('admin-local-session-list');
    if (!sessions.length) { box.innerHTML = '<p class="osr-fineprint">No local sessions found.</p>'; return; }
    box.innerHTML = sessions.map(function(s) { return '<div style="display:flex;gap:.5rem;align-items:center;margin:.45rem 0;">'
      + '<button class="battery-btn local-load" data-pid="' + escapeHtml(s.participantId)
      + '" style="display:flex;flex:1;justify-content:space-between;"><strong>' + escapeHtml(s.participantId)
      + '</strong><span>' + escapeHtml(s.sessionStatus) + ' · ' + s.trialCount + ' rows</span></button>'
      + '<button class="battery-btn local-delete" data-pid="' + escapeHtml(s.participantId) + '">Delete local</button></div>'; }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.local-load'), function(b) { b.onclick = function() { startLocal(b.dataset.pid); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.local-delete'), function(b) { b.onclick = function() { deleteLocal(b.dataset.pid); }; });
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
  function localCheckpoints() {
    return listBatteryCheckpoints().map(function(item) {
      try { return JSON.parse(localStorage.getItem('csb-recovery-v1:' + encodeURIComponent(item.participantId))); }
      catch (error) { return null; }
    }).filter(Boolean);
  }
  function allCheckpoints() {
    status('Preparing collective results…');
    return Promise.all(remoteSessions.map(function(session) {
      return api('/api/admin-sessions?id=' + encodeURIComponent(session.remoteId)).then(function(data) { return data.checkpoint; });
    })).then(function(remote) {
      var seen = {};
      var combined = [];
      remote.concat(localCheckpoints()).forEach(function(checkpoint) {
        var key = String(checkpoint.participantId) + '|' + String(checkpoint.sessionStart || '');
        if (!seen[key]) { seen[key] = true; combined.push(checkpoint); }
      });
      status(combined.length + ' unique session result' + (combined.length === 1 ? '' : 's') + ' prepared.');
      return combined;
    });
  }
  function printCollective(checkpoints, printWindow) {
    var rows = window.BatteryReporting.collectiveRows(checkpoints);
    var definitions = window.BatteryReporting.definitions();
    var ids = definitions.map(function(def) { return def.measure_id; }).filter(function(id) {
      return rows.some(function(row) { return Object.prototype.hasOwnProperty.call(row, id); });
    });
    var labels = {};
    definitions.forEach(function(def) { labels[def.measure_id] = def.definition; });
    var html = '<!doctype html><html><head><title>Collective cognitive battery results</title><style>'
      + 'body{font-family:Arial,sans-serif;color:#111;padding:24px}table{border-collapse:collapse;width:100%;font-size:11px}'
      + 'th,td{border:1px solid #777;padding:6px;text-align:left;vertical-align:top}th{background:#eee}h1{font-size:20px}'
      + '@media print{body{padding:0}@page{size:landscape;margin:10mm}}</style></head><body><h1>Collective cognitive battery results</h1>'
      + '<p>One row per unique participant session. Only measures administered in at least one included session are shown.</p><table><thead><tr><th>Participant ID</th>'
      + ids.map(function(id) { return '<th>' + escapeHtml(labels[id] || id) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + rows.map(function(row) { return '<tr><td>' + escapeHtml(row.participant_id) + '</td>' + ids.map(function(id) {
        var value = Object.prototype.hasOwnProperty.call(row, id) ? row[id] : 'Not administered';
        return '<td>' + escapeHtml(value == null ? 'Needs review / incomplete' : value) + '</td>';
      }).join('') + '</tr>'; }).join('') + '</tbody></table></body></html>';
    printWindow.document.open(); printWindow.document.write(html); printWindow.document.close();
    printWindow.focus(); setTimeout(function() { printWindow.print(); }, 250);
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
    document.getElementById('admin-collective-csv').onclick = function() {
      allCheckpoints().then(function(checkpoints) {
        if (!checkpoints.length) return status('No sessions are available to export.');
        window.BatteryReporting.exportCollectiveCSV(checkpoints);
      }).catch(function(error) { status('Collective export failed: ' + error.message); });
    };
    document.getElementById('admin-collective-print').onclick = function() {
      var printWindow = window.open('', '_blank');
      if (!printWindow) return status('The browser blocked the print window. Allow pop-ups and try again.');
      printWindow.document.write('<p style="font-family:Arial;padding:2rem;">Preparing collective results…</p>');
      allCheckpoints().then(function(checkpoints) {
        if (!checkpoints.length) { printWindow.close(); return status('No sessions are available to print.'); }
        printCollective(checkpoints, printWindow);
      }).catch(function(error) { printWindow.close(); status('Collective printing failed: ' + error.message); });
    };
    refreshRemote();
  });
})();
