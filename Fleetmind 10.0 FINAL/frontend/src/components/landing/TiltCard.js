import React, { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * 3D Interactive Tilt Card with "Stitch" Cyber-Industrial Accents
 * Features dynamic mouse tracking, specular light reflection, and depth pop
 */
export default function TiltCard({ role, onSelect }) {
  const cardRef = useRef(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [sheenStyle, setSheenStyle] = useState({ opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Angle calculation (-12deg to +12deg)
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`
    );

    // Specular light sheen following cursor
    setSheenStyle({
      opacity: 0.65,
      background: `radial-gradient(circle 240px at ${x}px ${y}px, rgba(255,255,255,0.18), transparent 70%)`,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)');
    setSheenStyle({ opacity: 0 });
  };

  const Icon = role.icon;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelect(role.id)}
      style={{
        transform: transformStyle,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        transformStyle: 'preserve-3d',
      }}
      className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl cursor-pointer select-none
        bg-gradient-to-b from-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-slate-800/80
        hover:border-${role.themeColor}-500/60 shadow-xl transition-colors duration-300 overflow-hidden`}
    >
      {/* Specular sheen reflection */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={sheenStyle}
      />

      {/* Cyber "Stitch" corner crosshairs (+) */}
      <span className="absolute top-2 left-2.5 text-slate-600 font-mono text-[10px] select-none group-hover:text-slate-400 transition-colors">+</span>
      <span className="absolute top-2 right-2.5 text-slate-600 font-mono text-[10px] select-none group-hover:text-slate-400 transition-colors">+</span>
      <span className="absolute bottom-2 left-2.5 text-slate-600 font-mono text-[10px] select-none group-hover:text-slate-400 transition-colors">+</span>
      <span className="absolute bottom-2 right-2.5 text-slate-600 font-mono text-[10px] select-none group-hover:text-slate-400 transition-colors">+</span>

      {/* Ambient background glow according to role */}
      <div
        className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${role.glowBg}`}
      />

      {/* Top Header & 3D Pop Icon */}
      <div style={{ transform: 'translateZ(30px)' }} className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center border shadow-inner transition-transform duration-300 group-hover:scale-110 ${role.iconBg} ${role.iconBorder}`}
          >
            <Icon size={28} className={role.iconColor} />
          </div>
          <span className="text-[11px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full border border-slate-700/80 bg-slate-800/50 text-slate-300 group-hover:border-slate-600">
            {role.code}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white group-hover:text-white flex items-center gap-2">
          {role.name}
        </h3>
        <p className="text-slate-400 text-sm mt-2 line-clamp-3 leading-relaxed">
          {role.description}
        </p>
      </div>

      {/* Middle Tags */}
      <div style={{ transform: 'translateZ(20px)' }} className="relative z-10 my-5 flex flex-wrap gap-1.5">
        {role.tags.map((tag, idx) => (
          <span
            key={idx}
            className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/50 text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bottom CTA Action Button with Stitched Line */}
      <div style={{ transform: 'translateZ(35px)' }} className="relative z-10 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-sm font-semibold transition-colors duration-200">
          <span className={`${role.textColor} group-hover:underline flex items-center gap-1.5`}>
            Launch Portal
          </span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 bg-slate-800/80 group-hover:bg-white group-hover:text-slate-900 text-slate-300 group-hover:translate-x-1`}
          >
            <ArrowRight size={15} />
          </div>
        </div>
      </div>
    </div>
  );
}

