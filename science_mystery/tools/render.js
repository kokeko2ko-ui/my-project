// 使い方:  EP=episodes/<回の名前> node tools/render.js <モード> [カット番号,カット番号...]
//  stills : 各カットから1コマずつ静止画 → <回>/out/stills/
//  preview: 半分の大きさの確認用mp4 → <回>/out/preview.mp4
//  final  : 本番mp4(1920x1080) → <回>/out/video.mp4   （RANGE=0-900 で一部だけ → out/range.mp4）
// （anime_explainer_apple/tools/render.js を流用。回の assets/ を public/ep/ にコピーしてから描画する）
const path = require('path');
const fs = require('fs');
const {bundle} = require('@remotion/bundler');
const {renderStill, renderMedia, selectComposition} = require('@remotion/renderer');

const mode = process.argv[2] || 'stills';
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
const root = path.resolve(__dirname, '..');
const EP = path.resolve(process.env.EP || 'episodes/europa_demo');
const out = path.join(EP, 'out');
fs.mkdirSync(path.join(out, 'stills'), {recursive: true});
const FPS = 30;

const chrome = (() => {
  // 環境に入っている Chrome Headless Shell を使う（なければ Remotion が自分で取得する）
  const cands = ['/opt/pw-browsers/chromium_headless_shell'];
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) for (const d of fs.readdirSync(base)) {
    const p = path.join(base, d);
    if (d.startsWith('chromium_headless_shell-') && fs.statSync(p).isDirectory())
      for (const sub of fs.readdirSync(p)) cands.push(path.join(p, sub, 'chrome-headless-shell'));
  }
  return cands.find((x) => fs.existsSync(x) && fs.statSync(x).isFile());
})();
const common = {browserExecutable: chrome, chromiumOptions: {disableWebSecurity: false}, logLevel: 'warn'};
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(EP, f), 'utf8'));

(async () => {
  const storyboard = readJson('storyboard.json');
  const timings = readJson('timings.json');
  const inputProps = {timings, storyboard};
  // 回の素材を public へ（毎回入れ替える）
  const pubEp = path.join(root, 'public/ep');
  fs.rmSync(pubEp, {recursive: true, force: true});
  fs.mkdirSync(pubEp, {recursive: true});
  for (const c of storyboard.cuts) if (c.img) {
    const src = path.join(EP, 'assets', c.img);
    if (!fs.existsSync(src)) throw new Error('画像がありません: ' + src);
    fs.copyFileSync(src, path.join(pubEp, c.img));
  }
  fs.copyFileSync(path.join(EP, 'narration.mp3'), path.join(root, 'public/narration.mp3'));
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), onProgress: () => {}});
  const comp = await selectComposition({serveUrl, id: 'Main', inputProps, ...common});
  if (mode === 'stills') {
    const sents = timings.sentences, sb = storyboard.cuts;
    for (let i = 0; i < sb.length; i++) {
      if (only && !only.includes(i)) continue;
      const from = i === 0 ? 0 : Math.round(sents[sb[i].s].start * FPS);
      const to = i === sb.length - 1 ? comp.durationInFrames - 45 : Math.round(sents[sb[i + 1].s].start * FPS);
      const frame = Math.min(comp.durationInFrames - 1, from + Math.max(36, Math.floor((to - from) * 0.6)));
      await renderStill({composition: comp, serveUrl, inputProps, frame, output: path.join(out, `stills/cut${String(i).padStart(2, '0')}.png`), ...common});
      console.log('still', i, 'frame', frame);
    }
  } else {
    const preview = mode === 'preview';
    const range = process.env.RANGE ? process.env.RANGE.split('-').map(Number) : null;
    const output = path.join(out, range ? 'range.mp4' : preview ? 'preview.mp4' : 'video.mp4');
    await renderMedia({
      composition: comp, serveUrl, inputProps, codec: 'h264', outputLocation: output, ...(range ? {frameRange: range} : {}),
      scale: preview ? 0.5 : 1, concurrency: 4, crf: preview ? 30 : 20,
      onProgress: ({progress}) => { if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`\r${Math.round(progress * 100)}%`); },
      ...common,
    });
    console.log('\ndone', output);
  }
})().catch((e) => { console.error(e); process.exit(1); });
