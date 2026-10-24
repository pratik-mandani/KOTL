const fs = require('fs');

const pageJsx = `'use client';

import React, { useState, useEffect } from 'react';
import KindergartenDoodles from '../components/KindergartenDoodles';

export default function KindergartenDashboard() {
  const [profile, setProfile] = useState({
    name: 'Parth',
    age: 6,
    gender: 'Boy',
    bedtime: '21:00'
  });
  const [currentSection, setCurrentSection] = useState('all');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(true);

  // Interactive toggle switches state
  const [habits, setHabits] = useState({
    spoken_english: true,
    clean_water: true,
    spinach_greens: true,
    brushing: true,
    water: true,
    spinach: true,
    toys: false
  });

  const toggleHabit = (key) => {
    setHabits(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (_) {}
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/device/status');
        if (res.ok) {
          const data = await res.json();
          setDeviceOnline(data.online !== false);
        }
      } catch (_) {}
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#FFFDF9] relative font-nunito selection:bg-amber-200">
      
      {/* Background Micro Doodles */}
      <KindergartenDoodles />

      {/* Top Header / Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="bg-white/95 backdrop-blur-md border-2 border-amber-200 rounded-3xl px-5 py-3.5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center text-white text-xl shadow-md shadow-sky-500/20">
              🧸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-fredoka text-xl font-bold tracking-tight text-slate-800">KOTL KIDS</span>
                <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-300">
                  Kindergarten
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Intelligent Pediatric Companion & Smart Behavioral Habit Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span id="deviceStatusPill" className="bg-emerald-50 text-emerald-700 text-xs px-3.5 py-1.5 rounded-full font-bold border border-emerald-300 flex items-center gap-2 shadow-sm whitespace-nowrap">
              <span className={\`w-2.5 h-2.5 rounded-full \${deviceOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}\`}></span>
              <span>• ESP32 Live</span>
            </span>

            <button onClick={() => setIsProfileModalOpen(true)} title="Child Profile & Settings" className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 flex items-center justify-center text-base transition-colors shadow-sm">
              ⚙️
            </button>

            <div className="w-9 h-9 rounded-2xl bg-sky-100 border border-sky-300 text-sky-800 flex items-center justify-center text-base font-bold shadow-sm">
              👦
            </div>
          </div>
        </div>
      </header>

      {/* SECTION-WISE PLAYFUL NAVIGATION MENU */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-2">
        <div className="bg-amber-50/80 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-1.5 flex items-center gap-2 overflow-x-auto shadow-xs">
          
          <button onClick={() => setCurrentSection('all')} className={\`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'all' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>🌟</span>
            <span>All Overview</span>
          </button>

          <button onClick={() => setCurrentSection('report')} className={\`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'report' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>📜</span>
            <span>Report & Marks</span>
          </button>

          <button onClick={() => setCurrentSection('habits')} className={\`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'habits' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>🎯</span>
            <span>Daily Habits</span>
          </button>

          <button onClick={() => setCurrentSection('dialogue')} className={\`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'dialogue' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>💬</span>
            <span>Live Dialogue</span>
          </button>

          <button onClick={() => setCurrentSection('care')} className={\`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'care' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>🦁</span>
            <span>Curiosity & Care</span>
          </button>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-3 pb-24">
        
        {/* VIEW 1: ALL OVERVIEW */}
        {currentSection === 'all' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1 */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Profile Card */}
              <div className="p-6 relative overflow-hidden bg-[#FFFDF0] border-[3px] border-[#F6D365] rounded-[38px] shadow-[0_12px_30px_rgba(246,211,101,0.22)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[22px] bg-blue-600 flex items-center justify-center text-3xl shadow-md shadow-blue-500/30 text-white">
                      👦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold font-fredoka text-slate-800">{profile.name}</h1>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                          • ESP32 Live
                        </span>
                      </div>
                      <p className="text-slate-700 font-bold text-sm mt-0.5">{profile.age} Years</p>
                      <p className="text-slate-500 text-xs font-semibold">Class: Sr. KG • KID: KOTL Buddy</p>
                    </div>
                  </div>

                  {/* Rosette Stamp */}
                  <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                      <circle cx="50" cy="50" r="46" fill="#F59E0B" />
                      <path d="M 50 2 C 55 2 60 7 64 10 C 69 7 75 10 77 15 C 82 14 87 19 87 25 C 92 27 94 33 93 39 C 97 43 97 49 95 55 C 97 61 94 67 90 71 C 91 77 86 82 81 84 C 78 89 72 91 67 89 C 63 93 57 95 51 94 C 45 95 39 93 35 89 C 30 91 24 89 21 84 C 16 82 11 77 12 71 C 8 67 5 61 7 55 C 5 49 5 43 9 39 C 8 33 10 27 15 25 C 15 19 20 14 25 15 C 27 10 33 7 38 10 C 42 7 47 2 50 2 Z" fill="#D97706" />
                      <circle cx="50" cy="50" r="41" fill="#F59E0B" />
                      <circle cx="50" cy="50" r="36" fill="none" stroke="#FEF3C7" strokeWidth="2" strokeDasharray="3 3" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white select-none">
                      <span className="text-[9px] font-bold tracking-wider uppercase opacity-90 leading-tight">Grade</span>
                      <span className="font-fredoka text-2xl font-black leading-none my-0.5">A+</span>
                      <span className="text-[9px] font-semibold opacity-90 leading-tight">(87/100)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                <div className="bg-sky-50 border-2 border-sky-300 rounded-3xl p-3.5 shadow-sm">
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Overall Star</span>
                  <div className="text-2xl font-extrabold font-fredoka text-sky-900 mt-0.5">87<span className="text-xs font-normal text-sky-600">/100</span></div>
                  <div className="w-full bg-sky-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>

                <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-3.5 shadow-sm">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">English</span>
                  <div className="text-2xl font-extrabold font-fredoka text-amber-900 mt-0.5">84%</div>
                  <div className="w-full bg-amber-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '84%' }}></div>
                  </div>
                </div>

                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-3.5 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Space</span>
                  <div className="text-2xl font-extrabold font-fredoka text-emerald-900 mt-0.5">92%</div>
                  <div className="w-full bg-emerald-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="bg-teal-50 border-2 border-teal-300 rounded-3xl p-3.5 shadow-sm">
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Good Habits</span>
                  <div className="text-2xl font-extrabold font-fredoka text-teal-900 mt-0.5">3<span className="text-xs font-normal text-teal-600">/6</span></div>
                  <div className="w-full bg-teal-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>

              {/* Mini Toggles */}
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50/70 border border-sky-200">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-sky-500 text-white flex items-center justify-center text-xs font-bold">★</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Spoken English & Words</div>
                      <div className="text-[10px] text-slate-500 font-medium">Clear language pronunciation</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={habits.spoken_english} onChange={() => toggleHabit('spoken_english')} className="w-5 h-5 accent-sky-500 cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-bold">💧</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Clean water</div>
                      <div className="text-[10px] text-slate-500 font-medium">Drinking water routine</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={habits.clean_water} onChange={() => toggleHabit('clean_water')} className="w-5 h-5 accent-amber-500 cursor-pointer" />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">🥬</span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">Eating spinach greens</div>
                      <div className="text-[10px] text-slate-500 font-medium">Healthy nutrition habits</div>
                    </div>
                  </div>
                  <input type="checkbox" checked={habits.spinach_greens} onChange={() => toggleHabit('spinach_greens')} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                </div>
              </div>

              {/* Memo Sheet with Paperclip */}
              <div className="p-5 pt-7 relative bg-[#FEFCE8] border-[2.5px] border-[#FACC15] rounded-[24px] shadow-[0_10px_25px_rgba(234,179,8,0.15)]">
                <div className="absolute -top-3.5 right-7 w-5 h-12 border-[3px] border-slate-400 rounded-t-xl pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📋</span>
                  <h3 className="font-fredoka text-lg font-bold text-amber-950">Companion Remark</h3>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 font-medium pr-4 mb-4">
                  Parth demonstrates exceptional inquisitiveness and imaginative engagement with KOTL, showing high empathy in manners & routines. In conversations on Science and Space, he shows keen interest and follows storytelling brisk healthy early bedtime-time habits.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-amber-300/40">
                  <span className="bg-amber-200/80 text-amber-900 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-300">✔ Space Explorer</span>
                  <span className="bg-amber-200/80 text-amber-900 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-300">✔ Creative Mind</span>
                  <span className="bg-amber-200/80 text-amber-900 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-300">✔ Well Mannered</span>
                </div>
              </div>
            </div>

            {/* COLUMN 2 */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* 5 Wavy Cards */}
              <div className="flex flex-col gap-3.5">
                <div className="bg-[#EBF7FF] border-[2.5px] border-[#7DD3FC] rounded-[32px] p-4 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-center flex-shrink-0">
                      <span className="text-xl">⭐</span>
                      <div className="text-[10px] font-bold font-fredoka text-sky-800">87/100</div>
                    </div>
                    <div>
                      <h4 className="font-fredoka text-sm font-bold text-slate-800">Spoken English & Words</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-1">Parental remarks: a companion willingly stars & fluent.</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-300 whitespace-nowrap">Grade A (Fluent)</span>
                </div>

                <div className="bg-[#FFF4E8] border-[2.5px] border-[#FDBA74] rounded-[32px] p-4 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-center flex-shrink-0">
                      <span className="text-xl">⭐</span>
                      <div className="text-[10px] font-bold font-fredoka text-amber-800">95/100</div>
                    </div>
                    <div>
                      <h4 className="font-fredoka text-sm font-bold text-slate-800">Science, Space & Curiosity</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-1">Curious remarks: eager engaging to feed your mindset.</p>
                    </div>
                  </div>
                  <span className="bg-cyan-100 text-cyan-800 text-xs px-2.5 py-1 rounded-full font-bold border border-cyan-300 whitespace-nowrap">Grade A+ (Curious)</span>
                </div>

                <div className="bg-[#E8FBF0] border-[2.5px] border-[#86EFAC] rounded-[32px] p-4 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-center flex-shrink-0">
                      <span className="text-xl">⭐</span>
                      <div className="text-[10px] font-bold font-fredoka text-emerald-800">95/100</div>
                    </div>
                    <div>
                      <h4 className="font-fredoka text-sm font-bold text-slate-800">Good Habits & Politeness</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-1">Companion remarks: nice and courtesy engaged sensitivity.</p>
                    </div>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-300 whitespace-nowrap">Grade A</span>
                </div>

                <div className="bg-[#FFF0F2] border-[2.5px] border-[#FCA5A5] rounded-[32px] p-4 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-center flex-shrink-0">
                      <span className="text-xl">⭐</span>
                      <div className="text-[10px] font-bold font-fredoka text-rose-800">95/100</div>
                    </div>
                    <div>
                      <h4 className="font-fredoka text-sm font-bold text-slate-800">Creativity & Studies</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-1">Story habits: loves curious storytelling and executing habits.</p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-300 whitespace-nowrap">Grade A+ (Creative)</span>
                </div>

                <div className="bg-[#EEF4FF] border-[2.5px] border-[#93C5FD] rounded-[32px] p-4 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-center flex-shrink-0">
                      <span className="text-xl">⭐</span>
                      <div className="text-[10px] font-bold font-fredoka text-indigo-800">95/100</div>
                    </div>
                    <div>
                      <h4 className="font-fredoka text-sm font-bold text-slate-800">Politeness & Cheerfulness</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-1">Pleasing habits: swift connection playful and bedtime-routine habits.</p>
                    </div>
                  </div>
                  <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-300 whitespace-nowrap">Grade A+</span>
                </div>
              </div>

              {/* Dialogue */}
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-fredoka text-lg font-bold text-slate-800">Recent Dialogue</h3>
                  <p className="text-xs text-slate-500">Real-time companion conversations with audio replay</p>
                </div>

                <div className="flex flex-col gap-4 max-h-[460px] overflow-y-auto pr-1">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sm flex-shrink-0 mt-1">👦</div>
                    <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[85%]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-sky-700">Parth</span>
                        <button onClick={playChime} className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-sm">▶</button>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">"KOTL, how do stars shine at night, and can we fly a rocket to the moon?"</p>
                    </div>
                  </div>

                  <div className="flex items-start justify-end gap-2.5">
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl rounded-tr-none p-3 shadow-sm max-w-[85%]">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-emerald-700">KOTL Robot</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-300">🔊 Audio Play</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">"Stars shine because they are giant balls of glowing gas, and yes! Astronauts travel on powerful rockets into space!"</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-sm flex-shrink-0 mt-1">🤖</div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 3 */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Habits Tracker */}
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm">
                <div className="mb-3">
                  <h3 className="font-fredoka text-lg font-bold text-slate-800">Habits Tracker</h3>
                  <p className="text-xs text-slate-500">Top mark centers and options for check-list</p>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-sky-50 border border-sky-200">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Brushing teeth</div>
                        <div className="text-[10px] text-slate-500 font-medium">Morning health habits</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={habits.brushing} onChange={() => toggleHabit('brushing')} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Clean water</div>
                        <div className="text-[10px] text-slate-500 font-medium">Clean tap toggle</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={habits.water} onChange={() => toggleHabit('water')} className="w-5 h-5 accent-amber-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Eating spinach greens</div>
                        <div className="text-[10px] text-slate-500 font-medium">Nutritious meal room</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={habits.spinach} onChange={() => toggleHabit('spinach')} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                  </div>
                </div>
              </div>

              {/* Affinity Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FFEFE8] border-[2.5px] border-[#F97316] rounded-[32px] p-4 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-2xl mb-2 shadow-sm">🦁</div>
                    <h4 className="font-fredoka text-sm font-bold text-slate-800 leading-tight">Prehistoric Science</h4>
                    <p className="text-[10px] text-slate-600 mt-1 leading-snug">Curious about wildlife habits, animal species, and nature science.</p>
                  </div>
                  <div className="mt-3 flex justify-end text-orange-500 opacity-70 text-lg">⚛️</div>
                </div>

                <div className="bg-[#E7F9EE] border-[2.5px] border-[#10B981] rounded-[32px] p-4 relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-2xl mb-2 shadow-sm">🚀</div>
                    <h4 className="font-fredoka text-sm font-bold text-slate-800 leading-tight">Space Exploration</h4>
                    <p className="text-[10px] text-slate-600 mt-1 leading-snug">Fascinated by planetary orbits, astronauts, telescopes, and cosmic star systems.</p>
                  </div>
                  <div className="mt-3 flex justify-end text-emerald-600 opacity-70 text-lg">🪐</div>
                </div>
              </div>

              {/* Sensitivities */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#DCFCE7] border-[2.5px] border-[#22C55E] rounded-[34px] p-3.5 relative">
                  <div className="flex items-center gap-1.5 mb-1 text-emerald-800 font-bold text-xs"><span>🥬</span><span>Bitter Vegetables</span></div>
                  <p className="text-[10px] text-emerald-950 font-medium leading-tight">Prefers spinach pureed or mild in cream; dislikes raw bitter textures.</p>
                </div>

                <div className="bg-[#E0E7FF] border-[2.5px] border-[#6366F1] rounded-[34px] p-3.5 relative">
                  <div className="flex items-center gap-1.5 mb-1 text-indigo-900 font-bold text-xs"><span>🌙</span><span>Dark Rooms</span></div>
                  <p className="text-[10px] text-indigo-950 font-medium leading-tight">Prefers soft 2700K ambient night light; calmed by gentle bedtime melodies.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: REPORT & MARKS */}
        {currentSection === 'report' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Parth Hero Profile Card */}
            <div className="p-6 relative overflow-hidden bg-[#FFFDF0] border-[3px] border-[#F6D365] rounded-[38px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[22px] bg-blue-600 flex items-center justify-center text-3xl shadow-md text-white">👦</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold font-fredoka text-slate-800">{profile.name}</h1>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-300">• ESP32 Live</span>
                    </div>
                    <p className="text-slate-700 font-bold text-sm mt-0.5">{profile.age} Years</p>
                    <p className="text-slate-500 text-xs font-semibold">Class: Sr. KG • KID: KOTL Buddy</p>
                  </div>
                </div>
                <div className="w-20 h-20 rounded-full bg-amber-400 border-4 border-dashed border-white text-white flex flex-col items-center justify-center text-center shadow-md">
                  <span className="text-[9px] uppercase font-bold">Grade</span>
                  <span className="font-fredoka text-2xl font-black">A+</span>
                  <span className="text-[9px]">(87/100)</span>
                </div>
              </div>
            </div>

            {/* 4 Chunky Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-sky-50 border-2 border-sky-300 rounded-3xl p-4 shadow-sm text-center">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Overall Star</span>
                <div className="text-3xl font-extrabold font-fredoka text-sky-900 mt-1">87<span className="text-sm font-normal text-sky-600">/100</span></div>
                <div className="w-full bg-sky-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 shadow-sm text-center">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">English</span>
                <div className="text-3xl font-extrabold font-fredoka text-amber-900 mt-1">84%</div>
                <div className="w-full bg-amber-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-4 shadow-sm text-center">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Space</span>
                <div className="text-3xl font-extrabold font-fredoka text-emerald-900 mt-1">92%</div>
                <div className="w-full bg-emerald-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div className="bg-teal-50 border-2 border-teal-300 rounded-3xl p-4 shadow-sm text-center">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Good Habits</span>
                <div className="text-3xl font-extrabold font-fredoka text-teal-900 mt-1">3<span className="text-sm font-normal text-teal-600">/6</span></div>
                <div className="w-full bg-teal-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>

            {/* 5 Subject Cards */}
            <div className="flex flex-col gap-4">
              <div className="bg-[#EBF7FF] border-[2.5px] border-[#7DD3FC] rounded-[32px] p-5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-sky-800">87/100</div></div>
                  <div><h4 className="font-fredoka text-base font-bold text-slate-800">Spoken English & Words</h4><p className="text-xs text-slate-600">Parental remarks: a companion willingly stars & fluent with 2-3 syllable expressions.</p></div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold border border-emerald-300 whitespace-nowrap">Grade A (Fluent)</span>
              </div>

              <div className="bg-[#FFF4E8] border-[2.5px] border-[#FDBA74] rounded-[32px] p-5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-amber-800">95/100</div></div>
                  <div><h4 className="font-fredoka text-base font-bold text-slate-800">Science, Space & Curiosity</h4><p className="text-xs text-slate-600">Curious remarks: eager engaging to feed your mindset about rockets and cosmic orbits.</p></div>
                </div>
                <span className="bg-cyan-100 text-cyan-800 text-xs px-3 py-1 rounded-full font-bold border border-cyan-300 whitespace-nowrap">Grade A+ (Curious)</span>
              </div>

              <div className="bg-[#E8FBF0] border-[2.5px] border-[#86EFAC] rounded-[32px] p-5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-emerald-800">95/100</div></div>
                  <div><h4 className="font-fredoka text-base font-bold text-slate-800">Good Habits & Politeness</h4><p className="text-xs text-slate-600">Companion remarks: nice and courtesy engaged sensitivity, respectful turn-taking in play.</p></div>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold border border-amber-300 whitespace-nowrap">Grade A</span>
              </div>

              <div className="bg-[#FFF0F2] border-[2.5px] border-[#FCA5A5] rounded-[32px] p-5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-rose-800">95/100</div></div>
                  <div><h4 className="font-fredoka text-base font-bold text-slate-800">Creativity & Studies</h4><p className="text-xs text-slate-600">Story habits: loves curious storytelling and executing imaginative spaceship designs.</p></div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-bold border border-blue-300 whitespace-nowrap">Grade A+ (Creative)</span>
              </div>

              <div className="bg-[#EEF4FF] border-[2.5px] border-[#93C5FD] rounded-[32px] p-5 flex items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-indigo-800">95/100</div></div>
                  <div><h4 className="font-fredoka text-base font-bold text-slate-800">Politeness & Cheerfulness</h4><p className="text-xs text-slate-600">Pleasing habits: swift connection playful and bedtime-routine gentle wind-down.</p></div>
                </div>
                <span className="bg-rose-100 text-rose-800 text-xs px-3 py-1 rounded-full font-bold border border-rose-300 whitespace-nowrap">Grade A+</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DAILY HABITS */}
        {currentSection === 'habits' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-fredoka text-base font-bold text-slate-800">Active Habit Checklist</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center text-sm font-bold">🪥</span>
                      <div><div className="text-xs font-bold text-slate-800">Brushing teeth</div><div className="text-[10px] text-slate-500 font-medium">Morning & night routine</div></div>
                    </div>
                    <input type="checkbox" checked={habits.brushing} onChange={() => toggleHabit('brushing')} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm font-bold">💧</span>
                      <div><div className="text-xs font-bold text-slate-800">Clean water</div><div className="text-[10px] text-slate-500 font-medium">Healthy hydration all day</div></div>
                    </div>
                    <input type="checkbox" checked={habits.water} onChange={() => toggleHabit('water')} className="w-5 h-5 accent-amber-500 cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">🥬</span>
                      <div><div className="text-xs font-bold text-slate-800">Eating spinach greens</div><div className="text-[10px] text-slate-500 font-medium">Superhero stamina food</div></div>
                    </div>
                    <input type="checkbox" checked={habits.spinach} onChange={() => toggleHabit('spinach')} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="p-6 pt-8 relative bg-[#FEFCE8] border-[2.5px] border-[#FACC15] rounded-[24px] shadow-sm">
                <div className="absolute -top-3.5 right-7 w-5 h-12 border-[3px] border-slate-400 rounded-t-xl pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📋</span>
                  <h3 className="font-fredoka text-lg font-bold text-amber-950">Companion Remark</h3>
                </div>
                <p className="text-xs leading-relaxed text-slate-700 font-medium pr-4 mb-4">
                  Parth demonstrates exceptional inquisitiveness and imaginative engagement with KOTL, showing high empathy in manners & routines. In conversations on Science and Space, he shows keen interest and follows storytelling brisk healthy early bedtime-time habits.
                </p>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-amber-300/40">
                  <span className="bg-amber-200/80 text-amber-900 text-[11px] px-3 py-1 rounded-full font-bold border border-amber-300">✔ Space Explorer</span>
                  <span className="bg-amber-200/80 text-amber-900 text-[11px] px-3 py-1 rounded-full font-bold border border-amber-300">✔ Creative Mind</span>
                  <span className="bg-amber-200/80 text-amber-900 text-[11px] px-3 py-1 rounded-full font-bold border border-amber-300">✔ Well Mannered</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: LIVE DIALOGUE */}
        {currentSection === 'dialogue' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-base flex-shrink-0 mt-1">👦</div>
                <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%]">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-xs font-bold text-sky-700">Parth</span>
                    <button onClick={playChime} className="w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-xs shadow-sm">▶</button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">"KOTL, how do stars shine at night, and can we fly a rocket to the moon?"</p>
                </div>
              </div>

              <div className="flex items-start justify-end gap-3">
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl rounded-tr-none p-4 shadow-sm max-w-[85%]">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span className="text-xs font-bold text-emerald-700">KOTL Robot</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-300">🔊 Audio Play</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">"Stars shine because they are giant balls of glowing gas, and yes! Astronauts travel on powerful rockets into space!"</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-base flex-shrink-0 mt-1">🤖</div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: CURIOSITY & CARE */}
        {currentSection === 'care' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#FFEFE8] border-[2.5px] border-[#F97316] rounded-[32px] p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-3xl mb-2 shadow-sm">🦁</div>
                  <h4 className="font-fredoka text-base font-bold text-slate-800 leading-tight">Prehistoric & Animal Science</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Displays lively fascination for wildlife habitats, animal species, and natural wonders with deep observation.</p>
                </div>
                <div className="mt-4 flex justify-end text-orange-500 opacity-75 text-2xl">⚛️</div>
              </div>

              <div className="bg-[#E7F9EE] border-[2.5px] border-[#10B981] rounded-[32px] p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-3xl mb-2 shadow-sm">🚀</div>
                  <h4 className="font-fredoka text-base font-bold text-slate-800 leading-tight">Space Exploration & Rocketry</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Fascinated by planetary orbits, astronauts, telescopes, and cosmic star constellations.</p>
                </div>
                <div className="mt-4 flex justify-end text-emerald-600 opacity-75 text-2xl">🪐</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#DCFCE7] border-[2.5px] border-[#22C55E] rounded-[34px] p-4 relative">
                <div className="flex items-center gap-2 mb-1.5 text-emerald-800 font-bold text-sm"><span className="text-lg">🥬</span><span>Bitter Vegetables</span></div>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">Prefers spinach pureed or mild in cream sauce; sensitive to raw bitter textures.</p>
              </div>

              <div className="bg-[#E0E7FF] border-[2.5px] border-[#6366F1] rounded-[34px] p-4 relative">
                <div className="flex items-center gap-2 mb-1.5 text-indigo-900 font-bold text-sm"><span className="text-lg">🌙</span><span>Dark Rooms</span></div>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">Prefers soft warm 2700K ambient night light; calmed by gentle bedtime story melodies.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Cloud Wave Footer */}
      <div className="relative w-full overflow-hidden leading-none z-0 mt-8">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 text-[#FFF7E6] fill-current">
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"></path>
        </svg>
        <div className="bg-[#FFF7E6] py-3 text-center text-xs text-amber-900/60 font-semibold">
          KOTL Kids Pediatric Behavioral & Intelligence Companion • Pure Kindergarten Edition
        </div>
      </div>

      {/* Fixed Mobile Bottom Nav */}
      <nav id="mobileBottomNav" className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 py-2.5 px-6 flex justify-around items-center z-50 lg:hidden shadow-lg">
        <button onClick={() => setCurrentSection('report')} className="flex flex-col items-center text-sky-600 font-bold text-[11px]">
          <span className="text-lg">📊</span>
          <span>Report</span>
        </button>
        <button onClick={() => setCurrentSection('habits')} className="flex flex-col items-center text-slate-500 hover:text-amber-600 font-semibold text-[11px]">
          <span className="text-lg">🎯</span>
          <span>Habits</span>
        </button>
        <button onClick={() => setCurrentSection('dialogue')} className="flex flex-col items-center text-slate-500 hover:text-amber-600 font-semibold text-[11px]">
          <span className="text-lg">💬</span>
          <span>Dialogue</span>
        </button>
        <button onClick={() => setCurrentSection('care')} className="flex flex-col items-center text-slate-500 hover:text-amber-600 font-semibold text-[11px]">
          <span className="text-lg">🦁</span>
          <span>Care</span>
        </button>
      </nav>

      {/* Child Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
            <h2 className="font-fredoka text-xl font-bold text-slate-800 mb-2">Child Profile & Safety Settings</h2>
            <div className="flex flex-col gap-3 text-xs font-semibold text-slate-700">
              <div><label className="block mb-1">Child Name</label><input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
              <div><label className="block mb-1">Age</label><input type="number" value={profile.age} onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value, 10) }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold font-fredoka">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync('frontend/app/page.jsx', pageJsx, 'utf8');
console.log('Saved section-wise Next.js app to frontend/app/page.jsx');
