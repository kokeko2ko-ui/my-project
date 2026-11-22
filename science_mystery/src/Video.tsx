import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {GOTHIC, MINCHO, loadFonts} from './fonts';

export const FPS = 30;
export const TAIL = 3;        // 最後の文のあと、何秒で終わるか
const FADE = 18;              // カット切り替えの重なり（フレーム）

type Sent = {i: number; text: string; start: number; end: number};
// 絵コンテの1カット。s = 何番目の文から始まるか（0始まり）
export type Cut = {
  s: number;
  type: 'image' | 'question' | 'title';
  img?: string;                 // assets/ の画像ファイル名（描画時に public/ep/ にコピーされる）
  move?: 'in' | 'out' | 'left' | 'right' | 'up' | 'down'; // ゆっくりした動き（既定 in）
  focus?: [number, number];     // 寄る中心（0〜1）
  zoom?: number;                // 最初の拡大率（余白のある画像は 1.3 など）
  credit?: string;              // 右下の出典表記
  text?: string;                // question/title の大きな文字（\n で改行）
  label?: string;               // question の小見出し（例：「問い 1」）
  accent?: string;              // text の中で赤くする語
};
export type VideoProps = {
  timings: {duration: number; sentences: Sent[]};
  storyboard: {cuts: Cut[]; audio?: {bgm?: string; bgmVolume?: number; se?: boolean}; telop?: boolean};
};

const RED = '#e0252b';

const Accent: React.FC<{text: string; accent?: string}> = ({text, accent}) => {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((ln, k) => {
        if (!accent || !ln.includes(accent)) return <div key={k}>{ln}</div>;
        const [a, b] = ln.split(accent);
        return <div key={k}>{a}<span style={{color: RED}}>{accent}</span>{b}</div>;
      })}
    </>
  );
};

// 画像をゆっくり動かす（ケン・バーンズ）
const Still: React.FC<{cut: Cut; dur: number}> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const z0 = cut.zoom ?? 1.05;
  const mv = cut.move ?? 'in';
  const scale = mv === 'in' ? z0 + 0.14 * p : mv === 'out' ? z0 + 0.14 * (1 - p) : z0 + 0.08;
  const dx = mv === 'left' ? 3 - 6 * p : mv === 'right' ? -3 + 6 * p : 0;
  const dy = mv === 'up' ? 3 - 6 * p : mv === 'down' ? -3 + 6 * p : 0;
  const [fx, fy] = cut.focus ?? [0.5, 0.5];
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Img src={staticFile('ep/' + cut.img)} style={{width: '100%', height: '100%', objectFit: 'cover',
        transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `translate(${dx}%, ${dy}%) scale(${scale})`}} />
    </AbsoluteFill>
  );
};

// ゆっくり流れる星（問いのカード・タイトルの背景）
const Stars: React.FC = () => {
  const f = useCurrentFrame();
  const stars = Array.from({length: 140}, (_, i) => {
    const r = (n: number) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    return {x: r(1) * 1920, y: r(2) * 1080, s: 1 + r(3) * 2.2, sp: 0.1 + r(4) * 0.4, tw: r(5) * 6};
  });
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      {stars.map((st, i) => (
        <circle key={i} cx={(st.x - f * st.sp + 1920) % 1920} cy={st.y} r={st.s}
          fill="#fff" opacity={0.35 + 0.35 * Math.sin(f / 20 + st.tw)} />
      ))}
    </svg>
  );
};

