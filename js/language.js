/* Session language and locale-aware text helpers. */
'use strict';

window.GERMAN_PILOT_ENABLED = window.GERMAN_PILOT_ENABLED === true;

window.BatteryLanguage = (function() {
  var code = sessionStorage.getItem('csb-language') || 'en';
  function valid(value) { return value === 'en' || value === 'de'; }
  function set(value) {
    if (!valid(value)) throw new Error('Unsupported battery language');
    if (value === 'de' && !window.GERMAN_PILOT_ENABLED) {
      throw new Error('German pilot materials are not yet released');
    }
    code = value;
    sessionStorage.setItem('csb-language', value);
    document.documentElement.lang = value;
    return value;
  }
  function get() { return valid(code) ? code : 'en'; }
  function locale() { return get() === 'de' ? 'de-DE' : 'en-US'; }
  function normalise(value) {
    return String(value || '').normalize('NFKC').toLocaleLowerCase(locale())
      .replace(/[’']/g, '').replace(/[^p{L}p{N}s-]/gu, ' ')
      .replace(/s+/g, ' ').trim();
  }
  document.documentElement.lang = get();
  return {
    set: set,
    get: get,
    locale: locale,
    normalise: normalise,
    whisperLanguage: function() { return get(); },
    germanReady: function() { return !!window.GERMAN_PILOT_ENABLED; }
  };
})();
