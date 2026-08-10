# Validation and Release Plan

Status: **software-integrated, empirically unvalidated**. Passing CI proves code behavior only; it does not establish reliability, validity, norms, or equivalence.

## Release gates

| Gate | Minimum evidence | Current status |
|---|---|---|
| Rights and provenance | Per-file creator/source, licence, permitted use, immutable hash | Blocked pending OLM image ledger completion |
| Audio file QA | Format, channel, sample rate, peak/clipping, leading/trailing silence, duration, loudness report | Pending |
| Audio listening validation | Independent listeners; pronunciation/intelligibility acceptance criteria defined before testing | Pending |
| OSR scoring | Dual independent scoring, adjudication, unit-level agreement and total-score ICC | Pending |
| ASF scoring | Dual coding, duplicate/rule-violation agreement, adjudication guide | Pending |
| OVN stimuli/norms | Name agreement, visual recognizability, cultural/language review, difficulty ordering | Pending |
| OCF scoring | Element manual, blinded double scoring, inter-rater reliability, recognition-foil review | Pending |
| Number Span | Sequence review, acoustic onset distribution across supported devices, discontinuation simulations | Pending |
| Device/input equivalence | Laptop/tablet and pointer/touch/gamepad strata; predefined equivalence bounds | Pending |
| Browser timing | Supported browser/device matrix; observed audio onset and visual timing tolerances | Pending |
| Accessibility/usability | Keyboard/controller reachability, contrast, screen reader review where applicable, examiner usability | Pending |
| Recovery/export | Forced reload, quota failure, missing audio, duplicate ID, and export completeness drills | Pending |
| Governance | Supervisor, ethics, data-management, version-freeze and change-control approval | Pending |

## Required study outputs

1. Freeze a release candidate and stimulus manifest.
2. Run scripted software acceptance tests on every supported browser/device/input combination.
3. Produce acoustic QA tables for every WAV file and preserve analysis scripts.
4. Pilot with a prospectively chosen sample and exclusions; do not tune thresholds after seeing outcomes without versioning the change.
5. Double-score all language and figure pilot responses, report agreement and adjudication.
6. Report missingness, technical failures, task completion, floor/ceiling effects, response distributions, and administration time.
7. Decide whether modalities are equivalent. If not, restrict the protocol or analyse them separately.
8. Obtain written sign-off and tag the approved code/stimulus version.

## Change control

Any change to story wording, acceptable alternatives, drawings, cues, figure geometry, digit sequences, audio, timing, stopping rules, scoring, supported devices, or dependencies requires a new version and targeted revalidation. Never describe a merely generated or successfully loaded audio file as validated.
