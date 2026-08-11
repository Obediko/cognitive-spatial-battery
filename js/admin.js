/* ============================================================
   admin.js - same-origin examiner scoring checkpoint
   ============================================================ */
'use strict';

(function() {
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hasTask(taskName) {
    return window.BatteryData.trials.some(function(row) { return row.task_name === taskName; });
  }

  function summaryValue(value, suffix) {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return 'Not scored';
    return escapeHtml(value) + (suffix || '');
  }

  function adminCompletionTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function() {
        window.BatteryData.sessionStatus = 'examiner_review_complete';
        checkpointBatterySession();
        var summary = buildSummary();
        var target = document.getElementById('jspsych-content') ||
          document.querySelector('.jspsych-content') || document.getElementById('jspsych-target');
        target.innerHTML = '<div class="osr-card" style="max-width:900px;margin:0 auto;">'
          + '<span class="osr-kicker">Examiner checkpoint</span><h2>Review complete</h2>'
          + '<p>Participant ID: <strong>' + escapeHtml(window.BatteryData.participantId) + '</strong></p>'
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
          + '<button class="battery-btn download" id="admin-export-summary">Download summary JSON</button>'
          + '</div><p class="osr-fineprint">Automatic suggestions remain provisional unless the task screen recorded examiner verification.</p>'
          + '<p><a href="admin.html">Return to local session list</a></p></div>';
        document.getElementById('admin-export-csv').onclick = exportAllCSV;
        document.getElementById('admin-export-json').onclick = exportAllJSON;
        document.getElementById('admin-export-summary').onclick = exportSummaryJSON;
      }
    };
  }

  function buildReviewTimeline(alreadyReviewed) {
    var timeline = [{
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">Examiner only</span>'
        + '<h2>Local scoring checkpoint</h2><p>Session <strong>' + escapeHtml(window.BatteryData.participantId) + '</strong> is loaded.</p>'
        + '<div class="warning-box">Confirm that the participant can no longer see or operate this screen.</div></div>',
      choices: ['Begin examiner review'],
      data: { battery_phase: 'admin_checkpoint' }
    }];

    if (!alreadyReviewed) {
      if (hasTask('original_story_recall')) timeline = timeline.concat(buildOSRReviewTimeline());
      if (hasTask('animal_semantic_fluency')) timeline = timeline.concat(buildAnimalFluencyReviewTimeline());
      if (hasTask('original_visual_naming')) timeline = timeline.concat(buildOriginalVisualNamingReviewTimeline());
      if (hasTask('original_complex_figure')) timeline = timeline.concat(buildOCFReviewTimeline());
    }
    timeline.push(adminCompletionTrial());
    return timeline;
  }

  function startReview(participantId) {
    var status = document.getElementById('admin-status');
    participantId = String(participantId || '').trim();
    if (!participantId) {
      status.textContent = 'Enter a participant ID.';
      return;
    }
    status.textContent = 'Loading local checkpoint and recordings…';
    if (!loadBatteryCheckpoint(participantId, { confirm: false })) {
      status.textContent = 'No local checkpoint was found for that ID on this browser and site.';
      return;
    }
    var priorStatus = window.BatteryData.sessionStatus;
    if (priorStatus === 'in_progress' &&
        !window.confirm('This checkpoint is marked in progress. Open it for recovery scoring anyway?')) {
      status.textContent = 'Scoring was not opened.';
      return;
    }

    restoreBatteryArtifacts(participantId).then(function() {
      var alreadyReviewed = priorStatus === 'examiner_review_complete';
      if (!alreadyReviewed) {
        window.BatteryData.sessionStatus = 'examiner_review_in_progress';
        checkpointBatterySession();
      }
      document.getElementById('admin-shell').hidden = true;
      var jsPsych = initJsPsych({
        display_element: 'jspsych-target',
        on_finish: function() {}
      });
      jsPsych.run(buildReviewTimeline(alreadyReviewed));
    }).catch(function(error) {
      status.textContent = 'The checkpoint loaded, but recordings could not be restored: '
        + (error && error.message ? error.message : 'unknown error');
    });
  }

  function renderSessions() {
    var container = document.getElementById('admin-session-list');
    var sessions = listBatteryCheckpoints();
    if (!sessions.length) {
      container.innerHTML = '<p class="osr-fineprint">No local sessions were found on this browser and site.</p>';
      return;
    }
    container.innerHTML = sessions.map(function(session) {
      return '<button class="battery-btn admin-session-button" data-participant-id="' + escapeHtml(session.participantId) + '" '
        + 'style="display:flex;width:100%;justify-content:space-between;margin:.4rem 0;">'
        + '<strong>' + escapeHtml(session.participantId) + '</strong><span>'
        + escapeHtml(session.sessionStatus) + ' · ' + session.trialCount + ' rows'
        + (session.savedAt ? ' · ' + escapeHtml(new Date(session.savedAt).toLocaleString()) : '')
        + '</span></button>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.admin-session-button'), function(button) {
      button.onclick = function() {
        var participantId = button.getAttribute('data-participant-id');
        document.getElementById('admin-participant-id').value = participantId;
        startReview(participantId);
      };
    });
  }

  window.addEventListener('load', function() {
    renderSessions();
    document.getElementById('admin-load-session').onclick = function() {
      startReview(document.getElementById('admin-participant-id').value);
    };
  });
})();
