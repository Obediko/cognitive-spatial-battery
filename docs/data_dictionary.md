# CognitiveBA3 Research Data Dictionary

This dictionary describes the current trial, summary, and compiled-report fields in `js/utils.js`, `js/reporting.js`, `js/language.js`, and the individual task modules. Fields vary with selected tasks, task phase, examiner review, audio availability, and deployment configuration. A field listed here is not a claim that every export format contains it.

## Export products and confidentiality

| Product | Contents | Sensitivity and handling |
|---|---|---|
| Trial CSV | Individual task/phase rows, responses, timings, display/input metadata, and identifiers | Pseudonymous research data; may include sensitive response content or item/sequence details |
| Full-session JSON | Trials, session metadata, task summaries, and derived outputs | Controlled research data; may contain drawings, answer evidence, stimulus positions, and examiner decisions |
| Summary JSON | One participant/session summary containing task scores and technical metadata | Pseudonymous outcome data; treat as controlled research data |
| Compiled reference-oriented report | Eight analogue outputs, secondary measures, task labels, and composite status | Pseudonymous outcomes; never represent as an official NACC submission |
| Response-audio artifact | Recorded story, animal-fluency, or naming responses when captured | Potentially identifying personal data; explicit consent, access control, retention, and deletion required |
| Remote checkpoint | Session state, trials, summaries, drawings, and metadata uploaded to approved Netlify storage when configured | Pseudonymous personal data; data-protection and ethics approval required |

## Missingness and interpretation rules

- JSON `null` means a value is missing, unavailable, unadministered, incomplete, or not yet accepted unless a corresponding status field explains a more specific state.
- CSV missing values may appear as an empty cell after serialization. Do not interpret an empty cell as numeric zero.
- A true score of zero is an observed score. It is distinct from missing, interrupted, technically failed, unreviewed, and unadministered outcomes.
- Examiner-dependent primary outcomes require the approved review workflow before inferential use.
- `eti_value` is intentionally `null`; its status states that normative parameters are required.
- 0-100 object-location and pointing values are deterministic technical transformations, not normative percentiles, clinical cutoffs, or diagnostic probabilities.
- Task-specific trial rows can contain additional evidence fields not appropriate for public dissemination. Consult the task specification before sharing an export.

## Session and trial metadata

| Field | Level | Type or unit | Meaning and allowed values | Handling |
|---|---|---|---|---|
| `participant_id` | Trial, summary, compiled | String | Pseudonymous participant or session identifier; must not contain direct personal identifiers | Restricted research identifier |
| `administration_language` | Trial, summary | String | `en` or `de`; selected before testing and fixed for the session | Stratify analysis by language until equivalence is established |
| `language` | Compiled | String | Compiled-report language, normally `en` or `de` | Same interpretation as administration language |
| `language_locale` | Trial | String | Locale such as `en-US` or `de-DE` | Preserve for response normalization |
| `language_form_version` | Trial, summary, compiled | String | Frozen session-language form identifier | Record with every analysis release |
| `instruction_version` | Trial | String | Language-specific instruction form version | Change control applies |
| `story_form_version` | Trial | String | Language-specific story form version | Do not assume alternate-form equivalence |
| `animal_form_version` | Trial | String | Animal-fluency language/dictionary form version | Preserve for scoring audit |
| `naming_form_version` | Trial | String | Visual-naming language form version | Preserve for cross-language analysis |
| `language_equivalence_status` | Trial, summary, compiled | String | `reference_form` for English or `pilot_unvalidated` for German in the current code | Neither label establishes clinical validation |
| `timestamp` | Trial | ISO 8601 datetime | Time at which the trial row was recorded | Treat timestamps as potentially identifying in small samples |
| `session_start` | Summary, compiled | ISO 8601 datetime | Session start time | Restricted metadata |
| `session_end` | Summary, compiled | ISO 8601 datetime | Summary-generation time | Restricted metadata |
| `total_battery_duration_ms` | Summary | Milliseconds | Elapsed time between session start and summary generation | Includes administration conditions present in the run |
| `pilot_mode` | Summary | Boolean | Whether development-only shortened timings were enabled | Exclude pilot-timing runs from standard research analysis |
| `task_name` | Trial | String | Task module identifier, for example `original_story_recall` or `number_span` | Defines the relevant task-specific schema |
| `trial_type` | Selected trial rows | String | Task-dependent phase, commonly `practice` or `main` | Do not combine practice and main responses |
| `phase` | Selected trial rows | String | Task-specific administration or response phase | Use task specifications for exact values |
| `window_width_px` | Trial, summary | Pixels | Browser viewport width | Evaluate device/input comparability |
| `window_height_px` | Trial, summary | Pixels | Browser viewport height | Evaluate device/input comparability |
| `screen_width_px` | Trial, summary | Pixels | Available screen width reported by the browser | Technical metadata |
| `screen_height_px` | Trial, summary | Pixels | Available screen height reported by the browser | Technical metadata |
| `device_pixel_ratio` | Trial, summary | Ratio | CSS-to-device pixel scaling | Needed when comparing display configurations |
| `input_modality` | Trial | String | Observed method such as `pointer`, `touch`, `keyboard`, `gamepad`, or `unknown` | Do not pool modalities before equivalence testing |
| `gamepad_connected` | Trial | Boolean | Whether a controller was detected | Technical metadata; not identical to active input modality |

