# CognitiveBA3 Validation and Research-Release Plan

**Status:** software-integrated and DOI-archived, but empirically unvalidated.  
**Scope:** original English and German cognitive/spatial pilot tasks; no diagnostic, normative, or intervention claims.  
**Rule:** passing software tests does not establish reliability, validity, cross-language equivalence, ethical approval, or stimulus rights.

## Decision framework

Every gate has one of four states: `not_started`, `in_progress`, `passed`, or `blocked`. A gate passes only when the required evidence, frozen software/stimulus version, reviewer identity, date, and written decision are recorded. A failed or incomplete gate blocks the affected task, language, device, deployment, or study claim. A DOI does not override this rule.

The figures below are **proposed minimum planning thresholds**, not completed findings, universal psychometric standards, or a substitute for a study-specific sample-size calculation. The supervising research team must approve or amend them before recruitment and document any amendment before examining outcome data.

## Stage 0: governance and rights

| Gate | Required evidence | Proposed pass rule | Current status |
|---|---|---|---|
| Study governance | Written ethics decision, participant-information wording, data controller, retention/deletion schedule, examiner access roles | All applicable institutional approvals complete before participant data collection | Not documented as passed |
| Remote storage | Netlify deployment review, server-side secrets, same-origin endpoint inspection, private Blob access and deletion drill | No participant upload without explicit approved consent and data-protection authorization | Configuration-dependent |
| Object-location images | `assets/images/objects/provenance_ledger.csv` with immutable Git object identifier, creator, original source, licence, permission, and reviewer decision for every file | 24 of 24 files cleared, removed, or replaced before redistribution or research use of those stimuli | Blocked: creator/source/permission unknown |
| Visual-naming assets | Item-level image manifest, attribution, modification notice, ShareAlike terms, and primary BOSS rightsholder evidence | Every selected asset has documented reuse terms and required attribution | BOSS primary licence confirmation pending |
| Version freeze | Git commit, stimulus manifest, language forms, task definitions, and dependency versions preserved | One exact approved research version recorded before data collection | Pending |

An inventory or Git blob identifier documents which file was reviewed; it does not establish ownership or permission.

## Stage 1: technical feasibility

Test each planned browser/device/input combination with scripted synthetic sessions and disposable pseudonymous pilot sessions.

| Domain | Minimum evaluation | Proposed acceptance threshold |
|---|---|---|
| Session completion | At least 10 complete synthetic or staff-run sessions per approved browser/device/input configuration | At least 95% complete without unrecovered crash; every failure classified |
| Exports | Compare trial CSV, full JSON, summary JSON, compiled report, language metadata, and available artifacts | 100% of required fields present; no silent conversion of missing values to zero |
| Recovery | Forced refresh, unavailable audio, temporary network failure, duplicate identifier, exhausted local storage, and interrupted examiner review | No silent participant-data loss; recovery state and failure reason documented |
| Access and deletion | Unauthorized examiner request, incorrect password, cross-origin attempt, missing secret, remote deletion, and local deletion | 100% of unauthorized requests rejected; approved deletion removes the intended disposable record |
| Audio-file integrity | Inspect every English and German WAV for file identity, channel count, sample rate, clipping, edge silence, total and active speech duration, and RMS spread | Mono 48 kHz, 16-bit PCM; zero exact clipped samples; at least 1 dB peak headroom; edge silence no longer than 300 ms; digit duration 350–949 ms; at least 40 ms trailing silence; active digit speech at least 220 ms; digit RMS spread no more than 3 dB. German v2 digits with active speech under 320 ms are surfaced for mandatory perceptual re-review. |
| Browser/audio timing | Record at least 30 repeated trials or playback onsets for each relevant approved browser/device combination | Prespecified deviation bound approved before testing; default planning target: median absolute onset deviation at most 50 ms and 95th-percentile deviation at most 100 ms |
| Accessibility/usability | Keyboard reachability, visible focus, contrast, microphone error handling, task readability, and examiner scoring workflow | No critical accessibility or examiner-workflow defect on an approved configuration |

Timing thresholds are engineering acceptance targets. They must be justified against the actual study question, display refresh rate, audio hardware, measurement method, and task sensitivity; meeting them does not guarantee millisecond-accurate stimulus presentation.

