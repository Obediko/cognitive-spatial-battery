# German Audio v3 Perceptual Review Checklist

**Status:** digits 5 and 8 v3 technical QA passed; intended-device perceptual confirmation remains open
**Trigger:** pilot listening on 2026-08-27 identified `digit_5_de_v2.wav` ("fünf") as perceptually too brief. Automated technical QA also flags digits 5 and 8 because their active speech portions are under 320 ms.

## Versioning rule

The existing v2 WAV files are frozen and must not be overwritten. Any regenerated or reprocessed item must use a new `_de_v3.wav` filename, and the complete approved v3 set must receive a new manifest with new SHA-256 hashes.

## Review procedure

Use the intended administration device and browser, with the same playback route and volume setting planned for pilots. Each German file must be heard in isolation and, where relevant, inside the actual task sequence. Record a decision for pronunciation, naturalness, intelligibility, truncation, and misleading emphasis.

Recommended decision codes: `accept`, `regenerate`, `reprocess`, or `needs_second_listener`.

| File | Content | Priority | Listener 1 | Listener 2 | Final decision | Notes |
|---|---|---:|---|---|---|---|
| `digit_0_de_v2.wav` | null | normal |  |  |  |  |
| `digit_1_de_v2.wav` | eins | normal |  |  |  |  |
| `digit_2_de_v2.wav` | zwei | normal |  |  |  |  |
| `digit_3_de_v2.wav` | drei | normal |  |  |  |  |
| `digit_4_de_v2.wav` | vier | normal |  |  |  |  |
| `digit_5_de_v3.wav` | fünf | **high** |  |  |  | Pitch-preserving 0.78x reprocess deployed for confirmation. Active speech approximately 418 ms; no clipping. |
| `digit_6_de_v2.wav` | sechs | normal |  |  |  |  |
| `digit_7_de_v2.wav` | sieben | normal |  |  |  |  |
| `digit_8_de_v3.wav` | acht | **high** |  |  |  | Pitch-preserving 0.78x reprocess deployed for confirmation; no clipping. |
| `digit_9_de_v2.wav` | neun | normal |  |  |  |  |
| `ons_forward_instruction_de_v2.wav` | Number Span forward instruction | normal |  |  |  |  |
| `ons_backward_instruction_de_v2.wav` | Number Span backward instruction | normal |  |  |  |  |
| `osr44_library_wallet_a_de_v2.wav` | Story stimulus | normal |  |  |  | Check sentence boundaries and final word endings. |
| `osr_instruction_de_v2.wav` | Story instruction | normal |  |  |  |  |
| `osr_immediate_prompt_de_v2.wav` | Immediate recall prompt | normal |  |  |  |  |
| `osr_delayed_prompt_de_v2.wav` | Delayed recall prompt | normal |  |  |  |  |
| `osr_neutral_prompt_de_v2.wav` | Neutral prompt | normal |  |  |  |  |

## Release gate

Do not label German audio as fully perceptually cleared until all deployed files have two listener decisions, any disputed item has been resolved, and no critical pronunciation or truncation defect remains. Technical QA is necessary but not sufficient for this gate.
