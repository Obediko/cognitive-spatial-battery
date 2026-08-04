# Original Story Recall (OSR-44): Scientific and Scoring Specification

Status: Draft v0.1 for expert review and pilot testing  
Battery: ETI Core  
Copyright: Original material created for this project; not derived from or interchangeable with Craft Story 21  
Primary purpose: Produce immediate and delayed verbal-recall scores with the same broad score structure required by the eight-score ETI design

## 1. Scientific boundary

OSR-44 is an original verbal episodic-memory task. It preserves the general paradigm of immediate and delayed free recall but does not reproduce the story, answer key, wording, norms, or protected materials of Craft Story 21.

The following claims are permitted after implementation:

- original computerized story-recall task;
- immediate and delayed free-recall scores;
- verbatim-unit and paraphrase-unit scoring;
- structurally compatible with the eight-score ETI research framework.

The following claims are not permitted without an empirical equivalence study:

- Craft Story 21;
- digital Craft Story;
- NACC-equivalent;
- interchangeable with CRAFTVRS or CRAFTDVR;
- validated clinical test.

## 2. Target score structure

Primary ETI-facing outputs:

| Output | Range | Direction |
|---|---:|---|
| osr_immediate_verbatim | 0–44 | Higher is better |
| osr_delayed_verbatim | 0–44 | Higher is better |

Secondary development and validation outputs:

| Output | Range | Purpose |
|---|---:|---|
| osr_immediate_paraphrase | 0–25 | Meaning-based recall |
| osr_delayed_paraphrase | 0–25 | Delayed meaning-based recall |
| osr_immediate_intrusions | 0+ | Non-story details |
| osr_delayed_intrusions | 0+ | Non-story details |
| osr_immediate_duration_s | Continuous | Response behaviour |
| osr_delayed_duration_s | Continuous | Response behaviour |
| osr_delay_duration_s | Continuous | Protocol fidelity |

The software must not save these values under NACC variable names. A later analysis layer may explicitly map osr_immediate_verbatim and osr_delayed_verbatim to the corresponding positions in the ETI feature vector after calibration.

## 3. Original story

Use a standardized, human-recorded audio file. The displayed screen must not show the story text.

> On Thursday morning, Elena took the seven-fifteen bus to the city library. She planned to return three history books and print a form for her new job. On the second floor, she noticed a blue wallet beside a window. It contained an identity card and two train tickets. Elena gave it to the librarian at the front desk, who called the telephone number on the card. Twenty minutes later, an older man arrived looking worried. He checked the wallet, thanked Elena, and offered her coffee. She smiled, declined, and caught the eleven o’clock bus home.

Story characteristics to verify during piloting:

- 91 words in the current punctuation-based count;
- one principal character;
- chronological everyday event;
- two clock-time details;
- several quantities, objects, actions and locations;
- neutral emotional content;
- no specialized knowledge;
- no dependence on a particular country, religion or profession;
- 44 verbatim scoring units;
- 25 paraphrase scoring units.

The final recorded version, speaking rate and pronunciation must be frozen before validation. A materially changed recording constitutes a new form.

## 4. Administration

### 4.1 Pre-check

The examiner must confirm:

- participant identifier is pseudonymous;
- test language is appropriate;
- audio is audible at a comfortable level;
- microphone permission is available;
- the participant understands that the story is presented once;
- no note-taking device is available;
- the environment is quiet.

### 4.2 Standardized instruction

Present this instruction as audio and text:

“You will hear a short story once. Listen carefully because, when it ends, you will be asked to tell the whole story back in as much detail as you can. You may use your own words. Do not write anything down.”

The exact instruction may be revised after expert review, but it must then be frozen.

### 4.3 Immediate recall

1. Play the story once without pausing, repeating or displaying text.
2. Start local audio recording immediately after playback ends.
3. Present: “Please tell me the story now. Include as many details as you can remember.”
4. Do not provide content cues or corrective feedback.
5. If the participant stops for 10 seconds, the examiner may use one neutral prompt: “Is there anything else you remember?”
6. End after the participant indicates completion or after 20 seconds of silence following the neutral prompt.
7. Save audio locally and record task duration.

### 4.4 Delayed recall

1. Administer delayed recall after a target interval of 12 minutes.
2. Acceptable protocol window: 10–15 minutes.
3. Do not replay the story.
4. Do not warn the participant immediately before the delay that the same story will be requested again beyond the original encoding instruction.
5. Present: “Earlier, you heard a short story. Please tell me that story again, including as many details as you can remember.”
6. Apply the same neutral-prompt and stopping rules used for immediate recall.
7. Record the exact delay from the end of immediate recall to the beginning of the delayed-recall instruction.

A delay outside 10–15 minutes must set delay_out_of_window = true. The score is retained but marked for sensitivity analysis.

