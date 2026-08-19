# Cognitive Spatial Battery

Browser-based research prototype for baseline cognitive and spatial characterization. It uses original stimuli and task designs; it does **not** reproduce licensed NACC forms, MINT drawings, the Benson figure, Craft Story text, or Trail Making Test materials.

## ETI-aligned architecture

ETI uses eight component scores produced by five test families—not eight separately administered tasks:

| ETI-ready analogue field | Original measure |
|---|---|
| `CRAFTVRS_ANALOGUE` | Story immediate verbatim, 0–44 |
| `CRAFTDVR_ANALOGUE` | Story delayed verbatim, 0–44 |
| `ANIMALS_ANALOGUE` | Valid unique animals in 60 seconds |
| `MINTTOTS_ANALOGUE` | Original visual naming total, 0–32 |
| `UDSBENTC_ANALOGUE` | Original complex-figure copy, 0–17 |
| `UDSBENTD_ANALOGUE` | Original complex-figure delayed recall, 0–17 |
| `DIGFORCT_ANALOGUE` | Number Span forward correct trials, 0–14 |
| `DIGBACCT_ANALOGUE` | Number Span backward correct trials, 0–14 |

Visual Sequencing/Set-Shifting is retained as a Trail A/B conceptual comparator and runs last. Object-Location Memory and Spatial Pointing are optional additional spatial outcomes. None of those three modules is an ETI input.

All scores are experimental pilot scores. They are not NACC scores and are not norm-equivalent to the source instruments whose principles motivated the designs.

## Research status

This repository is suitable for software testing and supervised piloting only. It is **not cleared for inferential data collection** until the gates in [the validation plan](docs/validation/validation_plan.md) are signed off. German is an explicitly unvalidated parallel pilot form; its generated story/digit speech must be replaced by frozen reviewed recordings before research use.

## Running locally

Serve the repository over HTTP; direct `file://` opening is not supported because audio/model loading uses `fetch` and dynamic imports.

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Use a current Chromium, Firefox, or Safari browser on a laptop or sufficiently large tablet. Mouse, trackpad, touch, keyboard, and a standard gamepad are supported. Input modality and controller connection are recorded for every trial; modalities must be analysed separately until equivalence is demonstrated.

## Privacy and networking

- Collect only a pseudonymous participant ID. Never enter names, email addresses, dates of birth, student numbers, or other direct identifiers.
- Trial data, drawings and audio are retained locally for recovery and, when the Netlify synchronization deployment is configured, synchronized to private Netlify Blobs for approved cross-device examiner access.
- The page makes network requests for jsPsych from unpkg and, when automatic OSR transcription is used, a pinned Transformers.js bundle plus a Whisper model. Recorded audio is processed locally and is not sent to those services.
- For an offline or higher-assurance deployment, vendor and integrity-check all dependencies and model files before participant use.
- Never commit real participant data to this repository.

## Examiner scoring checkpoint

Participant administration ends immediately after the last selected task. Story Recall, Animal Fluency, Visual Naming and Complex Figure review run separately from `admin.html`.

The examiner portal uses password-authenticated, HTTP-only sessions when the Netlify secrets described in [remote sync setup](docs/remote-sync-setup.md) are configured. Local recovery remains available. Deployment still requires approved consent, retention/deletion rules and institutional data-protection/ethics review.

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

Participant completion does not display or run examiner scoring. The separate local examiner checkpoint restores trials, summaries, drawings and locally retained OSR/ASF/OVN audio using the same pseudonymous ID on the same browser profile and site origin. It does not resume inside a partially completed trial.

## Tests

```bash
npm install
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

CI checks JavaScript syntax, task scoring, the eight-input ETI analogue contract, bilingual metadata, Trail termination/structure, synchronization security and a Chromium smoke test.

## Repository map

- `index.html` — application entry point and pinned browser dependencies
- `js/main.js` — participant-only battery orchestration and completion
- `admin.html` / `js/admin.js` — separate same-origin examiner scoring checkpoint
- `js/utils.js` — data, recovery, export, summary, and controller navigation
- `js/tasks/` — eight task modules and local transcription support
- `docs/eti-core/` — task-specific specifications
- `docs/validation/` — release gates and empirical validation plan
- `assets/stimulus_manifest.json` — provenance and validation status
- `assets/images/visual-naming/manifest.json` — item-level photo provenance, licences, and attribution
- `tests/` — unit, integration, and browser checks

## Citation and naming

Describe the software as a custom jsPsych cognitive/spatial battery with original experimental tasks. Do not call any task Craft Story, MINT, Benson Figure, Trail Making Test, or a NACC form. Cite the inspiration at the construct/procedure level only, subject to supervisor and ethics review.

## Licence

Code is MIT licensed. Stimulus provenance and reuse status are tracked separately in `assets/stimulus_manifest.json` and the item-level visual-naming manifest. A code licence does not override third-party rights.
