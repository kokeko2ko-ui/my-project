// ElevenLabs の with-timestamps 応答 → narration.mp3 と timings.json
const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('input/tts_raw.json', 'utf8'));
fs.writeFileSync('public/narration.mp3', Buffer.from(raw.audio_base64, 'base64'));
const script = fs.readFileSync('input/script.txt', 'utf8').trim();
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
const out = sents.map((s, idx) => {
  let a = s.a; while (a < s.b && /\s/.test(chars[a])) a++;
  return { i: idx, text: s.text, start: st[a], end: en[s.b] };
});
const total = en[en.length - 1];
fs.writeFileSync('timings.json', JSON.stringify({ duration: total, sentences: out }, null, 1));
console.log('文の数', out.length, '音声の長さ', total.toFixed(1), '秒');
