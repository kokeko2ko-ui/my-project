import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame} from 'remotion';
import {HAND, SUB} from './fonts';

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const outline = (w: number, color = '#1b1b1b'): React.CSSProperties => ({WebkitTextStroke: `${w}px ${color}`, paintOrder: 'stroke fill'} as any);

// ---- 台所の背景（ステンレスの壁・タイル・棚・吊りフライパン・木のカウンター）----
export const Kitchen: React.FC = () => {
  const vt = Array.from({length: 14}, (_, i) => i * 150);
  const ht = Array.from({length: 8}, (_, i) => i * 110);
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e4e8ec" /><stop offset="1" stopColor="#b7bec6" /></linearGradient>
          <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bb7f4b" /><stop offset="1" stopColor="#7a4829" /></linearGradient>
          <radialGradient id="vig" cx="50%" cy="48%" r="78%"><stop offset="0.62" stopColor="rgba(0,0,0,0)" /><stop offset="1" stopColor="rgba(0,0,0,0.30)" /></radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#wall)" />
        {ht.map((y) => <line key={'h' + y} x1={0} x2={1920} y1={y} y2={y} stroke="#a9b1ba" strokeWidth={3} opacity={0.75} />)}
        {vt.map((x, i) => ht.slice(0, 7).map((y, j) => <line key={`v${x}${y}`} x1={x + (j % 2) * 75} x2={x + (j % 2) * 75} y1={y} y2={y + 110} stroke="#a9b1ba" strokeWidth={3} opacity={0.75} />))}
        {/* 吊りフライパン */}
        <line x1={50} x2={640} y1={96} y2={96} stroke="#4a4f57" strokeWidth={10} strokeLinecap="round" />
        {[160, 400].map((x, i) => (
          <g key={x}>
            <line x1={x} x2={x} y1={96} y2={150} stroke="#4a4f57" strokeWidth={6} />
            <circle cx={x} cy={228 + i * 10} r={74} fill="#33373e" stroke="#1b1b1b" strokeWidth={6} />
            <circle cx={x} cy={228 + i * 10} r={52} fill="#454a52" />
          </g>
        ))}
        {/* 棚と瓶 */}
        <rect x={1180} y={300} width={640} height={22} rx={6} fill="#8a5a3c" stroke="#1b1b1b" strokeWidth={5} />
        {[1230, 1330, 1430, 1560, 1670].map((x, i) => (
          <g key={x}>
            <rect x={x} y={300 - 90 - (i % 2) * 20} width={70} height={90 + (i % 2) * 20} rx={12} fill={['#e8c36a', '#d9d9d9', '#b86a4a', '#8fb98a', '#e8c36a'][i]} stroke="#1b1b1b" strokeWidth={5} />
            <rect x={x + 10} y={300 - 108 - (i % 2) * 20} width={50} height={20} rx={6} fill="#4a4f57" stroke="#1b1b1b" strokeWidth={4} />
          </g>
        ))}
        {/* カウンター */}
        <rect x={0} y={800} width={1920} height={280} fill="url(#wood)" />
        {[830, 880, 940, 1000, 1050].map((y, i) => <path key={y} d={`M 0 ${y} Q 480 ${y - 10 + i * 3} 960 ${y} T 1920 ${y}`} stroke="#6a3b1f" strokeWidth={3} fill="none" opacity={0.5} />)}
        <rect x={0} y={786} width={1920} height={20} fill="#cc9460" stroke="#4d2a14" strokeWidth={5} />
        <rect width={1920} height={1080} fill="url(#vig)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---- 上の題名の帯 ----
export const Banner: React.FC<{lines: string[]}> = ({lines}) => (
  <div style={{position: 'absolute', left: 22, top: 12, transform: 'skewX(-6deg)', transformOrigin: '0 0'}}>
    <div style={{display: 'inline-block', background: '#d62828', border: '4px solid #fff', padding: '2px 22px', fontFamily: SUB, fontWeight: 900, fontSize: 46, color: '#fff', boxShadow: '4px 4px 0 rgba(0,0,0,0.35)'}}>{lines[0]}</div>
    {lines[1] && <div style={{fontFamily: HAND, fontSize: 88, lineHeight: 1.1, color: '#ffe14d', ...outline(16)}}>{lines[1]}</div>}
  </div>
);

// ---- 右上の工程名 ----
export const SectionTag: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', right: 22, top: 18, background: 'rgba(15,15,20,0.78)', border: '4px solid #fff', borderRadius: 12, padding: '4px 26px', fontFamily: SUB, fontWeight: 900, fontSize: 48, color: '#fff'}}>{text}</div>
);

