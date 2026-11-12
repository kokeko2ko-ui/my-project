import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {HAND} from './fonts';

// 「rich」な見た目：光・ツヤ・奥行き（storyboard の "look": "rich" で有効）
export const RichCtx = React.createContext(false);

export const RichDefs: React.FC = () => (
  <defs>
    <filter id="b2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" /></filter>
    <filter id="b6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
    <filter id="b14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
    <filter id="b28" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="28" /></filter>
    <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8b909a" /><stop offset="0.45" stopColor="#4d5058" /><stop offset="1" stopColor="#23252b" /></linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7a7f89" /><stop offset="0.35" stopColor="#c3c7cf" /><stop offset="0.6" stopColor="#6c7079" /><stop offset="1" stopColor="#3a3d44" /></linearGradient>
    <radialGradient id="floor" cx="0.5" cy="0.35" r="0.75"><stop offset="0" stopColor="#7b7e8a" /><stop offset="0.6" stopColor="#4a4c56" /><stop offset="1" stopColor="#2a2b32" /></radialGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a9714a" /><stop offset="1" stopColor="#5b3520" /></linearGradient>
    <linearGradient id="handle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a5a3a" /><stop offset="1" stopColor="#4a2d1b" /></linearGradient>
    <linearGradient id="flameG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff6a1f" /><stop offset="0.6" stopColor="#ffb02e" /><stop offset="1" stopColor="#ffe98a" /></linearGradient>
    <linearGradient id="flameB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#4a7bff" /><stop offset="1" stopColor="#bfe0ff" /></linearGradient>
    <radialGradient id="rice" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e4dcc0" /></radialGradient>
    <radialGradient id="riceY" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#fff3a8" /><stop offset="1" stopColor="#f0b92e" /></radialGradient>
    <radialGradient id="egg" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stopColor="#ffe970" /><stop offset="1" stopColor="#f2b01c" /></radialGradient>
    <radialGradient id="ham" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#ffc0c8" /><stop offset="1" stopColor="#e0707f" /></radialGradient>
    <radialGradient id="negi" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#b6f09a" /><stop offset="1" stopColor="#4fa83e" /></radialGradient>
    <linearGradient id="plateG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d9d2c0" /></linearGradient>
  </defs>
);

// 台所の背景：暖かい壁・ぼけた照明・ぼけた棚と吊り鍋・木のカウンター
export const KitchenRich: React.FC = () => {
  const f = useCurrentFrame();
  const bokeh = Array.from({length: 16}, (_, i) => ({x: 140 + ((i * 397) % 1700), y: 70 + ((i * 211) % 520), r: 26 + ((i * 37) % 54), o: 0.16 + ((i * 13) % 20) / 100}));
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <RichDefs />
        <defs>
          <linearGradient id="wallR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4e2c6" /><stop offset="1" stopColor="#c89c6e" /></linearGradient>
          <linearGradient id="counter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b57b4c" /><stop offset="0.12" stopColor="#8c5a36" /><stop offset="1" stopColor="#4c2e1b" /></linearGradient>
          <radialGradient id="lamp" cx="0.7" cy="0.15" r="0.7"><stop offset="0" stopColor="rgba(255,226,160,0.75)" /><stop offset="1" stopColor="rgba(255,226,160,0)" /></radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#wallR)" />
        <rect width={1920} height={1080} fill="url(#lamp)" />
        <g filter="url(#b14)">{bokeh.map((b, i) => <circle key={i} cx={b.x} cy={b.y + Math.sin((f + i * 20) / 70) * 6} r={b.r} fill={i % 3 ? '#fff1c8' : '#ffd08a'} opacity={b.o} />)}</g>
        <g filter="url(#b6)" opacity={0.85}>
          <rect x={1200} y={330} width={620} height={20} rx={6} fill="#7a4a2c" />
          {[1250, 1350, 1450, 1580, 1690].map((x, i) => <rect key={x} x={x} y={250 + (i % 2) * 10} width={64} height={80 - (i % 2) * 10} rx={12} fill={['#e0b24a', '#d9d9d9', '#b5603c', '#8fbf7f', '#e0b24a'][i]} />)}
          <line x1={60} x2={640} y1={96} y2={96} stroke="#3a3d44" strokeWidth={10} />
          {[170, 420].map((x, i) => <circle key={x} cx={x} cy={220 + i * 10} r={76} fill="#2c2e34" />)}
        </g>
        <rect x={0} y={800} width={1920} height={280} fill="url(#counter)" />
        <rect x={0} y={800} width={1920} height={5} fill="#d9a572" opacity={0.7} />
        <rect x={0} y={805} width={1920} height={40} fill="url(#lamp)" opacity={0.25} />
        {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M 0 ${850 + i * 52} q 480 -18 960 0 t 960 0`} stroke="#3e2414" strokeWidth={3} fill="none" opacity={0.3} />)}
      </svg>
    </AbsoluteFill>
  );
};

// 全体の色と周辺の暗がり
export const Grade: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 55%, rgba(20,8,0,0.42) 100%)'}} />
    <div style={{position: 'absolute', inset: 0, background: 'rgba(255,170,90,0.10)', mixBlendMode: 'soft-light'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 230, background: 'linear-gradient(to top, rgba(0,0,0,0.38), rgba(0,0,0,0))'}} />
  </AbsoluteFill>
);

// 章の切り替え（カチンコ）：左から黒い板がすっと入って出る。約0.7秒
export const ChapterCard: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 6, 15, 21], [-1, 0, 0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tx = x <= 0 ? x * 1920 : x * 1920;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: tx, top: 380, width: 1920, height: 240, background: 'rgba(18,14,12,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40}}>
        <svg width={150} height={130} viewBox="0 0 150 130">
          <rect x={6} y={44} width={138} height={78} rx={8} fill="#2b2b2b" stroke="#fff" strokeWidth={5} />
          <g transform={`rotate(${f < 9 ? -16 + f * 1.8 : 0} 10 44)`}><rect x={6} y={14} width={138} height={30} rx={6} fill="#fff" /><path d="M 26 14 l 22 30 M 62 14 l 22 30 M 98 14 l 22 30" stroke="#222" strokeWidth={9} /></g>
        </svg>
        <span style={{fontFamily: HAND, fontSize: 112, color: '#fff', letterSpacing: 4}}>{text}</span>
      </div>
    </AbsoluteFill>
  );
};
