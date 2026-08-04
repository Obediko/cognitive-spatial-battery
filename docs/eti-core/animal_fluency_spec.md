# Animal Semantic Fluency (ASF-60): Scientific and Scoring Specification

Status: Draft v0.1 for expert review and pilot testing  
Battery: ETI Core  
Primary ETI-facing output: Number of valid unique animal names produced in 60 seconds  
Copyright: Original administration wording and software implementation

## 1. Scientific boundary

ASF-60 is an independently worded category-fluency task. It preserves the general construct of timed animal naming and the broad scoring structure used in many neuropsychological batteries. It does not reproduce a protected worksheet or claim equivalence with the NACC UDS measure.

Permitted description:

- original computerized animal semantic-fluency task;
- 60-second category generation;
- examiner-verified valid-unique response scoring;
- structurally compatible with the ANIMALS position in the eight-score ETI framework.

Not permitted before validation:

- NACC Animal Fluency;
- digital NACC test;
- equivalent or interchangeable with ANIMALS;
- clinical diagnostic test.

## 2. Outcomes

| Output | Range | Direction |
|---|---:|---|
| asf_total_valid_unique | 0+ | Higher is better |
| asf_repetitions | 0+ | Descriptive |
| asf_rule_violations | 0+ | Descriptive |
| asf_uncertain_responses | 0+ | Quality-control |
| asf_prompt_used | 0 or 1 | Protocol fidelity |
| asf_ended_early | 0 or 1 | Protocol fidelity |
| asf_recording_duration_ms | Continuous | Protocol fidelity |

The primary score is the count of distinct responses judged to be valid animals. No errors are subtracted from the total. The ETI-facing score is null when the administration ended early or any response remains uncertain. The raw valid-unique count is retained separately for audit and later adjudication.

## 3. Practice

Use a non-animal practice category to establish understanding without rehearsing animal subcategories.

Original practice wording:

“I will give you a group of things. Say as many different examples from that group as you can. For practice, name two things that people use for writing.”

Acceptable examples include pen, pencil, marker, chalk and stylus when used as a writing implement. The practice is not timed and is not scored. If the participant gives no valid response, the examiner explains the category once using two examples that the participant did not already provide. Do not use an animal example during practice.

## 4. Main instruction

Original main wording:

“Now name as many different animals as you can. You will have one minute. Keep going until the timer stops. Begin when you hear the tone.”

The screen may show “Name different animals” and the remaining time. It must not display examples or animal images.

## 5. Administration

1. Confirm microphone readiness and a quiet environment.
2. Complete the practice.
3. Start local recording and the 60-second timer together.
4. Do not end the main trial because the participant pauses or says they are finished.
5. If there is no response for 15 consecutive seconds, or the participant says they cannot think of more, one neutral reminder is allowed: “Keep naming any other animals you can think of.”
6. The neutral reminder may be used only once.
7. If the participant asks whether animals outside a particular group count, answer only: “Any animal is allowed.”
8. Do not suggest mammals, birds, fish, reptiles, insects or any other subcategory.
9. Stop automatically at 60 seconds.
10. An examiner emergency-stop control may terminate recording early. This sets asf_ended_early = true and the score must be treated as incomplete in confirmatory analysis.
11. Score only responses that began before the timer ended. A word begun before 60 seconds and completed immediately afterward may be retained if confirmed from the audio.

Pilot mode may shorten the timer for software testing, but pilot-mode scores are never research scores.

## 6. Scoring rules

### 6.1 Credit

Credit a response when it identifies a real animal and has not already been credited under the same canonical label.

The following can receive credit as distinct responses when they are genuinely different lexical items:

- broad animal classes and members of those classes;
- breeds;
- superordinate and subordinate labels;
- sex-specific terms;
- young-animal terms;
- birds, fish, reptiles, amphibians, insects, arachnids and other recognised animals;
- regional or culturally specific animal names that can be verified.