// 問いのカード：暗い背景＋大きな明朝体。動画の「次の問い」への切り替え
const Question: React.FC<{cut: Cut; dur: number}> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const inT = interpolate(f, [6, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const lab = interpolate(f, [0, 16], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 55%, #0d1a2e 0%, #03060c 70%)'}}>
      {cut.img ? (
        <AbsoluteFill style={{opacity: 0.28, filter: 'blur(2px) saturate(0.7)'}}><Still cut={{...cut, move: 'in', zoom: 1.15}} dur={dur} /></AbsoluteFill>
      ) : null}
      <Stars />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
        {cut.label ? (
          <div style={{fontFamily: GOTHIC, fontWeight: 700, fontSize: 34, color: '#9fc3ff', letterSpacing: 12, opacity: lab, marginBottom: 34}}>
            ― {cut.label} ―
          </div>
        ) : null}
        <div style={{fontFamily: MINCHO, fontWeight: 800, fontSize: 104, lineHeight: 1.35, color: '#fff', textAlign: 'center',
          opacity: inT, transform: `translateY(${(1 - inT) * 24}px) scale(${1.04 - 0.04 * inT})`, letterSpacing: 4,
          textShadow: '0 0 30px rgba(120,170,255,0.35), 0 4px 18px rgba(0,0,0,0.9)'}}>
          <Accent text={cut.text || ''} accent={cut.accent} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 冒頭のタイトル：画像の上に大きな文字
const Title: React.FC<{cut: Cut; dur: number}> = ({cut, dur}) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [10, 40, dur - 20, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      {cut.img ? <Still cut={cut} dur={dur} /> : <AbsoluteFill style={{background: '#02040a'}}><Stars /></AbsoluteFill>}
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 100%)'}} />
      <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 120}}>
        <div style={{fontFamily: MINCHO, fontWeight: 800, fontSize: 118, lineHeight: 1.3, color: '#fff', opacity: a,
          textShadow: '0 4px 24px rgba(0,0,0,0.95)', letterSpacing: 4}}>
          <Accent text={cut.text || ''} accent={cut.accent} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 長い文の改行：まず「、」で2行（各30字まで）。無理なら「、」ごとに詰めて3行。それも無理なら真ん中で切る
const MAXL = 30;
const wrap = (t: string) => {
  if (t.length <= 27) return t;
  const mid = t.length / 2;
  let best = -1;
  for (let i = 0; i < t.length - 2; i++) {
    if (t[i] !== '、') continue;
    const k = i + 1;
    if (k <= MAXL && t.length - k <= MAXL && (best < 0 || Math.abs(k - mid) < Math.abs(best - mid))) best = k;
  }
  if (best > 0) return t.slice(0, best) + '\n' + t.slice(best);
  const segs = t.match(/[^、]+、?/g) || [t];
  const lines: string[] = [];
  for (const sg of segs) {
    if (lines.length && (lines[lines.length - 1] + sg).length <= MAXL - 4) lines[lines.length - 1] += sg; else lines.push(sg);
  }
  if (lines.length <= 3 && lines.every((l) => l.length <= MAXL)) return lines.join('\n');
  return t.slice(0, Math.ceil(mid)) + '\n' + t.slice(Math.ceil(mid));
};

// 下のテロップ（いま読んでいる文）
const Telop: React.FC<{sents: Sent[]; hide: number[]}> = ({sents, hide}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const cur = sents.find((s, k) => t >= s.start - 0.05 && t < (sents[k + 1]?.start ?? s.end + 1.2) - 0.05);
  if (!cur || hide.includes(cur.i)) return null;
  const a = interpolate(t, [cur.start - 0.05, cur.start + 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 64}}>
      <AbsoluteFill style={{top: 'auto', height: 300, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.72) 100%)'}} />
      <div style={{position: 'relative', fontFamily: MINCHO, fontWeight: 800, fontSize: 54, lineHeight: 1.5, color: '#fff', textAlign: 'center', opacity: a,
        whiteSpace: 'pre-line', textShadow: '0 0 6px #000, 0 0 12px #000, 0 3px 14px rgba(0,0,0,0.9)', letterSpacing: 2}}>
        {wrap(cur.text)}
      </div>
    </AbsoluteFill>
  );
};

export const Video: React.FC<VideoProps> = ({timings, storyboard}) => {
  const {durationInFrames} = useVideoConfig();
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const all = timings.sentences.map((s) => s.text).join('') + storyboard.cuts.map((c) => (c.text || '') + (c.label || '') + (c.credit || '')).join('');
    loadFonts(all).then(() => continueRender(handle));
  }, [handle]);
  const sents = timings.sentences;
  const cuts = storyboard.cuts;
  const startF = (k: number) => (k === 0 ? 0 : Math.round(sents[cuts[k].s].start * FPS) - 6);
  const audio = storyboard.audio || {};
  const f = useCurrentFrame();
  const endFade = interpolate(f, [durationInFrames - 40, durationInFrames - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{background: '#000'}}>
      {cuts.map((cut, k) => {
        const from = startF(k);
        const to = k === cuts.length - 1 ? durationInFrames : startF(k + 1) + FADE;
        const dur = to - from;
        return (
          <Sequence key={k} from={from} durationInFrames={dur}>
            <FadeIn first={k === 0}>
              {cut.type === 'question' ? <Question cut={cut} dur={dur} /> : cut.type === 'title' ? <Title cut={cut} dur={dur} /> : <Still cut={cut} dur={dur} />}
              <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)'}} />
              {cut.credit ? (
                <div style={{position: 'absolute', right: 28, top: 22, fontFamily: GOTHIC, fontWeight: 700, fontSize: 20, color: 'rgba(255,255,255,0.7)',
                  textShadow: '0 1px 4px #000'}}>{cut.credit}</div>
              ) : null}
            </FadeIn>
            {audio.se !== false && k > 0 ? (
              <Audio src={staticFile(cut.type === 'question' ? 'audio/se_boom.mp3' : 'audio/se_whoosh.mp3')} volume={cut.type === 'question' ? 0.55 : 0.18} />
            ) : null}
          </Sequence>
        );
      })}
      {storyboard.telop !== false ? <Telop sents={sents} hide={cuts.filter((c) => c.type === 'question').map((c) => c.s)} /> : null}
      <AbsoluteFill style={{background: '#000', opacity: endFade}} />
      <Audio src={staticFile('narration.mp3')} />
      {audio.bgm ? (
        <Audio src={staticFile('audio/' + audio.bgm)} loop
          volume={(fr) => (audio.bgmVolume ?? 0.35) * interpolate(fr, [0, 45, durationInFrames - 60, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      ) : null}
    </AbsoluteFill>
  );
};

const FadeIn: React.FC<{first: boolean; children: React.ReactNode}> = ({first, children}) => {
  const f = useCurrentFrame();
  const o = first ? interpolate(f, [0, 20], [0, 1], {extrapolateRight: 'clamp'}) : interpolate(f, [0, FADE], [0, 1], {extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
