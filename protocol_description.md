# Protocol Description

## Battery Overview

A brief computerized baseline cognitive/spatial battery will be administered during the intake session to characterize individual differences relevant to spatial navigation performance. The battery includes a computerized visual sequencing and set-shifting task, an object-location memory task, and a spatial pointing task. These measures are not primary stimulation outcomes. They will be used for participant characterization and may be included as covariates or exploratory moderators in analyses of navigation and imaging outcomes.

---

## Administrative Details

- **Session type:** Intake / baseline session
- **Administration mode:** Self-administered on a laptop with researcher present
- **Platform:** Browser-based (jsPsych 7), Google Chrome recommended
- **Estimated duration:** 15–25 minutes (full battery)
- **Data storage:** Local browser only; exported as CSV/JSON by researcher
- **Data transmission:** None — no network calls, no external servers

---

## Participant ID Policy

Participants are assigned a **pseudonymous participant ID** (e.g., P001, CSB_042) by the researcher prior to the session. This ID must not contain or allow derivation of:
- Full name or initials
- Date of birth
- Student or staff matriculation number
- Email address or telephone number
- Any health-identifying information

---

## Task 1: Computerized Visual Sequencing and Set-Shifting Task

**Important:** This task is NOT the Trail Making Test (TMT). It is a self-built computerized task with different design parameters. Do not label it as TMT in any publication, report, or participant-facing material.

### Purpose
Baseline measure of visual search, processing speed, sequencing ability, and cognitive flexibility.

### Conditions
- **Condition A (Sequencing):** Participant clicks 25 circular targets labelled 1–25 in ascending order. Measures processing speed and basic sequencing.
- **Condition B (Set-Shifting):** Participant clicks 26 alternating number and letter targets (1–A–2–B–…–13–M). Measures cognitive flexibility and the ability to shift between two response sets.

### Practice
- Sequencing practice: targets 1–8 (with feedback)
- Set-shifting practice: 1–A–2–B–3–C–4–D (with feedback)

### Main task
- One sequencing trial (25 targets)
- One set-shifting trial (26 targets)
- Sequencing always precedes set-shifting (unless randomization is explicitly enabled in code)

### Error handling
- Incorrect clicks are recorded but do not reset the trial
- A brief error indicator is displayed; participant continues from the correct target

### Derived outcomes
| Variable | Description |
|----------|-------------|
| completion_time_sequencing_ms | Total time to complete Condition A (ms) |
| completion_time_set_shifting_ms | Total time to complete Condition B (ms) |
| errors_sequencing | Number of incorrect clicks in Condition A |
| errors_set_shifting | Number of incorrect clicks in Condition B |
| set_shifting_cost_ms | B completion time minus A completion time (ms) |
| set_shifting_ratio | B completion time / A completion time |

---

## Task 2: Object-Location Memory Task

### Purpose
Baseline measure of spatial associative memory, relevant to entorhinal-hippocampal function.

### Stimuli
Neutral everyday object images (or coloured placeholder shapes if real images are not available). Images must be: neutral, non-emotional, free of faces, brand logos, or copyrighted material, and approved under the study's ethics agreement.

To replace placeholder stimuli: see README.md, section "Replacing Object Stimuli."

### Structure
- 1 practice block (3 objects) with feedback
- 3 main blocks (8 objects each) without feedback

### Phases per block
1. **Encoding:** 8 objects displayed at distinct non-overlapping screen locations for 25 seconds. Participant is instructed to study the locations.
2. **Delay:** 15-second blank screen with fixation cross.
3. **Retrieval:** One object cue shown at a time (order randomized within block). Participant clicks the remembered location on the blank arena.

### Derived outcomes
| Variable | Description |
|----------|-------------|
| olm_mean_euclidean_error_px | Mean Euclidean distance between response and correct location (px) |
| olm_median_euclidean_error_px | Median Euclidean error (px) |
| olm_mean_normalized_error | Mean error normalized by arena diagonal |
| olm_response_time_mean_ms | Mean response time per retrieval (ms) |
| olm_missing_responses | Trials where no response was recorded |
| olm_block_N_mean_error_px | Block-wise mean error for blocks 1–3 |

---

## Task 3: 2D Spatial Pointing Task

### Purpose
Baseline measure of spatial orientation and directional memory.

### Structure
- **Study phase:** 6 landmark objects are displayed at fixed positions within a 2D circular arena. Participant studies the locations for 10 seconds.
- **Practice:** 2 pointing trials with feedback.
- **Main task:** 18 pointing trials (6 targets × 3 start positions, trial order randomized).

### Trial structure
1. A start position (S) is shown inside the arena.
2. A target landmark is named (but NOT shown in the arena).
3. Participant clicks inside the arena to indicate the remembered direction from start to target.
4. Participant confirms response with a button.

### Primary outcome
Angular error in degrees between the chosen direction and the correct direction.

### Derived outcomes
| Variable | Description |
|----------|-------------|
| sp_mean_absolute_angular_error_deg | Mean absolute angular error across main trials (°) |
| sp_median_absolute_angular_error_deg | Median absolute angular error (°) |
| sp_signed_bias_deg | Mean signed angular error (positive = clockwise overshoot) |
| sp_response_time_mean_ms | Mean response time per trial (ms) |

---

## Data Variables: Trial-Level CSV

All trial rows include:
- participant_id
- task_name
- timestamp (ISO 8601)
- window_width_px / window_height_px
- screen_width_px / screen_height_px
- device_pixel_ratio

Task-specific variables are defined in each task's JS file and documented in the sections above.

---

## Data Variables: Summary JSON

The summary JSON includes all derived outcomes listed above, plus:
- session_start / session_end
- total_battery_duration_ms
- pilot_mode (boolean)
- user_agent

---

## Important Notes for Researchers

1. This battery is for **baseline characterization only**. Do not administer post-stimulation.
2. Run in **fullscreen mode** in **Google Chrome** on a laptop or desktop.
3. Minimum recommended screen resolution: 1280 × 800 px.
4. Ensure a **quiet environment** free of interruptions.
5. Download the CSV and JSON files **immediately after each session**. Data is not stored anywhere.
6. Store downloaded files securely according to your institution's data management plan.
7. Do not store participant data in the GitHub repository.
