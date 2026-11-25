import React from 'react';
import {useCurrentFrame} from 'remotion';
import {RichDefs} from './Rich';

// 「rich」版のキャラ：やわらかい線・グラデーション・ほほ・光る目。シェフ（chef）と後輩（kohai）
export type RichExpr = 'smile' | 'sad' | 'angry' | 'surprised' | 'think' | 'cry';
export type RichPose = 'idle' | 'point' | 'up' | 'hips' | 'wave';

const LINE = '#5b3624';
const DARK = '#14141a';

const Defs: React.FC = () => (
  <defs>
    <radialGradient id="rcSkin" cx="0.42" cy="0.35" r="0.8"><stop offset="0" stopColor="#ffeedb" /><stop offset="0.6" stopColor="#ffd6b0" /><stop offset="1" stopColor="#e9a982" /></radialGradient>
    <linearGradient id="rcCoat" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff" /><stop offset="0.6" stopColor="#f1f3f8" /><stop offset="1" stopColor="#cdd4e0" /></linearGradient>
    <linearGradient id="rcCoatV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d7dce7" /></linearGradient>
    <linearGradient id="rcApron" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3a3b44" /><stop offset="0.5" stopColor="#25262d" /><stop offset="1" stopColor="#14151a" /></linearGradient>
    <linearGradient id="rcHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a4a56" /><stop offset="0.35" stopColor="#1f1f26" /><stop offset="1" stopColor="#0c0c10" /></linearGradient>
    <linearGradient id="rcStache" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b4a36" /><stop offset="1" stopColor="#2e1d14" /></linearGradient>
    <linearGradient id="rcPants" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4a4e5c" /><stop offset="1" stopColor="#2a2d38" /></linearGradient>
    <linearGradient id="rcBand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d9dde6" /></linearGradient>
    <radialGradient id="rcGold" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#fff2a8" /><stop offset="1" stopColor="#c99a1c" /></radialGradient>
  </defs>
);

