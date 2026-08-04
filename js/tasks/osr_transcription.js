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
  var TRANSFORMERS_JS_CDN_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js';
  var ASR_MODEL_ID = 'Xenova/whisper-small.en';
  var ASR_TARGET_SAMPLE_RATE = 16000;

  var transformersModulePromise = null;
  var asrPipelinePromise = null;

  // Dynamically imports transformers.js from the CDN exactly once,
  // regardless of how many times this is called.
  function loadTransformersModule() {
    if (!transformersModulePromise) {
      transformersModulePromise = import(/* webpackIgnore: true */ TRANSFORMERS_JS_CDN_URL);
    }
    return transformersModulePromise;
  }

  // Lazily builds (and caches) the automatic-speech-recognition pipeline.
  // onProgress(percent) is called during the one-time model download.
  function loadAsrPipeline(onProgress) {
    if (!asrPipelinePromise) {
      asrPipelinePromise = loadTransformersModule().then(function(transformersModule) {
        return transformersModule.pipeline('automatic-speech-recognition', ASR_MODEL_ID, {
          progress_callback: function(progress) {
            if (typeof onProgress === 'function' && progress && progress.status === 'progress' && typeof progress.progress === 'number') {
              onProgress(progress.progress);
            }
          }
        });
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
    return Promise.all([
      loadAsrPipeline(onProgress),
      blobToFloat32Mono16k(blob)
    ]).then(function(results) {
      var asr = results[0];
      var audioData = results[1];
      return asr(audioData, { chunk_length_s: 30, stride_length_s: 5 });
    }).then(function(result) {
      return (result && result.text ? result.text : '').trim();
    });
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

  // A verbatim unit's second field lists acceptable surface forms
  // separated by '/', e.g. "took / take / taking". Matches if any listed
  // form (as a normalized substring, allowing internal spaces) appears in
  // the normalized transcript.
  function unitMatches(transcriptNormalized, unitAlternatesField) {
    var alternates = String(unitAlternatesField).split('/').map(function(s) { return normalizeForMatching(s); }).filter(Boolean);
    return alternates.some(function(alt) {
      return alt && transcriptNormalized.indexOf(alt) !== -1;
    });
  }

  // Returns an array of booleans, one per verbatim unit, indicating
  // whether that unit's acceptable form was found in the transcript.
  function matchVerbatimUnits(transcript, verbatimUnits) {
    var normalized = normalizeForMatching(transcript);
    return verbatimUnits.map(function(unit) {
      return unitMatches(normalized, unit[1]);
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
    matchVerbatimUnits: matchVerbatimUnits
  };
})();
