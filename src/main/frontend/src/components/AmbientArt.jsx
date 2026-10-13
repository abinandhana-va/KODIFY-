import React from 'react';

/**
 * AmbientArt
 * Subtle cultural vector elements inspired by Tamil motifs, banyan branches, kolam geometry, and ocean waves.
 * Accessible: marked aria-hidden="true" and designed not to obstruct text or inputs.
 */

export function WaveDivider({ height = 24, opacity = 0.4, color = 'var(--primary)', style = {} }) {
  return (
    <div className="ambient-art-container" aria-hidden="true" style={{ width: '100%', overflow: 'hidden', ...style }}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${height}px`, display: 'block', opacity }}
      >
        <path
          d="M0,0 C150,90 350,-40 500,60 C650,160 900,-20 1200,40 L1200,120 L0,120 Z"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
        <path
          d="M0,40 C200,10 400,100 600,30 C800,-40 1000,80 1200,20"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>
    </div>
  );
}

export function KolamMotif({ size = 36, opacity = 0.35, color = 'var(--primary)', style = {} }) {
  return (
    <div className="ambient-art-container" aria-hidden="true" style={{ display: 'inline-flex', ...style }}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{ opacity }}>
        {/* Core Kolam 4-way loop */}
        <circle cx="24" cy="24" r="3" fill={color} />
        <circle cx="12" cy="24" r="2" fill={color} />
        <circle cx="36" cy="24" r="2" fill={color} />
        <circle cx="24" cy="12" r="2" fill={color} />
        <circle cx="24" cy="36" r="2" fill={color} />
        
        <path
          d="M 12 24 C 12 12, 24 12, 24 24 C 24 36, 36 36, 36 24 C 36 12, 24 12, 24 24 C 24 36, 12 36, 12 24 Z"
          stroke={color}
          strokeWidth="1.2"
        />
        <path
          d="M 24 12 C 36 12, 36 24, 24 24 C 12 24, 12 36, 24 36 C 36 36, 36 24, 24 24 C 12 24, 12 12, 24 12 Z"
          stroke={color}
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

export function BanyanSilhouette({ width = 160, height = 120, opacity = 0.25, color = 'var(--primary)', style = {} }) {
  return (
    <div className="ambient-art-container" aria-hidden="true" style={{ ...style }}>
      <svg width={width} height={height} viewBox="0 0 200 150" fill="none" style={{ opacity }}>
        {/* Trunk & Aerial Roots */}
        <path d="M95 150 C95 110 85 90 70 70 C60 55 45 45 30 40" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M105 150 C105 110 115 90 130 70 C140 55 155 45 170 40" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M100 150 L100 65" stroke={color} strokeWidth="3" strokeLinecap="round" />
        
        {/* Branch Arcs */}
        <path d="M100 75 C80 60 60 65 40 75" stroke={color} strokeWidth="1.5" />
        <path d="M100 75 C120 60 140 65 160 75" stroke={color} strokeWidth="1.5" />
        <path d="M100 65 C90 40 110 30 100 15" stroke={color} strokeWidth="1.5" />
        
        {/* Soft Leaf Clusters */}
        <circle cx="30" cy="40" r="14" fill={color} fillOpacity="0.1" />
        <circle cx="170" cy="40" r="14" fill={color} fillOpacity="0.1" />
        <circle cx="100" cy="15" r="16" fill={color} fillOpacity="0.1" />
        <circle cx="65" cy="30" r="12" fill={color} fillOpacity="0.08" />
        <circle cx="135" cy="30" r="12" fill={color} fillOpacity="0.08" />
      </svg>
    </div>
  );
}

export function SunMoonSymbol({ size = 28, opacity = 0.4, color = 'var(--primary)', style = {} }) {
  return (
    <div className="ambient-art-container" aria-hidden="true" style={{ display: 'inline-flex', ...style }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity }}>
        <circle cx="16" cy="16" r="6" fill="none" stroke={color} strokeWidth="1.5" />
        <path d="M16 4v3M16 25v3M4 16h3M25 16h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M22 10 A7 7 0 0 1 22 22" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 3" />
      </svg>
    </div>
  );
}

export default {
  WaveDivider,
  KolamMotif,
  BanyanSilhouette,
  SunMoonSymbol
};
