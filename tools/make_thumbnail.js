#!/usr/bin/env node
/**
 * 感動系YouTube サムネイル生成（1280x720 PNG）
 *   node tools/make_thumbnail.js config.json
 *
 * config:
 * { "out":"out.png",
 *   "top":["別居の日、[私の車は満タン]だった。","夫が[10年間]、黙って続けていたこと"],
 *   "bottom":"私は、[浮気]を疑っていた",
 *   "bg":"/path/photo.webp",   // 任意。写真背景（data URIで埋め込む）
 *   "bgBright":0.8,            // 背景の明るさ
 *   "scene":"gauge|panel|microwave|tape|window|frost|none",
 *   "topSize":68, "bottomSize":66 }
 *
 * [ ] で囲んだ語は黄色ハイライト。日本語は Noto Sans JP Black(900) 実描画。
 * 縁取りは 黒(外) → 白(中) → 本体 の三層で、日本のサムネ定番の見え方にする。
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell']
  .find(p => fs.existsSync(p));
if (!CHROME) { console.error('Chromium が見つかりません'); process.exit(1); }
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* [語] を黄色に。戻り値はHTML */
const mark = (s, hi) => esc(s).replace(/\[([^\]]+)\]/g,
  `<em style="color:${hi};font-style:normal">$1</em>`);

/* 黒→白→本体 の三層縁取り */
function layered(text, cls, hi) {
  return `<span class="ln ${cls}">${mark(text, hi)}</span>`;
}

