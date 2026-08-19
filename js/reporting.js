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
    ['OSR_IMM_VERBATIM','Story Recall immediate verbatim units','count','0-44','Higher is better','NACC C2 Craft Story reference range; original CSB story is not the licensed NACC form'],
    ['OSR_IMM_PARAPHRASE','Story Recall immediate paraphrase units','count','0-25','Higher is better','NACC C2 Craft Story reference range; examiner-verified'],
    ['OSR_DEL_VERBATIM','Story Recall delayed verbatim units','count','0-44','Higher is better','NACC C2 Craft Story reference range; original CSB story is not the licensed NACC form'],
    ['OSR_DEL_PARAPHRASE','Story Recall delayed paraphrase units','count','0-25','Higher is better','NACC C2 Craft Story reference range; examiner-verified'],
    ['OCF_COPY','Original Complex Figure copy','count','0-17','Higher is better','Structurally matched original figure; NACC Benson reference range only'],
    ['OCF_DELAY','Original Complex Figure delayed recall','count','0-17','Higher is better','Structurally matched original figure; NACC Benson reference range only'],
    ['OCF_RECOG','Original Complex Figure recognition','binary','0-1','1 is correct','Structurally matched original figure; NACC Benson reference range only'],
    ['NS_FWD_CORRECT','Number Span forward correct trials','count','0-14','Higher is better','Matches NACC C2 reporting field and range'],
    ['NS_FWD_SPAN','Number Span longest forward span','digits','0 or 3-9','Higher is better','Matches NACC C2 reporting field and range'],
    ['NS_BWD_CORRECT','Number Span backward correct trials','count','0-14','Higher is better','Matches NACC C2 reporting field and range'],
    ['NS_BWD_SPAN','Number Span longest backward span','digits','0 or 2-8','Higher is better','Matches NACC C2 reporting field and range'],
    ['ASF_ANIMALS','Animal Fluency valid unique animals','count','0-77','Higher is better','NACC C2 Category Fluency reference range; independently worded CSB administration'],
    ['OVN_UNCUED','Original Visual Naming correct without cue','count','0-32','Higher is better','Original images; NACC MINT reference range only, not MINT-equivalent'],
    ['VS_SEQUENCE_SEC','Visual sequencing completion time','seconds','>=0','Lower is better','Digital conceptual analogue; NACC Trails A reports 0-150 seconds but equivalence is not established'],
    ['VS_SEQUENCE_ERRORS','Visual sequencing commission errors','count','>=0','Lower is better','Digital conceptual analogue; NACC Trails A reference range is 0-40'],
    ['VS_SHIFT_SEC','Visual set-shifting completion time','seconds','>=0','Lower is better','Digital conceptual analogue; NACC Trails B reports 0-300 seconds but equivalence is not established'],
    ['VS_SHIFT_ERRORS','Visual set-shifting commission errors','count','>=0','Lower is better','Digital conceptual analogue; NACC Trails B reference range is 0-40'],
    ['VS_SHIFT_COST_SEC','Set-shifting minus sequencing time','seconds','unbounded','Lower is generally better','CSB derived measure; no direct NACC submission field'],
    ['VS_SHIFT_RATIO','Set-shifting divided by sequencing time','ratio','>=0','Lower is generally better','CSB derived measure; no direct NACC submission field'],
    ['OLM_MEAN_ERROR_PX','Object-Location Memory mean Euclidean error','pixels','>=0','Lower is better','Device-dependent raw diagnostic measure; no NACC counterpart'],
    ['OLM_MEAN_NORM_ERROR','Object-Location Memory mean error divided by arena diagonal','proportion','0-1','Lower is better','Device-independent CSB measure; no NACC counterpart'],
    ['OLM_ACCURACY_100','Object-Location Memory bounded accuracy','score','0-100','Higher is better','100 × (1 - mean normalized error); technical transform, not a normative score'],
    ['SP_MEAN_ABS_ERROR','Spatial Pointing mean absolute angular error','degrees','0-180','Lower is better','Exact continuous CSB measure; no NACC counterpart'],
    ['SP_ACCURACY_100','Spatial Pointing bounded directional accuracy','score','0-100','Higher is better','100 × (1 - mean absolute error / 180); technical transform, not a normative score']
  ];

  function compiled(summary) {
    summary = summary || buildSummary();
    var sequenceSec = finite(summary.completion_time_sequencing_ms) ? round(summary.completion_time_sequencing_ms / 1000, 3) : null;
    var shiftSec = finite(summary.completion_time_set_shifting_ms) ? round(summary.completion_time_set_shifting_ms / 1000, 3) : null;
    var costSec = finite(summary.set_shifting_cost_ms) ? round(summary.set_shifting_cost_ms / 1000, 3) : null;
    return {
      participant_id: summary.participant_id,
      language: language(),
      session_start: summary.session_start,
      session_end: summary.session_end,
      OSR_IMM_VERBATIM: summary.osr_immediate_verbatim,
      OSR_IMM_PARAPHRASE: summary.osr_immediate_paraphrase,
      OSR_DEL_VERBATIM: summary.osr_delayed_verbatim,
      OSR_DEL_PARAPHRASE: summary.osr_delayed_paraphrase,
      OCF_COPY: summary.ocf_copy_score,
      OCF_DELAY: summary.ocf_delayed_score,
      OCF_RECOG: summary.ocf_recognition_correct,
      NS_FWD_CORRECT: summary.ns_forward_correct_trials,
      NS_FWD_SPAN: summary.ns_forward_span,
      NS_BWD_CORRECT: summary.ns_backward_correct_trials,
      NS_BWD_SPAN: summary.ns_backward_span,
      ASF_ANIMALS: summary.asf_total_valid_unique,
      OVN_UNCUED: summary.ovn_total_uncued,
      VS_SEQUENCE_SEC: sequenceSec,
      VS_SEQUENCE_ERRORS: summary.errors_sequencing,
      VS_SHIFT_SEC: shiftSec,
      VS_SHIFT_ERRORS: summary.errors_set_shifting,
      VS_SHIFT_COST_SEC: costSec,
      VS_SHIFT_RATIO: summary.set_shifting_ratio,
      OLM_MEAN_ERROR_PX: round(summary.olm_mean_euclidean_error_px, 2),
      OLM_MEAN_NORM_ERROR: round(summary.olm_mean_normalized_error, 4),
      OLM_ACCURACY_100: boundedAccuracy(summary.olm_mean_normalized_error, 1),
      SP_MEAN_ABS_ERROR: round(summary.sp_mean_absolute_angular_error_deg, 2),
      SP_ACCURACY_100: boundedAccuracy(summary.sp_mean_absolute_angular_error_deg, 180)
    };
  }

  function longRows(summary) {
    var row = compiled(summary);
    return DEFINITIONS.map(function(def) {
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

  return {
    definitions: dictionaryRows,
    compiled: compiled,
    longRows: longRows,
    boundedAccuracy: boundedAccuracy,
    exportCompiledCSV: exportCompiledCSV,
    exportTaskResultsCSV: exportTaskResultsCSV,
    exportScoreDictionaryCSV: exportScoreDictionaryCSV,
    exportResearchPackage: exportResearchPackage
  };
})();
