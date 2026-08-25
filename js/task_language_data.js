/* Provisional language-specific lexical support. Examiner verification remains required. */
'use strict';

window.BatteryLexicons = (function() {
  var en = {
    dog:'dog',dogs:'dog',cat:'cat',cats:'cat',lion:'lion',lions:'lion',tiger:'tiger',tigers:'tiger',
    elephant:'elephant',elephants:'elephant',giraffe:'giraffe',giraffes:'giraffe',zebra:'zebra',zebras:'zebra',
    horse:'horse',horses:'horse',cow:'cow',cows:'cow',bull:'bull',bulls:'bull',calf:'calf',calves:'calf',
    goat:'goat',goats:'goat',sheep:'sheep',pig:'pig',pigs:'pig',donkey:'donkey',donkeys:'donkey',
    rabbit:'rabbit',rabbits:'rabbit',hare:'hare',hares:'hare',mouse:'mouse',mice:'mouse',rat:'rat',rats:'rat',
    squirrel:'squirrel',squirrels:'squirrel',monkey:'monkey',monkeys:'monkey',ape:'ape',apes:'ape',
    gorilla:'gorilla',gorillas:'gorilla',chimpanzee:'chimpanzee',chimpanzees:'chimpanzee',
    bear:'bear',bears:'bear',wolf:'wolf',wolves:'wolf',fox:'fox',foxes:'fox',deer:'deer',moose:'moose',
    camel:'camel',camels:'camel',hippo:'hippopotamus',hippos:'hippopotamus',hippopotamus:'hippopotamus',
    rhino:'rhinoceros',rhinos:'rhinoceros',rhinoceros:'rhinoceros',kangaroo:'kangaroo',kangaroos:'kangaroo',
    koala:'koala',koalas:'koala',panda:'panda',pandas:'panda',leopard:'leopard',leopards:'leopard',
    cheetah:'cheetah',cheetahs:'cheetah',hyena:'hyena',hyenas:'hyena',otter:'otter',otters:'otter',
    seal:'seal',seals:'seal',whale:'whale',whales:'whale',dolphin:'dolphin',dolphins:'dolphin',
    shark:'shark',sharks:'shark',fish:'fish',eel:'eel',eels:'eel',octopus:'octopus',octopuses:'octopus',
    crab:'crab',crabs:'crab',lobster:'lobster',lobsters:'lobster',turtle:'turtle',turtles:'turtle',
    tortoise:'tortoise',tortoises:'tortoise',crocodile:'crocodile',crocodiles:'crocodile',
    alligator:'alligator',alligators:'alligator',snake:'snake',snakes:'snake',lizard:'lizard',lizards:'lizard',
    frog:'frog',frogs:'frog',toad:'toad',toads:'toad',bird:'bird',birds:'bird',eagle:'eagle',eagles:'eagle',
    hawk:'hawk',hawks:'hawk',owl:'owl',owls:'owl',parrot:'parrot',parrots:'parrot',pigeon:'pigeon',
    pigeons:'pigeon',duck:'duck',ducks:'duck',goose:'goose',geese:'goose',chicken:'chicken',
    chickens:'chicken',rooster:'rooster',roosters:'rooster',turkey:'turkey',turkeys:'turkey',
    penguin:'penguin',penguins:'penguin',ostrich:'ostrich',ostriches:'ostrich',peacock:'peacock',
    peacocks:'peacock',swan:'swan',swans:'swan',flamingo:'flamingo',flamingos:'flamingo',
    ant:'ant',ants:'ant',bee:'bee',bees:'bee',wasp:'wasp',wasps:'wasp',fly:'fly',flies:'fly',
    mosquito:'mosquito',mosquitoes:'mosquito',butterfly:'butterfly',butterflies:'butterfly',
    spider:'spider',spiders:'spider',worm:'worm',worms:'worm',snail:'snail',snails:'snail'
  };
  var de = {
    hund:'Hund',hunde:'Hund',katze:'Katze',katzen:'Katze',löwe:'Löwe',löwen:'Löwe',tiger:'Tiger',
    elefant:'Elefant',elefanten:'Elefant',giraffe:'Giraffe',giraffen:'Giraffe',zebra:'Zebra',zebras:'Zebra',
    pferd:'Pferd',pferde:'Pferd',kuh:'Kuh',kühe:'Kuh',stier:'Stier',kalb:'Kalb',kälber:'Kalb',
    ziege:'Ziege',ziegen:'Ziege',schaf:'Schaf',schafe:'Schaf',schwein:'Schwein',schweine:'Schwein',
    esel:'Esel',kaninchen:'Kaninchen',hase:'Hase',hasen:'Hase',maus:'Maus',mäuse:'Maus',ratte:'Ratte',
    ratten:'Ratte',eichhörnchen:'Eichhörnchen',affe:'Affe',affen:'Affe',gorilla:'Gorilla',
    schimpanse:'Schimpanse',schimpansen:'Schimpanse',bär:'Bär',bären:'Bär',wolf:'Wolf',wölfe:'Wolf',
    fuchs:'Fuchs',füchse:'Fuchs',hirsch:'Hirsch',elch:'Elch',kamel:'Kamel',kamele:'Kamel',
    nilpferd:'Nilpferd',nashorn:'Nashorn',känguru:'Känguru',koala:'Koala',panda:'Panda',
    leopard:'Leopard',gepard:'Gepard',hyäne:'Hyäne',otter:'Otter',robbe:'Robbe',wal:'Wal',wale:'Wal',
    delfin:'Delfin',delfine:'Delfin',hai:'Hai',haie:'Hai',fisch:'Fisch',fische:'Fisch',aal:'Aal',
    krake:'Krake',oktopus:'Krake',krabbe:'Krabbe',hummer:'Hummer',schildkröte:'Schildkröte',
    krokodil:'Krokodil',alligator:'Alligator',schlange:'Schlange',schlangen:'Schlange',
    eidechse:'Eidechse',frosch:'Frosch',frösche:'Frosch',kröte:'Kröte',vogel:'Vogel',vögel:'Vogel',
    adler:'Adler',falke:'Falke',eule:'Eule',papagei:'Papagei',taube:'Taube',tauben:'Taube',
    ente:'Ente',enten:'Ente',gans:'Gans',gänse:'Gans',huhn:'Huhn',hühner:'Huhn',hahn:'Hahn',
    truthahn:'Truthahn',pinguin:'Pinguin',strauß:'Strauß',pfau:'Pfau',schwan:'Schwan',flamingo:'Flamingo',
    ameise:'Ameise',biene:'Biene',wespe:'Wespe',fliege:'Fliege',mücke:'Mücke',schmetterling:'Schmetterling',
    spinne:'Spinne',wurm:'Wurm',schnecke:'Schnecke'
  };
  var fillers = new Set(['and','the','a','an','um','uh','und','der','die','das','äh','ähm']);
  function normalise(value, language) {
    if (window.BatteryLanguage) return window.BatteryLanguage.normalise(value);
    return String(value || '').toLowerCase().trim();
  }
  function classify(value, seen, language) {
    language = language || (window.BatteryLanguage ? window.BatteryLanguage.get() : 'en');
    var key = normalise(value, language);
    var dictionary = language === 'de' ? de : en;
    var canonical = dictionary[key] || null;
    if (canonical) {
      var duplicateKey = normalise(canonical, language);
      return { canonical: canonical, decision: seen && seen.has(duplicateKey) ? 'repetition' : 'valid', confidence: 'dictionary' };
    }
    if (fillers.has(key)) return { canonical: key, decision: 'rule_violation', confidence: 'filler' };
    return { canonical: key, decision: 'uncertain', confidence: 'unknown' };
  }
  /* target, accepted alternatives, semantic cue, phonemic cue.  Cues must be
     language-specific: translating only the accepted answer changes the task. */
  var namingDe = {
    cup:['Tasse',['Becher'],'ein kleines Gefäß zum Trinken','Ta'], chair:['Stuhl',[],'ein Möbelstück zum Sitzen','Stu'],
    key:['Schlüssel',[],'ein Gegenstand zum Öffnen eines Schlosses','Schlü'], bicycle:['Fahrrad',['Rad'],'ein zweirädriges Fahrzeug mit Pedalen','Fahr'],
    spoon:['Löffel',[],'ein Essgerät mit einer kleinen Mulde am Ende','Lö'], umbrella:['Regenschirm',['Schirm'],'ein Gegenstand, den man bei Regen über den Kopf hält','Regen'],
    ladder:['Leiter',[],'ein Gerät mit Sprossen zum Hinaufsteigen','Lei'], kettle:['Wasserkocher',['Teekessel'],'ein Gefäß zum Erhitzen oder Ausgießen von Wasser','Wasser'],
    scissors:['Schere',[],'ein Schneidewerkzeug mit zwei Klingen','Sche'], anchor:['Anker',[],'ein schwerer Gegenstand, der ein Boot an seinem Platz hält','An'],
    binoculars:['Fernglas',[],'ein optisches Gerät, mit dem man entfernte Dinge mit beiden Augen sieht','Fern'],
    stethoscope:['Stethoskop',[],'ein Instrument zum Abhören von Geräuschen im Körper','Steth'], compass:['Kompass',[],'ein Instrument, das die Richtung anzeigt','Kom'],
    hammock:['Hängematte',[],'ein hängendes Bett aus Stoff oder Seilen','Hänge'], whisk:['Schneebesen',[],'ein Küchengerät zum Schlagen oder Vermischen von Zutaten','Schnee'],
    accordion:['Akkordeon',[],'ein Musikinstrument, das zwischen den Händen zusammengedrückt wird','Ak'],
    abacus:['Abakus',['Rechenrahmen'],'ein Rahmen mit verschiebbaren Kugeln zum Rechnen','Aba'], sundial:['Sonnenuhr',[],'ein Zeitmesser, der Sonne und Schatten nutzt','Sonnen'],
    sextant:['Sextant',[],'ein Navigationsinstrument zum Messen von Winkeln zu Himmelskörpern','Sex'], hourglass:['Sanduhr',[],'ein Zeitmesser, bei dem Sand zwischen zwei Glaskammern fällt','Sand'],
    pulley:['Flaschenzug',['Rolle'],'eine Rolle mit Seil zum Heben oder Bewegen einer Last','Flaschen'], thimble:['Fingerhut',[],'eine kleine Schutzkappe für den Finger beim Nähen','Finger'],
    calipers:['Messschieber',['Schieblehre'],'ein Instrument mit zwei Schenkeln zum Messen von Dicke oder Abstand','Mess'],
    metronome:['Metronom',[],'ein Gerät, das Musikern einen regelmäßigen Takt vorgibt','Metro'], periscope:['Periskop',[],'ein optisches Instrument, mit dem man aus einer verdeckten oder tieferen Position sieht','Peri'],
    bellows:['Blasebalg',[],'ein Gerät, das zusammengedrückt wird, um Luft in ein Feuer zu blasen','Blase'],
    astrolabe:['Astrolabium',['Astrolab'],'ein altes Instrument zum Auffinden von Sternen und für Navigationsberechnungen','Astro'],
    yoke:['Joch',[],'ein hölzernes Querholz, das Arbeitstiere miteinander verbindet','Jo'], plumb_bob:['Senklot',['Lot'],'ein spitzes Gewicht an einer Schnur zum Bestimmen einer senkrechten Linie','Senk'],
    spigot:['Zapfhahn',['Hahn'],'eine Armatur, die den Flüssigkeitsfluss aus einem Rohr oder Behälter regelt','Zapf'], trellis:['Spalier',[],'ein Gerüst, das Kletterpflanzen stützt','Spa'],
    weather_vane:['Wetterfahne',['Windfahne'],'ein drehbares Instrument, das die Windrichtung anzeigt','Wetter']
  };
  function namingFor(art, fallbackTarget, fallbackAlternatives) {
    if ((window.BatteryLanguage ? window.BatteryLanguage.get() : 'en') !== 'de' || !namingDe[art]) {
      return { target: fallbackTarget, alternatives: fallbackAlternatives || [], semanticCue: null, phonemicCue: null };
    }
    return { target: namingDe[art][0], alternatives: namingDe[art][1], semanticCue: namingDe[art][2], phonemicCue: namingDe[art][3] };
  }
  return {
    animals: { classify: classify, en: en, de: de },
    naming: { forItem: namingFor, de: namingDe }
  };
})();
