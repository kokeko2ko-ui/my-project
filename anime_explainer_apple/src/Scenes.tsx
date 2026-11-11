import React, {createContext, useContext} from 'react';
import {useCurrentFrame, spring, interpolate, Easing} from 'remotion';
import {Character, Expr, Pose, SpeakerCtx} from './Character';
import {HAND} from './fonts';

export const TalkCtx = createContext(false);
const INK = '#1b1b1b';
const FPS = 30;
const W = 1920;

const pop = (f: number, delay = 0) => spring({frame: f - delay, fps: FPS, config: {damping: 11, stiffness: 140}, durationInFrames: 22});
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

// 文字数に合わせて大きさを自動で小さくする
const textW = (s: string, size: number) => [...s].reduce((a, ch) => a + (/[\x00-\x7f]/.test(ch) ? 0.58 : 1) * size, 0);
const fit = (text: string, maxW: number, maxSize: number) => {
  const lines = text.split('\n');
  const longest = Math.max(...lines.map((l) => textW(l, 1)));
  return Math.min(maxSize, maxW / Math.max(longest, 1));
};

const T: React.FC<{text: string; x: number; y: number; size: number; fill?: string; stroke?: string; sw?: number; anchor?: 'start' | 'middle' | 'end'; reveal?: number; lh?: number; weight?: number}> = ({text, x, y, size, fill = INK, stroke, sw = 0, anchor = 'middle', reveal, lh = 1.25, weight = 400}) => {
  const f = useCurrentFrame();
  let shown = text;
  if (reveal !== undefined) {
    const n = Math.floor(Math.max(0, f - reveal) * 0.9);
    shown = [...text].slice(0, n).join('');
  }
  const lines = shown.split('\n');
  return (
    <text x={x} y={y} fontFamily={HAND} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor}
      stroke={stroke} strokeWidth={sw} paintOrder="stroke" strokeLinejoin="round">
      {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : size * lh}>{l}</tspan>)}
    </text>
  );
};

