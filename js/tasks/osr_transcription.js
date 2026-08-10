/* ============================================================
   osr_transcription.js
   In-browser automatic speech recognition + verbatim-unit matching
   for Original Story Recall scoring.

   Design constraints (see README.md "Privacy & Data"):
   - This project promises audio/data are never transmitted to any
     server. Automatic transcription therefore runs entirely inside
     the participant's/examiner's browser via a WASM/ONNX Whisper
     model (transformers.js), not a cloud speech-to-text API.
   - The model is fetched from a CDN the first time it's used and
     cached by the browser; no recorded audio ever leaves the device.
   - Accuracy trade-off: an in-browser model (this uses "small.en",
     quantized) is not as accurate as a top-tier cloud ASR API. This
     is a deliberate choice to preserve the no-data-transmission
     guarantee rather than an oversight - see docs/eti-core/
     story_recall_spec.md for the full rationale.
   ============================================================ */
'use strict';

(function() {
  var TRANSFORMERS_JS_CDN_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
  var ASR_MODEL_ID = 'Xenova/whisper-small.en';
  var ASR_TARGET_SAMPLE_RATE = 16000;
  var MODULE_TIMEOUT_MS = 20000;
  var MODEL_TIMEOUT_MS = 120000;
  var INFERENCE_TIMEOUT_MS = 90000;

  var transformersModulePromise = null;
  var asrPipelinePromise = null;
  var transcriptionQueue = Promise.resolve();

  function bounded(promise, timeoutMs, label) {
    if (window.BatteryReliability) return window.BatteryReliability.withTimeout(promise, timeoutMs, label);
    return new Promise(function(resolve, reject) {
      var timer = setTimeout(function() { reject(new Error(label + ' timed out')); }, timeoutMs);
      Promise.resolve(promise).then(function(value) { clearTimeout(timer); resolve(value); })
        .catch(function(error) { clearTimeout(timer); reject(error); });
    });
  }

  // Dynamically imports transformers.js from the CDN exactly once,
  // regardless of how many times this is called.
  function loadTransformersModule() {
    if (!transformersModulePromise) {
      transformersModulePromise = bounded(
        import(/* webpackIgnore: true */ TRANSFORMERS_JS_CDN_URL),
        MODULE_TIMEOUT_MS,
        'Whisper runtime download'
      ).catch(function(error) {
        transformersModulePromise = null;
        throw error;
      });
    }
    return transformersModulePromise;
  }

  // Lazily builds (and caches) the automatic-speech-recognition pipeline.
  // onProgress(percent) is called during the one-time model download.
  function loadAsrPipeline(onProgress) {
    if (!asrPipelinePromise) {
      asrPipelinePromise = bounded(
        loadTransformersModule().then(function(transformersModule) {
          return transformersModule.pipeline('automatic-speech-recognition', ASR_MODEL_ID, {
            progress_callback: function(progress) {
              if (typeof onProgress === 'function' && progress && progress.status === 'progress' && typeof progress.progress === 'number') {
                onProgress(progress.progress);
              }
            }
          });
        }),
        MODEL_TIMEOUT_MS,
        'Whisper model loading'
      ).catch(function(error) {
        asrPipelinePromise = null;
        throw error;
      });
    }
    return asrPipelinePromise;
  }

  // Decodes an audio Blob (webm/ogg/whatever MediaRecorder produced) into a
  // mono Float32Array resampled to 16kHz, which is what Whisper expects.
  function blobToFloat32Mono16k(blob) {
    return blob.arrayBuffer().then(function(arrayBuffer) {
      var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      var decodingContext = new AudioContextCtor();
      return decodingContext.decodeAudioData(arrayBuffer.slice(0)).then(function(decoded) {
        decodingContext.close();
        var durationSec = decoded.duration;
        var offlineCtx = new OfflineAudioContext(1, Math.ceil(durationSec * ASR_TARGET_SAMPLE_RATE), ASR_TARGET_SAMPLE_RATE);
        var source = offlineCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(offlineCtx.destination);
        source.start(0);
        return offlineCtx.startRendering();
      }).then(function(rendered) {
        return rendered.getChannelData(0);
      });
    });
  }

  // Transcribes a recorded response Blob. Resolves with the transcript
  // string. Rejects (rather than hanging) on any failure so callers can
  // fall back to fully manual scoring.
  function transcribeBlob(blob, onProgress) {
    function run() {
      return Promise.all([
        loadAsrPipeline(onProgress),
        bounded(blobToFloat32Mono16k(blob), 20000, 'Audio decoding')
      ]).then(function(results) {
        var asr = results[0];
        var audioData = results[1];
        return bounded(
          asr(audioData, { chunk_length_s: 30, stride_length_s: 5 }),
          INFERENCE_TIMEOUT_MS,
          'Whisper transcription'
        );
      }).then(function(result) {
        return (result && result.text ? result.text : '').trim();
      });
    }
    var job = transcriptionQueue.then(run, run);
    transcriptionQueue = job.catch(function() { return null; });
    return job;
  }

  // --- Verbatim-unit matching -------------------------------------------
  // Pure text logic, no DOM/Audio/network dependency - exported separately
  // below for deterministic unit testing.

  function normalizeForMatching(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Match complete adjacent tokens, never substrings. This prevents false
  // positives such as "she" matching "he" or "training" matching "train".
  function tokenise(text) {
    var normalized = normalizeForMatching(text);
    return normalized ? normalized.split(' ') : [];
  }

  function findPhrase(haystackTokens, phraseTokens) {
    if (!phraseTokens.length || phraseTokens.length > haystackTokens.length) return -1;
    for (var i = 0; i <= haystackTokens.length - phraseTokens.length; i += 1) {
      var matched = true;
      for (var j = 0; j < phraseTokens.length; j += 1) {
        if (haystackTokens[i + j] !== phraseTokens[j]) {
          matched = false;
          break;
        }
      }
      if (matched) return i;
    }
    return -1;
  }

  function expandOptionalPlural(value) {
    var text = String(value || '');
    if (text.indexOf('(s)') === -1) return [text];
    return [text.replace(/\(s\)/g, ''), text.replace(/\(s\)/g, 's')];
  }

  function unitEvidence(transcriptTokens, unitAlternatesField) {
    var fields = String(unitAlternatesField).split('/');
    for (var i = 0; i < fields.length; i += 1) {
      var expanded = expandOptionalPlural(fields[i]);
      for (var j = 0; j < expanded.length; j += 1) {
        var phraseTokens = tokenise(expanded[j]);
        var start = findPhrase(transcriptTokens, phraseTokens);
        if (start !== -1) {
          var excerptStart = Math.max(0, start - 3);
          var excerptEnd = Math.min(transcriptTokens.length, start + phraseTokens.length + 3);
          return {
            matched: true,
            alternate: phraseTokens.join(' '),
            start_token: start,
            excerpt: transcriptTokens.slice(excerptStart, excerptEnd).join(' ')
          };
        }
      }
    }
    return { matched: false, alternate: null, start_token: null, excerpt: null };
  }

  // Returns evidence objects so automatic suggestions remain auditable.
  function matchVerbatimUnitEvidence(transcript, verbatimUnits) {
    var transcriptTokens = tokenise(transcript);
    return verbatimUnits.map(function(unit) {
      return unitEvidence(transcriptTokens, unit[1]);
    });
  }

  function matchVerbatimUnits(transcript, verbatimUnits) {
    return matchVerbatimUnitEvidence(transcript, verbatimUnits).map(function(result) {
      return result.matched;
    });
  }

  window.OSRTranscription = {
    transcribeBlob: transcribeBlob,
    modelId: ASR_MODEL_ID
  };

  // Exposed for deterministic unit testing (see tests/osr_transcription.test.js).
  // Pure text logic only - no DOM/Audio/network dependencies.
  window.OSRTranscriptionScoring = {
    normalizeForMatching: normalizeForMatching,
    matchVerbatimUnits: matchVerbatimUnits,
    matchVerbatimUnitEvidence: matchVerbatimUnitEvidence
  };
})();