## Stage 2: supervised feasibility pilot

Before recruitment, record the eligible population, language proficiency, sensory and motor requirements, consent procedure, exclusion rules, approved device class, selected modules, and analysis population. Record whether repeated assessments, alternative forms, or bilingual administrations are justified and ethically approved.

**Suggested starting sample:** at least 20 evaluable administrations per planned language form, with a target of 30 per form if recruitment is feasible. This sample is for feasibility, scoring procedures, and preliminary uncertainty estimation. It is not sufficient to establish clinical norms, diagnostic accuracy, measurement invariance, or stable population reference intervals.

Report:

- number approached, enrolled, completed, interrupted, and excluded, with reasons;
- participant language proficiency and relevant demographic descriptors approved by the study protocol;
- median, interquartile range, and range for core and optional-module administration times;
- response missingness and technical failures by task, language, browser, device, and input method;
- outcome distributions, floor/ceiling frequencies, review time, and unresolved scoring decisions;
- observed story and figure retention intervals and the proportion outside the predefined window.

Proposed feasibility gates are at least 90% complete core sessions, less than 5% missing primary outputs attributable to avoidable software failure, and no unresolved privacy, rights, or safety incident. A threshold failure requires root-cause analysis, a documented remediation, and a new frozen version before confirmatory use.

## Stage 3: examiner scoring reliability

Two trained raters should independently score all feasibility-pilot story, animal-fluency, visual-naming, and complex-figure records, blinded to each other's decisions. Preserve response evidence, original classifications, item-level decisions, adjudication, score version, and rater identifiers in controlled research storage.

- For continuous total scores, report a prespecified two-way, absolute-agreement intraclass correlation coefficient, its exact model, single-versus-average-rater form, 95% confidence interval, software, and missing-data policy.
- For categorical decisions and binary element classifications, report Cohen's kappa or a prespecified prevalence-robust alternative with 95% confidence intervals and raw agreement.
- Report disagreement patterns and limits of agreement where absolute score differences are consequential; correlation alone does not establish interchangeability.
- Proposed planning thresholds: ICC point estimate at least 0.80 with lower 95% confidence limit at least 0.70 for intended total scores; categorical agreement at least 0.80 and kappa at least 0.70 where estimable.
- Review score distributions before interpreting any threshold. Restricted score range can depress or inflate summary reliability, and kappa can be unstable when categories are highly imbalanced.

Thresholds are provisional and must be accepted prospectively. If a task fails, revise its scoring manual, retrain examiners, freeze the revised version, and repeat independent scoring. Relevant reporting guidance is Koo and Li (2016).

## Stage 4: test-retest and practice effects

For tasks intended for repeated measurement, plan a separate test-retest subsample of at least 20 evaluable participants per relevant language or device configuration, with a target of 30 when feasible. Prespecify the retest interval, whether the same stimulus form is reused, exposure history, and expected practice effects.

Report absolute-agreement ICC and 95% confidence intervals, mean change, individual change distributions, and 95% limits of agreement. A provisional pass target is ICC at least 0.75 with no unacceptably large systematic practice effect under the study-specific decision threshold.

Do not claim alternate-form reliability unless an independent alternate story, figure, naming set, or digit form has actually been developed and tested. The current Number Span sequence is deliberately fixed and therefore requires special consideration before repeated administrations.

## Stage 5: English-German language review

English and German forms remain separate until linguistic and measurement evidence supports the intended comparison.

1. Have at least two appropriately qualified bilingual reviewers independently assess semantic, idiomatic, conceptual, and task-demand correspondence for instructions, stories, cues, accepted-response dictionaries, digit wording, and naming terms.
2. Have at least two native German listeners review the complete frozen German audio set for audibility, pronunciation, naturalness, intelligibility, truncation, and misleading emphasis. Record file-level decisions rather than treating acceptance of a few previews as approval of the entire set.
3. Pilot each form in the intended population and report item-level missingness, recognition, naming agreement, semantic-cue use, scoring disagreements, and administration time separately.
4. Prespecify a bilingual or matched-group comparison design if direct cross-language pooling is intended. Define acceptable score differences and examine differential item behavior where sample size permits.
5. Do not claim formal measurement invariance from a small pilot. Confirmatory invariance modeling requires an independently justified sample size and model.

