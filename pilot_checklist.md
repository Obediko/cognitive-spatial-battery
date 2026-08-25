# CognitiveBA3 Pilot and Research-Readiness Checklist

Use this checklist for documented software testing and supervised piloting. Completion of operational checks does not establish psychometric validation, ethical approval, or permission to collect confirmatory study data.

**Software version or commit:** ____________________  
**Test date and examiner:** ____________________  
**Browser, operating system, device, and input method:** ____________________  
**Language form:** English / German  
**Deployment:** local / Netlify without remote synchronization / Netlify with approved remote synchronization

## 1. Governance, rights, and setup

- [ ] The intended session is classified as development, supervised pilot, or formally approved research.
- [ ] Ethics, data-protection, consent, retention, and examiner-access requirements match the intended deployment.
- [ ] No real participant identifiers, records, recordings, passwords, or server secrets are committed to the repository.
- [ ] The object-location provenance ledger is reviewed. Do not treat unresolved photographs as cleared or reusable.
- [ ] The selected code revision, task forms, stimulus manifest, and audio files are frozen for the test.
- [ ] The application is served over HTTP or HTTPS rather than opened through `file://`.
- [ ] `window.PILOT_MODE` is `true` only for explicitly labeled development runs and `false` for any approved research-timing run.
- [ ] All required scripts, styles, frozen audio files, and selected stimulus assets load.

## 2. Language, identifier, and device checks

- [ ] The English/German language selector appears before participant identification.
- [ ] The chosen language remains fixed and is recorded in task trials and exports.
- [ ] German sessions are labeled as an unvalidated pilot form.
- [ ] Only a pseudonymous participant identifier is accepted and entered.
- [ ] The minimum viewport and device requirements are visible and appropriate.
- [ ] For iPad administration, the exact iPadOS version is recorded; Chrome on iPad is treated as WebKit rather than desktop Chromium.
- [ ] The device remains foregrounded and unlocked; any recorded background interruption is reviewed before accepting the session.
- [ ] Audio playback is audible at a controlled level without clipping, truncation, or unexpected browser-synthesized substitutions.
- [ ] Number Span completes repeated forward and backward sequences without missing digits, replay loops, or non-zero playback errors.
- [ ] Mouse, trackpad, touch, keyboard, or gamepad input is recorded accurately for the tested configuration.
- [ ] The core-only option selects all five task families and produces eight designated analogue outputs.
- [ ] The custom battery selector includes optional object-location, spatial-pointing, and sequencing/set-shifting modules.

## 3. Original Story Recall

- [ ] The frozen instruction, story, immediate prompt, and delayed prompt play in the selected language.
- [ ] Immediate recall waits for the participant response and does not skip directly to the next task.
- [ ] Microphone permission and recording failure are handled without silently creating a valid score.
- [ ] The selected story form, dictionary version, recording status, and audio version are stored.
- [ ] The delayed phase occurs after its actual retention interval has been recorded.
- [ ] Immediate and delayed verbatim scores are missing until the required examiner review is complete.
- [ ] Verbatim and paraphrase classifications can be reviewed or rescored separately.
- [ ] `CRAFTVRS_ANALOGUE` and `CRAFTDVR_ANALOGUE` appear only as experimental analogue values.

## 4. Original Complex Figure

- [ ] The original figure is displayed beside a usable drawing canvas.
- [ ] More than one drawing stroke can be entered and retained.
- [ ] Pointer, stylus, touch, or supported controller behavior matches the tested input method.
- [ ] The memory warning is shown after copy.
- [ ] Delayed reproduction occurs after its actual interval has been recorded.
- [ ] Recognition presents the correct original figure and its original foils.
- [ ] Element-level examiner scoring yields copy and delayed totals from 0 to 17.
- [ ] Incomplete phases remain missing or explicitly flagged instead of receiving a zero score.
- [ ] `UDSBENTC_ANALOGUE` and `UDSBENTD_ANALOGUE` are clearly identified as non-Benson analogue scores.

## 5. Animal Semantic Fluency

- [ ] The selected-language instruction and ready prompt appear before the timed trial.
- [ ] The response window is 60 seconds and the observed duration is recorded.
- [ ] Valid unique animals, repetitions, rule violations, uncertain terms, and prompts can be reviewed separately.
- [ ] Examiner correction and rescoring update the approved score rather than preserving unverified automatic counts.
- [ ] Response audio is retained or its capture failure is explicitly recorded.
- [ ] `ANIMALS_ANALOGUE` reflects the examiner-approved valid unique count.

## 6. Original Visual Naming

