'use client';

import React from 'react';

export default function KindergartenDoodles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
      {/* Top Left: Flying Paper Airplane with loop trail */}
      <div className="absolute top-4 left-3 sm:left-10 animate-float opacity-80 sm:opacity-95">
        <svg width="70" height="70" viewBox="0 0 100 100" fill="none" className="w-12 h-12 sm:w-16 sm:h-16">
          <path d="M10 50 C 30 20, 50 60, 70 30" stroke="#1E88E5" strokeWidth="2.5" strokeDasharray="4 4" fill="none" />
          <polygon points="65,20 85,30 65,40 70,30" fill="#1E88E5" stroke="#0D47A1" strokeWidth="2" />
        </svg>
      </div>

      {/* Top Right: Cute Smiling Cartoon Pencil (as in uploaded image) */}
      <div className="absolute top-3 right-4 sm:right-12 animate-float-delayed opacity-85 sm:opacity-100">
        <svg width="65" height="95" viewBox="0 0 70 100" fill="none" className="w-10 h-14 sm:w-14 sm:h-20">
          {/* Pencil body */}
          <rect x="20" y="20" width="30" height="55" rx="6" fill="#FDD835" stroke="#0D47A1" strokeWidth="2.5" />
          {/* Tip */}
          <polygon points="20,75 50,75 35,95" fill="#FFE082" stroke="#0D47A1" strokeWidth="2.5" />
          <polygon points="30,88 40,88 35,95" fill="#212121" />
          {/* Eraser */}
          <path d="M20 20 Q 35 8, 50 20 Z" fill="#FF5252" stroke="#0D47A1" strokeWidth="2.5" />
          {/* Happy face */}
          <circle cx="30" cy="42" r="3" fill="#212121" />
          <circle cx="40" cy="42" r="3" fill="#212121" />
          <path d="M30 50 Q 35 56, 40 50" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Sparkles */}
          <line x1="12" y1="25" x2="6" y2="20" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="35" x2="8" y2="38" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Top-Mid Right: Glowing Lightbulb Idea Icon (as in uploaded image) */}
      <div className="absolute top-28 right-3 sm:right-8 animate-float opacity-80 sm:opacity-95">
        <svg width="55" height="55" viewBox="0 0 60 60" fill="none" className="w-9 h-9 sm:w-12 sm:h-12">
          <circle cx="30" cy="25" r="16" fill="#FFF59D" stroke="#0D47A1" strokeWidth="2.5" />
          <path d="M25 41 L35 41 L33 48 L27 48 Z" fill="#90CAF9" stroke="#0D47A1" strokeWidth="2" />
          <path d="M26 23 Q 30 18, 34 23 Q 30 28, 30 33" stroke="#F57F17" strokeWidth="2" fill="none" />
          {/* Rays */}
          <line x1="30" y1="3" x2="30" y2="7" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="12" y1="12" x2="16" y2="15" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="48" y1="12" x2="44" y2="15" stroke="#212121" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Floating Doodle Stars & Hearts (as in uploaded image) */}
      <div className="absolute top-16 left-1/4 opacity-60">
        <span className="text-xl sm:text-2xl text-kid-yellow">⭐</span>
      </div>
      <div className="absolute top-36 left-8 opacity-70">
        <span className="text-lg sm:text-xl text-kid-blue">★</span>
      </div>
      <div className="absolute top-52 right-1/4 opacity-65">
        <span className="text-xl text-kid-yellow">⭐</span>
      </div>
      <div className="absolute top-72 right-6 opacity-75">
        <span className="text-xl sm:text-2xl text-kid-coral">💛</span>
      </div>
    </div>
  );
}
