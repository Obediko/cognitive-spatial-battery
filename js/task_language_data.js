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
  var namingDe = {
    cup:['Tasse',['Becher']], chair:['Stuhl',[]], key:['Schlüssel',[]], bicycle:['Fahrrad',['Rad']],
    spoon:['Löffel',[]], umbrella:['Regenschirm',['Schirm']], ladder:['Leiter',[]],
    kettle:['Wasserkocher',['Teekessel']], scissors:['Schere',[]], anchor:['Anker',[]],
    binoculars:['Fernglas',[]], stethoscope:['Stethoskop',[]], compass:['Kompass',[]],
    hammock:['Hängematte',[]], whisk:['Schneebesen',[]], accordion:['Akkordeon',[]],
    abacus:['Abakus',['Rechenrahmen']], sundial:['Sonnenuhr',[]], sextant:['Sextant',[]],
    hourglass:['Sanduhr',[]], pulley:['Flaschenzug',['Rolle']], thimble:['Fingerhut',[]],
    calipers:['Messschieber',['Schieblehre']], metronome:['Metronom',[]], periscope:['Periskop',[]],
    bellows:['Blasebalg',[]], astrolabe:['Astrolabium',['Astrolab']], yoke:['Joch',[]],
    plumb_bob:['Senklot',['Lot']], spigot:['Zapfhahn',['Hahn']], trellis:['Spalier',[]],
    weather_vane:['Wetterfahne',['Windfahne']]
  };
  function namingFor(art, fallbackTarget, fallbackAlternatives) {
    if ((window.BatteryLanguage ? window.BatteryLanguage.get() : 'en') !== 'de' || !namingDe[art]) {
      return { target: fallbackTarget, alternatives: fallbackAlternatives || [] };
    }
    return { target: namingDe[art][0], alternatives: namingDe[art][1] };
  }
  return {
    animals: { classify: classify, en: en, de: de },
    naming: { forItem: namingFor, de: namingDe }
  };
})();
