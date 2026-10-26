const fs = require('fs');

let page = fs.readFileSync('frontend/app/page.jsx', 'utf8');

const replacements = [
  ['પાર્થનું બાળપણ પ્રગતિ પત્રક • Playful Growth & Habits Hub', "Parth's Kindergarten Growth & Learning Report • Playful Habits & Progress Hub"],
  ['DISTINCTION (૯૧%)', 'DISTINCTION (91%)'],
  ['ઉત્કૃષ્ટ સર્વાંગી વિકાસ 🌟', 'Outstanding All-Round Growth 🌟'],
  ['વાર્તામાંથી નવા શબ્દો શીખે છે 📚', 'Learns New English Words Daily 📚'],
  ['અવકાશ અને તારાઓમાં ઉત્સુકતા 🚀', 'High Curiosity in Space & Stars 🚀'],
  ['બ્રશ, શાકભાજી, રમકડાં & ઊંઘ ⭐', 'Brushing, Veggies, Toys & Bedtime ⭐'],
  ['પાર્થનું બાળ-મૈત્રીપૂર્ણ પ્રગતિ પત્રક (Kindergarten Marksheet)', "Parth's Kindergarten Marksheet & Companion Assessment"],
  ['Subject / Activity (વિષય)', 'Subject & Learning Area'],
  ['Companion Remark (અભિપ્રાય)', 'Companion & Teacher Remark'],
  ['અંગ્રેજી બોલચાલ & શબ્દભંડોળ', 'Spoken Fluency & Vocabulary'],
  ['ઉત્કૃષ્ટ (Fluent)', 'Fluent (Grade A)'],
  ['બોલવામાં સ્પષ્ટતા છે, વાર્તામાંથી નવા શબ્દો તરત યાદ રાખી લે છે.', 'Expresses thoughts clearly and naturally. Retains new words easily from story adventures.'],
  ['સામાન્ય જ્ઞાન & સ્પેસ', 'Astronomy, Space & Nature'],
  ['અસાધારણ (Curious)', 'Exceptional (Grade A+)'],
  ['તારાઓ અને રોકેટ કેવી રીતે ઉડે છે તે જાણવાની ઊંડી જિજ્ઞાસા ધરાવે છે.', "Deeply curious about stars, rocket launches, and nature. Asks bright 'why' questions."],
  ['સારી ટેવો & સંસ્કાર', 'Good Daily Habits & Manners'],
  ['સરસ શિસ્ત (Polite)', 'Polite & Helpful'],
  ['સવાર-સાંજ બ્રશ કરે છે, રમ્યા પછી રમકડાં યોગ્ય જગ્યાએ મૂકે છે.', 'Brushes teeth morning and night. Tidies up school bag and toys cheerfully when reminded.'],
  ['ચિત્રકામ & વાર્તા રસ', 'Visual Art & Moral Stories'],
  ['સર્જનાત્મક (Creative)', 'Creative & Imaginative'],
  ['રંગો અને ચિત્રો ખૂબ ગમે છે, સૂતી વખતે બોધકથાઓ રસપૂર્વક સાંભળે છે.', 'Loves drawing spacecraft and colors. Listens attentively to bedtime moral tales.'],
  ['હસમુખો પ્રેમાળ સ્વભાવ', 'Kindness & Positive Energy'],
  ['ખૂબ પ્રેમાળ (Kind)', 'Warm & Cheerful'],
  ['સૌની સાથે આદરથી વાત કરે છે અને હંમેશા પોઝિટિવ ઉત્સાહથી રહે છે.', 'Speaks respectfully with parents and companions. Radiates upbeat, loving energy.'],
  ['પાલકો માટે દૈનિક આદતોનું ચેકલિસ્ટ (Habits Tracker)', 'Daily Habit Checklist & Routine Tracker'],
  ['🪥 સવાર-સાંજ દાંત બ્રશ કરવા', '🪥 Brush Teeth Twice Daily'],
  ['Morning & Night Brushing', 'Morning & Night Brushing Routine'],
  ['🥛 સ્વચ્છ પાણી અને દૂધ પીવું', '🥛 Clean Water & Fresh Milk'],
  ['Clean Water & Fresh Milk', 'Healthy Hydration Throughout Day'],
  ['🥦 લીલા શાકભાજી & ફળો ખાવા', '🥗 Healthy Green Veggies & Fruits'],
  ['Spinach, Carrots & Fruits', 'Spinach, Carrots & Fresh Apples'],
  ['🎒 સ્કૂલ બેગ અને રમકડાં વ્યવસ્થિત મૂકવા', '🧸 Tidy Up Toys & School Bag'],
  ['Tidying Up Toys & Bag', 'Placing Toys In Neat Storage Box'],
  ['📖 ૨૦ મિનિટ પુસ્તક વાંચન / વાર્તા', '📖 20 Mins English Story Time'],
  ['20 Mins Story Reading', 'Story Adventure With KOTL Buddy'],
  ['😴 રાત્રે ૯:૦૦ વાગ્યે ઊંઘવું (મોબાઈલ વગર)', '🌙 Sleep on Time by 9:00 PM'],
  ['9 PM Bedtime (No Screen)', 'Peaceful Sleep Without Mobile Screen'],
  ['પાર્થ અને KOTL વચ્ચે થયેલી તાજેતરની વાતો', 'Recent Classroom & Spoken Dialogue'],
  ['માતા-પિતા માટે સરળ સૂચનો (Parent Action Tips)', 'Parent Action Tips & Everyday Home Activities'],
  ['શિક્ષક / KOTL નો અભિપ્રાય (Companion Remark)', 'Teacher & KOTL Companion Observation'],
  ['પાર્થની મનપસંદ પ્રવૃત્તિઓ (What Parth Loves)', "Parth's Favorite Passions & Topics"],
  ['ધ્યાન રાખવા જેવી બાબતો (Sensitivities & Care)', 'Care Areas & Positive Guidance'],
  ['પ્રગતિના લક્ષ્યો (Milestones Achieved)', 'Learning Milestones Achieved'],
  ['માતા-પિતાના લક્ષ્યાંકો (Parent Directives & Habits)', 'Parent Directives & Habit Missions'],
  ['તમે KOTL ને જે પણ આદતો શીખવવા કહેશો, KOTL વાતો કરતી વખતે પાર્થને રમત-રમતમાં તે શીખવશે.', 'Configure any habit or manner you want KOTL to gently encourage during daily conversations.'],
  ['Goal Title (લક્ષ્ય)', 'Goal Title'],
  ['KOTL Companion Directive (KOTL ને સૂચના)', 'KOTL Companion Directive'],
  ["Child's Name (નામ)", "Child's Name"],
  ['Age (ઉંમર)', 'Age'],
  ['Gender (જાતિ)', 'Gender'],
  ['👦 Boy (દીકરો / બેટા)', '👦 Boy'],
  ['👧 Girl (દીકરી / બેટી)', '👧 Girl'],
  ['Bedtime Routine (ઊંઘવાનો સમય)', 'Bedtime Routine (IST)'],
  ['Mandatory Parental Guardrails (માતા-પિતાની પરવાનગી)', 'Mandatory Parental Safety Guardrails'],
  ['Listening to voice (English / Gujarati / Hindi)...', 'Listening to voice (English Audio Mic)...']
];

for (const [target, rep] of replacements) {
  page = page.split(target).join(rep);
}

fs.writeFileSync('frontend/app/page.jsx', page, 'utf8');
console.log('Cleaned frontend/app/page.jsx');
