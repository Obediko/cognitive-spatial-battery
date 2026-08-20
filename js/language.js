/* Session language, form metadata and locale-aware text helpers. */
'use strict';

window.BatteryLanguage = (function() {
  var STORAGE_KEY = 'csb-language';
  var SUPPORTED = ['en', 'de'];
  var code = sessionStorage.getItem(STORAGE_KEY) || 'en';
  if (SUPPORTED.indexOf(code) === -1) code = 'en';

  var STRINGS = {
    en: {
      battery_title: 'Baseline Cognitive & Spatial Battery',
      choose_language: 'Choose the language for this assessment',
      language_locked: 'The selected language is recorded for the entire session and cannot be changed after testing starts.',
      english: 'English', german: 'Deutsch', continue: 'Continue',
      begin_setup: 'Begin setup', participant_id: 'Participant ID', confirm_id: 'Confirm ID',
      before_start: 'Before we start', fullscreen: 'Fullscreen mode',
      task_menu: 'Task menu', full_battery: 'Run full pilot battery',
      core_only: 'Run ETI-core measures only', trail_only: 'Run Trail comparators only',
      spatial_only: 'Run additional spatial measures only',
      break_title: 'Take a short break if needed', next_task: 'Next task',
      participant_complete: 'Participant session complete', thank_you: 'Thank you',
      scoring_separate: 'Scoring will be completed separately and will not interrupt this session.',
      german_warning: ''
    },
    de: {
      battery_title: 'Kognitive und räumliche Testbatterie',
      choose_language: 'Wählen Sie die Sprache dieser Untersuchung',
      language_locked: 'Die gewählte Sprache wird für die gesamte Sitzung gespeichert und kann nach Testbeginn nicht geändert werden.',
      english: 'English', german: 'Deutsch', continue: 'Weiter',
      begin_setup: 'Einrichtung beginnen', participant_id: 'Teilnehmenden-ID', confirm_id: 'ID bestätigen',
      before_start: 'Vor dem Beginn', fullscreen: 'Vollbildmodus',
      task_menu: 'Testauswahl', full_battery: 'Vollständige Pilotbatterie starten',
      core_only: 'Nur ETI-Kernmaße starten', trail_only: 'Nur Trail-Vergleichsaufgaben starten',
      spatial_only: 'Nur zusätzliche räumliche Aufgaben starten',
      break_title: 'Machen Sie bei Bedarf eine kurze Pause', next_task: 'Nächste Aufgabe',
      participant_complete: 'Testsitzung abgeschlossen', thank_you: 'Vielen Dank',
      scoring_separate: 'Die Auswertung erfolgt getrennt und unterbricht diese Sitzung nicht.',
      german_warning: 'Deutsche Parallelform: Pilotversion. Sprachliche und psychometrische Gleichwertigkeit mit der englischen Form ist noch nicht nachgewiesen.'
    }
  };

  var FORMS = {
    en: {
      session: 'csb-en-1.0', story: 'osr44-library-wallet-a-en-1.0',
      animal: 'asf60-en-1.0', naming: 'ovn32-en-1.0', instructions: 'csb-instructions-en-1.0'
    },
    de: {
      session: 'csb-de-0.1-pilot', story: 'osr44-library-wallet-a-de-0.1-pilot',
      animal: 'asf60-de-0.1-pilot', naming: 'ovn32-de-0.1-pilot', instructions: 'csb-instructions-de-0.1-pilot'
    }
  };

  function valid(value) { return SUPPORTED.indexOf(value) !== -1; }
  function set(value) {
    if (!valid(value)) throw new Error('Unsupported battery language');
    code = value;
    sessionStorage.setItem(STORAGE_KEY, value);
    document.documentElement.lang = value;
    return value;
  }
  function get() { return valid(code) ? code : 'en'; }
  function locale() { return get() === 'de' ? 'de-DE' : 'en-US'; }
  function text(key) { return (STRINGS[get()] && STRINGS[get()][key]) || STRINGS.en[key] || key; }
  function normalise(value, requestedLanguage) {
    var localeCode = requestedLanguage === 'de' ? 'de-DE' : (requestedLanguage === 'en' ? 'en-US' : locale());
    return String(value || '').normalize('NFKC').toLocaleLowerCase(localeCode)
      .replace(/[\u2019']/g, '').replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function metadata() {
    var form = FORMS[get()];
    return {
      administration_language: get(), language_locale: locale(),
      language_form_version: form.session, instruction_version: form.instructions,
      story_form_version: form.story, animal_form_version: form.animal,
      naming_form_version: form.naming,
      language_equivalence_status: get() === 'de' ? 'pilot_unvalidated' : 'reference_form'
    };
  }

  document.documentElement.lang = get();
  return {
    set: set, get: get, locale: locale, text: text, normalise: normalise,
    metadata: metadata, whisperLanguage: get,
    germanReady: function() { return true; },
    germanValidated: function() { return false; }
  };
})();
