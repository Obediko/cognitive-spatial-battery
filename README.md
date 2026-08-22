# CognitiveBA3: A Bilingual Cognitive and Spatial Research Battery

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22059989.svg)](https://doi.org/10.5281/zenodo.22059989)

**Authors:** Apochi Obed and Nikolai Axmacher  
**Affiliation:** Ruhr University Bochum, Germany  
**Archived software release:** v1.0.0  
**Status:** research prototype; empirical validation and release-gate approval remain incomplete.

CognitiveBA3 is browser-based research software for characterizing verbal episodic memory, semantic retrieval, visual naming, visuoconstruction, visual memory, working memory, and selected spatial abilities. It administers independently developed tasks in English or German, records reproducible task and language metadata, separates participant administration from examiner review, and exports trial-level and summary-level research data.

The project is not a diagnostic device, a validated clinical assessment, an official National Alzheimer's Coordinating Center (NACC) instrument, or a norm-equivalent replacement for any established neuropsychological test. Publishing software with a DOI does not establish measurement validity, ethical approval, or readiness for confirmatory participant research.

## Scientific rationale

The battery combines complementary cognitive domains because verbal memory, semantic retrieval, naming, visuoconstruction, visual delayed recall, and working memory capture different aspects of cognition. The design is informed by the structure of the NACC Uniform Data Set version 3 neuropsychological battery, which assesses several of these domains through separate task families (Weintraub et al., 2018; NACC, 2015). CognitiveBA3 uses original task materials and experimental analogue outputs rather than reproducing or claiming equivalence to source instruments.

Optional object-location and spatial-pointing tasks extend the battery to spatial association and directional judgment. Human studies support the relevance of medial temporal and entorhinal systems to spatial memory and navigation (Doeller et al., 2010; Laczó et al., 2022). That background motivates the constructs only. It does not show that these particular tasks isolate an anatomical structure, diagnose disease, or predict a clinical outcome.

The application uses jsPsych 7.3.4. Browser-based experiments can support reproducible administration, but device, browser, input method, audio hardware, and display timing must be measured rather than assumed equivalent (de Leeuw et al., 2023; Anwyl-Irvine et al., 2021). Complete references appear in [`REFERENCES.md`](REFERENCES.md) and [`REFERENCES.bib`](REFERENCES.bib).

## Task architecture and research outputs

The cognitive core consists of five task families and eight experimental outputs:

| Task family | Cognitive construct | Primary analogue output | Range | Examiner review |
|---|---|---|---|---|
| Original Story Recall | Immediate verbal episodic recall | `CRAFTVRS_ANALOGUE` | 0-44 | Required |
| Original Story Recall | Delayed verbal episodic recall | `CRAFTDVR_ANALOGUE` | 0-44 | Required |
| Animal Semantic Fluency | Semantic retrieval and verbal generation | `ANIMALS_ANALOGUE` | 0-77 reference range | Required |
| Original Visual Naming | Confrontation naming | `MINTTOTS_ANALOGUE` | 0-32 | Required |
| Original Complex Figure | Visuoconstruction | `UDSBENTC_ANALOGUE` | 0-17 | Required |
| Original Complex Figure | Delayed visual recall | `UDSBENTD_ANALOGUE` | 0-17 | Required |
| Number Span | Forward auditory span | `DIGFORCT_ANALOGUE` | 0-14 | Rule-based |
| Number Span | Backward auditory span | `DIGBACCT_ANALOGUE` | 0-14 | Rule-based |

Three optional modules produce separate, non-ETI outcomes: Object-Location Memory, Spatial Pointing, and Visual Sequencing/Set-Shifting. The sequencing comparator runs last whenever selected.

The eight fields are **structural analogues**, not NACC administrations or validated ETI inputs. The software deliberately sets `eti_value` to `null` and `eti_value_status` to `not_computed_normative_parameters_required`. An ETI value cannot be calculated or interpreted without an authorized, versioned definition; appropriate normative parameters; and empirical evidence that these original task forms support the intended computation.

## Administration and timing

At session start, select English or German, enter a pseudonymous participant identifier, and choose either the five-family cognitive core or a custom combination of modules. The session language is locked and recorded in the exports. Research staff remain responsible for supervision and subsequent examiner scoring.

- Cognitive core: approximately 30-45 minutes.
- All available modules: approximately 45-65 minutes.
- Actual duration depends on response speed, review workflow, selected modules, technical events, and delayed-recall gates. These are planning estimates, not measured normative administration times.

The standard full-battery order is story immediate recall, figure copy, animal fluency, visual naming, Number Span, story delayed recall, figure delayed recall, selected spatial modules, and the sequencing/set-shifting comparator last. Actual retention intervals are recorded and must be reviewed. Development-only shortened timings must never be combined with research administrations.

Detailed procedures are in [`protocol_description.md`](protocol_description.md), the task-specific specifications under [`docs/eti-core/`](docs/eti-core/), and [`pilot_checklist.md`](pilot_checklist.md).

## English and German forms

Both language forms include frozen, versioned story, instruction, and digit recordings. English stimulus audio was generated with Kokoro; the German pilot recordings were generated offline with Piper and the Thorsten High voice. Frozen audio means that files are fixed and reproducible. It does not mean pronunciation, intelligibility, cross-device playback, or language-form equivalence has been established.

English and German use language-specific story materials, response dictionaries, instructions, and accepted naming terms. German is labeled `pilot_unvalidated`; the English form is the internal reference form, not a validated clinical standard. Translation review, native-listener agreement, item-level equivalence, scorer agreement, and measurement properties require separate evaluation before cross-language comparisons.

## Data flow, privacy, and governance

Participant identifiers must be pseudonymous. Never enter names, email addresses, dates of birth, student numbers, or other direct identifiers. Voice recordings may nevertheless be identifiable personal data even when linked only to a study code.

There are two deployment situations:

1. **Local or unconfigured deployment:** trials and summaries are checkpointed in the browser; recordings and drawings remain in browser-controlled local recovery unless the configured synchronization endpoint accepts them. The app may still request front-end libraries or a local speech-recognition model over the network.
2. **Configured Netlify deployment:** pseudonymous checkpoints and eligible response recordings are transmitted to same-origin Netlify Functions and stored in private Netlify Blobs for approved examiner access from another device. Drawings are included in checkpoint data. This is remote processing and storage; it must never be described as local-only.

Remote synchronization requires documented ethics and data-protection approval, participant information covering voice and drawings, server-side secrets, authenticated examiner access, a retention schedule, deletion procedures, and verification of the actual hosting configuration. See [`docs/remote-sync-setup.md`](docs/remote-sync-setup.md). Browser requests for libraries and model files do not themselves send recorded audio to those providers; the configured Netlify synchronization path can transmit participant data to the research deployment.

Never commit participant exports, response recordings, administrator credentials, API keys, or session secrets to GitHub or Zenodo.

## Exports and scoring

The application provides trial CSV, full-session JSON, summary JSON, compiled reference-oriented reports, and separately retained response audio when available. Examiner review is performed through `admin.html` and does not interrupt participant administration.

Missing, incomplete, unadministered, and unreviewed outcomes must remain distinguishable. Do not replace missing scores with zero, interpret a 0-100 technical transformation as a percentile, or treat automatically generated transcription as an approved examiner decision.

The consolidated variable definitions, units, accepted ranges, missingness rules, and data-sensitivity classifications are documented in [`docs/data_dictionary.md`](docs/data_dictionary.md). Reference mappings and their limitations are documented in [`docs/nacc-reference-reporting.md`](docs/nacc-reference-reporting.md).

## Validation and release readiness

The implementation remains empirically unvalidated. The validation protocol specifies prespecified feasibility targets, independent scoring, inter-rater and test-retest reliability, cross-language review, timing and device checks, data-governance controls, and explicit stop/go decisions. See [`docs/validation/validation_plan.md`](docs/validation/validation_plan.md).

Current unresolved issues include object-location image provenance, primary licensing confirmation for BOSS-derived images, native-listener and language-equivalence evidence, scoring reliability, device/input equivalence, and institutional approval. A successful automated test run does not close any empirical or governance gate.

## Running and testing

Serve the repository over HTTP. Opening `index.html` directly through `file://` is unsupported because stimulus and model loading require web requests.

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080` in a current Chromium, Firefox, or Safari browser on a laptop or sufficiently large tablet. The recommended minimum viewport is 900 x 600 pixels; 1280 x 800 pixels is preferred. Supported input methods include mouse, trackpad, touch, keyboard, and gamepad, but they must not be pooled before equivalence is demonstrated.

```bash
npm install
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

Continuous integration checks JavaScript behavior, scoring logic, the eight-output contract, bilingual metadata, sequencing termination, synchronization security, and browser execution. These are software verification checks, not clinical or psychometric validation.

## Documentation map

- [`protocol_description.md`](protocol_description.md): scientific scope, administration, task order, data flow, and interpretation boundaries.
- [`pilot_checklist.md`](pilot_checklist.md): operational checks for the current five-family core, optional modules, scoring, export, and synchronization.
- [`docs/data_dictionary.md`](docs/data_dictionary.md): trial, summary, compiled-report, and sensitivity definitions.
- [`docs/validation/validation_plan.md`](docs/validation/validation_plan.md): measurable validation and governance gates.
- [`docs/eti-core/`](docs/eti-core/): task-specific instructions and scoring specifications.
- [`docs/nacc-reference-reporting.md`](docs/nacc-reference-reporting.md): NACC-reference fields and limits on ETI interpretation.
- [`assets/stimulus_manifest.json`](assets/stimulus_manifest.json): stimulus provenance and validation status.
- [`assets/images/objects/provenance_ledger.csv`](assets/images/objects/provenance_ledger.csv): object-image inventory and unresolved rights status.
- [`assets/images/visual-naming/manifest.json`](assets/images/visual-naming/manifest.json): item-level visual-naming attribution and licence claims.
- [`REFERENCES.md`](REFERENCES.md) and [`REFERENCES.bib`](REFERENCES.bib): academic and technical references.
- [`THIRD_PARTY_NOTICE.md`](THIRD_PARTY_NOTICE.md): code licence and third-party rights boundaries.

## Preferred citation

> Apochi, O., & Axmacher, N. (2026). *CognitiveBA3: A Bilingual Browser-Based Cognitive and Spatial Research Battery* (Version v1.0.0) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.22059989

Machine-readable citation metadata is provided in [`CITATION.cff`](CITATION.cff). The DOI identifies the archived v1.0.0 software snapshot; documentation subsequently updated on `main` is not part of that immutable archive unless a later release is published.

## Licence and third-party materials

Project code and original documentation are MIT-licensed. Third-party photographs, voice resources, assessment materials, and other external assets retain their own rights and attribution requirements. The public archive uses a mixed-rights notice because the MIT licence does not apply uniformly to every included file.

Twenty-four object-location photographs are inventoried by immutable Git blob identifier, but their creator, source, licence, and redistribution permissions have not been established. Inventory is not rights clearance. Do not redistribute or reuse those photographs until the rightsholder permissions are documented or the files are replaced with cleared alternatives.
