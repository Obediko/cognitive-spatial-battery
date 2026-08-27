/* ============================================================
   original_story_recall.js
   Original Story Recall (OSR-44) - pilot implementation
   ============================================================ */
'use strict';

(function() {
  var OSR_VERSION = '0.1.0-pilot';
  var OSR_DICTIONARY_VERSION = 'osr44-en-0.1';
  var OSR_STORY_FORM = 'osr44-library-wallet-a';
  var OSR_STORY_TEXT = 'Thursday morning, Elena took the seven-fifteen bus to the library. She returned three books and printed a job form. Upstairs, she found a blue wallet by a window. Inside were an identity card and two train tickets. Elena gave it to the librarian, who phoned the owner. Twenty minutes later, an older man arrived, thanked Elena, and offered coffee. She declined and took the eleven o’clock bus home.';

  var OSR_AUDIO_BASE = 'assets/audio/osr/';
  var OSR_AUDIO_FILES = {
    story: OSR_AUDIO_BASE + 'osr44_library_wallet_a_v1.wav',
    instruction: OSR_AUDIO_BASE + 'osr_instruction_v1.wav',
    immediatePrompt: OSR_AUDIO_BASE + 'osr_immediate_prompt_v1.wav',
    delayedPrompt: OSR_AUDIO_BASE + 'osr_delayed_prompt_v1.wav',
    neutralPrompt: OSR_AUDIO_BASE + 'osr_neutral_prompt_v1.wav'
  };
  var OSR_AUDIO_LOAD_TIMEOUT_MS = 15000;

  // Loads a standardized audio file and resolves with a ready-to-play <audio>
  // element. Rejects (rather than hanging) on load error or timeout so callers
  // can pause and offer a retry without substituting a different voice.
  function osrLoadAudio(src) {
    return new Promise(function(resolve, reject) {
      var el = window.OSRState && window.OSRState.player
        ? window.OSRState.player : new Audio();
      if (window.OSRState) window.OSRState.player = el;
      el.pause();
      var settled = false;
      var timeoutId = setTimeout(function() {
        if (settled) return;
        settled = true;
        el.removeEventListener('loadeddata', onReady);
        el.removeEventListener('canplay', onReady);
        el.removeEventListener('canplaythrough', onReady);
        el.removeEventListener('error', onError);
        reject(new Error('timeout loading ' + src));
      }, OSR_AUDIO_LOAD_TIMEOUT_MS);

      function onReady() {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        el.removeEventListener('loadeddata', onReady);
        el.removeEventListener('canplay', onReady);
        el.removeEventListener('canplaythrough', onReady);
        el.removeEventListener('error', onError);
        resolve(el);
      }
      function onError() {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        el.removeEventListener('loadeddata', onReady);
        el.removeEventListener('canplay', onReady);
        el.removeEventListener('canplaythrough', onReady);
        el.removeEventListener('error', onError);
        reject(new Error('failed to load ' + src));
      }

      el.addEventListener('loadeddata', onReady, { once: true });
      el.addEventListener('canplay', onReady, { once: true });
      el.addEventListener('canplaythrough', onReady, { once: true });
      el.addEventListener('error', onError, { once: true });
      el.preload = 'auto';
      el.src = src;
      el.load();
    });
  }

  // Plays a loaded audio element and resolves when playback ends (or rejects
  // on playback error), giving callers a single place to hook onstart/onend.
  function osrPlayLoadedAudio(el, onStart) {
    return new Promise(function(resolve, reject) {
      var settled = false;
      var timer = setTimeout(function() { finish(new Error('playback timed out')); }, 120000);
      function finish(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error); else resolve();
      }
      el.addEventListener('ended', function() { finish(null); }, { once: true });
      el.addEventListener('error', function() { finish(new Error('playback error')); }, { once: true });
      if (typeof onStart === 'function') el.addEventListener('play', onStart, { once: true });
      var playPromise = el.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function(error) { finish(error); });
      }
    });
  }
  var OSR_MIN_DELAY_MS = window.PILOT_MODE ? 15000 : 10 * 60 * 1000;
  var OSR_TARGET_DELAY_MS = window.PILOT_MODE ? 20000 : 12 * 60 * 1000;
  var OSR_MAX_DELAY_MS = window.PILOT_MODE ? 60000 : 15 * 60 * 1000;

  var OSR_VERBATIM_UNITS = [
    ['Thursday', 'Thursday'], ['morning', 'morning'], ['Elena', 'Elena'],
    ['took', 'took / take / taking'], ['seven-fifteen', 'seven fifteen / 7:15'],
    ['bus', 'bus'], ['library', 'library'], ['returned', 'returned / return / returning'],
    ['three', 'three / 3'], ['books', 'book / books'], ['printed', 'printed / print / printing'],
    ['job', 'job'], ['form', 'form'], ['upstairs', 'upstairs'], ['found', 'found / find / finding'],
    ['blue', 'blue'], ['wallet', 'wallet'], ['by', 'by'], ['window', 'window'],
    ['inside', 'inside'], ['identity', 'identity / ID / identification'], ['card', 'card'],
    ['two', 'two / 2'], ['train', 'train'], ['tickets', 'ticket / tickets'],
    ['Elena', 'Elena'], ['gave', 'gave / give / given'], ['librarian', 'librarian'],
    ['phoned', 'phoned / phone / phoning'], ['owner', 'owner'], ['twenty', 'twenty / 20'],
    ['minutes later', 'minute(s) later'], ['older', 'older'], ['man', 'man'],
    ['arrived', 'arrived / arrive / arriving'], ['thanked', 'thanked / thank / thanking'],
    ['Elena', 'Elena'], ['offered', 'offered / offer / offering'], ['coffee', 'coffee'],
    ['declined', 'declined / decline / declining'], ['took', 'took / take / taking'],
    ['eleven o’clock', 'eleven o’clock / 11 o’clock'], ['bus', 'bus'], ['home', 'home']
  ];

  var OSR_PARAPHRASE_UNITS = [
    'The event occurred on Thursday morning',
    'The principal character was Elena',
    'She took a bus at 7:15',
    'She travelled to a library',
    'She returned three books',
    'She printed a form',
    'The form concerned a job',
    'She went upstairs',
    'She found or noticed a wallet',
    'The wallet was blue',
    'It was beside a window',
    'The wallet contained an identity card',
    'It contained two train tickets',
    'Elena handed the wallet to a librarian',
    'The librarian phoned someone',
    'The person called was the wallet owner',
    'Approximately twenty minutes passed',
    'An older man arrived',
    'The older man was the wallet owner',
    'He thanked Elena',
    'He offered Elena coffee',
    'Elena declined the offer',
    'Elena later took another bus',
    'That bus was at 11 o’clock',
    'She went home'
  ];

  var OSR_IS_GERMAN = window.BatteryLanguage && window.BatteryLanguage.get() === 'de';
  if (OSR_IS_GERMAN) {
    OSR_DICTIONARY_VERSION = 'osr44-de-1.0';
    OSR_STORY_FORM = 'osr44-library-wallet-a-de-1.0';
    OSR_STORY_TEXT = 'Am Donnerstagmorgen nahm Elena den Bus um sieben Uhr fünfzehn zur Bibliothek. Sie gab drei Bücher zurück und druckte ein Bewerbungsformular aus. Im Obergeschoss fand sie neben einem Fenster eine blaue Brieftasche. Darin waren eine Identitätskarte und zwei Fahrkarten. Elena gab sie der Bibliothekarin, die den Besitzer anrief. Zwanzig Minuten später kam ein älterer Mann, dankte Elena und bot ihr Kaffee an. Sie lehnte ab und fuhr mit dem Bus um elf Uhr nach Hause.';
    OSR_AUDIO_FILES = {
      story: OSR_AUDIO_BASE + 'osr44_library_wallet_a_de_v2.wav',
      instruction: OSR_AUDIO_BASE + 'osr_instruction_de_v2.wav',
      immediatePrompt: OSR_AUDIO_BASE + 'osr_immediate_prompt_de_v2.wav',
      delayedPrompt: OSR_AUDIO_BASE + 'osr_delayed_prompt_de_v2.wav',
      neutralPrompt: OSR_AUDIO_BASE + 'osr_neutral_prompt_de_v2.wav'
    };
    OSR_VERBATIM_UNITS = [
      ['Donnerstag','Donnerstag'],['morgen','Morgen'],['Elena','Elena'],['nahm','nahm / nehmen'],
      ['sieben Uhr fünfzehn','7:15 / sieben Uhr fünfzehn'],['Bus','Bus'],['Bibliothek','Bibliothek'],
      ['gab zurück','gab zurück / zurückgeben'],['drei','drei / 3'],['Bücher','Buch / Bücher'],
      ['druckte','druckte / drucken'],['Bewerbung','Bewerbung'],['Formular','Formular'],['Obergeschoss','Obergeschoss / oben'],
      ['fand','fand / finden'],['blaue','blau / blaue'],['Brieftasche','Brieftasche / Portemonnaie / Geldbörse'],
      ['neben','neben'],['Fenster','Fenster'],['darin','darin / innen'],['Identität','Identitätskarte / Ausweis'],
      ['Karte','Identitätskarte / Karte'],['zwei','zwei / 2'],['Fahr','Fahrkarten / Zug'],['karten','Fahrkarte / Fahrkarten'],
      ['Elena','Elena'],['gab','gab / geben'],['Bibliothekarin','Bibliothekarin / Bibliothekar'],
      ['anrief','anrief / anrufen'],['Besitzer','Besitzer / Eigentümer'],['zwanzig','zwanzig / 20'],
      ['Minuten später','Minute(n) später'],['älterer','alt / älter'],['Mann','Mann'],['kam','kam / kommen'],
      ['dankte','dankte / danken'],['Elena','Elena'],['bot an','bot an / anbieten'],['Kaffee','Kaffee'],
      ['lehnte ab','lehnte ab / ablehnen'],['fuhr','fuhr / fahren'],['elf Uhr','11 Uhr / elf Uhr'],['Bus','Bus'],['nach Hause','Hause / heim']
    ];
    OSR_PARAPHRASE_UNITS = [
      'Das Ereignis fand am Donnerstagmorgen statt','Die Hauptperson hieß Elena','Sie nahm um 7:15 Uhr einen Bus',
      'Sie fuhr zu einer Bibliothek','Sie gab drei Bücher zurück','Sie druckte ein Formular','Das Formular betraf eine Bewerbung',
      'Sie ging in ein Obergeschoss','Sie fand oder bemerkte eine Brieftasche','Die Brieftasche war blau','Sie lag neben einem Fenster',
      'Sie enthielt eine Identitätskarte','Sie enthielt zwei Fahrkarten','Elena gab die Brieftasche einer Bibliothekarin',
      'Die Bibliothekarin rief jemanden an','Die angerufene Person war der Besitzer','Etwa zwanzig Minuten vergingen',
      'Ein älterer Mann kam','Der ältere Mann war der Besitzer','Er dankte Elena','Er bot Elena Kaffee an',
      'Elena lehnte das Angebot ab','Elena nahm später einen weiteren Bus','Dieser Bus fuhr um 11 Uhr','Sie fuhr nach Hause'
    ];
  }

  window.OSRState = {
    version: OSR_VERSION,
    dictionaryVersion: OSR_DICTIONARY_VERSION,
    audio: {},
    audioUrls: {},
    immediateEndMs: null,
    delayedStartMs: null,
    voiceMetadata: null,
    player: null,
    storyAudioStandardized: false,
    neutralPromptUsed: { immediate: false, delayed: false },
    protocolFlags: {
      hearing_flag: false,
      playback_interrupted: false,
      microphone_problem: false,
      examiner_prompt_deviation: false
    }
  };

  function osrDisplay() {
    return document.getElementById('jspsych-content') ||
      document.querySelector('.jspsych-content') ||
      document.getElementById('jspsych-target');
  }

  function osrEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function osrFilename(condition, extension) {
    var pid = window.BatteryData.participantId || 'unknown';
    var date = new Date().toISOString().slice(0, 10);
    return pid + '_' + date + '_osr44_' + condition + '.' + extension;
  }

  function osrExtension(mimeType) {
    if (/ogg/i.test(mimeType || '')) return 'ogg';
    if (/mp4/i.test(mimeType || '')) return 'm4a';
    return 'webm';
  }

  function osrDownloadAudio(condition) {
    var blob = window.OSRState.audio[condition];
    if (!blob) return;
    triggerDownload(blob, osrFilename(condition, osrExtension(blob.type)), blob.type || 'audio/webm');
  }
  window.downloadOSRAudio = osrDownloadAudio;

  function osrInstructionTrial() {
    return {
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">' + (OSR_IS_GERMAN ? 'ETI-Kern · Verbales Gedächtnis' : 'ETI Core · Verbal memory') + '</span>'
        + '<h2>' + (OSR_IS_GERMAN ? 'Geschichte erinnern' : 'Original Story Recall') + '</h2>'
        + '<p>' + (OSR_IS_GERMAN
          ? 'Sie hören einmal eine kurze Geschichte. Hören Sie genau zu. Anschließend sollen Sie die gesamte Geschichte mit möglichst vielen Einzelheiten wiedergeben.'
          : 'You will hear a short story once. Listen carefully because, when it ends, you will be asked to tell the whole story back in as much detail as you can.') + '</p>'
        + '<div class="info-box"><p>' + (OSR_IS_GERMAN ? 'Sie dürfen eigene Worte verwenden.' : 'You may use your own words.') + '</p>'
        + '<p>' + (OSR_IS_GERMAN ? 'Schreiben Sie nichts auf und verwenden Sie kein anderes Gerät.' : 'Do not write anything down and do not use another device.') + '</p>'
        + '<p>' + (OSR_IS_GERMAN ? 'Ihre Antwort wird für die Auswertung aufgezeichnet.' : 'Your response will be recorded locally for scoring.') + '</p></div>'
        + '<button class="battery-btn" id="osr-replay-instructions" type="button">' + (OSR_IS_GERMAN ? 'Anweisung erneut abspielen' : 'Replay instructions audio') + '</button>'
        + '<p id="osr-instruction-audio-status" class="osr-status" aria-live="polite"></p>'
        + '</div>',
      choices: [OSR_IS_GERMAN ? 'Weiter zur Mikrofonprüfung' : 'Continue to microphone check'],
      data: { task_name: 'original_story_recall', phase: 'instructions', task_version: OSR_VERSION },
      on_load: function() {
        var button = document.getElementById('osr-replay-instructions');
        var status = document.getElementById('osr-instruction-audio-status');
        var currentAudio = null;

        function setContinueEnabled(enabled) {
          Array.prototype.forEach.call(document.querySelectorAll('.jspsych-btn'), function(choice) {
            choice.disabled = !enabled;
          });
        }

        function playInstructionAudio() {
          setContinueEnabled(false);
          if (button) { button.disabled = true; }
          if (status) status.textContent = OSR_IS_GERMAN ? 'Wiedergabe läuft…' : 'Playing…';
          osrLoadAudio(OSR_AUDIO_FILES.instruction).then(function(audioEl) {
            currentAudio = audioEl;
            return osrPlayLoadedAudio(audioEl);
          }).then(function() {
            if (status) status.textContent = '';
            if (button) button.disabled = false;
            setContinueEnabled(true);
          }).catch(function() {
            if (status) status.innerHTML =
              '<span class="osr-error">' + (OSR_IS_GERMAN
                ? 'Die standardisierte Aufnahme konnte nicht geladen werden. Prüfen Sie die Verbindung und versuchen Sie es erneut.'
                : 'The standardized recording could not be loaded. Check the connection and retry.') + '</span>';
            if (button) button.disabled = false;
            setContinueEnabled(true);
          });
        }

        if (button) button.addEventListener('click', playInstructionAudio);
        playInstructionAudio();
      }
    };
  }

  function osrMicrophoneCheckTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = osrDisplay();
        display.innerHTML = '<div class="osr-card"><span class="osr-kicker">' + (OSR_IS_GERMAN ? 'Geräteprüfung' : 'Device check') + '</span>'
          + '<h2>' + (OSR_IS_GERMAN ? 'Mikrofonzugriff' : 'Microphone access') + '</h2><p>'
          + (OSR_IS_GERMAN ? 'Erlauben Sie den Mikrofonzugriff, wenn der Browser danach fragt.' : 'Allow microphone access when your browser asks.') + '</p>'
          + '<button class="battery-btn primary" id="osr-mic-check">' + (OSR_IS_GERMAN ? 'Mikrofon prüfen' : 'Check microphone') + '</button>'
          + '<p id="osr-mic-status" class="osr-status" aria-live="polite"></p></div>';
        var button = document.getElementById('osr-mic-check');
        var status = document.getElementById('osr-mic-status');
        button.addEventListener('click', function() {
          button.disabled = true;
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
            window.OSRState.protocolFlags.microphone_problem = true;
            status.innerHTML = '<span class="osr-error">' + (OSR_IS_GERMAN ? 'Dieser Browser unterstützt keine Audioaufnahme.' : 'Audio recording is not supported in this browser.') + '</span>';
            button.textContent = OSR_IS_GERMAN ? 'Mit Protokollvermerk fortfahren' : 'Continue with protocol flag';
            button.disabled = false;
            button.onclick = function() { done({ microphone_available: false }); };
            return;
          }
          window.BatteryReliability.requestMicrophone(30000).then(function(stream) {
            stream.getTracks().forEach(function(track) { track.stop(); });
            status.innerHTML = '<span class="osr-success">' + (OSR_IS_GERMAN ? 'Das Mikrofon ist bereit.' : 'Microphone is ready.') + '</span>';
            setTimeout(function() { done({ microphone_available: true }); }, 600);
          }).catch(function(error) {
            window.OSRState.protocolFlags.microphone_problem = true;
            status.innerHTML = '<span class="osr-error">' + (OSR_IS_GERMAN ? 'Mikrofon nicht verfügbar: ' : 'Microphone unavailable: ')
              + osrEscape(error && error.message ? error.message : 'permission denied') + '</span>';
            button.textContent = OSR_IS_GERMAN ? 'Mit Protokollvermerk fortfahren' : 'Continue with protocol flag';
            button.disabled = false;
            button.onclick = function() { done({ microphone_available: false }); };
          });
        });
      }
    };
  }

  function osrPlayStoryTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = osrDisplay();
        display.innerHTML = '<div class="osr-card osr-listening"><span class="osr-kicker">' + (OSR_IS_GERMAN ? 'Einmal anhören' : 'Listen once') + '</span>'
          + '<div class="osr-soundmark" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>'
          + '<h2>' + (OSR_IS_GERMAN ? 'Die Geschichte wird abgespielt' : 'The story is playing') + '</h2><p>'
          + (OSR_IS_GERMAN ? 'Hören Sie zu. Der Text wird nicht auf dem Bildschirm angezeigt.' : 'Please listen. The text will not appear on screen.') + '</p>'
          + '<p id="osr-play-status" class="osr-status" aria-live="polite">Preparing audio…</p></div>';

        function finishTrial(extra) {
          var base = {
            task_name: 'original_story_recall',
            phase: 'encoding',
            task_version: OSR_VERSION,
            story_form: OSR_STORY_FORM
          };
          done(Object.assign(base, extra));
        }

        var status = document.getElementById('osr-play-status');

        osrLoadAudio(OSR_AUDIO_FILES.story).then(function(audioEl) {
          return osrPlayLoadedAudio(audioEl, function() {
            if (status) status.textContent = OSR_IS_GERMAN ? 'Wiedergabe läuft…' : 'Playing…';
          });
        }).then(function() {
          window.OSRState.storyAudioStandardized = true;
          window.OSRState.voiceMetadata = {
            source: 'standardized_recording',
            file: OSR_AUDIO_FILES.story
          };
          finishTrial({
            story_audio_standardized: true,
            voice_metadata: JSON.stringify(window.OSRState.voiceMetadata)
          });
        }).catch(function(error) {
          window.OSRState.protocolFlags.playback_interrupted = true;
          if (status) status.innerHTML = '<span class="osr-error">' + (OSR_IS_GERMAN
            ? 'Die standardisierte Geschichte konnte nicht geladen werden. Diese Aufgabe wurde angehalten, damit keine nicht standardisierte Computerstimme verwendet wird.'
            : 'The standardized story could not be loaded. This task is paused so that a non-standardized computer voice is never substituted.')
            + '</span><br><button class="battery-btn primary" id="osr-retry-story" type="button">'
            + (OSR_IS_GERMAN ? 'Audio erneut laden' : 'Retry standardized audio') + '</button>';
          var retry = document.getElementById('osr-retry-story');
          if (retry) retry.addEventListener('click', function() {
            retry.disabled = true;
            osrLoadAudio(OSR_AUDIO_FILES.story).then(function(audioEl) {
              return osrPlayLoadedAudio(audioEl, function() { status.textContent = OSR_IS_GERMAN ? 'Wiedergabe läuft…' : 'Playing…'; });
            }).then(function() {
              window.OSRState.storyAudioStandardized = true;
              finishTrial({ story_audio_standardized: true, audio_retry_used: true });
            }).catch(function(retryError) {
              retry.disabled = false;
              status.insertAdjacentHTML('afterbegin', '<span class="osr-error">' + osrEscape(retryError.message) + '</span><br>');
            });
          });
        });
      }
    };
  }

  function osrRecordTrial(condition) {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = osrDisplay();
        var prompt = OSR_IS_GERMAN
          ? (condition === 'immediate'
            ? 'Bitte erzählen Sie mir jetzt die Geschichte. Nennen Sie so viele Einzelheiten, wie Sie erinnern.'
            : 'Sie haben vorhin eine kurze Geschichte gehört. Bitte erzählen Sie diese Geschichte erneut und nennen Sie so viele Einzelheiten, wie Sie erinnern.')
          : (condition === 'immediate'
            ? 'Please tell me the story now. Include as many details as you can remember.'
            : 'Earlier, you heard a short story. Please tell me that story again, including as many details as you can remember.');
        display.innerHTML = '<div class="osr-card"><span class="osr-kicker">'
          + (condition === 'immediate' ? (OSR_IS_GERMAN ? 'Sofortige Wiedergabe' : 'Immediate recall') : (OSR_IS_GERMAN ? 'Verzögerte Wiedergabe' : 'Delayed recall')) + '</span>'
          + '<h2>' + (OSR_IS_GERMAN ? 'Erzählen Sie die Geschichte' : 'Tell the story back') + '</h2><p class="osr-prompt">' + prompt + '</p>'
          + '<button class="battery-btn" id="osr-replay-prompt" type="button">' + (OSR_IS_GERMAN ? 'Aufforderung erneut abspielen' : 'Replay prompt audio') + '</button>'
          + '<p id="osr-prompt-audio-status" class="osr-status" aria-live="polite"></p>'
          + '<button class="battery-btn primary" id="osr-start-recording">' + (OSR_IS_GERMAN ? 'Aufnahme starten' : 'Start recording') + '</button>'
          + '<button class="battery-btn" id="osr-stop-recording" disabled>' + (OSR_IS_GERMAN ? 'Antwort beenden' : 'Finish response') + '</button>'
          + '<div id="osr-recording-indicator" class="osr-recording-indicator" hidden>'
          + '<span class="osr-recording-dot"></span> ' + (OSR_IS_GERMAN ? 'Aufnahme ' : 'Recording ') + '<strong id="osr-recording-time">00:00</strong></div>'
          + '<button class="battery-btn" id="osr-play-neutral-prompt" type="button">' + (OSR_IS_GERMAN ? 'Neutrale Aufforderung abspielen' : 'Play neutral prompt') + '</button>'
          + '<label class="osr-examiner-flag"><input type="checkbox" id="osr-neutral-prompt"> '
          + (OSR_IS_GERMAN ? 'Prüfperson hat die einmalige neutrale Aufforderung verwendet' : 'Examiner used the single neutral prompt') + '</label>'
          + '<p id="osr-record-status" class="osr-status" aria-live="polite"></p></div>';

        (function() {
          var promptFile = condition === 'immediate' ? OSR_AUDIO_FILES.immediatePrompt : OSR_AUDIO_FILES.delayedPrompt;
          var replayButton = document.getElementById('osr-replay-prompt');
          var promptStatus = document.getElementById('osr-prompt-audio-status');
          var neutralButton = document.getElementById('osr-play-neutral-prompt');
          var neutralCheckbox = document.getElementById('osr-neutral-prompt');

          function playFile(file, statusEl, triggerButton) {
            if (triggerButton) triggerButton.disabled = true;
            if (statusEl) statusEl.textContent = OSR_IS_GERMAN ? 'Wiedergabe läuft…' : 'Playing…';
            osrLoadAudio(file).then(function(audioEl) {
              return osrPlayLoadedAudio(audioEl);
            }).then(function() {
              if (statusEl) statusEl.textContent = '';
              if (triggerButton) triggerButton.disabled = false;
            }).catch(function() {
              if (statusEl) statusEl.innerHTML = '<span class="osr-error">' + (OSR_IS_GERMAN
                ? 'Die standardisierte Aufnahme konnte nicht geladen werden. Bitte erneut versuchen.'
                : 'The standardized recording could not be loaded. Please retry.') + '</span>';
              if (triggerButton) triggerButton.disabled = false;
            });
          }

          if (replayButton) replayButton.addEventListener('click', function() { playFile(promptFile, promptStatus, replayButton); });
          if (neutralButton) neutralButton.addEventListener('click', function() {
            playFile(OSR_AUDIO_FILES.neutralPrompt, promptStatus, neutralButton);
            if (neutralCheckbox) neutralCheckbox.checked = true;
          });
          // Auto-play the recall prompt once when the trial loads.
          playFile(promptFile, promptStatus, replayButton);
        })();

        var startButton = document.getElementById('osr-start-recording');
        var stopButton = document.getElementById('osr-stop-recording');
        var status = document.getElementById('osr-record-status');
        var indicator = document.getElementById('osr-recording-indicator');
        var timerText = document.getElementById('osr-recording-time');
        var recorder = null;
        var stream = null;
        var chunks = [];
        var startMs = null;
        var timerId = null;

        function elapsedLabel(ms) {
          var total = Math.floor(ms / 1000);
          var min = String(Math.floor(total / 60)).padStart(2, '0');
          var sec = String(total % 60).padStart(2, '0');
          return min + ':' + sec;
        }

        function finishWithoutAudio(message) {
          window.OSRState.protocolFlags.microphone_problem = true;
          var end = Date.now();
          if (condition === 'immediate') window.OSRState.immediateEndMs = end;
          if (condition === 'delayed') window.OSRState.delayedStartMs = startMs || end;
          window.BatteryData.addTrials({
            task_name: 'original_story_recall',
            task_version: OSR_VERSION,
            scoring_dictionary_version: OSR_DICTIONARY_VERSION,
            story_form: OSR_STORY_FORM,
            condition: condition,
            phase: 'free_recall',
            response_audio_filename: null,
            response_audio_mime_type: null,
            response_duration_ms: startMs ? end - startMs : null,
            neutral_prompt_used: document.getElementById('osr-neutral-prompt').checked,
            microphone_problem: true,
            story_audio_standardized: window.OSRState.storyAudioStandardized,
            voice_metadata: JSON.stringify(window.OSRState.voiceMetadata),
            review_status: 'unscored',
            protocol_note: message
          });
          done();
        }

        startButton.addEventListener('click', function() {
          startButton.disabled = true;
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
            status.innerHTML = '<span class="osr-error">' + (OSR_IS_GERMAN ? 'Aufnahme nicht verfügbar.' : 'Recording unavailable.') + '</span>';
            stopButton.disabled = false;
            stopButton.textContent = OSR_IS_GERMAN ? 'Ohne Audio fortfahren' : 'Continue without audio';
            stopButton.onclick = function() { finishWithoutAudio('MediaRecorder unavailable'); };
            return;
          }
          window.BatteryReliability.requestMicrophone(30000).then(function(activeStream) {
            stream = activeStream;
            recorder = window.BatteryReliability.createAudioRecorder(stream);
            recorder.ondataavailable = function(event) {
              if (event.data && event.data.size) chunks.push(event.data);
            };
            recorder.onstop = function() {
              clearInterval(timerId);
              var blob = new Blob(chunks, { type: recorder.mimeType || recorder._batteryMimeType || 'application/octet-stream' });
              window.OSRState.audio[condition] = blob;
              if (window.OSRState.audioUrls[condition]) URL.revokeObjectURL(window.OSRState.audioUrls[condition]);
              window.OSRState.audioUrls[condition] = URL.createObjectURL(blob);
              window.BatteryArtifactStore.put(
                batteryArtifactKey(window.BatteryData.participantId, 'osr', condition),
                blob
              );
              stream.getTracks().forEach(function(track) { track.stop(); });
              var endMs = Date.now();
              var neutralUsed = document.getElementById('osr-neutral-prompt').checked;
              window.OSRState.neutralPromptUsed[condition] = neutralUsed;
              if (condition === 'immediate') window.OSRState.immediateEndMs = endMs;

              window.BatteryData.addTrials({
                task_name: 'original_story_recall',
                task_version: OSR_VERSION,
                scoring_dictionary_version: OSR_DICTIONARY_VERSION,
                story_form: OSR_STORY_FORM,
                condition: condition,
                phase: 'free_recall',
                response_audio_filename: osrFilename(condition, osrExtension(blob.type)),
                response_audio_mime_type: blob.type,
                response_duration_ms: endMs - startMs,
                neutral_prompt_used: neutralUsed,
                microphone_problem: false,
                story_audio_standardized: window.OSRState.storyAudioStandardized,
                voice_metadata: JSON.stringify(window.OSRState.voiceMetadata),
                review_status: 'unscored'
              });
              done();
            };
            recorder.start(250);
            startMs = Date.now();
            if (condition === 'delayed') window.OSRState.delayedStartMs = startMs;
            indicator.hidden = false;
            stopButton.disabled = false;
            status.textContent = OSR_IS_GERMAN ? 'Sprechen Sie natürlich. Drücken Sie anschließend auf „Antwort beenden“.'
              : 'Speak naturally. Press Finish response when you are done.';
            timerId = setInterval(function() {
              timerText.textContent = elapsedLabel(Date.now() - startMs);
            }, 250);
          }).catch(function(error) {
            status.innerHTML = '<span class="osr-error">' + (OSR_IS_GERMAN ? 'Mikrofon nicht verfügbar: ' : 'Microphone unavailable: ')
              + osrEscape(error && error.message ? error.message : 'permission denied') + '</span>';
            stopButton.disabled = false;
            stopButton.textContent = OSR_IS_GERMAN ? 'Ohne Audio fortfahren' : 'Continue without audio';
            stopButton.onclick = function() { finishWithoutAudio(error && error.message ? error.message : 'permission denied'); };
          });
        });

        stopButton.addEventListener('click', function() {
          if (recorder && recorder.state !== 'inactive') {
            stopButton.disabled = true;
            window.BatteryReliability.stopRecorder(recorder, chunks, 8000).then(function(result) {
              if (result && result.timedOut) {
                if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
                finishWithoutAudio('MediaRecorder stop timed out');
              }
            });
          }
        });
      }
    };
  }

  function osrDelayGateTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var start = window.OSRState.immediateEndMs;
        if (!start) {
          window.OSRState.protocolFlags.examiner_prompt_deviation = true;
          done({ delay_missing_start: true });
          return;
        }
        var display = osrDisplay();
        var elapsed = Date.now() - start;
        var remaining = Math.max(0, OSR_MIN_DELAY_MS - elapsed);

        function finishGate() {
          var actual = Date.now() - start;
          done({
            task_name: 'original_story_recall',
            phase: 'delay_gate',
            delay_duration_ms_at_gate: actual,
            delay_out_of_window: actual > OSR_MAX_DELAY_MS
          });
        }

        if (remaining <= 0) {
          finishGate();
          return;
        }

        display.innerHTML = '<div class="osr-card"><span class="osr-kicker">' + (OSR_IS_GERMAN ? 'Erinnerungsintervall' : 'Memory interval') + '</span>'
          + '<h2>' + (OSR_IS_GERMAN ? 'Kurze Wartezeit' : 'Short interval') + '</h2><p>' + (OSR_IS_GERMAN ? 'Bitte warten Sie. Der nächste Abschnitt beginnt automatisch.' : 'Please wait. The next section will begin automatically.') + '</p>'
          + '<div class="countdown-display" id="osr-delay-countdown"></div>'
          + '<p class="osr-fineprint">' + (OSR_IS_GERMAN ? 'Wiederholen oder besprechen Sie die zuvor gehörte Geschichte nicht.' : 'Do not rehearse or discuss the earlier story.') + '</p></div>';
        var countdown = document.getElementById('osr-delay-countdown');
        function update() {
          var left = Math.max(0, OSR_MIN_DELAY_MS - (Date.now() - start));
          var sec = Math.ceil(left / 1000);
          countdown.textContent = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
          if (left <= 0) {
            clearInterval(timer);
            finishGate();
          }
        }
        update();
        var timer = setInterval(update, 250);
      }
    };
  }

  function osrScoringTrial(condition) {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = osrDisplay();
        var priorTrial = window.BatteryData.trials.slice().reverse().find(function(row) {
          return row.task_name === 'original_story_recall' && row.phase === 'free_recall' && row.condition === condition;
        }) || null;
        function savedScores(field) {
          if (!priorTrial || !priorTrial[field]) return [];
          try {
            var parsed = JSON.parse(priorTrial[field]);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) { return []; }
        }
        var priorVerbatim = savedScores('verbatim_unit_scores');
        var priorParaphrase = savedScores('paraphrase_unit_scores');
        var hasPriorScoring = priorVerbatim.length > 0 || priorParaphrase.length > 0;
        var rows = OSR_VERBATIM_UNITS.map(function(unit, index) {
          return '<label class="osr-score-row"><input type="checkbox" class="osr-vb" data-index="' + index + '"' + (priorVerbatim[index] ? ' checked' : '') + '>'
            + '<span class="osr-unit-number">' + (index + 1) + '</span><span><strong>'
            + osrEscape(unit[0]) + '</strong><small>' + osrEscape(unit[1]) + '</small></span></label>';
        }).join('');
        var meaningRows = OSR_PARAPHRASE_UNITS.map(function(unit, index) {
          return '<label class="osr-score-row"><input type="checkbox" class="osr-pp" data-index="' + index + '"' + (priorParaphrase[index] ? ' checked' : '') + '>'
            + '<span class="osr-unit-number">' + (index + 1) + '</span><span>' + osrEscape(unit) + '</span></label>';
        }).join('');
        var audioUrl = window.OSRState.audioUrls[condition];
        var audioBlob = window.OSRState.audio[condition];

        display.innerHTML = '<div class="osr-review">'
          + '<div class="osr-review-header"><div><span class="osr-kicker">' + (OSR_IS_GERMAN ? 'Nur für die Prüfperson' : 'Examiner only') + '</span><h2>'
          + (OSR_IS_GERMAN ? (condition === 'immediate' ? 'Sofortige Wiedergabe auswerten' : 'Verzögerte Wiedergabe auswerten') : (condition === 'immediate' ? 'Immediate recall scoring' : 'Delayed recall scoring')) + '</h2></div>'
          + '<div class="osr-score-totals"><strong id="osr-vb-total">0/44</strong><span>' + (OSR_IS_GERMAN ? 'wörtlich' : 'verbatim') + '</span>'
          + '<strong id="osr-pp-total">0/25</strong><span>' + (OSR_IS_GERMAN ? 'sinngemäß' : 'paraphrase') + '</span></div></div>'
          + '<div class="warning-box">' + (OSR_IS_GERMAN ? 'Die teilnehmende Person darf diesen Bildschirm nicht sehen. Er enthält den Lösungsschlüssel.' : 'Move the participant away from the screen. This page contains the answer key.') + '</div>'
          + (audioUrl ? '<audio controls class="osr-audio-review" src="' + audioUrl + '"></audio>' : '<p class="osr-error">' + (OSR_IS_GERMAN ? 'Es wurde kein Ton aufgenommen.' : 'No audio was captured.') + '</p>')
          + '<p id="osr-asr-status" class="osr-status" aria-live="polite"></p>'
          + '<label class="osr-transcript-label">' + (OSR_IS_GERMAN ? 'Arbeits­transkript' : 'Working transcript')
          + '<textarea id="osr-transcript" rows="6" '
          + 'placeholder="' + (OSR_IS_GERMAN ? 'Optionales Transkript. Keine Identifikationsdaten eingeben.' : 'Optional examiner transcript. Do not enter identifying information.') + '"></textarea></label>'
          + '<p class="osr-fineprint">Verbatim checkboxes below are auto-filled from the transcript where possible. '
          + 'This is a pre-fill only, generated by an in-browser speech recognition model (no audio leaves this device) — '
          + 'review and correct every box before saving. Paraphrase units always require your own judgment; they are not auto-scored.</p>'
          + '<details open><summary>' + (OSR_IS_GERMAN ? 'Wörtliche Einheiten' : 'Verbatim units') + '</summary><div class="osr-score-grid">' + rows + '</div></details>'
          + '<details><summary>' + (OSR_IS_GERMAN ? 'Sinngemäße Einheiten' : 'Paraphrase units') + '</summary><div class="osr-score-grid">' + meaningRows + '</div></details>'
          + '<label class="osr-transcript-label">' + (OSR_IS_GERMAN ? 'Intrusionen und Bewertungsnotizen' : 'Intrusions and scoring notes') + '<textarea id="osr-intrusions" rows="3"></textarea></label>'
          + '<div class="osr-review-actions"><button class="battery-btn primary" id="osr-save-score">' + (OSR_IS_GERMAN ? 'Bestätigten Score speichern' : 'Save verified score') + '</button>'
          + '<button class="battery-btn" id="osr-defer-score">' + (OSR_IS_GERMAN ? 'Auswertung zurückstellen' : 'Defer scoring') + '</button>'
          + (audioUrl ? '<button class="battery-btn download" id="osr-download-audio">' + (OSR_IS_GERMAN ? 'Audio herunterladen' : 'Download audio') + '</button>' : '')
          + '</div></div>';

        var asrOutcome = { attempted: false, succeeded: false, model: null };
        var asrMatchEvidence = [];
        var scoringActive = true;

        function updateTotals() {
          document.getElementById('osr-vb-total').textContent =
            document.querySelectorAll('.osr-vb:checked').length + '/44';
          document.getElementById('osr-pp-total').textContent =
            document.querySelectorAll('.osr-pp:checked').length + '/25';
        }
        Array.prototype.forEach.call(document.querySelectorAll('.osr-vb,.osr-pp'), function(box) {
          box.addEventListener('change', updateTotals);
        });
        if (priorTrial) {
          document.getElementById('osr-transcript').value = priorTrial.transcript || '';
          document.getElementById('osr-intrusions').value = priorTrial.intrusions_and_notes || '';
        }
        updateTotals();
        var dl = document.getElementById('osr-download-audio');
        if (dl) dl.addEventListener('click', function() { osrDownloadAudio(condition); });

        var asrStatus = document.getElementById('osr-asr-status');
        if (hasPriorScoring) {
          asrStatus.textContent = OSR_IS_GERMAN ? 'Gespeicherte Bewertungen wurden geladen. Prüfen und ändern Sie nur die erforderlichen Einheiten.' : 'Saved scoring decisions loaded. Review and change only the units that need correction.';
        } else if (audioBlob && window.OSRTranscription && window.OSRTranscriptionScoring) {
          asrOutcome.attempted = true;
          asrOutcome.model = window.OSRTranscription.modelId;
          asrStatus.textContent = OSR_IS_GERMAN ? 'Spracherkennungsmodell wird geladen; die erste Nutzung kann dauern…' : 'Loading speech recognition model (first use may take a while)…';
          window.OSRTranscription.transcribeBlob(audioBlob, function(fraction) {
            asrStatus.textContent = (OSR_IS_GERMAN ? 'Spracherkennungsmodell wird heruntergeladen… ' : 'Downloading speech recognition model… ') + Math.round(fraction) + '%';
          }).then(function(transcript) {
            var transcriptBox = document.getElementById('osr-transcript');
            if (!scoringActive || !transcriptBox) return;
            transcriptBox.value = transcript;
            asrMatchEvidence = window.OSRTranscriptionScoring.matchVerbatimUnitEvidence(transcript, OSR_VERBATIM_UNITS);
            var matches = asrMatchEvidence.map(function(evidence) { return evidence.matched; });
            Array.prototype.forEach.call(document.querySelectorAll('.osr-vb'), function(box) {
              var index = Number(box.getAttribute('data-index'));
              box.checked = !!matches[index];
              if (asrMatchEvidence[index] && asrMatchEvidence[index].matched) {
                box.parentNode.title = 'ASR evidence: ' + asrMatchEvidence[index].excerpt;
              }
            });
            updateTotals();
            asrOutcome.succeeded = true;
            asrStatus.textContent = OSR_IS_GERMAN ? 'Automatisch transkribiert. Prüfen Sie vor dem Speichern das Transkript und jedes Kontrollkästchen.' : 'Transcribed automatically — review the transcript and every checkbox before saving.';
          }).catch(function(error) {
            if (!scoringActive) return;
            asrStatus.innerHTML = '<span class="osr-error">' + (OSR_IS_GERMAN ? 'Automatische Transkription nicht verfügbar (' : 'Automatic transcription unavailable (')
              + osrEscape(error && error.message ? error.message : (OSR_IS_GERMAN ? 'unbekannter Fehler' : 'unknown error'))
              + (OSR_IS_GERMAN ? '). Bewerten Sie die Aufnahme oben manuell.' : '). Score manually from the audio above.') + '</span>';
          });
        } else if (audioBlob) {
          asrStatus.textContent = '';
        } else {
          asrStatus.textContent = '';
        }

        document.getElementById('osr-save-score').addEventListener('click', function() {
          scoringActive = false;
          var vb = Array.prototype.map.call(document.querySelectorAll('.osr-vb'), function(box) { return box.checked; });
          var pp = Array.prototype.map.call(document.querySelectorAll('.osr-pp'), function(box) { return box.checked; });
          var transcript = document.getElementById('osr-transcript').value.trim();
          var intrusions = document.getElementById('osr-intrusions').value.trim();
          var trial = window.BatteryData.trials.slice().reverse().find(function(row) {
            return row.task_name === 'original_story_recall' && row.phase === 'free_recall' && row.condition === condition;
          });
          if (trial) {
            trial.verbatim_unit_scores = JSON.stringify(vb);
            trial.paraphrase_unit_scores = JSON.stringify(pp);
            trial.verbatim_total = vb.filter(Boolean).length;
            trial.paraphrase_total = pp.filter(Boolean).length;
            trial.transcript = transcript || null;
            trial.transcript_source = asrOutcome.succeeded ? 'automatic_asr_examiner_reviewed' : 'examiner_manual';
            trial.asr_attempted = asrOutcome.attempted;
            trial.asr_model = asrOutcome.model;
            trial.asr_match_evidence = asrMatchEvidence.length ? JSON.stringify(asrMatchEvidence) : null;
            trial.intrusions_and_notes = intrusions || null;
            trial.review_status = 'examiner_verified';
            trial.scored_at = getTimestamp();
            checkpointBatterySession();
          }
          done();
        });
        document.getElementById('osr-defer-score').addEventListener('click', function() {
          scoringActive = false;
          done({ review_status: 'deferred', condition: condition });
        });
      }
    };
  }

  function osrFinalizeTrial() {
    return {
      type: jsPsychCallFunction,
      func: function() {
        var rows = window.BatteryData.trials.filter(function(row) {
          return row.task_name === 'original_story_recall' && row.phase === 'free_recall';
        });
        var immediate = rows.find(function(row) { return row.condition === 'immediate'; }) || {};
        var delayed = rows.find(function(row) { return row.condition === 'delayed'; }) || {};
        var priorSummary = window.BatteryData.taskSummaries.original_story_recall || {};
        var delay = window.OSRState.immediateEndMs && window.OSRState.delayedStartMs
          ? window.OSRState.delayedStartMs - window.OSRState.immediateEndMs
          : (delayed.delay_duration_ms != null ? delayed.delay_duration_ms : priorSummary.osr_delay_duration_ms ?? null);
        if (delayed) {
          delayed.delay_duration_ms = delay;
          delayed.delay_out_of_window = delay == null || delay < OSR_MIN_DELAY_MS || delay > OSR_MAX_DELAY_MS;
        }
        window.BatteryData.setTaskSummary('original_story_recall', {
          osr_immediate_verbatim: immediate.verbatim_total == null ? null : immediate.verbatim_total,
          osr_delayed_verbatim: delayed.verbatim_total == null ? null : delayed.verbatim_total,
          osr_immediate_paraphrase: immediate.paraphrase_total == null ? null : immediate.paraphrase_total,
          osr_delayed_paraphrase: delayed.paraphrase_total == null ? null : delayed.paraphrase_total,
          osr_delay_duration_ms: delay,
          osr_delay_out_of_window: delay == null || delay < OSR_MIN_DELAY_MS || delay > OSR_MAX_DELAY_MS,
          osr_story_audio_standardized: window.OSRState.storyAudioStandardized,
          osr_task_version: OSR_VERSION,
          osr_dictionary_version: OSR_DICTIONARY_VERSION,
          osr_story_form: OSR_STORY_FORM,
          osr_audio_set_version: OSR_IS_GERMAN ? 'osr-audio-de-thorsten-2.0-frozen-rereview-required' : 'osr-audio-en-kokoro-1.0-pilot'
        });
      }
    };
  }

  function buildOSRImmediateTimeline() {
    return [osrInstructionTrial(), osrMicrophoneCheckTrial(), osrPlayStoryTrial(), osrRecordTrial('immediate')];
  }

  function buildOSRDelayedTimeline() {
    return [
      osrDelayGateTrial(),
      osrRecordTrial('delayed'),
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: '<div class="osr-card"><span class="osr-kicker">' + (OSR_IS_GERMAN ? 'ETI-Kern' : 'ETI Core') + '</span>'
          + '<h2>' + (OSR_IS_GERMAN ? 'Antworten zur Geschichte wurden gespeichert' : 'Story responses captured') + '</h2><p>'
          + (OSR_IS_GERMAN ? 'Die sofortige und die verzögerte Aufnahme wurden lokal gespeichert.' : 'Immediate and delayed recordings have been saved locally.') + '</p>'
          + '<p class="osr-fineprint">' + (OSR_IS_GERMAN ? 'Die Transkription und Prüfung erfolgen nach Abschluss der Testsitzung.' : 'Transcription and examiner verification will occur after participant testing.') + '</p></div>',
        choices: [OSR_IS_GERMAN ? 'Testbatterie fortsetzen' : 'Continue battery'],
        data: { task_name: 'original_story_recall', phase: 'participant_end', task_version: OSR_VERSION }
      }
    ];
  }

  function buildOSRReviewTimeline() {
    return [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: '<div class="osr-card"><span class="osr-kicker">' + (OSR_IS_GERMAN ? 'Auswertung durch die Prüfperson' : 'Examiner review') + '</span>'
          + '<h2>' + (OSR_IS_GERMAN ? 'Geschichtenwiedergabe auswerten' : 'Story Recall scoring') + '</h2><p>' + (OSR_IS_GERMAN ? 'Lokales Whisper schlägt Transkripte und wörtliche Übereinstimmungen vor. Prüfen Sie jeden Vorschlag und bewerten Sie sinngemäße Einheiten manuell.' : 'Local Whisper will suggest transcripts and verbatim matches. Review every suggestion and score paraphrases manually.') + '</p></div>',
        choices: [OSR_IS_GERMAN ? 'Geschichtenwiedergabe prüfen' : 'Begin story review'],
        data: { task_name: 'original_story_recall', phase: 'review_intro', task_version: OSR_VERSION }
      },
      osrScoringTrial('immediate'),
      osrScoringTrial('delayed'),
      osrFinalizeTrial()
    ];
  }

  window.buildOSRImmediateTimeline = buildOSRImmediateTimeline;
  window.buildOSRDelayedTimeline = buildOSRDelayedTimeline;
  window.buildOSRReviewTimeline = buildOSRReviewTimeline;
})();
