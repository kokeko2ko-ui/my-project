// ナレーションの音量（30fpsごと）を public/envelope.json に出す。口の動きを音に合わせるために使う。
const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const EP = path.resolve(process.env.EP || 'episodes/apple_jobs');
const sr = 8000;
const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(EP, 'narration.mp3'), '-ac', '1', '-ar', String(sr), '-f', 's16le', '-'], {maxBuffer: 1 << 28});
const n = buf.length / 2, per = sr / 30, frames = Math.ceil(n / per);
const rms = [];
for (let f = 0; f < frames; f++) {
  let s = 0, c = 0;
  for (let i = Math.floor(f * per); i < Math.min(n, Math.floor((f + 1) * per)); i++) { const v = buf.readInt16LE(i * 2) / 32768; s += v * v; c++; }
  rms.push(Math.sqrt(s / Math.max(c, 1)));
}
const sorted = [...rms].sort((a, b) => a - b);
const hi = sorted[Math.floor(sorted.length * 0.95)] || 1;
let prev = 0;
const env = rms.map((v) => { const x = Math.min(1, v / hi); prev = prev * 0.55 + x * 0.45; return Math.round(prev * 100) / 100; }); // なめらかに
fs.writeFileSync(path.join(EP, 'envelope.json'), JSON.stringify(env));
console.log('frames', env.length, 'max', Math.max(...env));
