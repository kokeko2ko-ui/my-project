import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate, delayRender, continueRender} from 'remotion';
import {SCENES, TalkCtx} from './Scenes';
import {SUB, loadFonts} from './fonts';
import {SimpleCtx, AmpCtx, CastCtx, SpeakerCtx} from './Character';
import {Kitchen, Banner, SectionTag, PointsPanel, Telop, Reaction, Cta} from './Hud';

const FPS = 30;

type Sent = {i: number; text: string; start: number; end: number; speaker?: string};
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


// ---- BGM と効果音 ----
const CARD_TYPES = ['step', 'keyword', 'list', 'ingredients', 'compare', 'quiz', 'food'];
type Cue = {f: number; file: string; v: number; dur?: number; loop?: boolean};
const buildCues = (cuts: any[], storyboard: any): Cue[] => {
  const out: Cue[] = [];
  if (!storyboard.audio || storyboard.audio.se === false) return out;
  let prevPoints = 0;
  cuts.forEach((c) => {
    if (c.idx === 0) out.push({f: c.from + 2, file: 'se_kira.mp3', v: 0.5});
    else if (CARD_TYPES.includes(c.type)) out.push({f: c.from + 3, file: 'se_pop.mp3', v: 0.45});
    if (c.reaction) out.push({f: c.from + 8, file: 'se_boing.mp3', v: 0.5});
    if (c.showPoints !== undefined && c.showPoints > prevPoints) { out.push({f: c.from + 6, file: 'se_kira.mp3', v: 0.4}); prevPoints = c.showPoints; }
    if (c.type === 'quiz') out.push({f: c.from + Math.floor(c.dur * (c.reveal ?? 0.62)), file: 'se_correct.mp3', v: 0.55});
    if (c.type === 'wok') {
      const hi = c.fire === 'low' ? 0.18 : 0.34;
      out.push({f: c.from + 3, file: 'se_sizzle.mp3', v: c.split ? 0.2 : hi, dur: Math.max(10, c.dur - 3), loop: true});
      if (c.mode === 'toss') for (let k = 6; k < c.dur - 10; k += 30) out.push({f: c.from + k, file: 'se_whoosh.mp3', v: 0.3, dur: 20});
      if (c.ham === 'drop') for (let k = 0; k < 4; k++) out.push({f: c.from + 10 + k * 9, file: 'se_pop.mp3', v: 0.4, dur: 20});
      if (c.egg === 'pour') out.push({f: c.from + 8, file: 'se_pop.mp3', v: 0.4, dur: 20});
      if (c.rice === 'drop') out.push({f: c.from + 6, file: 'se_boing.mp3', v: 0.3, dur: 25});
    }
    if (c.type === 'pan') out.push({f: c.from + 4, file: 'se_sizzle.mp3', v: 0.3, dur: Math.max(10, c.dur - 4), loop: true});
    if (c.cta) out.push({f: c.from + 6, file: 'se_kira.mp3', v: 0.5});
  });
  return out;
};

