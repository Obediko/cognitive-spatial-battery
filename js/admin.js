/* Authenticated cross-device examiner scoring checkpoint. */
'use strict';
(function() {
  var remoteSessions = [];
  var PENDING_SESSION_KEY = 'csb-admin-pending-session';

  function adminGerman() {
    return !!(window.BatteryLanguage && window.BatteryLanguage.get() === 'de');
  }
  function tr(english, german) { return adminGerman() ? german : english; }
  function setText(id, english, german) {
    var element = document.getElementById(id);
    if (element) element.textContent = tr(english, german);
  }
  function sessionStatusLabel(value) {
    var labels = {
      in_progress: tr('In progress', 'Läuft'),
      participant_complete: tr('Participant testing complete', 'Teilnehmendentest abgeschlossen'),
      examiner_review_in_progress: tr('Examiner review in progress', 'Auswertung läuft'),
      examiner_review_complete: tr('Examiner review complete', 'Auswertung abgeschlossen')
    };
    return labels[value] || value || tr('Unknown status', 'Unbekannter Status');
  }
  function applyAdminShellLanguage() {
    document.title = tr('Examiner Scoring Checkpoint — Cognitive Spatial Battery', 'Auswertungsportal für Prüfpersonen — Cognitive Spatial Battery');
    setText('admin-kicker', 'Authenticated examiner checkpoint', 'Authentifizierter Prüfpersonen-Checkpoint');
    setText('admin-title', 'Scoring portal', 'Auswertungsportal');
    setText('admin-language-note',
      'This is the same examiner portal for English and German sessions. Loading a session automatically switches the review interface to the language used for that session.',
      'Dies ist dasselbe Auswertungsportal für englische und deutsche Sitzungen. Beim Laden einer Sitzung wechselt die Auswertungsoberfläche automatisch in die Sprache, in der die Sitzung durchgeführt wurde.');
    setText('admin-login-warning', 'Examiner access is restricted. Use the admin password configured privately in Netlify.',
      'Der Zugriff ist auf Prüfpersonen beschränkt. Verwenden Sie das in Netlify privat konfigurierte Admin-Passwort.');
    setText('admin-password-label', 'Admin password', 'Admin-Passwort');
    setText('admin-login', 'Sign in', 'Anmelden');
    setText('admin-remote-note', 'Remote sessions are synchronized through encrypted Netlify Blobs storage.',
      'Remote-Sitzungen werden über den verschlüsselten Netlify-Blobs-Speicher synchronisiert.');
    setText('admin-logout', 'Sign out', 'Abmelden');
    setText('admin-collective-csv', 'Download collective results CSV', 'Gesamtergebnisse als CSV herunterladen');
    setText('admin-collective-print', 'Print collective results', 'Gesamtergebnisse drucken');
    setText('admin-remote-heading', 'Cross-device sessions', 'Geräteübergreifende Sitzungen');
    setText('admin-local-heading', 'Sessions on this browser', 'Sitzungen in diesem Browser');
    setText('admin-return-participant', 'Return to participant battery', 'Zur Testbatterie zurückkehren');
    var en = document.getElementById('admin-language-en');
    var de = document.getElementById('admin-language-de');
    if (en) en.classList.toggle('primary', !adminGerman());
    if (de) de.classList.toggle('primary', adminGerman());
    if (en) en.setAttribute('aria-pressed', adminGerman() ? 'false' : 'true');
    if (de) de.setAttribute('aria-pressed', adminGerman() ? 'true' : 'false');
  }

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
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return tr('Not scored', 'Nicht bewertet');
    return escapeHtml(value) + (suffix || '');
  }
  function scoreWithStatus(value, statusName, suffix) {
    if (value !== null && value !== undefined && !(typeof value === 'number' && isNaN(value))) {
      return summaryValue(value, suffix);
    }
    var labels = {
      provisional: tr('Needs review: one or more responses are uncertain', 'Prüfung erforderlich: mindestens eine Antwort ist unsicher'),
      unreviewed: tr('Needs review: one or more responses are unclassified', 'Prüfung erforderlich: mindestens eine Antwort ist nicht klassifiziert'),
      deferred: tr('Scoring was deferred', 'Die Auswertung wurde zurückgestellt'),
      incomplete: tr('Incomplete administration; no final score calculated', 'Unvollständige Durchführung; kein Endscore berechnet')
    };
    return escapeHtml(labels[statusName] || tr('Not scored yet', 'Noch nicht bewertet'));
  }
  function outstandingReviews() {
    var pending = [];
    if (hasTask('original_story_recall')) {
      var storyRows = BatteryData.trials.filter(function(row) {
        return row.task_name === 'original_story_recall' && row.phase === 'free_recall';
      });
      if (storyRows.some(function(row) { return row.review_status !== 'examiner_verified'; })) pending.push(tr('Story Recall', 'Geschichtenwiedergabe'));
    }
    var animal = BatteryData.taskSummaries.animal_semantic_fluency || {};
    if (hasTask('animal_semantic_fluency') && ['deferred', 'unreviewed', 'provisional'].indexOf(animal.asf_review_status) !== -1) {
      pending.push(tr('Animal Fluency', 'Tierflüssigkeit'));
    }
    var naming = BatteryData.taskSummaries.original_visual_naming || {};
    if (hasTask('original_visual_naming') && ['deferred', 'unreviewed', 'provisional'].indexOf(naming.ovn_review_status) !== -1) {
      pending.push(tr('Visual Naming', 'Visuelles Benennen'));
    }
    return pending;
  }
  function renderAdminResults(markComplete) {
    var pendingReviews = outstandingReviews();
    if (markComplete) {
      if (pendingReviews.length) {
        BatteryData.sessionStatus = 'examiner_review_in_progress';
        BatteryData.reviewCompletedAt = null;
      } else {
        BatteryData.sessionStatus = 'examiner_review_complete';
        BatteryData.reviewCompletedAt = getTimestamp();
      }
      checkpointBatterySession();
    }
    var summary = buildSummary();
    var asf = BatteryData.taskSummaries.animal_semantic_fluency || {};
    var ovn = BatteryData.taskSummaries.original_visual_naming || {};
    var target = document.getElementById('jspsych-content') || document.querySelector('.jspsych-content') || document.getElementById('jspsych-target');
    var etiRows = [];
    if (hasTask('original_story_recall')) etiRows.push(
      '<tr><td>' + tr('Story Recall analogue, immediate: total units recalled, verbatim scoring', 'Geschichtenwiedergabe-Analogwert, sofort: erinnerte Einheiten, wörtliche Bewertung') + '</td><td>' + summaryValue(summary.osr_immediate_verbatim) + '</td><td>0–44</td></tr>',
      '<tr><td>' + tr('Story Recall analogue, delayed: total units recalled, verbatim scoring', 'Geschichtenwiedergabe-Analogwert, verzögert: erinnerte Einheiten, wörtliche Bewertung') + '</td><td>' + summaryValue(summary.osr_delayed_verbatim) + '</td><td>0–44</td></tr>');
    if (hasTask('animal_semantic_fluency')) etiRows.push('<tr><td>' + tr('Animal Fluency analogue: total valid unique animals named in 60 seconds', 'Tierflüssigkeits-Analogwert: gültige eindeutige Tiernamen in 60 Sekunden') + '</td><td>'
      + scoreWithStatus(summary.asf_total_valid_unique, asf.asf_review_status) + '</td><td>0–77</td></tr>');
    if (hasTask('original_visual_naming')) etiRows.push('<tr><td>' + tr('Visual Naming analogue: total correct without a cue', 'Analogwert Visuelles Benennen: insgesamt richtig ohne Hinweis') + '</td><td>'
      + scoreWithStatus(summary.ovn_total_uncued, ovn.ovn_review_status) + '</td><td>0–32</td></tr>');
    if (hasTask('original_complex_figure')) etiRows.push(
      '<tr><td>' + tr('Complex Figure analogue: total score for copy', 'Komplexe-Figur-Analogwert: Gesamtscore Kopie') + '</td><td>' + summaryValue(summary.ocf_copy_score) + '</td><td>0–17</td></tr>',
      '<tr><td>' + tr('Complex Figure analogue: total score following delay', 'Komplexe-Figur-Analogwert: Gesamtscore nach Verzögerung') + '</td><td>' + summaryValue(summary.ocf_delayed_score) + '</td><td>0–17</td></tr>');
    if (hasTask('number_span')) etiRows.push(
      '<tr><td>' + tr('Number Span forward analogue: number of correct trials', 'Zahlenspanne vorwärts: Anzahl richtiger Durchgänge') + '</td><td>' + summaryValue(summary.ns_forward_correct_trials) + '</td><td>0–14</td></tr>',
      '<tr><td>' + tr('Number Span backward analogue: number of correct trials', 'Zahlenspanne rückwärts: Anzahl richtiger Durchgänge') + '</td><td>' + summaryValue(summary.ns_backward_correct_trials) + '</td><td>0–14</td></tr>');
    var extraSections = '';
    if (hasTask('visual_sequencing_set_shifting')) extraSections += '<h3>' + tr('Trail comparators (not ETI inputs)', 'Trail-Vergleichsmaße (keine ETI-Eingaben)') + '</h3><table class="summary-table">'
      + '<tr><td>' + tr('Trail A analogue completion time', 'Trail-A-Analogwert: Bearbeitungszeit') + '</td><td>' + summaryValue(summary.completion_time_sequencing_ms == null ? null : summary.completion_time_sequencing_ms / 1000, ' sec') + '</td></tr>'
      + '<tr><td>' + tr('Trail B analogue completion time', 'Trail-B-Analogwert: Bearbeitungszeit') + '</td><td>' + summaryValue(summary.completion_time_set_shifting_ms == null ? null : summary.completion_time_set_shifting_ms / 1000, ' sec') + '</td></tr></table>';
    var spatialRows = [];
    if (hasTask('object_location_memory')) spatialRows.push('<tr><td>' + tr('Object-Location Memory mean error', 'Objekt-Ort-Gedächtnis: mittlerer Fehler') + '</td><td>' + summaryValue(summary.olm_mean_euclidean_error_px, ' px') + '</td></tr>');
    if (hasTask('spatial_pointing')) spatialRows.push('<tr><td>' + tr('Spatial Pointing mean absolute error', 'Räumliches Zeigen: mittlerer absoluter Fehler') + '</td><td>' + summaryValue(summary.sp_mean_absolute_angular_error_deg, '°') + '</td></tr>');
    if (spatialRows.length) extraSections += '<h3>' + tr('Additional spatial outcomes (not ETI inputs)', 'Zusätzliche räumliche Ergebnisse (keine ETI-Eingaben)') + '</h3><table class="summary-table">' + spatialRows.join('') + '</table>';

    target.innerHTML = '<div class="osr-card individual-result" style="max-width:900px;margin:0 auto;"><span class="osr-kicker">' + tr('Examiner checkpoint', 'Prüfpersonen-Checkpoint') + '</span>'
      + '<h2>' + (pendingReviews.length ? tr('Review incomplete', 'Auswertung unvollständig') : tr('Review complete', 'Auswertung abgeschlossen')) + '</h2><p>' + tr('Participant ID:', 'Teilnehmenden-ID:') + ' <strong>' + escapeHtml(BatteryData.participantId) + '</strong></p>'
      + (pendingReviews.length ? '<div class="warning-box">' + tr('Further examiner decisions are required for:', 'Weitere Entscheidungen der Prüfperson sind erforderlich für:') + ' <strong>' + escapeHtml(pendingReviews.join(', ')) + '</strong>.</div>' : '')
      + (etiRows.length ? '<h3>' + tr('Administered ETI analogue measures', 'Durchgeführte ETI-Analogmaße') + '</h3><p class="osr-fineprint">' + tr('NACC-style raw-score labels and ranges. These original tasks are analogues, not NACC instrument scores.', 'Rohwertbezeichnungen und Bereiche nach NACC-Struktur. Diese Originalaufgaben sind Analogmaße und keine NACC-Instrumentenscores.') + '</p>'
        + '<table class="summary-table"><tr><th>' + tr('Measure', 'Maß') + '</th><th>' + tr('Raw value', 'Rohwert') + '</th><th>' + tr('Expected range', 'Erwarteter Bereich') + '</th></tr>' + etiRows.join('') + '</table>' : '')
      + '<div class="info-box"><p><strong>' + tr('How to read these values:', 'Interpretation dieser Werte:') + '</strong> ' + tr(
        'Only tasks administered during this session are listed. Story Recall counts verified details out of 44. Animal Fluency counts distinct valid animal names. Visual Naming counts pictures named correctly without help. Complex Figure counts reproduced elements out of 17. Number Span counts correctly repeated trials in each direction.',
        'Es werden nur Aufgaben aufgeführt, die in dieser Sitzung durchgeführt wurden. Die Geschichtenwiedergabe zählt bestätigte Details von 44. Die Tierflüssigkeit zählt unterschiedliche gültige Tiernamen. Beim visuellen Benennen werden ohne Hilfe korrekt benannte Bilder gezählt. Die komplexe Figur zählt reproduzierte Elemente von 17. Die Zahlenspanne zählt korrekt wiedergegebene Durchgänge in beiden Richtungen.'
      ) + '</p><p>' + tr('These are task scores, not diagnoses or norm-referenced interpretations.', 'Dies sind Aufgabenscores, keine Diagnosen oder normbezogenen Interpretationen.') + '</p></div>'
      + extraSections
      + '<div style="display:flex;gap:.6rem;flex-wrap:wrap;justify-content:center;margin-top:1rem;">'
      + '<button class="battery-btn download" id="admin-export-csv">' + tr('Download trials CSV', 'Versuchs-CSV herunterladen') + '</button>'
      + '<button class="battery-btn download" id="admin-export-json">' + tr('Download full JSON', 'Vollständiges JSON herunterladen') + '</button>'
      + '<button class="battery-btn download" id="admin-export-summary">' + tr('Download summary JSON', 'Zusammenfassung als JSON herunterladen') + '</button>'
      + '<button class="battery-btn download" id="admin-export-package">' + tr('Download research package', 'Forschungspaket herunterladen') + '</button>'
      + '<button class="battery-btn" id="admin-print-individual">' + tr('Print individual result', 'Einzelergebnis drucken') + '</button>'
      + '<button class="battery-btn" id="admin-rescore-session">' + tr('Review and rescore session', 'Sitzung prüfen und neu bewerten') + '</button></div>'
      + '<p class="osr-fineprint" id="admin-sync-status" aria-live="polite">' + tr('Checking whether verified scoring has been synchronized…', 'Synchronisierung der bestätigten Auswertung wird geprüft…') + '</p>'
      + '<p class="osr-fineprint">' + tr('Automatic suggestions remain provisional unless examiner-verified.', 'Automatische Vorschläge bleiben vorläufig, bis sie von einer Prüfperson bestätigt wurden.') + '</p>'
      + '<p><a href="admin.html">' + tr('Return to session list', 'Zur Sitzungsliste zurückkehren') + '</a></p></div>';
    document.getElementById('admin-export-csv').onclick = exportAllCSV;
    document.getElementById('admin-export-json').onclick = exportAllJSON;
    document.getElementById('admin-export-summary').onclick = exportSummaryJSON;
    document.getElementById('admin-export-package').onclick = function() {
      if (window.BatteryReporting) window.BatteryReporting.exportResearchPackage();
    };
    document.getElementById('admin-print-individual').onclick = function() { window.print(); };
    document.getElementById('admin-rescore-session').onclick = function() { beginReview(true); };
    var syncStatus = document.getElementById('admin-sync-status');
    if (!window.BatteryRemoteSync || !window.BatteryRemoteSync.enabled) {
      syncStatus.textContent = tr('Verified scoring is saved locally. Remote synchronization is unavailable in this environment.',
        'Die bestätigte Auswertung ist lokal gespeichert. Remote-Synchronisierung ist in dieser Umgebung nicht verfügbar.');
    } else {
      syncStatus.textContent = tr('Verified scoring is saved locally. Waiting for remote synchronization…',
        'Die bestätigte Auswertung ist lokal gespeichert. Remote-Synchronisierung wird abgewartet…');
      window.BatteryRemoteSync.flush().then(function() {
        var remoteState = window.BatteryRemoteSync.getStatus();
        syncStatus.textContent = remoteState === 'synced'
          ? tr('Verified scoring has been synchronized successfully.', 'Die bestätigte Auswertung wurde erfolgreich synchronisiert.')
          : remoteState === 'idle' && !markComplete
            ? tr('Previously verified results are available. No synchronization is currently pending.', 'Bereits bestätigte Ergebnisse sind verfügbar. Derzeit steht keine Synchronisierung aus.')
            : tr('Verified scoring is saved locally, but remote synchronization failed or is still pending. Keep this page open and retry.',
              'Die bestätigte Auswertung ist lokal gespeichert, aber die Remote-Synchronisierung ist fehlgeschlagen oder noch ausstehend. Lassen Sie diese Seite geöffnet und versuchen Sie es erneut.');
      });
    }
  }

  function adminCompletionTrial() {
    return { type: jsPsychCallFunction, async: true, func: function() { renderAdminResults(true); } };
  }
  function buildReviewTimeline(alreadyReviewed) {
    var timeline = [{ type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">' + tr('Examiner only', 'Nur für die Prüfperson') + '</span><h2>' + tr('Scoring checkpoint', 'Auswertungs-Checkpoint') + '</h2>'
        + '<p>' + tr('Session', 'Sitzung') + ' <strong>' + escapeHtml(BatteryData.participantId) + '</strong> ' + tr('is loaded.', 'ist geladen.') + '</p>'
        + '<div class="warning-box">' + tr('Confirm that the participant can no longer see or operate this screen.', 'Bestätigen Sie, dass die teilnehmende Person diesen Bildschirm nicht mehr sehen oder bedienen kann.') + '</div></div>',
      choices: [alreadyReviewed ? tr('Review and rescore session', 'Sitzung prüfen und neu bewerten') : tr('Begin examiner review', 'Auswertung durch Prüfperson beginnen')],
      data: { battery_phase: 'admin_checkpoint' } }];
    if (hasTask('original_story_recall')) timeline = timeline.concat(buildOSRReviewTimeline());
    if (hasTask('animal_semantic_fluency')) timeline = timeline.concat(buildAnimalFluencyReviewTimeline());
    if (hasTask('original_visual_naming')) timeline = timeline.concat(buildOriginalVisualNamingReviewTimeline());
    if (hasTask('original_complex_figure')) timeline = timeline.concat(buildOCFReviewTimeline());
    timeline.push(adminCompletionTrial());
    return timeline;
  }

  function beginReview(alreadyReviewed) {
    BatteryData.sessionStatus = 'examiner_review_in_progress';
    checkpointBatterySession();
    document.getElementById('admin-shell').hidden = true;
    initJsPsych({ display_element: 'jspsych-target', on_finish: function() {} }).run(buildReviewTimeline(alreadyReviewed));
  }
  function startLoadedReview(priorStatus) {
    document.getElementById('admin-shell').hidden = true;
    if (priorStatus === 'examiner_review_complete') {
      renderAdminResults(false);
      return;
    }
    beginReview(false);
  }
  function ensureReviewLanguage(languageCode, source, sessionId) {
    if (!languageCode || !window.BatteryLanguage || window.BatteryLanguage.get() === languageCode) return true;
    sessionStorage.setItem(PENDING_SESSION_KEY, JSON.stringify({ source: source, id: sessionId }));
    window.BatteryLanguage.set(languageCode);
    location.reload();
    return false;
  }
  function startLocal(participantId) {
    var raw = localStorage.getItem('csb-recovery-v1:' + encodeURIComponent(participantId));
    var saved;
    try { saved = raw ? JSON.parse(raw) : null; } catch (error) { return status(tr('The local checkpoint could not be read.', 'Der lokale Checkpoint konnte nicht gelesen werden.')); }
    if (!saved) return status(tr('No local checkpoint was found.', 'Kein lokaler Checkpoint gefunden.'));
    if (!ensureReviewLanguage(saved.language || 'en', 'local', participantId)) return;
    if (!loadBatteryCheckpoint(participantId, { confirm: false, adoptLanguage: true })) return status(tr('No local checkpoint was found.', 'Kein lokaler Checkpoint gefunden.'));
    var prior = BatteryData.sessionStatus;
    restoreBatteryArtifacts(participantId).then(function() { startLoadedReview(prior); })
      .catch(function(error) { status(tr('Recordings could not be restored: ', 'Aufnahmen konnten nicht wiederhergestellt werden: ') + error.message); });
  }
  function installRemoteCheckpoint(data) {
    var saved = data.checkpoint;
    if (!ensureReviewLanguage(saved.language || 'en', 'remote', data.session.remoteId)) return Promise.resolve();
    BatteryRemoteSync.setAdminRemoteId(data.session.remoteId);
    localStorage.setItem('csb-recovery-v1:' + encodeURIComponent(saved.participantId), JSON.stringify(saved));
    return Promise.all((data.artifactKeys || []).map(function(key) {
      return fetch('/api/admin-artifact?id=' + encodeURIComponent(data.session.remoteId) + '&key=' + encodeURIComponent(key),
        { credentials: 'same-origin' }).then(function(response) {
          if (!response.ok) throw new Error(tr('An audio artifact could not be downloaded.', 'Eine Audio-Datei konnte nicht heruntergeladen werden.'));
          return response.blob();
        }).then(function(blob) {
          var parts = key.split('/');
          return BatteryArtifactStore.put(batteryArtifactKey(saved.participantId, parts[0], parts[1]), blob);
        });
    })).then(function() {
      if (!loadBatteryCheckpoint(saved.participantId, { confirm: false, adoptLanguage: true })) throw new Error(tr('Remote checkpoint could not be opened.', 'Der Remote-Checkpoint konnte nicht geöffnet werden.'));
      return restoreBatteryArtifacts(saved.participantId).then(function() { startLoadedReview(saved.sessionStatus); });
    });
  }
  function loadRemote(id) {
    status(tr('Downloading checkpoint and recordings…', 'Checkpoint und Aufnahmen werden heruntergeladen…'));
    api('/api/admin-sessions?id=' + encodeURIComponent(id)).then(installRemoteCheckpoint)
      .catch(function(error) { status(error.message); });
  }
  function deleteRemote(id, participantId) {
    if (!confirm(tr('Permanently delete the remote session for ', 'Remote-Sitzung für ') + participantId
      + tr(' and all of its uploaded recordings and drawings? This cannot be undone.', ' einschließlich aller hochgeladenen Aufnahmen und Zeichnungen dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.'))) return;
    var password = prompt(tr('Re-enter the admin password to confirm deletion:', 'Geben Sie das Admin-Passwort erneut ein, um das Löschen zu bestätigen:'));
    if (!password) return;
    api('/api/admin-sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, password: password }) }).then(function() {
        status(tr('Remote session and uploaded artifacts deleted.', 'Remote-Sitzung und hochgeladene Dateien wurden gelöscht.')); return refreshRemote();
      }).catch(function(error) { status(error.message); });
  }
  function deleteLocal(participantId) {
    if (!confirm(tr('Permanently delete the local session for ', 'Lokale Sitzung für ') + participantId
      + tr(' and all recordings stored in this browser? This cannot be undone.', ' einschließlich aller in diesem Browser gespeicherten Aufnahmen dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.'))) return;
    status(tr('Deleting local session…', 'Lokale Sitzung wird gelöscht…'));
    BatteryArtifactStore.deleteParticipant(participantId).then(function() {
      localStorage.removeItem('csb-recovery-v1:' + encodeURIComponent(participantId));
      if (window.BatteryRemoteSync) window.BatteryRemoteSync.clearIdentity(participantId);
      status(tr('Local session and browser artifacts deleted.', 'Lokale Sitzung und Browser-Dateien wurden gelöscht.'));
      renderLocal();
    }).catch(function(error) { status(tr('Local deletion failed: ', 'Lokales Löschen fehlgeschlagen: ') + error.message); });
  }
  function renderRemote() {
    var box = document.getElementById('admin-remote-session-list');
    if (!remoteSessions.length) { box.innerHTML = '<p class="osr-fineprint">' + tr('No remote sessions found.', 'Keine Remote-Sitzungen gefunden.') + '</p>'; return; }
    box.innerHTML = remoteSessions.map(function(s) {
      return '<div style="display:flex;gap:.5rem;align-items:center;margin:.45rem 0;"><button class="battery-btn primary remote-load" data-id="'
        + escapeHtml(s.remoteId) + '" style="flex:1;display:flex;justify-content:space-between;"><strong>'
        + escapeHtml(s.participantId) + '</strong><span>' + escapeHtml(sessionStatusLabel(s.sessionStatus)) + ' · ' + s.trialCount + ' ' + tr('rows', 'Zeilen') + '</span></button>'
        + '<button class="battery-btn remote-delete" data-id="' + escapeHtml(s.remoteId)
        + '" data-pid="' + escapeHtml(s.participantId) + '">' + tr('Delete remote', 'Remote löschen') + '</button></div>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.remote-load'), function(b) { b.onclick = function() { loadRemote(b.dataset.id); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.remote-delete'), function(b) { b.onclick = function() { deleteRemote(b.dataset.id, b.dataset.pid); }; });
  }
  function renderLocal() {
    var sessions = listBatteryCheckpoints(), box = document.getElementById('admin-local-session-list');
    if (!sessions.length) { box.innerHTML = '<p class="osr-fineprint">' + tr('No local sessions found.', 'Keine lokalen Sitzungen gefunden.') + '</p>'; return; }
    box.innerHTML = sessions.map(function(s) { return '<div style="display:flex;gap:.5rem;align-items:center;margin:.45rem 0;">'
      + '<button class="battery-btn local-load" data-pid="' + escapeHtml(s.participantId)
      + '" style="display:flex;flex:1;justify-content:space-between;"><strong>' + escapeHtml(s.participantId)
      + '</strong><span>' + escapeHtml(sessionStatusLabel(s.sessionStatus)) + ' · ' + s.trialCount + ' ' + tr('rows', 'Zeilen') + '</span></button>'
      + '<button class="battery-btn local-delete" data-pid="' + escapeHtml(s.participantId) + '">' + tr('Delete local', 'Lokal löschen') + '</button></div>'; }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('.local-load'), function(b) { b.onclick = function() { startLocal(b.dataset.pid); }; });
    Array.prototype.forEach.call(document.querySelectorAll('.local-delete'), function(b) { b.onclick = function() { deleteLocal(b.dataset.pid); }; });
  }
  function refreshRemote() {
    return api('/api/admin-sessions').then(function(data) {
      remoteSessions = data.sessions || []; renderRemote(); renderLocal();
      document.getElementById('admin-login-panel').hidden = true;
      document.getElementById('admin-sessions-panel').hidden = false;
      var pending = sessionStorage.getItem(PENDING_SESSION_KEY);
      if (pending) {
        sessionStorage.removeItem(PENDING_SESSION_KEY);
        try {
          var requested = JSON.parse(pending);
          if (requested.source === 'remote') loadRemote(requested.id);
          else if (requested.source === 'local') startLocal(requested.id);
        } catch (error) { status(tr('The selected session could not be reopened after changing language.', 'Die ausgewählte Sitzung konnte nach dem Sprachwechsel nicht erneut geöffnet werden.')); }
      }
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
    status(tr('Preparing collective results…', 'Gesamtergebnisse werden vorbereitet…'));
    return Promise.all(remoteSessions.map(function(session) {
      return api('/api/admin-sessions?id=' + encodeURIComponent(session.remoteId)).then(function(data) { return data.checkpoint; });
    })).then(function(remote) {
      var latest = {};
      remote.concat(localCheckpoints()).forEach(function(checkpoint) {
        if (checkpoint.sessionStatus === 'in_progress') return;
        var key = String(checkpoint.participantId) + '|' + String(checkpoint.sessionStart || '');
        var existing = latest[key];
        var savedAt = Date.parse(checkpoint.saved_at || checkpoint.remoteSavedAt || '') || 0;
        var existingSavedAt = existing ? Date.parse(existing.saved_at || existing.remoteSavedAt || '') || 0 : -1;
        if (!existing || savedAt > existingSavedAt ||
            (savedAt === existingSavedAt && checkpoint.sessionStatus === 'examiner_review_complete' && existing.sessionStatus !== 'examiner_review_complete')) {
          latest[key] = checkpoint;
        }
      });
      var combined = Object.keys(latest).map(function(key) { return latest[key]; });
      status(adminGerman()
        ? combined.length + ' eindeutige Sitzungsergebnis' + (combined.length === 1 ? '' : 'se') + ' vorbereitet.'
        : combined.length + ' unique session result' + (combined.length === 1 ? '' : 's') + ' prepared.');
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
    var title = tr('Collective cognitive battery results', 'Gesamtergebnisse der kognitiven Testbatterie');
    var html = '<!doctype html><html lang="' + (adminGerman() ? 'de' : 'en') + '"><head><title>' + escapeHtml(title) + '</title><style>'
      + 'body{font-family:Arial,sans-serif;color:#111;padding:24px}table{border-collapse:collapse;width:100%;font-size:11px}'
      + 'th,td{border:1px solid #777;padding:6px;text-align:left;vertical-align:top}th{background:#eee}h1{font-size:20px}'
      + '@media print{body{padding:0}@page{size:landscape;margin:10mm}}</style></head><body><h1>' + escapeHtml(title) + '</h1>'
      + '<p>' + tr('One row per completed participant session. Only administered measures are shown. Review status distinguishes verified from pending scores.',
        'Eine Zeile pro abgeschlossener Sitzung. Es werden nur durchgeführte Maße angezeigt. Der Auswertungsstatus unterscheidet bestätigte von noch ausstehenden Scores.') + '</p><table><thead><tr><th>'
      + tr('Participant ID', 'Teilnehmenden-ID') + '</th><th>' + tr('Language', 'Sprache') + '</th><th>' + tr('Review status', 'Auswertungsstatus') + '</th>'
      + ids.map(function(id) { return '<th>' + escapeHtml(labels[id] || id) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + rows.map(function(row) { return '<tr><td>' + escapeHtml(row.participant_id) + '</td><td>' + escapeHtml(row.language) + '</td><td>' + escapeHtml(sessionStatusLabel(row.session_status)) + '</td>' + ids.map(function(id) {
        var value = Object.prototype.hasOwnProperty.call(row, id) ? row[id] : tr('Not administered', 'Nicht durchgeführt');
        return '<td>' + escapeHtml(value == null ? tr('Needs review / incomplete', 'Prüfung erforderlich / unvollständig') : value) + '</td>';
      }).join('') + '</tr>'; }).join('') + '</tbody></table></body></html>';
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 250);
  }

  window.addEventListener('load', function() {
    applyAdminShellLanguage();
    document.getElementById('admin-language-en').onclick = function() {
      if (window.BatteryLanguage) window.BatteryLanguage.set('en');
      location.reload();
    };
    document.getElementById('admin-language-de').onclick = function() {
      if (window.BatteryLanguage) window.BatteryLanguage.set('de');
      location.reload();
    };
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
        if (!checkpoints.length) return status(tr('No sessions are available to export.', 'Keine Sitzungen zum Exportieren verfügbar.'));
        window.BatteryReporting.exportCollectiveCSV(checkpoints);
      }).catch(function(error) { status(tr('Collective export failed: ', 'Export der Gesamtergebnisse fehlgeschlagen: ') + error.message); });
    };
    document.getElementById('admin-collective-print').onclick = function() {
      var printWindow = window.open('', '_blank');
      if (!printWindow) return status(tr('The browser blocked the print window. Allow pop-ups and try again.', 'Der Browser hat das Druckfenster blockiert. Erlauben Sie Pop-ups und versuchen Sie es erneut.'));
      printWindow.document.write('<p style="font-family:Arial;padding:2rem;">' + tr('Preparing collective results…', 'Gesamtergebnisse werden vorbereitet…') + '</p>');
      allCheckpoints().then(function(checkpoints) {
        if (!checkpoints.length) { printWindow.close(); return status(tr('No sessions are available to print.', 'Keine Sitzungen zum Drucken verfügbar.')); }
        printCollective(checkpoints, printWindow);
      }).catch(function(error) { printWindow.close(); status(tr('Collective printing failed: ', 'Drucken der Gesamtergebnisse fehlgeschlagen: ') + error.message); });
    };
    refreshRemote();
  });
})();
