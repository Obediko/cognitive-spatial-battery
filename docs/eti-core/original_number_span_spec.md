# Original Number Span (ONS) pilot specification

## Status and copyright boundary

ONS is an experimental auditory span task using independently generated digit sequences. It does not contain NACC sequence strings or protected administration wording, and its outputs must not be called NACC Number Span scores.

The broad structure follows publicly documented NACC UDS principles: forward and backward conditions, two trials at each span length, discontinuation after both trials at a length are failed, total correct trials and longest successful span.

## Sequence construction

- Forward spans: 3–9 digits, two fixed trials per length.
- Backward spans: 2–8 digits, two fixed trials per length.
- Digits are 0–9, with no immediate repeats and no within-sequence duplicates.
- Obvious ascending/descending runs and familiar numeric strings are avoided.
- The fixed sequence set is versioned as `ons-controlled-0.1`.
- Forward and backward sets were created for this repository and are not copied from NACC.

Fixed order is intentional for scoring comparability. Do not randomize sequences between participants after validation.

## Administration

Digits are presented auditorily at a target pace of one digit per second. The participant repeats forward sequences in the same order and backward sequences in reverse order. An examiner enters the spoken answer using physical keyboard, mouse, touch or gamepad-controlled focus.

Both trials at a length are administered unless the condition has stopped. If both are incorrect, all longer trials in that condition are skipped.

Browser text-to-speech is a development aid only and is recorded as non-standardized. The examiner fallback reveals the original digits for paced reading and is an auditable protocol deviation. Before research deployment, replace device speech with frozen, loudness-matched recordings from one approved speaker.

## Scoring and exports

A trial is correct only when the entered sequence exactly matches the expected order. Primary outputs:

- `ons_forward_total_correct`
- `ons_backward_total_correct`

Secondary outputs:

- `ons_forward_longest_span`
- `ons_backward_longest_span`
- administered-trial counts and discontinuation spans.

Trial audit data include the stimulus, expected and entered response, correctness, playback count, voice metadata, response-entry duration, task version and sequence version.

## Validation before research use

- replace browser speech with standardized recordings;
- confirm the one-digit-per-second timing from audio onset logs;
- double-enter a sample of examiner-recorded responses;
- assess inter-examiner reliability and device/input equivalence;
- examine sequence difficulty, ceiling/floor effects and order effects;
- assess linguistic, hearing and demographic fairness;
- obtain ethics approval and preregister stopping/scoring rules.

## Public methodological source

National Alzheimer’s Coordinating Center, UDS Version 3 Neuropsychological Battery Instructions (Form C2): https://files.alz.washington.edu/documentation/uds3-np-c2-instructions.pdf
