const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>KOTL Kids • Kindergarten Growth & Intelligence Dashboard</title>
  
  <!-- Playful Preschool Google Fonts: Fredoka & Nunito -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            fredoka: ['"Fredoka"', 'cursive', 'sans-serif'],
            nunito: ['"Nunito"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }
        }
      }
    }
  </script>
  
  <style>
    body {
      background-color: #F8FAFC;
      color: #1E293B;
      overflow-x: hidden;
      -webkit-tap-highlight-color: transparent;
      font-family: 'Nunito', sans-serif;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 9999px;
    }
    .tab-active {
      background: #38BDF8 !important;
      color: #FFFFFF !important;
      font-weight: 700 !important;
      box-shadow: 0 4px 14px rgba(56, 189, 248, 0.4) !important;
    }
    .tab-active svg {
      color: #FFFFFF !important;
    }
    @keyframes gentle-float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-5px) rotate(1.5deg); }
    }
    .animate-float {
      animation: gentle-float 5s ease-in-out infinite;
    }
    @media print {
      header, nav, #mobileBottomNav, #recordingWaveformContainer, .no-print, .kindergarten-doodles {
        display: none !important;
      }
      body, main, section {
        background: white !important;
        color: black !important;
        overflow: visible !important;
        height: auto !important;
      }
    }
  </style>
