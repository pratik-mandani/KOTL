const fs = require('fs');
const path = require('path');

// 1. Update frontend/app/page.jsx
const pagePath = path.join(__dirname, '../../frontend/app/page.jsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Update Tab 3 button
pageContent = pageContent.replace(
  '<span>🌟</span><span>Learn, Play & Habits</span>',
  '<span>🌟</span><span>Good & Bad Habits</span>'
);

// Update Section 3 header
pageContent = pageContent.replace(
  '<h2 className="font-fredoka text-xl sm:text-2xl font-bold">Learn, Play & Habit Academy</h2>',
  '<h2 className="font-fredoka text-xl sm:text-2xl font-bold">Good & Bad Habits Academy (360° Life Growth)</h2>'
);

// Add Habits Spotlight Card in Section 1
const targetSpotlight = '{/* BENTO GRID: 4 CORE SKILLS CARDS (LEFT) & PASSIONS / EVIDENCE (RIGHT) */}';
const spotlightCard = `{/* 🌟 HABITS SPOTLIGHT CARD (GOOD HABITS VS BAD HABITS) */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-2 border-emerald-300 rounded-[32px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-xs shrink-0">
                  🌟
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-fredoka text-base sm:text-lg font-bold text-emerald-950">🌟 Good Habits & Habits Needing Guidance (Bad Habits)</h3>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">5 Good Habits • 4 In Training</span>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed space-y-0.5">
                    <div>✨ <strong>Good Habits Established:</strong> Brushing teeth twice daily, tidying toys & desk, drinking fresh water, polite turn-taking with Dadi, asking science questions.</div>
                    <div>⚠️ <strong>Habits Needing Improvement (Bad Habits):</strong> Reluctance to eat green veggies (spinach/broccoli), evening mobile screen time, 9 PM bedtime delays, sleeping in dark room.</div>
                  </div>
                </div>
              </div>
              <button onClick={() => setCurrentSection('growth')} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-fredoka font-bold text-xs whitespace-nowrap shadow-sm flex items-center gap-1.5 self-start md:self-auto shrink-0 transition-transform active:scale-95">
                <span>👉</span><span>Open Full Habits Academy</span>
              </button>
            </div>

            ` + targetSpotlight;

pageContent = pageContent.replace(targetSpotlight, spotlightCard);

// Update mobile bottom nav
pageContent = pageContent.replace(
  '<span className="text-[10px] font-fredoka">Habits</span>',
  '<span className="text-[10px] font-fredoka">Good/Bad</span>'
);

fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('Successfully updated frontend/app/page.jsx with Habits Spotlight and Tab naming.');