// ---- 黄色い「コツ」パネル（数が増えていく）----
export const PointsPanel: React.FC<{points: string[]; shown: number; hl: number}> = ({points, shown, hl}) => {
  if (shown <= 0) return null;
  const frame = useCurrentFrame();
  const flash = 0.5 + 0.5 * Math.sin(frame / 4);
  return (
    <div style={{position: 'absolute', right: 20, top: 118, width: 300, background: '#ffe14d', border: '5px solid #1b1b1b', borderRadius: 16, overflow: 'hidden', boxShadow: '5px 5px 0 rgba(0,0,0,0.3)'}}>
      <div style={{background: '#d62828', color: '#fff', fontFamily: SUB, fontWeight: 900, fontSize: 34, textAlign: 'center', padding: '4px 0'}}>コツ</div>
      {points.slice(0, shown).map((p, i) => {
        const size = Math.min(36, 270 / ([...p].length + 1.4));
        const on = i === hl;
        return (
          <div key={i} style={{padding: '8px 12px', fontFamily: SUB, fontWeight: 900, fontSize: size, color: '#1b1b1b', background: on ? `rgba(255,255,255,${0.35 + 0.35 * flash})` : 'transparent', borderTop: i ? '3px dashed rgba(0,0,0,0.25)' : 'none'}}>
            {'①②③④⑤⑥'[i]}{p}
          </div>
        );
      })}
    </div>
  );
};

const splitLines = (s: string, max = 20) => {
  const chars = [...s];
  if (chars.length <= max) return [s];
  const mid = chars.length / 2;
  let best = -1, bd = 1e9;
  chars.forEach((ch, i) => { if ('、。，！？'.includes(ch) && i < chars.length - 1 && Math.abs(i - mid) < bd) { bd = Math.abs(i - mid); best = i; } });
  if (best < 0) best = Math.floor(mid);
  return [chars.slice(0, best + 1).join(''), chars.slice(best + 1).join('')];
};

// ---- 下の大きな縁取りテロップ（話者ごとに色）----
export const Telop: React.FC<{text: string; color: string; sinceFrames: number}> = ({text, color, sinceFrames}) => {
  const lines = splitLines(text);
  const longest = Math.max(...lines.map((l) => [...l].length));
  const size = Math.min(70, 1780 / longest);
  const sc = interpolate(sinceFrames, [0, 5], [0.9, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', justifyContent: 'center', transform: `scale(${sc})`, transformOrigin: '50% 100%'}}>
      <div style={{textAlign: 'center'}}>
        {lines.map((l, i) => (
          <div key={i} style={{fontFamily: SUB, fontWeight: 900, fontSize: size, lineHeight: 1.22, color, ...outline(Math.max(10, size * 0.2))}}>{l}</div>
        ))}
      </div>
    </div>
  );
};

// ---- 反応の文字（「マジっすか!?」など。ポンと出る）----
export const Reaction: React.FC<{text: string; x?: number; y?: number; rot?: number; color?: string}> = ({text, x = 560, y = 330, rot = -8, color = '#ffe14d'}) => {
  const f = useCurrentFrame();
  const s = spring({frame: f - 8, fps: 30, config: {damping: 9, stiffness: 160}, durationInFrames: 20});
  const op = interpolate(f, [60, 75], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${Math.max(s, 0.001)})`, opacity: op, fontFamily: HAND, fontSize: 130, color, whiteSpace: 'nowrap', ...outline(22)}}>{text}</div>
  );
};

// ---- 最後の「登録・高評価」帯 ----
export const Cta: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame();
  const s = spring({frame: f - 6, fps: 30, config: {damping: 11, stiffness: 140}, durationInFrames: 22});
  return (
    <div style={{position: 'absolute', left: 900, top: 176, display: 'flex', justifyContent: 'center', transform: `scale(${Math.max(s, 0.001)})`, transformOrigin: '0 0'}}>
      <div style={{background: '#ffe14d', border: '6px solid #1b1b1b', borderRadius: 24, padding: '10px 30px', textAlign: 'center', fontFamily: SUB, fontWeight: 900, fontSize: 50, lineHeight: 1.25, color: '#1b1b1b', boxShadow: '8px 8px 0 rgba(0,0,0,0.3)'}}>
        {text.split('\n').map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
};
