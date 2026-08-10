/* ============================================================
   original_visual_naming.js
   Original Visual Naming (OVN-32) - experimental pilot
   Original SVG stimuli; not the MINT and not norm-equivalent.
   ============================================================ */
'use strict';

(function() {
  var OVN_VERSION = '0.2.0-pilot';
  var OVN_STIMULUS_SET = 'ovn32-en-0.1';
  var RESPONSE_LIMIT_MS = 20000;
  window.OVN_DEFER_EXAMINER_REVIEW = window.OVN_DEFER_EXAMINER_REVIEW !== false;
  window.OVNState = window.OVNState || { itemAudio: [], itemAudioUrls: [], deferredResponses: [] };

  var drawings = {
    cup: '<path d="M70 58h80v62c0 25-18 40-40 40s-40-15-40-40z"/><path d="M150 76h18c30 0 30 44 0 44h-18"/><path d="M58 166h106"/>',
    chair: '<path d="M78 30v92h78V30"/><path d="M78 72h78"/><path d="M88 122l-10 48M146 122l10 48"/>',
    key: '<circle cx="72" cy="92" r="28"/><circle cx="72" cy="92" r="10"/><path d="M100 92h88M154 92v24M174 92v16"/>',
    bicycle: '<circle cx="58" cy="126" r="38"/><circle cx="182" cy="126" r="38"/><path d="M58 126l42-62 34 62H58l45-39h45l34 39M100 64h-18M134 126l16-72h24"/>',
    spoon: '<ellipse cx="82" cy="58" rx="30" ry="42"/><path d="M82 100v72M72 172h20"/>',
    umbrella: '<path d="M38 92q82-110 164 0q-20-18-41 0q-20-18-40 0q-20-18-41 0q-20-18-42 0z"/><path d="M120 32v112q0 30 25 30q20 0 20-20"/>',
    ladder: '<path d="M74 22L54 174M166 22l20 152"/><path d="M70 50h100M66 78h108M62 106h116M58 134h124M55 162h130"/>',
    kettle: '<path d="M72 75h92v74H72z"/><path d="M90 75q0-45 28-45q28 0 28 45"/><path d="M164 88l42 18-42 18M104 58h28"/><path d="M72 92q-34 0-34 30q0 28 34 28"/>',
    scissors: '<circle cx="66" cy="135" r="28"/><circle cx="126" cy="135" r="28"/><path d="M84 113L190 38M108 113L56 36M56 36l54 68M190 38l-72 70"/>',
    anchor: '<circle cx="120" cy="36" r="16"/><path d="M120 52v112M82 76h76M48 112q8 54 72 54q64 0 72-54M48 112l-8 28M192 112l8 28"/>',
    binoculars: '<path d="M62 52h42l8 92H44zM136 52h42l18 92h-68z"/><circle cx="78" cy="144" r="34"/><circle cx="162" cy="144" r="34"/><path d="M104 72h32M108 102h24"/>',
    stethoscope: '<path d="M70 28v48q0 46 50 46q50 0 50-46V28"/><path d="M58 28h24M158 28h24"/><path d="M120 122v18q0 22 22 22"/><circle cx="154" cy="162" r="16"/>',
    compass: '<circle cx="120" cy="100" r="72"/><circle cx="120" cy="100" r="8"/><path d="M120 34l16 58-16 74-16-58z"/><path d="M120 18v14M120 168v14M38 100H24M216 100h-14"/>',
    hammock: '<path d="M48 30v142M192 30v142"/><path d="M48 56q72 112 144 0M48 56q72 72 144 0"/><path d="M36 172h24M180 172h24"/>',
    whisk: '<path d="M120 110v68M104 178h32"/><path d="M120 110q-52-40-34-80q34 14 34 80M120 110q52-40 34-80q-34 14-34 80M120 110q-18-62 0-90q18 28 0 90"/>',
    accordion: '<path d="M45 52h44v104H45zM151 52h44v104h-44z"/><path d="M89 60l62 8-62 12 62 12-62 12 62 12-62 12 62 12"/><circle cx="60" cy="72" r="4"/><circle cx="74" cy="72" r="4"/><path d="M166 66h14M166 82h14M166 98h14M166 114h14M166 130h14"/>',
    abacus: '<rect x="38" y="28" width="164" height="144"/><path d="M56 52h128M56 76h128M56 100h128M56 124h128M56 148h128"/><circle cx="82" cy="52" r="8"/><circle cx="98" cy="52" r="8"/><circle cx="150" cy="76" r="8"/><circle cx="166" cy="76" r="8"/><circle cx="72" cy="100" r="8"/><circle cx="112" cy="124" r="8"/><circle cx="128" cy="124" r="8"/><circle cx="144" cy="124" r="8"/><circle cx="176" cy="148" r="8"/>',
    sundial: '<ellipse cx="120" cy="142" rx="86" ry="28"/><path d="M120 52v90l50-4z"/><path d="M58 136l-14-10M78 126l-8-16M98 120l-2-18M142 120l2-18M162 126l8-16M182 136l14-10"/>',
    sextant: '<path d="M54 154A92 92 0 0 1 186 54"/><path d="M54 154h132V54M120 104l66-50M120 104l-66 50"/><circle cx="120" cy="104" r="10"/><path d="M70 142l8 10M88 130l8 12M106 120l6 14M136 104l8 12M156 84l10 8"/>',
    hourglass: '<path d="M66 24h108M66 176h108M78 24q0 52 42 76q-42 24-42 76M162 24q0 52-42 76q42 24 42 76"/><path d="M92 48h56M94 152h52M120 100v34"/>',
    pulley: '<circle cx="120" cy="62" r="36"/><circle cx="120" cy="62" r="12"/><path d="M120 26V10M84 62H60v94M156 62h24v56"/><rect x="42" y="156" width="36" height="28"/><path d="M180 118l-12 22h24z"/>',
    thimble: '<path d="M78 166h84l-10-118q-32-28-64 0z"/><path d="M82 142h76"/><circle cx="104" cy="70" r="3"/><circle cx="120" cy="62" r="3"/><circle cx="136" cy="72" r="3"/><circle cx="100" cy="92" r="3"/><circle cx="120" cy="88" r="3"/><circle cx="140" cy="96" r="3"/><circle cx="108" cy="116" r="3"/><circle cx="132" cy="118" r="3"/>',
    calipers: '<path d="M64 32v132q0 20 20 20M176 32v132q0 20-20 20"/><path d="M64 32h32v24H64M176 32h-32v24h32"/><path d="M82 76h76M98 68v16M114 68v16M130 68v16M146 68v16"/>',
    metronome: '<path d="M74 174h92L150 34H90z"/><path d="M120 144L142 50"/><rect x="132" y="72" width="22" height="12"/><path d="M100 152h40M106 124h28M112 96h16"/>',
    periscope: '<path d="M82 28h76v34h-36v104h36v34H82v-34h36V62H82z"/><path d="M90 36l26 18M150 174l-26 18"/>',
    bellows: '<path d="M48 68l48 22v52l-48 22zM192 68l-48 22v52l48 22z"/><path d="M96 90l16-18 16 18 16-18v70l-16 18-16-18-16 18z"/><path d="M192 106h34v20h-34"/>',
    astrolabe: '<circle cx="120" cy="104" r="72"/><circle cx="120" cy="104" r="54"/><circle cx="120" cy="104" r="8"/><path d="M120 32v144M48 104h144M70 54l100 100M170 54L70 154"/><path d="M104 26q16-30 32 0"/>',
    yoke: '<path d="M42 78q78-42 156 0"/><path d="M52 74v34q0 22 20 22q20 0 20-22V86M148 86v22q0 22 20 22q20 0 20-22V74"/><path d="M120 58v92"/>',
    plumb_bob: '<path d="M120 20v88"/><path d="M104 108l16-32 16 32 20 48-36 28-36-28z"/><circle cx="120" cy="20" r="6"/>',
    spigot: '<path d="M62 84h92v52H62z"/><path d="M154 96h36v24h-36M190 108v44q0 18-18 18"/><path d="M96 84V58M76 58h40M90 42h12v16"/>',
    trellis: '<rect x="48" y="24" width="144" height="152"/><path d="M48 24l144 152M84 24l108 114M120 24l72 76M156 24l36 38M192 24L48 176M156 24L48 138M120 24L48 100M84 24L48 62"/>',
    weather_vane: '<path d="M120 42v136M74 80h92"/><path d="M166 80l-24-14v28zM74 80l18-10v20z"/><path d="M120 42l18 26h-36z"/><path d="M92 178h56"/><text x="112" y="28" font-size="20">N</text>'
  };

  var items = [
    ['cup','cup',['mug'],'a small container used for drinking','c',1],
    ['chair','chair',['seat'],'furniture used for sitting','ch',1],
    ['key','key',[],'an object used to open a lock','k',1],
    ['bicycle','bicycle',['bike'],'a two-wheeled vehicle moved by pedals','b',1],
    ['spoon','spoon',[],'an eating utensil with a small bowl at the end','sp',1],
    ['umbrella','umbrella',['parasol'],'an object held above the head for rain','um',1],
    ['ladder','ladder',[],'equipment with rungs used for climbing','l',1],
    ['kettle','kettle',['teakettle'],'a container used to heat or pour water','k',1],
    ['scissors','scissors',['shears'],'a cutting tool with two blades','sc',1],
    ['anchor','anchor',[],'a heavy object used to keep a boat in place','an',2],
    ['binoculars','binoculars',[],'an optical device used to see distant things with both eyes','bi',2],
    ['stethoscope','stethoscope',[],'an instrument used to listen to sounds inside the body','st',2],
    ['compass','compass',[],'an instrument that shows direction','com',2],
    ['hammock','hammock',[],'a hanging bed made from fabric or rope','ham',2],
    ['whisk','whisk',['beater'],'a kitchen tool used to beat or mix ingredients','wh',2],
    ['accordion','accordion',[],'a musical instrument squeezed between the hands','ac',2],
    ['abacus','abacus',['counting frame'],'a frame with sliding beads used for counting','ab',2],
    ['sundial','sundial',[],'an instrument that tells time using the sun and a shadow','sun',2],
    ['sextant','sextant',[],'a navigation instrument used to measure angles to celestial objects','sex',3],
    ['hourglass','hourglass',['sand timer'],'a timer in which sand falls between two glass chambers','hour',2],
    ['pulley','pulley',[],'a wheel with a rope used to lift or move a load','pull',2],
    ['thimble','thimble',[],'a small protective cap worn on a finger while sewing','thim',2],
    ['calipers','calipers',['calliper'],'an instrument with two legs used to measure thickness or distance','cal',3],
    ['metronome','metronome',[],'a device that marks a regular beat for musicians','met',3],
    ['periscope','periscope',[],'an optical instrument used to see from a hidden or lower position','per',3],
    ['bellows','bellows',[],'a device squeezed to blow air into a fire','bel',3],
    ['astrolabe','astrolabe',[],'an old instrument used to locate stars and solve navigation problems','as',3],
    ['yoke','yoke',[],'a wooden crosspiece used to join working animals','y',3],
    ['plumb_bob','plumb bob',['plummet'],'a pointed weight on a string used to find a vertical line','pl',3],
    ['spigot','spigot',['tap','faucet'],'a fitting that controls liquid flowing from a pipe or container','spi',3],
    ['trellis','trellis',[],'a framework that supports climbing plants','trel',3],
    ['weather_vane','weather vane',['wind vane'],'an instrument that turns to show wind direction','wea',3]
  ].map(function(row, index) {
    return {
      id: 'ovn_' + String(index + 1).padStart(2, '0'),
      art: row[0],
      target: row[1],
      alternatives: row[2],
      semanticCue: row[3],
      phonemicCue: row[4],
      provisionalDifficulty: row[5]
    };
  });

  function ovnSvg(item) {
    return '<svg class="ovn-stimulus" viewBox="0 0 240 200" role="img" aria-label="Black line drawing of an object">'
      + '<g class="ovn-line">' + drawings[item.art] + '</g></svg>';
  }

  function ovnStimulusMarkup(item) {
    var path = 'assets/images/visual-naming/' + item.art + '.png';
    return '<object class="ovn-stimulus-object" data="' + path + '" type="image/png" '
      + 'aria-label="Object naming stimulus: ' + item.id + '">' + ovnSvg(item) + '</object>';
  }

  function ovnNormalise(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function ovnTranscriptMatches(item, transcript) {
    var observed = ovnNormalise(transcript);
    if (!observed) return false;
    return [item.target].concat(item.alternatives || []).some(function(answer) {
      return ovnNormalise(answer) === observed;
    });
  }

  function scoreSummary(responses, incomplete) {
    responses = Array.isArray(responses) ? responses : [];
    var uncued = responses.filter(function(r) { return r.outcome === 'uncued_correct'; }).length;
    var semanticCorrect = responses.filter(function(r) { return r.outcome === 'semantic_correct'; }).length;
    var semanticGiven = responses.filter(function(r) { return r.semantic_cue_given; }).length;
    var phonemicCorrect = responses.filter(function(r) { return r.outcome === 'phonemic_correct'; }).length;
    var phonemicGiven = responses.filter(function(r) { return r.phonemic_cue_given; }).length;
    return {
      totalWithSemantic: incomplete ? null : uncued + semanticCorrect,
      rawTotalWithSemantic: uncued + semanticCorrect,
      totalUncued: incomplete ? null : uncued,
      semanticGiven: semanticGiven,
      semanticCorrect: semanticCorrect,
      phonemicGiven: phonemicGiven,
      phonemicCorrect: phonemicCorrect,
      itemsAdministered: responses.length,
      status: incomplete ? 'incomplete' : 'examiner_verified'
    };
  }

  function nextFailureRun(previous, outcome) {
    return outcome === 'uncued_correct' || outcome === 'semantic_correct' ? 0 : previous + 1;
  }

  window.OVNScoring = {
    scoreSummary: scoreSummary,
    nextFailureRun: nextFailureRun,
    itemCount: items.length
  };

  function buildOriginalVisualNamingLiveTimeline() {
    var instructions = {
      type: jsPsychHtmlButtonResponse,
      stimulus: '<div class="osr-card"><span class="osr-kicker">ETI Core · Visual naming</span>'
        + '<h2>Object Naming</h2>'
        + '<p>You will see one black line drawing at a time. Say the name of each object aloud.</p>'
        + '<div class="info-box"><p>Try your best even when you are uncertain.</p>'
        + '<p>The examiner may provide a clue after an incorrect response.</p></div>'
        + '<p class="osr-fineprint">These are original experimental drawings, not MINT stimuli.</p></div>',
      choices: ['Begin'],
      data: { task_name: 'original_visual_naming', phase: 'instructions', task_version: OVN_VERSION }
    };

    var administration = {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = document.getElementById('jspsych-content') ||
          document.querySelector('.jspsych-content') ||
          document.getElementById('jspsych-target');
        var responses = [];
        var index = 0;
        var failureRun = 0;
        var incomplete = false;
        var stoppedByRule = false;
        var itemStartedAt = 0;
        var timer = null;

        function finishTask() {
          if (timer) clearInterval(timer);
          var summary = scoreSummary(responses, incomplete);
          window.BatteryData.addTrials(responses);
          window.BatteryData.setTaskSummary('original_visual_naming', {
            ovn_total_with_semantic: summary.totalWithSemantic,
            ovn_total_with_semantic_raw: summary.rawTotalWithSemantic,
            ovn_total_uncued: summary.totalUncued,
            ovn_semantic_cues_given: summary.semanticGiven,
            ovn_semantic_cues_correct: summary.semanticCorrect,
            ovn_phonemic_cues_given: summary.phonemicGiven,
            ovn_phonemic_cues_correct: summary.phonemicCorrect,
            ovn_items_administered: summary.itemsAdministered,
            ovn_stopped_after_six_failures: stoppedByRule,
            ovn_review_status: summary.status,
            ovn_task_version: OVN_VERSION,
            ovn_stimulus_set: OVN_STIMULUS_SET
          });
          done();
        }

        function saveOutcome(item, outcome, semanticGiven, phonemicGiven) {
          if (timer) clearInterval(timer);
          var responseBox = document.getElementById('ovn-response');
          var noteBox = document.getElementById('ovn-note');
          var elapsed = Date.now() - itemStartedAt;
          responses.push({
            task_name: 'original_visual_naming',
            phase: 'item',
            task_version: OVN_VERSION,
            stimulus_set: OVN_STIMULUS_SET,
            item_id: item.id,
            item_order: index + 1,
            provisional_difficulty: item.provisionalDifficulty,
            response_verbatim: responseBox ? responseBox.value.trim() || null : null,
            outcome: outcome,
            semantic_cue_given: !!semanticGiven,
            phonemic_cue_given: !!phonemicGiven,
            response_time_ms: elapsed,
            examiner_note: noteBox ? noteBox.value.trim() || null : null
          });
          failureRun = nextFailureRun(failureRun, outcome);
          index += 1;
          if (failureRun >= 6) {
            stoppedByRule = true;
            finishTask();
          } else if (index >= items.length) {
            finishTask();
          } else {
            showItem();
          }
        }

        function showPhonemic(item, semanticGiven) {
          document.getElementById('ovn-cue-panel').innerHTML =
            '<div class="ovn-cue"><span>Phonemic cue</span><strong>Say only: “' + item.phonemicCue + '…”</strong></div>'
            + '<div class="ovn-actions"><button class="battery-btn primary" id="ovn-pc-correct">Correct after phonemic cue</button>'
            + '<button class="battery-btn" id="ovn-pc-wrong">Still incorrect</button></div>';
          document.getElementById('ovn-pc-correct').onclick = function() {
            saveOutcome(item, 'phonemic_correct', semanticGiven, true);
          };
          document.getElementById('ovn-pc-wrong').onclick = function() {
            saveOutcome(item, 'incorrect', semanticGiven, true);
          };
        }

        function showSemantic(item) {
          document.getElementById('ovn-cue-panel').innerHTML =
            '<div class="ovn-cue"><span>Semantic cue</span><strong>' + item.semanticCue + '</strong></div>'
            + '<div class="ovn-actions"><button class="battery-btn primary" id="ovn-sc-correct">Correct after semantic cue</button>'
            + '<button class="battery-btn" id="ovn-sc-wrong">Incorrect — give phonemic cue</button></div>';
          document.getElementById('ovn-sc-correct').onclick = function() {
            saveOutcome(item, 'semantic_correct', true, false);
          };
          document.getElementById('ovn-sc-wrong').onclick = function() {
            showPhonemic(item, true);
          };
        }

        function showItem() {
          var item = items[index];
          itemStartedAt = Date.now();
          display.innerHTML = '<div class="ovn-shell"><div class="ovn-progress">Item ' + (index + 1) + ' of ' + items.length
            + '<span>Consecutive total-score failures: ' + failureRun + '/6</span></div>'
            + '<div class="ovn-layout"><div class="ovn-picture-card">' + ovnStimulusMarkup(item)
            + '<div class="ovn-clock"><strong id="ovn-time">20</strong><span>seconds uncued</span></div></div>'
            + '<div class="ovn-examiner"><span class="osr-kicker">Examiner controls</span>'
            + '<label>Verbatim response<input id="ovn-response" autocomplete="off"></label>'
            + '<label>Optional note<input id="ovn-note" autocomplete="off"></label>'
            + '<div class="ovn-actions"><button class="battery-btn primary" id="ovn-correct">Correct without semantic cue</button>'
            + '<button class="battery-btn" id="ovn-misperceived">Incorrect / object not recognised</button>'
            + '<button class="battery-btn" id="ovn-recognised">Recognised but name not retrieved</button></div>'
            + '<div id="ovn-cue-panel"></div>'
            + '<button class="battery-btn ovn-stop" id="ovn-stop">End task and mark incomplete</button></div></div></div>';

          var timeEl = document.getElementById('ovn-time');
          timer = setInterval(function() {
            var remaining = Math.max(0, RESPONSE_LIMIT_MS - (Date.now() - itemStartedAt));
            timeEl.textContent = Math.ceil(remaining / 1000);
            if (remaining <= 0) {
              clearInterval(timer);
              timeEl.parentNode.classList.add('expired');
              timeEl.parentNode.querySelector('span').textContent = 'uncued limit reached';
            }
          }, 100);

          document.getElementById('ovn-correct').onclick = function() {
            saveOutcome(item, 'uncued_correct', false, false);
          };
          document.getElementById('ovn-misperceived').onclick = function() {
            showSemantic(item);
          };
          document.getElementById('ovn-recognised').onclick = function() {
            showPhonemic(item, false);
          };
          document.getElementById('ovn-stop').onclick = function() {
            if (window.confirm('End this naming task and mark its score incomplete?')) {
              incomplete = true;
              finishTask();
            }
          };
        }

        showItem();
      }
    };

    var end = {
      type: jsPsychHtmlButtonResponse,
      stimulus: function() {
        var s = window.BatteryData.taskSummaries.original_visual_naming || {};
        var score = s.ovn_total_with_semantic;
        return '<div class="osr-card"><span class="osr-kicker">ETI Core</span><h2>Object Naming complete</h2>'
          + '<p class="osr-score-callout">' + (score == null ? 'Score incomplete' : score + ' / ' + (s.ovn_items_administered || 32)) + '</p>'
          + '<p>Uncued correct: ' + (s.ovn_total_uncued == null ? 'N/A' : s.ovn_total_uncued)
          + ' · Semantic-cue correct: ' + (s.ovn_semantic_cues_correct || 0)
          + ' · Phonemic-cue correct: ' + (s.ovn_phonemic_cues_correct || 0) + '</p>'
          + '<p class="osr-fineprint">Experimental pilot score; not a MINT score.</p></div>';
      },
      choices: ['Continue battery'],
      data: { task_name: 'original_visual_naming', phase: 'end', task_version: OVN_VERSION }
    };

    return [instructions, administration, end];
  }

  function ovnDeferredAdministrationTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = document.getElementById('jspsych-content') ||
          document.querySelector('.jspsych-content') || document.getElementById('jspsych-target');
        var stream = null;
        var recorder = null;
        var chunks = [];
        var index = 0;
        var itemStartedAt = 0;
        var timer = null;
        var finished = false;
        var captured = [];

        window.OVNState.itemAudio = [];
        window.OVNState.itemAudioUrls = [];
        window.OVNState.deferredResponses = [];

        function finishAll() {
          if (finished) return;
          finished = true;
          if (timer) clearInterval(timer);
          if (stream) stream.getTracks().forEach(function(track) { track.stop(); });
          window.BatteryData.addTrials(captured);
          done();
        }

        function saveClipAndAdvance(blob) {
          var item = items[index];
          var duration = Date.now() - itemStartedAt;
          window.OVNState.itemAudio[index] = blob || null;
          window.OVNState.itemAudioUrls[index] = blob ? URL.createObjectURL(blob) : null;
          captured.push({
            task_name: 'original_visual_naming',
            phase: 'deferred_uncued_item',
            task_version: OVN_VERSION,
            stimulus_set: OVN_STIMULUS_SET,
            protocol_mode: 'deferred_uncued',
            item_id: item.id,
            item_order: index + 1,
            provisional_difficulty: item.provisionalDifficulty,
            response_time_ms: duration,
            response_audio_mime_type: blob ? blob.type : null,
            review_status: 'pending'
          });
          index += 1;
          if (index >= items.length) finishAll();
          else showItem();
        }

        function endItem() {
          if (timer) clearInterval(timer);
          var next = document.getElementById('ovn-deferred-next');
          if (next) next.disabled = true;
          if (recorder && recorder.state !== 'inactive') {
            recorder.onstop = function() {
              saveClipAndAdvance(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
            };
            recorder.stop();
          } else {
            saveClipAndAdvance(null);
          }
        }

        function showItem() {
          var item = items[index];
          chunks = [];
          itemStartedAt = Date.now();
          display.innerHTML = '<div class="ovn-shell ovn-participant"><div class="ovn-progress">Item ' + (index + 1)
            + ' of ' + items.length + '<span>Speak one answer clearly</span></div>'
            + '<div class="ovn-picture-card">' + ovnStimulusMarkup(item)
            + '<div class="ovn-clock"><strong id="ovn-time">20</strong><span>seconds</span></div></div>'
            + '<button class="battery-btn primary" id="ovn-deferred-next">Answer given — next item</button>'
            + '<p class="osr-fineprint">Your response is recorded locally for review after the battery.</p></div>';
          if (stream && typeof MediaRecorder !== 'undefined') {
            try {
              recorder = new MediaRecorder(stream);
              recorder.ondataavailable = function(event) { if (event.data && event.data.size) chunks.push(event.data); };
              recorder.start();
            } catch (error) {
              recorder = null;
            }
          }
          document.getElementById('ovn-deferred-next').onclick = endItem;
          timer = setInterval(function() {
            var remaining = Math.max(0, RESPONSE_LIMIT_MS - (Date.now() - itemStartedAt));
            var time = document.getElementById('ovn-time');
            if (time) time.textContent = Math.ceil(remaining / 1000);
            if (remaining <= 0) endItem();
          }, 100);
        }

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined') {
          navigator.mediaDevices.getUserMedia({ audio: true }).then(function(activeStream) {
            stream = activeStream;
            showItem();
          }).catch(function() {
            showItem();
          });
        } else {
          showItem();
        }
      }
    };
  }

  function ovnDeferredReviewTrial() {
    return {
      type: jsPsychCallFunction,
      async: true,
      func: function(done) {
        var display = document.getElementById('jspsych-content') ||
          document.querySelector('.jspsych-content') || document.getElementById('jspsych-target');
        var index = 0;
        var reviewed = [];
        var reviewToken = 0;

        function finishReview() {
          var uncertain = reviewed.some(function(row) { return row.outcome === 'uncertain'; });
          var correct = reviewed.filter(function(row) { return row.outcome === 'uncued_correct'; }).length;
          window.OVNState.deferredResponses = reviewed;
          window.BatteryData.addTrials(reviewed);
          window.BatteryData.setTaskSummary('original_visual_naming', {
            ovn_total_with_semantic: null,
            ovn_total_uncued: uncertain ? null : correct,
            ovn_total_uncued_raw: correct,
            ovn_items_administered: reviewed.length,
            ovn_review_status: uncertain ? 'provisional' : 'examiner_verified',
            ovn_protocol_mode: 'deferred_uncued',
            ovn_task_version: OVN_VERSION,
            ovn_stimulus_set: OVN_STIMULUS_SET
          });
          done();
        }

        function save(outcome) {
          var item = items[index];
          var transcriptBox = document.getElementById('ovn-review-transcript');
          reviewed.push({
            task_name: 'original_visual_naming',
            phase: 'deferred_examiner_review',
            task_version: OVN_VERSION,
            stimulus_set: OVN_STIMULUS_SET,
            protocol_mode: 'deferred_uncued',
            item_id: item.id,
            item_order: index + 1,
            transcript: transcriptBox ? transcriptBox.value.trim() || null : null,
            outcome: outcome,
            semantic_cue_given: false,
            phonemic_cue_given: false,
            asr_model: window.OSRTranscription ? window.OSRTranscription.modelId : null,
            review_status: outcome === 'uncertain' ? 'provisional' : 'examiner_verified'
          });
          index += 1;
          if (index >= items.length) finishReview();
          else showReview();
        }

        function showReview() {
          var token = ++reviewToken;
          var item = items[index];
          var audioUrl = window.OVNState.itemAudioUrls[index];
          var blob = window.OVNState.itemAudio[index];
          display.innerHTML = '<div class="ovn-shell"><div class="ovn-progress">Review item ' + (index + 1)
            + ' of ' + items.length + '<span>Target: ' + item.target + '</span></div>'
            + '<div class="ovn-layout"><div class="ovn-picture-card">' + ovnStimulusMarkup(item) + '</div>'
            + '<div class="ovn-examiner"><span class="osr-kicker">Examiner review</span>'
            + (audioUrl ? '<audio controls autoplay class="osr-audio-review" src="' + audioUrl + '"></audio>' : '<p class="osr-error">No item audio captured.</p>')
            + '<label>Whisper transcript<input id="ovn-review-transcript" autocomplete="off"></label>'
            + '<p id="ovn-review-asr" class="osr-status" aria-live="polite"></p>'
            + '<div class="ovn-actions"><button class="battery-btn primary" id="ovn-review-correct">Correct</button>'
            + '<button class="battery-btn" id="ovn-review-incorrect">Incorrect</button>'
            + '<button class="battery-btn" id="ovn-review-uncertain">Uncertain</button></div></div></div></div>';
          document.getElementById('ovn-review-correct').onclick = function() { save('uncued_correct'); };
          document.getElementById('ovn-review-incorrect').onclick = function() { save('incorrect'); };
          document.getElementById('ovn-review-uncertain').onclick = function() { save('uncertain'); };

          var status = document.getElementById('ovn-review-asr');
          if (blob && window.OSRTranscription && typeof window.OSRTranscription.transcribeBlob === 'function') {
            status.textContent = 'Transcribing locally with Whisper…';
            window.OSRTranscription.transcribeBlob(blob, function(progress) {
              if (token === reviewToken && status) status.textContent = 'Loading Whisper… ' + Math.round(progress) + '%';
            }).then(function(transcript) {
              if (token !== reviewToken || !document.getElementById('ovn-review-transcript')) return;
              document.getElementById('ovn-review-transcript').value = transcript;
              var suggested = ovnTranscriptMatches(item, transcript);
              status.textContent = suggested
                ? 'Whisper exact-name suggestion: correct. Examiner must verify the recording.'
                : 'No exact accepted-name match. Check the recording before deciding.';
            }).catch(function(error) {
              if (token === reviewToken) status.textContent = 'Whisper unavailable: ' + (error && error.message ? error.message : 'unknown error');
            });
          }
        }

        showReview();
      }
    };
  }

  function buildOriginalVisualNamingTimeline() {
    if (!window.OVN_DEFER_EXAMINER_REVIEW) return buildOriginalVisualNamingLiveTimeline();
    return [
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: '<div class="osr-card"><span class="osr-kicker">Visual naming</span>'
          + '<h2>Name each object</h2><p>Say one name clearly for each object, then continue to the next item.</p>'
          + '<p class="osr-fineprint">This deferred protocol measures uncued naming only; no semantic or phonemic cues are administered.</p></div>',
        choices: ['Begin'],
        data: { task_name: 'original_visual_naming', phase: 'instructions', protocol_mode: 'deferred_uncued', task_version: OVN_VERSION }
      },
      ovnDeferredAdministrationTrial(),
      {
        type: jsPsychHtmlButtonResponse,
        stimulus: '<div class="osr-card"><h2>Object Naming responses captured</h2>'
          + '<p>The recordings will be transcribed and checked after participant testing.</p></div>',
        choices: ['Continue battery'],
        data: { task_name: 'original_visual_naming', phase: 'participant_end', protocol_mode: 'deferred_uncued', task_version: OVN_VERSION }
      }
    ];
  }

  function buildOriginalVisualNamingReviewTimeline() {
    return window.OVN_DEFER_EXAMINER_REVIEW ? [ovnDeferredReviewTrial()] : [];
  }

  window.buildOriginalVisualNamingTimeline = buildOriginalVisualNamingTimeline;
  window.buildOriginalVisualNamingReviewTimeline = buildOriginalVisualNamingReviewTimeline;
})();
