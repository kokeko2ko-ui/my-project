import React from 'react';
import {useCurrentFrame, spring, Easing} from 'remotion';
import {HAND} from './fonts';

// 手元・お皿のアップ（引きのカットと交互に使う）
const INK = '#1b1b1b';
const W = 1920;
const rnd = (i: number, k = 0) => { const x = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const ease = (t: number) => Easing.out(Easing.cubic)(Math.min(1, Math.max(0, t)));

const Chip: React.FC<{text: string; x: number; y: number; f: number}> = ({text, x, y, f}) => {
  const s = spring({frame: f - 4, fps: 30, config: {damping: 11, stiffness: 140}, durationInFrames: 20});
  const size = 58, w = [...text].length * size * 0.98 + 80;
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, s)})`}>
      <rect x={-w / 2} y={-size * 0.8} width={w} height={size * 1.5} rx={size * 0.5} fill="#ffe14d" stroke={INK} strokeWidth={7} />
      <text x={0} y={size * 0.28} textAnchor="middle" fontFamily={HAND} fontSize={size} fill={INK}>{text}</text>
    </g>
  );
};
const Steam: React.FC<{f: number; xs: number[]; y: number; op?: number}> = ({f, xs, y, op = 0.85}) => (
  <g>{xs.map((x, i) => (
    <path key={i} d={`M ${x} ${y} q -30 -50 0 -100 q 30 -50 0 -100`} fill="none" stroke="#fff" strokeWidth={14} strokeLinecap="round" opacity={op}
      transform={`translate(0 ${-((f * 2.4 + i * 50) % 90)})`} />
  ))}</g>
);
const Grain: React.FC<{x: number; y: number; r: number; c: string}> = ({x, y, r, c}) => (
  <ellipse cx={x} cy={y} rx={17} ry={10} transform={`rotate(${r} ${x} ${y})`} fill={c} stroke={c === '#fffdf0' ? '#cfc59c' : '#d9a62a'} strokeWidth={3} />
);
const Plate: React.FC = () => (
  <g>
    <ellipse cx={900} cy={790} rx={640} ry={190} fill="rgba(0,0,0,0.18)" />
    <ellipse cx={900} cy={760} rx={620} ry={190} fill="#f7f3ea" stroke={INK} strokeWidth={8} />
    <ellipse cx={900} cy={770} rx={470} ry={130} fill="#ece6d6" stroke="#cdc3aa" strokeWidth={4} />
  </g>
);

export const Closeup: React.FC<{cut: any; dur: number}> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const kind = cut.kind as 'spread' | 'chop' | 'plate';
  const push = 1 + 0.06 * Math.min(1, f / 90);
  let body: React.ReactNode = null;
  if (kind === 'spread') {
    const sp = ease(f / 70);
    const stroke = Math.sin(f / 9);
    body = (
      <g>
        <Plate />
        {Array.from({length: 120}).map((_, i) => {
          const a = rnd(i) * Math.PI * 2, r = Math.sqrt(rnd(i, 1)) * (230 + 330 * sp);
          return <Grain key={i} x={900 + Math.cos(a) * r} y={760 + Math.sin(a) * r * 0.27 - (1 - sp) * 30 * (1 - r / 560)} r={rnd(i, 2) * 180} c="#fffdf0" />;
        })}
        <g transform={`translate(${900 + stroke * 160} ${740}) rotate(${-25 + stroke * 8})`}>
          <rect x={-90} y={-24} width={180} height={52} rx={14} fill="#e8c27a" stroke={INK} strokeWidth={7} />
          <rect x={80} y={-10} width={360} height={26} rx={12} fill="#a8703c" stroke={INK} strokeWidth={7} />
        </g>
        <Steam f={f} xs={[620, 900, 1180]} y={600} op={Math.max(0.15, 0.9 - f / 110)} />
      </g>
    );
  } else if (kind === 'chop') {
    const P = 16;
    const count = Math.min(18, Math.floor(f / P));
    const ph = (f % P) / P;
    const down = Math.max(0, Math.sin(ph * Math.PI));
    const ang = -30 + 30 * down;
    const xc = 560 + count * 42;
    body = (
      <g>
        <rect x={200} y={470} width={1400} height={420} rx={30} fill="#e0aa66" stroke={INK} strokeWidth={8} />
        {[0, 1, 2, 3].map((i) => <path key={i} d={`M 240 ${520 + i * 95} q 300 -26 600 0 t 700 0`} stroke="#c88c48" strokeWidth={5} fill="none" />)}
        {/* 切ったねぎ */}
        {Array.from({length: count}).map((_, i) => {
          const hop = i === count - 1 ? -Math.sin(ph * Math.PI) * 14 : 0;
          return <ellipse key={i} cx={520 + i * 42} cy={720 + hop} rx={14} ry={30} fill="#7ed06a" stroke="#2f7d3b" strokeWidth={5} />;
        })}
        {/* ねぎ（これから切る） */}
        <rect x={xc} y={690} width={Math.max(10, 1400 - xc)} height={60} rx={28} fill="#7ed06a" stroke="#2f7d3b" strokeWidth={6} />
        <rect x={xc} y={690} width={Math.max(10, 1400 - xc)} height={16} rx={8} fill="#b9ee9d" />
        {/* ハム（小さく切ったもの） */}
        {Array.from({length: 7}).map((_, i) => <rect key={i} x={560 + (i % 4) * 56} y={540 + Math.floor(i / 4) * 52} width={44} height={36} rx={6} fill="#ff9aa8" stroke="#c9566a" strokeWidth={4} />)}
        {/* 包丁 */}
        <g transform={`translate(${xc + 20} 620) rotate(${ang / 3} 0 120)`}>
          <path d="M -20 0 L 560 0 Q 600 0 600 40 L -20 130 Z" transform="rotate(90 0 0) translate(0 -20) scale(0.5 1)" fill="none" />
          <path d="M -130 120 L 130 120 L 130 -40 Q 130 -80 90 -90 L -130 -90 Z" fill="#e8eef5" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <rect x={-130} y={90} width={260} height={30} fill="#c3ccd8" />
          <rect x={90} y={-150} width={170} height={52} rx={16} transform="rotate(-8 90 -120)" fill="#5a3a22" stroke={INK} strokeWidth={7} />
        </g>
      </g>
    );
  } else {
    body = (
      <g>
        <Plate />
        {Array.from({length: 190}).map((_, i) => {
          const x = (rnd(i) - 0.5) * 2 * 380, dome = Math.sqrt(Math.max(0, 1 - (x / 400) ** 2));
          const y = 770 - rnd(i, 1) * dome * 330;
          const k = rnd(i, 3);
          const c = k < 0.5 ? '#ffe27a' : k < 0.75 ? '#fffdf0' : k < 0.88 ? '#ff9aa8' : '#7ed06a';
          return <Grain key={i} x={900 + x} y={y} r={rnd(i, 2) * 180} c={c} />;
        }).sort((a: any, b: any) => a.props.y - b.props.y)}
        <g transform="translate(1430 800) rotate(-18)">
          <ellipse cx={0} cy={0} rx={70} ry={42} fill="#e8eef5" stroke={INK} strokeWidth={7} />
          <rect x={60} y={-12} width={300} height={24} rx={12} fill="#e8eef5" stroke={INK} strokeWidth={7} />
        </g>
        <Steam f={f} xs={[700, 900, 1100]} y={560} />
        {[[520, 430, 56, 0], [1330, 400, 46, 9], [1180, 520, 34, 4]].map(([x, y, r, d], i) => {
          const k = 0.55 + 0.45 * Math.sin((f + d) / 6);
          return <path key={i} d={`M ${x} ${y - r * k} L ${x + r * 0.22 * k} ${y - r * 0.22 * k} L ${x + r * k} ${y} L ${x + r * 0.22 * k} ${y + r * 0.22 * k} L ${x} ${y + r * k} L ${x - r * 0.22 * k} ${y + r * 0.22 * k} L ${x - r * k} ${y} L ${x - r * 0.22 * k} ${y - r * 0.22 * k} Z`} fill="#fff6a8" stroke="#e8b800" strokeWidth={3} />;
        })}
      </g>
    );
  }
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <g transform={`translate(900 640) scale(${push}) translate(-900 -640)`}>{body}</g>
      {cut.label && <text x={1080} y={170} textAnchor="middle" fontFamily={HAND} fontSize={96} fill={cut.labelColor || '#e23030'} stroke={cut.labelColor === '#ffe14d' ? INK : '#fff'} strokeWidth={cut.labelColor === '#ffe14d' ? 16 : 12} paintOrder="stroke" strokeLinejoin="round">{cut.label}</text>}
      {cut.chip && <Chip text={cut.chip} x={cut.chipX ?? 620} y={cut.chipY ?? 300} f={f} />}
    </svg>
  );
};
