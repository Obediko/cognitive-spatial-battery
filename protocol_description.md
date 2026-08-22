# CognitiveBA3 Research Protocol and Administration Specification

**Software citation:** Apochi and Axmacher (2026), https://doi.org/10.5281/zenodo.22059989.  
**Document scope:** protocol-independent research-software specification, not an approved study protocol.  
**Current status:** supervised software testing and piloting; psychometric, language, licensing, and governance gates remain open.

## Purpose and scientific scope

CognitiveBA3 is intended to characterize multiple cognitive and spatial constructs using independently developed browser-based tasks. The five-family cognitive core assesses immediate and delayed verbal memory, semantic retrieval, confrontation naming, visuoconstruction, delayed visual recall, and forward/backward auditory span. Optional modules assess object-location association, spatial directional judgment, and visual sequencing/set shifting.

The architecture is informed by the broad domain coverage of the NACC UDS version 3 neuropsychological battery (Weintraub et al., 2018). Optional spatial modules are motivated by human evidence linking spatial memory and navigation to distributed medial temporal networks (Doeller et al., 2010; Laczó et al., 2022). These references support construct selection, not equivalence between the CognitiveBA3 tasks and any established instrument.

The package does not establish an intervention endpoint, anatomical specificity, diagnostic accuracy, disease classification, an approved ETI computation, or eligibility for clinical use. No unpublished study-specific targets, stimulation parameters, or institution-specific experimental workflows are required to operate the battery.

## Administration environment

- Serve the jsPsych 7.3.4 application over HTTP or HTTPS; `file://` administration is unsupported.
- Use a quiet environment, a researcher-supervised session, a stable audio output level, and an appropriately sized laptop or tablet.
- Minimum recommended viewport: 900 x 600 pixels. Preferred viewport: at least 1280 x 800 pixels.
- Supported inputs are mouse, trackpad, touch, keyboard, and standard gamepad. Record the input modality, display geometry, and device pixel ratio.
- Do not pool device types or input modalities until prespecified equivalence criteria are met.
- Use a pseudonymous study identifier only. Store the identity key, if one exists, separately under institutional governance.
- The shortened development timing switch must remain disabled for research administrations. A correct switch setting alone does not constitute approval to collect research data.

## Cognitive core and outcome mapping

| Task family | Construct | Experimental output | Score range | Review requirement |
|---|---|---|---|---|
| Original Story Recall | Immediate verbal episodic memory | `CRAFTVRS_ANALOGUE` | 0-44 | Examiner verification |
| Original Story Recall | Delayed verbal episodic memory | `CRAFTDVR_ANALOGUE` | 0-44 | Examiner verification |
| Animal Semantic Fluency | Category-based semantic retrieval | `ANIMALS_ANALOGUE` | 0-77 reference range | Examiner verification |
| Original Visual Naming | Object identification and lexical retrieval | `MINTTOTS_ANALOGUE` | 0-32 | Examiner verification |
| Original Complex Figure | Visuoconstruction | `UDSBENTC_ANALOGUE` | 0-17 | Examiner verification |
| Original Complex Figure | Delayed visual reproduction | `UDSBENTD_ANALOGUE` | 0-17 | Examiner verification |
| Number Span | Forward auditory span | `DIGFORCT_ANALOGUE` | 0-14 | Controlled rule-based scoring |
| Number Span | Backward auditory span | `DIGBACCT_ANALOGUE` | 0-14 | Controlled rule-based scoring |

These eight values are produced by five task families. Matching score ranges or conceptual domains does not establish common item difficulty, normative equivalence, interchangeable administration, equivalent error variance, or portability of a published composite model.

The export deliberately leaves `eti_value` missing and labels its status `not_computed_normative_parameters_required`. A future composite requires the exact authorized formula, appropriate normative parameters and covariance structure, a frozen model version, and direct validation of the independently developed task forms.

## Optional outcomes

Object-Location Memory records Euclidean error, arena-normalized error, response time, block, and stimulus positions. Its current implementation loads 24 JPEG images listed in `assets/images/objects/provenance_ledger.csv`; rights clearance remains unresolved. If those files are missing, the task can render programmatic placeholder objects instead, but changing the stimulus format requires a new version and targeted validation.

Spatial Pointing records absolute and signed angular error, target identity, start position, response time, and arena geometry. Its technical 0-100 accuracy transformation is not a percentile or clinical threshold.

Visual Sequencing/Set-Shifting records completion time, errors, correct connections, timeout status, and derived shift cost. The custom comparator uses 150-second and 300-second limits and runs last when selected. It is neither an official Trail Making Test administration nor an ETI input.

