const fs = require('fs');
const path = require('path');

const targetHtmlPath = path.join(__dirname, '..', 'public', 'index.html');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>KOTL • AI Child Pedagogical Companion & Parent Dashboard</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧒</text></svg>">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">

  <style>
    body {
      font-family: 'Quicksand', sans-serif;
      background-color: #FFFDF9;
      color: #1E293B;
      -webkit-tap-highlight-color: transparent;
    }
    .font-fredoka { font-family: 'Fredoka', cursive, sans-serif; }
    
    /* 3D Tactile Kindergarten Button Press Effect */
    .btn-3d-amber {
      background-color: #F59E0B;
      border-bottom: 4px solid #B45309;
      transition: all 0.1s ease;
    }
    .btn-3d-amber:active {
      border-bottom-width: 0px;
      transform: translateY(4px);
    }

    .btn-3d-sky {
      background-color: #0284C7;
      border-bottom: 4px solid #0369A1;
      transition: all 0.1s ease;
    }
    .btn-3d-sky:active {
      border-bottom-width: 0px;
      transform: translateY(4px);
    }

    .btn-3d-emerald {
      background-color: #10B981;
      border-bottom: 4px solid #047857;
      transition: all 0.1s ease;
    }
    .btn-3d-emerald:active {
      border-bottom-width: 0px;
      transform: translateY(4px);
    }

    .btn-3d-indigo {
      background-color: #6366F1;
      border-bottom: 4px solid #4338CA;
      transition: all 0.1s ease;
    }
    .btn-3d-indigo:active {
      border-bottom-width: 0px;
      transform: translateY(4px);
    }

    .btn-3d-purple {
      background-color: #8B5CF6;
      border-bottom: 4px solid #6D28D9;
      transition: all 0.1s ease;
    }
    .btn-3d-purple:active {
      border-bottom-width: 0px;
      transform: translateY(4px);
    }

    /* Soft Kindergarten Pill Navigation */
    .sec-tab-active {
      background-color: #0284C7 !important;
      color: #FFFFFF !important;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      border-color: #0284C7 !important;
    }

    /* Custom Scrollbars */
    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 9999px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 9999px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

    /* Recording Pulsing Ring */
    @keyframes pulse-ring {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 16px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .animate-recording-ring { animation: pulse-ring 1.8s infinite; }

    /* Print Formatting */
    @media print {
      body { background: #FFF !important; }
      header, .section-nav-bar, #mobileBottomNav, button:not(.printable-include), .non-printable { display: none !important; }
      .printable-area { display: block !important; width: 100% !important; margin: 0 !important; }
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; inset: 0;
      background-color: #CBD5E1; transition: .3s; border-radius: 24px;
    }
    .slider:before {
      position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
      background-color: white; transition: .3s; border-radius: 50%;
    }
    input:checked + .slider { background-color: #10B981; }
    input:checked + .slider:before { transform: translateX(20px); }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#FFFDF9] selection:bg-amber-200 selection:text-amber-900 pb-16 lg:pb-8">

  <!-- TOP BRANDING & STATUS HEADER -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/80 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
      
      <!-- Brand & Child Avatar Indicator -->
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-2xl shadow-xs">
            🧒
          </div>
          <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></span>
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h1 class="font-fredoka text-lg sm:text-xl font-bold tracking-tight text-slate-800">KOTL</h1>
            <span class="text-[10px] font-fredoka font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
              Kindergarten v2.2
            </span>
          </div>
          <p class="text-xs text-slate-500 font-medium">Parth's AI Companion & Pediatric Cockpit</p>
        </div>
      </div>

      <!-- Live ESP32 Hardware Status Pill & Quick Controls -->
      <div class="flex items-center gap-2 sm:gap-3">
        
        <!-- Live Hardware Pill (QA Required: whitespace-nowrap & deviceStatusPill) -->
        <div id="deviceStatusPill" class="bg-emerald-50 text-emerald-700 text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-bold border border-emerald-300 flex items-center gap-1.5 sm:gap-2 shadow-xs whitespace-nowrap">
          <span id="deviceStatusDot" class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span id="deviceStatusText">• ESP32 Live</span>
        </div>

        <!-- Groq Quota Pill Button -->
        <button onclick="openQuotaModal()" class="hidden sm:flex items-center gap-1 text-xs font-bold bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs">
          <span>⚡</span>
          <span>Groq: <strong id="groqUsageText">14,380 Left</strong></span>
        </button>

        <!-- Child Profile Modal Button (QA Required: openProfileModal()) -->
        <button onclick="openProfileModal()" class="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs" title="Child Profile & Safety Settings">
          <span>⚙️</span>
          <span class="hidden md:inline">Child Profile</span>
        </button>

      </div>
    </div>
  </header>

  <!-- 5 DEDICATED SUPER-HUB NAVIGATION TABS -->
  <div class="section-nav-bar relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-2">
    <div class="bg-amber-50/90 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto custom-scrollbar shadow-xs">
      
      <!-- Tab 1: School Report -->
      <button id="secBtn_report" onclick="switchSection('report')" class="sec-tab-active px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap">
        <span>📜</span>
        <span>School Report</span>
      </button>

      <!-- Tab 2: Mentor Quests -->
      <button id="secBtn_quests" onclick="switchSection('quests')" class="px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200 transition-all flex items-center gap-1.5 whitespace-nowrap">
        <span>🧭</span>
        <span>Mentor Quests</span>
      </button>

      <!-- Tab 3: Learn & Play -->
      <button id="secBtn_growth" onclick="switchSection('growth')" class="px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200 transition-all flex items-center gap-1.5 whitespace-nowrap">
        <span>🎨</span>
        <span>Learn & Play</span>
      </button>

      <!-- Tab 4: Health Passport -->
      <button id="secBtn_health" onclick="switchSection('health')" class="px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200 transition-all flex items-center gap-1.5 whitespace-nowrap">
        <span>🏥</span>
        <span>Health Passport</span>
      </button>

      <!-- Tab 5: Parent & Voice (with Day-Wise Chat History) -->
      <button id="secBtn_parent" onclick="switchSection('parent')" class="px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200 transition-all flex items-center gap-1.5 whitespace-nowrap">
        <span>🎙️</span>
        <span>Parent & Voice</span>
      </button>

    </div>
  </div>

  <!-- MAIN DYNAMIC CONTENT CONTAINER (BENTO GRID COCKPIT) -->
  <main class="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 pb-20">

    <!-- ============================================================ -->
    <!-- SECTION 1: SCHOOL REPORT & KINDERGARTEN MARKSHEET             -->
    <!-- ============================================================ -->
    <div id="section_report" class="space-y-5 printable-area">
      
      <!-- Top Child Hero Profile Card (Full Width) -->
      <div class="relative overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-[32px] p-6 text-white shadow-md border-3 border-amber-300">
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div class="flex items-center gap-4">
            <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-4xl shadow-inner">
              🧒
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h2 id="childHeroName" class="font-fredoka text-2xl sm:text-3xl font-bold tracking-wide">Parth</h2>
                <span class="bg-white/25 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/40">
                  Senior Kindergarten (KG-2)
                </span>
              </div>
              <p class="text-xs sm:text-sm text-amber-50 font-medium">
                <span id="childHeroAge">6 Years Old</span> • Boy • Daily Bedtime: <strong>09:00 PM</strong> • Academic Term 2026
              </p>
              <div class="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span class="bg-emerald-900/40 text-emerald-100 font-semibold px-2.5 py-0.5 rounded-lg border border-emerald-300/30">
                  ⭐ Star Pupil Award
                </span>
                <span class="bg-sky-900/40 text-sky-100 font-semibold px-2.5 py-0.5 rounded-lg border border-sky-300/30">
                  🚀 Space & Scientific Inquiry Champion
                </span>
              </div>
            </div>
          </div>

          <!-- Overall Star Grade Circular Progress Ring -->
          <div class="flex items-center gap-4 bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/30 self-start md:self-auto">
            <div class="relative w-16 h-16 flex items-center justify-center">
              <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path class="text-white/20 stroke-current" stroke-width="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="text-white stroke-current" stroke-dasharray="89, 100" stroke-width="3.5" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span class="absolute font-fredoka font-bold text-lg text-white">89%</span>
            </div>
            <div>
              <div class="text-[11px] font-bold uppercase tracking-wider text-amber-100">Overall Grade</div>
              <div class="font-fredoka text-xl font-bold text-white flex items-center gap-1">
                <span>Grade A+</span>
                <span class="text-xs font-normal opacity-90">(Advanced)</span>
              </div>
              <div class="text-[10px] text-amber-100">Pediatric Milestone: Exceeded</div>
            </div>
          </div>
        </div>
      </div>

      <!-- BENTO GRID (2 COLUMNS ON DESKTOP) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- Left Bento Column (7 Columns): Marksheet, Audio Briefing, Print -->
        <div class="lg:col-span-7 space-y-5">
          
          <!-- Kindergarten Progress Marksheet -->
          <div class="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-amber-100 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">📋</span>
                <h3 class="font-fredoka text-lg font-bold text-slate-800">Kindergarten Developmental Marksheet</h3>
              </div>
              <span class="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                Official Term Report
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b-2 border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                    <th class="py-2 px-3">Subject / Domain</th>
                    <th class="py-2 px-3">Key Observation</th>
                    <th class="py-2 px-3">Score</th>
                    <th class="py-2 px-3">Grade</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr class="hover:bg-amber-50/50">
                    <td class="py-2.5 px-3 font-bold flex items-center gap-1.5">
                      <span>🔤</span><span>English & Phonics</span>
                    </td>
                    <td class="py-2.5 px-3 text-slate-500">Learned 30+ multisyllabic terms ('orbit', 'stamina')</td>
                    <td class="py-2.5 px-3 font-bold text-sky-700">88/100</td>
                    <td class="py-2.5 px-3"><span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+ Excellent</span></td>
                  </tr>
                  <tr class="hover:bg-amber-50/50">
                    <td class="py-2.5 px-3 font-bold flex items-center gap-1.5">
                      <span>🔬</span><span>Curiosity & STEM</span>
                    </td>
                    <td class="py-2.5 px-3 text-slate-500">Asks profound 'why' questions about stars and gravity</td>
                    <td class="py-2.5 px-3 font-bold text-purple-700">94/100</td>
                    <td class="py-2.5 px-3"><span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+ Gifted</span></td>
                  </tr>
                  <tr class="hover:bg-amber-50/50">
                    <td class="py-2.5 px-3 font-bold flex items-center gap-1.5">
                      <span>❤️</span><span>Emotional & Empathy</span>
                    </td>
                    <td class="py-2.5 px-3 text-slate-500">Displays polite turn-taking, respectful to Dadi and parents</td>
                    <td class="py-2.5 px-3 font-bold text-rose-700">90/100</td>
                    <td class="py-2.5 px-3"><span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+ Superb</span></td>
                  </tr>
                  <tr class="hover:bg-amber-50/50">
                    <td class="py-2.5 px-3 font-bold flex items-center gap-1.5">
                      <span>🥦</span><span>Habits & Nutrition</span>
                    </td>
                    <td class="py-2.5 px-3 text-slate-500">Responding to superhero stamina greens & tidy desk</td>
                    <td class="py-2.5 px-3 font-bold text-amber-700">82/100</td>
                    <td class="py-2.5 px-3"><span class="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px]">B+ Growing</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 1-Minute Parent Audio Briefing Card -->
            <div class="mt-2 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🎙️</span>
                  <div>
                    <h4 class="font-fredoka text-xs sm:text-sm font-bold text-slate-800">1-Minute AI Pediatric Audio Briefing</h4>
                    <p class="text-[11px] text-slate-500">Listen to KOTL's executive voice summary of Parth's day</p>
                  </div>
                </div>
                <button onclick="playLocalVoice('Parth had an extraordinary learning day! His cognitive curiosity reached ninety-four percent, asking advanced questions regarding planetary orbits and space exploration. He also agreed to eat his superhero green vegetables and demonstrated polite conversational turn taking with family.')" class="btn-3d-sky px-3 py-1.5 text-white rounded-xl font-fredoka font-bold text-xs flex items-center gap-1 shadow-xs">
                  <span>▶ Play Briefing</span>
                </button>
              </div>
            </div>

            <!-- Print Official PDF Button -->
            <div class="flex items-center justify-end pt-2">
              <button onclick="window.print()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-fredoka font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all">
                <span>🖨️</span>
                <span>Print Official Report Card (PDF)</span>
              </button>
            </div>

          </div>

        </div>

        <!-- Right Bento Column (5 Columns): Skills, Passions, Guidance -->
        <div class="lg:col-span-5 space-y-5">
          
          <!-- Cognitive & Behavioral Skills Directory -->
          <div class="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center gap-2 border-b border-amber-100 pb-3">
              <span class="text-2xl">🧠</span>
              <h3 class="font-fredoka text-lg font-bold text-slate-800">Core Skill Analytics</h3>
            </div>

            <!-- Skill 1: Curiosity -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs font-bold">
                <span class="text-slate-700">Scientific Curiosity & Inquiry</span>
                <span class="text-purple-600 font-fredoka">94% (Exceptional)</span>
              </div>
              <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div class="bg-purple-500 h-full rounded-full" style="width: 94%"></div>
              </div>
            </div>

            <!-- Skill 2: Vocabulary -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs font-bold">
                <span class="text-slate-700">English Vocabulary & Expression</span>
                <span class="text-sky-600 font-fredoka">88% (Advanced)</span>
              </div>
              <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div class="bg-sky-500 h-full rounded-full" style="width: 88%"></div>
              </div>
            </div>

            <!-- Skill 3: Emotional Tone -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs font-bold">
                <span class="text-slate-700">Emotional Tone & Kindness</span>
                <span class="text-rose-600 font-fredoka">90% (Very High)</span>
              </div>
              <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div class="bg-rose-500 h-full rounded-full" style="width: 90%"></div>
              </div>
            </div>

            <!-- Skill 4: Habits & Listening -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs font-bold">
                <span class="text-slate-700">Daily Routine & Habit Building</span>
                <span class="text-emerald-600 font-fredoka">78% (Steady Growth)</span>
              </div>
              <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" style="width: 78%"></div>
              </div>
            </div>

            <!-- Passions & Sensitivities Quick Badges -->
            <div class="pt-2 border-t border-slate-100 space-y-2">
              <div class="text-[11px] font-bold text-slate-500 uppercase">Parth Loves:</div>
              <div class="flex flex-wrap gap-1.5 text-xs">
                <span class="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-0.5 rounded-lg font-semibold">🚀 Space & Stars</span>
                <span class="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-lg font-semibold">🎨 Creative Drawing</span>
                <span class="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-semibold">🏏 Cricket Games</span>
                <span class="bg-purple-50 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-lg font-semibold">🌙 Bedtime Tales</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- ============================================================ -->
    <!-- SECTION 2: MENTOR QUESTS & LEARNING CHALLENGES               -->
    <!-- ============================================================ -->
    <div id="section_quests" class="hidden space-y-5">
      
      <!-- Quest KPI & Assign Header Card -->
      <div class="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-[32px] p-6 text-white shadow-md border-3 border-amber-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-3xl shadow-inner">
            🧭
          </div>
          <div>
            <h2 class="font-fredoka text-xl sm:text-2xl font-bold">AI Socratic Mentor Quests</h2>
            <p class="text-xs sm:text-sm text-amber-100">KOTL guides Parth step-by-step through school tasks, life skills, and curiosity projects</p>
          </div>
        </div>

        <!-- + Assign New Quest Button -->
        <button onclick="openAssignQuestModal()" class="btn-3d-amber bg-white text-amber-900 border-amber-300 hover:bg-amber-50 px-5 py-2.5 rounded-2xl font-fredoka font-bold text-sm shadow-sm flex items-center justify-center gap-2 self-start md:self-auto">
          <span>➕</span>
          <span>Assign New Quest</span>
        </button>
      </div>

      <!-- BENTO GRID (7 Cols Quests List / 5 Cols Badges & Rewards) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- Left: Active & Available Quests Feed -->
        <div class="lg:col-span-7 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-fredoka text-base font-bold text-slate-800 flex items-center gap-1.5">
              <span>🎯</span><span>Active Quests in Progress</span>
            </h3>
            <span class="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              KOTL Mentoring Active
            </span>
          </div>

          <div id="questsContainer" class="space-y-4">
            <!-- Dynamic Quests Injected Here -->
          </div>
        </div>

        <!-- Right: Unlocked Badges & Quest Philosophy -->
        <div class="lg:col-span-5 space-y-5">
          
          <!-- Badges Hall of Fame -->
          <div class="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center gap-2 border-b border-amber-100 pb-3">
              <span class="text-2xl">🏆</span>
              <h3 class="font-fredoka text-lg font-bold text-slate-800">Parth's Badge Hall of Fame</h3>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                <span class="text-2xl">🌱</span>
                <div class="font-bold text-amber-900">Master Botanist</div>
                <div class="text-[10px] text-amber-700 font-semibold">Sprouted Plant Seed</div>
              </div>
              <div class="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-1">
                <span class="text-2xl">🚀</span>
                <div class="font-bold text-sky-900">Space Commander</div>
                <div class="text-[10px] text-sky-700 font-semibold">Desk Organizer</div>
              </div>
              <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-1">
                <span class="text-2xl">💖</span>
                <div class="font-bold text-rose-900">Kindness Champion</div>
                <div class="text-[10px] text-rose-700 font-semibold">Card for Dadi</div>
              </div>
              <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <span class="text-2xl">🥦</span>
                <div class="font-bold text-emerald-900">Superhero Stamina</div>
                <div class="text-[10px] text-emerald-700 font-semibold">Healthy Veggies</div>
              </div>
            </div>

            <!-- How Socratic Mentoring Works Notice -->
            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div class="font-bold text-slate-800 flex items-center gap-1">
                <span>💡</span><span>How KOTL Mentors Parth:</span>
              </div>
              <p class="text-[11px] leading-relaxed">
                KOTL never does the homework or project for the child! Instead, KOTL asks playful leading questions ("What do seeds need to wake up?") to stimulate critical thinking and independent problem-solving.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>

    <!-- ============================================================ -->
    <!-- SECTION 3: LEARN & PLAY (360° LIFE GROWTH)                   -->
    <!-- ============================================================ -->
    <div id="section_growth" class="hidden space-y-5">
      
      <!-- Growth Header -->
      <div class="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-[32px] p-6 text-white shadow-md border-3 border-emerald-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-3xl shadow-inner">
            🎨
          </div>
          <div>
            <h2 class="font-fredoka text-xl sm:text-2xl font-bold">Learn & Play (360° Life Growth)</h2>
            <p class="text-xs sm:text-sm text-emerald-100">Harmonizing early literacy, active physical sports, and social character building</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="openAddWordBookModal()" class="btn-3d-emerald bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-50 px-4 py-2 rounded-2xl font-fredoka font-bold text-xs shadow-sm flex items-center gap-1.5">
            <span>➕</span><span>Add Word / Book</span>
          </button>
          <button onclick="openLogPlayTimeModal()" class="btn-3d-emerald bg-emerald-700 text-white border-emerald-900 px-4 py-2 rounded-2xl font-fredoka font-bold text-xs shadow-sm flex items-center gap-1.5">
            <span>⚽</span><span>Log Play Time</span>
          </button>
        </div>
      </div>

      <!-- BENTO GRID (6 Cols Phonics & Reading / 6 Cols Sports & Character) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- Left Col: Phonics Words & Reading Shelf -->
        <div class="lg:col-span-6 space-y-5">
          
          <!-- Phonics Sight Words Card -->
          <div class="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-xs space-y-3.5">
            <div class="flex items-center justify-between border-b border-emerald-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-xl">🔤</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">English Sight Words Mastered</h3>
              </div>
              <span id="sightWordsBadge" class="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                5 Active Words
              </span>
            </div>

            <div id="sightWordsContainer" class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div><strong>Orbit</strong><div class="text-[10px] text-slate-500">Planetary path</div></div>
                <button onclick="playLocalVoice('Orbit')" class="text-emerald-700 hover:text-emerald-900">🔊</button>
              </div>
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div><strong>Stamina</strong><div class="text-[10px] text-slate-500">Natural energy</div></div>
                <button onclick="playLocalVoice('Stamina')" class="text-emerald-700 hover:text-emerald-900">🔊</button>
              </div>
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div><strong>Telescope</strong><div class="text-[10px] text-slate-500">Star viewer</div></div>
                <button onclick="playLocalVoice('Telescope')" class="text-emerald-700 hover:text-emerald-900">🔊</button>
              </div>
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div><strong>Curious</strong><div class="text-[10px] text-slate-500">Eager to know</div></div>
                <button onclick="playLocalVoice('Curious')" class="text-emerald-700 hover:text-emerald-900">🔊</button>
              </div>
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div><strong>Twinkle</strong><div class="text-[10px] text-slate-500">Shining light</div></div>
                <button onclick="playLocalVoice('Twinkle')" class="text-emerald-700 hover:text-emerald-900">🔊</button>
              </div>
            </div>
          </div>

          <!-- Reading Book Log -->
          <div class="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-xs space-y-3.5">
            <div class="flex items-center justify-between border-b border-emerald-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-xl">📖</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">Favorite Storybook Log</h3>
              </div>
              <button onclick="openAddWordBookModal()" class="text-xs font-bold text-emerald-700 hover:text-emerald-800">+ Add Book</button>
            </div>

            <div id="booksContainer" class="space-y-2 text-xs">
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-800">🚀 The Little Star Explorer</div>
                  <div class="text-[11px] text-slate-500">Bedtime exploration of lunar mountains and constellations</div>
                </div>
                <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">Completed</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div class="font-bold text-slate-800">☁️ Where Do Clouds Go to Sleep?</div>
                  <div class="text-[11px] text-slate-500">Calm soothing rain cycle story with KOTL ambient audio</div>
                </div>
                <span class="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">Reading Now</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Col: Sports Physical Goal & Social Manners -->
        <div class="lg:col-span-6 space-y-5">
          
          <!-- Sports Daily 60-Min Play Goal with Circular Donut Ring -->
          <div class="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-emerald-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-xl">⚽</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">Daily Outdoor Movement Goal</h3>
              </div>
              <button onclick="openLogPlayTimeModal()" class="text-xs font-bold text-emerald-700 hover:text-emerald-800">+ Log Minutes</button>
            </div>

            <div class="flex items-center gap-5 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div class="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path class="text-emerald-200 stroke-current" stroke-width="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-emerald-600 stroke-current" stroke-dasharray="75, 100" stroke-width="4" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span id="playDonutText" class="absolute font-fredoka font-bold text-sm text-emerald-900">45m</span>
              </div>
              <div>
                <div class="font-fredoka font-bold text-base text-slate-800">45 of 60 Minutes Active Today</div>
                <p class="text-xs text-slate-600">Playground cricket (30m) + Cycling (15m)</p>
                <span class="text-[10px] font-bold text-emerald-700">75% Complete • High Physical Stamina</span>
              </div>
            </div>
          </div>

          <!-- Social Manners & Respect Card -->
          <div class="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-emerald-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-xl">🌟</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">Social Character & Manners</h3>
              </div>
              <button onclick="giveMannerStar()" class="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-fredoka font-bold text-xs shadow-2xs">
                ⭐ Award Manner Star
              </button>
            </div>

            <div class="space-y-2 text-xs">
              <div class="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <strong>Polite Turn-Taking & Greetings</strong>
                  <div class="text-[11px] text-slate-500">Cheerfully says 'Please' and 'Thank you' to elders</div>
                </div>
                <span id="mannerStarsDisplay" class="font-fredoka font-bold text-xs text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full">12 Stars Earned</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <strong>Family Empathy:</strong>
                <div class="text-[11px] text-slate-500">Carried warm water bottle for Dadi and shared drawing colors</div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- ============================================================ -->
    <!-- SECTION 4: HEALTH PASSPORT (MEDICAL HUB)                      -->
    <!-- ============================================================ -->
    <div id="section_health" class="hidden space-y-5">
      
      <!-- Health Header Card -->
      <div class="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 rounded-[32px] p-6 text-white shadow-md border-3 border-rose-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-3xl shadow-inner">
            🏥
          </div>
          <div>
            <h2 class="font-fredoka text-xl sm:text-2xl font-bold">Child Health & Pediatric Passport</h2>
            <p class="text-xs sm:text-sm text-rose-100">Emergency medical profile, sickness episode log, vaccination tracker & vitals</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="openEditMedicalIdModal()" class="btn-3d-emerald bg-white text-rose-900 border-rose-300 hover:bg-rose-50 px-4 py-2 rounded-2xl font-fredoka font-bold text-xs shadow-sm flex items-center gap-1.5">
            <span>✏️</span><span>Edit Medical ID</span>
          </button>
          <button onclick="openLogSicknessModal()" class="btn-3d-emerald bg-rose-700 text-white border-rose-900 px-4 py-2 rounded-2xl font-fredoka font-bold text-xs shadow-sm flex items-center gap-1.5">
            <span>➕</span><span>Log Sickness / Medicine</span>
          </button>
        </div>
      </div>

      <!-- BENTO GRID (6 Cols Medical ID & Sickness / 6 Cols Vaccines & Vitals) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- Left Col: Emergency ID & Sickness Treatment Log -->
        <div class="lg:col-span-6 space-y-5">
          
          <!-- Emergency Medical ID Card -->
          <div class="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3.5">
            <div class="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-xl">🚨</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">Emergency Medical Identification</h3>
              </div>
              <button onclick="openEditMedicalIdModal()" class="text-xs font-bold text-rose-700 hover:text-rose-800">✏️ Edit ID</button>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                <span class="text-[10px] uppercase font-bold text-rose-900">Blood Group</span>
                <div id="medDisplayBloodGroup" class="font-fredoka text-xl font-bold text-rose-700">B+ (Positive)</div>
              </div>
              <div class="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <span class="text-[10px] uppercase font-bold text-amber-900">Known Allergies</span>
                <div id="medDisplayAllergies" class="font-bold text-amber-800 text-[11px]">Dust / Pollen (Mild)</div>
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <div>
                  <strong id="medDisplayPediatrician">Dr. A. Mehta, MD (Pediatrics)</strong>
                  <div id="medDisplayClinic" class="text-[11px] text-slate-500">Rainbow Kids Clinic</div>
                </div>
                <a id="medDisplayPhoneBtn" href="tel:+919876543210" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs">
                  <span>📞</span><span>Call Doctor</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Sickness Episodes & Medicine Treatment History Log -->
          <div class="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-xl">🤒</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">Sickness Episodes & Medicine Log</h3>
              </div>
              <button onclick="openLogSicknessModal()" class="text-xs font-bold text-rose-700 hover:text-rose-800">+ Log Episode</button>
            </div>

            <div id="sicknessLogsContainer" class="space-y-3">
              <!-- Rendered Dynamically -->
            </div>
          </div>

        </div>

        <!-- Right Col: Vaccination Schedule & Growth Vitals -->
        <div class="lg:col-span-6 space-y-5">
          
          <!-- Vaccination Schedule Tracker -->
          <div class="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-xl">💉</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">Immunization & Vaccine Schedule</h3>
              </div>
              <button onclick="openAddVaccineModal()" class="text-xs font-bold text-rose-700 hover:text-rose-800">+ Add Vaccine</button>
            </div>

            <div id="vaccinationsContainer" class="space-y-2.5">
              <!-- Rendered Dynamically -->
            </div>
          </div>

          <!-- Growth Vitals (Height, Weight, BMI) -->
          <div class="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-rose-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-xl">📏</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">Growth Vitals & Development</h3>
              </div>
              <button onclick="openUpdateVitalsModal()" class="text-xs font-bold text-rose-700 hover:text-rose-800">✏️ Update Vitals</button>
            </div>

            <div class="grid grid-cols-3 gap-2.5 text-center">
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div class="text-[10px] font-bold text-slate-400 uppercase">Height</div>
                <div id="vitalsHeightDisplay" class="font-fredoka text-lg font-bold text-slate-800">116 <span class="text-xs font-normal">cm</span></div>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div class="text-[10px] font-bold text-slate-400 uppercase">Weight</div>
                <div id="vitalsWeightDisplay" class="font-fredoka text-lg font-bold text-slate-800">21.5 <span class="text-xs font-normal">kg</span></div>
              </div>
              <div class="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div class="text-[10px] font-bold text-emerald-800 uppercase">BMI</div>
                <div id="vitalsBmiDisplay" class="font-fredoka text-lg font-bold text-emerald-700">15.9</div>
              </div>
            </div>
            <div class="text-[11px] text-center text-slate-500 font-semibold">
              75th Percentile • Healthy Pediatric Growth Curve
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- ============================================================ -->
    <!-- SECTION 5: PARENT HUB & DAY-WISE CHAT HISTORY                -->
    <!-- ============================================================ -->
    <div id="section_parent" class="hidden space-y-5">
      
      <!-- Parent Hub Header Card -->
      <div class="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 rounded-[32px] p-6 text-white shadow-md border-3 border-sky-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-3xl shadow-inner">
            🎙️
          </div>
          <div>
            <h2 class="font-fredoka text-xl sm:text-2xl font-bold">Parent Hub & Voice Operations</h2>
            <p class="text-xs sm:text-sm text-sky-100">Live walkie-talkie transmitter, daily curfews, safety guardrails & day-wise chat archive</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
            MAX98357A I2S Live
          </span>
        </div>
      </div>

      <!-- BENTO GRID (5 Cols Walkie & Controls / 7 Cols Day-Wise Chat Archive) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- Left Bento Col (5 Columns): Walkie Transmitter & Safety Controls -->
        <div class="lg:col-span-5 space-y-5">
          
          <!-- Walkie-Talkie Voice Memo Card -->
          <div class="bg-white border-2 border-sky-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center gap-2 border-b border-sky-100 pb-2.5">
              <span class="text-2xl">🎙️</span>
              <div>
                <h3 class="font-fredoka text-base font-bold text-slate-800">Walkie-Talkie Mic</h3>
                <p class="text-[11px] text-slate-500">Transmit real voice audio directly to KOTL's speaker</p>
              </div>
            </div>

            <!-- Mic Button -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/50 border border-sky-200 flex flex-col items-center justify-center text-center space-y-3">
              <div class="relative">
                <button id="walkieMicBtn" onclick="toggleWalkieRecording()" class="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all">
                  <span id="walkieMicIcon">🎙️</span>
                </button>
                <div id="walkiePulseRing" class="hidden absolute inset-0 rounded-full border-4 border-rose-400 animate-recording-ring pointer-events-none"></div>
              </div>

              <div id="walkieStatusText" class="text-xs font-bold text-slate-700">
                Tap to record a voice memo from Mummy or Papa
              </div>

              <!-- 4 Quick 1-Click Voice Presets -->
              <div class="w-full pt-2 border-t border-sky-200/60 text-left">
                <span class="block text-[11px] font-bold text-slate-500 mb-2">Or Send Quick 1-Click Voice Memo:</span>
                <div class="grid grid-cols-2 gap-2">
                  <button onclick="sendQuickPresetVoice('💧 Drink Water', 'Parth beta, drink your fresh glass of water and stay energized!')" class="p-2 rounded-xl bg-white hover:bg-sky-100/70 border border-sky-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 truncate">
                    <span>💧</span><span class="truncate">Drink Water</span>
                  </button>
                  <button onclick="sendQuickPresetVoice('🥦 Eat Greens', 'Parth, remember your superhero green veggies for stamina!')" class="p-2 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 truncate">
                    <span>🥦</span><span class="truncate">Lunch Greens</span>
                  </button>
                  <button onclick="sendQuickPresetVoice('🧸 Pack Toys', 'Time to place toys neatly back into the organizer box, champion!')" class="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 truncate">
                    <span>🧸</span><span class="truncate">Pack Toys</span>
                  </button>
                  <button onclick="sendQuickPresetVoice('🌙 Bedtime Hug', 'Bedtime soon champ! Let us listen to KOTL star story and sleep on time.')" class="p-2 rounded-xl bg-white hover:bg-purple-100/70 border border-purple-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5 truncate">
                    <span>🌙</span><span class="truncate">Bedtime Hug</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Custom Typed Voice Message -->
            <div class="flex items-center gap-2">
              <input id="walkieCustomText" type="text" placeholder="Type a custom memo for KOTL to speak..." class="flex-1 text-xs p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 focus:outline-none focus:bg-white" />
              <button onclick="sendCustomTypedVoice()" class="btn-3d-sky px-3 py-2 text-white rounded-xl font-fredoka font-bold text-xs whitespace-nowrap">
                Speak
              </button>
            </div>
          </div>

          <!-- Talk Limit & Curfew -->
          <div class="bg-white border-2 border-sky-200 rounded-[32px] p-5 shadow-xs space-y-3.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">⏱️</span>
                <h3 class="font-fredoka text-sm font-bold text-slate-800">Daily Talk Time Limit</h3>
              </div>
              <span id="talkLimitBadge" class="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300">
                30 Mins / Day
              </span>
            </div>
            <input id="sliderTalkLimit" type="range" min="15" max="90" step="15" value="30" oninput="updateTalkLimit(this.value)" class="w-full accent-sky-500 cursor-pointer" />

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">🌙</span>
                <h3 class="font-fredoka text-sm font-bold text-slate-800">Bedtime Curfew</h3>
              </div>
              <select id="selectBedtime" onchange="updateBedtime(this.value)" class="text-xs font-bold text-slate-700 p-1.5 rounded-xl border border-purple-200 bg-purple-50/50 focus:outline-none">
                <option value="20:30">08:30 PM (Early)</option>
                <option value="21:00" selected>09:00 PM (Default)</option>
                <option value="21:30">09:30 PM (Extended)</option>
              </select>
            </div>
          </div>

          <!-- Adult Permission Safety Locks -->
          <div class="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3">
            <div class="flex items-center justify-between border-b border-rose-100 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-lg">🔒</span>
                <h3 class="font-fredoka text-sm font-bold text-slate-800">Safety Guardrails</h3>
              </div>
              <span class="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">Always Active</span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span>💊 Health & Medicines Advice</span>
                <label class="toggle-switch"><input type="checkbox" checked onchange="toggleSafetyPermission('medicines', this.checked)"><span class="slider"></span></label>
              </div>
              <div class="flex items-center justify-between">
                <span>✂️ Sharp Tools & Hot Fire</span>
                <label class="toggle-switch"><input type="checkbox" checked onchange="toggleSafetyPermission('sharp_tools', this.checked)"><span class="slider"></span></label>
              </div>
              <div class="flex items-center justify-between">
                <span>🚪 Outside Play & Door Opening</span>
                <label class="toggle-switch"><input type="checkbox" checked onchange="toggleSafetyPermission('outside_play', this.checked)"><span class="slider"></span></label>
              </div>
              <div class="flex items-center justify-between">
                <span>💳 Purchases & In-App Money</span>
                <label class="toggle-switch"><input type="checkbox" checked onchange="toggleSafetyPermission('purchases', this.checked)"><span class="slider"></span></label>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Bento Col (7 Columns): 📅 DAY-WISE COMPANION DIALOGUE ARCHIVE -->
        <div class="lg:col-span-7 space-y-4">
          
          <div class="bg-white border-2 border-indigo-200 rounded-[32px] p-5 sm:p-6 shadow-xs space-y-4">
            
            <!-- Day-Wise Archive Header & Search Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl shadow-2xs">
                  📅
                </div>
                <div>
                  <h3 class="font-fredoka text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span>Day-Wise Companion Dialogue Archive</span>
                    <span id="activeDayBadge" class="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  </h3>
                  <p class="text-xs text-slate-500">Every dialogue turn between Parth & KOTL archived date-by-date</p>
                </div>
              </div>

              <!-- Dialogue Search Bar -->
              <div class="relative w-full sm:w-52">
                <input id="dialogueSearchInput" type="text" placeholder="Search conversations..." oninput="filterDialogueTurns(this.value)" class="w-full text-xs pl-7 pr-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <span class="absolute left-2.5 top-2 text-[11px] text-indigo-400">🔍</span>
              </div>
            </div>

            <!-- Date Selector Pills (Today, Yesterday, Oct 22, Oct 20) -->
            <div>
              <div class="text-[11px] font-bold text-slate-500 uppercase mb-2">Select Date Archive:</div>
              <div id="daySelectorPills" class="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                <!-- Injected dynamically -->
              </div>
            </div>

            <!-- Dialogue Turns Feed (Child vs KOTL with Audio Playback) -->
            <div id="dayWiseTurnsContainer" class="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              <!-- Injected dynamically -->
            </div>

            <!-- Live Test Simulation Chat Box -->
            <div class="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-indigo-900">
                <span class="flex items-center gap-1.5">
                  <span>🧪</span><span>Test KOTL Companion from Parent Console</span>
                </span>
                <span class="text-[10px] text-indigo-600 font-normal">Appends directly to Today</span>
              </div>
              <div class="flex items-center gap-2">
                <input id="testChatInput" type="text" placeholder="Type a test question as Parth (e.g. 'KOTL, how far is Mars?')..." class="flex-1 text-xs p-2.5 rounded-xl border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" onkeydown="if(event.key==='Enter') sendTestChatMessage()" />
                <button onclick="sendTestChatMessage()" class="btn-3d-indigo px-4 py-2 text-white rounded-xl font-fredoka font-bold text-xs whitespace-nowrap shadow-xs">
                  <span>Send</span>
                  <span>🚀</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>

  </main>

  <!-- CLOUD WAVE FOOTER -->
  <footer class="relative w-full overflow-hidden leading-none z-0 mt-8">
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" class="relative block w-full h-12 text-[#FFF7E6] fill-current">
      <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"></path>
    </svg>
    <div class="bg-[#FFF7E6] py-3 text-center text-xs text-amber-900/60 font-semibold">
      KOTL Kids Pediatric Behavioral & Intelligence Companion • Pure Kindergarten Edition
    </div>
  </footer>

  <!-- FIXED MOBILE BOTTOM NAVIGATION (QA Required: id="mobileBottomNav") -->
  <nav id="mobileBottomNav" class="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 py-2 px-2 flex justify-around items-center z-50 lg:hidden shadow-lg">
    <button onclick="switchSection('report')" id="mobBtn_report" class="flex flex-col items-center font-bold text-[10px] text-sky-600">
      <span class="text-lg">📜</span><span>Report</span>
    </button>
    <button onclick="switchSection('quests')" id="mobBtn_quests" class="flex flex-col items-center font-bold text-[10px] text-slate-500">
      <span class="text-lg">🧭</span><span>Quests</span>
    </button>
    <button onclick="switchSection('growth')" id="mobBtn_growth" class="flex flex-col items-center font-bold text-[10px] text-slate-500">
      <span class="text-lg">🎨</span><span>Learn</span>
    </button>
    <button onclick="switchSection('health')" id="mobBtn_health" class="flex flex-col items-center font-bold text-[10px] text-slate-500">
      <span class="text-lg">🏥</span><span>Health</span>
    </button>
    <button onclick="switchSection('parent')" id="mobBtn_parent" class="flex flex-col items-center font-bold text-[10px] text-slate-500">
      <span class="text-lg">🎙️</span><span>Parent</span>
    </button>
  </nav>

  <!-- ============================================================ -->
  <!-- MODALS CONTAINER                                             -->
  <!-- ============================================================ -->

  <!-- 1. CHILD PROFILE & GUARDRAILS MODAL (QA Required: id="childProfileModal") -->
  <div id="childProfileModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🧒</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Child Profile & Safety Settings</h3>
        </div>
        <button onclick="closeProfileModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>

      <form onsubmit="saveProfileSettings(event)" class="space-y-3 text-xs font-semibold text-slate-700">
        <div>
          <label class="block mb-1">Child's Name:</label>
          <input id="cfgChildName" type="text" value="Parth" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 font-bold" required />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block mb-1">Age:</label>
            <input id="cfgChildAge" type="number" value="6" min="3" max="12" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 font-bold" required />
          </div>
          <div>
            <label class="block mb-1">Gender:</label>
            <select id="cfgChildGender" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 font-bold">
              <option value="Boy" selected>Boy</option>
              <option value="Girl">Girl</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block mb-1">Bedtime:</label>
          <input id="cfgBedtime" type="time" value="21:00" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 font-bold" />
        </div>
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeProfileModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold">Cancel</button>
          <button type="submit" class="btn-3d-amber px-5 py-2.5 rounded-xl text-white font-fredoka font-bold shadow-md">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 2. EDIT MEDICAL ID & ALLERGIES MODAL -->
  <div id="editMedicalIdModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">✏️</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Edit Emergency Medical ID</h3>
        </div>
        <button onclick="closeEditMedicalIdModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>

      <form onsubmit="handleSaveMedicalId(event)" class="space-y-3 text-xs font-semibold text-slate-700">
        <div>
          <label class="block mb-1">Blood Group:</label>
          <select id="medInputBloodGroup" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300 font-bold">
            <option value="B+">B Positive (B+)</option>
            <option value="O+">O Positive (O+)</option>
            <option value="A+">A Positive (A+)</option>
            <option value="AB+">AB Positive (AB+)</option>
            <option value="B-">B Negative (B-)</option>
            <option value="O-">O Negative (O-)</option>
            <option value="A-">A Negative (A-)</option>
            <option value="AB-">AB Negative (AB-)</option>
          </select>
        </div>
        <div>
          <label class="block mb-1">Known Allergies (comma-separated):</label>
          <input id="medInputAllergies" type="text" value="Dust / Pollen (Mild), Raw Bitter Vegetables" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label class="block mb-1">Pediatrician Name:</label>
          <input id="medInputPediatrician" type="text" value="Dr. A. Mehta, MD (Pediatrics)" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label class="block mb-1">Pediatrician Phone Number:</label>
          <input id="medInputPhone" type="text" value="+91 98765 43210" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label class="block mb-1">Clinic / Hospital Name:</label>
          <input id="medInputClinic" type="text" value="Rainbow Kids Clinic" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeEditMedicalIdModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold">Cancel</button>
          <button type="submit" class="btn-3d-emerald px-5 py-2.5 rounded-xl text-white font-fredoka font-bold shadow-md">Save Medical ID</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 3. ASSIGN QUEST MODAL -->
  <div id="assignQuestModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🧭</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Assign Socratic Quest to Parth</h3>
        </div>
        <button onclick="closeAssignQuestModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>

      <form onsubmit="handleSaveQuest(event)" class="space-y-3 text-xs font-semibold text-slate-700">
        <div>
          <label class="block mb-1">Quest Title:</label>
          <input id="questInputTitle" type="text" placeholder="e.g. Build a Cardboard Moon Rover" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300" required />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block mb-1">Category:</label>
            <select id="questInputCategory" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 font-bold">
              <option value="School Project">School Project</option>
              <option value="Life Skill">Life Skill</option>
              <option value="Family Kindness">Family Kindness</option>
              <option value="STEM Exploration">STEM Exploration</option>
            </select>
          </div>
          <div>
            <label class="block mb-1">Reward Badge:</label>
            <input id="questInputBadge" type="text" placeholder="⭐ Master Explorer" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300 font-bold" />
          </div>
        </div>
        <div>
          <label class="block mb-1">Quest Goal for Child:</label>
          <input id="questInputGoal" type="text" placeholder="e.g. Find 4 round bottle caps for wheels and assemble" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300" />
        </div>
        <div>
          <label class="block mb-1">KOTL Socratic Mentor Hint:</label>
          <input id="questInputHint" type="text" placeholder="e.g. What shape rolls best on rough lunar surface?" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-300" />
        </div>
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeAssignQuestModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold">Cancel</button>
          <button type="submit" class="btn-3d-amber px-5 py-2.5 rounded-xl text-white font-fredoka font-bold shadow-md">Assign Quest</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 4. LOG SICKNESS & MEDICINE MODAL -->
  <div id="logSicknessModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🤒</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Log Sickness Episode & Medicine</h3>
        </div>
        <button onclick="closeLogSicknessModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>

      <form onsubmit="handleSaveSicknessLog(event)" class="space-y-3 text-xs font-semibold text-slate-700">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block mb-1">Date:</label>
            <input id="sickInputDate" type="date" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold" required />
          </div>
          <div>
            <label class="block mb-1">Status:</label>
            <select id="sickInputStatus" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold">
              <option value="recovered">Recovered ✓</option>
              <option value="in_treatment">Under Treatment ⏳</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block mb-1">Symptom / Diagnosis:</label>
          <input id="sickInputSymptom" type="text" placeholder="e.g. Mild Cough & Cold" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" required />
        </div>
        <div>
          <label class="block mb-1">Doctor Name:</label>
          <input id="sickInputDoctor" type="text" value="Dr. A. Mehta, MD (Pediatrics)" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" />
        </div>
        <div>
          <label class="block mb-1">Prescribed Medicines & Dosage:</label>
          <input id="sickInputMedicines" type="text" placeholder="e.g. Paracetamol syrup 5ml twice daily" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" />
        </div>
        <div>
          <label class="block mb-1">Diet / Remedy Notes:</label>
          <input id="sickInputRemedy" type="text" placeholder="e.g. Warm water and honey ginger tea" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" />
        </div>
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeLogSicknessModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold">Cancel</button>
          <button type="submit" class="btn-3d-emerald px-5 py-2.5 rounded-xl text-white font-fredoka font-bold shadow-md">Save Episode</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 5. ADD VACCINE MODAL -->
  <div id="addVaccineModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">💉</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Add Immunization / Vaccine</h3>
        </div>
        <button onclick="closeAddVaccineModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>

      <form onsubmit="handleSaveVaccine(event)" class="space-y-3 text-xs font-semibold text-slate-700">
        <div>
          <label class="block mb-1">Vaccine Name:</label>
          <input id="vacInputName" type="text" placeholder="e.g. Typhoid Conjugate Booster" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" required />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block mb-1">Age Due:</label>
            <input id="vacInputAge" type="text" value="6 Years" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold" />
          </div>
          <div>
            <label class="block mb-1">Status:</label>
            <select id="vacInputStatus" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold">
              <option value="completed">Completed ✓</option>
              <option value="upcoming">Upcoming 📅</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block mb-1">Date Administered / Due Date:</label>
          <input id="vacInputDate" type="text" placeholder="e.g. November 2026" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" />
        </div>
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeAddVaccineModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold">Cancel</button>
          <button type="submit" class="btn-3d-emerald px-5 py-2.5 rounded-xl text-white font-fredoka font-bold shadow-md">Add Vaccine</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 6. UPDATE VITALS MODAL -->
  <div id="updateVitalsModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">📏</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Update Height & Weight</h3>
        </div>
        <button onclick="closeUpdateVitalsModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>

      <form onsubmit="handleSaveVitals(event)" class="space-y-3 text-xs font-semibold text-slate-700">
        <div>
          <label class="block mb-1">Height (cm):</label>
          <input id="vitalsInputHeight" type="number" step="0.5" value="116" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold" required />
        </div>
        <div>
          <label class="block mb-1">Weight (kg):</label>
          <input id="vitalsInputWeight" type="number" step="0.1" value="21.5" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold" required />
        </div>
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeUpdateVitalsModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold">Cancel</button>
          <button type="submit" class="btn-3d-emerald px-5 py-2.5 rounded-xl text-white font-fredoka font-bold shadow-md">Save Vitals</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 7. ADD WORD OR BOOK MODAL -->
  <div id="addWordBookModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-emerald-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">📚</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Add Sight Word or Storybook</h3>
        </div>
        <button onclick="closeAddWordBookModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>

      <form onsubmit="handleSaveWordBook(event)" class="space-y-3 text-xs font-semibold text-slate-700">
        <div>
          <label class="block mb-1">Entry Type:</label>
          <select id="wbInputType" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold">
            <option value="word">🔤 English Phonics / Sight Word</option>
            <option value="book">📖 Favorite Storybook</option>
          </select>
        </div>
        <div>
          <label class="block mb-1">Title / Word:</label>
          <input id="wbInputTitle" type="text" placeholder="e.g. Constellation or The Magic Telescope" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold" required />
        </div>
        <div>
          <label class="block mb-1">Meaning / Story Description:</label>
          <input id="wbInputDesc" type="text" placeholder="e.g. A shining group of stars forming pictures" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" />
        </div>
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeAddWordBookModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold">Cancel</button>
          <button type="submit" class="btn-3d-emerald px-5 py-2.5 rounded-xl text-white font-fredoka font-bold shadow-md">Add to Library</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 8. LOG PLAY TIME MODAL -->
  <div id="logPlayTimeModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-emerald-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">⚽</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Log Physical Play Time</h3>
        </div>
        <button onclick="closeLogPlayTimeModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>

      <form onsubmit="handleSavePlayTime(event)" class="space-y-3 text-xs font-semibold text-slate-700">
        <div>
          <label class="block mb-1">Activity Name:</label>
          <input id="playInputActivity" type="text" placeholder="e.g. Playground Cricket, Cycling, Running" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none" required />
        </div>
        <div>
          <label class="block mb-1">Minutes Played:</label>
          <input id="playInputMinutes" type="number" min="5" max="180" step="5" value="20" class="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-bold" required />
        </div>
        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" onclick="closeLogPlayTimeModal()" class="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold">Cancel</button>
          <button type="submit" class="btn-3d-emerald px-5 py-2.5 rounded-xl text-white font-fredoka font-bold shadow-md">Log Activity</button>
        </div>
      </form>
    </div>
  </div>

  <!-- 9. GROQ QUOTA MODAL -->
  <div id="quotaModal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">⚡</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Groq API Cloud Quota</h3>
        </div>
        <button onclick="closeQuotaModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>
      <div class="space-y-3 text-xs text-slate-600">
        <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
          <div class="font-bold text-amber-900">Tier: Free Developer Allocation</div>
          <div>Remaining Daily Requests: <strong>14,380 of 14,400</strong></div>
          <div>Tokens Per Minute: <strong>598,200 of 600,000</strong></div>
        </div>
        <p class="text-[11px] text-slate-500 leading-relaxed">
          Groq Whisper-large-v3 and Llama-3.3-70b-versatile process Parth's speech with zero delay and instant natural responses.
        </p>
      </div>
      <div class="pt-2 flex justify-end">
        <button onclick="closeQuotaModal()" class="px-4 py-2 bg-slate-800 text-white rounded-xl font-fredoka font-bold text-xs">Close</button>
      </div>
    </div>
  </div>

  <!-- JAVASCRIPT LOGIC & STATE ENGINE -->
  <script>
    // State Stores
    let localDaysHistory = [];
    let activeDayId = 'day-today';
    let searchQuery = '';
    let isRecordingWalkie = false;
    let mannerStarsCount = 12;
    let totalPlayMins = 45;

    let localQuests = [
      {
        id: "q-1",
        title: "🌱 My First Plant in a Cup (School Science Project)",
        category: "School Project",
        goal: "Plant a gram seed in moist soil and observe daily sprout growth",
        mentor_hints: [
          "What do seeds need to wake up? Water, soil, or juice?",
          "Where should we keep our cup so sunlight can touch it?",
          "Let us draw a tiny leaf on our chart when it sprouts!"
        ],
        status: "in_progress",
        reward_badge: "⭐ Master Botanist"
      },
      {
        id: "q-2",
        title: "🧸 Space Station Desk Organizer (Training Mission)",
        category: "Life Skill",
        goal: "Sort study desk items by size: big storybooks, pencils, and pack toys",
        mentor_hints: [
          "Big books are heavy rocket fuel tanks! Where should they sit?",
          "Color crayons are launch control buttons! Can they go in the pencil cup?",
          "Look how clean your space station desk looks now!"
        ],
        status: "in_progress",
        reward_badge: "🚀 Space Commander"
      },
      {
        id: "q-3",
        title: "🎨 Golden Thank-You Card for Dadi (Family Quest)",
        category: "Family Kindness",
        goal: "Draw a colorful greeting card with a smiling sun for Dadi",
        mentor_hints: [
          "What is Dadi's favorite bright color? Yellow or Sky Blue?",
          "Can we draw 5 sun rays and say 'Thank you Dadi for yummy food'?"
        ],
        status: "completed",
        reward_badge: "💖 Kindness Champion"
      }
    ];

    let localSicknessLogs = [
      {
        id: "sick-1",
        date: "Oct 18, 2026",
        symptom: "Mild Cold & Runny Nose",
        doctor: "Dr. A. Mehta, MD (Pediatrics)",
        medicines: "Saline nasal drops & warm fluids",
        dosage: "2 drops in morning & bedtime",
        status: "recovered",
        remedy: "Warm turmeric milk with a drop of organic honey"
      }
    ];

    let localVaccinations = [
      { id: "vac-1", name: "MMR Booster", age_due: "5-6 Years", status: "completed", date: "April 2026" },
      { id: "vac-2", name: "DPT Booster 2", age_due: "5-6 Years", status: "completed", date: "July 2026" },
      { id: "vac-3", name: "Typhoid Conjugate", age_due: "6 Years", status: "upcoming", due_date: "November 2026" },
      { id: "vac-4", name: "Annual Flu Shot", age_due: "Annual", status: "upcoming", due_date: "December 2026" }
    ];

    let localVoiceMemos = [
      {
        id: "memo-1",
        timestamp: "Today, 10:30 AM",
        sender: "Mummy",
        text: "Parth beta, drink your fresh glass of water and playground game!",
        preset: "Drink Water",
        status: "Delivered to KOTL"
      },
      {
        id: "memo-2",
        timestamp: "Yesterday, 08:45 PM",
        sender: "Papa",
        text: "Bedtime soon champ! Let us listen to KOTL star story and sleep on time.",
        preset: "Bedtime Hug",
        status: "Played by Parth"
      }
    ];

    // Navigation Switcher
    function switchSection(secId) {
      const sections = ['report', 'quests', 'growth', 'health', 'parent'];
      sections.forEach(s => {
        const el = document.getElementById('section_' + s);
        const topBtn = document.getElementById('secBtn_' + s);
        const mobBtn = document.getElementById('mobBtn_' + s);
        
        if (s === secId) {
          if (el) el.classList.remove('hidden');
          if (topBtn) topBtn.className = 'sec-tab-active px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap';
          if (mobBtn) mobBtn.className = 'flex flex-col items-center font-bold text-[10px] text-sky-600';
        } else {
          if (el) el.classList.add('hidden');
          if (topBtn) topBtn.className = 'px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200 transition-all flex items-center gap-1.5 whitespace-nowrap';
          if (mobBtn) mobBtn.className = 'flex flex-col items-center font-bold text-[10px] text-slate-500';
        }
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Modal Control Functions
    function openProfileModal() { document.getElementById('childProfileModal').classList.remove('hidden'); }
    function closeProfileModal() { document.getElementById('childProfileModal').classList.add('hidden'); }

    function openQuotaModal() { document.getElementById('quotaModal').classList.remove('hidden'); }
    function closeQuotaModal() { document.getElementById('quotaModal').classList.add('hidden'); }

    function openEditMedicalIdModal() { document.getElementById('editMedicalIdModal').classList.remove('hidden'); }
    function closeEditMedicalIdModal() { document.getElementById('editMedicalIdModal').classList.add('hidden'); }

    function openAssignQuestModal() { document.getElementById('assignQuestModal').classList.remove('hidden'); }
    function closeAssignQuestModal() { document.getElementById('assignQuestModal').classList.add('hidden'); }

    function openLogSicknessModal() {
      document.getElementById('sickInputDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('logSicknessModal').classList.remove('hidden');
    }
    function closeLogSicknessModal() { document.getElementById('logSicknessModal').classList.add('hidden'); }

    function openAddVaccineModal() { document.getElementById('addVaccineModal').classList.remove('hidden'); }
    function closeAddVaccineModal() { document.getElementById('addVaccineModal').classList.add('hidden'); }

    function openUpdateVitalsModal() { document.getElementById('updateVitalsModal').classList.remove('hidden'); }
    function closeUpdateVitalsModal() { document.getElementById('updateVitalsModal').classList.add('hidden'); }

    function openAddWordBookModal() { document.getElementById('addWordBookModal').classList.remove('hidden'); }
    function closeAddWordBookModal() { document.getElementById('addWordBookModal').classList.add('hidden'); }

    function openLogPlayTimeModal() { document.getElementById('logPlayTimeModal').classList.remove('hidden'); }
    function closeLogPlayTimeModal() { document.getElementById('logPlayTimeModal').classList.add('hidden'); }

    // Audio Playback with Browser TTS
    function playLocalVoice(text) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-IN';
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      }
    }

    // ----------------------------------------------------
    // DAY-WISE CHAT HISTORY ENGINE
    // ----------------------------------------------------
    async function loadDayWiseHistory() {
      try {
        const res = await fetch('/api/history/daywise');
        if (res.ok) {
          const data = await res.json();
          if (data.days && Array.isArray(data.days)) {
            localDaysHistory = data.days;
            renderDaySelectorPills();
            renderDayWiseTurns();
          }
        }
      } catch (err) {
        console.warn('Error loading day-wise history:', err);
      }
    }

    function renderDaySelectorPills() {
      const container = document.getElementById('daySelectorPills');
      if (!container) return;
      container.innerHTML = '';

      localDaysHistory.forEach(day => {
        const isActive = day.id === activeDayId;
        const turnCount = day.turns ? day.turns.length : 0;
        const btn = document.createElement('button');
        btn.onclick = () => selectActiveDay(day.id);
        btn.className = `px-3.5 py-1.5 rounded-xl text-xs font-fredoka font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-sm border-2 border-indigo-700' 
            : 'bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200'
        }`;
        btn.innerHTML = `
          <span>${day.label === 'Today' ? '🌟' : '📅'}</span>
          <span>${day.label}</span>
          <span class="text-[10px] opacity-80">(${turnCount} turns)</span>
        `;
        container.appendChild(btn);
      });
    }

    function selectActiveDay(dayId) {
      activeDayId = dayId;
      const targetDay = localDaysHistory.find(d => d.id === dayId);
      if (targetDay) {
        document.getElementById('activeDayBadge').innerText = targetDay.label + ' (' + targetDay.sublabel + ')';
      }
      renderDaySelectorPills();
      renderDayWiseTurns();
    }

    function filterDialogueTurns(query) {
      searchQuery = (query || '').toLowerCase().trim();
      renderDayWiseTurns();
    }

    function renderDayWiseTurns() {
      const container = document.getElementById('dayWiseTurnsContainer');
      if (!container) return;
      container.innerHTML = '';

      const currentDay = localDaysHistory.find(d => d.id === activeDayId) || localDaysHistory[0];
      if (!currentDay || !currentDay.turns || currentDay.turns.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No dialogue recorded for this day yet.
          </div>
        `;
        return;
      }

      let filteredTurns = currentDay.turns;
      if (searchQuery) {
        filteredTurns = currentDay.turns.filter(t => 
          (t.child && t.child.text && t.child.text.toLowerCase().includes(searchQuery)) ||
          (t.kotl && t.kotl.text && t.kotl.text.toLowerCase().includes(searchQuery))
        );
      }

      if (filteredTurns.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No dialogue matches your search query "${searchQuery}".
          </div>
        `;
        return;
      }

      filteredTurns.forEach((turn, idx) => {
        const card = document.createElement('div');
        card.className = 'p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 hover:border-indigo-200 transition-colors shadow-2xs';
        
        const childText = turn.child ? (turn.child.text || '') : '';
        const kotlText = turn.kotl ? (turn.kotl.text || '') : '';
        const timeStr = turn.time || 'Session Turn';
        const sourceBadge = (turn.child && turn.child.source === 'web_dashboard') ? '💻 Parent Web' : '🎙️ Mic Input (ESP32)';

        card.innerHTML = `
          <div class="flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-slate-200/50 pb-1.5">
            <div class="flex items-center gap-1.5 text-slate-600">
              <span class="font-bold">Turn #${idx + 1}</span>
              <span>•</span>
              <span>${timeStr}</span>
            </div>
            <span class="text-[10px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-medium">${sourceBadge}</span>
          </div>

          <!-- Child Turn -->
          <div class="flex items-start gap-2.5">
            <div class="w-8 h-8 rounded-full bg-amber-200 border border-amber-300 flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
              🧒
            </div>
            <div class="flex-1 bg-amber-50 border border-amber-200/80 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-800 leading-relaxed shadow-2xs">
              <div class="font-bold text-amber-900 text-[10px] uppercase mb-0.5 flex items-center gap-1">
                <span>Parth</span>
              </div>
              <div>${childText}</div>
            </div>
          </div>

          <!-- KOTL Robot Turn -->
          <div class="flex items-start gap-2.5 pl-3 sm:pl-6">
            <div class="w-8 h-8 rounded-full bg-sky-200 border border-sky-300 flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
              🤖
            </div>
            <div class="flex-1 bg-sky-50 border border-sky-200/80 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-800 leading-relaxed shadow-2xs">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-sky-900 text-[10px] uppercase flex items-center gap-1">
                  <span>KOTL Companion</span>
                </span>
                <button onclick="playLocalVoice('${kotlText.replace(/'/g, "\\'")}')" class="px-2 py-0.5 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-[10px] font-bold flex items-center gap-1 shadow-2xs active:scale-95 transition-transform">
                  <span>▶</span><span>Listen (TTS)</span>
                </button>
              </div>
              <p class="text-slate-700 font-medium">${kotlText}</p>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    }

    async function sendTestChatMessage() {
      const input = document.getElementById('testChatInput');
      const message = input.value.trim();
      if (!message) return;

      input.value = '';
      input.placeholder = 'KOTL is thinking...';
      input.disabled = true;

      try {
        const res = await fetch('/api/test/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, sessionId: 'default-session' })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.days) {
            localDaysHistory = data.days;
            activeDayId = 'day-today';
            renderDaySelectorPills();
            renderDayWiseTurns();
            if (data.reply) {
              playLocalVoice(data.reply);
            }
          }
        }
      } catch (err) {
        console.error('Test chat error:', err);
      } finally {
        input.disabled = false;
        input.placeholder = "Ask KOTL a test question as Parth (e.g. 'What is a shooting star?')...";
        input.focus();
      }
    }

    // ----------------------------------------------------
    // MEDICAL ID & SICKNESS HANDLERS
    // ----------------------------------------------------
    async function handleSaveMedicalId(e) {
      e.preventDefault();
      const blood_group = document.getElementById('medInputBloodGroup').value;
      const allergies = document.getElementById('medInputAllergies').value;
      const pediatrician_name = document.getElementById('medInputPediatrician').value;
      const phone = document.getElementById('medInputPhone').value;
      const clinic = document.getElementById('medInputClinic').value;

      document.getElementById('medDisplayBloodGroup').innerText = blood_group;
      document.getElementById('medDisplayAllergies').innerText = allergies;
      document.getElementById('medDisplayPediatrician').innerText = pediatrician_name;
      document.getElementById('medDisplayClinic').innerText = clinic;
      document.getElementById('medDisplayPhoneBtn').href = 'tel:' + phone.replace(/\\s+/g, '');

      closeEditMedicalIdModal();

      fetch('/api/medical/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blood_group, allergies, pediatrician_name, phone, clinic })
      }).catch(() => {});
    }

    function renderSicknessLogs() {
      const container = document.getElementById('sicknessLogsContainer');
      if (!container) return;
      container.innerHTML = '';

      localSicknessLogs.forEach(s => {
        const isRec = s.status === 'recovered';
        const card = document.createElement('div');
        card.className = 'p-3.5 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-2';
        card.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-base">🤒</span>
              <span class="text-xs font-bold text-slate-800 font-fredoka">${s.symptom}</span>
              <span class="text-[10px] text-slate-400">• ${s.date}</span>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${isRec ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${isRec ? 'Recovered ✓' : 'Active Treatment ⏳'}
            </span>
          </div>
          <div class="text-[11px] text-slate-600 space-y-1">
            <div>👨‍⚕️ <strong>Doctor:</strong> ${s.doctor}</div>
            <div>💊 <strong>Prescribed Medicines & Dosage:</strong> <span class="text-rose-900 font-semibold">${s.medicines} (${s.dosage || 'As directed'})</span></div>
            ${s.remedy ? `<div>🍵 <strong>Diet / Remedy Notes:</strong> ${s.remedy}</div>` : ''}
          </div>
        `;
        container.appendChild(card);
      });
    }

    function handleSaveSicknessLog(e) {
      e.preventDefault();
      const date = document.getElementById('sickInputDate').value;
      const status = document.getElementById('sickInputStatus').value;
      const symptom = document.getElementById('sickInputSymptom').value.trim();
      const doctor = document.getElementById('sickInputDoctor').value.trim();
      const medicines = document.getElementById('sickInputMedicines').value.trim();
      const remedy = document.getElementById('sickInputRemedy').value.trim();

      const newLog = {
        id: 'sick-' + Date.now(),
        date: date || 'Today',
        status,
        symptom,
        doctor,
        medicines,
        dosage: 'As prescribed',
        remedy
      };
      localSicknessLogs.unshift(newLog);
      renderSicknessLogs();
      closeLogSicknessModal();

      fetch('/api/medical/sickness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      }).catch(() => {});
    }

    // ----------------------------------------------------
    // VACCINES & VITALS HANDLERS
    // ----------------------------------------------------
    function renderVaccinations() {
      const container = document.getElementById('vaccinationsContainer');
      if (!container) return;
      container.innerHTML = '';

      localVaccinations.forEach(v => {
        const isDone = v.status === 'completed';
        const card = document.createElement('div');
        card.className = `p-3 rounded-2xl border flex items-center justify-between ${isDone ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'}`;
        card.innerHTML = `
          <div class="flex items-center gap-2.5">
            <span class="text-xl">${isDone ? '✅' : '📅'}</span>
            <div>
              <div class="text-xs font-bold text-slate-800">${v.name}</div>
              <div class="text-[10px] text-slate-500">${isDone ? ('Administered: ' + v.date) : ('Due: ' + (v.due_date || 'Upcoming'))}</div>
            </div>
          </div>
          <button onclick="toggleVaccineDone('${v.id}')" class="text-[10px] font-bold px-2.5 py-1 rounded-md ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900 hover:bg-emerald-200'}">
            ${isDone ? 'Completed ✓' : 'Mark Done'}
          </button>
        `;
        container.appendChild(card);
      });
    }

    function toggleVaccineDone(id) {
      const v = localVaccinations.find(x => x.id === id);
      if (v) {
        v.status = v.status === 'completed' ? 'upcoming' : 'completed';
        v.date = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        renderVaccinations();
        fetch('/api/medical/vaccine/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: v.status, date: v.date })
        }).catch(() => {});
      }
    }

    function handleSaveVaccine(e) {
      e.preventDefault();
      const name = document.getElementById('vacInputName').value.trim();
      const age_due = document.getElementById('vacInputAge').value.trim();
      const status = document.getElementById('vacInputStatus').value;
      const date = document.getElementById('vacInputDate').value.trim();

      const newVac = {
        id: 'vac-' + Date.now(),
        name,
        age_due,
        status,
        date: status === 'completed' ? (date || 'This month') : null,
        due_date: status === 'upcoming' ? (date || 'Upcoming') : null
      };
      localVaccinations.push(newVac);
      renderVaccinations();
      closeAddVaccineModal();

      fetch('/api/medical/vaccine/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVac)
      }).catch(() => {});
    }

    function handleSaveVitals(e) {
      e.preventDefault();
      const h = Number(document.getElementById('vitalsInputHeight').value);
      const w = Number(document.getElementById('vitalsInputWeight').value);
      const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);

      document.getElementById('vitalsHeightDisplay').innerHTML = h + ' <span class="text-xs font-normal">cm</span>';
      document.getElementById('vitalsWeightDisplay').innerHTML = w + ' <span class="text-xs font-normal">kg</span>';
      document.getElementById('vitalsBmiDisplay').innerText = bmi;
      closeUpdateVitalsModal();

      fetch('/api/medical/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height_cm: h, weight_kg: w })
      }).catch(() => {});
    }

    // ----------------------------------------------------
    // QUESTS ENGINE
    // ----------------------------------------------------
    function renderQuests() {
      const container = document.getElementById('questsContainer');
      if (!container) return;
      container.innerHTML = '';

      localQuests.forEach(q => {
        const isDone = q.status === 'completed';
        const card = document.createElement('div');
        card.className = `p-4 sm:p-5 rounded-[28px] border-2 transition-all ${isDone ? 'bg-[#F0FDF4] border-emerald-300' : 'bg-white border-amber-200 shadow-2xs'}`;
        
        let hintsHtml = '';
        if (q.mentor_hints && q.mentor_hints.length > 0) {
          hintsHtml = `
            <div class="mt-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
              <span class="text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1">
                <span>🤖</span><span>KOTL Socratic Mentor Prompts for Parth:</span>
              </span>
              <ul class="text-xs text-slate-700 space-y-0.5 list-disc pl-4 font-medium">
                ${q.mentor_hints.map(h => `<li>${h}</li>`).join('')}
              </ul>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-lg">${isDone ? '🏆' : '🧭'}</span>
                <h3 class="font-fredoka text-base font-bold text-slate-800">${q.title}</h3>
                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${q.category}</span>
              </div>
              <p class="text-xs text-slate-600 font-medium leading-relaxed">${q.goal}</p>
            </div>
            <button onclick="toggleQuestDone('${q.id}')" class="flex-shrink-0 text-xs font-fredoka font-bold px-3 py-1.5 rounded-xl border shadow-2xs transition-colors ${isDone ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'}">
              ${isDone ? '✓ Completed' : 'Mark Done'}
            </button>
          </div>
          ${hintsHtml}
          <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-slate-500 font-semibold">Reward: <strong class="text-purple-700">${q.reward_badge || '⭐ Star Badge'}</strong></span>
            <button onclick="playLocalVoice('Parth, let us work on our mission: ${q.title.replace(/'/g, "\\'")}!')" class="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1">
              <span>🔊</span><span>Have KOTL Mentor This</span>
            </button>
          </div>
        `;
        container.appendChild(card);
      });
    }

    function toggleQuestDone(id) {
      const q = localQuests.find(x => x.id === id);
      if (q) {
        q.status = q.status === 'completed' ? 'in_progress' : 'completed';
        renderQuests();
        fetch('/api/quests/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        }).catch(() => {});
      }
    }

    function handleSaveQuest(e) {
      e.preventDefault();
      const title = document.getElementById('questInputTitle').value.trim();
      const category = document.getElementById('questInputCategory').value;
      const goal = document.getElementById('questInputGoal').value.trim();
      const hint = document.getElementById('questInputHint').value.trim();
      const badge = document.getElementById('questInputBadge').value.trim();
      if (!title) return;

      const newQ = {
        id: 'q-' + Date.now(),
        title,
        category,
        goal,
        mentor_hints: hint ? [hint] : ["Think step by step with KOTL!"],
        status: "in_progress",
        reward_badge: badge || "⭐ Star Explorer"
      };
      localQuests.unshift(newQ);
      renderQuests();
      closeAssignQuestModal();

      fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ)
      }).catch(() => {});
    }

    // ----------------------------------------------------
    // LEARN & PLAY (GROWTH) HANDLERS
    // ----------------------------------------------------
    function handleSaveWordBook(e) {
      e.preventDefault();
      const type = document.getElementById('wbInputType').value;
      const title = document.getElementById('wbInputTitle').value.trim();
      const desc = document.getElementById('wbInputDesc').value.trim();

      if (type === 'word') {
        const container = document.getElementById('sightWordsContainer');
        const card = document.createElement('div');
        card.className = 'p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between';
        card.innerHTML = `
          <div><strong>${title}</strong><div class="text-[10px] text-slate-500">${desc || 'New Phonics Word'}</div></div>
          <button onclick="playLocalVoice('${title.replace(/'/g, "\\'")}')" class="text-emerald-700 hover:text-emerald-900">🔊</button>
        `;
        container.prepend(card);
      } else {
        const container = document.getElementById('booksContainer');
        const card = document.createElement('div');
        card.className = 'p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between';
        card.innerHTML = `
          <div>
            <div class="font-bold text-slate-800">📖 ${title}</div>
            <div class="text-[11px] text-slate-500">${desc || 'Engaging storybook reading'}</div>
          </div>
          <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">New Entry</span>
        `;
        container.prepend(card);
      }
      closeAddWordBookModal();
      alert('Added successfully to library!');
    }

    function handleSavePlayTime(e) {
      e.preventDefault();
      const act = document.getElementById('playInputActivity').value.trim();
      const mins = Number(document.getElementById('playInputMinutes').value) || 20;
      totalPlayMins += mins;
      
      document.getElementById('playDonutText').innerText = totalPlayMins + 'm';
      closeLogPlayTimeModal();
      alert('Logged ' + mins + ' minutes of ' + act + '! Total active play: ' + totalPlayMins + ' mins.');
    }

    function giveMannerStar() {
      mannerStarsCount++;
      document.getElementById('mannerStarsDisplay').innerText = mannerStarsCount + ' Stars Earned';
      playLocalVoice('Super star for Parth! You are demonstrating wonderful kindness and manners!');
      alert('⭐ Manner Star awarded to Parth for polite behavior and respect!');
    }

    // ----------------------------------------------------
    // WALKIE-TALKIE & CONTROLS HANDLERS
    // ----------------------------------------------------
    function toggleWalkieRecording() {
      const btn = document.getElementById('walkieMicBtn');
      const ring = document.getElementById('walkiePulseRing');
      const status = document.getElementById('walkieStatusText');
      
      if (!isRecordingWalkie) {
        isRecordingWalkie = true;
        btn.classList.add('scale-110');
        ring.classList.remove('hidden');
        status.innerHTML = '<span class="text-rose-600 font-extrabold animate-pulse">● Recording Voice Memo... Tap again to transmit to KOTL</span>';
      } else {
        isRecordingWalkie = false;
        btn.classList.remove('scale-110');
        ring.classList.add('hidden');
        status.innerHTML = '<span class="text-emerald-600 font-bold">✓ Audio Memo Transmitted to KOTL Speaker!</span>';
        
        setTimeout(() => {
          status.innerText = 'Tap to record a voice memo from Mummy or Papa';
        }, 4000);
      }
    }

    function sendQuickPresetVoice(preset, text) {
      playLocalVoice(text);
      fetch('/api/voice-memo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'Parent', text, preset })
      }).catch(() => {});
      alert('Transmitted "' + preset + '" to KOTL speaker!');
    }

    function sendCustomTypedVoice() {
      const input = document.getElementById('walkieCustomText');
      const text = input.value.trim();
      if (!text) return;
      playLocalVoice(text);
      input.value = '';
      fetch('/api/voice-memo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'Parent', text })
      }).catch(() => {});
      alert('Speaking through KOTL: "' + text + '"');
    }

    function updateTalkLimit(val) {
      document.getElementById('talkLimitBadge').innerText = val + ' Mins / Day';
      fetch('/api/child/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_talk_limit_mins: val })
      }).catch(() => {});
    }

    function updateBedtime(val) {
      fetch('/api/child/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedtime: val })
      }).catch(() => {});
    }

    function toggleSafetyPermission(perm, val) {
      const payload = {};
      payload[perm] = val;
      fetch('/api/child/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_permissions: payload })
      }).catch(() => {});
    }

    async function saveProfileSettings(e) {
      e.preventDefault();
      const payload = {
        name: document.getElementById('cfgChildName').value.trim(),
        age: parseInt(document.getElementById('cfgChildAge').value, 10),
        gender: document.getElementById('cfgChildGender').value,
        bedtime: document.getElementById('cfgBedtime').value
      };
      try {
        await fetch('/api/child/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        document.getElementById('childHeroName').innerText = payload.name;
        document.getElementById('childHeroAge').innerText = payload.age + ' Years Old';
        alert('Child profile saved successfully!');
        closeProfileModal();
      } catch (err) {
        alert('Saved locally!');
        closeProfileModal();
      }
    }

    async function pollDeviceStatus() {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          const isOnline = data.online !== false;
          const pill = document.getElementById('deviceStatusPill');
          const dot = document.getElementById('deviceStatusDot');
          const text = document.getElementById('deviceStatusText');

          if (isOnline) {
            pill.className = 'bg-emerald-50 text-emerald-700 text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-bold border border-emerald-300 flex items-center gap-1.5 sm:gap-2 shadow-xs whitespace-nowrap';
            dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
            text.innerText = '• ESP32 Live';
          } else {
            pill.className = 'bg-slate-100 text-slate-600 text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-bold border border-slate-300 flex items-center gap-1.5 sm:gap-2 shadow-xs whitespace-nowrap';
            dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-400';
            text.innerText = '• ESP32 Standby';
          }
        }
      } catch (_) {}
    }

    // Initial Engine Bootstrap
    window.addEventListener('DOMContentLoaded', () => {
      renderQuests();
      renderSicknessLogs();
      renderVaccinations();
      loadDayWiseHistory();
      pollDeviceStatus();
      setInterval(pollDeviceStatus, 15000);
    });
  </script>
</body>
</html>`;

fs.writeFileSync(targetHtmlPath, htmlContent, 'utf8');
console.log('Successfully generated index.html. Total bytes: ' + htmlContent.length);
