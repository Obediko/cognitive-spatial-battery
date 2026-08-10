# Cognitive Spatial Battery

Browser-based research prototype for baseline cognitive and spatial characterization. It uses original stimuli and task designs; it does **not** reproduce licensed NACC forms, MINT drawings, the Benson figure, Craft Story text, or Trail Making Test materials.

## Current battery: eight tasks

| # | Task | Primary pilot score |
|---|---|---|
| 1 | Original Story Recall (OSR-44) | Immediate and delayed examiner-verified verbatim units |
| 2 | Animal Semantic Fluency (ASF-60) | Valid unique animal names in 60 seconds |
| 3 | Original Visual Naming (OVN-32) | Examiner-verified naming total |
| 4 | Original Complex Figure (OCF-17) | Copy, delayed recall, and recognition |
| 5 | Number Span (ONS Form A) | Forward and backward span |
| 6 | Visual Sequencing and Set-Shifting | Completion times, errors, cost, ratio |
| 7 | Object-Location Memory | Spatial placement error |
| 8 | 2D Spatial Pointing | Absolute angular error and signed bias |

All scores are experimental pilot scores. They are not NACC scores and are not norm-equivalent to the source instruments whose principles motivated the designs.

## Research status

This repository is suitable for software testing and supervised piloting only. It is **not cleared for inferential data collection** until the gates in [the validation plan](docs/validation/validation_plan.md) are signed off. In particular, synthetic speech, original naming drawings, the complex figure, device/input equivalence, scoring reliability, accessibility, and timing still require empirical validation.

## Running locally

Serve the repository over HTTP; direct `file://` opening is not supported because audio/model loading uses `fetch` and dynamic imports.

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Use a current Chromium, Firefox, or Safari browser on a laptop or sufficiently large tablet. Mouse, trackpad, touch, keyboard, and a standard gamepad are supported. Input modality and controller connection are recorded for every trial; modalities must be analysed separately until equivalence is demonstrated.

## Privacy and networking

- Collect only a pseudonymous participant ID. Never enter names, email addresses, dates of birth, student numbers, or other direct identifiers.
- Trial data and summaries are checkpointed in browser `localStorage` for crash recovery and are never automatically uploaded by this application.
- Recorded OSR/ASF audio remains in memory and must be downloaded before the tab closes; it is not included in local recovery.
- The page makes network requests for jsPsych from unpkg and, when automatic OSR transcription is used, a pinned Transformers.js bundle plus a Whisper model. Recorded audio is processed locally and is not sent to those services.
- For an offline or higher-assurance deployment, vendor and integrity-check all dependencies and model files before participant use.
- Never commit real participant data to this repository.

## Standardized stimulus audio

Story prompts, story playback, digit instructions, and digits use repository WAV files generated with a synthetic voice. A successful file load is recorded separately from scientific validation. The current files are **pilot-only** until intelligibility, pronunciation, duration, clipping, silence, loudness, and listener-equivalence checks pass. Browser speech synthesis is an emergency fallback and marks the session non-standardized.

See [the stimulus manifest](assets/stimulus_manifest.json) and task specifications under `docs/eti-core/`.

## Number Span form control

Number Span uses the fixed, versioned `ons-controlled-form-a-1.0` sequence table. All participants receive the same two items per length unless a separately validated and versioned form is introduced. Playback records planned and observed onset times; a one-second interval is a target, not an unsupported claim of hardware-perfect timing.

## Data and recovery

The completion screen exports:

- combined trial CSV;
- full JSON (trials, summaries, derived summary);
- summary JSON;
- separate OSR immediate/delayed and ASF response audio when recorded.

Completion shows scores from all eight tasks. Checkpoint recovery restores scored trials and summaries after re-entering the same pseudonymous ID. It does not restore audio or resume inside a partially completed trial.

## Tests

```bash
npm install
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

CI checks JavaScript syntax, all task scoring tests, eight-task integration/export coverage, and a Chromium task-menu smoke test.

## Repository map

- `index.html` — application entry point and pinned browser dependencies
- `js/main.js` — battery orchestration and completion
- `js/utils.js` — data, recovery, export, summary, and controller navigation
- `js/tasks/` — eight task modules and local transcription support
- `docs/eti-core/` — task-specific specifications
- `docs/validation/` — release gates and empirical validation plan
- `assets/stimulus_manifest.json` — provenance and validation status
- `tests/` — unit, integration, and browser checks

## Citation and naming

Describe the software as a custom jsPsych cognitive/spatial battery with original experimental tasks. Do not call any task Craft Story, MINT, Benson Figure, Trail Making Test, or a NACC form. Cite the inspiration at the construct/procedure level only, subject to supervisor and ethics review.

## Licence

Code is MIT licensed. Stimulus provenance and reuse status are tracked separately in the manifest. A code licence does not override third-party rights.
