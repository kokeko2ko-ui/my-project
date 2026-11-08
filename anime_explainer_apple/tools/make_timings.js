// ElevenLabs の with-timestamps 応答 → narration.mp3 と timings.json
const fs = require('fs');
const path = require('path');
const EP = path.resolve(process.env.EP || 'episodes/apple_jobs'); // 回のフォルダ
const P = (...a) => path.join(EP, ...a);
const raw = JSON.parse(fs.readFileSync(P('input/tts_raw.json'), 'utf8'));
fs.writeFileSync(P('narration.mp3'), Buffer.from(raw.audio_base64, 'base64'));
// 声は読み用の台本(script_reading.txt)で作り、字幕は元の台本(script.txt)の文を使う（文の数は同じ）
const voices = fs.existsSync(P('voices.json')) ? JSON.parse(fs.readFileSync(P('voices.json'), 'utf8')) : null;
const spkNames = voices ? Object.keys(voices.speakers) : [];
// 掛け合いの台本：行頭の「話者：」を外し、行を改行でつなぐ
const stripSpk = (txt) => txt.split('\n').filter((l) => l.trim()).map((l) => { const m = l.match(new RegExp('^(' + spkNames.join('|') + ')[：:]\\s*(.*)$')); return m ? m[2].trim() : l.trim(); }).join('\n');
const reading0 = fs.existsSync(P('input/script_reading.txt')) ? fs.readFileSync(P('input/script_reading.txt'), 'utf8').trim() : fs.readFileSync(P('input/script.txt'), 'utf8').trim();
const display0 = fs.readFileSync(P('input/script.txt'), 'utf8').trim();
const reading = voices ? stripSpk(reading0) : reading0;
const display = voices ? stripSpk(display0) : display0;
const script = reading;
const al = raw.alignment || raw.normalized_alignment;
const chars = al.characters, st = al.character_start_times_seconds, en = al.character_end_times_seconds;
if (chars.join('').replace(/\n$/, '') !== script) console.warn('警告: 文字列が台本と完全一致しません', chars.length, script.length);
// 文に分ける（。！？と改行。閉じかっこは直前の文に付ける）
const sents = []; let cur = '', startIdx = 0, turn = 0; // turn＝何行目（話者の番号）
for (let i = 0; i < chars.length; i++) {
  const c = chars[i];
  if (c === '\n') { if (cur.trim()) { sents.push({ text: cur.trim(), a: startIdx, b: i - 1, turn }); } cur = ''; startIdx = i + 1; turn++; continue; }
  cur += c;
  const next = chars[i + 1];
  if ('。！？'.includes(c) && !(next && '」』）'.includes(next))) { sents.push({ text: cur.trim(), a: startIdx, b: i, turn }); cur = ''; startIdx = i + 1; }
}
if (cur.trim()) sents.push({ text: cur.trim(), a: startIdx, b: chars.length - 1, turn });
const splitText = (str) => { const r = []; let c = ''; for (let i = 0; i < str.length; i++) { const ch = str[i]; if (ch === '\n') { if (c.trim()) r.push(c.trim()); c = ''; continue; } c += ch; const nx = str[i + 1]; if ('。！？'.includes(ch) && !(nx && '」』）'.includes(nx))) { r.push(c.trim()); c = ''; } } if (c.trim()) r.push(c.trim()); return r; };
const dispSents = splitText(display);
if (dispSents.length !== sents.length) throw new Error(`文の数が合いません: 字幕${dispSents.length} / 音声${sents.length}`);
const out = sents.map((s, idx) => {
  let a = s.a; while (a < s.b && /\s/.test(chars[a])) a++;
  const o = { i: idx, text: dispSents[idx], start: st[a], end: en[s.b] };
  if (voices && raw.turns && raw.turns[s.turn]) o.speaker = raw.turns[s.turn].speaker;
  return o;
});
const total = en[en.length - 1];
fs.writeFileSync(P('timings.json'), JSON.stringify({ duration: total, sentences: out }, null, 1));
if (voices) console.log('話者:', [...new Set(out.map((o) => o.speaker))].join(' / '));
console.log('文の数', out.length, '音声の長さ', total.toFixed(1), '秒');