const Bgm: React.FC<{file: string; base: number; total: number; sents: Sent[]}> = ({file, base, total, sents}) => (
  <Audio src={staticFile('audio/' + file)} loop volume={(f) => {
    const t = f / FPS;
    const fadeIn = interpolate(f, [0, 45], [0, 1], {extrapolateRight: 'clamp'});
    const fadeOut = interpolate(f, [total - 75, total - 5], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    const speaking = sents.some((s) => t >= s.start - 0.1 && t <= s.end + 0.1);
    return base * fadeIn * fadeOut * (speaking ? 0.7 : 1); // 声が出ている間は少し小さく
  }} />
);

export type VideoProps = {simple?: boolean; timings: {sentences: Sent[]}; storyboard: any; envelope: number[]};

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
  const cues = React.useMemo(() => buildCues(cuts, storyboard), [cuts, storyboard]);
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => { loadFonts(JSON.stringify({storyboard, timings})).then(() => continueRender(handle)).catch(() => continueRender(handle)); }, [handle]);
  const t = frame / FPS;
  const amp = envelope[Math.min(frame, envelope.length - 1)] ?? 0;
  const talking = sents.some((s) => t >= s.start - 0.03 && t <= s.end - 0.08);
  const show = storyboard.layout === 'show'; // 台所番組ふうの画面（題名の帯・工程名・コツのパネル・大きなテロップ）
  let curS = sents[0];
  for (const x of sents) if (x.start <= t + 0.02) curS = x;
  const speakers: Record<string, string> = storyboard.speakers || {};
  const speakerRole = curS.speaker && speakers[curS.speaker] ? speakers[curS.speaker] : null;
  const colors: Record<string, string> = storyboard.speakerColors || {};
  const spkNames = Object.keys(speakers);
  const telopColor = (curS.speaker && colors[curS.speaker]) || (curS.speaker && spkNames.indexOf(curS.speaker) === 1 ? '#ffe14d' : '#ffffff');
  // 工程名とコツの数は、前のカットから引き継ぐ
  const carried = React.useMemo(() => {
    let sec = '', shown = 0, hl = -1;
    return cuts.map((c) => { if (c.section !== undefined) sec = c.section; if (c.showPoints !== undefined) shown = c.showPoints; hl = c.hl !== undefined ? c.hl : hl; return {sec, shown, hl}; });
  }, [cuts]);
  const curCut = cuts.reduce((acc, c) => (frame >= c.from ? c : acc), cuts[0]);
  const cr = carried[curCut.idx];
  return (
    <AbsoluteFill style={{background: '#fff', overflow: 'hidden'}}>
      <Audio src={staticFile('narration.mp3')} />
      {storyboard.audio?.bgm && <Bgm file={storyboard.audio.bgm} base={storyboard.audio.bgmVolume ?? 0.22} total={TOTAL} sents={sents} />}
      {cues.map((q, i) => (
        <Sequence key={'se' + i} from={q.f} durationInFrames={q.dur ?? 60} layout="none">
          <Audio src={staticFile('audio/' + q.file)} volume={q.v} loop={q.loop} />
        </Sequence>
      ))}
      <SimpleCtx.Provider value={simple}>
      <CastCtx.Provider value={storyboard.cast || {}}>
      <AmpCtx.Provider value={amp}>
      <SpeakerCtx.Provider value={speakerRole}>
      <TalkCtx.Provider value={talking}>
        {cuts.map((c) => {
          const Scene = SCENES[c.type];
          if (!Scene) throw new Error(`知らないシーンの型: ${c.type}（カット${c.idx}）`);
          return (
            <Sequence key={c.idx} from={c.from} durationInFrames={Math.max(1, c.dur)} layout="none">
              <AbsoluteFill style={{overflow: 'hidden'}}>
                <Camera idx={c.idx} dur={c.dur}>
                  {show ? <Kitchen /> : <Background cut={c} />}
                  {show
                    ? <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: 'translate(20px, 136px) scale(0.82)', transformOrigin: '0 0'}}><Scene cut={c} dur={c.dur} /></div>
                    : <Scene cut={c} dur={c.dur} />}
                </Camera>
                {show && c.reaction && <Reaction {...c.reaction} />}
                {show && c.cta && <Cta text={c.cta} />}
              </AbsoluteFill>
            </Sequence>
          );
        })}
      </TalkCtx.Provider>
      </SpeakerCtx.Provider>
      </AmpCtx.Provider>
      </CastCtx.Provider>
      </SimpleCtx.Provider>
      {show ? (
        <>
          {storyboard.banner && <Banner lines={storyboard.banner} />}
          {cr.sec && <SectionTag text={cr.sec} />}
          {storyboard.points && <PointsPanel points={storyboard.points} shown={cr.shown} hl={cr.hl} />}
          {t <= lastEnd + 0.3 && <Telop text={curS.text} color={telopColor} sinceFrames={frame - Math.round(curS.start * FPS)} />}
        </>
      ) : (
        <Subtitle t={t} sents={sents} lastEnd={lastEnd} />
      )}
    </AbsoluteFill>
  );
};
