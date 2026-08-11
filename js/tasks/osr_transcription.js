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
  var ASR_MODEL_ID = 'Xenova/whisper-small.en';
  var ASR_TARGET_SAMPLE_RATE = 16000;
  var MODEL_TIMEOUT_MS = 120000;
  var INFERENCE_TIMEOUT_MS = 90000;
  var WORKER_RESPONSE_TIMEOUT_MS = MODEL_TIMEOUT_MS + INFERENCE_TIMEOUT_MS + 30000;

  var transcriptionQueue = Promise.resolve();
  var transcriptionWorker = null;
  var transcriptionJobs = {};
  var nextJobId = 1;

  function bounded(promise, timeoutMs, label) {
    if (window.BatteryReliability) return window.BatteryReliability.withTimeout(promise, timeoutMs, label);
    return new Promise(function(resolve, reject) {
      var timer = setTimeout(function() { reject(new Error(label + ' timed out')); }, timeoutMs);
      Promise.resolve(promise).then(function(value) { clearTimeout(timer); resolve(value); })
        .catch(function(error) { clearTimeout(timer); reject(error); });
    });
  }

  function rejectAllWorkerJobs(error) {
    Object.keys(transcriptionJobs).forEach(function(jobId) {
      var job = transcriptionJobs[jobId];
      clearTimeout(job.timer);
      job.reject(error);
      delete transcriptionJobs[jobId];
    });
  }

  function resetTranscriptionWorker(error) {
    if (transcriptionWorker) {
      transcriptionWorker.terminate();
      transcriptionWorker = null;
    }
    if (error) rejectAllWorkerJobs(error);
  }

  function transcriptionWorkerUrl() {
    if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
      return new URL('osr_transcription_worker.js', document.currentScript.src).href;
    }
    return '/js/tasks/osr_transcription_worker.js';
  }

  function getTranscriptionWorker() {
    if (transcriptionWorker) return transcriptionWorker;
    if (typeof Worker === 'undefined') {
      throw new Error('Background transcription is not supported in this browser; enter the transcript manually.');
    }
    transcriptionWorker = new Worker(transcriptionWorkerUrl());
    transcriptionWorker.onmessage = function(event) {
      var message = event.data || {};
      var job = transcriptionJobs[message.jobId];
      if (!job) return;
      if (message.type === 'progress') {
        if (typeof job.onProgress === 'function') job.onProgress(message.progress);
        return;
      }
      clearTimeout(job.timer);
      delete transcriptionJobs[message.jobId];
      if (message.type === 'result') job.resolve(message.transcript || '');
      else job.reject(new Error(message.message || 'Background transcription failed'));
    };
    transcriptionWorker.onerror = function(event) {
      var message = event && event.message ? event.message : 'Background transcription worker failed';
      resetTranscriptionWorker(new Error(message));
    };
    return transcriptionWorker;
  }

  // Audio decoding and resampling use browser media APIs. The expensive
  // Whisper/ONNX inference is transferred to a worker so the page remains
  // responsive and the worker can be terminated if it exceeds the deadline.
  function blobToFloat32Mono16k(blob) {
    return blob.arrayBuffer().then(function(arrayBuffer) {
      var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) throw new Error('Audio decoding is not supported in this browser');
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
        return new Float32Array(rendered.getChannelData(0));
      });
    });
  }

  function transcribeInWorker(audioData, onProgress) {
    return new Promise(function(resolve, reject) {
      var worker;
      try {
        worker = getTranscriptionWorker();
      } catch (error) {
        reject(error);
        return;
      }
      var jobId = String(nextJobId++);
      var timer = setTimeout(function() {
        resetTranscriptionWorker(new Error('Background Whisper transcription timed out and was stopped'));
      }, WORKER_RESPONSE_TIMEOUT_MS);
      transcriptionJobs[jobId] = {
        resolve: resolve,
        reject: reject,
        onProgress: onProgress,
        timer: timer
      };
      worker.postMessage({
        type: 'transcribe',
        jobId: jobId,
        audioData: audioData
      }, [audioData.buffer]);
    });
  }

  function transcribeBlob(blob, onProgress) {
    function run() {
      return bounded(blobToFloat32Mono16k(blob), 20000, 'Audio decoding')
        .then(function(audioData) {
          return transcribeInWorker(audioData, onProgress);
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
