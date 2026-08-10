# Protocol Description — Experimental Eight-Task Battery

## Status and purpose

This is a supervised baseline research prototype for participant characterization, covariates, and exploratory moderation. It is not a diagnostic instrument, an intervention outcome, a NACC battery, or a norm-equivalent substitute for licensed tests. Estimated full administration time is approximately 28–38 minutes, with longer sessions possible when delayed-recall gates or examiner review require it.

## Administration

- Browser-based jsPsych 7 application served over HTTP(S)
- Researcher present; examiner verification required for language and figure scores
- Laptop or sufficiently large tablet; minimum recommended viewport 900 × 600, preferred 1280 × 800
- Mouse/trackpad, touch, keyboard, and standard gamepad supported
- Quiet environment, stable volume, fullscreen recommended
- Input modality, viewport, screen geometry, pixel ratio, and controller connection recorded
- Do not pool input modalities until measurement equivalence has been established

## The eight tasks and outcomes

1. **Original Story Recall (OSR-44):** original story, immediate and delayed recall, local audio recording, examiner-verified verbatim (0–44) and paraphrase scores. Automatic local transcription provides suggestions only.
2. **Animal Semantic Fluency (ASF-60):** independently worded 60-second animal naming; valid unique total, repetitions, rule violations, uncertainty, prompt use.
3. **Original Visual Naming (OVN-32):** original SVG line drawings; uncued and cue-assisted examiner scoring, with six-failure discontinuation. Not MINT.
4. **Original Complex Figure (OCF-17):** original abstract figure; copy, 10–15 minute delayed recall, recognition, examiner element scoring. Not the Benson figure.
5. **Number Span:** fixed `ons-controlled-form-a-1.0`; forward lengths 3–9, backward 2–8, two trials per length, discontinue after both items at a length fail.
6. **Visual Sequencing and Set-Shifting:** custom numeric sequencing and alternating alphanumeric conditions; completion time, errors, cost, ratio. Not TMT.
7. **Object-Location Memory:** practice plus three eight-object blocks; encoding, delay, location reconstruction; raw and normalized error.
8. **2D Spatial Pointing:** six landmarks, practice, 18 main trials; absolute and signed angular error.

Detailed administration, stimuli, cueing, stopping, and scoring rules are in `docs/eti-core/` and the task modules.

## Task order

The full-battery order is OSR immediate, OCF copy, visual sequencing/set-shifting, OSR delayed, animal fluency, visual naming, object-location memory, spatial pointing, number span, then OCF delayed recall/recognition. Delay gates enforce the task-specific minimum intervals; actual delay is saved.

## Scoring controls

- OSR automatic matches require complete adjacent tokens, never substrings, and preserve match evidence for review.
- Language and figure scores are examiner-verified; automatic output must not be accepted blindly.
- Number Span uses a fixed versioned form; presented and expected sequences are retained in research exports and must be access-controlled.
- Missing/incomplete administrations remain missing or explicitly incomplete; they are not silently converted to zero.
- Pilot scores must not be interpreted against NACC or clinical norms.

## Data handling

Only pseudonymous participant IDs are permitted. Trials and summaries are locally checkpointed for crash recovery. Audio remains local and must be downloaded separately. The application does not upload participant data, but it does download front-end libraries and, if enabled, the local ASR model. Store exports according to the approved institutional data-management plan and never in GitHub.

## Pre-release gates

No confirmatory participant data collection should begin until the validation plan is signed off, including stimulus rights/provenance, synthetic-audio acoustic QA and listening validation, naming norms, complex-figure scoring reliability, language scoring reliability, device/input equivalence, accessibility, browser timing, recovery/export drills, and ethics/supervisor approval.