## 5. Verbatim scoring rules

### 5.1 General rules

- Award one point for each of the 44 units recalled.
- A unit can receive credit only once.
- Unit order does not matter.
- Repetition does not add credit.
- Ordinary inflectional variation is accepted where listed.
- Clear pronunciation variants and transcription spelling errors are accepted when the examiner confirms the intended word.
- A broader synonym may receive paraphrase credit without receiving verbatim credit.
- Do not infer an omitted detail from context.
- If a participant gives both a correct and contradictory version, award the point only if the participant clearly self-corrects before finishing.
- Examiner prompting must never supply a scorable detail.
- Automated scoring may propose results, but a trained examiner must be able to review and override every unit.
- Every override must retain the automatic decision, final decision, examiner identifier, timestamp and reason.

### 5.2 Forty-four-unit dictionary

The acceptable-verbatim column defines the initial locked lexical set. The paraphrase examples clarify meaning but do not exhaust every reasonable paraphrase. New alternatives found during piloting must be adjudicated blind to diagnosis and added only through a versioned dictionary update.

| # | Target unit | Acceptable verbatim forms | Paraphrase examples only |
|---:|---|---|---|
| 1 | Thursday | Thursday | that Thursday |
| 2 | morning | morning | early in the day |
| 3 | Elena | Elena; clear phonetic transcription variants | the named woman alone is insufficient unless Elena is identifiable |
| 4 | took | took; take; taking | travelled; went |
| 5 | seven-fifteen | seven fifteen; 7:15 | quarter past seven |
| 6 | bus | bus | public bus |
| 7 | city library | city library | library in the city; public library |
| 8 | planned | planned; plan; planning | intended; wanted |
| 9 | return | return; returned; returning | take back; give back |
| 10 | three | three; 3 | a trio |
| 11 | history books | history book; history books | books about history |
| 12 | print | print; printed; printing | make a printed copy |
| 13 | form | form | document; application form |
| 14 | new job | new job | employment paperwork; form for work |
| 15 | second floor | second floor; 2nd floor | one floor above the first |
| 16 | noticed | noticed; notice; noticing | saw; found; spotted |
| 17 | blue | blue | bluish |
| 18 | wallet | wallet | billfold; purse only if clearly used as the found container |
| 19 | beside | beside | next to; by |
| 20 | window | window | windowpane area |
| 21 | contained | contained; contain; containing | had inside; held |
| 22 | identity card | identity card; ID card; identification card | identification |
| 23 | two | two; 2 | a pair |
| 24 | train tickets | train ticket; train tickets | railway tickets |
| 25 | gave it | gave; give; given | handed it; passed it |
| 26 | librarian | librarian | library worker; library staff member |
| 27 | front desk | front desk | reception desk; main desk |
| 28 | called | called; call; calling | telephoned; phoned |
| 29 | telephone number | telephone number; phone number | contact number |
| 30 | card | card | identity card; ID |
| 31 | twenty minutes later | twenty minutes later; 20 minutes later | after about twenty minutes |
| 32 | older man | older man | elderly man; older gentleman |
| 33 | arrived | arrived; arrive; arriving | came; showed up |
| 34 | worried | worried | anxious; concerned; distressed |
| 35 | checked | checked; check; checking | inspected; looked through |
| 36 | wallet | wallet | the found billfold |
| 37 | thanked | thanked; thank; thanking | expressed thanks; was grateful |
| 38 | Elena | Elena; clear phonetic transcription variants | her, only when the recipient is unambiguously Elena |
| 39 | offered | offered; offer; offering | asked to buy or give |
| 40 | coffee | coffee | a cup of coffee |
| 41 | smiled | smiled; smile; smiling | reacted with a smile |
| 42 | declined | declined; decline; declining | refused; said no; did not accept |
| 43 | eleven o’clock bus | eleven o’clock bus; 11 o’clock bus; eleven bus | bus at eleven |
| 44 | home | home | returned to her house |

Important: “Paraphrase examples only” are not automatic verbatim alternatives. They are candidates for the separate 25-unit paraphrase score.

## 6. Paraphrase scoring

Award one point for each meaning unit communicated accurately. Exact wording is unnecessary.

| # | Meaning unit |
|---:|---|
| 1 | The event occurred on Thursday morning |
| 2 | The principal character was Elena |
| 3 | She took a bus at 7:15 |
| 4 | She travelled to the city library |
| 5 | She intended to return three history books |
| 6 | She intended to print a form |
| 7 | The form concerned a new job |
| 8 | She went to or was on the second floor |
| 9 | She found or noticed a wallet |
| 10 | The wallet was blue |
| 11 | It was beside a window |
| 12 | It contained an identity card |
| 13 | It contained two train tickets |
| 14 | Elena handed the wallet to a librarian |
| 15 | This occurred at the front desk |
| 16 | The librarian called a telephone number |
| 17 | The number was on the card |
| 18 | Approximately twenty minutes passed |
| 19 | An older, worried man arrived |
| 20 | He checked the wallet |
| 21 | He thanked Elena |
| 22 | He offered Elena coffee |
| 23 | Elena smiled and declined the offer |
| 24 | Elena caught the 11 o’clock bus |
| 25 | She went home |

