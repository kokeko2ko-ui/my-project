/**
 * 投稿用コピーページを作る。
 *   node tools/copy_page.js tools/meta/<番号>_<テーマ>.json
 * ナレーション・タイトル・説明文・タグ・固定コメントを、ボタン一つでコピーできる HTML を
 * /mnt/user-data/outputs/コピー用_第◯作_<題名>.html に書き出す（Artifact で公開して使う）。
 */
const fs = require('fs');
const path = require('path');

const meta = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const narration = fs.readFileSync(meta.narration, 'utf8').replace(/\n+$/, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const len = (s) => [...s.replace(/\s/g, '')].length;

const blocks = [
  ...meta.titles.map((t, i) => ({ id: `title${i + 1}`, label: i === 0 ? 'タイトル（推奨）' : `タイトル（サブ案${i}）`, text: t, note: `${[...t].length}字` })),
  { id: 'desc', label: '説明文', text: meta.description, note: `${len(meta.description)}字` },
  { id: 'tags', label: 'タグ', text: meta.tags, note: `${meta.tags.split(',').length}個・${[...meta.tags].length}字（上限500字）` },
  { id: 'comment', label: '固定コメント', text: meta.comment, note: `${len(meta.comment)}字` },
  { id: 'narration', label: 'ナレーション（Vrew用）', text: narration, note: `約${len(narration).toLocaleString()}字`, tall: true },
];

const card = (b) => `
<section class="card${b.tall ? ' tall' : ''}" aria-labelledby="h-${b.id}">
  <header>
    <h2 id="h-${b.id}">${b.label}</h2>
    <span class="note">${b.note}</span>
    <button type="button" class="copy" id="btn-${b.id}" data-target="${b.id}">コピー</button>
  </header>
  <pre id="${b.id}" class="text" tabindex="0">${esc(b.text)}</pre>
</section>`;

const html = `<title>第${meta.no}作 ${esc(meta.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;700;900&display=swap">
<style>
/* 1カラムの投稿チェックリスト。上から YouTube Studio に貼る順に並べる */
:root {
  --bg: #f3f1ec; --surface: #fffdf8; --fg: #23211d; --muted: #6f6a60;
  --line: #ddd7cb; --accent: #b4321f; --accent-fg: #ffffff; --done: #2f7d4f;
  --font: "Zen Kaku Gothic New", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #181715; --surface: #22201d; --fg: #ece8df; --muted: #a39d91;
  --line: #3a3732; --accent: #e0644c; --accent-fg: #1a1210; --done: #6cc28f; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #181715; --surface: #22201d; --fg: #ece8df; --muted: #a39d91;
  --line: #3a3732; --accent: #e0644c; --accent-fg: #1a1210; --done: #6cc28f; color-scheme: dark }
body { background: var(--bg); color: var(--fg); font-family: var(--font); font-size: 15px; line-height: 1.7; }
.wrap { max-width: 760px; margin: 0 auto; padding-inline: 16px; padding-block: 28px 56px; display: flex; flex-direction: column; gap: 18px; }
.top { display: flex; flex-direction: column; gap: 4px; }
.eyebrow { font-size: 12px; letter-spacing: .12em; color: var(--muted); }
h1 { margin: 0; font-size: 26px; font-weight: 900; text-wrap: balance; }
.lead { margin: 0; color: var(--muted); font-size: 13px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; min-width: 0; }
.card header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 14px; border-bottom: 1px solid var(--line); }
h2 { margin: 0; font-size: 15px; font-weight: 700; }
.note { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.copy { margin-left: auto; font: inherit; font-weight: 700; font-size: 14px; padding: 7px 18px; min-width: 7.5em;
  border: 0; border-radius: 999px; background: var(--accent); color: var(--accent-fg); cursor: pointer; }
.copy:hover { filter: brightness(1.08); }
.copy:focus-visible { outline: 3px solid var(--fg); outline-offset: 2px; }
.copy.ok { background: var(--done); }
.text { margin: 0; padding: 14px; white-space: pre-wrap; word-break: break-word; font: inherit; font-size: 14px; max-height: 14em; overflow: auto; }
.tall .text { max-height: 22em; }
.text:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
@media (prefers-reduced-motion: no-preference) { .copy { transition: background-color .2s; } }
</style>
<main class="wrap">
  <div class="top">
    <span class="eyebrow">第${meta.no}作・投稿用コピー</span>
    <h1>${esc(meta.name)}</h1>
    <p class="lead">各欄の「コピー」を押すと、その欄の全文がコピーされます。YouTube Studio に上から順に貼り付けてください。</p>
  </div>
  ${blocks.map(card).join('\n')}
</main>
<script>
document.querySelectorAll('.copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.target);
    const done = (msg, ok) => {
      btn.textContent = msg; btn.classList.toggle('ok', ok);
      setTimeout(() => { btn.textContent = 'コピー'; btn.classList.remove('ok'); }, 2200);
    };
    const selectText = () => {
      const r = document.createRange(); r.selectNodeContents(el);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    };
    try {
      navigator.clipboard.writeText(el.textContent)
        .then(() => done('コピーしました', true))
        .catch(() => { selectText(); done('選択しました。長押しでコピー', false); });
    } catch (e) { selectText(); done('選択しました。長押しでコピー', false); }
  });
});
</script>
`;

const out = `/mnt/user-data/outputs/コピー用_第${meta.no}作_${meta.name.replace(/[、。\s]/g, '')}.html`;
fs.writeFileSync(out, html, 'utf8');
console.log('written:', out);
