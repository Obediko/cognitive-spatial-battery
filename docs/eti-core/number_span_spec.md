# Number Span (ONS): Scientific and Scoring Specification

Status: Draft v0.1 for expert review and pilot testing
Battery: ETI Core
Primary ETI-facing outputs: Longest forward span and longest backward span achieved
Copyright: Original administration wording and software implementation

## 1. Scientific boundary

ONS is an independently worded, independently implemented forward/backward digit-span task. It preserves the general construct and administration logic used in many verbal working-memory measures (sequential digit presentation, ascending length, discontinue rule) without reproducing a protected worksheet or specific published item set.

Permitted description:

- original computerized forward and backward digit-span task;
- standardized audio presentation, one digit per second (onset-to-onset);
- examiner-scored, live response entry;
- structurally compatible with a digit-span position in a broader battery.

Not permitted before validation:

- WAIS/NIH Toolbox/NACC Digit Span;
- equivalent or interchangeable with any specific published digit-span measure;
- clinical diagnostic test.

## 2. Outcomes

| Output | Range | Direction |
|---|---:|---|
| ns_forward_span | 0–9 | Higher is better |
| ns_backward_span | 0–8 | Higher is better |
| ns_forward_correct_trials | 0+ | Descriptive |
| ns_backward_correct_trials | 0+ | Descriptive |
| ns_audio_standardized | boolean | Protocol fidelity |

The span score for each direction is the longest sequence length at which the participant produced at least one correct trial (of two administered at that length). A length is only reached if the previous length was not discontinued.

## 3. Administration

1. Forward span runs first, then backward span.
2. Each direction begins with a standardized audio instruction (with an on-screen replay button).
3. Digits are presented one at a time via standardized audio, spaced at an exact one-second onset-to-onset interval, regardless of an individual digit clip's own duration.
4. Forward span starts at length 3 (max length 9); backward span starts at length 2 (max length 8).
5. Two trials are administered at each length.
6. **Discontinue rule:** testing in that direction stops if both trials at a length are incorrect. The direction's span score is the highest length with at least one correct trial.
7. Responses are scored live by the examiner: the participant's spoken digits are typed into the interface immediately after each trial and compared automatically against the expected response (the presented sequence for forward trials; the reversed sequence for backward trials).

Digit-level and instruction-level audio failures fall back to the browser's built-in speech voice for the affected item(s) only, and set `ns_audio_standardized = false` for the whole task so affected sessions can be flagged for review.

## 4. Sequence generation constraints

Randomly generated sequences at each length satisfy:

- no immediately repeated digit (e.g. 5-5 does not occur adjacently);
- no run of three or more consecutive ascending or descending digits (e.g. 3-4-5 or 6-5-4 does not occur);
- no exact repeat of a sequence already used at that direction/length within the same session.

## 5. Design deviations from other ETI Core tasks

Unlike Original Story Recall and Animal Semantic Fluency, number span responses are **not** audio-recorded. Digit-span responses are short, bounded (0–9 per position), and administered with the examiner present and attending in real time, so live scored entry is standard practice for this task type and avoids the overhead of reviewing dozens of short audio clips per session. This is a deliberate simplification, not an oversight — if post-hoc audio review of number-span responses becomes a project requirement, adding response recording would follow the same pattern already used in `original_story_recall.js`.

## 6. Versioning

Changes to the instruction wording, onset interval, starting/maximum length, discontinue rule, or sequence-generation constraints increment `ns_task_version`. This version is stored with every trial row.
