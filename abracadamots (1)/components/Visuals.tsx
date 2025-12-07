import React from 'react';

// --- Cloud Component ---
export const Clouds = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    <div className="absolute top-10 left-0 text-white opacity-80 animate-cloud-slow text-9xl">☁️</div>
    <div className="absolute top-40 left-0 text-white opacity-60 animate-cloud-fast text-8xl" style={{ animationDelay: '-10s' }}>☁️</div>
    <div className="absolute top-80 left-0 text-white opacity-40 animate-cloud-medium text-9xl" style={{ animationDelay: '-5s' }}>☁️</div>
  </div>
);

// --- Magic Poof Effect Component ---
export const MagicPoof = () => {
  // Generate random offsets for smoke and stars
  // Using fixed seed-like behavior for hydration stability if needed, but random is fine for this effect
  const particles = [...Array(8)].map((_, i) => ({
    id: i,
    tx: `${(Math.random() - 0.5) * 150}px`,
    ty: `${(Math.random() - 0.5) * 150}px`,
    delay: `${Math.random() * 0.2}s`,
    size: Math.random() > 0.5 ? 'w-16 h-16' : 'w-24 h-24'
  }));

  const stars = [...Array(10)].map((_, i) => ({
    id: i,
    tx: `${(Math.random() - 0.5) * 200}px`,
    ty: `${(Math.random() - 0.5) * 200}px`,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Smoke Clouds */}
      {particles.map(p => (
        <div 
          key={`smoke-${p.id}`}
          className={`absolute ${p.size} bg-slate-200 rounded-full opacity-0 animate-smoke-puff`}
          style={{ 
            '--tx': p.tx, 
            '--ty': p.ty,
            animationDelay: p.delay
          } as React.CSSProperties}
        />
      ))}
      
      {/* Stars */}
      {stars.map(s => (
        <div 
          key={`star-${s.id}`}
          className="absolute text-brand-yellow animate-star-burst"
          style={{ 
            '--tx': s.tx, 
            '--ty': s.ty,
            fontSize: `${Math.random() * 20 + 20}px`
          } as React.CSSProperties}
        >
          ✨
        </div>
      ))}
    </div>
  );
};