## Eight primary experimental analogue outputs

| Compiled field | Source summary field | Task and construct | Unit or range | Interpretation and review |
|---|---|---|---|---|
| `CRAFTVRS_ANALOGUE` | `osr_immediate_verbatim` | Original Story Recall, immediate verbal recall | Count, 0-44 | Examiner-verified original story units; not Craft Story |
| `CRAFTDVR_ANALOGUE` | `osr_delayed_verbatim` | Original Story Recall, delayed verbal recall | Count, 0-44 | Examiner-verified original story units; not Craft Story |
| `ANIMALS_ANALOGUE` | `asf_total_valid_unique` | Animal Semantic Fluency | Count; source reference range 0-77 | Examiner-approved unique valid animals in 60 seconds; the reference range is not a local norm |
| `MINTTOTS_ANALOGUE` | `ovn_total_with_semantic`, otherwise `ovn_total_uncued` | Original Visual Naming | Count, 0-32 | Examiner-approved original naming total; not an official MINT score |
| `UDSBENTC_ANALOGUE` | `ocf_copy_score` | Original Complex Figure copy | Count, 0-17 | Examiner-reviewed original figure elements; not Benson scoring |
| `UDSBENTD_ANALOGUE` | `ocf_delayed_score` | Original Complex Figure delayed recall | Count, 0-17 | Examiner-reviewed original figure elements; not Benson scoring |
| `DIGFORCT_ANALOGUE` | `ns_forward_correct_trials` | Number Span forward | Count, 0-14 | Rule-based correct trials for an original fixed digit sequence |
| `DIGBACCT_ANALOGUE` | `ns_backward_correct_trials` | Number Span backward | Count, 0-14 | Rule-based correct trials for an original fixed digit sequence |

## Composite status

| Field | Type | Values | Meaning |
|---|---|---|---|
| `eti_input_status` | String | `eight_inputs_complete` or `pending_or_incomplete` | Whether all eight analogue values are finite in the compiled report |
| `eti_value` | Null | `null` | Composite deliberately not calculated |
| `eti_value_status` | String | `not_computed_normative_parameters_required` | A validated composite requires authorized definition, normative parameters, and direct validation |

## Original Story Recall summary fields

| Field | Type or range | Meaning |
|---|---|---|
| `osr_immediate_verbatim` | Count, 0-44 or null | Approved immediate original-story verbatim units |
| `osr_delayed_verbatim` | Count, 0-44 or null | Approved delayed original-story verbatim units |
| `osr_immediate_paraphrase` | Count, 0-25 or null | Approved immediate paraphrase units |
| `osr_delayed_paraphrase` | Count, 0-25 or null | Approved delayed paraphrase units |
| `osr_delay_duration_ms` | Milliseconds or null | Observed story retention interval |
| `osr_delay_out_of_window` | Boolean or null | Whether the observed delay violated the configured acceptance window |
| `osr_story_audio_standardized` | Boolean or null | Whether the frozen expected story audio was used; not evidence of psychometric validation |
| `osr_audio_set_version` | String or null | Frozen audio-set identifier |
| `osr_task_version` | String or null | Task implementation version |
| `osr_dictionary_version` | String or null | Scoring dictionary version |
| `osr_story_form` | String or null | Original story form identifier |
| `OSR_IMM_PARAPHRASE` | Count, 0-25 or null | Compiled immediate paraphrase output |
| `OSR_DEL_PARAPHRASE` | Count, 0-25 or null | Compiled delayed paraphrase output |

