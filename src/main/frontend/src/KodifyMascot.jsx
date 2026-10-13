import React from 'react';

/**
 * Original KODIFY Mascot Component
 * A friendly, rounded developer mascot inspired by Tamil Kolam geometry and KODIFY's palette:
 * Teal (#0081A7), Deep Teal (#006685), Secondary Teal (#00AFB9), Sandal (#FED9B7), Coral (#F07167)
 */
export default function KodifyMascot({ size = 44, mood = 'happy', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: 'middle', filter: 'drop-shadow(0 2px 6px rgba(0, 129, 167, 0.25))' }}
      aria-label="KODIFY Mascot"
    >
      {/* Kolam / Antenna Crown */}
      <circle cx="50" cy="12" r="4" fill="#F07167" />
      <path d="M50 16 V24" stroke="#00AFB9" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 20 L50 16 L56 20" stroke="#FED9B7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Head Outer Shell */}
      <rect x="18" y="24" width="64" height="56" rx="28" fill="url(#kodifyMascotGrad)" />
      
      {/* Head Border / Contour */}
      <rect x="18" y="24" width="64" height="56" rx="28" stroke="#006685" strokeWidth="2.5" />

      {/* Developer Headset / Ear Cushions */}
      <rect x="12" y="42" width="8" height="20" rx="4" fill="#006685" />
      <rect x="80" y="42" width="8" height="20" rx="4" fill="#006685" />
      <path d="M16 42 C16 22 84 22 84 42" stroke="#006685" strokeWidth="3" fill="none" />

      {/* Digital Visor / Face Screen */}
      <rect x="25" y="32" width="50" height="38" rx="19" fill="#090D16" />
      <rect x="25" y="32" width="50" height="38" rx="19" stroke="#00AFB9" strokeWidth="1.5" />

      {/* Expressive Glowing Eyes */}
      {mood === 'happy' ? (
        <>
          {/* Left Eye: Happy Arc */}
          <path d="M36 50 Q41 43 46 50" stroke="#00AFB9" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="41" cy="46" r="1.5" fill="#FED9B7" />

          {/* Right Eye: Happy Arc */}
          <path d="M54 50 Q59 43 64 50" stroke="#00AFB9" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="59" cy="46" r="1.5" fill="#FED9B7" />

          {/* Cheerful Smile */}
          <path d="M46 58 Q50 62 54 58" stroke="#FED9B7" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : mood === 'thinking' ? (
        <>
          {/* Thinking Eyes */}
          <circle cx="40" cy="48" r="4" fill="#00AFB9" />
          <circle cx="60" cy="48" r="4" fill="#00AFB9" />
          <path d="M47 58 H53" stroke="#FED9B7" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Normal Friendly Eyes */}
          <circle cx="40" cy="49" r="4.5" fill="#00AFB9" />
          <circle cx="42" cy="47" r="1.5" fill="#FFFFFF" />
          <circle cx="60" cy="49" r="4.5" fill="#00AFB9" />
          <circle cx="62" cy="47" r="1.5" fill="#FFFFFF" />
          <path d="M46 58 Q50 61 54 58" stroke="#FED9B7" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* Warm Sandal Cheek Accents */}
      <ellipse cx="33" cy="56" rx="3.5" ry="2" fill="#FED9B7" opacity="0.6" />
      <ellipse cx="67" cy="56" rx="3.5" ry="2" fill="#FED9B7" opacity="0.6" />

      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="kodifyMascotGrad" x1="18" y1="24" x2="82" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0081A7" />
          <stop offset="100%" stopColor="#006685" />
        </linearGradient>
      </defs>
    </svg>
  );
}
