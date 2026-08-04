# Baseline Cognitive & Spatial Battery

A lightweight, browser-based baseline cognitive/spatial battery for neuroscience intake sessions.
Built with [jsPsych 7](https://www.jspsych.org/7.x/), plain HTML/CSS/JS — no backend, no database, no data transmission.

---

## What This Battery Is

A brief computerized baseline cognitive/spatial battery administered during the **intake session** to characterize individual differences relevant to spatial navigation performance.

**Tasks included:**
1. Original Story Recall (OSR-44) pilot — ETI Core
2. Animal Semantic Fluency (ASF-60) pilot — ETI Core
3. Original Visual Naming (OVN-32) pilot — ETI Core
4. Computerized Visual Sequencing and Set-Shifting Task
5. Object-Location Memory Task
6. 2D Spatial Pointing Task

## What This Battery Is NOT

- It is **not** a primary stimulation outcome measure.
- It does **not** measure effects of transcranial ultrasound or any other intervention.
- It is **not** the Trail Making Test (TMT). Do not label it as such.
- It is designed for use as a **covariate, baseline characterization measure, or exploratory moderator** only.

---

## Privacy & Data

- Only a **pseudonymous participant ID** is collected (e.g., P001, CSB_042).
- **Do NOT enter** names, emails, matriculation numbers, dates of birth, phone numbers, or any health-identifying information.
- Data is stored **only in the browser** during the session.
- Data is **never transmitted** to any server, cloud service, or third party.
- Download data **before closing the browser tab** — it cannot be recovered afterwards.
- The `data/` folder in this repository is a placeholder only. **Never commit real participant data to GitHub.**

---

## Local Testing

### Method 1: Direct file open (simplest)
```
1. Clone or download this repository.
2. Open index.html in Chrome by double-clicking it.
```

### Method 2: Local server (recommended for accurate relative paths)
```bash
# Python 3
cd cognitive-spatial-battery
python3 -m http.server 8080

# Then open Chrome and go to:
# http://localhost:8080
```

### Method 3: VS Code Live Server extension
Install the "Live Server" extension in VS Code, right-click index.html → "Open with Live Server".

---

## Netlify Deployment

This repository is pre-configured for Netlify via `netlify.toml`.

### Option A: Automatic (GitHub connected)
1. Push to the `main` branch.
2. Netlify detects the push and deploys automatically.
3. No build command needed — it's a static site.

### Option B: Manual import
1. Go to [app.netlify.com](https://app.netlify.com).
2. Click "Add new site" → "Import an existing project".
3. Connect to GitHub, select `Obediko/cognitive-spatial-battery`.
4. Publish directory: `.` (repo root).
5. No build command.
6. Deploy.

---

## Pilot Mode

In `js/utils.js`, set:
```javascript
window.PILOT_MODE = true;  // Short timings for development
window.PILOT_MODE = false; // Real timings for data collection
```

Timings affected:
| Timing | Pilot | Production |
|--------|-------|------------|
| OSR minimum delayed-recall interval | 15 s | 10 min |
| OSR target delayed-recall interval | 20 s | 12 min |
| OLM Encoding | 5 s | 25 s |
| OLM Delay | 3 s | 15 s |
| SP Study | 4 s | 10 s |

---

## Replacing Object Stimuli (OLM Task)

The Object-Location Memory task uses coloured placeholder shapes by default.

To replace with real images:
1. Place approved image files (PNG or JPEG, ≥ 200×200 px) in `assets/images/objects/`.
2. In `js/tasks/object_location_memory.js`, find the `OLM_OBJECTS` array.
3. For each object you want to replace, add: `imagePath: 'assets/images/objects/yourfile.png'` or `imagePath: 'assets/images/objects/yourfile.jpg'`

Example:
```javascript
{ id: 'clock', label: 'Clock', emoji: '⏰', color: '#5c6bc0',
  imagePath: 'assets/images/objects/clock.png' }
```

Images must be:
- Neutral, non-emotional everyday objects
- No faces, no brand logos
- Approved under your institution's ethics/copyright agreement
- Referenced in your study protocol

---

## Data Export

At the end of the battery, three download buttons are shown:

| Button | Contents |
|--------|---------|
| Download Trials CSV | One row per click/trial — all tasks combined |
| Download Full JSON | Trials + summary + task summaries |
| Download Summary JSON | Derived summary statistics only |
| Download OSR Audio | Immediate or delayed local response recording |
| Download Animal Naming Audio | Local 60-second response recording |

Each task also offers a "Download Task CSV" button at its end.

### CSV Variables (Trials)
All rows include: `participant_id`, `task_name`, `timestamp`, `window_width_px`, `window_height_px`, `screen_width_px`, `screen_height_px`, `device_pixel_ratio`.

Task-specific variables are documented in `protocol_description.md`.

---

## Task Descriptions

### 1. Original Story Recall (OSR-44) — experimental
- Original 68-word story; no NACC story text or protected scoring material.
- Produces immediate and delayed verbatim scores (0–44).
- Also records paraphrase scores (0–25), protocol flags and exact delay.
- Responses are recorded locally with the browser MediaRecorder API.
- Examiner review provides unit-by-unit scoring and an audit-ready transcript field.
- Current pilot playback uses the device text-to-speech voice and is marked non-standardised.
- A frozen human-recorded audio file is required before validation or research deployment.
- Audio files must be downloaded separately; they are not embedded inside CSV/JSON.
- Full specification: docs/eti-core/story_recall_spec.md.

### 2. Animal Semantic Fluency (ASF-60) — experimental
- Independently worded 60-second animal-naming task.
- Produces the number of valid unique animal names.
- Separately records repetitions, rule violations, uncertain responses and prompt use.
- Response audio remains local and must be downloaded separately.
- Examiner review supports canonical labels and duplicate detection.
- Full specification: docs/eti-core/animal_fluency_spec.md.

### 3. Original Visual Naming (OVN-32) — experimental
- Thirty-two independently selected objects shown as original black-line SVG drawings.
- Fixed provisional difficulty order with a six-consecutive-failure stopping rule.
- Allows uncued, semantic-cued and phonemic-cued examiner decisions.
- ETI-facing total credits uncued and semantic-cue correct responses; phonemic-cue recoveries are recorded separately.
- Includes a naming-norm and cross-language validation plan.
- It is not the MINT and must not be described as equivalent.
- Full specification: docs/eti-core/original_visual_naming_spec.md.

### 4. Visual Sequencing and Set-Shifting Task
**(NOT the Trail Making Test)**
- **Condition A — Sequencing:** Click circles 1 → 2 → … → 25.
- **Condition B — Set-Shifting:** Click 1 → A → 2 → B → … → 13 → M.
- Practice included (with feedback). Main trials without feedback.
- Derived outcomes: completion time, errors, set-shifting cost (ms), ratio.

### 5. Object-Location Memory Task
- 3 main blocks of 8 objects + 1 practice block of 3 objects.
- Encoding (25 s) → Delay (15 s) → Retrieval (click remembered location).
- Derived outcomes: mean/median Euclidean error (px), normalized error, response time.

### 6. Spatial Pointing Task
- Study phase: 6 landmarks in circular arena.
- 18 main pointing trials (6 targets × 3 start positions, shuffled).
- Participant clicks arena to indicate direction from start to remembered target.
- Derived outcomes: mean/median absolute angular error (°), signed bias (°).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page / console errors | Check browser console (F12). Ensure CDN scripts loaded. |
| Tasks don't start | Verify all script files are in the correct paths. |
| Fullscreen not working | Chrome requires a user gesture; click "Enter Fullscreen". |
| Download doesn't work | Use Chrome. Safari blocks some Blob downloads. |
| Netlify shows 404 | Check that `publish = "."` is set in `netlify.toml`. |
| Screen warning showing | Increase browser window size to at least 900×600 px. |
| OLM positions overlap | This can happen on very small screens; use ≥ 1280×800 px. |

---

## File Structure

```
cognitive-spatial-battery/
├── index.html                              # Entry point
├── netlify.toml                            # Netlify deployment config
├── README.md                               # This file
├── protocol_description.md                 # Scientific protocol description
├── pilot_checklist.md                      # Pre-study checklist
├── css/style.css                           # Global styles
├── js/
│   ├── utils.js                            # Shared utilities, data store, export
│   ├── main.js                             # Battery orchestration
│   └── tasks/
│       ├── original_story_recall.js
│       ├── animal_semantic_fluency.js
│       ├── original_visual_naming.js
│       ├── visual_sequencing_set_shifting.js
│       ├── object_location_memory.js
│       └── spatial_pointing.js
├── assets/images/objects/                  # Placeholder for object images
│   └── README_stimuli.txt
└── data/
    └── README_do_not_store_real_data_here.txt
```

---

## Citation & Attribution

If you use this battery in a publication, please describe it as:

> "A custom computerized cognitive/spatial battery implemented in jsPsych 7, comprising experimental original story-recall, animal semantic-fluency and original visual-naming tasks, a visual sequencing and set-shifting task, an object-location memory task, and a 2D spatial pointing task."

Do NOT refer to the visual sequencing/set-shifting task as the "Trail Making Test."

---

## Licence

MIT Licence. See source files for details. Object stimuli (if replaced) are subject to their own licences.