## Animal Semantic Fluency summary fields

| Field | Type or range | Meaning |
|---|---|---|
| `asf_total_valid_unique` | Count or null | Final examiner-approved unique valid animal responses |
| `asf_total_valid_unique_raw` | Count or null | Preliminary raw unique-valid count before examiner adjudication |
| `asf_repetitions` | Count or null | Repeated animal responses |
| `asf_rule_violations` | Count or null | Responses failing the task rules |
| `asf_uncertain_responses` | Count or null | Responses requiring manual classification |
| `asf_prompt_used` | Boolean or null | Whether a prompt was delivered |
| `asf_ended_early` | Boolean or null | Whether the response period ended prematurely |
| `asf_review_status` | String or null | Examiner review/adjudication state |
| `asf_task_version` | String or null | Task implementation version |
| `asf_dictionary_version` | String or null | Accepted-animal dictionary version |

## Original Visual Naming summary fields

| Field | Type or range | Meaning |
|---|---|---|
| `ovn_total_with_semantic` | Count, 0-32 or null | Approved naming total including permitted semantic-cue responses |
| `ovn_total_uncued` | Count, 0-32 or null | Approved naming responses without a cue |
| `ovn_items_administered` | Count, 0-32 or null | Number of items actually administered |
| `ovn_review_status` | String or null | Examiner review/adjudication state |
| `ovn_task_version` | String or null | Task implementation version |
| `ovn_stimulus_set` | String or null | Original image-set version |
| `OVN_UNCUED` | Count, 0-32 or null | Compiled uncued naming output |

## Original Complex Figure summary fields

| Field | Type or range | Meaning |
|---|---|---|
| `ocf_copy_score` | Count, 0-17 or null | Examiner-reviewed original-figure copy score |
| `ocf_delayed_score` | Count, 0-17 or null | Examiner-reviewed original-figure delayed recall score |
| `ocf_recognition_correct` | Boolean/binary or null | Recognition decision for the original figure and foils |
| `ocf_delay_duration_ms` | Milliseconds or null | Observed figure retention interval |
| `ocf_task_version` | String or null | Task implementation version |
| `OCF_RECOG` | Binary, 0-1 or null | Compiled original-figure recognition output |

## Number Span summary fields

| Field | Type or range | Meaning |
|---|---|---|
| `ns_forward_correct_trials` | Count, 0-14 or null | Correct original forward-span trials |
| `ns_backward_correct_trials` | Count, 0-14 or null | Correct original backward-span trials |
| `ns_forward_span` | Digits, 0 or 3-9, or null | Longest correctly reproduced forward sequence |
| `ns_backward_span` | Digits, 0 or 2-8, or null | Longest correctly reproduced backward sequence |
| `ns_audio_standardized` | Boolean or null | Whether the expected frozen digit audio was used; not evidence of language validation |
| `ns_audio_set_version` | String or null | Frozen digit-audio version |
| `ns_task_version` | String or null | Task implementation version |
| `ns_sequence_version` | String or null | Fixed original digit-sequence version |
| `NS_FWD_SPAN` | Digits or null | Compiled longest forward span |
| `NS_BWD_SPAN` | Digits or null | Compiled longest backward span |

## Visual Sequencing and Set-Shifting