export const RichCharacter: React.FC<{
  kind: 'chef' | 'kohai'; x: number; y: number; scale?: number; flip?: boolean;
  expr?: RichExpr; pose?: RichPose; talking?: boolean; amp?: number; seed?: number;
}> = ({kind, x, y, scale = 1, flip = false, expr = 'smile', pose = 'idle', talking = false, amp = 0, seed = 0}) => {
  const f = useCurrentFrame() + seed;
  const chef = kind === 'chef';
  const bob = Math.sin(f / 11) * 4;
  const sway = Math.sin(f / 23) * 1.2;
  const blink = f % 96 < 5;
  const HY = -300;
  const open = talking ? 3 + amp * 22 : 0;
  const wob = Math.sin(f / 9) * 6;

  // 腕の位置（肩→手）
  const sh = {l: [-64, -176], r: [64, -176]};
  const hands: Record<RichPose, {l: number[]; r: number[]}> = {
    idle: {l: [-104, -92], r: [104, -92]},
    point: {l: [-104, -92], r: [172, -252 + wob]},
    up: {l: [-122, -268 + wob], r: [122, -268 - wob]},
    hips: {l: [-92, -118], r: [92, -118]},
    wave: {l: [-104, -92], r: [142, -282 + wob * 2]},
  };
  const hd = hands[pose];
  const sleeve = chef ? 'url(#rcCoat)' : 'url(#rcSkin)';
  const Arm: React.FC<{s: number[]; h: number[]; side: number}> = ({s, h, side}) => {
    const mx = (s[0] + h[0]) / 2 + side * 16, my = (s[1] + h[1]) / 2 + 22;
    const d = `M ${s[0]} ${s[1]} Q ${mx} ${my} ${h[0]} ${h[1]}`;
    return (
      <g>
        <path d={d} stroke={chef ? LINE : LINE} strokeWidth={chef ? 52 : 40} strokeLinecap="round" fill="none" />
        <path d={d} stroke={sleeve} strokeWidth={chef ? 46 : 34} strokeLinecap="round" fill="none" />
        {chef && <path d={d} stroke="#fff" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.4} transform="translate(-6 -4)" />}
        {/* 手首のそで口（シェフ） */}
        {chef && <ellipse cx={h[0] - (h[0] - mx) * 0.14} cy={h[1] - (h[1] - my) * 0.14} rx={27} ry={14} fill="url(#rcCoatV)" stroke={LINE} strokeWidth={3} transform={`rotate(${Math.atan2(h[1] - my, h[0] - mx) * 57.3 + 90} ${h[0] - (h[0] - mx) * 0.14} ${h[1] - (h[1] - my) * 0.14})`} />}
        {/* 手 */}
        <circle cx={h[0]} cy={h[1]} r={26} fill="url(#rcSkin)" stroke={LINE} strokeWidth={3.5} />
        <path d={`M ${h[0] - 10} ${h[1] - 8} q 10 -10 20 0`} stroke="#e9a982" strokeWidth={3} fill="none" opacity={0.7} strokeLinecap="round" />
      </g>
    );
  };

  // 眉
  const bY = HY - 50;
  const brow = {
    smile: [[-72, bY + 2, -32, bY - 6], [32, bY - 6, 72, bY + 2]],
    think: [[-72, bY - 2, -32, bY - 12], [32, bY + 2, 72, bY + 4]],
    sad: [[-70, bY + 10, -32, bY - 6], [32, bY - 6, 70, bY + 10]],
    cry: [[-70, bY + 12, -32, bY - 8], [32, bY - 8, 70, bY + 12]],
    angry: [[-72, bY - 10, -30, bY + 8], [30, bY + 8, 72, bY - 10]],
    surprised: [[-72, bY - 18, -32, bY - 24], [32, bY - 24, 72, bY - 18]],
  }[expr];
  const eyeRy = blink ? 2 : expr === 'surprised' ? 21 : 17;
  const irisRy = blink ? 0 : expr === 'surprised' ? 11 : 14;
  const look = expr === 'think' ? 6 : 0;
  const mY = HY + (chef ? 92 : 70);
  let mouth: React.ReactNode;
  if (talking || expr === 'surprised') {
    const ry = talking ? open : 20;
    mouth = (
      <g>
        <ellipse cx={0} cy={mY} rx={expr === 'surprised' ? 17 : 24} ry={Math.max(4, ry)} fill="#7a1f26" stroke={LINE} strokeWidth={3} />
        <ellipse cx={0} cy={mY + Math.max(4, ry) * 0.45} rx={13} ry={Math.max(2, ry * 0.4)} fill="#e0707d" />
        {ry > 8 && <path d={`M -16 ${mY - ry + 3} Q 0 ${mY - ry + 9} 16 ${mY - ry + 3}`} fill="#fff" stroke="none" />}
      </g>
    );
  } else if (expr === 'smile') {
    mouth = (
      <g>
        <path d={`M -38 ${mY - 8} Q 0 ${mY + 38} 38 ${mY - 8} Q 0 ${mY + 4} -38 ${mY - 8} Z`} fill="#7a1f26" stroke={LINE} strokeWidth={3} strokeLinejoin="round" />
        <path d={`M -30 ${mY - 4} Q 0 ${mY + 8} 30 ${mY - 4} L 28 ${mY + 2} Q 0 ${mY + 14} -28 ${mY + 2} Z`} fill="#fff" />
      </g>
    );
  } else if (expr === 'sad' || expr === 'cry') {
    mouth = <path d={`M -28 ${mY + 10} Q 0 ${mY - 18} 28 ${mY + 10}`} fill="none" stroke={LINE} strokeWidth={5} strokeLinecap="round" />;
  } else if (expr === 'angry') {
    mouth = <path d={`M -30 ${mY + 4} Q 0 ${mY - 8} 30 ${mY + 4}`} fill="none" stroke={LINE} strokeWidth={5} strokeLinecap="round" />;
  } else {
    mouth = <path d={`M -20 ${mY} Q 6 ${mY - 8} 28 ${mY - 2}`} fill="none" stroke={LINE} strokeWidth={5} strokeLinecap="round" />;
  }

  return (
    <g transform={`translate(${x} ${y - 50 + bob}) scale(${flip ? -scale : scale} ${scale}) rotate(${sway})`}>
      <Defs />
      <RichDefs />
      {/* 床の影 */}
      <ellipse cx={0} cy={6} rx={118} ry={16} fill="#000" opacity={0.32} filter="url(#b6)" />
      {/* 脚・靴 */}
      <g>
        <rect x={-50} y={-76} width={38} height={66} rx={14} fill={chef ? 'url(#rcPants)' : '#6a4f3a'} stroke={LINE} strokeWidth={3.5} />
        <rect x={12} y={-76} width={38} height={66} rx={14} fill={chef ? 'url(#rcPants)' : '#6a4f3a'} stroke={LINE} strokeWidth={3.5} />
        <ellipse cx={-34} cy={-6} rx={34} ry={15} fill="#3a2a22" stroke={DARK} strokeWidth={3} />
        <ellipse cx={34} cy={-6} rx={34} ry={15} fill="#3a2a22" stroke={DARK} strokeWidth={3} />
        <ellipse cx={-42} cy={-11} rx={14} ry={4} fill="#fff" opacity={0.25} /><ellipse cx={26} cy={-11} rx={14} ry={4} fill="#fff" opacity={0.25} />
      </g>
      <Arm s={sh.l} h={hd.l} side={-1} />
      {/* 体 */}
      {chef ? (
        <g>
          <path d="M -76 -206 Q 0 -230 76 -206 Q 92 -140 84 -62 Q 0 -44 -84 -62 Q -92 -140 -76 -206 Z" fill="url(#rcCoat)" stroke={LINE} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M -50 -206 L 0 -120 L 50 -206" fill="none" stroke="#cdd4e0" strokeWidth={4} />
          <path d="M 0 -118 L 0 -52" stroke="#cdd4e0" strokeWidth={4} />
          {[-150, -112, -76].map((yy) => <g key={yy}><circle cx={-22} cy={yy} r={7} fill="url(#rcGold)" stroke="#8a6a12" strokeWidth={2} /><circle cx={22} cy={yy} r={7} fill="url(#rcGold)" stroke="#8a6a12" strokeWidth={2} /></g>)}
          <path d="M -58 -200 Q 0 -178 58 -200 L 44 -216 Q 0 -200 -44 -216 Z" fill="#e23b3b" stroke="#8f1f1f" strokeWidth={3} strokeLinejoin="round" />
          <path d="M -70 -190 Q -78 -130 -72 -80" stroke="#fff" strokeWidth={10} fill="none" opacity={0.35} strokeLinecap="round" filter="url(#b2)" />
        </g>
      ) : (
        <g>
          <path d="M -72 -206 Q 0 -228 72 -206 Q 88 -140 80 -62 Q 0 -44 -80 -62 Q -88 -140 -72 -206 Z" fill="#f1f1f4" stroke={LINE} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M -54 -190 Q 0 -176 54 -190 L 62 -62 Q 0 -48 -62 -62 Z" fill="url(#rcApron)" stroke={DARK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M -40 -190 L -30 -218 M 40 -190 L 30 -218" stroke="#25262d" strokeWidth={9} strokeLinecap="round" />
          <rect x={-26} y={-128} width={52} height={34} rx={8} fill="#2e2f37" stroke={DARK} strokeWidth={2.5} />
          <path d="M -46 -176 Q -30 -186 -20 -176" stroke="#fff" strokeWidth={5} fill="none" opacity={0.18} strokeLinecap="round" />
        </g>
      )}
      <Arm s={sh.r} h={hd.r} side={1} />
      {/* 首 */}
      <rect x={-26} y={HY + 90} width={52} height={40} rx={16} fill="#e9a982" stroke={LINE} strokeWidth={3} />
      {/* 頭 */}
      <g transform={`rotate(${expr === 'think' ? -4 : 0} 0 ${HY + 60})`}>
        {/* 髪（うしろ）／耳 */}
        <ellipse cx={-134} cy={HY + 10} rx={20} ry={28} fill="url(#rcSkin)" stroke={LINE} strokeWidth={3.5} />
        <ellipse cx={134} cy={HY + 10} rx={20} ry={28} fill="url(#rcSkin)" stroke={LINE} strokeWidth={3.5} />
        <ellipse cx={0} cy={HY} rx={136} ry={120} fill="url(#rcSkin)" stroke={LINE} strokeWidth={3.5} />
        <ellipse cx={-62} cy={HY + 46} rx={30} ry={18} fill="#ff9a8a" opacity={0.42} filter="url(#b6)" />
        <ellipse cx={62} cy={HY + 46} rx={30} ry={18} fill="#ff9a8a" opacity={0.42} filter="url(#b6)" />
        <ellipse cx={-40} cy={HY - 56} rx={52} ry={18} fill="#fff" opacity={0.35} filter="url(#b6)" />
        {chef ? (
          <g>
            {/* コック帽 */}
            <path d={`M -112 ${HY - 70} C -170 ${HY - 130} -140 ${HY - 270} -58 ${HY - 262} C -30 ${HY - 346} 70 ${HY - 346} 88 ${HY - 262} C 160 ${HY - 270} 170 ${HY - 130} 112 ${HY - 70} Z`} fill="url(#rcCoat)" stroke={LINE} strokeWidth={3.5} strokeLinejoin="round" />
            <path d={`M -44 ${HY - 250} Q -50 ${HY - 160} -40 ${HY - 80} M 8 ${HY - 270} Q 12 ${HY - 170} 8 ${HY - 80} M 56 ${HY - 250} Q 62 ${HY - 160} 52 ${HY - 80}`} stroke="#cdd4e0" strokeWidth={4} fill="none" strokeLinecap="round" />
            <path d={`M -120 ${HY - 90} Q -100 ${HY - 200} -60 ${HY - 250}`} stroke="#fff" strokeWidth={9} fill="none" opacity={0.7} strokeLinecap="round" filter="url(#b2)" />
            <rect x={-118} y={HY - 82} width={236} height={42} rx={16} fill="url(#rcBand)" stroke={LINE} strokeWidth={3.5} />
          </g>
        ) : (
          <g>
            {/* ツンツン髪 */}
            <path d={`M -138 ${HY - 20} L -126 ${HY - 104} L -90 ${HY - 84} L -66 ${HY - 160} L -26 ${HY - 106} L 10 ${HY - 170} L 42 ${HY - 106} L 88 ${HY - 146} L 98 ${HY - 84} L 136 ${HY - 100} L 138 ${HY - 20} C 90 ${HY - 66} -40 ${HY - 56} -138 ${HY - 20} Z`} fill="url(#rcHair)" stroke={DARK} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M -80 ${HY - 100} L -62 ${HY - 140} M 10 ${HY - 110} L 14 ${HY - 150}`} stroke="#8a8aa0" strokeWidth={5} opacity={0.7} strokeLinecap="round" />
            {/* はちまき */}
            <path d={`M -138 ${HY - 34} C -60 ${HY - 76} 60 ${HY - 76} 138 ${HY - 34} L 138 ${HY - 8} C 60 ${HY - 50} -60 ${HY - 50} -138 ${HY - 8} Z`} fill="url(#rcBand)" stroke={LINE} strokeWidth={3} />
            <path d={`M 120 ${HY - 22} L 170 ${HY - 4} L 146 ${HY + 16} M 120 ${HY - 22} L 166 ${HY - 38} L 160 ${HY - 14}`} fill="#fff" stroke={LINE} strokeWidth={3} strokeLinejoin="round" />
          </g>
        )}
        {/* 目 */}
        {[-50, 50].map((ex, i) => (
          <g key={i}>
            <ellipse cx={ex} cy={HY + 10} rx={22} ry={eyeRy} fill="#fff" stroke={LINE} strokeWidth={3} />
            {irisRy > 0 && <ellipse cx={ex + look} cy={HY + 12} rx={12} ry={irisRy} fill="#3a2418" />}
            {irisRy > 0 && <ellipse cx={ex + look} cy={HY + 14} rx={6} ry={irisRy * 0.6} fill="#120b07" />}
            {irisRy > 0 && <circle cx={ex + look - 4} cy={HY + 5} r={4.5} fill="#fff" />}
            {irisRy > 0 && <circle cx={ex + look + 5} cy={HY + 18} r={2} fill="#fff" opacity={0.8} />}
            <path d={`M ${ex - 24} ${HY + 8} Q ${ex} ${HY - eyeRy - 6} ${ex + 24} ${HY + 8}`} fill="none" stroke={DARK} strokeWidth={4.5} strokeLinecap="round" />
          </g>
        ))}
        {expr === 'cry' && [-56, 56].map((tx) => <path key={tx} d={`M ${tx} ${HY + 34} q -12 28 0 42 q 12 -14 0 -42 z`} fill="#8fd3ff" stroke="#3e8fc4" strokeWidth={3} opacity={0.9} />)}
        {/* 眉 */}
        {brow.map((b, i) => <path key={i} d={`M ${b[0]} ${b[1]} L ${b[2]} ${b[3]}`} stroke={chef ? '#2e1d14' : DARK} strokeWidth={chef ? 11 : 9} strokeLinecap="round" />)}
        {/* 鼻 */}
        <path d={`M -9 ${HY + 34} Q 0 ${HY + 46} 12 ${HY + 34}`} stroke={LINE} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
        {/* ひげ（シェフ） */}
        {chef && <path d={`M -70 ${HY + 62} Q -38 ${HY + 40} 0 ${HY + 56} Q 38 ${HY + 40} 70 ${HY + 62} Q 44 ${HY + 86} 0 ${HY + 68} Q -44 ${HY + 86} -70 ${HY + 62} Z`} fill="url(#rcStache)" stroke="#2e1d14" strokeWidth={2.5} strokeLinejoin="round" />}
        {mouth}
      </g>
    </g>
  );
};
