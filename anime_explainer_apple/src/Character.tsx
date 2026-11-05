import React from 'react';
import {useCurrentFrame} from 'remotion';
import {CHARS, CharCfg} from './characters';

const INK = '#1b1b1b';
const SW = 7;
let uid = 0;

// 平塗り＋右側だけにはっきりした影＋太い黒線
const Shaded: React.FC<{fill: string; shade: string; dx?: number; children: React.ReactElement}> = ({fill, shade, dx = 22, children}) => {
  const id = React.useMemo(() => `m${uid++}`, []);
  const c = (p: any) => React.cloneElement(children, p);
  return (
    <g>
      {c({fill, stroke: 'none'})}
      <mask id={id}>
        {c({fill: '#fff', stroke: 'none'})}
        <g transform={`translate(${-dx},0)`}>{c({fill: '#000', stroke: 'none'})}</g>
      </mask>
      <g mask={`url(#${id})`}>{c({fill: shade, stroke: 'none'})}</g>
      {c({fill: 'none', stroke: INK, strokeWidth: SW, strokeLinejoin: 'round'})}
    </g>
  );
};

export type Expr = 'smile' | 'sad' | 'angry' | 'surprised' | 'think' | 'cry';
export type Pose = 'idle' | 'point' | 'up' | 'hips' | 'wave';

