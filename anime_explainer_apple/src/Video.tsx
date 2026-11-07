import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, delayRender, continueRender} from 'remotion';
import {SCENES, TalkCtx} from './Scenes';
import {SUB, loadFonts} from './fonts';
import {SimpleCtx, AmpCtx, CastCtx} from './Character';

const FPS = 30;

type Sent = {i: number; text: string; start: number; end: number};
const PALETTES = [
  ['#fff4c9', '#ffe39a', '#fffbe6'],
  ['#d9f0ff', '#b5defa', '#f0faff'],
  ['#ffe3e0', '#ffc7c0', '#fff1ef'],
  ['#dff7df', '#bfeac0', '#f1fbf1'],
  ['#efe3ff', '#d9c4fa', '#f8f1ff'],
  ['#ffead2', '#ffd2a0', '#fff5e8'],
];

const Background: React.FC<{cut: any}> = ({cut}) => {
  if (cut.type === 'news') {
    return (
      <AbsoluteFill style={{background: '#f3ecd8', backgroundImage: 'radial-gradient(#cdbf9a 2.4px, transparent 3px)', backgroundSize: '18px 18px'}} />
    );
  }
  const p = PALETTES[cut.idx % PALETTES.length];
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${p[0]}, ${p[1]})`}}>
      <div style={{position: 'absolute', left: -200, top: -160, width: 1100, height: 760, borderRadius: '50%', background: p[2], opacity: 0.8}} />
      <div style={{position: 'absolute', right: -260, top: 360, width: 1000, height: 820, borderRadius: '50%', background: p[2], opacity: 0.55}} />
    </AbsoluteFill>
  );
};

// ゆっくりしたカメラ移動（寄る・引く・横に動く）
const Camera: React.FC<{idx: number; dur: number; children: React.ReactNode}> = ({idx, dur, children}) => {
  const f = useCurrentFrame();
  const t = f / Math.max(dur, 1);
  const mode = idx % 3;
  let tf = '';
  if (mode === 0) tf = `scale(${1 + 0.06 * t})`;
  else if (mode === 1) tf = `scale(${1.06 - 0.06 * t})`;
  else tf = `translateX(${-22 + 44 * t}px) scale(1.05)`;
  return <AbsoluteFill style={{transform: tf, transformOrigin: '50% 45%'}}>{children}</AbsoluteFill>;
};

// 字幕：台本の文をそのまま。長いときはまん中に近い読点で2行に分ける
const splitLines = (s: string) => {
  if ([...s].length <= 22) return [s];
  const chars = [...s];
  const mid = chars.length / 2;
  let best = -1, bd = 1e9;
  chars.forEach((ch, i) => { if ('、。，'.includes(ch) && i < chars.length - 1 && Math.abs(i - mid) < bd) { bd = Math.abs(i - mid); best = i; } });
  if (best < 0) best = Math.floor(mid);
  return [chars.slice(0, best + 1).join(''), chars.slice(best + 1).join('')];
};
const Subtitle: React.FC<{t: number; sents: Sent[]; lastEnd: number}> = ({t, sents, lastEnd}) => {
  let cur = sents[0];
  for (const s of sents) if (s.start <= t + 0.02) cur = s;
  if (t > lastEnd + 0.3) return null;
  const lines = splitLines(cur.text);
  const longest = Math.max(...lines.map((l) => [...l].length));
  const size = Math.min(56, 1680 / longest);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(0,0,0,0.68)', borderRadius: 18, padding: '14px 40px', textAlign: 'center', maxWidth: 1760}}>
        {lines.map((l, i) => (
          <div key={i} style={{fontFamily: SUB, fontWeight: 700, fontSize: size, lineHeight: 1.35, color: '#fff'}}>{l}</div>
        ))}
      </div>
    </div>
  );
};

export type VideoProps = {simple?: boolean; timings: {sentences: Sent[]}; storyboard: {cuts: any[]; cast?: Record<string, string>}; envelope: number[]};

export const Video: React.FC<VideoProps> = ({simple = true, timings, storyboard, envelope}) => {
  const frame = useCurrentFrame();
  const sents = timings.sentences;
  const lastEnd = sents[sents.length - 1].end;
  const TOTAL = Math.ceil((lastEnd + 2) * FPS);
  const cuts: any[] = React.useMemo(() => storyboard.cuts.map((c: any, idx: number, arr: any[]) => {
    const from = idx === 0 ? 0 : Math.round(sents[c.s].start * FPS);
    const to = idx === arr.length - 1 ? TOTAL : Math.round(sents[arr[idx + 1].s].start * FPS);
    return {...c, idx, from, dur: to - from};
  }), [storyboard, timings]);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => { loadFonts(JSON.stringify({storyboard, timings})).then(() => continueRender(handle)).catch(() => continueRender(handle)); }, [handle]);
  const t = frame / FPS;
  const amp = envelope[Math.min(frame, envelope.length - 1)] ?? 0;
  const talking = sents.some((s) => t >= s.start - 0.03 && t <= s.end - 0.08);
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <Audio src={staticFile('narration.mp3')} />
      <SimpleCtx.Provider value={simple}>
      <CastCtx.Provider value={storyboard.cast || {}}>
      <AmpCtx.Provider value={amp}>
      <TalkCtx.Provider value={talking}>
        {cuts.map((c) => {
          const Scene = SCENES[c.type];
          if (!Scene) throw new Error(`知らないシーンの型: ${c.type}（カット${c.idx}）`);
          return (
            <Sequence key={c.idx} from={c.from} durationInFrames={Math.max(1, c.dur)} layout="none">
              <AbsoluteFill style={{overflow: 'hidden'}}>
                <Camera idx={c.idx} dur={c.dur}>
                  <Background cut={c} />
                  <Scene cut={c} dur={c.dur} />
                </Camera>
              </AbsoluteFill>
            </Sequence>
          );
        })}
      </TalkCtx.Provider>
      </AmpCtx.Provider>
      </CastCtx.Provider>
      </SimpleCtx.Provider>
      <Subtitle t={t} sents={sents} lastEnd={lastEnd} />
    </AbsoluteFill>
  );
};