| Field | Type or range | Meaning |
|---|---|---|
| `completion_time_sequencing_ms` | Milliseconds or null | Original sequencing completion time |
| `completion_time_set_shifting_ms` | Milliseconds or null | Original alternating-sequence completion time |
| `errors_sequencing` | Count or null | Sequencing commission errors |
| `errors_set_shifting` | Count or null | Alternating-sequence commission errors |
| `correct_connections_sequencing` | Count, 0-24 or null | Correct sequencing connections |
| `correct_connections_set_shifting` | Count, 0-24 or null | Correct alternating-sequence connections |
| `traila_timed_out` | Boolean or null | Whether the 150-second sequencing limit was reached |
| `trailb_timed_out` | Boolean or null | Whether the 300-second alternating-sequence limit was reached |
| `set_shifting_cost_ms` | Milliseconds or null | Alternating-sequence time minus sequencing time |
| `set_shifting_ratio` | Ratio or null | Alternating-sequence time divided by sequencing time |
| `TRAILA_TIME_SEC_ANALOGUE` | Seconds, 0-150 or null | Compiled original sequencing time; not an official Trail A score |
| `TRAILB_TIME_SEC_ANALOGUE` | Seconds, 0-300 or null | Compiled original alternating-sequence time; not an official Trail B score |
| `TRAILA_ERRORS_ANALOGUE` / `TRAILB_ERRORS_ANALOGUE` | Count or null | Compiled commission errors |
| `TRAILA_CONNECTIONS_ANALOGUE` / `TRAILB_CONNECTIONS_ANALOGUE` | Count, 0-24 or null | Compiled correct connections |
| `VS_SHIFT_COST_SEC` | Seconds or null | Compiled shift cost |
| `VS_SHIFT_RATIO` | Ratio or null | Compiled shift ratio |

## Object-Location Memory

| Field | Type or range | Meaning |
|---|---|---|
| `euclidean_error_px` | Pixels or null | Trial-level Euclidean distance between target and response |
| `normalized_error` | Proportion, normally 0-1 or null | Trial error divided by the current arena diagonal |
| `response_time_ms` | Milliseconds or null | Task-specific response latency |
| `block_number` | Integer | Practice or main-block identifier |
| `response_x` / `response_y` | Pixels or null | Response coordinates; missing if no response was recorded |
| `encoding_duration_ms` | Milliseconds | Configured encoding interval; standard timing 25000 ms |
| `delay_duration_ms` | Milliseconds | Configured delay interval; standard timing 15000 ms |
| `object_positions_json` | JSON string | Presented object coordinates; controlled stimulus/response information |
| `olm_mean_euclidean_error_px` | Pixels or null | Mean main-trial Euclidean error |
| `olm_median_euclidean_error_px` | Pixels or null | Median main-trial Euclidean error |
| `olm_mean_normalized_error` | Proportion or null | Mean main-trial arena-normalized error |
| `olm_response_time_mean_ms` | Milliseconds or null | Mean main-trial response time |
| `olm_missing_responses` | Count | Main trials without a response coordinate; interpret only when the task was administered |
| `olm_block_1_mean_error_px` / `olm_block_2_mean_error_px` / `olm_block_3_mean_error_px` | Pixels or null | Block-specific mean Euclidean errors |
| `OLM_MEAN_ERROR_PX` | Pixels or null | Compiled mean Euclidean error |
| `OLM_MEAN_NORM_ERROR` | Proportion or null | Compiled mean normalized error |
| `OLM_ACCURACY_100` | Technical score, 0-100 or null | `100 * (1 - mean normalized error)`; not a percentile |

## Spatial Pointing

| Field | Type or range | Meaning |
|---|---|---|
| `absolute_angular_error_degrees` | Degrees, 0-180 or null | Unsigned trial-level directional error |
| `signed_angular_error_degrees` | Degrees or null | Directional error retaining clockwise/counterclockwise sign |
| `arena_radius_px` | Pixels | Arena radius used for the trial |
| `practice_or_main` | String | `practice` or `main` |
| `sp_mean_absolute_angular_error_deg` | Degrees, 0-180 or null | Mean main-trial unsigned angular error |
| `sp_median_absolute_angular_error_deg` | Degrees, 0-180 or null | Median main-trial unsigned angular error |
| `sp_signed_bias_deg` | Degrees or null | Mean signed angular error |
| `sp_response_time_mean_ms` | Milliseconds or null | Mean main-trial response time |
| `SP_MEAN_ABS_ERROR` | Degrees, 0-180 or null | Compiled mean unsigned angular error |
| `SP_ACCURACY_100` | Technical score, 0-100 or null | `100 * (1 - mean absolute angular error / 180)`; not a percentile |

## Change control

Any change to exported names, score ranges, null semantics, task selection, review state, language forms, stimuli, audio, timing, device requirements, or remote data flow requires a versioned dictionary update and targeted revalidation. Store research exports outside the public repository and apply the approved retention/deletion policy.
