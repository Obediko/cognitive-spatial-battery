# ETI core eight-score contract

The digital battery exposes exactly eight primary ETI-facing score fields. These are original experimental measures, not licensed NACC instrument scores.

| # | Original task / condition | Summary field |
|---|---------------------------|---------------|
| 1 | Story recall — immediate | `osr_immediate_verbatim` |
| 2 | Story recall — delayed | `osr_delayed_verbatim` |
| 3 | Animal semantic fluency | `asf_total_valid_unique` |
| 4 | Original visual naming | `ovn_total_with_semantic` |
| 5 | Original complex figure — copy | `ocf_copy_score` |
| 6 | Original complex figure — delayed | `ocf_delayed_score` |
| 7 | Original Number Span — forward | `ons_forward_total_correct` |
| 8 | Original Number Span — backward | `ons_backward_total_correct` |

Secondary and audit variables remain available but do not add to the eight-score contract. Examples include paraphrase recall, uncued naming, recognition, longest span, response timing, device/input metadata and protocol-deviation flags.

A score is valid only after its required administration and examiner review. Incomplete administrations must remain null where the task specification says so. All task and stimulus/sequence versions must be retained in exports.
