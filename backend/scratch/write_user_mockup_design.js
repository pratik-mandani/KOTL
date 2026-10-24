const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>KOTL Kids • Kindergarten Growth & Intelligence Dashboard</title>
  
  <!-- Playful Preschool Fonts: Fredoka & Nunito -->
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
    
    /* Toggle switch slider */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #CBD5E1;
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 24px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    input:checked + .toggle-slider-emerald {
      background-color: #34D399;
    }
    input:checked + .toggle-slider-amber {
      background-color: #FBBF24;
    }
    input:checked + .toggle-slider-sky {
      background-color: #38BDF8;
    }
    input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    /* Paperclip decoration */
    .paperclip-clip {
      position: absolute;
      top: -12px;
      right: 24px;
      width: 22px;
      height: 48px;
      border: 3px solid #94A3B8;
      border-radius: 12px 12px 6px 6px;
      background: transparent;
      box-shadow: 1px 2px 4px rgba(0,0,0,0.1);
      pointer-events: none;
      z-index: 20;
    }

    /* Floating micro animations */
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
<body class="h-screen flex flex-col antialiased select-none md:select-auto bg-[#F8FAFC] relative font-nunito">

  <!-- Micro-Decorations across White Margins (Airplanes, Rainbows, Stars, Pencils) -->
  <div class="kindergarten-doodles pointer-events-none fixed inset-0 overflow-hidden select-none z-0">
    <!-- Top-Left Floating Paper Airplane with Dashed Trail -->
    <div class="absolute top-6 left-8 animate-float opacity-80">
      <svg width="80" height="60" viewBox="0 0 100 80" fill="none" class="w-16 h-12">
        <path d="M 5 65 C 25 30 45 70 65 40 C 75 25 85 30 90 25" stroke="#70B6F6" stroke-width="2" stroke-dasharray="4 4" fill="none" />
        <g transform="translate(65, 10) rotate(-10)">
          <polygon points="35,18 0,0 10,16" fill="#FFFFFF" stroke="#38BDF8" stroke-width="2" stroke-linejoin="round" />
          <polygon points="35,18 10,16 8,24" fill="#E0F2FE" stroke="#38BDF8" stroke-width="2" stroke-linejoin="round" />
          <polygon points="35,18 10,16 0,36" fill="#BAE6FD" stroke="#38BDF8" stroke-width="2" stroke-linejoin="round" />
        </g>
      </svg>
    </div>

    <!-- Top-Right Mini Rainbow -->
    <div class="absolute top-6 right-10 animate-float opacity-75">
      <svg width="70" height="50" viewBox="0 0 80 50" fill="none" class="w-14 h-10">
        <path d="M 10 45 C 10 20 70 20 70 45" stroke="#F48FB1" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 18 45 C 18 26 62 26 62 45" stroke="#FFB703" stroke-width="3" stroke-linecap="round" fill="none" />
        <path d="M 26 45 C 26 32 54 32 54 45" stroke="#70B6F6" stroke-width="3" stroke-linecap="round" fill="none" />
      </svg>
    </div>

    <!-- Scattered Outline Stars -->
    <div class="absolute top-32 left-1/4 opacity-60"><span class="text-xl text-[#FFB703]">⭐</span></div>
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
    <section id="viewReport" class="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 custom-scrollbar max-w-7xl mx-auto w-full">
      
      <!-- 3-COLUMN RESPONSIVE LAYOUT (Exact Match to User Mockup Image) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- ======================================================== -->
        <!-- COLUMN 1: Profile Cloud, 4 Metric Tiles, Mini Toggle Card -->
        <!-- ======================================================== -->
        <div class="lg:col-span-4 space-y-5">
          
          <!-- TOP PROFILE HEADER (Organic Scalloped Cloud Card with Rosette Badge) -->
          <div class="relative bg-[#FFFDF7] border-2 border-amber-300 rounded-[36px] p-6 shadow-[0_10px_25px_rgba(251,191,36,0.12)] flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <!-- Rounded squircle avatar in vivid blue -->
              <div id="reportChildAvatar" class="w-16 h-16 rounded-2xl bg-[#2563EB] border-2 border-white flex items-center justify-center text-3xl shadow-md shrink-0">
                👦
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 id="reportChildName" class="text-2xl font-bold font-fredoka text-slate-800">Parth</h1>
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-300 flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live
                  </span>
                </div>
                <p id="reportChildAgeBadge" class="text-slate-700 font-bold text-sm mt-0.5 font-fredoka">6 Years</p>
                <p class="text-slate-500 text-xs">Class: <strong class="text-slate-700">Sr. KG</strong> • <span class="font-bold text-sky-600">KOTL Buddy</span></p>
                <button onclick="openProfileModal()" class="mt-1.5 text-[11px] px-2.5 py-0.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold flex items-center gap-1 shadow-2xs font-fredoka">
                  <span>⚙️ Rules</span>
                </button>
              </div>
            </div>

            <!-- Ruffled Rosette Stamp Badge: Grade A+ (87/100) -->
            <div class="w-22 h-22 rounded-full border-4 border-dashed border-amber-400 bg-gradient-to-br from-amber-400 to-orange-500 text-white flex flex-col items-center justify-center text-center shadow-md shrink-0 font-fredoka">
              <span class="text-[9px] uppercase tracking-wider font-semibold opacity-90">Grade</span>
              <span class="text-2xl font-black leading-none my-0.5">A+</span>
              <span class="text-[10px] font-medium opacity-90">(87/100)</span>
            </div>
          </div>

          <!-- 4 CHUNKY COLORFUL METRIC TILES -->
          <div class="grid grid-cols-2 gap-3.5">
            
            <!-- Tile 1: Overall Star (Sky Blue fill) -->
            <div class="bg-[#E0F2FE] border-2 border-[#70B6F6] rounded-[26px] p-4 text-center shadow-xs flex flex-col justify-between">
              <span class="text-xs font-bold text-sky-700 uppercase font-fredoka">Overall Star</span>
              <div class="text-2xl font-extrabold font-fredoka text-sky-900 my-1">
                <span id="reportOverallScore">87</span><span class="text-xs text-sky-600">/100</span>
              </div>
              <div class="w-full bg-sky-200/80 h-2 rounded-full overflow-hidden mt-1">
                <div id="reportOverallBar" class="bg-sky-500 h-full rounded-full transition-all duration-500" style="width: 87%"></div>
              </div>
            </div>

            <!-- Tile 2: English (Amber fill) -->
            <div class="bg-[#FEF3C7] border-2 border-[#FBBF24] rounded-[26px] p-4 text-center shadow-xs flex flex-col justify-between">
              <span class="text-xs font-bold text-amber-700 uppercase font-fredoka">English</span>
              <div id="reportVocabScore" class="text-2xl font-extrabold font-fredoka text-amber-900 my-1">84%</div>
              <div class="w-full bg-amber-200/80 h-2 rounded-full overflow-hidden mt-1">
                <div id="reportVocabBar" class="bg-amber-500 h-full rounded-full transition-all duration-500" style="width: 84%"></div>
              </div>
            </div>

            <!-- Tile 3: Space (Mint fill) -->
            <div class="bg-[#DCFCE7] border-2 border-[#4ADE80] rounded-[26px] p-4 text-center shadow-xs flex flex-col justify-between">
              <span class="text-xs font-bold text-emerald-700 uppercase font-fredoka">Space</span>
              <div id="reportCuriosityScore" class="text-2xl font-extrabold font-fredoka text-emerald-900 my-1">92%</div>
              <div class="w-full bg-emerald-200/80 h-2 rounded-full overflow-hidden mt-1">
                <div id="reportCuriosityBar" class="bg-emerald-500 h-full rounded-full transition-all duration-500" style="width: 92%"></div>
              </div>
            </div>

            <!-- Tile 4: Good Habits (Teal fill) -->
            <div class="bg-[#E6FFFA] border-2 border-[#2DD4BF] rounded-[26px] p-4 text-center shadow-xs flex flex-col justify-between">
              <span class="text-xs font-bold text-teal-700 uppercase font-fredoka">Good Habits</span>
              <div id="reportMissionsKpi" class="text-2xl font-extrabold font-fredoka text-teal-900 my-1">
                3<span class="text-xs text-teal-600">/6</span>
              </div>
              <div class="w-full bg-teal-200/80 h-2 rounded-full overflow-hidden mt-1">
                <div class="bg-teal-500 h-full rounded-full" style="width: 50%"></div>
              </div>
            </div>

          </div>

          <!-- MINI HABIT TOGGLES (As shown in bottom-left of user mockup) -->
          <div class="space-y-2.5">
            <div class="p-3.5 rounded-[22px] bg-[#E0F2FE] border-2 border-[#70B6F6] flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">⭐</span>
                <div>
                  <div class="text-xs font-bold text-sky-950 font-fredoka">Spoken English & Words</div>
                  <div class="text-[10px] text-sky-700">Fluent pronunciation practice</div>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider toggle-slider-sky"></span>
              </label>
            </div>

            <div class="p-3.5 rounded-[22px] bg-[#FEF3C7] border-2 border-[#FBBF24] flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">🥛</span>
                <div>
                  <div class="text-xs font-bold text-amber-950 font-fredoka">Clean Water & Milk</div>
                  <div class="text-[10px] text-amber-700">Healthy hydration all day</div>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider toggle-slider-amber"></span>
              </label>
            </div>

            <div class="p-3.5 rounded-[22px] bg-[#DCFCE7] border-2 border-[#4ADE80] flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-2.5">
                <span class="text-lg">🥗</span>
                <div>
                  <div class="text-xs font-bold text-emerald-950 font-fredoka">Eating Veggies & Fruits</div>
                  <div class="text-[10px] text-emerald-700">Superhero stamina fuel</div>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider toggle-slider-emerald"></span>
              </label>
            </div>
          </div>

          <!-- REALISTIC COMPANION REMARK NOTEPAD WITH PAPERCLIP 📎 -->
          <div class="relative bg-[#FFFDF0] border-2 border-slate-300 rounded-[28px] p-6 shadow-md space-y-3">
            <div class="paperclip-clip"></div>
            
            <div class="flex items-center gap-2 border-b border-amber-200 pb-2">
              <span class="text-xl">📝</span>
              <h3 class="font-bold text-base text-slate-800 font-fredoka">Companion Remark</h3>
            </div>
            
            <p id="reportExecutiveSummary" class="text-xs text-slate-700 leading-relaxed font-nunito">
              Parth demonstrates exceptional inquisitiveness, bright verbal enthusiasm, and a joyful spirit during conversations with KOTL. He shows strong memory retention when talking about Space, Stars, and Creative Art. He grasps English vocabulary quickly, asks thoughtful questions, and is eagerly developing good daily habits like tidying up his toys and brushing his teeth.
            </p>

            <div class="pt-2 flex flex-wrap gap-2 text-xs font-fredoka">
              <span class="px-2.5 py-1 rounded-xl bg-white border border-sky-300 text-sky-800 font-bold shadow-2xs">🚀 Space Explorer</span>
              <span class="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-amber-800 font-bold shadow-2xs">🎨 Creative</span>
              <span class="px-2.5 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold shadow-2xs">🤝 Well Mannered</span>
            </div>
          </div>

        </div>

        <!-- ======================================================== -->
        <!-- COLUMN 2: Wavy Subject Banner Cards & Speech Bubble Chat -->
        <!-- ======================================================== -->
        <div class="lg:col-span-4 space-y-5">

          <!-- 4 WAVY / SCALLOPED SUBJECT PROGRESS CARDS -->
          <div class="space-y-3.5">
            
            <!-- Card 1: Spoken English & Words (Blue) -->
            <div class="bg-[#DDF2FD] border-2 border-[#70B6F6] rounded-[24px] p-4 shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">⭐</span>
                  <div>
                    <h4 class="font-bold text-sm text-sky-950 font-fredoka">Spoken English & Words</h4>
                    <span class="text-xs font-mono font-bold text-sky-800">87 / 100</span>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-300 text-xs font-bold font-fredoka shrink-0">
                  Grade A • Fluent
                </span>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">Parental remarks: Expresses thoughts clearly and with natural 2-3 syllable vocabulary.</p>
            </div>

            <!-- Card 2: Science, Space & Curiosity (Orange / Amber) -->
            <div class="bg-[#FFE6C2] border-2 border-[#FB923C] rounded-[24px] p-4 shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">⭐</span>
                  <div>
                    <h4 class="font-bold text-sm text-amber-950 font-fredoka">Science, Space & Curiosity</h4>
                    <span class="text-xs font-mono font-bold text-amber-800">95 / 100</span>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-white text-emerald-700 border border-emerald-300 text-xs font-bold font-fredoka shrink-0">
                  Grade A+ • Curious
                </span>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">Curious remarks: Keen engagement to explore astronomy, rocket physics, and stars.</p>
            </div>

            <!-- Card 3: Good Habits & Politeness (Mint Green) -->
            <div class="bg-[#D7F7E6] border-2 border-[#4ADE80] rounded-[24px] p-4 shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">⭐</span>
                  <div>
                    <h4 class="font-bold text-sm text-emerald-950 font-fredoka">Good Habits & Politeness</h4>
                    <span class="text-xs font-mono font-bold text-emerald-800">95 / 100</span>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-white text-orange-600 border border-orange-300 text-xs font-bold font-fredoka shrink-0">
                  Grade A
                </span>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">Companion remarks: Polite turn-taking, respectful manners, and active toy organizing routine.</p>
            </div>

            <!-- Card 4: Creativity & Studies (Periwinkle Blue) -->
            <div class="bg-[#DBEAFE] border-2 border-[#60A5FA] rounded-[24px] p-4 shadow-xs flex flex-col justify-between space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">⭐</span>
                  <div>
                    <h4 class="font-bold text-sm text-blue-950 font-fredoka">Creativity & Studies</h4>
                    <span class="text-xs font-mono font-bold text-blue-800">95 / 100</span>
                  </div>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-white text-orange-600 border border-orange-300 text-xs font-bold font-fredoka shrink-0">
                  Grade A+
                </span>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">Story habits: Loves drawing spacecraft designs, vibrant colors, and bedtime moral tales.</p>
            </div>

          </div>

          <!-- RECENT DIALOGUE (Exact Speech Bubble Layout from User Image) -->
          <div class="bg-white border-2 border-slate-200 rounded-[28px] p-5 shadow-sm space-y-3.5">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 class="text-base font-bold font-fredoka text-slate-800">Recent Dialogue</h3>
                <p class="text-[11px] text-slate-500">Spoken turns served from live ESP32 microphone</p>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-300">
                Audio Live
              </span>
            </div>

            <div id="conversationEvidenceContainer" class="space-y-3.5">
              
              <!-- Turn 1: Child Bubble (Left aligned with tail & circular orange Play button) -->
              <div class="flex items-start gap-2.5">
                <div class="w-9 h-9 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sm shrink-0 shadow-2xs">👦</div>
                <div class="bg-[#E0F2FE] border-2 border-[#BAE6FD] text-slate-800 rounded-2xl rounded-tl-none p-3.5 flex-1 shadow-xs flex items-center justify-between gap-2">
                  <div>
                    <p class="text-[10px] font-bold text-sky-700 font-fredoka uppercase">Parth</p>
                    <p class="text-xs leading-relaxed font-medium mt-0.5">"KOTL, how do stars shine at night, and can we fly a rocket to the moon?"</p>
                  </div>
                  <button onclick="playOrSpeakText('KOTL, how do stars shine at night, and can we fly a rocket to the moon?')" class="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 hover:bg-orange-600 shadow-xs" title="Play Voice">
                    <span class="text-xs ml-0.5">▶</span>
                  </button>
                </div>
              </div>

              <!-- Turn 2: KOTL Robot Bubble (Right aligned with tail & Audio Play pill) -->
              <div class="flex items-start justify-end gap-2.5">
                <div class="bg-[#DCFCE7] border-2 border-[#BBF7D0] text-slate-800 rounded-2xl rounded-tr-none p-3.5 flex-1 shadow-xs text-left">
                  <div class="flex items-center justify-between pb-1 mb-1 border-b border-emerald-200/60">
                    <p class="text-[10px] font-bold text-emerald-800 font-fredoka uppercase">KOTL Robot</p>
                    <button onclick="playOrSpeakText('Stars are giant glowing suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!')" class="text-[10px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold font-fredoka bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                      <span>🔊 Audio Play</span>
                    </button>
                  </div>
                  <p class="text-xs leading-relaxed text-slate-700">"Stars are giant glowing suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!"</p>
                </div>
                <div class="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-sm shrink-0 shadow-2xs">🤖</div>
              </div>

              <!-- Turn 3: Child Bubble Follow-up -->
              <div class="flex items-start gap-2.5">
                <div class="w-9 h-9 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sm shrink-0 shadow-2xs">👦</div>
                <div class="bg-[#E0F2FE] border-2 border-[#BAE6FD] text-slate-800 rounded-2xl rounded-tl-none p-3.5 flex-1 shadow-xs flex items-center justify-between gap-2">
                  <div>
                    <p class="text-[10px] font-bold text-sky-700 font-fredoka uppercase">Parth</p>
                    <p class="text-xs leading-relaxed font-medium mt-0.5">"Stars are glowing suns wish to rest, and sparks with its powerful energy!"</p>
                  </div>
                  <button onclick="playOrSpeakText('Stars are glowing suns wish to rest, and sparks with its powerful energy!')" class="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 hover:bg-orange-600 shadow-xs" title="Play Voice">
                    <span class="text-xs ml-0.5">▶</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- ======================================================== -->
        <!-- COLUMN 3: Habits Tracker, Affinity Cards, Parent Tips   -->
        <!-- ======================================================== -->
        <div class="lg:col-span-4 space-y-5">

          <!-- HABITS TRACKER SECTION (Top-Right in user mockup) -->
          <div class="space-y-3">
            <div>
              <h3 class="text-base font-bold font-fredoka text-slate-800">Habits Tracker</h3>
              <p class="text-xs text-slate-500">Top mark centers and options for check-list</p>
            </div>

            <!-- Brushing teeth (green) -->
            <div class="p-3.5 rounded-[22px] bg-[#D7F7E6] border-2 border-[#4ADE80] flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-2.5">
                <input type="checkbox" checked class="w-4 h-4 text-emerald-600 rounded">
                <div>
                  <div class="text-xs font-bold text-emerald-950 font-fredoka">Brushing teeth</div>
                  <div class="text-[10px] text-emerald-700">Morning & night routine</div>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider toggle-slider-emerald"></span>
              </label>
            </div>

            <!-- Clean water (amber) -->
            <div class="p-3.5 rounded-[22px] bg-[#FFE6C2] border-2 border-[#FB923C] flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-2.5">
                <input type="checkbox" checked class="w-4 h-4 text-amber-600 rounded">
                <div>
                  <div class="text-xs font-bold text-amber-950 font-fredoka">Clean water</div>
                  <div class="text-[10px] text-amber-700">Healthy hydration all day</div>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider toggle-slider-amber"></span>
              </label>
            </div>

            <!-- Eating spinach (green) -->
            <div class="p-3.5 rounded-[22px] bg-[#D7F7E6] border-2 border-[#4ADE80] flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-2.5">
                <input type="checkbox" checked class="w-4 h-4 text-emerald-600 rounded">
                <div>
                  <div class="text-xs font-bold text-emerald-950 font-fredoka">Eating spinach & veggies</div>
                  <div class="text-[10px] text-emerald-700">Superhero stamina energy</div>
                </div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" checked>
                <span class="toggle-slider toggle-slider-emerald"></span>
              </label>
            </div>
          </div>

          <!-- AFFINITY CARDS (Scalloped Organic Cards with Mascot Doodles) -->
          <div class="space-y-3">
            <div>
              <h3 class="text-base font-bold font-fredoka text-slate-800">Affinity cards</h3>
              <p class="text-xs text-slate-500">Scalloped asymmetrical curiosity cards</p>
            </div>

            <!-- Card 1: Animal & Nature Science (Terracotta/Peach with Cute Lion Doodle 🦁) -->
            <div class="bg-[#FFEDD5] border-2 border-[#FB923C] rounded-[28px] p-5 shadow-xs relative overflow-hidden space-y-2">
              <div class="flex items-start justify-between">
                <!-- Cute Mascot Doodle 🦁 -->
                <div class="w-10 h-10 rounded-2xl bg-white border border-amber-300 flex items-center justify-center text-xl shadow-xs">
                  🦁
                </div>
                <!-- Science Atom Icon -->
                <span class="text-lg opacity-75">⚛️</span>
              </div>
              <h4 class="font-bold text-base text-amber-950 font-fredoka">Animal & Nature Science</h4>
              <p class="text-xs text-slate-700 leading-relaxed">
                Displays lively fascination for wildlife habitats, lion prides, and natural wonders with deep observation.
              </p>
            </div>

            <!-- Card 2: Space Exploration (Cloud Blue with Rocket Doodle 🚀) -->
            <div class="bg-[#E0F2FE] border-2 border-[#38BDF8] rounded-[28px] p-5 shadow-xs relative overflow-hidden space-y-2">
              <div class="flex items-start justify-between">
                <!-- Cute Rocket Mascot Doodle 🚀 -->
                <div class="w-10 h-10 rounded-2xl bg-white border border-sky-300 flex items-center justify-center text-xl shadow-xs">
                  🚀
                </div>
                <!-- Orbit Icon -->
                <span class="text-lg opacity-75">🪐</span>
              </div>
              <h4 class="font-bold text-base text-sky-950 font-fredoka">Space Exploration</h4>
              <p class="text-xs text-slate-700 leading-relaxed">
                Fascinated by planetary orbits, astronauts floating in zero gravity, and rocket missions to touch the stars.
              </p>
            </div>

            <div id="passionsContainer" class="hidden"></div>
          </div>

          <!-- BOTTOM SECTION: Parent Action Tips & Milestones Achieved -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            <!-- Parent Action Tips (Lightbulb) -->
            <div class="bg-amber-50 border-2 border-amber-300 rounded-[24px] p-4 shadow-xs space-y-2">
              <div class="flex items-center gap-1.5 border-b border-amber-200 pb-1.5">
                <span class="text-base">💡</span>
                <h4 class="font-bold text-xs text-amber-950 font-fredoka">Parent Action Tips</h4>
              </div>
              <div id="parentRecommendationsContainer" class="space-y-2">
                <div class="bg-white p-2.5 rounded-xl border border-amber-200">
                  <p class="text-[10px] font-bold text-amber-900 font-fredoka">Superhero Fuel Game</p>
                  <p class="text-[10px] text-slate-600 mt-0.5">Serve crunchy carrots & fruit snacks as superhero power-ups.</p>
                </div>
                <div class="bg-white p-2.5 rounded-xl border border-amber-200">
                  <p class="text-[10px] font-bold text-amber-900 font-fredoka">5-Min Sky Routine</p>
                  <p class="text-[10px] text-slate-600 mt-0.5">Spend 5 quiet minutes observing moon and stars before bed.</p>
                </div>
              </div>
            </div>

            <!-- Milestones Achieved (Star) -->
            <div class="bg-amber-50/70 border-2 border-amber-300 rounded-[24px] p-4 shadow-xs space-y-2">
              <div class="flex items-center gap-1.5 border-b border-amber-200 pb-1.5">
                <span class="text-base">⭐</span>
                <h4 class="font-bold text-xs text-amber-950 font-fredoka">Milestones Achieved</h4>
              </div>
              <div id="milestonesContainer" class="grid grid-cols-2 gap-1.5">
                <div class="bg-white p-2 rounded-xl border border-amber-200 text-center">
                  <span class="text-[9px] font-bold text-emerald-600 block">Achieved</span>
                  <p class="text-[10px] font-bold text-slate-800 font-fredoka mt-0.5">50+ Words</p>
                </div>
                <div class="bg-white p-2 rounded-xl border border-amber-200 text-center">
                  <span class="text-[9px] font-bold text-emerald-600 block">Achieved</span>
                  <p class="text-[10px] font-bold text-slate-800 font-fredoka mt-0.5">20+ Inquiries</p>
                </div>
                <div class="bg-white p-2 rounded-xl border border-amber-200 text-center">
                  <span class="text-[9px] font-bold text-amber-600 block">In Progress</span>
                  <p class="text-[10px] font-bold text-slate-800 font-fredoka mt-0.5">Eat Veggies</p>
                </div>
                <div class="bg-white p-2 rounded-xl border border-amber-200 text-center">
                  <span class="text-[9px] font-bold text-emerald-600 block">Achieved</span>
                  <p class="text-[10px] font-bold text-slate-800 font-fredoka mt-0.5">9 PM Bedtime</p>
                </div>
              </div>
            </div>

          </div>

          <div id="sensitivitiesContainer" class="hidden"></div>
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

      const vocabBar = document.getElementById('reportVocabBar');
      if (vocabBar) vocabBar.style.width = (vocab.score || 84) + '%';

      const curiosityScoreElem = document.getElementById('reportCuriosityScore');
      if (curiosityScoreElem) curiosityScoreElem.textContent = (curiosity.score || 92) + '%';

      const curiosityBar = document.getElementById('reportCuriosityBar');
      if (curiosityBar) curiosityBar.style.width = (curiosity.score || 92) + '%';
    }

    async function regenerateReport() {
      try {
        const res = await fetch('/api/child/report/regenerate', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          currentReport = data.report;
          renderChildReport(currentReport);
        }
      } catch (e) {
        console.warn('Error refreshing report:', e);
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
        container.innerHTML = '<p class="text-xs text-slate-500 italic p-4 bg-white rounded-2xl border border-slate-200">No active directives. Add one above.</p>';
        return;
      }

      missions.forEach(m => {
        const div = document.createElement('div');
        div.className = 'p-4 rounded-[24px] border-2 transition-all flex items-center justify-between gap-3 ' + (m.active ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60');
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
        await fetch('/api/child/missions/' + id + '/toggle', { method: 'POST' });
        await loadParentMissions();
      } catch (err) {
        console.warn('Error toggling mission:', err);
      }
    }

    async function deleteMission(id) {
      try {
        await fetch('/api/child/missions/' + id, { method: 'DELETE' });
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
      wrapper.className = 'flex w-full ' + (isUser ? 'justify-end' : 'justify-start');

      const bubble = document.createElement('div');
      bubble.className = 'max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl space-y-1.5 ' + (
        isUser
          ? 'bg-sky-50 text-slate-800 rounded-tr-xs border-2 border-sky-200'
          : 'bg-amber-50 text-slate-800 rounded-tl-xs border-2 border-amber-200 shadow-xs'
      );

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
      const url = '/api/tts?text=' + encodeURIComponent(text);
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
        console.warn('Audio play prevented:', err);
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
console.log('Saved exact user mockup design into backend/public/index.html');
