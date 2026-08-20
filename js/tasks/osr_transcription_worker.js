/* ============================================================
   osr_transcription_worker.js
   Runs Whisper/ONNX inference away from the browser UI thread.
   Recorded audio is received as a transferred Float32Array and is
   never sent to a remote speech service.
   ============================================================ */
'use strict';

var TRANSFORMERS_JS_CDN_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
var ASR_ENGLISH_MODEL_ID = 'Xenova/whisper-small.en';
var ASR_MULTILINGUAL_MODEL_ID = 'Xenova/whisper-small';
var MODEL_TIMEOUT_MS = 120000;
var INFERENCE_TIMEOUT_MS = 90000;
var transformersModulePromise = null;
var asrPipelinePromise = null;

function bounded(promise, timeoutMs, label) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() { reject(new Error(label + ' timed out')); }, timeoutMs);
    Promise.resolve(promise).then(function(value) {
      clearTimeout(timer);
      resolve(value);
    }).catch(function(error) {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function loadTransformersModule() {
  if (!transformersModulePromise) {
    transformersModulePromise = import(/* webpackIgnore: true */ TRANSFORMERS_JS_CDN_URL)
      .catch(function(error) {
        transformersModulePromise = null;
        throw error;
      });
  }
  return transformersModulePromise;
}

function modelForLanguage(language) {
  return language === 'de' ? ASR_MULTILINGUAL_MODEL_ID : ASR_ENGLISH_MODEL_ID;
}

function loadAsrPipeline(jobId, language) {
  var requestedModelId = modelForLanguage(language);
  if (!asrPipelinePromise) {
    asrPipelinePromise = bounded(
      loadTransformersModule().then(function(transformersModule) {
        return transformersModule.pipeline('automatic-speech-recognition', requestedModelId, {
          progress_callback: function(progress) {
            if (progress && progress.status === 'progress' && typeof progress.progress === 'number') {
              self.postMessage({ type: 'progress', jobId: jobId, progress: progress.progress });
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

self.onmessage = function(event) {
  var message = event.data || {};
  if (message.type !== 'transcribe' || !message.jobId || !message.audioData) return;
  var jobId = message.jobId;
  Promise.resolve(loadAsrPipeline(jobId, message.language)).then(function(asr) {
    var audioData = message.audioData instanceof Float32Array
      ? message.audioData : new Float32Array(message.audioData);
    var generationOptions = {
      chunk_length_s: 30,
      stride_length_s: 5
    };
    /* whisper-small.en is already fixed to English and rejects explicit
       language/task options. The multilingual model requires both for German. */
    if (message.language === 'de') {
      generationOptions.language = 'german';
      generationOptions.task = 'transcribe';
    }
    return bounded(
      asr(audioData, generationOptions),
      INFERENCE_TIMEOUT_MS,
      'Whisper transcription'
    );
  }).then(function(result) {
    self.postMessage({
      type: 'result',
      jobId: jobId,
      transcript: result && result.text ? String(result.text).trim() : ''
    });
  }).catch(function(error) {
    self.postMessage({
      type: 'error',
      jobId: jobId,
      message: error && error.message ? error.message : 'Background transcription failed'
    });
  });
};
