// ElevenLabs の with-timestamps 応答 → narration.mp3 と timings.json
const fs = require('fs');
const path = require('path');
const EP = path.resolve(process.env.EP || 'episodes/apple_jobs'); // 回のフォルダ
const P = (...a) => path.join(EP, ...a);
const raw = JSON.parse(fs.readFileSync(P('input/tts_raw.json'), 'utf8'));
fs.writeFileSync(P('narration.mp3'), Buffer.from(raw.audio_base64, 'base64'));
// 声は読み用の台本(script_reading.txt)で作り、字幕は元の台本(script.txt)の文を使う（文の数は同じ）
const reading = fs.existsSync(P('input/script_reading.txt')) ? fs.readFileSync(P('input/script_reading.txt'), 'utf8').trim() : fs.readFileSync(P('input/script.txt'), 'utf8').trim();
const display = fs.readFileSync(P('input/script.txt'), 'utf8').trim();
const script = reading;
const al = raw.alignment || raw.normalized_alignment;
const chars = al.characters, st = al.character_start_times_seconds, en = al.character_end_times_seconds;
if (chars.join('') !== script) console.warn('警告: 文字列が台本と完全一致しません', chars.length, script.length);
// 文に分ける（。！？と改行。閉じかっこは直前の文に付ける）
const sents = []; let cur = '', startIdx = 0;
for (let i = 0; i < chars.length; i++) {
  const c = chars[i];
  if (c === '\n') { if (cur.trim()) { sents.push({ text: cur.trim(), a: startIdx, b: i - 1 }); } cur = ''; startIdx = i + 1; continue; }
  cur += c;
  const next = chars[i + 1];
  if ('。！？'.includes(c) && !(next && '」』）'.includes(next))) { sents.push({ text: cur.trim(), a: startIdx, b: i }); cur = ''; startIdx = i + 1; }
}
if (cur.trim()) sents.push({ text: cur.trim(), a: startIdx, b: chars.length - 1 });
const splitText = (str) => { const r = []; let c = ''; for (let i = 0; i < str.length; i++) { const ch = str[i]; if (ch === '\n') { if (c.trim()) r.push(c.trim()); c = ''; continue; } c += ch; const nx = str[i + 1]; if ('。！？'.includes(ch) && !(nx && '」』）'.includes(nx))) { r.push(c.trim()); c = ''; } } if (c.trim()) r.push(c.trim()); return r; };
const dispSents = splitText(display);
if (dispSents.length !== sents.length) throw new Error(`文の数が合いません: 字幕${dispSents.length} / 音声${sents.length}`);
const out = sents.map((s, idx) => {
  let a = s.a; while (a < s.b && /\s/.test(chars[a])) a++;
  return { i: idx, text: dispSents[idx], start: st[a], end: en[s.b] };
});
const total = en[en.length - 1];
fs.writeFileSync(P('timings.json'), JSON.stringify({ duration: total, sentences: out }, null, 1));
console.log('文の数', out.length, '音声の長さ', total.toFixed(1), '秒');
