import React, {useContext} from 'react';
import {useCurrentFrame, spring, interpolate, Easing} from 'remotion';
import {Character} from './Character';
import {HAND} from './fonts';
import {TalkCtx} from './Scenes';
import {RichCtx, RichDefs} from './Rich';

// フライパン場面：中身が動く（ご飯が跳ねる・卵が広がる・具が飛び込む・油がはねる・火加減）
const INK = '#1b1b1b';
const W = 1920;
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const rnd = (i: number, k = 0) => { const x = Math.sin((i + 1) * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const ease = (t: number) => Easing.out(Easing.cubic)(Math.min(1, Math.max(0, t)));

type Mode = 'toss' | 'still' | 'clump' | 'loose' | 'crowd';
type PanState = {
  fire: 'low' | 'mid' | 'high';
  oil?: boolean;
  egg?: 'pour' | 'spread';
  rice?: 'drop' | 'on';
  coat?: number;     // 0..1 卵がからんだ粒の割合
  ham?: 'drop' | 'on';
  mode?: Mode;       // ご飯の動き
  season?: boolean;
  done?: boolean;
  steam?: number;    // 0..3
  pv?: 'flat' | 'deep' | 'tilt'; // 鍋の形（flat=今の形、deep=深く丸い、tilt=deepで前に傾ける）
};

const N = 84;
const GRAINS = Array.from({length: N}, (_, i) => {
  const r = Math.sqrt((i + 0.5) / N), a = i * 2.39996;
  return {i, x: Math.cos(a) * r * 290, y: Math.sin(a) * r * 74, rot: rnd(i) * 180, h: 70 + rnd(i, 1) * 150, off: rnd(i, 2) * 0.14};
}).sort((a, b) => a.y - b.y);
const CLUSTERS = [[-190, -20], [-60, 30], [80, -30], [190, 25], [-10, -48], [-130, 50], [120, 52]];
const HAMS = Array.from({length: 9}, (_, i) => ({i, x: (rnd(i, 5) - 0.5) * 460, y: (rnd(i, 6) - 0.5) * 100, h: 90 + rnd(i, 7) * 130, off: rnd(i, 8) * 0.14, d: 10 + i * 3}));
const NEGI = Array.from({length: 12}, (_, i) => ({i, x: (rnd(i, 9) - 0.5) * 480, y: (rnd(i, 10) - 0.5) * 100, h: 90 + rnd(i, 11) * 150, off: rnd(i, 12) * 0.14, d: 12 + i * 2}));

const Flames: React.FC<{f: number; fire: string; seed?: number}> = ({f, fire, seed = 0}) => {
  const base = {low: 30, mid: 62, high: 105}[fire as 'low'] ?? 62;
  const col = fire === 'high' ? '#ff4a1c' : fire === 'mid' ? '#ff9a2e' : '#ffc94a';
  const rich = useContext(RichCtx);
  return (
    <g>
      {rich && <ellipse cx={0} cy={-26} rx={300} ry={50 + base * 0.45} fill={fire === 'low' ? '#6aa0ff' : '#ff8a2e'} opacity={0.34} filter="url(#b28)" />}
      {[-210, -140, -70, 0, 70, 140, 210].map((x, i) => {
        const h = base + 18 + Math.sin(f / 3 + i * 1.9 + seed) * (fire === 'high' ? 22 : 9);
        if (rich) {
          return (
            <g key={i} filter="url(#b2)">
              <path d={`M ${x - 34} 6 Q ${x - 24} ${6 - h * 0.6} ${x} ${6 - h} Q ${x + 24} ${6 - h * 0.6} ${x + 34} 6 Z`} fill={fire === 'low' ? 'url(#flameB)' : 'url(#flameG)'} opacity={0.95} />
              <path d={`M ${x - 14} 4 Q ${x - 8} ${4 - h * 0.4} ${x} ${4 - h * 0.62} Q ${x + 8} ${4 - h * 0.4} ${x + 14} 4 Z`} fill="#fff6c8" opacity={0.75} />
            </g>
          );
        }
        return (
          <g key={i}>
            <path d={`M ${x - 32} 6 Q ${x - 22} ${6 - h * 0.6} ${x} ${6 - h} Q ${x + 22} ${6 - h * 0.6} ${x + 32} 6 Z`} fill={col} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
            <path d={`M ${x - 14} 4 Q ${x - 8} ${4 - h * 0.4} ${x} ${4 - h * 0.6} Q ${x + 8} ${4 - h * 0.4} ${x + 14} 4 Z`} fill="#ffe27a" />
          </g>
        );
      })}
    </g>
  );
};

// 1つのフライパン（原点＝鍋の中心）
const PanView: React.FC<{f: number; st: PanState}> = ({f, st}) => {
  const rich = useContext(RichCtx);
  const mode: Mode = st.mode || 'still';
  const P = 30; // 1回のあおりの長さ（フレーム）
  const toss = mode === 'toss';
  const ph = (f / P) % 1;
  const jerk = toss ? Math.sin(ph * Math.PI * 2) : 0;
  const potRot = (toss ? -6 * Math.sin(ph * Math.PI * 2 + 0.6) : 0) + (st.pv === 'tilt' ? -9 : 0);
  const potY = toss ? -22 * Math.max(0, Math.sin(ph * Math.PI)) : 0;
  const deep = st.pv === 'deep' || st.pv === 'tilt';
  const DY = deep ? 34 : 0;
  const hasRice = !!st.rice;
  const dropT = (i: number) => (st.rice === 'drop' ? ease((f - 4 - rnd(i, 3) * 12) / 14) : 1);
  const coat = st.coat ?? 0;
  const lift = (g: {h: number; off: number}) => {
    if (!toss) return 0;
    const p = (f / P + g.off) % 1;
    return 4 * p * (1 - p) * g.h;
  };
  const hamDrop = (d: number) => (st.ham === 'drop' ? spring({frame: f - d, fps: 30, config: {damping: 9, stiffness: 120}, durationInFrames: 24}) : 1);
  return (
    <g>
      {rich && <ellipse cx={0} cy={(deep ? 316 : 262) + 30} rx={440} ry={40} fill="#000" opacity={0.4} filter="url(#b14)" />}
      <g transform={`translate(0 ${260 + (deep ? 56 : 0)})`}><Flames f={f} fire={st.fire} /></g>
      {rich ? <rect x={-260} y={250 + (deep ? 56 : 0)} width={520} height={26} rx={13} fill="url(#steel)" stroke="#14151a" strokeWidth={3} /> : <rect x={-260} y={250 + (deep ? 56 : 0)} width={520} height={26} rx={13} fill="#6a6a74" stroke={INK} strokeWidth={6} />}
      <g transform={`translate(0 ${potY}) rotate(${potRot} 330 40)`}>
        {/* 持ち手 */}
        <path d="M 300 20 L 640 -10 Q 668 -12 668 14 Q 668 40 640 40 L 300 62 Z" fill={rich ? 'url(#handle)' : '#6a4a30'} stroke={rich ? '#24140a' : INK} strokeWidth={rich ? 3 : 7} strokeLinejoin="round" />
        {rich && <path d="M 330 26 L 636 -2" stroke="#e3b48a" strokeWidth={5} opacity={0.5} strokeLinecap="round" />}
        {/* 鍋の胴 */}
        {rich ? (
          <>
            <path d="M -345 0 L 345 0 Q 330 240 205 270 L -205 270 Q -330 240 -345 0 Z" fill="url(#steel)" stroke="#14151a" strokeWidth={3} strokeLinejoin="round" />
            <path d="M -330 60 Q -300 220 -200 252" stroke="#fff" strokeWidth={6} fill="none" opacity={0.25} strokeLinecap="round" filter="url(#b2)" />
            <ellipse cx={0} cy={0} rx={350} ry={150} fill="url(#rim)" stroke="#14151a" strokeWidth={3} />
            <path d="M -312 8 A 312 132 0 0 1 312 8 L 290 34 A 290 100 0 0 0 -290 34 Z" fill="#4c4f58" />
            <path d="M -320 -34 A 340 140 0 0 1 -110 -128" stroke="#fff" strokeWidth={7} fill="none" opacity={0.55} strokeLinecap="round" filter="url(#b2)" />
            <ellipse cx={0} cy={34} rx={292} ry={100} fill="url(#floor)" />
          </>
        ) : deep ? (
          <>
            <path d="M -345 0 L 345 0 Q 330 240 205 270 L -205 270 Q -330 240 -345 0 Z" fill="#4a4a54" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            <ellipse cx={0} cy={0} rx={350} ry={150} fill="#74747f" stroke={INK} strokeWidth={8} />
            <path d="M -312 8 A 312 132 0 0 1 312 8 L 290 34 A 290 100 0 0 0 -290 34 Z" fill="#5b5b66" />
            <ellipse cx={0} cy={34} rx={292} ry={100} fill="#3c3c46" stroke={INK} strokeWidth={5} />
          </>
        ) : (
          <>
            <path d="M -340 0 L 340 0 Q 320 190 200 214 L -200 214 Q -320 190 -340 0 Z" fill="#4a4a54" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            <ellipse cx={0} cy={0} rx={350} ry={112} fill="#6a6a76" stroke={INK} strokeWidth={8} />
            <ellipse cx={0} cy={6} rx={308} ry={90} fill="#3c3c46" stroke={INK} strokeWidth={5} />
          </>
        )}
        <g transform={`translate(0 ${DY})`}>
        {/* 油（少しだけ。鍋の底にうすく広がる） */}
        {st.oil && !hasRice && !st.egg && (() => {
          const s = 0.7 + 0.3 * ease(f / 20);
          return (
            <g>
              <ellipse cx={0} cy={14} rx={105 * s} ry={26 * s} fill="#f3d36b" opacity={rich ? 0.4 : 0.55} stroke={rich ? 'none' : '#e8c04a'} strokeWidth={2} />
              {rich && <ellipse cx={-30 + Math.sin(f / 9) * 24} cy={8} rx={34} ry={8} fill="#fff" opacity={0.55} filter="url(#b2)" />}
              <path d={`M ${-50 + Math.sin(f / 5) * 10} 8 q 30 -10 62 0`} stroke="#fff6c8" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
              {[0, 1, 2].map((i) => {
                const q = (f / 12 + rnd(i, 50)) % 1;
                return <circle key={i} cx={-60 + rnd(i, 51) * 120} cy={14 + (rnd(i, 52) - 0.5) * 30} r={2 + q * 5} fill="none" stroke="#fff6c8" strokeWidth={2.5} opacity={1 - q} />;
              })}
            </g>
          );
        })()}
        {/* 卵 */}
        {st.egg && (() => {
          const s = st.egg === 'spread' ? 1 : ease((f - 14) / 40);
          return (
            <g>
              <ellipse cx={0} cy={8} rx={250 * s + 30} ry={66 * s + 8} fill={rich ? 'url(#egg)' : '#ffe14d'} stroke={rich ? '#c98a14' : '#e8b22a'} strokeWidth={rich ? 2 : 5} opacity={st.rice ? 0.4 : 1} />
              {rich && !st.rice && <ellipse cx={-70} cy={-8} rx={(130 * s + 20)} ry={(18 * s + 4)} fill="#fff" opacity={0.35} filter="url(#b6)" />}
              {!st.rice && [0, 1, 2, 3, 4, 5].map((i) => {
                const q = (f / 14 + rnd(i, 13)) % 1;
                return <circle key={i} cx={(rnd(i, 14) - 0.5) * 380 * s} cy={8 + (rnd(i, 15) - 0.5) * 80 * s} r={4 + q * 11} fill="#fff2a0" stroke="#e8b22a" strokeWidth={3} opacity={1 - q} />;
              })}
            </g>
          );
        })()}
        {/* ご飯 */}
        {hasRice && GRAINS.map((g) => {
          const c = mode === 'clump' || mode === 'crowd' ? CLUSTERS[g.i % CLUSTERS.length] : null;
          const bx = c ? c[0] + (rnd(g.i, 20) - 0.5) * 120 : g.x;
          const by = c ? c[1] + (rnd(g.i, 21) - 0.5) * 50 : g.y;
          const L = lift(g);
          const p = (f / P + g.off) % 1;
          const dx = toss ? Math.sin(p * Math.PI * 2) * (rnd(g.i, 22) - 0.5) * 36 : (mode === 'clump' ? Math.sin(f / 6 + g.i) * 1.5 : 0);
          const dt = dropT(g.i);
          const y = by - L - (1 - dt) * (1 - dt) * 460 + (mode === 'loose' ? -Math.abs(Math.sin(f / 5 + g.i * 0.9)) * 7 : 0);
          const coated = rnd(g.i, 23) < coat;
          if (st.rice === 'drop' && dt <= 0) return null;
          const rr = g.rot + (toss ? p * 240 : 0);
          return <ellipse key={g.i} cx={bx + dx} cy={y} rx={mode === 'clump' || mode === 'crowd' ? 17 : 13} ry={mode === 'clump' || mode === 'crowd' ? 11 : 8} transform={`rotate(${rr} ${bx + dx} ${y})`} fill={rich ? (coated ? 'url(#riceY)' : 'url(#rice)') : (coated ? '#ffe27a' : '#fffdf0')} stroke={rich ? 'rgba(110,80,20,0.4)' : (coated ? '#d9a62a' : '#cfc59c')} strokeWidth={rich ? 1.5 : 2.5} />;
        })}
        {/* 具（ハム・ねぎ） */}
        {st.ham && HAMS.map((h) => {
          const d = hamDrop(h.d);
          const L = lift(h);
          const y = h.y - L - (1 - d) * 440;
          if (st.ham === 'drop' && f < h.d - 1) return null;
          return <rect key={'h' + h.i} x={h.x - 15} y={y - 11} width={30} height={22} rx={5} transform={`rotate(${h.i * 40 + (toss ? ((f / P + h.off) % 1) * 200 : 0)} ${h.x} ${y})`} fill={rich ? 'url(#ham)' : '#ff9aa8'} stroke={rich ? 'rgba(120,30,50,0.45)' : '#c9566a'} strokeWidth={rich ? 1.5 : 3} />;
        })}
        {st.ham && NEGI.map((n) => {
          const d = hamDrop(n.d);
          const L = lift(n);
          const y = n.y - L - (1 - d) * 440;
          if (st.ham === 'drop' && f < n.d - 1) return null;
          return <circle key={'n' + n.i} cx={n.x} cy={y} r={8} fill={rich ? 'url(#negi)' : '#5fbf4a'} stroke={rich ? 'rgba(30,90,30,0.5)' : '#2f7d3b'} strokeWidth={rich ? 1.5 : 3} />;
        })}
        {/* 調味料 */}
        {st.season && (
          <g>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const p = ((f / 18) + rnd(i, 30)) % 1;
              return <circle key={i} cx={-60 + rnd(i, 31) * 120} cy={-300 + p * 300} r={5} fill="#fff" stroke="#bbb" strokeWidth={2} opacity={f < 36 ? 1 : 0} />;
            })}
            <g opacity={f > 36 ? 1 : 0}>
              <g transform="translate(300 -300) rotate(-125)"><rect x={-34} y={-70} width={68} height={140} rx={16} fill="#4a2a14" stroke={INK} strokeWidth={6} /><rect x={-18} y={-92} width={36} height={26} rx={6} fill="#fff" stroke={INK} strokeWidth={5} /></g>
              <path d={`M 232 -262 Q 226 -130 ${215 - Math.sin(f / 4) * 3} 14`} stroke="#6b3a1a" strokeWidth={12} fill="none" strokeLinecap="round" />
            </g>
            {f > 44 && [0, 1, 2, 3, 4].map((i) => {
              const q = ((f - 44) / 12 + rnd(i, 32)) % 1;
              return <circle key={'s' + i} cx={150 + (rnd(i, 33) - 0.5) * 140} cy={-q * 80} r={6 + q * 10} fill="#fff" opacity={0.7 * (1 - q)} />;
            })}
          </g>
        )}
        {/* 卵が流れ落ちる */}
        {st.egg === 'pour' && f < 34 && (
          <path d={`M -10 ${-420 + ease(f / 14) * 420} L -10 ${-420 + ease((f - 10) / 20) * 400}`} stroke="#ffe14d" strokeWidth={34} strokeLinecap="round" />
        )}
        </g>
      </g>
      {/* 油のはね */}
      {st.fire === 'high' && (st.oil || hasRice) && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const T = 22 + rnd(i, 40) * 14;
        const q = ((f + rnd(i, 41) * 40) % T) / T;
        const dir = rnd(i, 42) < 0.5 ? -1 : 1;
        return <circle key={i} cx={dir * (80 + q * 240 * (0.5 + rnd(i, 43)))} cy={-30 - Math.sin(q * Math.PI) * (120 + rnd(i, 44) * 120) + q * 70} r={7} fill="#ffd34e" stroke={rich ? 'none' : '#e8a82c'} strokeWidth={2} opacity={1 - q * 0.6} filter={rich ? 'url(#b2)' : undefined} />;
      })}
      {/* 湯気 */}
      {rich && (
        <g filter="url(#b14)">
          {Array.from({length: (st.steam ?? 0) * 3}).map((_, i) => {
            const q = ((f * 1.4 + i * 37) % 120) / 120;
            const x = -200 + (i % 3) * 200 + Math.sin(f / 18 + i) * 26;
            const clump = mode === 'clump' || mode === 'crowd';
            return <circle key={i} cx={x} cy={-60 - q * 190} r={30 + q * 40} fill={clump ? '#9aa8bc' : '#ffffff'} opacity={0.5 * Math.sin(Math.PI * q)} />;
          })}
        </g>
      )}
      {!rich && Array.from({length: st.steam ?? 0}).map((_, i) => (
        <path key={i} d={`M ${-170 + i * 170} -80 q -26 -44 0 -88 q 26 -44 0 -88`} fill="none" stroke={mode === 'clump' || mode === 'crowd' ? '#7f8fa6' : '#ffffff'} strokeWidth={11} strokeLinecap="round"
          opacity={0.8} transform={`translate(0 ${-((f * 2.2 + i * 45) % 80)})`} />
      ))}
      {/* べちゃべちゃの水っぽさ */}
      {(mode === 'clump' || mode === 'crowd') && [0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M ${-220 + i * 110} ${-130 + ((f + i * 9) % 40)} q 8 14 0 22 q -8 -8 0 -22 Z`} fill="#8ec5ee" stroke="#4a8fc8" strokeWidth={2.5} opacity={0.85} />
      ))}
    </g>
  );
};

const Chip: React.FC<{text: string; x: number; y: number; bg?: string; fg?: string; size?: number; f: number; delay?: number}> = ({text, x, y, bg = '#ffe14d', fg = INK, size = 56, f, delay = 0}) => {
  const s = spring({frame: f - delay, fps: 30, config: {damping: 11, stiffness: 140}, durationInFrames: 20});
  const w = [...text].length * size * 0.98 + 80;
  return (
    <g transform={`translate(${x} ${y}) scale(${Math.max(0.001, s)})`}>
      <rect x={-w / 2} y={-size * 0.8} width={w} height={size * 1.5} rx={size * 0.5} fill={bg} stroke={INK} strokeWidth={7} />
      <text x={0} y={size * 0.28} textAnchor="middle" fontFamily={HAND} fontSize={size} fill={fg}>{text}</text>
    </g>
  );
};

export const Wok: React.FC<{cut: any; dur: number}> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = useContext(TalkCtx);
  const rich = useContext(RichCtx);
  const z = 1 + 0.16 * (1 - ease(f / 9)); // 寄りの動き（カット頭で寄って落ち着く）
  const split = cut.split as undefined | {left: any; right: any};
  const fire = cut.fire || 'high';
  const base: PanState = {fire, oil: cut.oil, egg: cut.egg, rice: cut.rice, coat: cut.coat, ham: cut.ham, mode: cut.mode, season: cut.season, done: cut.done, steam: cut.steam ?? (fire === 'low' ? 1 : 2), pv: cut.pv ?? 'deep'};
  const toss = base.mode === 'toss';
  const pose = toss && Math.floor(f / 15) % 2 ? 'up' : 'point';
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      {rich && <RichDefs />}
      <g transform={`translate(960 640) scale(${z}) translate(-960 -640)`}>
        {cut.label && <text x={cut.labelX ?? 1080} y={170} textAnchor="middle" fontFamily={HAND} fontSize={cut.label.length > 14 ? 76 : 96} fill={cut.labelColor || '#e23030'} stroke={cut.labelColor === '#ffe14d' ? INK : '#fff'} strokeWidth={cut.labelColor === '#ffe14d' ? 16 : 12} paintOrder="stroke" strokeLinejoin="round">{cut.label}</text>}
        {split ? (
          <>
            {[split.left, split.right].map((s, k) => (
              <g key={k}>
                <g transform={`translate(${k === 0 ? 470 : 1230} 600) scale(0.6)`}>
                  <PanView f={f} st={{...base, ...s, rice: 'on', coat: s.coat ?? 0.6}} />
                </g>
                <Chip text={s.label} x={k === 0 ? 470 : 1230} y={830} bg={s.bg || (k === 0 ? '#9db4d0' : '#ffe14d')} f={f} delay={6 + k * 8} size={58} />
              </g>
            ))}
            <text x={850} y={620} textAnchor="middle" fontFamily={HAND} fontSize={90} fill="#fff" stroke={INK} strokeWidth={14} paintOrder="stroke">VS</text>
          </>
        ) : (
          <g transform={cut.close ? `translate(900 600) scale(${cut.close * (1 + 0.07 * Math.min(1, f / 90))}) translate(0 -20)` : `translate(${cut.x ?? 800} 640) scale(${cut.scale ?? 1.12})`}>
            <PanView f={f} st={base} />
          </g>
        )}
        {cut.chip && !(rich && cut.close) && <Chip text={cut.chip} x={cut.chipX ?? 560} y={cut.chipY ?? 300} f={f} delay={4} size={58} />}
        {base.done && [[500, 380, 56, 0], [1000, 330, 44, 9], [1230, 470, 36, 4]].map(([x, y, r, d], i) => {
          const k = 0.55 + 0.45 * Math.sin((f + d) / 6);
          return <path key={i} d={`M ${x} ${y - r * k} L ${x + r * 0.22 * k} ${y - r * 0.22 * k} L ${x + r * k} ${y} L ${x + r * 0.22 * k} ${y + r * 0.22 * k} L ${x} ${y + r * k} L ${x - r * 0.22 * k} ${y + r * 0.22 * k} L ${x - r * k} ${y} L ${x - r * 0.22 * k} ${y - r * 0.22 * k} Z`} fill="#fff6a8" stroke="#e8b800" strokeWidth={3} />;
        })}
      </g>
      {rich && !cut.close && <ellipse cx={split ? 1750 : 1670} cy={950} rx={120} ry={18} fill="#000" opacity={0.32} filter="url(#b14)" />}
      {!cut.close && <Character who={cut.who || 'mina'} x={split ? 1750 : 1670} y={940} scale={split ? 1.0 : 1.15} flip expr={cut.expr || 'smile'} pose={cut.pose || pose} talking={talk} />}
    </svg>
  );
};
