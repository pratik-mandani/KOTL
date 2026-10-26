const fs = require('fs');
let s = fs.readFileSync('backend/scratch/apply_exact_kindergarten_rules.js', 'utf8');

// Replace font-['Fredoka'] with font-fredoka
s = s.replace(/font-\['Fredoka'\]/g, 'font-fredoka');

fs.writeFileSync('backend/scratch/apply_exact_kindergarten_rules.js', s, 'utf8');
console.log('Successfully fixed font-fredoka in apply_exact_kindergarten_rules.js');