## Task order and retention intervals

The intended full-battery sequence is:

1. Original Story Recall: immediate recall.
2. Original Complex Figure: copy and memory warning.
3. Animal Semantic Fluency.
4. Original Visual Naming.
5. Number Span: forward and backward.
6. Original Story Recall: delayed recall.
7. Original Complex Figure: delayed recall and recognition.
8. Selected Object-Location Memory and Spatial Pointing modules.
9. Selected Visual Sequencing/Set-Shifting comparator.

Story delayed recall precedes figure delayed recall because the story retention interval begins earlier. Observed intervals and out-of-window flags determine whether an administration is acceptable. Document interruptions, device failures, examiner departures from instructions, and rescheduling.

Planning estimates are 30-45 minutes for the cognitive core and 45-65 minutes when all optional modules are administered. These estimates are not empirical validation findings and must be replaced or supplemented by observed median and percentile durations after pilot testing.

## English and German administration

Select the language before participant identification and keep it fixed throughout the session. Trial and summary exports retain `administration_language`, locale, language-form version, task-specific form versions, and language-equivalence status.

Both languages have frozen repository recordings for story presentation, prompts, digit instructions, and digits. The English voice uses Kokoro. The German voice uses offline Piper synthesis with the Thorsten High model. Missing standardized stimulus audio pauses the affected task rather than invoking browser speech synthesis as a substitute.

Fixed recordings and a completed technical acoustic check establish file reproducibility only. They do not establish native-speaker intelligibility, cross-device acoustic equivalence, translation equivalence, equivalent item difficulty, or measurement invariance. The German form is explicitly classified as a pilot form. English and German results must not be pooled or directly compared until the relevant language gates are satisfied.

## Examiner review and scoring controls

Participant administration ends before examiner scoring. Authorized research staff review story responses, animal-fluency responses, visual-naming responses, and complex-figure productions separately through `admin.html`.

- Automatic transcription and lexical matches are provisional evidence, not final scoring decisions.
- Verbatim and paraphrase responses require documented unit-level rules and adjudication.
- Naming scores must distinguish uncued recognition, semantic-cue responses, phonemic-cue responses, and unresolved classifications.
- Animal-fluency scoring must separate unique valid animals, repetitions, rule violations, uncertain responses, and examiner prompts.
- Figure scores must preserve element-level decisions, phase completion, and examiner review status.
- Number Span uses a frozen, versioned sequence form. Sequence content in restricted exports must be protected against disclosure to future participants.
- Unadministered, incomplete, failed, and unreviewed outcomes must remain missing or explicitly flagged. They must not be converted to zero.

## Data flow and remote synchronization

The browser checkpoints trials, summaries, task-selection metadata, drawings, and session state locally for recovery. Response recordings are retained as browser-controlled artifacts when captured.

When the secure Netlify deployment and its server-side secrets are configured, the application posts pseudonymous session checkpoints and eligible recordings to same-origin Netlify Functions. The server stores these materials in private Netlify Blobs for approved cross-device examiner access. Drawings are contained in the uploaded checkpoint. This is remote processing and cannot be represented as local-only storage.

A local server or an unconfigured synchronization endpoint does not provide functioning remote storage, although the application may attempt same-origin synchronization requests. Separate browser requests fetch pinned front-end libraries and, when automatic transcription is used, a speech-recognition model. Recorded audio is not sent to those external dependency providers by the transcription workflow itself.

Voice is potentially identifying even when the associated study identifier is pseudonymous. Before deployment, record the data controller, approved processing locations, access roles, consent wording, retention periods, deletion mechanism, incident response, and institutional ethics/data-protection sign-off. See `docs/remote-sync-setup.md`.

## Data products and interpretation

The project produces trial-level CSV, full-session JSON, summary JSON, compiled reference-oriented exports, and response-audio files when available. Variables, score ranges, units, missingness semantics, sensitivity, and review dependencies are defined in `docs/data_dictionary.md`.

NACC-like field labels identify conceptual mappings only. Neither the raw values nor the optional 0-100 transformations are validated clinical scores, normative percentiles, diagnoses, or substitute values for an official NACC data submission.

## Release gates

Use `docs/validation/validation_plan.md` for predefined pilot sampling, scoring reliability, language review, device and timing checks, rights clearance, data governance, and final stop/go decisions. Do not begin confirmatory data collection until every relevant gate has written approval. A Zenodo DOI, passing unit tests, and successful deployment do not constitute that approval.

Academic and technical sources are listed in `REFERENCES.md` and `REFERENCES.bib`.
