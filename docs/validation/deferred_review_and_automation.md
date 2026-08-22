# Deferred Examiner Review and Speech Automation

## Implemented examiner workflow and deployment-dependent storage

Participant-facing administration now completes before a dedicated examiner handoff. The final review block contains:

- Story Recall: local Whisper transcript suggestions and exact-token verbatim suggestions; examiner verifies verbatim units and scores paraphrases.
- Animal Fluency: local Whisper transcript suggestion; examiner corrects response boundaries and classifies valid items, repetitions, violations and uncertainty.
- Original Visual Naming: one local recording per item, local Whisper transcript suggestion, exact accepted-name suggestion, and examiner verification. The deferred protocol is explicitly **uncued only**.
- Original Complex Figure: copy and delayed drawings are captured during testing and scored together during final review.
- Number Span: participant enters the recalled sequence directly.

## Why Visual Naming changed

Semantic and phonemic cues influence the participant's response and the six-failure stopping rule. They cannot be administered retrospectively. The deferred mode therefore does not export a cue-assisted total and must not be interpreted as equivalent to the earlier live-cue protocol.

## ChatGPT/API scoring boundary

No external ChatGPT scoring call is enabled. Sending participant transcripts to an OpenAI model would introduce an additional third-party processing route beyond the existing browser workflow and any separately configured Netlify synchronization; it requires an approved API project, consent/ethics language, access controls, retention configuration, error monitoring and a locked scoring/evaluation protocol. OpenAI documents that API data is not used for training by default, while default endpoint retention and optional Zero Data Retention controls still need to be considered: https://platform.openai.com/docs/models/default-usage-policies-by-endpoint

If governance later approves an external service, use it only to produce structured suggestions. Examiner verification and inter-rater validation remain necessary. For speech alone, OpenAI documents dedicated transcription models, but the current implementation performs Whisper inference in the browser; separately configured Netlify synchronization can still upload eligible recordings to approved research storage: https://developers.openai.com/api/docs/models/gpt-4o-transcribe