Partial fragments do not receive half-points. When a meaning unit contains two essential details joined in one row, both must be present unless the row explicitly permits alternatives.

## 7. Intrusions and error coding

Record, but do not subtract, the following:

- external intrusion: a detail not present in the story;
- semantic substitution: a plausible but incorrect replacement, such as bookshop for library;
- quantitative substitution: incorrect number, day or time;
- character substitution: incorrect identity or relationship;
- source confusion: detail imported from another task;
- perseveration: repeated story material beyond the first credited occurrence;
- contradiction: both correct and incorrect forms given without clear self-correction.

Intrusions are development outcomes and validity indicators. They are not part of the primary ETI score unless a future preregistered model explicitly includes them.

## 8. Examiner review interface

The scoring screen must show:

- locally recorded audio with play, pause and seek;
- editable transcript;
- 44 verbatim units with automatic suggestion, final yes/no and evidence excerpt;
- 25 paraphrase units with final yes/no;
- intrusion list and error category;
- neutral-prompt use;
- protocol-deviation flags;
- immediate/delayed condition label;
- total scores updating from final decisions;
- save status and audit trail;
- “review incomplete” until every required unit has a final decision.

The interface must not reveal the answer key to the participant. Participant mode and examiner mode require separate routes or an examiner lock.

## 9. Device and privacy behaviour

- Story playback and response recording must work on current Chrome, Edge and Safari where browser permissions allow.
- The participant response is spoken; mouse, touch or controller input is needed only for navigation and confirmation.
- All buttons require a minimum 44 × 44 CSS-pixel target.
- A touchscreen must not require hover.
- Keyboard focus and visible focus states are mandatory.
- Audio, transcript and scores remain local unless a separately approved backend is introduced.
- Browser-native cloud speech recognition must not be silently enabled because it may transmit participant audio.
- If transcription is unavailable, examiner scoring from local audio remains the canonical route.

## 10. Data schema

Required trial/session fields:

| Field | Type |
|---|---|
| participant_id | string |
| task_version | string |
| story_form | string |
| condition | immediate or delayed |
| story_audio_version | string |
| instruction_audio_version | string |
| response_audio_filename | string or null |
| transcript | string or null |
| verbatim_unit_scores | array of 44 booleans |
| paraphrase_unit_scores | array of 25 booleans |
| verbatim_total | integer 0–44 |
| paraphrase_total | integer 0–25 |
| intrusions | array |
| neutral_prompt_used | boolean |
| response_duration_ms | integer |
| delay_duration_ms | integer or null |
| delay_out_of_window | boolean |
| hearing_flag | boolean |
| playback_interrupted | boolean |
| microphone_problem | boolean |
| examiner_prompt_deviation | boolean |
| review_status | automatic, provisional or examiner_verified |
| examiner_override_count | integer |
| scoring_dictionary_version | string |
| timestamp | ISO-8601 string |

## 11. Validation gates

OSR-44 must remain labelled “experimental” until all applicable gates are completed:

1. Expert review of content, cultural neutrality and scoring units.
2. Cognitive interviewing to confirm comprehension.
3. Audio intelligibility and device testing.
4. Pilot distribution, floor and ceiling assessment.
5. Inter-rater reliability for verbatim and paraphrase scoring.
6. Test–retest reliability using a separately developed alternate form.
7. Convergent and discriminant validity.
8. Age, education and language effects.
9. Measurement invariance where cross-language or cross-cultural use is intended.
10. Normative calibration before prospective ETI computation.

An alternative form cannot be produced by merely changing names and numbers. It needs matched linguistic complexity, information density, event structure, memorability and independent piloting.

## 12. Open decisions before implementation

- Final task name and participant-facing label.
- Human voice, synthetic voice or both; a single research form must use one frozen recording.
- Whether responses are examiner-administered or self-administered.
- Minimum supported tablet and laptop browsers.
- Whether local audio is exported with the trial data or saved separately.
- Examiner-authentication method.
- Final dictionary adjudication panel and change-control procedure.
- Calibration sample and validation design.

## 13. Versioning rule

Any change to story wording, audio, scoring units, accepted alternatives, timing or prompts increments the task version. Production datasets must store both task_version and scoring_dictionary_version so that rescoring and audit remain possible.