export const Character: React.FC<{
  who: string; x: number; y: number; scale?: number; flip?: boolean;
  expr?: Expr; pose?: Pose; talking?: boolean; seed?: number;
}> = ({who, x, y, scale = 1, flip = false, expr = 'smile', pose = 'idle', talking = false, seed = 0}) => {
  const f = useCurrentFrame() + seed;
  const c: CharCfg = CHARS[who];
  const bob = Math.sin(f / 11) * 4;
  const sway = Math.sin(f / 23) * 1.2;
  const blink = f % 96 < 5;
  const eyeRy = blink ? 2 : 13;
  const mouthOpen = talking ? 6 + Math.abs(Math.sin(f * 0.85)) * 17 : 0;
  const HY = -300; // 頭の中心
  // 眉
  const browY = HY - 52;
  const brows = {
    smile: [[-66, browY, -30, browY - 4], [30, browY - 4, 66, browY]],
    think: [[-66, browY - 2, -30, browY - 8], [30, browY, 66, browY + 2]],
    sad: [[-66, browY + 6, -30, browY - 6], [30, browY - 6, 66, browY + 6]],
    cry: [[-66, browY + 8, -30, browY - 8], [30, browY - 8, 66, browY + 8]],
    angry: [[-66, browY - 8, -30, browY + 6], [30, browY + 6, 66, browY - 8]],
    surprised: [[-66, browY - 16, -30, browY - 20], [30, browY - 20, 66, browY - 16]],
  }[expr];
  // 口
  const mouthY = HY + 58;
  let mouth: React.ReactNode;
  if (talking || expr === 'surprised') {
    const ry = talking ? mouthOpen : 20;
    mouth = <ellipse cx={0} cy={mouthY} rx={expr === 'surprised' ? 16 : 22} ry={ry} fill="#8a2323" stroke={INK} strokeWidth={SW - 1} />;
  } else if (expr === 'smile') {
    mouth = <path d={`M -34 ${mouthY - 10} Q 0 ${mouthY + 34} 34 ${mouthY - 10} Z`} fill="#fff" stroke={INK} strokeWidth={SW - 1} strokeLinejoin="round" />;
  } else if (expr === 'sad' || expr === 'cry') {
    mouth = <path d={`M -26 ${mouthY + 8} Q 0 ${mouthY - 16} 26 ${mouthY + 8}`} fill="none" stroke={INK} strokeWidth={SW - 1} strokeLinecap="round" />;
  } else if (expr === 'angry') {
    mouth = <path d={`M -28 ${mouthY + 4} L 28 ${mouthY - 2}`} fill="none" stroke={INK} strokeWidth={SW - 1} strokeLinecap="round" />;
  } else {
    mouth = <path d={`M -18 ${mouthY} Q 6 ${mouthY - 8} 26 ${mouthY - 2}`} fill="none" stroke={INK} strokeWidth={SW - 1} strokeLinecap="round" />;
  }
  // 腕
  const wob = Math.sin(f / 9) * 6;
  const sh = {l: [-56, -170], r: [56, -170]};
  const hands: Record<Pose, {l: number[]; r: number[]}> = {
    idle: {l: [-100, -95], r: [100, -95]},
    point: {l: [-100, -95], r: [170, -250 + wob]},
    up: {l: [-120, -270 + wob], r: [120, -270 - wob]},
    hips: {l: [-88, -120], r: [88, -120]},
    wave: {l: [-100, -95], r: [140, -280 + wob * 2]},
  };
  const hd = hands[pose];
  const Arm: React.FC<{s: number[]; h: number[]}> = ({s, h}) => (
    <g>
      <path d={`M ${s[0]} ${s[1]} Q ${(s[0] + h[0]) / 2 + (h[0] > 0 ? 18 : -18)} ${(s[1] + h[1]) / 2 + 20} ${h[0]} ${h[1]}`} fill="none" stroke={INK} strokeWidth={SW + 1} strokeLinecap="round" />
      <Shaded fill={c.skin} shade={c.skinShade} dx={8}><circle cx={h[0]} cy={h[1]} r={22} /></Shaded>
    </g>
  );
  const tilt = expr === 'think' ? -4 : 0;
  return (
    <g transform={`translate(${x} ${y - 50 + bob}) scale(${flip ? -scale : scale} ${scale}) rotate(${sway})`}>
      {/* 影 */}
      <ellipse cx={0} cy={4} rx={110} ry={14} fill="rgba(0,0,0,0.13)" />
      {/* 足 */}
      <g>
        <Shaded fill={c.pants} shade={c.outfitShade} dx={8}><rect x={-46} y={-70} width={34} height={64} rx={14} /></Shaded>
        <Shaded fill={c.pants} shade={c.outfitShade} dx={8}><rect x={12} y={-70} width={34} height={64} rx={14} /></Shaded>
        <Shaded fill="#c54a3a" shade="#8f2f24" dx={10}><ellipse cx={-34} cy={-4} rx={30} ry={14} /></Shaded>
        <Shaded fill="#c54a3a" shade="#8f2f24" dx={10}><ellipse cx={34} cy={-4} rx={30} ry={14} /></Shaded>
      </g>
      {/* 腕（体の後ろ） */}
      <Arm s={sh.l} h={hd.l} />
      {/* 体 */}
      <Shaded fill={c.outfit} shade={c.outfitShade} dx={26}><rect x={-66} y={-200} width={132} height={150} rx={46} /></Shaded>
      {c.style === 'spiky' && <path d="M -30 -130 L 30 -130" stroke="none" />}
      <Arm s={sh.r} h={hd.r} />
      {/* マフラー */}
      {c.scarf && (
        <g>
          <Shaded fill={c.scarf} shade="#d9a40f" dx={20}><rect x={-62} y={-216} width={124} height={40} rx={20} /></Shaded>
          <Shaded fill={c.scarf} shade="#d9a40f" dx={12}><rect x={20} y={-190} width={36} height={70} rx={14} /></Shaded>
        </g>
      )}
      {/* 頭 */}
      <g transform={`rotate(${tilt} 0 ${HY + 60})`}>
        {c.style === 'bob' && (
          <Shaded fill={c.hair} shade={c.hairShade} dx={26}><path d={`M -150 ${HY + 40} C -160 ${HY - 150} 160 ${HY - 150} 150 ${HY + 40} L 150 ${HY + 90} L -150 ${HY + 90} Z`} /></Shaded>
        )}
        <Shaded fill={c.skin} shade={c.skinShade} dx={34}><ellipse cx={0} cy={HY} rx={138} ry={122} /></Shaded>
        {/* 前髪・髪型 */}
        {c.style === 'bob' && (
          <Shaded fill={c.hair} shade={c.hairShade} dx={26}><path d={`M -132 ${HY - 34} C -110 ${HY - 130} 110 ${HY - 130} 132 ${HY - 34} C 90 ${HY - 78} -20 ${HY - 56} -132 ${HY - 34} Z`} /></Shaded>
        )}
        {c.style === 'spiky' && (
          <Shaded fill={c.hair} shade={c.hairShade} dx={26}><path d={`M -134 ${HY - 30} L -120 ${HY - 100} L -84 ${HY - 80} L -62 ${HY - 150} L -24 ${HY - 100} L 10 ${HY - 160} L 40 ${HY - 100} L 86 ${HY - 138} L 96 ${HY - 80} L 134 ${HY - 96} L 132 ${HY - 30} C 80 ${HY - 70} -40 ${HY - 56} -134 ${HY - 30} Z`} /></Shaded>
        )}
        {c.style === 'short' && (
          <Shaded fill={c.hair} shade={c.hairShade} dx={26}><path d={`M -130 ${HY - 40} C -120 ${HY - 130} 120 ${HY - 130} 130 ${HY - 40} C 90 ${HY - 70} -60 ${HY - 70} -130 ${HY - 40} Z`} /></Shaded>
        )}
        {c.hat && (
          <g>
            <Shaded fill={c.hat} shade="#a82424" dx={30}><ellipse cx={-6} cy={HY - 108} rx={120} ry={46} /></Shaded>
            <Shaded fill={c.hat} shade="#a82424" dx={6}><rect x={-12} y={HY - 168} width={26} height={30} rx={10} /></Shaded>
          </g>
        )}
        {/* 目（小さな黒い縦長の丸・離れている） */}
        <ellipse cx={-50} cy={HY + 10} rx={8} ry={eyeRy} fill={INK} />
        <ellipse cx={50} cy={HY + 10} rx={8} ry={eyeRy} fill={INK} />
        {expr === 'cry' && (
          <g fill="#8fd3ff" stroke={INK} strokeWidth={4}>
            <path d={`M -56 ${HY + 28} q -10 26 0 38 q 10 -12 0 -38 z`} />
            <path d={`M 56 ${HY + 28} q -10 26 0 38 q 10 -12 0 -38 z`} />
          </g>
        )}
        {c.glasses && (
          <g fill="none" stroke={INK} strokeWidth={5}>
            <circle cx={-50} cy={HY + 10} r={34} />
            <circle cx={50} cy={HY + 10} r={34} />
            <path d={`M -16 ${HY + 8} L 16 ${HY + 8}`} />
          </g>
        )}
        {/* 眉（太い線） */}
        {brows.map((b, i) => (
          <path key={i} d={`M ${b[0]} ${b[1]} L ${b[2]} ${b[3]}`} stroke={INK} strokeWidth={10} strokeLinecap="round" />
        ))}
        {mouth}
      </g>
    </g>
  );
};
