// 使い方: node tools/render.js stills | preview | final
//  stills : 各カットから1コマずつ静止画 → out/stills/
//  preview: 半分の大きさの確認用mp4 → out/preview.mp4
//  final  : 本番mp4(1920x1080) → out/video.mp4
// Remotion Studio（開発サーバー）は使わない。ポートは自動で空いている所が選ばれる。
const path = require('path');
const fs = require('fs');
const {bundle} = require('@remotion/bundler');
const {renderStill, renderMedia, selectComposition} = require('@remotion/renderer');

const mode = process.argv[2] || 'stills';
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
const root = path.resolve(__dirname, '..');
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

(async () => {
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), onProgress: () => {}});
  const comp = await selectComposition({serveUrl, id: 'Main', ...common});
  fs.mkdirSync(path.join(root, 'out/stills'), {recursive: true});
  if (mode === 'sheet') {
    const sc = await selectComposition({serveUrl, id: 'Sheet', ...common});
    await renderStill({composition: sc, serveUrl, frame: 10, output: path.join(root, 'out/characters.png'), ...common});
    console.log('sheet done');
  } else if (mode === 'stills') {
    const timings = require(path.join(root, 'timings.json')).sentences;
    const sb = require(path.join(root, 'storyboard.json')).cuts;
    for (let i = 0; i < sb.length; i++) {
      if (only && !only.includes(i)) continue;
      const from = i === 0 ? 0 : Math.round(timings[sb[i].s].start * 30);
      const to = i === sb.length - 1 ? comp.durationInFrames : Math.round(timings[sb[i + 1].s].start * 30);
      const frame = Math.min(comp.durationInFrames - 1, from + Math.max(24, Math.floor((to - from) * 0.8)));
      await renderStill({composition: comp, serveUrl, frame, output: path.join(root, `out/stills/cut${String(i).padStart(2, '0')}.png`), ...common});
      console.log('still', i, 'frame', frame);
    }
  } else {
    const preview = mode === 'preview';
    await renderMedia({
      composition: comp, serveUrl, codec: 'h264', outputLocation: path.join(root, preview ? 'out/preview.mp4' : 'out/video.mp4'),
      scale: preview ? 0.5 : 1, concurrency: 4, crf: preview ? 30 : 20,
      onProgress: ({progress}) => { if (Math.round(progress * 100) % 5 === 0) process.stdout.write(`\r${Math.round(progress * 100)}%`); },
      ...common,
    });
    console.log('\ndone');
  }
})().catch((e) => { console.error(e); process.exit(1); });
