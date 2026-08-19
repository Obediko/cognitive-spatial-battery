# NACC reference reporting and CSB derived scores

This project uses original or structurally matched tasks. The compiled export is **NACC-referenced**, not a NACC submission file and not evidence that the original CSB forms are norm-equivalent to NACC instruments.

The official NACC UDSv4 C2 form reports:

- Craft Story immediate and delayed: verbatim 0–44 and paraphrase 0–25.
- Benson copy and delayed recall: 0–17; recognition 0/1.
- Number Span forward: correct trials 0–14 and longest span 0 or 3–9.
- Number Span backward: correct trials 0–14 and longest span 0 or 2–8.
- Animal Fluency: 0–77.
- Trails A: completion seconds 0–150, commission errors 0–40 and correct lines 0–24.
- Trails B: completion seconds 0–300, commission errors 0–40 and correct lines 0–24.
- MINT: total and uncued correct 0–32, with cue counts.

Reference: NACC UDSv4 Initial Visit Form C2, January 2025:
https://files.alz.washington.edu/documentation/uds4-ivp-c2.pdf

## Digital measures without NACC counterparts

Object-Location Memory and Spatial Pointing are CSB digital measures; NACC C2 does not contain direct counterparts.

Object-location normalized error is Euclidean error divided by the arena diagonal and is bounded from 0 to 1. The additional accuracy score is:

`OLM_ACCURACY_100 = 100 × (1 − mean normalized error)`

Spatial Pointing absolute angular error is bounded from 0° to 180°. The additional accuracy score is:

`SP_ACCURACY_100 = 100 × (1 − mean absolute angular error / 180)`

Both 0–100 scores are deterministic technical transformations. They are not percentiles, T-scores, diagnoses or normal/abnormal bands. Clinical interpretation requires appropriately stratified pilot norms.

## Trail-making reference

The CSB Visual Sequencing and Set-Shifting task is a digital conceptual analogue, not the NACC Trail Making Test. Its exports use seconds and error counts because those units are interpretable and align with NACC reporting conventions. NACC ceilings are included only as reference metadata; CSB observations are not silently capped.