A proposed initial audio/content gate is 100% review coverage with no critical mistranslation or unintelligible item and at least 90% item-level native-listener acceptability. These are release criteria, not evidence of clinical equivalence. Cross-cultural adaptation principles are discussed by Beaton et al. (2000).

## Stage 6: stimulus properties and construct validity

- Visual naming: collect name agreement, dominant and alternative responses, familiarity, recognizability, cultural appropriateness, and item difficulty for each of the 32 images. A provisional feasibility target is at least 80% modal-name agreement per item in the intended language, followed by documented review of exceptions.
- Complex figure: confirm the eight-element rubric, recognizability, placement rules, recognition-foil difficulty, drawing-device effects, and floor/ceiling behavior.
- Story recall: assess immediate and delayed score distributions, unit coverage, intrusion coding, examiner agreement, and story difficulty.
- Animal fluency: audit dictionary coverage, morphological variants, duplicates, categories, prompt effects, and the 60-second administration interval.
- Number Span: review sequence composition, discontinuation behavior, observed digit onset intervals, forward/backward score distributions, and repeated-exposure effects.
- Optional spatial tasks: review arena geometry, screen normalization, landmark visibility, object-image rights, trial counts, accuracy transformations, and input-dependent errors.

Convergent validity requires an ethically and legally authorized comparison instrument with a prospectively defined hypothesis. A correlation with a reference task does not demonstrate identical scores, interchangeable norms, or eligibility for official NACC submission.

## Stage 7: device and input comparability

For each planned pair of device or input conditions, use a counterbalanced repeated-measures design where appropriate. Record browser version, operating system, viewport, display geometry, input method, audio equipment, and participant exposure order.

Prespecify equivalence margins for each primary outcome before data collection. Suggested engineering planning limits are an absolute difference no greater than 5% of the task score range for bounded cognitive totals, 5 degrees for mean pointing error, and 0.05 for mean normalized object-location error. These values are provisional and must be justified or replaced according to the study's actual measurement requirements.

Evaluate bias, uncertainty, practice/order effects, and 90% confidence intervals against the prespecified equivalence interval. If equivalence is not demonstrated, restrict administration to the approved configuration or model conditions separately. Do not infer equivalence from a nonsignificant difference test.

## Missingness and analysis rules

- Define the analysis population, task selection, review requirements, exclusion rules, and duplicate-session policy before inspection of pilot outcomes.
- Treat unadministered, interrupted, technically failed, examiner-pending, and invalid-delay outcomes as distinct states.
- Retain `null`/empty missing outcomes; do not impute zero or compute an ETI value from incomplete or unvalidated analogue measures.
- Summarize missingness by task, language, device, and failure mechanism.
- Record all post-freeze edits to instructions, stimuli, dictionaries, audio, timing, scoring, dependency versions, device requirements, and storage configuration.
- Repeat the affected gate after any material change.

## Current evidence and unresolved limitations

The previously archived automated English audio report analyzed 17 files using `scripts/audio_qa.py` and recorded GitHub Actions run 24 with artifact `9055037763`. The English researcher listening review was reported complete. These facts support technical and owner-level checks only; they do not establish independent listener agreement or cross-device equivalence.

The German pilot audio set contains frozen recordings generated offline with Piper and the Thorsten High voice. Pilot listening on 2026-08-27 identified the German digit 5 recording as perceptually too brief, and technical QA also prioritizes digit 8 because both contain under 320 ms of active speech. The v2 set is therefore reopened for file-level perceptual review; see `docs/validation/german_audio_v3_review.md`. Automated checks and owner-approved previews do not replace complete native-listener review, independent scoring, cross-language evaluation, or confirmation on the final approved device configuration.

The 24 object-location JPEGs now have a per-file inventory with immutable Git blob identifiers. Their creator, original source, licence, and redistribution permissions remain unknown. The existence of a ledger changes documentation completeness, not legal clearance.

## Release decision

Before any confirmatory study, retain a dated sign-off identifying the approved code commit, task modules, language form, stimulus versions, data-flow configuration, reviewer names, unresolved limitations, and intended analysis. Any gate relevant to the intended claim that is `blocked` or `not_started` prevents that use.

Supporting sources are collected in `REFERENCES.md` and `REFERENCES.bib`.
