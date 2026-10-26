const fs = require('fs');

let mem = fs.readFileSync('backend/services/child-memory.js', 'utf8');

// Replace all Aarav with Parth
mem = mem.split('Aarav').join('Parth');

// Replace prehistoric/dinosaur references
mem = mem.split('prehistoric sciences and space').join('space exploration, stars and creative art');
mem = mem.split('Prehistoric Science & Dinosaurs').join('Space Exploration & Stars');
mem = mem.split('Displays intense excitement when discussing T-Rex fossils, armor plates of Stegosaurus, and ancient habitats.').join('Displays intense excitement when talking about stars, the moon, and rocket missions into space.');
mem = mem.split('dinosaur strength').join('superhero stamina');
mem = mem.split("Connect green veggies on the plate to Parth's favorite dinosaur's stamina. Ask him: 'Which plant gave the Brachiosaurus enough power to grow as tall as a tree?'").join("Serve colorful fruit and crunchy veggies as superhero power-ups. Praise Parth when he eats his healthy snacks.");
mem = mem.split('Dinosaur Anatomy & Prehistoric Science').join('Space & Night Sky Exploration');
mem = mem.split('KOTL, how big was the T-Rex and why did it have such tiny arms?').join('KOTL, how do stars shine at night, and can we fly a rocket to the moon?');
mem = mem.split('T-Rex was 12 meters long with banana-sized teeth! Its arms were small so its neck and massive jaws could have all the muscle power to hunt!').join('Stars are giant glowing suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!');
mem = mem.split('Parth linked physical anatomy to animal survival behavior. This high-level inquiry directly accounts for his 92% Curiosity Index.').join('Parth shows natural wonder and scientific curiosity about astronomy and how the universe works.');
mem = mem.split('T-Rex immense stamina').join('champions immense stamina');
mem = mem.split('astronomy, prehistoric life, and nature').join('astronomy, creative art, and nature');

fs.writeFileSync('backend/services/child-memory.js', mem, 'utf8');
console.log('Successfully cleaned backend/services/child-memory.js');
