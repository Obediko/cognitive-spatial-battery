/* ============================================================
   reporting.js - task-level, compiled and NACC-reference exports
   ============================================================ */
'use strict';

window.BatteryReporting = (function() {
  function finite(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }
  function round(value, digits) {
    if (!finite(value)) return null;
    var factor = Math.pow(10, digits == null ? 2 : digits);
    return Math.round(value * factor) / factor;
  }
  function boundedAccuracy(error, maximum) {
    if (!finite(error) || !finite(maximum) || maximum <= 0) return null;
    return round(Math.max(0, Math.min(100, 100 * (1 - error / maximum))), 2);
  }
  function language() {
    return (window.BatteryData && window.BatteryData.language) ||
      (window.BatteryLanguage && window.BatteryLanguage.get()) || 'en';
  }

  var DEFINITIONS = [
    ['CRAFTVRS_ANALOGUE','ETI core: original story immediate verbatim units','count','0-44','Higher is better','Analogue of CRAFTVRS; original CSB story, not Craft Story'],
    ['CRAFTDVR_ANALOGUE','ETI core: original story delayed verbatim units','count','0-44','Higher is better','Analogue of CRAFTDVR; original CSB story, not Craft Story'],
    ['ANIMALS_ANALOGUE','ETI core: valid unique animal names in 60 seconds','count','0-77','Higher is better','Analogue of ANIMALS; independently worded administration'],
    ['MINTTOTS_ANALOGUE','ETI core: original visual naming total','count','0-32','Higher is better','Analogue of MINTTOTS; original images and language-specific accepted names, not MINT'],
    ['UDSBENTC_ANALOGUE','ETI core: original complex figure copy','count','0-17','Higher is better','Analogue of UDSBENTC; original figure, not Benson'],
    ['UDSBENTD_ANALOGUE','ETI core: original complex figure delayed recall','count','0-17','Higher is better','Analogue of UDSBENTD; original figure, not Benson'],
    ['DIGFORCT_ANALOGUE','ETI core: Number Span forward correct trials','count','0-14','Higher is better','Analogue of DIGFORCT; independently generated fixed sequences'],
    ['DIGBACCT_ANALOGUE','ETI core: Number Span backward correct trials','count','0-14','Higher is better','Analogue of DIGBACCT; independently generated fixed sequences'],
    ['OSR_IMM_PARAPHRASE','Story Recall immediate paraphrase units','count','0-25','Higher is better','Secondary score; examiner-verified'],
    ['OSR_DEL_PARAPHRASE','Story Recall delayed paraphrase units','count','0-25','Higher is better','Secondary score; examiner-verified'],
    ['OCF_RECOG','Original Complex Figure recognition','binary','0-1','1 is correct','Structurally matched original figure; NACC Benson reference range only'],
    ['NS_FWD_SPAN','Number Span longest forward span','digits','0 or 3-9','Higher is better','Matches NACC C2 reporting field and range'],
    ['NS_BWD_SPAN','Number Span longest backward span','digits','0 or 2-8','Higher is better','Matches NACC C2 reporting field and range'],
    ['OVN_UNCUED','Original Visual Naming correct without cue','count','0-32','Higher is better','Original images; NACC MINT reference range only, not MINT-equivalent'],
    ['TRAILA_TIME_SEC_ANALOGUE','Comparator: visual sequencing completion time','seconds','0-150','Lower is better','Digital Trail A analogue; terminates at 150 seconds; not an ETI input or norm-equivalent'],
    ['TRAILA_ERRORS_ANALOGUE','Comparator: visual sequencing commission errors','count','>=0','Lower is better','Digital Trail A analogue; not an ETI input'],
    ['TRAILA_CONNECTIONS_ANALOGUE','Comparator: correct Trail A connections','count','0-24','Higher is better','Digital Trail A analogue; 24 indicates all connections completed'],
    ['TRAILB_TIME_SEC_ANALOGUE','Comparator: visual set-shifting completion time','seconds','0-300','Lower is better','Digital Trail B analogue; terminates at 300 seconds; manuscript comparator, not an ETI input'],
    ['TRAILB_ERRORS_ANALOGUE','Comparator: visual set-shifting commission errors','count','>=0','Lower is better','Digital Trail B analogue; manuscript comparator, not an ETI input'],
    ['TRAILB_CONNECTIONS_ANALOGUE','Comparator: correct Trail B connections','count','0-24','Higher is better','Digital Trail B analogue; 24 indicates all connections completed'],
    ['VS_SHIFT_COST_SEC','Set-shifting minus sequencing time','seconds','unbounded','Lower is generally better','CSB derived measure; no direct NACC submission field'],
    ['VS_SHIFT_RATIO','Set-shifting divided by sequencing time','ratio','>=0','Lower is generally better','CSB derived measure; no direct NACC submission field'],
    ['OLM_MEAN_ERROR_PX','Object-Location Memory mean Euclidean error','pixels','>=0','Lower is better','Device-dependent raw diagnostic measure; no NACC counterpart'],
    ['OLM_MEAN_NORM_ERROR','Object-Location Memory mean error divided by arena diagonal','proportion','0-1','Lower is better','Device-independent CSB measure; no NACC counterpart'],
    ['OLM_ACCURACY_100','Object-Location Memory bounded accuracy','score','0-100','Higher is better','100 × (1 - mean normalized error); technical transform, not a normative score'],
    ['SP_MEAN_ABS_ERROR','Spatial Pointing mean absolute angular error','degrees','0-180','Lower is better','Exact continuous CSB measure; no NACC counterpart'],
    ['SP_ACCURACY_100','Spatial Pointing bounded directional accuracy','score','0-100','Higher is better','100 × (1 - mean absolute error / 180); technical transform, not a normative score']
  ];

  var TASK_MEASURES = {
    original_story_recall: ['CRAFTVRS_ANALOGUE', 'CRAFTDVR_ANALOGUE', 'OSR_IMM_PARAPHRASE', 'OSR_DEL_PARAPHRASE'],
    animal_semantic_fluency: ['ANIMALS_ANALOGUE'],
    original_visual_naming: ['MINTTOTS_ANALOGUE', 'OVN_UNCUED'],
    original_complex_figure: ['UDSBENTC_ANALOGUE', 'UDSBENTD_ANALOGUE', 'OCF_RECOG'],
    number_span: ['DIGFORCT_ANALOGUE', 'DIGBACCT_ANALOGUE', 'NS_FWD_SPAN', 'NS_BWD_SPAN'],
    visual_sequencing_set_shifting: ['TRAILA_TIME_SEC_ANALOGUE', 'TRAILA_ERRORS_ANALOGUE', 'TRAILA_CONNECTIONS_ANALOGUE',
      'TRAILB_TIME_SEC_ANALOGUE', 'TRAILB_ERRORS_ANALOGUE', 'TRAILB_CONNECTIONS_ANALOGUE', 'VS_SHIFT_COST_SEC', 'VS_SHIFT_RATIO'],
    object_location_memory: ['OLM_MEAN_ERROR_PX', 'OLM_MEAN_NORM_ERROR', 'OLM_ACCURACY_100'],
    spatial_pointing: ['SP_MEAN_ABS_ERROR', 'SP_ACCURACY_100']
  };

  function administeredTasks(trials) {
    var seen = {};
    (trials || (window.BatteryData && window.BatteryData.trials) || []).forEach(function(row) {
      if (row && row.task_name) seen[row.task_name] = true;
    });
    return seen;
  }

  function administeredMeasureSet(trials) {
    var tasks = administeredTasks(trials);
    var measures = {};
    Object.keys(tasks).forEach(function(task) {
      (TASK_MEASURES[task] || []).forEach(function(id) { measures[id] = true; });
    });
    return measures;
  }

  function compiled(summary, trials) {
    summary = summary || buildSummary();
    var sequenceSec = finite(summary.completion_time_sequencing_ms) ? round(summary.completion_time_sequencing_ms / 1000, 3) : null;
    var shiftSec = finite(summary.completion_time_set_shifting_ms) ? round(summary.completion_time_set_shifting_ms / 1000, 3) : null;
    var costSec = finite(summary.set_shifting_cost_ms) ? round(summary.set_shifting_cost_ms / 1000, 3) : null;
    var languageMeta = window.BatteryLanguage ? window.BatteryLanguage.metadata() : {};
    var namingTotal = finite(summary.ovn_total_with_semantic)
      ? summary.ovn_total_with_semantic : summary.ovn_total_uncued;
    var etiValues = [
      summary.osr_immediate_verbatim, summary.osr_delayed_verbatim,
      summary.asf_total_valid_unique, namingTotal,
      summary.ocf_copy_score, summary.ocf_delayed_score,
      summary.ns_forward_correct_trials, summary.ns_backward_correct_trials
    ];
    var row = Object.assign({
      participant_id: summary.participant_id,
      language: summary.administration_language || language(),
      language_form_version: languageMeta.language_form_version || null,
      language_equivalence_status: languageMeta.language_equivalence_status || null,
      session_start: summary.session_start,
      session_end: summary.session_end,
      eti_input_status: etiValues.every(finite) ? 'eight_inputs_complete' : 'pending_or_incomplete',
      eti_value: null,
      eti_value_status: 'not_computed_normative_parameters_required',
      CRAFTVRS_ANALOGUE: summary.osr_immediate_verbatim,
      CRAFTDVR_ANALOGUE: summary.osr_delayed_verbatim,
      ANIMALS_ANALOGUE: summary.asf_total_valid_unique,
      MINTTOTS_ANALOGUE: namingTotal,
      UDSBENTC_ANALOGUE: summary.ocf_copy_score,
      UDSBENTD_ANALOGUE: summary.ocf_delayed_score,
      DIGFORCT_ANALOGUE: summary.ns_forward_correct_trials,
      DIGBACCT_ANALOGUE: summary.ns_backward_correct_trials,
      OSR_IMM_PARAPHRASE: summary.osr_immediate_paraphrase,
      OSR_DEL_PARAPHRASE: summary.osr_delayed_paraphrase,
      OCF_RECOG: summary.ocf_recognition_correct,
      NS_FWD_SPAN: summary.ns_forward_span,
      NS_BWD_SPAN: summary.ns_backward_span,
      OVN_UNCUED: summary.ovn_total_uncued,
      TRAILA_TIME_SEC_ANALOGUE: sequenceSec,
      TRAILA_ERRORS_ANALOGUE: summary.errors_sequencing,
      TRAILA_CONNECTIONS_ANALOGUE: summary.correct_connections_sequencing,
      TRAILB_TIME_SEC_ANALOGUE: shiftSec,
      TRAILB_ERRORS_ANALOGUE: summary.errors_set_shifting,
      TRAILB_CONNECTIONS_ANALOGUE: summary.correct_connections_set_shifting,
      VS_SHIFT_COST_SEC: costSec,
      VS_SHIFT_RATIO: summary.set_shifting_ratio,
      OLM_MEAN_ERROR_PX: round(summary.olm_mean_euclidean_error_px, 2),
      OLM_MEAN_NORM_ERROR: round(summary.olm_mean_normalized_error, 4),
      OLM_ACCURACY_100: boundedAccuracy(summary.olm_mean_normalized_error, 1),
      SP_MEAN_ABS_ERROR: round(summary.sp_mean_absolute_angular_error_deg, 2),
      SP_ACCURACY_100: boundedAccuracy(summary.sp_mean_absolute_angular_error_deg, 180)
    }, languageMeta);
    var included = administeredMeasureSet(trials);
    DEFINITIONS.forEach(function(def) { if (!included[def[0]]) delete row[def[0]]; });
    return row;
  }

  function longRows(summary, trials) {
    var row = compiled(summary, trials);
    return DEFINITIONS.filter(function(def) { return Object.prototype.hasOwnProperty.call(row, def[0]); }).map(function(def) {
      return {
        participant_id: row.participant_id,
        language: row.language,
        measure_id: def[0],
        measure: def[1],
        value: row[def[0]] == null ? null : row[def[0]],
        unit: def[2],
        valid_or_theoretical_range: def[3],
        interpretation: def[4],
        alignment_note: def[5]
      };
    });
  }

  function dictionaryRows() {
    return DEFINITIONS.map(function(def) {
      return {
        measure_id: def[0], definition: def[1], unit: def[2],
        valid_or_theoretical_range: def[3], interpretation: def[4], alignment_note: def[5]
      };
    });
  }

  function exportCompiledCSV() {
    var pid = window.BatteryData.participantId || 'unknown';
    triggerDownload(toCSV([compiled()]), pid + '_compiled_scores.csv', 'text/csv');
  }
  function exportTaskResultsCSV() {
    var pid = window.BatteryData.participantId || 'unknown';
    triggerDownload(toCSV(longRows()), pid + '_task_results.csv', 'text/csv');
  }
  function exportScoreDictionaryCSV() {
    triggerDownload(toCSV(dictionaryRows()), 'csb_score_dictionary.csv', 'text/csv');
  }
  function exportResearchPackage() {
    exportAllCSV();
    exportTaskResultsCSV();
    exportCompiledCSV();
    exportScoreDictionaryCSV();
    exportAllJSON();
  }

  function summaryFromCheckpoint(checkpoint) {
    var previous = window.BatteryData;
    window.BatteryData = {
      participantId: checkpoint.participantId,
      language: checkpoint.language || 'en',
      sessionStart: checkpoint.sessionStart,
      trials: checkpoint.trials || [],
      taskSummaries: checkpoint.taskSummaries || {}
    };
    try { return buildSummary(); } finally { window.BatteryData = previous; }
  }

  function collectiveRows(checkpoints) {
    var rows = (checkpoints || []).map(function(checkpoint) {
      return compiled(summaryFromCheckpoint(checkpoint), checkpoint.trials || []);
    });
    var included = {};
    DEFINITIONS.forEach(function(def) {
      if (rows.some(function(row) { return Object.prototype.hasOwnProperty.call(row, def[0]); })) included[def[0]] = true;
    });
    return rows.map(function(row) {
      DEFINITIONS.forEach(function(def) {
        if (included[def[0]] && !Object.prototype.hasOwnProperty.call(row, def[0])) row[def[0]] = 'Not administered';
      });
      return row;
    });
  }

  function exportCollectiveCSV(checkpoints) {
    triggerDownload(toCSV(collectiveRows(checkpoints)), 'csb_collective_results.csv', 'text/csv');
  }

  return {
    definitions: dictionaryRows,
    compiled: compiled,
    longRows: longRows,
    boundedAccuracy: boundedAccuracy,
    exportCompiledCSV: exportCompiledCSV,
    exportTaskResultsCSV: exportTaskResultsCSV,
    exportScoreDictionaryCSV: exportScoreDictionaryCSV,
    exportResearchPackage: exportResearchPackage,
    collectiveRows: collectiveRows,
    exportCollectiveCSV: exportCollectiveCSV
  };
})();