function scene(kind) {
  const glow = `<filter id="g" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="9" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  if (kind === 'gauge') {
    const cx=300, cy=300, r=230, len=Math.PI*r, a=28*Math.PI/180;
    const nx=cx+(r-34)*Math.cos(a), ny=cy-(r-34)*Math.sin(a);
    return `<svg viewBox="0 0 600 340" width="600" height="340"><defs>${glow}
      <linearGradient id="nd" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stop-color="#ff4b2b"/><stop offset="1" stop-color="#ffc061"/></linearGradient></defs>
      <path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="#222c3f" stroke-width="26" stroke-linecap="round"/>
      <g filter="url(#g)"><path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none"
        stroke="#ffa32e" stroke-width="26" stroke-linecap="round"
        stroke-dasharray="${len*0.3} ${len}" stroke-dashoffset="${-len*0.7}"/></g>
      <text x="${cx-r-18}" y="${cy+46}" fill="#8b95a8" font-size="42" font-weight="900" font-family="'Noto Sans JP'">E</text>
      <g filter="url(#g)"><text x="${cx+r-14}" y="${cy+46}" fill="#ffd89b" font-size="48" font-weight="900" font-family="'Noto Sans JP'">F</text></g>
      <g filter="url(#g)"><line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}"
        stroke="url(#nd)" stroke-width="13" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="22" fill="#151d2c" stroke="#ff8f32" stroke-width="6"/></g></svg>`;
  }
  if (kind === 'panel') {
    return `<svg viewBox="0 0 620 340" width="620" height="340"><defs>${glow}</defs>
      <rect x="110" y="40" width="400" height="260" rx="22" fill="#e9eef4" stroke="#aab6c4" stroke-width="6"/>
      <rect x="140" y="72" width="340" height="112" rx="10" fill="#0e2a24"/>
      <g filter="url(#g)"><text x="310" y="132" text-anchor="middle" fill="#6effc4" font-size="44" font-weight="900" font-family="'Noto Sans JP'">おふろ</text>
      <text x="310" y="172" text-anchor="middle" fill="#6effc4" font-size="30" font-weight="900" font-family="'Noto Sans JP'">41℃</text></g>
      <g filter="url(#g)"><circle cx="196" cy="240" r="30" fill="#ff8a3c"/></g>
      <circle cx="310" cy="240" r="26" fill="#c9d3de"/><circle cx="424" cy="240" r="26" fill="#c9d3de"/></svg>`;
  }
  if (kind === 'microwave') {
    return `<svg viewBox="0 0 660 340" width="660" height="340"><defs>${glow}</defs>
      <rect x="40" y="40" width="580" height="270" rx="16" fill="#151a22" stroke="#2c3644" stroke-width="7"/>
      <rect x="70" y="72" width="380" height="206" rx="10" fill="#0c1016" stroke="#39465a" stroke-width="5"/>
      <g filter="url(#g)"><rect x="82" y="84" width="356" height="182" rx="6" fill="#ffb347" opacity=".82"/></g>
      <circle cx="540" cy="120" r="30" fill="#222b38" stroke="#4a586c" stroke-width="5"/>
      <rect x="500" y="190" width="80" height="16" rx="8" fill="#2a3442"/>
      <rect x="500" y="222" width="80" height="16" rx="8" fill="#2a3442"/></svg>`;
  }
  if (kind === 'tape') {
    return `<svg viewBox="0 0 600 340" width="600" height="340"><defs>${glow}</defs>
      <rect x="120" y="90" width="360" height="200" rx="10" fill="#1a2233" stroke="#39465e" stroke-width="6"/>
      <rect x="150" y="120" width="300" height="70" rx="4" fill="#e8dcc0"/>
      <g filter="url(#g)"><circle cx="235" cy="235" r="34" fill="#0d1421" stroke="#ffb45c" stroke-width="7"/>
      <circle cx="365" cy="235" r="34" fill="#0d1421" stroke="#ffb45c" stroke-width="7"/></g></svg>`;
  }
  return '';
}

function html(c) {
  let bg = '';
  if (c.bg && fs.existsSync(c.bg)) {
    const ext = path.extname(c.bg).toLowerCase().replace('.', '') || 'png';
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    bg = `<div class="photo" style="background-image:url('data:image/${mime};base64,${fs.readFileSync(c.bg).toString('base64')}')"></div>`;
  }
  const hi = c.highlight || '#ffe23d';
  const ts = c.topSize || 68, bs = c.bottomSize || 66;
  const top = (c.top || []).map(l => layered(l, 'top', hi)).join('');
  const bot = c.bottom ? layered(c.bottom, 'bot', '#fff36b') : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:720px;overflow:hidden}
body{font-family:'Noto Sans JP',sans-serif;background:#04060b;position:relative;--bgb:${c.bgBright||0.45}}
.sky{position:absolute;inset:0;background:radial-gradient(140% 95% at 50% 62%,#243252 0%,#111a30 38%,#060a14 72%,#03050a 100%)}
.photo{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(var(--bgb)) saturate(.95)}
.shade{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.35) 26%,rgba(0,0,0,0) 44%,
  rgba(0,0,0,.45) 74%,rgba(0,0,0,.9) 100%)}
.mid{position:absolute;left:0;right:0;top:210px;height:300px;display:flex;align-items:center;justify-content:center}
.topwrap{position:absolute;left:0;right:0;top:20px;padding:0 26px;text-align:center;z-index:9}
.botwrap{position:absolute;left:0;right:0;bottom:22px;padding:0 26px;text-align:center;z-index:9}
/* 単層の太縁取り（日本語は二重縁取りだと漢字が潰れるため） */
.ln{position:relative;display:block;line-height:1.22;font-weight:900;letter-spacing:-1.5px;
  paint-order:stroke fill}
.top{font-size:${ts}px;-webkit-text-stroke:14px #000;color:#fff;
  filter:drop-shadow(0 6px 16px rgba(0,0,0,.95))}
.top em{color:#ffe23d}
.bot{font-size:${bs}px;-webkit-text-stroke:15px #000;color:#ff2b2b;
  filter:drop-shadow(0 6px 16px rgba(0,0,0,.95))}
.bot em{color:#ffe23d}
.band-t{position:absolute;left:0;right:0;top:0;height:${(c.top||[]).length*(ts*1.22)+52}px;
  background:linear-gradient(180deg,rgba(0,0,0,.78) 0%,rgba(0,0,0,.6) 62%,rgba(0,0,0,0) 100%);z-index:7}
.band-b{position:absolute;left:0;right:0;bottom:0;height:${bs*1.22+72}px;
  background:linear-gradient(0deg,rgba(0,0,0,.86) 0%,rgba(0,0,0,.62) 58%,rgba(0,0,0,0) 100%);z-index:7}
.glowline{position:absolute;left:50%;transform:translateX(-50%);bottom:132px;width:560px;height:5px;
  background:linear-gradient(90deg,transparent,#ff3b3b,transparent);opacity:.75;z-index:8}
</style></head><body>
${c.bg ? '' : '<div class="sky"></div>'}${bg}
<div class="mid">${scene(c.scene)}</div>
<div class="shade"></div>
<div class="band-t"></div>${bot ? '<div class="band-b"></div>' : ''}
<div class="topwrap">${top}</div>
${bot ? `<div class="glowline"></div><div class="botwrap">${bot}</div>` : ''}
</body></html>`;
}

const p = process.argv[2];
if (!p) { console.error('使い方: node tools/make_thumbnail.js config.json'); process.exit(1); }
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
const out = c.out || '/mnt/user-data/outputs/thumbnail.png';
fs.mkdirSync(path.dirname(out), { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(html(c), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 720 } });
  await browser.close();
  console.log(`OK: ${out} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
})();