Examples are intentionally not embedded in participant mode. Examiner examples in the scoring manual are illustrative rather than exhaustive.

### 6.2 Do not credit

Do not credit:

- exact repetitions;
- plural or ordinary inflectional repetition of an already credited singular;
- a pronoun or vague descriptor that does not identify an animal;
- fictional or mythical creatures;
- plants, fungi, objects or occupations;
- an unintelligible response that cannot be resolved from recording;
- a response beginning only after 60 seconds;
- a sound imitation without an identifiable animal name.

### 6.3 Canonicalisation

Each response receives:

- verbatim response;
- canonical label;
- decision: valid, repetition, rule violation or uncertain;
- optional note.

Canonicalisation is used to detect repetitions, not to erase meaningful distinctions. A breed and its species-level term may remain different canonical labels if the scoring rule deliberately credits both. Ordinary singular/plural variants should share one canonical label.

### 6.4 Uncertain and unfamiliar terms

Do not guess. Mark uncertain and verify after administration using an authoritative dictionary or zoological source. The examiner then changes the decision to valid or rule violation and records the source or justification in the audit note.

Adjudication must be blind to diagnosis, imaging results and other participant outcomes.

## 7. Examiner interface

The examiner screen must provide:

- playback of the local response recording;
- editable transcript;
- conversion of comma-, semicolon- or line-separated entries into response rows;
- verbatim response field;
- editable canonical label;
- decision selector: valid, repetition, rule violation or uncertain;
- notes;
- live valid-unique total;
- live counts for repetition, rule violation and uncertain responses;
- prompt-use and early-stop flags;
- save as examiner-verified or defer scoring;
- audit timestamp and scoring-dictionary version.

The final valid score is calculated from unique canonical labels among rows marked valid. The software must warn when two valid rows share the same canonical label. A score may be examiner-verified only when every row has a final decision and the administration completed normally. Uncertain responses produce provisional status and a null ETI-facing score; early termination produces incomplete status and a null ETI-facing score.

## 8. Device and privacy requirements

- Participant response is spoken; mouse, touch, keyboard or controller is used only for navigation.
- Audio is recorded locally with the browser MediaRecorder API.
- Audio is never silently sent to a speech-recognition service.
- Audio is not embedded in CSV or JSON and must be downloaded separately.
- If recording is unavailable, the examiner may transcribe live, but microphone_problem must be set.
- All interactive targets must be at least 44 × 44 CSS pixels.
- The task must work without hover and provide visible keyboard focus.

## 9. Data fields

| Field | Type |
|---|---|
| participant_id | string |
| task_name | animal_semantic_fluency |
| task_version | string |
| scoring_dictionary_version | string |
| category | animals |
| time_limit_ms | integer |
| actual_duration_ms | integer |
| response_audio_filename | string or null |
| response_audio_mime_type | string or null |
| transcript | string or null |
| response_rows | JSON array |
| total_valid_unique | integer or null; null when incomplete or provisional |
| total_valid_unique_raw | integer or null; audit value only |
| repetitions | integer or null |
| rule_violations | integer or null |
| uncertain_responses | integer or null |
| prompt_used | boolean |
| ended_early | boolean |
| microphone_problem | boolean |
| review_status | unscored, unreviewed, provisional, incomplete, deferred or examiner_verified |
| scored_at | ISO-8601 string or null |

## 10. Validation gates

1. Expert review of instructions and scoring decisions.
2. Inter-rater reliability on recorded responses.
3. Test–retest reliability using a suitable interval.
4. Floor and ceiling assessment.
5. Language, education, age and cultural effects.
6. Convergent validity with established semantic-fluency measures.
7. Calibration before placement in a prospective ETI topology.
8. Versioned adjudication dictionary frozen before confirmatory data collection.

## 11. Versioning

Changes to the instruction, practice category, time limit, prompt rule, canonicalisation policy or scoring rules increment the task version. Changes to accepted terms or canonical labels increment the scoring-dictionary version. Both versions must be stored with every record.
