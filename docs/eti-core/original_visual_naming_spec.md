# Original Visual Naming (OVN-32): Scientific and Scoring Specification

Status: Draft v0.1 for expert review and stimulus norming  
Battery: ETI Core  
Primary ETI-facing output: Correct names produced without phonemic cue  
Copyright: Original wording, SVG drawings and software implementation

## 1. Scientific boundary

OVN-32 is an independently authored, examiner-mediated picture-naming task. It preserves general visual-naming principles used in neuropsychological assessment but does not reproduce MINT drawings, item ordering, response sheet, cue wording or normative claims.

Permitted description:

- original 32-item visual object-naming pilot;
- fixed-order black-line SVG stimuli;
- examiner-adjudicated uncued, semantic-cued and phonemic-cued responses;
- structurally compatible with the MINTTOTS position in an exploratory eight-score ETI framework.

Do not describe OVN-32 as the MINT, a digital MINT, a validated equivalent, or a clinical diagnostic instrument.

## 2. Construct and architecture

The task assesses visual object recognition and lexical retrieval. Thirty-two drawings are presented individually in a fixed provisional difficulty order. The fixed order is necessary because administration stops after six consecutive items that are not named correctly without a phonemic cue.

Each item permits:

1. uncued naming for up to 20 seconds;
2. semantic cueing when the examiner judges that the object was misrecognised;
3. direct phonemic cueing when the object is recognised but the name cannot be retrieved;
4. phonemic cueing after an unsuccessful semantic cue.

Cue responses are not timed. The examiner moves on when a response is not produced promptly.

## 3. Original instruction

“Each screen will show one black line drawing. Please say the name of the object. If you are unsure, make your best guess. I may give you a clue after your first answer.”

This instruction is independently written and must remain versioned.

## 4. Primary and secondary outcomes

| Output | Definition |
|---|---|
| ovn_total_with_semantic | Uncued correct plus semantic-cue correct; null if incomplete |
| ovn_total_with_semantic_raw | Same count retained for audit even when incomplete |
| ovn_total_uncued | Items correct before any semantic cue; null if incomplete |
| ovn_semantic_cues_given | Number of items receiving a semantic cue |
| ovn_semantic_cues_correct | Number correct following semantic cue |
| ovn_phonemic_cues_given | Number receiving a phonemic cue |
| ovn_phonemic_cues_correct | Number correct following phonemic cue |
| ovn_items_administered | Number presented before completion or stopping |
| ovn_stopped_after_six_failures | Whether the stopping rule ended administration |

The ETI-facing score excludes phonemic-cue successes. A semantic cue can restore credit because it addresses initial visual misrecognition; a phonemic cue supplies part of the target word and therefore does not demonstrate independent lexical retrieval.

## 5. Examiner decisions

### Correct without semantic cue

Select when the participant spontaneously produces the target or a prespecified acceptable alternative. Ordinary accent differences and clearly equivalent regional labels may be accepted with an audit note.

### Object not recognised

Select when the response indicates visual misperception, incorrect object identity or inability to identify the depicted object. Provide the item-specific semantic cue.

### Recognised but name not retrieved

Select when the participant correctly describes the object or its use but cannot produce its name. Provide the item-specific phonemic onset without first giving a semantic cue.

### Semantic cue correct

Select when the semantic cue resolves misrecognition and the participant independently supplies the correct name.

### Phonemic cue correct

Record the recovery, but do not include it in the primary total.

### Incorrect

Use when the target is not produced after the applicable cue sequence.

## 6. Timing and stopping

- Allow up to 20 seconds for the initial response.
- The interface shows when 20 seconds has elapsed but retains examiner control so that a response already underway can be adjudicated.
- Semantic and phonemic cue responses are not timed.
- A correct uncued or semantic-cued response resets the consecutive-failure counter.
- Incorrect and phonemic-cue-correct outcomes increment the failure counter.
- Stop after six consecutive failures.
- Stopping by the six-failure rule is a valid completed administration.
- Manual early termination is incomplete and produces a null ETI-facing score.

## 7. Stimulus construction

All drawings are original SVG paths written specifically for this project. They are:

- monochrome;
- displayed on a plain background;
- free of embedded target labels;
- scalable without raster artefacts;
- versioned as stimulus set ovn32-en-0.1.

The current 32 objects were selected independently to span common household objects, tools, instruments and lower-frequency lexical items. Difficulty levels 1–3 are design hypotheses, not empirical item parameters.

No original MINT drawing, item order, cue sheet or scoring form was used as a stimulus source.

## 8. Naming-norm protocol

The task cannot be treated as validated until the drawings are normed. For each language and cultural group, collect responses from an independent cognitively healthy sample before clinical use.

Recommended minimum pilot:

- at least 30 participants per language for initial stimulus screening;
- a larger age- and education-stratified sample for final norms;
- record first response verbatim;
- record dominant language, testing language, age band and education band;
- record name agreement, acceptable alternatives, “do not know object,” “know object but not name,” and response latency;
- obtain independent ratings of visual complexity, familiarity and imageability.

Per-item quantities:

- modal-name agreement;
- H statistic for response dispersion;
- percentage producing the intended target;
- percentage producing an acceptable alternative;
- percentage misrecognising the object;
- median uncued latency;
- semantic-cue gain;
- phonemic-cue gain;
- differential item functioning across language and demographic strata.

Revise or replace drawings with low target agreement, strong cultural bias, excessive ambiguity or floor/ceiling behaviour. Freeze the final stimulus set and response dictionary before confirmatory data collection.

## 9. Data fields

Each item stores:

- item_id and item_order;
- task_version and stimulus_set;
- provisional_difficulty;
- response_verbatim;
- outcome;
- semantic_cue_given;
- phonemic_cue_given;
- response_time_ms;
- examiner_note.

Task-level exports store all outcomes in Section 4 plus completion status.

## 10. Device and accessibility requirements

- Spoken responses are examiner-scored; no external speech-recognition service is used.
- Examiner controls support mouse, touch and keyboard focus.
- SVGs scale to tablet and laptop screens without hover.
- Target names and cues must never appear in participant-facing alt text.
- The examiner should position the device so that controls and cue text are not visible to the participant when necessary.
- Test the final task on intended tablet, laptop, browser and display-size combinations.

## 11. Validation gates

1. Expert review of object selection, drawings, cues and alternatives.
2. Naming-norm study and item revision.
3. Inter-rater scoring reliability.
4. Test–retest reliability.
5. Measurement invariance or differential-item-functioning analysis across languages.
6. Convergent validity with an authorised established naming measure.
7. Floor and ceiling evaluation in the target age range.
8. Prospective calibration before inclusion in an ETI topology.

## 12. Versioning

Change the task version for alterations to instructions, timing, cue logic, stopping or scoring. Change the stimulus-set version for any drawing, target, alternative response, semantic cue, phonemic cue or item order. Store both with every response.
