import React from 'react';

interface MascotProps {
  mood: 'neutral' | 'happy' | 'sad' | 'shocked';
  className?: string;
  faceColor?: string;
}

export const Mascot: React.FC<MascotProps> = ({ mood, className = "w-32 h-32", faceColor = "white" }) => {
  return (
    <svg viewBox="0 0 100 100" className={`drop-shadow-xl ${className}`}>
      {/* Face Base */}
      <circle cx="50" cy="50" r="48" fill={faceColor} stroke="black" strokeWidth="2.5" />
      
      {/* Cheeks (Subtle blush that works on colors) */}
      <ellipse cx="20" cy="55" rx="6" ry="3.5" fill="#FF0000" opacity="0.1" />
      <ellipse cx="80" cy="55" rx="6" ry="3.5" fill="#FF0000" opacity="0.1" />

      {/* Eyes & Mouth Variations */}
      
      {mood === 'neutral' && (
        <>
          {/* Eyes */}
          <circle cx="35" cy="45" r="5" fill="black" />
          <circle cx="65" cy="45" r="5" fill="black" />
          {/* Mouth: Small smile */}
          <path d="M 40 65 Q 50 72 60 65" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}

      {mood === 'happy' && (
        <>
          {/* Eyes: Closed happy arcs */}
          <path d="M 28 45 Q 35 40 42 45" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 58 45 Q 65 40 72 45" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
          {/* Mouth: Big open laugh */}
          <path d="M 35 60 Q 50 85 65 60 Z" fill="black" />
          <path d="M 35 60 Q 50 85 65 60" fill="none" stroke="black" strokeWidth="2.5" strokeLinejoin="round" />
        </>
      )}

      {mood === 'sad' && (
        <>
          {/* Eyes: slightly down */}
          <circle cx="35" cy="48" r="5" fill="black" />
          <circle cx="65" cy="48" r="5" fill="black" />
          {/* Eyebrows: Worried */}
          <path d="M 28 38 Q 35 35 42 40" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" />
          <path d="M 58 40 Q 65 35 72 38" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" />
          {/* Mouth: Wobbly or Frown */}
          <path d="M 40 70 Q 50 62 60 70" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}

      {mood === 'shocked' && (
        <>
          {/* Eyes: Wide open */}
          <circle cx="35" cy="45" r="6" fill="black" />
          <circle cx="65" cy="45" r="6" fill="black" />
          {/* Mouth: O shape */}
          <ellipse cx="50" cy="65" rx="8" ry="10" fill="black" />
        </>
      )}
    </svg>
  );
};