// 吹き出し：ポンと出て、文字は左から書かれる
const Bubble: React.FC<{x: number; y: number; w: number; h: number; text: string; tail?: 'down-left' | 'down-right' | 'left' | 'right'; delay?: number; size?: number; color?: string}> = ({x, y, w, h, text, tail = 'left', delay = 0, size = 78, color = '#fff'}) => {
  const f = useCurrentFrame();
  const s = pop(f, delay);
  const fsz = fit(text, w - 70, size);
  const nl = text.split('\n').length;
  const tails: Record<string, string> = {
    left: `M ${x + 4} ${y + h * 0.55} L ${x - 70} ${y + h * 0.8} L ${x + 4} ${y + h * 0.75} Z`,
    right: `M ${x + w - 4} ${y + h * 0.55} L ${x + w + 70} ${y + h * 0.8} L ${x + w - 4} ${y + h * 0.75} Z`,
    'down-left': `M ${x + w * 0.25} ${y + h - 4} L ${x + w * 0.2} ${y + h + 60} L ${x + w * 0.38} ${y + h - 4} Z`,
    'down-right': `M ${x + w * 0.62} ${y + h - 4} L ${x + w * 0.8} ${y + h + 60} L ${x + w * 0.75} ${y + h - 4} Z`,
  };
  const cx = x + w / 2, cy = y + h / 2;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${Math.max(s, 0.001)}) translate(${-cx} ${-cy})`}>
      <rect x={x + 8} y={y + 8} width={w} height={h} rx={44} fill="rgba(0,0,0,0.12)" />
      <rect x={x} y={y} width={w} height={h} rx={44} fill={color} stroke={INK} strokeWidth={7} />
      <path d={tails[tail]} fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <rect x={x + 10} y={y + 6} width={w - 20} height={10} fill={color} />
      <T text={text} x={cx} y={cy - ((nl - 1) * fsz * 1.25) / 2 + fsz * 0.34} size={fsz} reveal={delay + 4} />
    </g>
  );
};

const Coin: React.FC<{x: number; y: number; r?: number; rot?: number}> = ({x, y, r = 34, rot = 0}) => {
  const sx = Math.abs(Math.cos(rot));
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={r * Math.max(sx, 0.25)} ry={r} fill="#ffcf2e" stroke={INK} strokeWidth={6} />
      <ellipse rx={r * 0.55 * Math.max(sx, 0.25)} ry={r * 0.55} fill="none" stroke="#c99200" strokeWidth={4} />
    </g>
  );
};

type Cut = any;
type SceneProps = {cut: Cut; dur: number};
const talking = () => useContext(TalkCtx);

// ---- タイトル ----
export const Title: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const s1 = pop(f, 2), s2 = pop(f, 10);
  const band = interpolate(f, [8, 26], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <rect x={140} y={430} width={1060 * band} height={190} rx={20} fill="#ffe14d" stroke={INK} strokeWidth={7} transform="rotate(-1.5 600 520)" />
      <g transform={`translate(660 330) scale(${s1}) translate(-660 -330)`}>
        <T text={cut.line1} x={660} y={350} size={fit(cut.line1, 1100, 170)} fill="#fff" stroke={INK} sw={22} />
      </g>
      <g transform={`translate(660 570) scale(${s2}) translate(-660 -570)`}>
        <T text={cut.line2} x={660} y={585} size={fit(cut.line2, 1040, 150)} fill="#e23030" stroke={INK} sw={4} />
      </g>
      {cut.sub && <T text={cut.sub} x={660} y={730} size={fit(cut.sub, 1000, 62)} fill="#3a3a3a" reveal={26} />}
      {cut.coins && <Coin x={190} y={790} r={44} rot={f / 6} />}
      {cut.coins && <Coin x={290} y={830} r={34} rot={f / 7 + 2} />}
      <Character who="mina" x={1480} y={850} scale={1.4} pose="point" expr="smile" talking={talk} />
    </svg>
  );
};

// ---- 1人が話す ----
export const Talk: React.FC<SceneProps> = ({cut, dur}) => {
  const talk = talking();
  const right = cut.side === 'right';
  const cx = right ? 1380 : 540;
  const bx = right ? 120 : 930;
  const f = useCurrentFrame();
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <Character who={cut.who} x={cx} y={850} scale={1.38} flip={right} expr={cut.expr || 'smile'} pose={cut.pose || 'idle'} talking={talk} />
      <Bubble x={bx} y={150} w={870} h={380} text={cut.bubble} tail={right ? 'right' : 'left'} delay={4} size={cut.size || 96} />
      {cut.mark && (
        <g transform={`translate(${right ? 560 : 1500} ${700 + Math.sin(f / 7) * 8}) scale(${pop(f, 14)})`}>
          <T text={cut.mark} x={0} y={0} size={220} fill={cut.markColor || '#e23030'} stroke={INK} sw={14} />
        </g>
      )}
    </svg>
  );
};

// ---- 2人の会話 ----
export const Duo: React.FC<SceneProps> = ({cut, dur}) => {
  const talk = talking();
  const spk = cut.speaker || 'left';
  const L = cut.left, R = cut.right;
  const half = Math.floor(dur * 0.45);
  const lDelay = spk === 'right' ? half : 4;
  const rDelay = spk === 'right' ? 4 : half;
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <Character who={L.who} x={480} y={870} scale={0.98} expr={L.expr} pose={L.pose} talking={talk && spk !== 'right'} />
      <Character who={R.who} x={1440} y={870} scale={0.98} flip expr={R.expr} pose={R.pose} talking={talk && spk === 'right'} seed={20} />
      <Bubble x={110} y={30} w={760} h={230} text={L.bubble} tail="down-left" delay={lDelay} size={84} />
      <Bubble x={1050} y={30} w={760} h={230} text={R.bubble} tail="down-right" delay={rDelay} size={84} color="#fff7cf" />
    </svg>
  );
};

// ---- リスト ----
export const List: React.FC<SceneProps> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const items: string[] = cut.items;
  const step = Math.min(24, Math.max(12, Math.floor((dur * 0.5) / (items.length + 1))));
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <g transform={`rotate(-1.5 760 440) translate(0 ${(1 - pop(f, 0)) * 80})`}>
        <rect x={236} y={86} width={1000} height={720} rx={18} fill="rgba(0,0,0,0.13)" />
        <rect x={220} y={70} width={1000} height={720} rx={18} fill="#fffdf5" stroke={INK} strokeWidth={7} />
        {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={250} x2={1190} y1={200 + i * 100} y2={200 + i * 100} stroke="#cfe3f5" strokeWidth={3} />)}
        <T text={cut.title} x={720} y={160} size={fit(cut.title, 880, 80)} fill="#e23030" />
        {items.map((it, i) => {
          const d = 10 + i * step;
          const sz = fit(it, 820, 66);
          return (
            <g key={i} opacity={interpolate(f, [d, d + 4], [0, 1], clamp)}>
              <T text={`${i + 1}.`} x={270} y={285 + i * 120} size={sz} anchor="start" />
              <T text={it} x={350} y={285 + i * 120} size={sz} anchor="start" reveal={d} />
            </g>
          );
        })}
        {cut.total && (
          <g opacity={interpolate(f, [10 + items.length * step, 14 + items.length * step], [0, 1], clamp)}>
            <line x1={270} x2={1180} y1={650} y2={650} stroke="#e23030" strokeWidth={6} strokeLinecap="round" />
            <T text={cut.total} x={720} y={740} size={fit(cut.total, 860, 78)} fill="#e23030" />
          </g>
        )}
      </g>
      <Character who={cut.who || 'mina'} x={1560} y={860} scale={1.25} flip expr={cut.expr || 'smile'} pose={cut.pose || 'point'} talking={talk} />
    </svg>
  );
};

// ---- 比べっこ ----
export const Compare: React.FC<SceneProps> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const card = (c: any, x: number, color: string, delay: number) => {
    const s = pop(f, delay);
    return (
      <g transform={`translate(${x + 360} 330) scale(${s}) translate(${-(x + 360)} -330)`}>
        <rect x={x + 10} y={90} width={720} height={470} rx={36} fill="rgba(0,0,0,0.12)" />
        <rect x={x} y={80} width={720} height={470} rx={36} fill={color} stroke={INK} strokeWidth={7} />
        <T text={c.label} x={x + 360} y={200} size={fit(c.label, 640, 66)} />
        <T text={c.value} x={x + 360} y={400} size={fit(c.value, 640, 150)} fill={c.red ? '#e23030' : INK} stroke="#fff" sw={0} reveal={delay + 6} />
        {c.note && <T text={c.note} x={x + 360} y={500} size={fit(c.note, 640, 48)} fill="#555" />}
      </g>
    );
  };
  const vs = pop(f, 12);
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      {card(cut.left, 130, '#e3f4ff', 2)}
      {card(cut.right, 1070, '#ffe9e0', 10)}
      <g transform={`translate(960 320) scale(${vs})`}>
        <circle r={62} fill="#ffe14d" stroke={INK} strokeWidth={7} />
        <T text={cut.vs || 'VS'} x={0} y={18} size={cut.vs ? 52 : 56} />
      </g>
      <Character who={cut.who || 'taro'} x={960} y={880} scale={0.74} expr={cut.expr || 'think'} pose="idle" talking={talk} />
    </svg>
  );
};

// ---- 棒グラフ ----
export const Bars: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const vals: number[] = cut.values;
  const mx = Math.max(...vals);
  const colors = ['#7cc4ff', '#5fd08f', '#ffd54a', '#ff9a5a', '#ff6b6b'];
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <T text={cut.caption} x={760} y={150} size={fit(cut.caption, 1300, 84)} />
      <line x1={220} x2={1320} y1={760} y2={760} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <line x1={220} x2={220} y1={250} y2={760} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      {vals.map((v, i) => {
        const g = interpolate(f, [8 + i * 8, 30 + i * 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
        const h = (v / mx) * 440 * g;
        const bw = Math.min(190, 900 / vals.length);
        const x = 300 + i * (bw + 40);
        return (
          <g key={i}>
            <rect x={x} y={760 - h} width={bw} height={h} rx={14} fill={colors[i % colors.length]} stroke={INK} strokeWidth={7} />
            {cut.labels && <T text={cut.labels[i]} x={x + bw / 2} y={830} size={fit(cut.labels[i], bw + 30, 44)} />}
          </g>
        );
      })}
      <Character who={cut.who || 'taro'} x={1620} y={860} scale={1.25} flip expr={cut.expr || 'smile'} pose="up" talking={talk} />
    </svg>
  );
};

// ---- ニュース風（折れ線） ----
export const News: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const trend = cut.trend || 'up';
  const pts: Record<string, number[]> = {
    up: [620, 590, 600, 520, 470, 430, 360, 300],
    down: [300, 330, 310, 400, 470, 540, 590, 640],
    flat: [470, 450, 480, 460, 490, 470, 480, 470],
    updown: [560, 500, 440, 380, 300, 280, 330, 470],
  };
  const ys = pts[trend];
  const xs = ys.map((_, i) => 160 + i * (1100 / (ys.length - 1)));
  const d = xs.map((x, i) => `${i ? 'L' : 'M'} ${x} ${ys[i]}`).join(' ');
  const len = 2000;
  const draw = interpolate(f, [14, 14 + Math.min(70, cut.drawFrames || 60)], [len, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const wave = Array.from({length: 24}, (_, i) => `${i ? 'L' : 'M'} ${1380 + i * 22} ${150 + Math.sin(i * 0.9 + f / 8) * 12}`).join(' ');
  const line = trend === 'down' ? '#e23030' : '#1d9d57';
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <rect x={90} y={70} width={1240} height={110} rx={14} fill="#1b1b1b" />
      <T text={cut.headline} x={710} y={150} size={fit(cut.headline, 1140, 76)} fill="#fff" />
      <rect x={90} y={210} width={1240} height={620} rx={22} fill="#fffdf5" stroke={INK} strokeWidth={7} />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={130} x2={1290} y1={290 + i * 130} y2={290 + i * 130} stroke="#d8d4c4" strokeWidth={3} />)}
      <path d={d} fill="none" stroke={line} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={draw} />
      {cut.caption && <T text={cut.caption} x={710} y={790} size={fit(cut.caption, 1100, 54)} fill="#444" reveal={30} />}
      <path d={wave} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d={wave.replace(/150/g, '190')} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" transform="translate(0 40)" />
      <Character who={cut.who || 'mina'} x={1600} y={870} scale={1.2} flip expr={cut.expr || (trend === 'down' ? 'sad' : 'smile')} pose={cut.pose || 'point'} talking={talk} />
    </svg>
  );
};

// ---- 用語カード ----
export const Keyword: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const s = pop(f, 2);
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <g transform={`translate(760 430) scale(${s}) translate(-760 -430)`}>
        <rect x={130} y={150} width={1260} height={600} rx={40} fill="rgba(0,0,0,0.13)" transform="translate(12 12)" />
        <rect x={130} y={150} width={1260} height={600} rx={40} fill="#fffdf5" stroke={INK} strokeWidth={7} />
        <rect x={130} y={150} width={1260} height={96} rx={40} fill="#ffe14d" stroke={INK} strokeWidth={7} />
        <T text={cut.tag || 'キーワード'} x={760} y={218} size={54} />
        <T text={cut.kana} x={760} y={330} size={fit(cut.kana, 1100, 46)} fill="#777" />
        <T text={cut.term} x={760} y={490} size={fit(cut.term, 1120, 150)} fill="#e23030" reveal={10} />
        <T text={cut.meaning} x={760} y={650} size={fit(cut.meaning, 1120, 62)} reveal={30} />
      </g>
      <Character who={cut.who || 'mina'} x={1640} y={870} scale={1.25} flip pose="point" expr="smile" talking={talk} />
    </svg>
  );
};

// ---- コイン ----
export const Coins: React.FC<SceneProps> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const n = 7;
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <T text={cut.note} x={960} y={140} size={fit(cut.note, 1500, 84)} />
      {/* 出す側 */}
      <rect x={140} y={430} width={420} height={330} rx={24} fill="#cfe3ff" stroke={INK} strokeWidth={7} />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={190 + c * 120} y={470 + r * 90} width={70} height={56} rx={8} fill="#fff" stroke={INK} strokeWidth={5} />))}
      <T text={cut.src} x={350} y={830} size={fit(cut.src, 420, 58)} />
      {/* 受ける側のビン */}
      <path d="M 1330 400 L 1330 420 Q 1280 440 1280 500 L 1280 740 Q 1280 780 1330 780 L 1590 780 Q 1640 780 1640 740 L 1640 500 Q 1640 440 1590 420 L 1590 400 Z" fill="rgba(180,225,255,0.6)" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <T text={cut.to} x={1460} y={850} size={fit(cut.to, 420, 58)} />
      {Array.from({length: n}).map((_, i) => {
        const p = interpolate(f, [8 + i * 7, 8 + i * 7 + 36], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
        const x = 400 + (1450 - 400) * p;
        const y = 480 - Math.sin(p * Math.PI) * 280 + p * 150 + 0;
        const landed = Math.max(0, p - 0.999) > -1 && p >= 1;
        const fy = landed ? 740 - (i % 4) * 42 : y;
        const fx = landed ? 1400 + (i % 3) * 60 : x;
        return p > 0 ? <Coin key={i} x={fx} y={fy} r={36} rot={f / 4 + i} /> : null;
      })}
      <Character who="jobs" x={1000} y={900} scale={0.62} expr={cut.expr || 'think'} talking={talk} />
    </svg>
  );
};

// ---- 2×2のマス ----
export const Grid: React.FC<SceneProps> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const cells: string[] = cut.cells; // [左上, 右上, 左下, 右下]
  const show = cut.show ?? 4;
  const X0 = 360, Y0 = 210, CW = 520, CH = 270;
  const colors = ['#ffe9e0', '#e3f4ff', '#e6ffe3', '#fff3c8'];
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <rect x={X0} y={Y0} width={CW * 2} height={CH * 2} rx={20} fill="#fffdf5" />
      {cells.slice(0, show).map((c, i) => {
        const cx = X0 + (i % 2) * CW, cy = Y0 + Math.floor(i / 2) * CH;
        const s = pop(f, 22 + i * 10);
        return (
          <g key={i} transform={`translate(${cx + CW / 2} ${cy + CH / 2}) scale(${s}) translate(${-(cx + CW / 2)} ${-(cy + CH / 2)})`}>
            <rect x={cx + 14} y={cy + 14} width={CW - 28} height={CH - 28} rx={26} fill={colors[i]} stroke={INK} strokeWidth={6} />
            <T text={c} x={cx + CW / 2} y={cy + CH / 2 + 22} size={fit(c, CW - 80, 70)} />
          </g>
        );
      })}
      <path d={`M ${X0} ${Y0 + CH} L ${X0 + CW * 2} ${Y0 + CH}`} stroke={INK} strokeWidth={9} strokeLinecap="round" strokeDasharray={CW * 2} strokeDashoffset={interpolate(f, [0, 16], [CW * 2, 0], clamp)} />
      <path d={`M ${X0 + CW} ${Y0} L ${X0 + CW} ${Y0 + CH * 2}`} stroke={INK} strokeWidth={9} strokeLinecap="round" strokeDasharray={CH * 2} strokeDashoffset={interpolate(f, [6, 22], [CH * 2, 0], clamp)} />
      <rect x={X0} y={Y0} width={CW * 2} height={CH * 2} rx={20} fill="none" stroke={INK} strokeWidth={9} />
      {cut.axisX && <T text={cut.axisX[0]} x={X0 + CW / 2} y={Y0 - 28} size={56} fill="#e23030" />}
      {cut.axisX && <T text={cut.axisX[1]} x={X0 + CW * 1.5} y={Y0 - 28} size={56} fill="#e23030" />}
      {cut.axisY && <T text={cut.axisY[0]} x={X0 - 30} y={Y0 + CH / 2 + 20} size={50} fill="#e23030" anchor="end" />}
      {cut.axisY && <T text={cut.axisY[1]} x={X0 - 30} y={Y0 + CH * 1.5 + 20} size={50} fill="#e23030" anchor="end" />}
      {cut.badge && (
        <g transform={`translate(1640 250) scale(${pop(f, 30)}) rotate(-6)`}>
          <rect x={-150} y={-60} width={300} height={120} rx={30} fill="#e23030" stroke={INK} strokeWidth={7} />
          <T text={cut.badge} x={0} y={20} size={fit(cut.badge, 270, 62)} fill="#fff" />
        </g>
      )}
      <Character who={cut.who || 'jobs'} x={1580} y={900} scale={0.95} flip expr={cut.expr || 'smile'} pose={cut.pose || 'point'} talking={talk} />
    </svg>
  );
};

// ---- パソコン（ベージュの箱 → カラフル） ----
const Computer: React.FC<{x: number; y: number; scale: number; colorful: boolean; f: number}> = ({x, y, scale, colorful, f}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {colorful ? (
      <g>
        <path d="M -170 -60 L 170 -60 L 170 -380 Q 170 -420 130 -420 L -130 -420 Q -170 -420 -170 -380 Z" fill="#35c9e6" stroke={INK} strokeWidth={8} strokeLinejoin="round" opacity={0.92} />
        <rect x={-136} y={-388} width={272} height={200} rx={26} fill="#fff6cf" stroke={INK} strokeWidth={7} />
        <path d="M -90 -330 Q -30 -260 40 -300 T 110 -260" fill="none" stroke="#ff6b6b" strokeWidth={14} strokeLinecap="round" />
        <rect x={-170} y={-150} width={340} height={90} rx={30} fill="#35c9e6" stroke={INK} strokeWidth={8} />
        {['#ff6b6b', '#ffd54a', '#5fd08f', '#a98bff'].map((c, i) => <circle key={i} cx={-100 + i * 66} cy={-105} r={16} fill={c} stroke={INK} strokeWidth={5} />)}
        <path d="M -60 -60 L -90 0 L 90 0 L 60 -60" fill="#b7f0ff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      </g>
    ) : (
      <g>
        <rect x={-170} y={-420} width={340} height={300} rx={14} fill="#e8dcc0" stroke={INK} strokeWidth={8} />
        <rect x={-130} y={-384} width={260} height={190} rx={10} fill="#9aa7a0" stroke={INK} strokeWidth={7} />
        <rect x={-120} y={-100} width={240} height={90} rx={10} fill="#e8dcc0" stroke={INK} strokeWidth={8} />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={-100 + i * 36} y={-76} width={26} height={22} rx={4} fill="#c9bc9d" stroke={INK} strokeWidth={4} />)}
      </g>
    )}
  </g>
);
export const Imac: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const mode = cut.mode || 'both';
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      {(mode === 'before' || mode === 'both') && (
        <g opacity={mode === 'both' ? 1 : 1}>
          <Computer x={mode === 'both' ? 500 : 800} y={690} scale={1.2} colorful={false} f={f} />
          <T text={cut.beforeLabel || 'まえ'} x={mode === 'both' ? 500 : 800} y={790} size={64} />
        </g>
      )}
      {(mode === 'after' || mode === 'both') && (
        <g transform={`translate(${mode === 'both' ? 1280 : 800} 560) scale(${pop(f, mode === 'both' ? 18 : 2)}) translate(${-(mode === 'both' ? 1280 : 800)} -560)`}>
          <Computer x={mode === 'both' ? 1280 : 800} y={690} scale={1.2} colorful f={f} />
          <T text={cut.afterLabel || 'あたらしい'} x={mode === 'both' ? 1280 : 800} y={790} size={64} fill="#e23030" />
        </g>
      )}
      {mode === 'both' && <g transform="translate(890 400)"><path d="M 0 0 L 70 0 M 45 -26 L 76 0 L 45 26" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
      {cut.caption && <T text={cut.caption} x={960} y={130} size={fit(cut.caption, 1500, 84)} />}
      {mode === 'after' && <Character who="taro" x={1620} y={880} scale={1.2} flip expr="surprised" pose="up" talking={talk} />}
    </svg>
  );
};

// ---- おわり ----
export const Outro: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <Character who="mina" x={620} y={850} scale={1.4} pose="wave" expr="smile" talking={talk} />
      <Bubble x={1010} y={130} w={820} h={300} text={cut.text} tail="left" delay={4} size={80} />
      <g transform={`translate(1420 650) scale(${pop(f, 40)}) translate(-1420 -650)`}>
        <rect x={1030} y={540} width={780} height={220} rx={30} fill="#ffe14d" stroke={INK} strokeWidth={7} transform="rotate(2 1420 650)" />
        <T text="つぎのおはなし" x={1420} y={625} size={50} fill="#e23030" />
        <T text={cut.next} x={1420} y={710} size={fit(cut.next, 700, 64)} />
      </g>
    </svg>
  );
};


// ---- 材料（料理）----
export const Ingredients: React.FC<SceneProps> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const items: string[][] = cut.items; // [[名前, 分量], ...]
  const step = Math.min(18, Math.max(8, Math.floor((dur * 0.55) / (items.length + 1))));
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <g transform={`rotate(-1 700 440) translate(0 ${(1 - pop(f, 0)) * 80})`}>
        <rect x={226} y={96} width={1000} height={720} rx={22} fill="rgba(0,0,0,0.13)" />
        <rect x={210} y={80} width={1000} height={720} rx={22} fill="#fffdf5" stroke={INK} strokeWidth={7} />
        <rect x={210} y={80} width={1000} height={110} rx={22} fill="#ffe14d" stroke={INK} strokeWidth={7} />
        <T text={cut.title || '材料'} x={710} y={160} size={fit(cut.title || '材料', 880, 78)} />
        {items.map((it, i) => {
          const d = 8 + i * step;
          const row = Math.min(100, Math.floor(500 / items.length));
          const y = 280 + i * row;
          const sz = Math.min(fit(it[0], 430, 70), row * 0.72);
          return (
            <g key={i} opacity={interpolate(f, [d, d + 4], [0, 1], clamp)}>
              <T text={it[0]} x={280} y={y} size={sz} anchor="start" reveal={d} />
              <line x1={290 + textW(it[0], sz)} x2={880} y1={y - 8} y2={y - 8} stroke="#cfc6a8" strokeWidth={4} strokeDasharray="3 12" strokeLinecap="round" />
              <T text={it[1]} x={1150} y={y} size={Math.min(fit(it[1], 280, 70), row * 0.72)} anchor="end" fill="#e23030" />
            </g>
          );
        })}
      </g>
      <Character who={cut.who || 'mina'} x={1560} y={900} scale={1.25} flip expr={cut.expr || 'smile'} pose={cut.pose || 'hips'} talking={talk} />
    </svg>
  );
};

// ---- 手順（番号つき）----
export const Step: React.FC<SceneProps> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const s = pop(f, 2);
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <g transform={`translate(660 420) scale(${s}) translate(-660 -420)`}>
        <rect x={140} y={150} width={1040} height={560} rx={36} fill="rgba(0,0,0,0.13)" transform="translate(12 12)" />
        <rect x={140} y={150} width={1040} height={560} rx={36} fill="#fffdf5" stroke={INK} strokeWidth={7} />
        <T text={cut.text} x={660} y={cut.tip ? (cut.text.includes('\n') ? 340 : 400) : (cut.text.includes('\n') ? 400 : 460)} size={fit(cut.text, 820, 100)} reveal={8} lh={1.2} />
        {cut.tip && <T text={cut.tip} x={660} y={620} size={fit(cut.tip, 880, 52)} fill="#2d7be5" reveal={26} />}
      </g>
      <g transform={`translate(180 190) scale(${pop(f, 6)})`}>
        <circle r={86} fill="#e23030" stroke={INK} strokeWidth={8} />
        <T text={String(cut.n)} x={0} y={36} size={104} fill="#fff" />
      </g>
      {cut.time && (
        <g transform={`translate(1010 660) scale(${pop(f, 20)})`}>
          <rect x={-190} y={-52} width={380} height={104} rx={52} fill="#ffe14d" stroke={INK} strokeWidth={7} />
          <circle cx={-130} cy={0} r={30} fill="#fff" stroke={INK} strokeWidth={5} />
          <path d="M -130 -18 L -130 0 L -114 8" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          <T text={cut.time} x={30} y={20} size={fit(cut.time, 250, 58)} />
        </g>
      )}
      <Character who={cut.who || 'mina'} x={1610} y={900} scale={1.3} flip expr={cut.expr || 'smile'} pose={cut.pose || 'point'} talking={talk} />
    </svg>
  );
};

// ---- フライパン（火加減・湯気）----
export const Pan: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const fire = cut.fire || 'mid';
  const fh = {low: 38, mid: 62, high: 92}[fire as 'low' | 'mid' | 'high'] || 62;
  const flames = [-150, -75, 0, 75, 150];
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <T text={cut.label} x={900} y={150} size={fit(cut.label, 800, 96)} fill="#e23030" stroke="#fff" sw={10} />
      <g transform="translate(640 600)">
        {flames.map((x, i) => {
          const h = fh + 40 + Math.sin(f / 4 + i * 1.7) * 10;
          return <path key={i} d={`M ${x - 30} 205 Q ${x - 20} ${205 - h * 0.6} ${x} ${205 - h} Q ${x + 20} ${205 - h * 0.6} ${x + 30} 205 Z`} fill={fire === 'high' ? '#ff5a2e' : '#ffa62e'} stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
        })}
        <rect x={-230} y={205} width={460} height={28} rx={14} fill="#6a6a74" stroke={INK} strokeWidth={6} />
        <path d="M 300 -10 L 560 -34 Q 584 -36 584 -12 Q 584 12 560 14 L 300 26 Z" fill="#6a4a30" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M -300 -20 L 300 -20 Q 290 130 190 150 L -190 150 Q -290 130 -300 -20 Z" fill="#4a4a54" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <ellipse cx={0} cy={-20} rx={300} ry={46} fill="#5a5a66" stroke={INK} strokeWidth={8} />
        <ellipse cx={0} cy={-20} rx={250} ry={30} fill={cut.food || '#ffd54a'} stroke={INK} strokeWidth={6} />
        {cut.steam !== false && [-120, 0, 120].map((x, i) => (
          <path key={i} d={`M ${x} -60 q -24 -40 0 -80 q 24 -40 0 -80`} fill="none" stroke="#9aa7b8" strokeWidth={9} strokeLinecap="round" opacity={0.75}
            transform={`translate(0 ${-((f * 2 + i * 40) % 70)})`} />
        ))}
      </g>
      <Character who={cut.who || 'mina'} x={1620} y={900} scale={1.25} flip expr={cut.expr || 'smile'} pose={cut.pose || 'up'} talking={talk} />
    </svg>
  );
};

// ---- クイズ（雑学）----
export const Quiz: React.FC<SceneProps> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const choices: string[] = cut.choices;
  const reveal = Math.floor(dur * (cut.reveal ?? 0.62));
  const labels = ['A', 'B', 'C', 'D'];
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <g transform={`translate(660 200) scale(${pop(f, 0)}) translate(-660 -200)`}>
        <rect x={110} y={70} width={1100} height={230} rx={34} fill="#fffdf5" stroke={INK} strokeWidth={7} />
        <rect x={110} y={70} width={150} height={230} rx={34} fill="#2d7be5" stroke={INK} strokeWidth={7} />
        <T text="Q" x={185} y={225} size={150} fill="#fff" />
        <T text={cut.q} x={740} y={cut.q.includes('\n') ? 160 : 200} size={fit(cut.q, 900, 70)} reveal={6} />
      </g>
      {choices.map((c, i) => {
        const y = 340 + i * 130;
        const ok = f >= reveal && i === cut.answer;
        const ng = f >= reveal && i !== cut.answer;
        return (
          <g key={i} transform={`translate(660 ${y + 50}) scale(${pop(f, 10 + i * 6)}) translate(-660 ${-(y + 50)})`} opacity={ng ? 0.4 : 1}>
            <rect x={150} y={y} width={1020} height={106} rx={30} fill={ok ? '#bff0c4' : '#fff'} stroke={INK} strokeWidth={7} />
            <circle cx={226} cy={y + 53} r={38} fill={ok ? '#2da44e' : '#ffe14d'} stroke={INK} strokeWidth={6} />
            <T text={labels[i]} x={226} y={y + 74} size={54} fill={ok ? '#fff' : INK} />
            <T text={c} x={300} y={y + 72} size={fit(c, 820, 56)} anchor="start" />
          </g>
        );
      })}
      {f >= reveal && (
        <g transform={`translate(1330 680) rotate(-10) scale(${0.8 * pop(f, reveal)})`}>
          <rect x={-180} y={-70} width={360} height={140} rx={30} fill="#e23030" stroke={INK} strokeWidth={8} />
          <T text="せいかい!" x={0} y={30} size={82} fill="#fff" />
        </g>
      )}
      <Character who={cut.who || 'mina'} x={1620} y={900} scale={1.2} flip expr={f >= reveal ? 'smile' : (cut.expr || 'think')} pose={f >= reveal ? 'up' : 'point'} talking={talk} />
    </svg>
  );
};

// ---- 料理の絵（大きく見せる）----
const Steam: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <g>
    {[-70, 0, 70].map((dx, i) => (
      <path key={i} d={`M ${x + dx} ${y} q -22 -36 0 -72 q 22 -36 0 -72`} fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.8}
        transform={`translate(0 ${-((f * 2 + i * 38) % 60)})`} />
    ))}
  </g>
);
const Sparkle: React.FC<{x: number; y: number; r: number; f: number; d: number}> = ({x, y, r, f, d}) => {
  const k = 0.55 + 0.45 * Math.sin((f + d) / 6);
  return <path d={`M ${x} ${y - r * k} L ${x + r * 0.22 * k} ${y - r * 0.22 * k} L ${x + r * k} ${y} L ${x + r * 0.22 * k} ${y + r * 0.22 * k} L ${x} ${y + r * k} L ${x - r * 0.22 * k} ${y + r * 0.22 * k} L ${x - r * k} ${y} L ${x - r * 0.22 * k} ${y - r * 0.22 * k} Z`} fill="#fff6a8" stroke="#e8b800" strokeWidth={3} />;
};
const DishTamago: React.FC<{f: number}> = ({f}) => (
  <g>
    <ellipse cx={0} cy={228} rx={440} ry={122} fill="rgba(0,0,0,0.18)" />
    <ellipse cx={0} cy={210} rx={430} ry={120} fill="#f7f3ea" stroke={INK} strokeWidth={7} />
    <ellipse cx={0} cy={205} rx={340} ry={86} fill="#ece6d6" stroke="#cdc3aa" strokeWidth={4} />
    <path d="M -310 196 Q -400 120 -250 98 Q -226 172 -310 196 Z" fill="#4ea85a" stroke={INK} strokeWidth={6} />
    <path d="M -300 186 Q -330 140 -262 112" fill="none" stroke="#2f7d3b" strokeWidth={4} />
    {[0, 1, 2, 3].map((i) => {
      const x = -250 + i * 160;
      return (
        <g key={i} transform={`translate(${x} ${64 + (i % 2) * 10}) rotate(${(i - 1.5) * 2.5} 75 65)`}>
          <rect x={0} y={0} width={150} height={134} rx={28} fill="#ffd34e" stroke={INK} strokeWidth={7} />
          <path d="M 12 40 Q 75 6 138 40 L 138 28 Q 130 8 75 8 Q 20 8 12 28 Z" fill="#ffe790" />
          <path d="M 34 74 Q 75 30 118 72 Q 80 108 46 80 Q 70 66 92 78" fill="none" stroke="#f0a52e" strokeWidth={7} strokeLinecap="round" />
          <path d="M 8 112 Q 75 132 142 112" fill="none" stroke="#e59a28" strokeWidth={6} strokeLinecap="round" />
        </g>
      );
    })}
    <ellipse cx={330} cy={176} rx={78} ry={52} fill="#fbfbf6" stroke={INK} strokeWidth={6} />
    <path d="M 290 160 q 30 -22 70 -4" stroke="#d9d9cf" strokeWidth={5} fill="none" strokeLinecap="round" />
    <Steam x={-100} y={40} f={f} />
    <Steam x={160} y={50} f={f + 20} />
  </g>
);
const DishBowl: React.FC<{f: number}> = ({f}) => (
  <g>
    <ellipse cx={0} cy={330} rx={340} ry={50} fill="rgba(0,0,0,0.18)" />
    <path d="M -310 120 Q -310 310 0 330 Q 310 310 310 120 Z" fill="#ffffff" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <path d="M -250 240 Q 0 300 250 240" fill="none" stroke="#e8c0a0" strokeWidth={8} strokeLinecap="round" />
    <ellipse cx={0} cy={120} rx={310} ry={64} fill="#fffefa" stroke={INK} strokeWidth={8} />
    <ellipse cx={0} cy={126} rx={262} ry={44} fill="#ffd34e" stroke="#e8a82c" strokeWidth={5} />
    <ellipse cx={-60} cy={118} rx={110} ry={16} fill="#ffe790" />
    {[[-250, 40, 200, 150], [-210, 150, 270, 60]].map((c, i) => (
      <g key={i}>
        <line x1={c[0]} y1={c[1]} x2={c[2]} y2={c[3]} stroke={INK} strokeWidth={24} strokeLinecap="round" />
        <line x1={c[0]} y1={c[1]} x2={c[2]} y2={c[3]} stroke="#d9a76a" strokeWidth={13} strokeLinecap="round" />
      </g>
    ))}
    <path d="M 330 150 q 70 -40 130 10 q -30 46 -130 -10 Z" fill="#fff" stroke={INK} strokeWidth={6} />
    <path d="M 360 230 q 60 -50 130 0 q -30 50 -130 0 Z" fill="#fff" stroke={INK} strokeWidth={6} />
  </g>
);
export const Food: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const s = pop(f, 0);
  const dish = cut.dish || 'tamagoyaki';
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      <g transform={`translate(960 ${cut.label ? 330 : 290}) scale(${1.25 * s}) `}>
        {dish === 'eggbowl' ? <DishBowl f={f} /> : <DishTamago f={f} />}
      </g>
      <Sparkle x={560} y={380} r={52} f={f} d={0} /><Sparkle x={1400} y={330} r={44} f={f} d={9} /><Sparkle x={1250} y={520} r={34} f={f} d={4} />
      {cut.label && <T text={cut.label} x={960} y={190} size={fit(cut.label, 1500, 130)} fill="#ffe14d" stroke={INK} sw={22} />}
      <Character who="mina" x={250} y={1010} scale={1.0} expr={cut.chefExpr || 'smile'} pose={cut.chefPose || 'point'} talking={talk} />
      <Character who="taro" x={1670} y={1010} scale={1.0} flip expr={cut.kohaiExpr || 'surprised'} pose={cut.kohaiPose || 'up'} talking={talk} seed={20} />
    </svg>
  );
};

// ---- 会話（2人が向かい合う。吹き出しなし。話している人が少し大きくなる）----
export const Chat: React.FC<SceneProps> = ({cut}) => {
  const f = useCurrentFrame();
  const talk = talking();
  const spk = React.useContext(SpeakerCtx);
  const grow = (who: string) => (spk === who ? 1.07 : 1.0);
  return (
    <svg width={W} height={1080} style={{position: 'absolute'}}>
      {cut.prop === 'eggbowl' && <g transform="translate(960 560) scale(0.62)"><DishBowl f={f} /></g>}
      {cut.prop === 'tamagoyaki' && <g transform="translate(960 600) scale(0.6)"><DishTamago f={f} /></g>}
      <Character who="mina" x={520} y={1040} scale={1.15 * grow('mina')} expr={cut.chefExpr || 'smile'} pose={cut.chefPose || 'idle'} talking={talk} />
      <Character who="taro" x={1400} y={1040} scale={1.15 * grow('taro')} flip expr={cut.kohaiExpr || 'smile'} pose={cut.kohaiPose || 'idle'} talking={talk} seed={20} />
      {cut.mark && (
        <g transform={`translate(${cut.markX || 960} ${(cut.markY || 330) + Math.sin(f / 7) * 8}) scale(${pop(f, 10)})`}>
          <T text={cut.mark} x={0} y={0} size={170} fill={cut.markColor || '#e23030'} stroke={INK} sw={16} />
        </g>
      )}
    </svg>
  );
};

import {Wok} from './Wok';
export const SCENES: Record<string, React.FC<SceneProps>> = {
  wok: Wok,
  title: Title, talk: Talk, duo: Duo, list: List, compare: Compare, bars: Bars, news: News,
  keyword: Keyword, coins: Coins, grid: Grid, imac: Imac, outro: Outro,
  ingredients: Ingredients, step: Step, pan: Pan, quiz: Quiz, food: Food, chat: Chat,
};
