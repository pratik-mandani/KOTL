'use client';

import React from 'react';

export default function KindergartenDoodles() {
  return (
    <div className="kindergarten-doodles pointer-events-none fixed inset-0 overflow-hidden select-none z-0">
      {/* Top-Left Sweeping Royal Blue Wave with Yellow Border & Dashed Arc */}
      <svg className="absolute -top-6 -left-6 w-64 sm:w-80 md:w-96 lg:w-[440px] h-64 sm:h-80 md:h-96 lg:h-[440px] pointer-events-none z-0 opacity-95" viewBox="0 0 500 500" fill="none">
        <path d="M 0 0 L 430 0 C 370 120 320 180 190 320 C 100 420 0 460 0 460 Z" fill="#1D70B8" />
        <path d="M 430 0 C 370 120 320 180 190 320 C 100 420 0 460 0 480 C 0 480 105 440 200 335 C 335 195 385 130 445 0 Z" fill="#FFCA28" />
        <path d="M 455 0 C 395 130 345 205 210 345 C 115 450 10 490 10 490" stroke="#FDD835" strokeWidth="3.5" strokeDasharray="10 8" fill="none" />
      </svg>

      {/* Flying White Paper Airplane with Dotted Loop Trail */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-12 pointer-events-none z-10 animate-float">
        <svg width="140" height="100" viewBox="0 0 160 120" fill="none" className="w-20 h-16 sm:w-28 sm:h-22 drop-shadow-sm">
          <path d="M 10 95 C 40 40 70 110 90 70 C 105 40 115 50 120 45" stroke="#1D70B8" strokeWidth="2.5" strokeDasharray="5 5" fill="none" />
          <g transform="translate(100, 20) rotate(-15)">
            <polygon points="50,25 0,0 15,22" fill="#FFFFFF" stroke="#0D47A1" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="50,25 15,22 10,32" fill="#BBDEFB" stroke="#0D47A1" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="50,25 15,22 0,50" fill="#E3F2FD" stroke="#0D47A1" strokeWidth="2.5" strokeLinejoin="round" />
          </g>
        </svg>
      </div>

      {/* Top-Right Sunny Yellow Corner Wave */}
      <svg className="absolute -top-4 -right-4 w-48 sm:w-64 md:w-72 h-48 sm:h-64 md:h-72 pointer-events-none z-0 opacity-95" viewBox="0 0 300 300" fill="none">
        <path d="M 90 0 C 170 30 240 100 300 200 L 300 0 Z" fill="#FFCA28" />
        <path d="M 70 0 C 155 35 230 110 288 215" stroke="#FDD835" strokeWidth="3" strokeDasharray="9 7" fill="none" />
      </svg>

      {/* Cute Smiling Cartoon Yellow Pencil (Top-Right) */}
      <div className="absolute top-3 right-4 sm:top-5 sm:right-10 pointer-events-none z-10 animate-float-delayed">
        <svg width="90" height="130" viewBox="0 0 100 150" fill="none" className="w-16 h-24 sm:w-22 sm:h-32 drop-shadow-md">
          <g transform="rotate(-20 50 75)">
            <line x1="25" y1="5" x2="15" y2="0" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="-5" x2="50" y2="-15" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <line x1="75" y1="5" x2="85" y2="0" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            <path d="M 30 24 C 30 12 70 12 70 24 Z" fill="#FF5252" stroke="#1E293B" strokeWidth="3" />
            <rect x="30" y="24" width="40" height="8" fill="#CFD8DC" stroke="#1E293B" strokeWidth="3" />
            <rect x="30" y="32" width="40" height="60" fill="#FFD54F" stroke="#1E293B" strokeWidth="3" />
            <line x1="43" y1="32" x2="43" y2="92" stroke="#FFB300" strokeWidth="2.5" />
            <line x1="57" y1="32" x2="57" y2="92" stroke="#FFB300" strokeWidth="2.5" />
            <polygon points="30,92 70,92 50,128" fill="#FFE082" stroke="#1E293B" strokeWidth="3" />
            <polygon points="43,115 57,115 50,128" fill="#1E293B" />
            <circle cx="42" cy="56" r="3.5" fill="#1E293B" />
            <circle cx="43" cy="54.5" r="1.2" fill="#FFFFFF" />
            <circle cx="58" cy="56" r="3.5" fill="#1E293B" />
            <circle cx="59" cy="54.5" r="1.2" fill="#FFFFFF" />
            <ellipse cx="36" cy="62" rx="3" ry="1.5" fill="#FF8A80" />
            <ellipse cx="64" cy="62" rx="3" ry="1.5" fill="#FF8A80" />
            <path d="M 45 64 Q 50 71 55 64" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </div>

      {/* Glowing Idea Lightbulb (Right side below pencil) */}
      <div className="absolute top-32 right-3 sm:top-40 sm:right-8 pointer-events-none z-10 animate-float">
        <svg width="80" height="85" viewBox="0 0 100 110" fill="none" className="w-13 h-15 sm:w-16 sm:h-18 drop-shadow-md">
          <line x1="50" y1="8" x2="50" y2="0" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <line x1="20" y1="20" x2="12" y2="14" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <line x1="80" y1="20" x2="88" y2="14" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <line x1="8" y1="50" x2="0" y2="50" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <line x1="92" y1="50" x2="100" y2="50" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
          <path d="M 32 68 C 22 62 16 48 16 38 C 16 19 31 12 50 12 C 69 12 84 19 84 38 C 84 48 78 62 68 68 Z" fill="#FFEE58" stroke="#1E293B" strokeWidth="3.5" />
          <path d="M 42 45 Q 50 34 50 45 Q 50 34 58 45" stroke="#F57F17" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="36" y="68" width="28" height="6" rx="2" fill="#42A5F5" stroke="#1E293B" strokeWidth="2.5" />
          <rect x="39" y="74" width="22" height="6" rx="2" fill="#1E88E5" stroke="#1E293B" strokeWidth="2.5" />
          <rect x="42" y="80" width="16" height="5" rx="2" fill="#1565C0" stroke="#1E293B" strokeWidth="2.5" />
          <ellipse cx="50" cy="86" rx="5" ry="2" fill="#1E293B" />
        </svg>
      </div>

      {/* Left Margin: Stack of 3 Colorful Books (Blue, Yellow, Blue) */}
      <div className="hidden lg:block absolute top-[430px] left-3 pointer-events-none z-10 animate-float">
        <svg width="90" height="90" viewBox="0 0 110 110" fill="none" className="w-20 h-20 drop-shadow-md">
          <g transform="translate(10, 60)">
            <rect x="0" y="8" width="75" height="18" rx="3" fill="#1565C0" stroke="#1E293B" strokeWidth="3" />
            <rect x="75" y="10" width="12" height="14" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="12" y1="12" x2="12" y2="22" stroke="#FFFFFF" strokeWidth="2" />
          </g>
          <g transform="translate(14, 38)">
            <rect x="0" y="8" width="72" height="17" rx="3" fill="#FDD835" stroke="#1E293B" strokeWidth="3" />
            <rect x="72" y="10" width="12" height="13" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="12" y1="12" x2="12" y2="21" stroke="#FFB300" strokeWidth="2" />
          </g>
          <g transform="translate(8, 16)">
            <rect x="0" y="8" width="74" height="17" rx="3" fill="#1E88E5" stroke="#1E293B" strokeWidth="3" />
            <rect x="74" y="10" width="12" height="13" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="12" y1="12" x2="12" y2="21" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Bottom-Left: Large Open Storybook */}
      <div className="hidden md:block absolute bottom-6 left-6 pointer-events-none z-10 drop-shadow-md">
        <svg width="150" height="95" viewBox="0 0 180 120" fill="none" className="w-32 h-22 sm:w-38 sm:h-26">
          <path d="M 10 95 Q 90 108 170 95 L 165 105 Q 90 118 15 105 Z" fill="#FBC02D" stroke="#1E293B" strokeWidth="3" />
          <path d="M 90 95 C 55 92 25 80 12 75 L 15 22 C 30 28 60 40 90 42 Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
          <line x1="28" y1="38" x2="78" y2="48" stroke="#90CAF9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="50" x2="78" y2="60" stroke="#90CAF9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="62" x2="78" y2="72" stroke="#90CAF9" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 90 95 C 125 92 155 80 168 75 L 165 22 C 150 28 120 40 90 42 Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
          <line x1="102" y1="48" x2="152" y2="38" stroke="#90CAF9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="102" y1="60" x2="152" y2="50" stroke="#90CAF9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="102" y1="72" x2="152" y2="62" stroke="#90CAF9" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="90" y1="42" x2="90" y2="98" stroke="#1E293B" strokeWidth="3.5" />
        </svg>
      </div>

      {/* Bottom-Right: Smiling Pencil Holder Cup & Stack of 2 Books */}
      <div className="hidden md:block absolute bottom-6 right-6 pointer-events-none z-10 drop-shadow-md">
        <svg width="180" height="140" viewBox="0 0 200 160" fill="none" className="w-36 h-28 sm:w-44 sm:h-34">
          <g transform="translate(100, 115)">
            <rect x="0" y="6" width="75" height="18" rx="3" fill="#FDD835" stroke="#1E293B" strokeWidth="3" />
            <rect x="75" y="8" width="12" height="14" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="10" y1="10" x2="10" y2="20" stroke="#FFB300" strokeWidth="2" />
          </g>
          <g transform="translate(108, 92)">
            <rect x="0" y="6" width="72" height="18" rx="3" fill="#1E88E5" stroke="#1E293B" strokeWidth="3" />
            <rect x="72" y="8" width="12" height="14" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.5" />
            <line x1="10" y1="10" x2="10" y2="20" stroke="#FFFFFF" strokeWidth="2" />
          </g>
          <g transform="translate(25, 45)">
            <g transform="translate(38, -25) rotate(12)">
              <rect x="0" y="0" width="14" height="60" rx="2" fill="#FDD835" stroke="#1E293B" strokeWidth="2.5" />
              <line x1="0" y1="10" x2="6" y2="10" stroke="#1E293B" strokeWidth="1.5" />
              <line x1="0" y1="20" x2="8" y2="20" stroke="#1E293B" strokeWidth="1.5" />
              <line x1="0" y1="30" x2="6" y2="30" stroke="#1E293B" strokeWidth="1.5" />
              <line x1="0" y1="40" x2="8" y2="40" stroke="#1E293B" strokeWidth="1.5" />
            </g>
            <g transform="translate(46, -18) rotate(18)">
              <rect x="0" y="0" width="10" height="55" rx="3" fill="#263238" stroke="#1E293B" strokeWidth="2.5" />
              <rect x="-2" y="10" width="3" height="18" rx="1" fill="#78909C" />
            </g>
            <g transform="translate(20, -22) rotate(-8)">
              <rect x="0" y="0" width="9" height="55" fill="#29B6F6" stroke="#1E293B" strokeWidth="2" />
              <polygon points="0,0 9,0 4.5,-12" fill="#FFE082" stroke="#1E293B" strokeWidth="2" />
              <polygon points="3,-8 6,-8 4.5,-12" fill="#1E293B" />
            </g>
            <g transform="translate(10, -18) rotate(-18)">
              <rect x="0" y="0" width="9" height="50" fill="#FFCA28" stroke="#1E293B" strokeWidth="2" />
              <polygon points="0,0 9,0 4.5,-12" fill="#FFE082" stroke="#1E293B" strokeWidth="2" />
              <polygon points="3,-8 6,-8 4.5,-12" fill="#1E293B" />
            </g>
            <path d="M 6 20 L 12 75 C 13 85 53 85 54 75 L 60 20 Z" fill="#1E88E5" stroke="#1E293B" strokeWidth="3" />
            <ellipse cx="33" cy="20" rx="27" ry="6" fill="#42A5F5" stroke="#1E293B" strokeWidth="3" />
            <circle cx="25" cy="50" r="3" fill="#1E293B" />
            <circle cx="41" cy="50" r="3" fill="#1E293B" />
            <path d="M 28 58 Q 33 65 38 58" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="20" cy="54" rx="2.5" ry="1.2" fill="#90CAF9" />
            <ellipse cx="46" cy="54" rx="2.5" ry="1.2" fill="#90CAF9" />
          </g>
        </svg>
      </div>

      {/* Bottom Sweeping Royal Blue Wave */}
      <svg className="absolute bottom-0 left-0 right-0 w-full h-12 sm:h-20 pointer-events-none z-0 opacity-95" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none">
        <path d="M 0 60 Q 300 20 600 60 Q 900 100 1200 50 L 1200 120 L 0 120 Z" fill="#1D70B8" />
        <path d="M 0 54 Q 300 14 600 54 Q 900 94 1200 44 L 1200 50 Q 900 100 600 60 Q 300 20 0 60 Z" fill="#FFCA28" />
      </svg>

      {/* Floating Doodle Stars & Hearts */}
      <div className="absolute top-20 left-1/4 opacity-75">
        <span className="text-xl sm:text-2xl text-amber-400">⭐</span>
      </div>
      <div className="absolute top-48 left-10 opacity-70">
        <span className="text-lg sm:text-xl text-blue-500">★</span>
      </div>
      <div className="absolute top-64 right-1/4 opacity-70">
        <span className="text-xl text-amber-400">⭐</span>
      </div>
      <div className="absolute top-80 right-8 opacity-75">
        <span className="text-xl sm:text-2xl text-red-400">💛</span>
      </div>
      <div className="absolute bottom-40 left-12 opacity-65">
        <span className="text-lg text-amber-400">★</span>
      </div>
      <div className="absolute bottom-32 right-1/3 opacity-70">
        <span className="text-xl text-red-400">💛</span>
      </div>
    </div>
  );
}
