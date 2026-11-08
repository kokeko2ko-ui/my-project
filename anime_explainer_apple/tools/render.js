// 使い方:  EP=episodes/<回の名前> node tools/render.js <モード> [カット番号,カット番号...]
//  stills : 各カットから1コマずつ静止画 → <回>/out/stills/
//  preview: 半分の大きさの確認用mp4 → <回>/out/preview.mp4
//  final  : 本番mp4(1920x1080) → <回>/out/video.mp4
//  sheet / sheet2 : キャラ見本（影つき / シンプル）
// Remotion Studio（開発サーバー）は使わない。ポートは自動で空いている所が選ばれる。
const path = require('path');
const fs = require('fs');
const {bundle} = require('@remotion/bundler');
const {renderStill, renderMedia, selectComposition} = require('@remotion/renderer');

const mode = process.argv[2] || 'stills';
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
const root = path.resolve(__dirname, '..');
const EP = path.resolve(process.env.EP || 'episodes/apple_jobs');
const out = path.join(EP, 'out');
fs.mkdirSync(path.join(out, 'stills'), {recursive: true});

const chrome = (() => {
  const base = '/opt/pw-browsers';
  if (!fs.existsSync(base)) return undefined;
  const d = fs.readdirSync(base).find((x) => x.startsWith('chromium_headless_shell'));
  if (!d) return undefined;
  const sub = fs.readdirSync(path.join(base, d))[0];
  const exe = path.join(base, d, sub, 'chrome-headless-shell');
  return fs.existsSync(exe) ? exe : undefined;
})();
const common = {browserExecutable: chrome, chromiumOptions: {disableWebSecurity: false}, logLevel: 'warn'};
const readJson = (f, d) => (fs.existsSync(path.join(EP, f)) ? JSON.parse(fs.readFileSync(path.join(EP, f), 'utf8')) : d);

(async () => {
  const sheet = mode === 'sheet' || mode === 'sheet2';
  const storyboard = readJson('storyboard.json');
  const timings = readJson('timings.json');
  const envelope = readJson('envelope.json', []);
  const simple = process.env.STYLE ? process.env.STYLE === 'simple' : (storyboard && storyboard.style ? storyboard.style === 'simple' : true);
  const inputProps = {simple, timings, storyboard, envelope};
  if (!sheet) fs.copyFileSync(path.join(EP, 'narration.mp3'), path.join(root, 'public/narration.mp3'));
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), onProgress: () => {}});

  if (sheet) {
    const sc = await selectComposition({serveUrl, id: mode === 'sheet2' ? 'SheetSimple' : 'Sheet', ...common});
    const o = path.join(out, mode === 'sheet2' ? 'characters_simple.png' : 'characters.png');
    await renderStill({composition: sc, serveUrl, frame: 10, output: o, ...common});
    console.log('sheet done', o);
    return;
  }
  const comp = await selectComposition({serveUrl, id: 'Main', inputProps, ...common});
  if (mode === 'stills') {
    const sents = timings.sentences, sb = storyboard.cuts;
    for (let i = 0; i < sb.length; i++) {
      if (only && !only.includes(i)) continue;
      const from = i === 0 ? 0 : Math.round(sents[sb[i].s].start * 30);
      const to = i === sb.length - 1 ? comp.durationInFrames : Math.round(sents[sb[i + 1].s].start * 30);
      const frame = Math.min(comp.durationInFrames - 1, from + Math.max(24, Math.floor((to - from) * 0.8)));
      await renderStill({composition: comp, serveUrl, inputProps, frame, output: path.join(out, `stills/cut${String(i).padStart(2, '0')}.png`), ...common});
      console.log('still', i, 'frame', frame);
    }
  } else {
    const preview = mode === 'preview';
    const output = path.join(out, preview ? 'preview.mp4' : 'video.mp4');
    await renderMedia({
      composition: comp, serveUrl, inputProps, codec: 'h264', outputLocation: output,
      scale: preview ? 0.5 : 1, concurrency: 4, crf: preview ? 30 : 20,
      onProgress: ({progress}) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`\r${Math.round(progress * 100)}%`); },
      ...common,
    });
    console.log('\ndone', output);
  }
})().catch((e) => { console.error(e); process.exit(1); });