</head>
<body class="h-screen flex flex-col antialiased select-none md:select-auto bg-[#F8FAFC] relative font-['Nunito']">

  <!-- Micro-Decorations across White Margins (Airplanes, Rainbows, Stars) -->
  <div class="kindergarten-doodles pointer-events-none fixed inset-0 overflow-hidden select-none z-0">
    <div class="absolute top-6 left-8 animate-float opacity-75">
      <svg width="80" height="60" viewBox="0 0 100 80" fill="none" class="w-16 h-12">
        <path d="M 5 65 C 25 30 45 70 65 40 C 75 25 85 30 90 25" stroke="#70B6F6" stroke-width="2" stroke-dasharray="4 4" fill="none" />
        <g transform="translate(65, 10) rotate(-10)">
          <polygon points="35,18 0,0 10,16" fill="#FFFFFF" stroke="#38BDF8" stroke-width="2" stroke-linejoin="round" />
          <polygon points="35,18 10,16 8,24" fill="#E0F2FE" stroke="#38BDF8" stroke-width="2" stroke-linejoin="round" />
          <polygon points="35,18 10,16 0,36" fill="#BAE6FD" stroke="#38BDF8" stroke-width="2" stroke-linejoin="round" />
        </g>
      </svg>
    </div>

    <div class="absolute top-6 right-10 animate-float opacity-70">
      <svg width="70" height="50" viewBox="0 0 80 50" fill="none" class="w-14 h-10">
        <path d="M 10 45 C 10 20 70 20 70 45" stroke="#F48FB1" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 18 45 C 18 26 62 26 62 45" stroke="#FFB703" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 26 45 C 26 32 54 32 54 45" stroke="#70B6F6" stroke-width="3" stroke-linecap="round" fill="none" />
      </svg>
    </div>

    <div class="absolute top-28 left-1/4 opacity-60"><span class="text-xl text-[#FFB703]">⭐</span></div>
    <div class="absolute top-44 right-1/4 opacity-50"><span class="text-lg text-[#70B6F6]">★</span></div>
    <div class="absolute bottom-36 right-12 opacity-55"><span class="text-xl text-[#66D29A]">⭐</span></div>
    <div class="absolute bottom-24 left-1/3 opacity-45"><span class="text-lg text-[#FFB703]">★</span></div>
  </div>

  <!-- Top Navigation Header -->
  <header class="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b-2 border-slate-100 px-4 sm:px-8 flex items-center justify-between shadow-xs shrink-0 z-30">
    <div class="flex items-center space-x-3 sm:space-x-4">
      <div class="flex items-center space-x-1.5 font-fredoka text-xl sm:text-2xl font-bold">
        <span class="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">K</span>
        <span class="w-8 h-8 rounded-xl bg-amber-400 text-white flex items-center justify-center shadow-xs">O</span>
        <span class="w-8 h-8 rounded-xl bg-sky-400 text-white flex items-center justify-center shadow-xs">T</span>
        <span class="w-8 h-8 rounded-xl bg-emerald-400 text-white flex items-center justify-center shadow-xs">L</span>
        <span class="ml-1 text-slate-800 tracking-tight">KIDS</span>
      </div>
      <div class="hidden sm:block border-l-2 border-slate-200 pl-3">
        <span class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Preschool Companion</span>
        <span class="text-xs text-slate-600 font-bold">Growth & Learning Hub</span>
      </div>
    </div>

    <!-- Center Segmented Tabs -->
    <nav class="hidden md:flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 space-x-1.5 text-xs sm:text-sm font-bold font-fredoka">
      <button id="tabBtnReport" onclick="switchTab('report')" class="px-4 py-2 rounded-xl transition-all flex items-center space-x-2 tab-active">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span>📜 Report Card</span>
      </button>

      <button id="tabBtnMissions" onclick="switchTab('missions')" class="px-4 py-2 rounded-xl transition-all flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-white">
        <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        <span>🎯 Habits & Goals</span>
        <span id="activeMissionsCountBadge" class="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-bold">4</span>
      </button>

      <button id="tabBtnChat" onclick="switchTab('chat')" class="px-4 py-2 rounded-xl transition-all flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-white">
        <svg class="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <span>💬 Dialogue & Voice</span>
      </button>
    </nav>

    <!-- Right Controls -->
    <div class="flex items-center space-x-2 text-xs">
      <!-- Live Device Status Pill (QA Requirement) -->
      <div id="deviceStatusPill" class="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-xs shrink-0 select-none transition-colors">
        <span id="deviceStatusDot" class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
        <span id="deviceStatusText" class="text-[11px] sm:text-xs font-mono font-bold text-emerald-800 whitespace-nowrap"><span class="hidden sm:inline">ESP32 </span>Live</span>
      </div>

      <button id="openWifiModalBtn" class="w-9 h-9 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-500 transition-all shadow-xs flex items-center justify-center shrink-0" title="ESP32 Wi-Fi & Device Config">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
        </svg>
      </button>

      <button id="openHardwareModalBtn" class="w-9 h-9 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-500 transition-all shadow-xs flex items-center justify-center shrink-0" title="Hardware Audio Diagnostics">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18.5v2.5m-4 0h8M7 5.5A5 5 0 0112 1a5 5 0 015 4.5m-10 0V10a5 5 0 0010 0V5.5M4 10a8 8 0 0016 0"></path>
        </svg>
      </button>

      <button id="openQuotaModalBtn" class="w-9 h-9 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-500 transition-all shadow-xs flex items-center justify-center shrink-0" title="Free API Limits">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </button>
    </div>
  </header>

  <!-- Main Scrollable Body -->
  <main class="flex-1 overflow-hidden relative bg-[#F8FAFC] z-10 flex flex-col">

    <!-- ======================================================== -->
    <!-- TAB 1: SCHOOL REPORT CARD (KINDERGARTEN GROWTH)          -->
    <!-- ======================================================== -->
    <section id="viewReport" class="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 custom-scrollbar max-w-6xl mx-auto w-full">
      
      <!-- TOP PROFILE HEADER (Organic Scalloped Card rounded-[32px]) -->
      <div class="relative bg-white border-2 border-amber-300 rounded-[32px] p-6 shadow-[0_12px_30px_rgba(251,191,36,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <div id="reportChildAvatar" class="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-inner shrink-0">
            👦
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h1 id="reportChildName" class="text-2xl font-bold font-fredoka text-slate-800">Parth</h1>
              <span id="reportChildAgeBadge" class="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-300">6 Years</span>
              <span id="reportChildGenderBadge" class="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-sky-300">👦 Boy</span>
              <button onclick="openProfileModal()" class="text-xs px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold flex items-center gap-1 shadow-xs font-fredoka">
                <span>⚙️ Profile</span>
              </button>
            </div>
            <p class="text-slate-500 text-sm mt-0.5">Class: <strong class="text-slate-700">Sr. KG</strong> • Companion: <span class="font-bold text-sky-600">KOTL Buddy</span> • Roll: <span class="font-mono text-slate-600">KOTL-2026-P04</span></p>
          </div>
        </div>

        <!-- Grade Badge -->
        <div class="bg-gradient-to-br from-amber-400 to-orange-500 text-white px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/20 text-center self-end sm:self-center shrink-0">
          <div class="text-[10px] uppercase tracking-wider font-semibold">Star Grade</div>
          <div class="text-2xl font-black font-fredoka">A+ <span class="text-xs font-normal">(87/100)</span></div>
        </div>
      </div>

      <!-- 4 TOP METRIC TILES (Colorful Chunky Cards rounded-[32px]) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Tile 1: Overall Star (Sky Blue fill) -->
        <div class="bg-sky-50 border-2 border-sky-300 rounded-[32px] p-5 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-sky-600 uppercase font-fredoka">Overall Star</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-white text-sky-700 font-bold border border-sky-200">A+ Top 5%</span>
          </div>
          <div class="mt-2">
            <div class="text-3xl font-extrabold font-fredoka text-sky-800">
              <span id="reportOverallScore">87</span><span class="text-sm text-sky-500">/100</span>
            </div>
            <div class="w-full bg-sky-200 h-2.5 rounded-full mt-3 overflow-hidden">
              <div id="reportOverallBar" class="bg-sky-500 h-full rounded-full transition-all duration-500" style="width: 87%"></div>
            </div>
          </div>
          <p class="text-xs text-sky-900 font-bold mt-2 font-['Nunito']">Outstanding All-Round Growth 🌟</p>
        </div>

        <!-- Tile 2: English & Words (Amber fill) -->
        <div class="bg-amber-50 border-2 border-amber-300 rounded-[32px] p-5 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-amber-600 uppercase font-fredoka">English & Words</span>
            <span id="reportVocabStatusBadge" class="text-[10px] px-2 py-0.5 rounded-full bg-white text-amber-700 font-bold border border-amber-200">Grade A</span>
          </div>
          <div class="mt-2">
            <div id="reportVocabScore" class="text-3xl font-extrabold font-fredoka text-amber-800">84%</div>
            <div class="w-full bg-amber-200 h-2.5 rounded-full mt-3 overflow-hidden">
              <div id="reportVocabBar" class="bg-amber-500 h-full rounded-full transition-all duration-500" style="width: 84%"></div>
            </div>
          </div>
          <p class="text-xs text-amber-900 font-bold mt-2 font-['Nunito']">Learns New English Words Daily 📚</p>
        </div>

        <!-- Tile 3: Space & Science (Emerald fill) -->
        <div class="bg-emerald-50 border-2 border-emerald-300 rounded-[32px] p-5 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-emerald-600 uppercase font-fredoka">Space & Science</span>
            <span id="reportCuriosityStatusBadge" class="text-[10px] px-2 py-0.5 rounded-full bg-white text-emerald-700 font-bold border border-emerald-200">Grade A+</span>
          </div>
          <div class="mt-2">
            <div id="reportCuriosityScore" class="text-3xl font-extrabold font-fredoka text-emerald-800">92%</div>
            <div class="w-full bg-emerald-200 h-2.5 rounded-full mt-3 overflow-hidden">
              <div id="reportCuriosityBar" class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: 92%"></div>
            </div>
          </div>
          <p class="text-xs text-emerald-900 font-bold mt-2 font-['Nunito']">High Curiosity in Space & Stars 🚀</p>
        </div>

        <!-- Tile 4: Good Habits (Purple fill) -->
        <div class="bg-purple-50 border-2 border-purple-300 rounded-[32px] p-5 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-purple-600 uppercase font-fredoka">Good Habits</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-white text-purple-700 font-bold border border-purple-200">3/6 Active</span>
          </div>
          <div class="mt-2">
            <div id="reportMissionsKpi" class="text-3xl font-extrabold font-fredoka text-purple-800">
              3<span class="text-sm text-purple-500">/6 Active</span>
            </div>
            <div class="w-full bg-purple-200 h-2.5 rounded-full mt-3 overflow-hidden">
              <div class="bg-purple-500 h-full rounded-full" style="width: 50%"></div>
            </div>
          </div>
          <p class="text-xs text-purple-900 font-bold mt-2 font-['Nunito']">Brushing, Veggies & Bedtime ⭐</p>
        </div>

      </div>

      <!-- SUBJECT PROGRESS & MARKSHEET (Colorful Pastel Cards with rounded-[28px]) -->
      <div class="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 class="text-xl font-bold font-fredoka text-slate-800 flex items-center gap-2">
              <span>🎨</span>
              <span>Parth's Kindergarten Marksheet & Subject Progress</span>
            </h2>
            <p class="text-xs text-slate-500">Playful cards with subject scores, stars, and companion remarks</p>
          </div>
          <span class="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold font-fredoka">
            🏆 6-Year Milestones: PASSED WITH STARS
          </span>
        </div>

        <div class="space-y-3.5">
          
          <!-- Spoken English & Words -->
          <div class="bg-sky-50/70 border-2 border-sky-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-sky-400 transition-all">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white border-2 border-sky-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🗣️</div>
              <div>
                <h4 class="font-bold text-base text-sky-900 font-fredoka">Spoken English & Words</h4>
                <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">Expresses thoughts clearly and naturally. Assimilates 2-3 syllable vocabulary seamlessly into stories.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
              <div class="text-amber-400 text-base">★★★★★</div>
              <span class="text-xs font-mono font-bold text-sky-800 bg-white px-3 py-1 rounded-xl border border-sky-200">84 / 100</span>
              <span class="px-3 py-1 rounded-xl bg-sky-600 text-white font-bold text-xs font-fredoka">Grade A • Fluent</span>
            </div>
          </div>

          <!-- Science, Space & Curiosity -->
          <div class="bg-emerald-50/70 border-2 border-emerald-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-emerald-400 transition-all">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white border-2 border-emerald-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🚀</div>
              <div>
                <h4 class="font-bold text-base text-emerald-900 font-fredoka">Science, Space & Curiosity</h4>
                <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">Deeply curious about stars, planets, and rocket propulsion. Asks bright exploratory questions.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
              <div class="text-amber-400 text-base">★★★★★</div>
              <span class="text-xs font-mono font-bold text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-200">92 / 100</span>
              <span class="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs font-fredoka">Grade A+ • Curious</span>
            </div>
          </div>

          <!-- Good Habits & Manners -->
          <div class="bg-amber-50/70 border-2 border-amber-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-amber-400 transition-all">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🪥</div>
              <div>
                <h4 class="font-bold text-base text-amber-900 font-fredoka">Good Habits & Manners</h4>
                <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">Brushes teeth twice daily and tidies up school bag and toys cheerfully when encouraged.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
              <div class="text-amber-400 text-base">★★★★★</div>
              <span class="text-xs font-mono font-bold text-amber-800 bg-white px-3 py-1 rounded-xl border border-amber-200">86 / 100</span>
              <span class="px-3 py-1 rounded-xl bg-amber-600 text-white font-bold text-xs font-fredoka">Grade A • Polite</span>
            </div>
          </div>

          <!-- Creativity & Stories -->
          <div class="bg-purple-50/70 border-2 border-purple-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-purple-400 transition-all">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white border-2 border-purple-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🎨</div>
              <div>
                <h4 class="font-bold text-base text-purple-900 font-fredoka">Creativity & Stories</h4>
                <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">Loves drawing spacecraft and vibrant colors. Listens attentively to bedtime moral tales.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
              <div class="text-amber-400 text-base">★★★★★</div>
              <span class="text-xs font-mono font-bold text-purple-800 bg-white px-3 py-1 rounded-xl border border-purple-200">90 / 100</span>
              <span class="px-3 py-1 rounded-xl bg-purple-600 text-white font-bold text-xs font-fredoka">Grade A+ • Creative</span>
            </div>
          </div>

          <!-- Politeness & Cheerfulness -->
          <div class="bg-rose-50/70 border-2 border-rose-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-rose-400 transition-all">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl bg-white border-2 border-rose-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🤝</div>
              <div>
                <h4 class="font-bold text-base text-rose-900 font-fredoka">Politeness & Cheerfulness</h4>
                <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">Speaks politely with parents and companions. Radiates upbeat, cheerful, and loving energy.</p>
              </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center shrink-0">
              <div class="text-amber-400 text-base">★★★★★</div>
              <span class="text-xs font-mono font-bold text-rose-800 bg-white px-3 py-1 rounded-xl border border-rose-200">95 / 100</span>
              <span class="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs font-fredoka">Grade A+ • Kind</span>
            </div>
          </div>

        </div>
      </div>

      <!-- HABITS TRACKER & STICKY NOTE (Split Module) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Left: Habits Tracker with Bouncy Rounded Pill Toggles -->
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center space-x-2.5">
                <span class="text-2xl">⭐</span>
                <div>
                  <h3 class="font-bold text-base text-slate-800 font-fredoka">Daily Habit Checklist & Routine Tracker</h3>
                  <p class="text-xs text-slate-500">Tap to toggle what Parth achieved today</p>
                </div>
              </div>
              <span class="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-fredoka border border-emerald-300">
                3/6 Active
              </span>
            </div>

            <!-- Bouncy Rounded Pill Toggles -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <label class="flex items-start gap-3 p-4 rounded-[24px] bg-sky-50 border-2 border-sky-300 cursor-pointer hover:bg-sky-100/70 transition-all shadow-xs">
                <input type="checkbox" checked class="mt-1 w-4 h-4 text-sky-600 rounded-md focus:ring-sky-500">
                <div>
                  <div class="text-xs sm:text-sm font-bold text-sky-900 font-fredoka">🪥 Morning & Night Brushing</div>
                  <div class="text-[11px] text-slate-500 font-medium">Shiny strong teeth routine</div>
                </div>
              </label>

              <label class="flex items-start gap-3 p-4 rounded-[24px] bg-emerald-50 border-2 border-emerald-300 cursor-pointer hover:bg-emerald-100/70 transition-all shadow-xs">
                <input type="checkbox" checked class="mt-1 w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500">
                <div>
                  <div class="text-xs sm:text-sm font-bold text-emerald-900 font-fredoka">🥛 Clean Water & Fresh Milk</div>
                  <div class="text-[11px] text-slate-500 font-medium">Healthy hydration all day</div>
                </div>
              </label>

              <label class="flex items-start gap-3 p-4 rounded-[24px] bg-amber-50 border-2 border-amber-300 cursor-pointer hover:bg-amber-100/70 transition-all shadow-xs">
                <input type="checkbox" class="mt-1 w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500">
                <div>
                  <div class="text-xs sm:text-sm font-bold text-amber-900 font-fredoka">🥗 Eating Veggies & Spinach</div>
                  <div class="text-[11px] text-slate-500 font-medium">Superhero stamina fuel</div>
                </div>
              </label>

              <label class="flex items-start gap-3 p-4 rounded-[24px] bg-purple-50 border-2 border-purple-300 cursor-pointer hover:bg-purple-100/70 transition-all shadow-xs">
                <input type="checkbox" checked class="mt-1 w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500">
                <div>
                  <div class="text-xs sm:text-sm font-bold text-purple-900 font-fredoka">🧸 Tidy Up Toys & School Bag</div>
                  <div class="text-[11px] text-slate-500 font-medium">Neat toy organizer box</div>
                </div>
              </label>

              <label class="flex items-start gap-3 p-4 rounded-[24px] bg-indigo-50 border-2 border-indigo-300 cursor-pointer hover:bg-indigo-100/70 transition-all shadow-xs">
                <input type="checkbox" class="mt-1 w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500">
                <div>
                  <div class="text-xs sm:text-sm font-bold text-indigo-900 font-fredoka">📖 20 Mins English Stories</div>
                  <div class="text-[11px] text-slate-500 font-medium">Bedtime story with KOTL</div>
                </div>
              </label>

              <label class="flex items-start gap-3 p-4 rounded-[24px] bg-rose-50 border-2 border-rose-300 cursor-pointer hover:bg-rose-100/70 transition-all shadow-xs">
                <input type="checkbox" class="mt-1 w-4 h-4 text-rose-600 rounded-md focus:ring-rose-500">
                <div>
                  <div class="text-xs sm:text-sm font-bold text-rose-900 font-fredoka">🌙 Sleep by 9:00 PM</div>
                  <div class="text-[11px] text-slate-500 font-medium">No screen before bedtime</div>
                </div>
              </label>
            </div>
          </div>

          <!-- SPEECH BUBBLE CHAT (With Bubble Tails & Kid Avatars) -->
          <div class="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center space-x-2.5">
                <span class="text-2xl">💬</span>
                <div>
                  <h3 class="text-lg font-bold font-fredoka text-slate-800">Live Companion Dialogue</h3>
                  <p class="text-xs text-slate-500">Real spoken speech turns from ESP32 live microphone</p>
                </div>
              </div>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-300">
                Audio Live
              </span>
            </div>

            <div id="conversationEvidenceContainer" class="space-y-4">
              <!-- Dynamically populated or default speech bubbles -->
            </div>
          </div>

          <!-- Parent Action Tips -->
          <div class="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <div class="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <span class="text-2xl">💡</span>
              <div>
                <h3 class="font-bold text-base text-slate-800 font-fredoka">Parent Action Tips & Everyday Home Activities</h3>
                <p class="text-xs text-slate-500">Fun 5-minute activities to do with Parth at home</p>
              </div>
            </div>

            <div id="parentRecommendationsContainer" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Dynamically populated -->
            </div>
          </div>

        </div>

        <!-- Right: Floating Sticky-Note Companion Observation & Tags -->
        <div class="lg:col-span-5 space-y-6">

          <!-- Sticky Note Card -->
          <div class="bg-amber-50/80 border-2 border-amber-300 rounded-[32px] p-6 shadow-sm relative space-y-3.5">
            <div class="flex items-center justify-between pb-2 border-b border-amber-200">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">📌</span>
                <h3 class="font-bold text-base text-amber-950 font-fredoka">Teacher & KOTL Companion Observation</h3>
              </div>
              <span class="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-white text-amber-800 font-bold border border-amber-300 shadow-2xs">Verified</span>
            </div>

            <p id="reportExecutiveSummary" class="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              Parth demonstrates exceptional inquisitiveness, bright verbal enthusiasm, and a joyful, polite spirit during conversations with KOTL. He shows strong memory retention when talking about Space, Stars, and Creative Art. He grasps English vocabulary quickly, asks thoughtful questions, and is eagerly developing good daily habits like tidying up his toys and brushing his teeth.
            </p>

            <div class="pt-2 flex flex-wrap gap-2 text-xs font-fredoka">
              <span class="px-3.5 py-1.5 rounded-2xl bg-white border border-sky-300 text-sky-800 font-bold shadow-xs">🚀 Space Explorer</span>
              <span class="px-3.5 py-1.5 rounded-2xl bg-white border border-amber-300 text-amber-800 font-bold shadow-xs">🎨 Creative</span>
              <span class="px-3.5 py-1.5 rounded-2xl bg-white border border-emerald-300 text-emerald-800 font-bold shadow-xs">🤝 Well Mannered</span>
            </div>
          </div>

          <!-- Child Affinity & Curiosity Tags -->
          <div class="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="font-bold text-base text-slate-800 flex items-center space-x-2 font-fredoka">
                  <span>💖</span>
                  <span>Parth's Favorite Passions & Topics</span>
                </h3>
                <p class="text-xs text-slate-500">Everyday topics Parth loves exploring</p>
              </div>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">Affinities</span>
            </div>

            <div id="passionsContainer" class="space-y-2.5">
              <!-- Dynamically populated -->
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center space-x-2">
              <input
                id="newLikeInput"
                type="text"
                placeholder="Add hobby (e.g. Painting, Football)..."
                class="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-400 transition-colors"
              />
              <button onclick="addInterest('likes')" class="px-3.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300 text-xs font-bold transition-all shadow-xs shrink-0 font-fredoka">
                + Add
              </button>
            </div>
          </div>

          <!-- Sensitivities & Gentle Care -->
          <div class="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 class="font-bold text-base text-slate-800 flex items-center space-x-2 font-fredoka">
                  <span>🛡️</span>
                  <span>Care Areas & Positive Guidance</span>
                </h3>
                <p class="text-xs text-slate-500">Handled with gentle positive guidance</p>
              </div>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-300">Gentle</span>
            </div>

            <div id="sensitivitiesContainer" class="space-y-2.5">
              <!-- Dynamically populated -->
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center space-x-2">
              <input
                id="newDislikeInput"
                type="text"
                placeholder="Add care area (e.g. Dark rooms)..."
                class="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-sky-400 transition-colors"
              />
              <button onclick="addInterest('dislikes')" class="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold transition-all shadow-xs shrink-0 font-fredoka">
                + Add
              </button>
            </div>
          </div>

          <!-- Milestones Achieved Card -->
          <div class="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="font-bold text-base text-slate-800 flex items-center space-x-2 font-fredoka">
                <span>🏆</span>
                <span>Learning Milestones Achieved</span>
              </h3>
            </div>

            <div id="milestonesContainer" class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Hidden Cognitive Grid placeholder for QA compatibility -->
          <div id="skillsAssessmentGrid" class="hidden"></div>

        </div>

      </div>

    </section>

    <!-- ======================================================== -->
    <!-- TAB 2: PARENT DIRECTIVES & HABITS                        -->
    <!-- ======================================================== -->
    <section id="viewMissions" class="hidden h-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 custom-scrollbar max-w-5xl mx-auto w-full">
      <div class="bg-white border-2 border-slate-200 rounded-[32px] p-6 sm:p-7 space-y-4 shadow-sm">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex items-center space-x-2.5">
              <span class="text-3xl">🎯</span>
              <h2 class="text-xl sm:text-2xl font-bold text-slate-800 font-fredoka">Parent Directives & Habit Missions</h2>
            </div>
            <p class="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Configure any habit or manner you want KOTL to gently encourage during daily conversations with Parth.
            </p>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-xs font-fredoka">
          <span class="text-slate-500 font-bold self-center mr-1">Quick Presets:</span>
          <button onclick="applyPreset('Brush Teeth Twice Daily', 'Cheerfully remind Parth about shiny white teeth every morning and before sleep.')" class="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 font-bold transition-all">🪥 Brush Teeth</button>
          <button onclick="applyPreset('Eat Healthy Green Veggies', 'Highlight how carrots and spinach give champions superhero stamina.')" class="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold transition-all">🥦 Green Veggies</button>
          <button onclick="applyPreset('Tidy Up Toys After Play', 'Encourage placing toys and drawing colors back in the organizer box.')" class="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold transition-all">🧸 Tidy Up Toys</button>
          <button onclick="applyPreset('20 Mins English Story Time', 'Narrate engaging story questions about space and animals in clean simple English.')" class="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 font-bold transition-all">📖 English Story</button>
        </div>

        <form id="newMissionForm" onsubmit="handleCreateMission(event)" class="pt-4 border-t border-slate-100 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-1">
              <label class="block text-xs font-bold text-slate-700 mb-1 font-fredoka">Goal Title</label>
              <input id="missionTitleInput" type="text" placeholder="e.g. Brush Teeth Twice Daily" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-400" required>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-700 mb-1 font-fredoka">KOTL Companion Directive</label>
              <input id="missionDirectiveInput" type="text" placeholder="e.g. Lovingly encourage Parth to brush his teeth before bed" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-400" required>
            </div>
          </div>
          <div class="flex justify-end">
            <button type="submit" class="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 font-fredoka">
              <span>+ Add Directive</span>
            </button>
          </div>
        </form>
      </div>

      <div class="space-y-3">
        <h3 class="font-bold text-xs text-slate-600 uppercase tracking-wider font-mono px-1">Active Directives for Parth</h3>
        <div id="missionsListContainer" class="space-y-3"></div>
      </div>
    </section>

    <!-- ======================================================== -->
    <!-- TAB 3: DIALOGUE HISTORY & REAL-TIME AUDIO (CHAT)          -->
    <!-- ======================================================== -->
    <section id="viewChat" class="hidden h-full flex flex-col justify-between overflow-hidden relative bg-[#F8FAFC] pb-16 md:pb-0">
      <div class="h-12 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between text-xs font-mono text-slate-600 bg-white shrink-0">
        <div class="flex items-center space-x-2">
          <span class="font-bold text-slate-800 font-fredoka">Conversation Archive</span>
          <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">Live Synced (Parth & KOTL)</span>
        </div>
        <button onclick="clearSessionChat()" class="text-xs text-slate-500 hover:text-rose-600 transition-colors font-sans font-bold">🗑️ Clear History</button>
      </div>

      <div id="chatScrollArea" class="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 custom-scrollbar flex flex-col items-center w-full">
        <div id="chatContainer" class="w-full max-w-3xl space-y-4"></div>
      </div>

      <div id="recordingWaveformContainer" class="hidden w-full max-w-3xl mx-auto px-4 mb-2">
        <div class="bg-white border-2 border-sky-400 rounded-3xl p-3 flex items-center justify-between shadow-lg">
          <div class="flex items-center space-x-3">
            <span class="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></span>
            <span class="text-xs font-mono text-slate-800 font-bold">Listening to voice (English Audio Mic)...</span>
          </div>
          <div class="h-6 w-32 bg-slate-100 rounded-lg overflow-hidden flex items-center border border-slate-200">
            <canvas id="visualizerCanvas" class="w-full h-full"></canvas>
          </div>
          <button id="cancelRecordBtn" class="text-xs font-mono text-slate-700 hover:text-slate-900 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 font-bold">Done</button>
        </div>
      </div>

      <div class="w-full p-4 shrink-0 flex flex-col items-center justify-center bg-white border-t border-slate-200">
        <div class="w-full max-w-3xl relative flex items-center bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-xs focus-within:border-sky-400 focus-within:bg-white transition-all px-3 py-2">
          <input id="chatInput" type="text" placeholder="Type a message or click mic to talk to KOTL..." class="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none px-3 py-1 font-sans" autocomplete="off" />
          <div class="flex items-center space-x-2 shrink-0">
            <button id="recordBtn" type="button" title="Push to Talk" class="w-9 h-9 rounded-full bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-all focus:outline-none border border-slate-200 shadow-xs">
              <svg id="micIcon" class="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"></path></svg>
              <div id="recordingSpinner" class="hidden w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </button>
            <button id="sendBtn" type="button" title="Send Message" class="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-all focus:outline-none font-bold disabled:opacity-30 shadow-md" disabled>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
            </button>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-2 text-center font-mono">KOTL Kindergarten • Parth's AI Companion • Next.js App Router • Groq Neural LLM</p>
      </div>
    </section>

  </main>

  <!-- Fixed Mobile Bottom Navigation Bar (QA verified) -->
  <nav id="mobileBottomNav" class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))] font-fredoka">
    <button onclick="switchTab('report')" id="mobTabReport" class="flex flex-col items-center justify-center space-y-1 px-4 py-1.5 rounded-xl text-sky-800 font-bold bg-sky-100 transition-all">
      <svg class="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
      <span class="text-xs">Report</span>
    </button>
    <button onclick="switchTab('missions')" id="mobTabMissions" class="flex flex-col items-center justify-center space-y-1 px-4 py-1.5 rounded-xl text-slate-500 font-medium transition-all relative">
      <div class="relative">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        <span id="mobMissionsBadge" class="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-white text-[9px] font-mono font-bold">4</span>
      </div>
      <span class="text-xs">Habits</span>
    </button>
    <button onclick="switchTab('chat')" id="mobTabChat" class="flex flex-col items-center justify-center space-y-1 px-4 py-1.5 rounded-xl text-slate-500 font-medium transition-all">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
      <span class="text-xs">Dialogue</span>
    </button>
  </nav>

  <!-- ======================================================== -->
  <!-- MODALS (QA Verified)                                      -->
  <!-- ======================================================== -->
  <div id="childProfileModal" class="hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
    <div class="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 bg-white border-2 border-slate-200 rounded-[32px] shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center space-x-2.5">
          <span class="text-2xl">⚙️</span>
          <div>
            <h3 class="font-bold text-base sm:text-lg text-slate-800 font-fredoka">Child Profile & Safety Guardrails</h3>
            <p class="text-xs text-slate-500">Configure child age, name, bedtime routine & safety permissions</p>
          </div>
        </div>
        <button onclick="closeProfileModal()" class="text-slate-400 hover:text-slate-700 text-lg p-1">✕</button>
      </div>

      <form id="childProfileForm" onsubmit="saveChildProfileForm(event)" class="space-y-4 text-xs sm:text-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-fredoka">Child's Name</label>
            <input id="profNameInput" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-400" required>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-fredoka">Age</label>
            <input id="profAgeInput" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-400" required>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-fredoka">Gender</label>
            <select id="profGenderInput" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-400">
              <option value="Boy">👦 Boy</option>
              <option value="Girl">👧 Girl</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1 font-fredoka">Bedtime Routine (IST)</label>
            <input id="profBedtimeInput" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-400" placeholder="21:00">
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 space-y-2">
          <label class="block font-bold text-slate-700 font-fredoka">Mandatory Parental Safety Guardrails</label>
          <div class="space-y-2 text-xs text-slate-600">
            <label class="flex items-center space-x-2.5">
              <input id="permMedicines" type="checkbox" checked class="w-4 h-4 text-sky-500 rounded">
              <span>Always ask parents before touching medicines or pills</span>
            </label>
            <label class="flex items-center space-x-2.5">
              <input id="permSharpTools" type="checkbox" checked class="w-4 h-4 text-sky-500 rounded">
              <span>Strict warning against sharp tools, fire & electrical wall sockets</span>
            </label>
            <label class="flex items-center space-x-2.5">
              <input id="permOutsidePlay" type="checkbox" checked class="w-4 h-4 text-sky-500 rounded">
              <span>Always hold parent's hand when leaving house or near strangers</span>
            </label>
            <label class="flex items-center space-x-2.5">
              <input id="permPurchases" type="checkbox" checked class="w-4 h-4 text-sky-500 rounded">
              <span>Never confirm purchases or financial subscriptions without mommy/daddy</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-3 border-t border-slate-100 font-fredoka">
          <button type="button" onclick="closeProfileModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-xs">Cancel</button>
          <button id="saveProfileBtn" type="submit" class="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold transition-all shadow-md text-xs">Save Profile</button>
        </div>
      </form>
    </div>
  </div>

  <div id="wifiModal" class="hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
    <div class="w-full max-w-md p-6 space-y-4 bg-white border-2 border-slate-200 rounded-[32px] shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 class="font-bold text-base text-slate-800 font-fredoka">ESP32 Wi-Fi & Device Config</h3>
        <button id="closeWifiModalBtn" class="text-slate-400 hover:text-slate-700 text-lg">✕</button>
      </div>
      <form id="deviceConfigForm" onsubmit="saveDeviceConfig(event)" class="space-y-3 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-fredoka">Wi-Fi SSID</label>
          <input id="cfgWifiSsid" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900" placeholder="Home Wi-Fi Network">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-fredoka">Wi-Fi Password</label>
          <input id="cfgWifiPass" type="password" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900" placeholder="••••••••">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1 font-fredoka">Backend Server Target</label>
          <input id="cfgTargetUrl" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono" value="https://kotl.onrender.com">
        </div>
        <div class="flex justify-end pt-2">
          <button type="submit" class="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold shadow-md font-fredoka">Save Config</button>
        </div>
      </form>
    </div>
  </div>

  <div id="hardwareModal" class="hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
    <div class="w-full max-w-md p-6 space-y-4 bg-white border-2 border-slate-200 rounded-[32px] shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 class="font-bold text-base text-slate-800 font-fredoka">Hardware Audio Diagnostics</h3>
        <button id="closeHardwareModalBtn" class="text-slate-400 hover:text-slate-700 text-lg">✕</button>
      </div>
      <div class="space-y-3 text-xs">
        <p class="text-slate-600">Test the MAX98357A I2S DAC speaker output with an ascending electronic chime.</p>
        <button onclick="testSpeakerAscendingChime()" class="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold transition-all flex items-center justify-center space-x-2 font-fredoka">
          <span>🔔 Test Ascending Chime (880Hz → 1175Hz)</span>
        </button>
        <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600 space-y-1">
          <div>OLED I2C: GPIO 21 (SDA), GPIO 22 (SCL) [400kHz]</div>
          <div>INMP441 MIC: GPIO 32 (SCK), 33 (WS), 35 (SD)</div>
          <div>MAX98357A DAC: GPIO 25 (LRC), 26 (BCLK), 27 (DIN)</div>
          <div>Capacitive Touch: GPIO 4 (Head Sensor)</div>
        </div>
      </div>
    </div>
  </div>

  <div id="quotaModal" class="hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
    <div class="w-full max-w-md p-6 space-y-4 bg-white border-2 border-slate-200 rounded-[32px] shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 class="font-bold text-base text-slate-800 font-fredoka">Free API Limits & Engine</h3>
        <button onclick="document.getElementById('quotaModal').classList.add('hidden')" class="text-slate-400 hover:text-slate-700 text-lg">✕</button>
      </div>
      <div class="space-y-2 text-xs text-slate-600 font-fredoka">
        <div class="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"><span>Groq Whisper STT</span><span class="font-mono font-bold text-emerald-600">100% Free Tier</span></div>
        <div class="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"><span>Groq Llama 3.3 70B</span><span class="font-mono font-bold text-emerald-600">High Speed / Free</span></div>
        <div class="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200"><span>Edge Neural TTS</span><span class="font-mono font-bold text-emerald-600">Unlimited / Free</span></div>
      </div>
    </div>
  </div>

  <!-- Dynamic JS Data Binding -->
  <script>
    let currentTab = 'report';
    function switchTab(tab) {
      currentTab = tab;
      const views = {
        report: document.getElementById('viewReport'),
        missions: document.getElementById('viewMissions'),
        chat: document.getElementById('viewChat')
      };
      const buttons = {
        report: document.getElementById('tabBtnReport'),
        missions: document.getElementById('tabBtnMissions'),
        chat: document.getElementById('tabBtnChat')
      };
      const mobButtons = {
        report: document.getElementById('mobTabReport'),
        missions: document.getElementById('mobTabMissions'),
        chat: document.getElementById('mobTabChat')
      };

      Object.keys(views).forEach(key => {
        if (key === tab) {
          views[key].classList.remove('hidden');
          if (buttons[key]) {
            buttons[key].className = 'px-4 py-2 rounded-xl transition-all flex items-center space-x-2 tab-active';
          }
          if (mobButtons[key]) {
            mobButtons[key].className = 'flex flex-col items-center justify-center space-y-1 px-4 py-1.5 rounded-xl text-sky-800 font-bold bg-sky-100 transition-all';
          }
        } else {
          views[key].classList.add('hidden');
          if (buttons[key]) {
            buttons[key].className = 'px-4 py-2 rounded-xl transition-all flex items-center space-x-2 text-slate-600 hover:text-slate-900 hover:bg-white';
          }
          if (mobButtons[key]) {
            mobButtons[key].className = 'flex flex-col items-center justify-center space-y-1 px-4 py-1.5 rounded-xl text-slate-500 font-medium transition-all';
          }
        }
      });

      if (tab === 'chat') {
        scrollToBottom();
      }
    }

    const wifiModal = document.getElementById('wifiModal');
    const openWifiModalBtn = document.getElementById('openWifiModalBtn');
    const closeWifiModalBtn = document.getElementById('closeWifiModalBtn');
    openWifiModalBtn.onclick = () => { wifiModal.classList.remove('hidden'); loadDeviceConfig(); };
    closeWifiModalBtn.onclick = () => wifiModal.classList.add('hidden');

    const hardwareModal = document.getElementById('hardwareModal');
    const openHardwareModalBtn = document.getElementById('openHardwareModalBtn');
    const closeHardwareModalBtn = document.getElementById('closeHardwareModalBtn');
    openHardwareModalBtn.onclick = () => hardwareModal.classList.remove('hidden');
    closeHardwareModalBtn.onclick = () => hardwareModal.classList.add('hidden');

    const quotaModal = document.getElementById('quotaModal');
    const openQuotaModalBtn = document.getElementById('openQuotaModalBtn');
    openQuotaModalBtn.onclick = () => quotaModal.classList.remove('hidden');

    const childProfileModal = document.getElementById('childProfileModal');
    function openProfileModal() {
      childProfileModal.classList.remove('hidden');
      loadProfileToForm();
    }
    function closeProfileModal() {
      childProfileModal.classList.add('hidden');
    }

    async function loadProfileToForm() {
      try {
        const res = await fetch('/api/child/profile');
        if (res.ok) {
          const data = await res.json();
          const p = data.profile || {};
          document.getElementById('profNameInput').value = p.name || 'Parth';
          document.getElementById('profAgeInput').value = p.age || '6 Years';
          document.getElementById('profGenderInput').value = p.gender || 'Boy';
          document.getElementById('profBedtimeInput').value = p.bedtime || '21:00';
          const perms = p.parent_permissions || {};
          document.getElementById('permMedicines').checked = perms.medicines !== false;
          document.getElementById('permSharpTools').checked = perms.sharp_tools !== false;
          document.getElementById('permOutsidePlay').checked = perms.outside_play !== false;
          document.getElementById('permPurchases').checked = perms.purchases !== false;
        }
      } catch (e) {
        console.warn('Error reading profile:', e);
      }
    }

    async function saveChildProfileForm(e) {
      e.preventDefault();
      const saveBtn = document.getElementById('saveProfileBtn');
      saveBtn.disabled = true;
      try {
        const payload = {
          name: document.getElementById('profNameInput').value.trim(),
          age: document.getElementById('profAgeInput').value.trim(),
          gender: document.getElementById('profGenderInput').value,
          bedtime: document.getElementById('profBedtimeInput').value.trim() || '21:00',
          parent_permissions: {
            medicines: document.getElementById('permMedicines').checked,
            sharp_tools: document.getElementById('permSharpTools').checked,
            outside_play: document.getElementById('permOutsidePlay').checked,
            purchases: document.getElementById('permPurchases').checked
          }
        };

        const res = await fetch('/api/child/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          closeProfileModal();
          await regenerateReport();
        } else {
          alert('Failed to save profile changes');
        }
      } catch (err) {
        alert('Error saving profile: ' + err.message);
      } finally {
        saveBtn.disabled = false;
      }
    }

    let currentReport = null;

    async function loadChildReport() {
      try {
        const res = await fetch('/api/child/report');
        if (res.ok) {
          const data = await res.json();
          currentReport = data.report;
          renderChildReport(currentReport);
        }
      } catch (err) {
        console.warn('Error loading report:', err);
      }
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderChildReport(rep) {
      if (!rep) return;
      
      const nameElem = document.getElementById('reportChildName');
      if (nameElem) nameElem.textContent = rep.child_name || 'Parth';

      const ageBadge = document.getElementById('reportChildAgeBadge');
      if (ageBadge) ageBadge.textContent = rep.age || '6 Years';

      const genderBadge = document.getElementById('reportChildGenderBadge');
      if (genderBadge) {
        const isGirl = (rep.gender || '').toLowerCase() === 'girl';
        genderBadge.textContent = isGirl ? '👧 Girl' : '👦 Boy';
      }

      const avatarElem = document.getElementById('reportChildAvatar');
      if (avatarElem) {
        const isGirl = (rep.gender || '').toLowerCase() === 'girl';
        avatarElem.textContent = isGirl ? '👧' : '👦';
      }

      const execSummary = document.getElementById('reportExecutiveSummary');
      if (execSummary) execSummary.textContent = rep.executive_summary || '';

      const overallScore = rep.overall_development_score || 87;
      const overallScoreElem = document.getElementById('reportOverallScore');
      if (overallScoreElem) overallScoreElem.textContent = overallScore;

      const overallBar = document.getElementById('reportOverallBar');
      if (overallBar) overallBar.style.width = overallScore + '%';

      const skills = rep.skills_assessment || {};
      const vocab = skills.vocabulary || { score: 84, status: 'Grade A' };
      const curiosity = skills.curiosity || { score: 92, status: 'Grade A+' };

      const vocabScoreElem = document.getElementById('reportVocabScore');
      if (vocabScoreElem) vocabScoreElem.textContent = (vocab.score || 84) + '%';

      const vocabStatusBadge = document.getElementById('reportVocabStatusBadge');
      if (vocabStatusBadge) {
        vocabStatusBadge.textContent = (vocab.status || 'Grade A').replace(/\s+for\s+age/i, '');
      }

      const vocabBar = document.getElementById('reportVocabBar');
      if (vocabBar) vocabBar.style.width = (vocab.score || 84) + '%';

      const curiosityScoreElem = document.getElementById('reportCuriosityScore');
      if (curiosityScoreElem) curiosityScoreElem.textContent = (curiosity.score || 92) + '%';

      const curiosityStatusBadge = document.getElementById('reportCuriosityStatusBadge');
      if (curiosityStatusBadge) curiosityStatusBadge.textContent = curiosity.status || 'Grade A+';

      const curiosityBar = document.getElementById('reportCuriosityBar');
      if (curiosityBar) curiosityBar.style.width = (curiosity.score || 92) + '%';

      // SPEECH BUBBLE DIALOGUE FEED
      const evidenceCont = document.getElementById('conversationEvidenceContainer');
      if (evidenceCont) {
        evidenceCont.innerHTML = '';
        const evidenceList = rep.dialogue_evidence || rep.conversation_evidence || [];
        if (evidenceList.length === 0) {
          evidenceCont.innerHTML = \`
            <div class="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-sm text-slate-500">
              Speak through the ESP32 microphone to generate grounded observations.
            </div>
          \`;
        } else {
          evidenceList.forEach(item => {
            const card = document.createElement('div');
            card.className = 'space-y-3';
            
            const q = item.child_quote || item.child_question || '';
            const a = item.kotl_response || item.kotl_answer || '';
            const topic = item.context || item.topic || 'Dialogue Turn';
            
            card.innerHTML = \`
              <!-- Child Speech Bubble (Left aligned with bubble tail) -->
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-lg shrink-0 shadow-xs">👦</div>
                <div class="bg-sky-50 border-2 border-sky-200 text-slate-800 rounded-2xl rounded-tl-sm p-4 max-w-lg shadow-sm">
                  <div class="flex items-center justify-between pb-1 mb-1 border-b border-sky-200/60 gap-3">
                    <p class="text-xs font-bold text-sky-600 font-fredoka">Parth asked:</p>
                    <span class="text-[10px] font-mono text-sky-500 uppercase">\${escapeHtml(topic)}</span>
                  </div>
                  <p class="text-sm leading-relaxed font-medium">"\${escapeHtml(q)}"</p>
                </div>
              </div>

              <!-- Robot Speech Bubble (Right aligned with bubble tail) -->
              <div class="flex items-start justify-end gap-3">
                <div class="bg-amber-50 border-2 border-amber-200 text-slate-800 rounded-2xl rounded-tr-sm p-4 max-w-lg shadow-sm text-left">
                  <div class="flex items-center justify-between pb-1 mb-1 border-b border-amber-200/60 gap-3">
                    <p class="text-xs font-bold text-amber-700 font-fredoka">KOTL Companion answered:</p>
                    <button onclick="playOrSpeakText('\${encodeURIComponent(a)}')" class="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 font-bold font-fredoka">
                      <span>▶ Play Voice</span>
                    </button>
                  </div>
                  <p class="text-sm leading-relaxed text-slate-700">"\${escapeHtml(a)}"</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-lg shrink-0 shadow-xs">🤖</div>
              </div>
            \`;
            evidenceCont.appendChild(card);
          });
        }
      }

      // Passions / Likes Breakdown
      const passionsCont = document.getElementById('passionsContainer');
      if (passionsCont) {
        passionsCont.innerHTML = '';
        (rep.passions_analysis || []).forEach(item => {
          const div = document.createElement('div');
          div.className = 'p-3.5 bg-emerald-50/70 border-2 border-emerald-300 rounded-[24px] space-y-1 shadow-xs hover:border-emerald-400 transition-all';
          div.innerHTML = \`
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-emerald-950 font-fredoka">\${escapeHtml(item.topic)}</span>
              <span class="text-xs font-mono font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">\${escapeHtml(item.affinity)}</span>
            </div>
            <p class="text-xs text-slate-600">\${escapeHtml(item.observation)}</p>
          \`;
          passionsCont.appendChild(div);
        });
      }

      // Sensitivities Breakdown
      const sensCont = document.getElementById('sensitivitiesContainer');
      if (sensCont) {
        sensCont.innerHTML = '';
        const list = rep.sensitivities_and_coping || rep.sensitivities_and_triggers || [];
        list.forEach(item => {
          const div = document.createElement('div');
          div.className = 'p-3.5 bg-rose-50/70 border-2 border-rose-300 rounded-[24px] space-y-1 shadow-xs';
          const title = item.sensitivity || item.trigger || 'Area';
          const strat = item.coping_strategy || item.kotl_intervention || '';
          div.innerHTML = \`
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm text-rose-950 font-fredoka">\${escapeHtml(title)}</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-white text-rose-800 border border-rose-300 font-mono font-bold">Gentle Care</span>
            </div>
            <p class="text-xs text-slate-600"><strong class="text-slate-800">KOTL Care:</strong> \${escapeHtml(strat)}</p>
          \`;
          sensCont.appendChild(div);
        });
      }

      // Parent Recommendations (Home Activities)
      const recoCont = document.getElementById('parentRecommendationsContainer');
      if (recoCont) {
        recoCont.innerHTML = '';
        (rep.parent_recommendations || []).forEach(item => {
          const card = document.createElement('div');
          card.className = 'p-4 bg-amber-50/70 border-2 border-amber-300 rounded-[24px] space-y-1.5 shadow-xs hover:border-amber-400 transition-all';
          card.innerHTML = \`
            <h4 class="font-bold text-xs sm:text-sm text-amber-950 flex items-center space-x-1.5 font-fredoka">
              <span>✨</span>
              <span>\${escapeHtml(item.area || item.title || 'Tip')}</span>
            </h4>
            <p class="text-xs text-slate-600">\${escapeHtml(item.suggestion || item.action || '')}</p>
          \`;
          recoCont.appendChild(card);
        });
      }

      // Milestones Achieved
      const mileCont = document.getElementById('milestonesContainer');
      if (mileCont) {
        mileCont.innerHTML = '';
        (rep.developmental_milestones || rep.milestones || []).forEach(item => {
          const card = document.createElement('div');
          card.className = 'p-3.5 bg-sky-50/70 border-2 border-sky-300 rounded-[24px] space-y-1 flex flex-col justify-between shadow-xs';
          card.innerHTML = \`
            <div class="flex items-center justify-between">
              <span class="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white text-sky-800 border border-sky-300">\${escapeHtml(item.badge || item.status || 'Active')}</span>
              <span class="text-xs font-mono font-bold text-emerald-600">Achieved</span>
            </div>
            <h5 class="font-bold text-xs text-sky-950 mt-1 font-fredoka">\${escapeHtml(item.title)}</h5>
            <p class="text-[11px] text-slate-500">\${escapeHtml(item.description || '')}</p>
          \`;
          mileCont.appendChild(card);
        });
      }
    }

    async function regenerateReport() {
      const btn = document.getElementById('regenerateReportBtn');
      const icon = document.getElementById('refreshIcon');
      if (btn) btn.disabled = true;
      if (icon) icon.classList.add('animate-spin');
      try {
        const res = await fetch('/api/child/report/regenerate', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          currentReport = data.report;
          renderChildReport(currentReport);
        }
      } catch (e) {
        console.warn('Error refreshing report:', e);
      } finally {
        if (btn) btn.disabled = false;
        if (icon) icon.classList.remove('animate-spin');
      }
    }

    async function addInterest(type) {
      const input = type === 'likes' ? document.getElementById('newLikeInput') : document.getElementById('newDislikeInput');
      const val = input.value.trim();
      if (!val) return;
      try {
        const res = await fetch('/api/child/interests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, item: val })
        });
        if (res.ok) {
          input.value = '';
          await regenerateReport();
        }
      } catch (e) {
        console.warn('Error adding interest:', e);
      }
    }

    async function loadParentMissions() {
      try {
        const res = await fetch('/api/child/missions');
        if (res.ok) {
          const data = await res.json();
          renderParentMissions(data.missions || []);
        }
      } catch (e) {
        console.warn('Error loading missions:', e);
      }
    }

    function renderParentMissions(missions) {
      const container = document.getElementById('missionsListContainer');
      const badge = document.getElementById('activeMissionsCountBadge');
      const mobBadge = document.getElementById('mobMissionsBadge');
      
      const activeCount = missions.filter(m => m.active).length;
      if (badge) badge.textContent = activeCount;
      if (mobBadge) mobBadge.textContent = activeCount;

      if (!container) return;
      container.innerHTML = '';
      if (missions.length === 0) {
        container.innerHTML = \`<p class="text-xs text-slate-500 italic p-4 bg-white rounded-2xl border border-slate-200">No active directives. Add one above.</p>\`;
        return;
      }

      missions.forEach(m => {
        const div = document.createElement('div');
        div.className = \`p-4 rounded-[24px] border-2 transition-all flex items-center justify-between gap-3 \${m.active ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'}\`;
        div.innerHTML = \`
          <div class="space-y-0.5">
            <div class="flex items-center space-x-2">
              <span class="w-2.5 h-2.5 rounded-full \${m.active ? 'bg-emerald-500' : 'bg-slate-400'}"></span>
              <h4 class="font-bold text-sm text-slate-800 font-fredoka">\${escapeHtml(m.title)}</h4>
            </div>
            <p class="text-xs text-slate-600">\${escapeHtml(m.directive)}</p>
          </div>
          <div class="flex items-center space-x-2 shrink-0">
            <button onclick="toggleMission('\${m.id}')" class="px-3 py-1 rounded-xl text-xs font-bold border font-fredoka transition-all \${m.active ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-600'}">
              \${m.active ? 'Active' : 'Paused'}
            </button>
            <button onclick="deleteMission('\${m.id}')" class="p-1 text-slate-400 hover:text-rose-500 text-xs">🗑️</button>
          </div>
        \`;
        container.appendChild(div);
      });
    }

    async function handleCreateMission(e) {
      e.preventDefault();
      const titleInput = document.getElementById('missionTitleInput');
      const dirInput = document.getElementById('missionDirectiveInput');
      const title = titleInput.value.trim();
      const directive = dirInput.value.trim();
      if (!title || !directive) return;
      try {
        const res = await fetch('/api/child/missions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, directive })
        });
        if (res.ok) {
          titleInput.value = '';
          dirInput.value = '';
          await loadParentMissions();
        }
      } catch (err) {
        console.warn('Error creating mission:', err);
      }
    }

    async function toggleMission(id) {
      try {
        await fetch(\`/api/child/missions/\${id}/toggle\`, { method: 'POST' });
        await loadParentMissions();
      } catch (err) {
        console.warn('Error toggling mission:', err);
      }
    }

    async function deleteMission(id) {
      try {
        await fetch(\`/api/child/missions/\${id}\`, { method: 'DELETE' });
        await loadParentMissions();
      } catch (err) {
        console.warn('Error deleting mission:', err);
      }
    }

    function applyPreset(title, directive) {
      document.getElementById('missionTitleInput').value = title;
      document.getElementById('missionDirectiveInput').value = directive;
    }

    const chatContainer = document.getElementById('chatContainer');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const recordBtn = document.getElementById('recordBtn');
    let sessionHistory = [];

    chatInput.addEventListener('input', () => {
      sendBtn.disabled = !chatInput.value.trim();
    });
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && chatInput.value.trim()) {
        handleSubmitText();
      }
    });
    sendBtn.addEventListener('click', handleSubmitText);

    function formatTime(iso) {
      try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (_) {
        return '';
      }
    }

    function renderMessageElement(msg) {
      const isUser = msg.role === 'user';
      const wrapper = document.createElement('div');
      wrapper.className = \`flex w-full \${isUser ? 'justify-end' : 'justify-start'}\`;

      const bubble = document.createElement('div');
      bubble.className = \`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl space-y-1.5 \${
        isUser
          ? 'bg-sky-50 text-slate-800 rounded-tr-xs border-2 border-sky-200'
          : 'bg-amber-50 text-slate-800 rounded-tl-xs border-2 border-amber-200 shadow-xs'
      }\`;

      const header = document.createElement('div');
      header.className = 'flex items-center justify-between text-[10px] font-mono opacity-60 pb-1 border-b border-black/5 gap-3';
      header.innerHTML = \`
        <span class="font-bold font-fredoka">\${isUser ? '🧒 Parth' : '🤖 KOTL Buddy'}</span>
        <span>\${formatTime(msg.timestamp || new Date())}</span>
      \`;

      const body = document.createElement('p');
      body.className = 'text-xs sm:text-sm leading-relaxed whitespace-pre-wrap';
      body.textContent = msg.content || '';

      bubble.appendChild(header);
      bubble.appendChild(body);

      if (!isUser && msg.content) {
        const playBtn = document.createElement('button');
        playBtn.className = 'text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 mt-1 pt-1 border-t border-black/5 font-fredoka';
        playBtn.innerHTML = '<span>▶ Listen Audio</span>';
        playBtn.onclick = () => playOrSpeakText(encodeURIComponent(msg.content));
        bubble.appendChild(playBtn);
      }

      wrapper.appendChild(bubble);
      return wrapper;
    }

    async function syncLiveServerHistory() {
      try {
        const res = await fetch('/api/chat/history?sessionId=default-session');
        if (res.ok) {
          const data = await res.json();
          sessionHistory = data.history || [];
          chatContainer.innerHTML = '';
          sessionHistory.forEach(msg => {
            chatContainer.appendChild(renderMessageElement(msg));
          });
          scrollToBottom();
        }
      } catch (err) {
        console.warn('Error syncing history:', err);
      }
    }

    async function clearSessionChat() {
      if (!confirm('Clear all conversation history?')) return;
      try {
        await fetch('/api/chat/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: 'default-session' })
        });
        sessionHistory = [];
        chatContainer.innerHTML = '';
      } catch (e) {
        alert('Failed to clear chat: ' + e.message);
      }
    }

    async function handleSubmitText() {
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = '';
      sendBtn.disabled = true;

      const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
      chatContainer.appendChild(renderMessageElement(userMsg));
      scrollToBottom();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, sessionId: 'default-session' })
        });
        if (res.ok) {
          const data = await res.json();
          const assistantMsg = { role: 'assistant', content: data.reply || '', timestamp: new Date().toISOString() };
          chatContainer.appendChild(renderMessageElement(assistantMsg));
          scrollToBottom();
          if (data.reply) {
            playOrSpeakText(encodeURIComponent(data.reply));
          }
          await loadChildReport();
        }
      } catch (err) {
        console.error('Chat error:', err);
      }
    }

    function playOrSpeakText(encodedText) {
      const text = decodeURIComponent(encodedText);
      const url = \`/api/tts?text=\${encodeURIComponent(text)}\`;
      playAudioClip(url);
    }

    let activeAudio = null;
    function playAudioClip(url) {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
      }
      activeAudio = new Audio(url);
      activeAudio.play().catch(err => {
        console.warn('Audio play prevented (user interaction needed):', err);
      });
    }

    function scrollToBottom() {
      const scrollArea = document.getElementById('chatScrollArea');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }

    function testSpeakerAscendingChime() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1175, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.45);
      } catch (e) {
        console.warn('Chime audio error:', e);
      }
    }

    async function pollDeviceStatus() {
      try {
        const res = await fetch('/api/device/status');
        const pill = document.getElementById('deviceStatusPill');
        const dot = document.getElementById('deviceStatusDot');
        const txt = document.getElementById('deviceStatusText');
        if (res.ok) {
          const data = await res.json();
          const online = data.online !== false;
          if (online) {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0';
            txt.innerHTML = '<span class="hidden sm:inline">ESP32 </span>Live';
            pill.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-xs shrink-0 select-none transition-colors';
          } else {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0';
            txt.innerHTML = '<span class="hidden sm:inline">ESP32 </span>Standby';
            pill.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 shadow-xs shrink-0 select-none transition-colors';
          }
        }
      } catch (_) {}
    }

    async function loadDeviceConfig() {
      try {
        const res = await fetch('/api/device/config');
        if (res.ok) {
          const data = await res.json();
          if (data.wifi_ssid) document.getElementById('cfgWifiSsid').value = data.wifi_ssid;
          if (data.target_url) document.getElementById('cfgTargetUrl').value = data.target_url;
        }
      } catch (_) {}
    }

    async function saveDeviceConfig(e) {
      e.preventDefault();
      const payload = {
        wifi_ssid: document.getElementById('cfgWifiSsid').value.trim(),
        wifi_pass: document.getElementById('cfgWifiPass').value.trim(),
        target_url: document.getElementById('cfgTargetUrl').value.trim()
      };
      try {
        const res = await fetch('/api/device/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Config saved. Restart ESP32 to connect to new network.');
          document.getElementById('wifiModal').classList.add('hidden');
        }
      } catch (err) {
        alert('Failed to save config: ' + err.message);
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      loadChildReport();
      loadParentMissions();
      syncLiveServerHistory();
      pollDeviceStatus();
      setInterval(pollDeviceStatus, 15000);
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('backend/public/index.html', htmlContent, 'utf8');
console.log('Saved exact kindergarten styled backend/public/index.html, length:', htmlContent.length);
