# Instrument Rights and Permission Register

## Purpose

This register separates three questions that must not be conflated:

1. Does the project team hold a licence or permission relating to a named instrument?
2. What activities does that licence or permission allow, such as administration, translation, digitisation, adaptation, scoring, storage or redistribution?
3. Does the current software contain the authorised instrument, or does it contain an independently developed experimental analogue?

The presence of an analogue does not establish that the project lacks a licence. Conversely, possession of an administration licence does not automatically permit digitisation, modification, translation, embedding in software or publication in a source repository.

## Mandatory rule before use

No named instrument, stimulus, scoring sheet, manual, recording, translation or third-party asset may be used with participants until its documentary evidence and permitted scope have been reviewed and recorded below. Verbal assurance, purchase history without terms, or an unverified belief that a licence exists is insufficient.

Record the documentary evidence without committing confidential licence documents, purchase records, licence keys or personal information to the repository. Store restricted evidence in the approved institutional location and enter only its internal reference here.

## Instrument register

| Instrument or material | Current software implementation | Licence or permission status | Evidence reference | Permitted activities confirmed | Restrictions and unresolved questions | Approval before participant use |
|---|---|---|---|---|---|---|
| Craft Story 21 | Original Story Recall experimental analogue; protected Craft Story text is not embedded | To be documented | Pending | None recorded in this register | Confirm administration, digital presentation, audio recording, scoring, translation, storage and redistribution rights | **Blocked pending documented review** |
| Multilingual Naming Test (MINT) | Original Visual Naming experimental analogue; MINT drawings are not embedded | To be documented | Pending | None recorded in this register | Confirm administration, image display, digital implementation, scoring, translation and redistribution rights | **Blocked pending documented review** |
| Benson Complex Figure | Original Complex Figure experimental analogue; Benson stimulus is not embedded | To be documented | Pending | None recorded in this register | Confirm administration, digital display, drawing capture, scoring, storage and redistribution rights | **Blocked pending documented review** |
| Number Span reference procedure | Independently generated fixed sequences and original administration wording | To be documented where a protected source is relied upon | Pending | None recorded in this register | Identify the exact source procedure and determine whether permission is required for the intended implementation | **Blocked if a protected instrument is claimed or used** |
| Animal/category fluency reference procedure | Original administration wording and scoring workflow | To be documented where a protected source is relied upon | Pending | None recorded in this register | Identify the exact source and permitted use; generic construct status must not be assumed to authorize copied wording or scoring materials | **Blocked if protected materials are used** |
| Trail Making Test | Custom visual sequencing/set-shifting comparator; protected Trail Making forms are not embedded | To be documented | Pending | None recorded in this register | Confirm whether any planned use permits digital administration, adaptation, scoring and redistribution | **Blocked pending documented review for named-instrument use** |
| NACC forms and variable definitions | NACC-referenced output labels; not a NACC submission or administration | Public documentation may be cited subject to its terms; any additional permission must be documented | Pending review | Reference reporting only is currently claimed | Confirm current NACC documentation terms and avoid representing analogue scores as NACC scores | **Reference use only until reviewed** |

## Stimulus and software assets

Instrument permissions do not replace asset-level clearance. Audio, photographs, drawings, fonts, models and other files must also appear in `assets/stimulus_manifest.json` or the relevant item-level ledger with source, creator, licence, attribution, modification status and permitted use.

Current known blocks include:

- incomplete per-file provenance for Object-Location Memory images;
- visual-naming images whose BOSS licence is reported through secondary catalogues rather than confirmed from a primary licence record;
- release sign-off for some generated English audio;
- scientific validation of German audio and language equivalence, which is separate from copyright permission.

## Required fields for each permission decision

For every instrument or protected asset, record:

- rightsholder or publisher;
- licence holder and institution;
- documentary evidence reference and storage location;
- exact instrument, edition, form and language;
- authorised population, study and sites;
- administration mode, including computer, browser, remote or in-person use;
- permission to digitise or embed materials;
- permission to translate or adapt;
- permission to reproduce scoring sheets, rules or manuals;
- permission to record and store participant responses;
- permission to share materials with collaborators;
- source-code and public-repository restrictions;
- attribution or notice requirements;
- expiry, renewal and termination terms;
- reviewer, decision date and final approval.

## Status language

Use only the following status terms:

- **Verified for specified use:** documentary evidence has been reviewed and the intended activity is within scope.
- **Restricted:** permission exists, but one or more planned activities are prohibited or require additional approval.
- **Pending review:** evidence may exist, but its scope has not been verified.
- **Not required, documented rationale:** a qualified review concluded that permission is not required for the specified material and use.
- **Blocked:** the material must not be used for the planned activity.

Do not use “licensed,” “open,” “public,” “available online” or “permission obtained” without recording the precise scope and evidence.
