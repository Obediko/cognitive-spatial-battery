# Original Complex Figure (OCF-17) pilot specification

## Status and stimulus boundary

OCF-17 is an experimental, independently created visuoconstruction and visual-memory task. It is not the Benson Complex Figure, and its scores must not be labelled, normed or interpreted as Benson scores. The stimulus, foils, labels and element rubric in this repository are original.

The administration structure is informed by publicly documented NACC UDS principles: timed copy, an explicit memory warning, delayed reproduction after a planned interval, element-level scoring and recognition. No protected figure artwork or item wording is included.

## Original stimulus

The model contains eight independently designed elements: a six-sided frame, crossing diagonals, an internal circle, an internal diamond, an external arc, a top pennant, a lower step and a right fork. Three recognition foils alter internal positions, line directions or external attachments.

## Administration

1. Copy: show the model beside a blank 640 × 480 drawing canvas for at most four minutes.
2. Memory warning: show the model for five seconds and state that it will be drawn later.
3. Fillers: administer non-figure tasks.
4. Delayed recall: begin after at least 10 minutes and preferably no later than 15 minutes in production.
5. Recognition: choose the previously copied model from four options.

Pilot mode uses a 10–30 second delayed gate for development only. Participant input supports pointer events (mouse, trackpad, touch or stylus). A connected gamepad may move a visible cursor with the left stick/D-pad and draw while its primary button is held.

## Scoring

Each of eight elements receives one recognisability point and one placement point. A single global bonus is allowed only when all sixteen element points are present. Copy and delayed totals therefore range from 0 to 17.

Incomplete phases retain raw points but report the ETI-facing total as null with status `incomplete`. Examiner decisions are stored at element level.

Primary outputs:

- `ocf_copy_score` (0–17 or null)
- `ocf_delayed_score` (0–17 or null)
- `ocf_delay_duration_ms`
- `ocf_recognition_correct`

Audit outputs include normalized stroke paths, stroke count, drawing duration, element decisions, raw total, review status, task version and stimulus version.

## Validation before research use

- independent ratings of element identifiability and scoring agreement;
- inter-rater and test–retest reliability;
- comparison of stylus, touch, mouse and gamepad conditions;
- timing and screen-size equivalence checks;
- recognition-foil difficulty and ceiling/floor review;
- demographic and cross-cultural fairness assessment;
- ethics approval and preregistration of the final scoring rules.

Until those steps are complete, report OCF-17 as an experimental pilot measure only.

## Public methodological source

National Alzheimer’s Coordinating Center, UDS Version 3 Neuropsychological Battery Instructions (Form C2): https://files.alz.washington.edu/documentation/uds3-np-c2-instructions.pdf