- [ ] All 32 configured images load or a missing item is clearly reported.
- [ ] The relevant image-attribution manifest and third-party rights notice remain available.
- [ ] English and German accepted naming responses use the correct language-specific lexicon.
- [ ] Examiner review distinguishes uncued correct, recognition failure, lexical retrieval failure, semantic-cue correct, phonemic-cue correct, and incorrect responses.
- [ ] The uncued and final totals are separately visible after examiner review.
- [ ] `MINTTOTS_ANALOGUE` is described as an original experimental naming score rather than an official MINT result.

## 7. Number Span

- [ ] Frozen digit recordings and forward/backward instructions play in the selected language.
- [ ] The same versioned digit sequence table is used across comparable administrations.
- [ ] Forward and backward responses are scored according to the documented discontinuation rules.
- [ ] The recorded forward/backward span and correct-trial totals are interpretable.
- [ ] `DIGFORCT_ANALOGUE` and `DIGBACCT_ANALOGUE` are in the expected 0-14 range or explicitly missing.
- [ ] Planned and observed playback timing, audio-set version, and sequence version are retained where implemented.

## 8. Optional Object-Location Memory

- [ ] Three practice objects appear with feedback.
- [ ] Three main blocks each administer eight retrieval trials without feedback.
- [ ] Standard research timings are 25 seconds for encoding and 15 seconds for the delay.
- [ ] JPEG objects or an explicitly versioned placeholder alternative render consistently.
- [ ] The 24-image rights ledger is reviewed; unresolved files are not represented as open-licensed.
- [ ] Target and response positions, Euclidean error, normalized error, response time, and block number are exported.
- [ ] The optional 0-100 transformation is labeled a technical score rather than a percentile.

## 9. Optional Spatial Pointing

- [ ] Six landmarks appear in a geometrically circular arena.
- [ ] The correct selected-language landmark names are displayed.
- [ ] Two practice trials provide feedback and 18 main trials omit feedback.
- [ ] Start position, target, response direction, signed error, absolute error, and response time are retained.
- [ ] Absolute angular error remains within 0-180 degrees.
- [ ] Display resizing does not distort the circle or obscure landmark graphics.

## 10. Optional Visual Sequencing and Set-Shifting

- [ ] The custom comparator is administered last when selected with other modules.
- [ ] Sequencing and alternating-sequence practice trials behave as documented.
- [ ] Main sequencing terminates at completion or 150 seconds.
- [ ] Main set shifting terminates at completion or 300 seconds.
- [ ] Completion time, errors, correct connections, timeout status, shift cost, and shift ratio are recorded.
- [ ] The comparator is not counted as a ninth ETI input or represented as an official Trail Making Test administration.

## 11. Examiner review, exports, and recovery

- [ ] Participant administration completes without exposing or requiring the examiner scoring interface.
- [ ] `admin.html` restores the correct pseudonymous session and supports the required scoring/review workflow.
- [ ] Examiner review status and verified answers are visible and can be corrected where supported.
- [ ] Trial CSV, full-session JSON, summary JSON, compiled report, and available recordings can be exported.
- [ ] Export field names, units, missingness values, task versions, language forms, and device metadata match `docs/data_dictionary.md`.
- [ ] `eti_input_status` correctly distinguishes complete from incomplete administrations.
- [ ] `eti_value` remains missing and reports `not_computed_normative_parameters_required`.
- [ ] Browser refresh or interruption restores the documented checkpoint without resuming inside a partial trial.
- [ ] No missing, incomplete, or unreviewed outcome is silently converted to zero.

## 12. Remote synchronization and privacy

- [ ] The actual network behavior is inspected in the browser developer tools.
- [ ] Local/unconfigured deployments are not described as remotely synchronized if the endpoint fails.
- [ ] Configured Netlify deployments upload pseudonymous checkpoints and eligible recordings only to the approved same-origin research endpoint.
- [ ] Private Netlify Blob storage, authenticated cross-device examiner access, and server-side secret configuration are verified.
- [ ] Drawings, transcripts, and voice recordings are treated according to the approved personal-data governance plan.
- [ ] A disposable remote session can be deleted using the required confirmation and password re-entry.
- [ ] Browser-local recovery data and recordings can be removed according to the retention procedure.
- [ ] The consent documentation accurately states whether recordings or drawings leave the participant device.

## 13. Duration, errors, and sign-off

- [ ] Record observed core-session duration; planning estimate: approximately 30-45 minutes.
- [ ] Record observed full-session duration; planning estimate: approximately 45-65 minutes.
- [ ] Record story and figure retention intervals, interruptions, technical failures, and missing outcomes.
- [ ] No unresolved JavaScript, loading, synchronization, or export errors are ignored.
- [ ] Unmet validation, licensing, governance, or technical gates are recorded and block the relevant research use.

**Observed duration:** ____________________  
**Outstanding issues:** ____________________  
**Examiner signature:** ____________________  
**Supervisor/data-protection approval, where required:** ____________________  
**Outcome:** development only / pilot allowed / research use approved under separate signed protocol
