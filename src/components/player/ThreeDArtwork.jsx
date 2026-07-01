import React from 'react';

const getDeterministicTheme = (str) => {
  let hash = 0;
  if (str) {
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
  } else {
    hash = Math.floor(Math.random() * 1000);
  }
  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash >> 1) % 20); // 70% - 90%
  const l = 45 + (Math.abs(hash >> 2) % 12); // 45% - 57%
  return { h, s, l };
};

export default function ThreeDArtwork({ title, id, isCompact = false }) {
  const { h, s, l } = getDeterministicTheme(title || id || '');
  const primaryColor = `hsl(${h}, ${s}%, ${l}%)`;
  const secondaryColor = `hsl(${(h + 50) % 360}, ${s}%, ${l - 10}%)`;
  const accentColor = `hsl(${(h - 50) % 360}, ${s + 10}%, ${l + 10}%)`;

  const safeId = (id || title || 'gen').replace(/[^a-zA-Z0-9]/g, '');

  if (isCompact) {
    return (
      <svg className="w-full h-full select-none animate-pulse-slow" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`grad-compact-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="6" fill={`url(#grad-compact-${safeId})`} />
        {/* Subtle glass overlay orb */}
        <circle cx="50" cy="50" r="32" fill="white" opacity="0.12" />
        <circle cx="46" cy="46" r="24" fill="white" opacity="0.2" />
        <path
          d="M44 38 C44 35, 46 33, 49 33 L55 33 C58 33, 58 35, 58 37 L58 53 C58 55, 56 56, 54 56 L48 56 C45 56, 44 54, 44 52 L44 38 Z"
          fill="white"
          opacity="0.85"
        />
        <circle cx="48" cy="50" r="4" fill={`url(#grad-compact-${safeId})`} />
      </svg>
    );
  }

  return (
    <svg className="w-full h-full select-none" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`hsl(${h}, ${s}%, 15%)`} />
          <stop offset="50%" stopColor={`hsl(${(h + 40) % 360}, ${s - 10}%, 8%)`} />
          <stop offset="100%" stopColor="#05050c" />
        </linearGradient>
        <linearGradient id={`sphere-${safeId}`} x1="30%" y1="30%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="35%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={`hsl(${(h + 60) % 360}, ${s}%, 4%)`} />
        </linearGradient>
        <linearGradient id={`ring-grad-${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accentColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <filter id={`shadow-${safeId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#000000" floodOpacity="0.75" />
        </filter>
        <filter id={`glow-${safeId}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background with custom dark theme gradient */}
      <rect width="200" height="200" fill={`url(#bg-${safeId})`} />

      {/* Grid lines with 3D perspective effect */}
      <g stroke="rgba(255, 255, 255, 0.04)" strokeWidth="0.75">
        <line x1="0" y1="150" x2="200" y2="150" />
        <line x1="0" y1="165" x2="200" y2="165" />
        <line x1="0" y1="180" x2="200" y2="180" />
        <line x1="0" y1="195" x2="200" y2="195" />
        
        <line x1="20" y1="200" x2="60" y2="135" />
        <line x1="60" y1="200" x2="85" y2="135" />
        <line x1="100" y1="200" x2="100" y2="135" />
        <line x1="140" y1="200" x2="115" y2="135" />
        <line x1="180" y1="200" x2="140" y2="135" />
      </g>

      {/* Floating 3D Glowing Torus Ring (Tilted) */}
      <ellipse
        cx="100"
        cy="115"
        rx="70"
        ry="22"
        stroke={`url(#ring-grad-${safeId})`}
        strokeWidth="6"
        opacity="0.65"
        transform="rotate(-12 100 115)"
        filter={`url(#glow-${safeId})`}
      />

      {/* Glassmorphic 3D central sphere */}
      <circle cx="100" cy="95" r="42" fill={`url(#sphere-${safeId})`} filter={`url(#shadow-${safeId})`} />

      {/* Holographic reflection highlight on sphere */}
      <path
        d="M 68 80 A 42 42 0 0 1 112 58"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* Floating Isometric Music Note in front */}
      <g transform="translate(86, 76) scale(0.95)" filter="drop-shadow(0px 6px 5px rgba(0,0,0,0.65))">
        {/* Double Music Note geometry */}
        <ellipse cx="10" cy="24" rx="7" ry="4.5" fill="white" transform="rotate(-15 10 24)" />
        <ellipse cx="26" cy="20" rx="7" ry="4.5" fill="white" transform="rotate(-15 26 20)" />
        <path d="M 15 24 L 15 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 31 20 L 31 -2" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 15 2 L 32 -2 L 32 2 L 15 6 Z" fill="white" />
      </g>

      {/* Glowing 3D dust particles */}
      <circle cx="48" cy="55" r="2.5" fill="white" opacity="0.8" filter={`url(#glow-${safeId})`} />
      <circle cx="152" cy="70" r="4" fill={accentColor} opacity="0.75" filter={`url(#glow-${safeId})`} />
      <circle cx="135" cy="135" r="2" fill="white" opacity="0.4" />
      <circle cx="65" cy="130" r="1.5" fill={primaryColor} opacity="0.6" />
    </svg>
  );
}
