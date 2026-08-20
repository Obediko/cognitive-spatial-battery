# Protocol Description — ETI-Aligned Experimental Battery

## Status and purpose

This is a supervised baseline research prototype for participant characterization, covariates, and exploratory moderation. It is not a diagnostic instrument, an intervention outcome, a NACC battery, or a norm-equivalent substitute for licensed tests. Estimated participant administration time is approximately 30–45 minutes for the ETI core and 45–65 minutes when all additional tasks are selected. Actual duration varies with response speed and delayed-recall gates.

## Administration

- Browser-based jsPsych 7 application served over HTTP(S)
- Researcher present; examiner verification required for language and figure scores
- Laptop or sufficiently large tablet; minimum recommended viewport 900 × 600, preferred 1280 × 800
- Mouse/trackpad, touch, keyboard, and standard gamepad supported
- Quiet environment, stable volume, fullscreen recommended
- Input modality, viewport, screen geometry, pixel ratio, and controller connection recorded
- Do not pool input modalities until measurement equivalence has been established

## ETI core: five test families and eight component scores

1. **Original Story Recall:** immediate and delayed examiner-verified verbatim scores (two ETI inputs).
2. **Animal Semantic Fluency:** valid unique animals in 60 seconds (one ETI input).
3. **Original Visual Naming:** examiner-verified original-item naming total (one ETI input).
4. **Original Complex Figure:** copy and delayed-recall element totals (two ETI inputs); recognition is secondary.
5. **Number Span:** forward and backward correct-trial totals (two ETI inputs); longest spans are secondary.

## Separate outcomes

- **Trail comparators:** custom Trail A/B analogues, ending after 25 targets/24 connections or at 150/300 seconds. They are not ETI inputs.
- **Additional spatial outcomes:** Object-Location Memory and 2D Spatial Pointing. They have no direct NACC C2 counterparts and are not ETI inputs.

Detailed administration, stimuli, cueing, stopping, and scoring rules are in `docs/eti-core/` and the task modules.

## Task order

The full-battery order is story immediate, figure copy, animal fluency, visual naming, Number Span, figure delayed, story delayed, optional object-location and pointing measures, then Trail A/B last. Delay gates and actual delay metadata remain authoritative.

## English and German forms

Language is selected before participant identification and locked for the session. Every trial stores language and form versions. Whisper receives an explicit English/German language constraint. German story, naming lexicon and instructions are parallel pilot materials; measurement invariance and language-specific norms have not been established. German browser-generated story/digit audio is non-standardized until frozen recordings are added and validated.

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
