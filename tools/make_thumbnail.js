#!/usr/bin/env node
/**
 * 感動系YouTube サムネイル生成ツール（1280x720 PNG）
 *
 *   node tools/make_thumbnail.js config.json
 *
 * config 例:
 * { "out":"/mnt/user-data/outputs/thumb.png",
 *   "top":["1行目","2行目"], "bottom":"赤の一言",
 *   "scene":"gauge|window|tape|letter|generic",
 *   "bg":"/path/photo.jpg" }          // 任意：AI生成画像や写真を背景に敷く
 *
 * 日本語は Noto Sans JP Black(900) で実描画。AI画像生成と違い文字が絶対に崩れない。
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
                '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell']
  .find(p => fs.existsSync(p));
if (!CHROME) { console.error('Chromium が見つかりません'); process.exit(1); }
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* 中央の主役ビジュアル */
function scene(kind) {
  const glow = `<filter id="g" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="9" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  if (kind === 'gauge') {
    // 半円ゲージ: 中心(300,300) r=230, E=左 F=右。針は F 寄り(上右 40°)。
    const cx = 300, cy = 300, r = 230, len = Math.PI * r;      // 弧長
    const ang = 28 * Math.PI / 180;                             // 針の角度(水平から)
    const nx = cx + (r - 34) * Math.cos(ang), ny = cy - (r - 34) * Math.sin(ang);
    return `<svg viewBox="0 0 600 340" width="600" height="340"><defs>${glow}
      <linearGradient id="nd" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stop-color="#ff4b2b"/><stop offset="1" stop-color="#ffc061"/></linearGradient></defs>
      <path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none"
            stroke="#222c3f" stroke-width="26" stroke-linecap="round"/>
      <g filter="url(#g)">
        <path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none"
              stroke="#ffa32e" stroke-width="26" stroke-linecap="round"
              stroke-dasharray="${len*0.3} ${len}" stroke-dashoffset="${-len*0.7}"/>
      </g>
      <text x="${cx-r-18}" y="${cy+46}" fill="#8b95a8" font-size="42" font-weight="900" font-family="'Noto Sans JP'">E</text>
      <g filter="url(#g)"><text x="${cx+r-14}" y="${cy+46}" fill="#ffd89b" font-size="48" font-weight="900" font-family="'Noto Sans JP'">F</text></g>
      <g filter="url(#g)">
        <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}"
              stroke="url(#nd)" stroke-width="13" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="22" fill="#151d2c" stroke="#ff8f32" stroke-width="6"/>
      </g></svg>`;
  }
  if (kind === 'window') {
    return `<svg viewBox="0 0 600 340" width="600" height="340"><defs>${glow}</defs>
      <g filter="url(#g)"><rect x="200" y="70" width="200" height="150" rx="6" fill="#ffc87a"/></g>
      <rect x="200" y="70" width="200" height="150" rx="6" fill="none" stroke="#2a3346" stroke-width="10"/>
      <line x1="300" y1="70" x2="300" y2="220" stroke="#2a3346" stroke-width="10"/>
      <line x1="200" y1="145" x2="400" y2="145" stroke="#2a3346" stroke-width="10"/></svg>`;
  }

  if (kind === 'frost') {
    // 霜のついたフロントガラスと、削って開けた視界
    return `<svg viewBox="0 0 700 380" width="700" height="380"><defs>${glow}
      <radialGradient id="clear" cx="50%" cy="52%" r="46%">
        <stop offset="0" stop-color="#0a1322"/><stop offset="72%" stop-color="#0a1322"/>
        <stop offset="100%" stop-color="#0a1322" stop-opacity="0"/></radialGradient>
      <pattern id="fr" width="14" height="14" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="2.6" fill="#cfe4f5" opacity=".5"/>
        <circle cx="10" cy="10" r="1.9" fill="#e8f3ff" opacity=".42"/>
        <circle cx="12" cy="2" r="1.2" fill="#ffffff" opacity=".3"/></pattern></defs>
      <rect x="20" y="20" width="660" height="340" rx="26" fill="#12202f"/>
      <rect x="20" y="20" width="660" height="340" rx="26" fill="url(#fr)"/>
      <ellipse cx="350" cy="198" rx="200" ry="124" fill="url(#clear)"/>
      <g filter="url(#g)"><ellipse cx="350" cy="198" rx="200" ry="124" fill="none"
         stroke="#9ec9ea" stroke-width="3" opacity=".55"/></g>
      <g filter="url(#g)"><circle cx="452" cy="150" r="30" fill="#ffd79a" opacity=".85"/></g>
      <rect x="20" y="20" width="660" height="340" rx="26" fill="none" stroke="#2b3a4d" stroke-width="7"/></svg>`;
  }
  if (kind === 'panel') {
    // 給湯器のリモコン（日本語も実フォントで描ける）
    return `<svg viewBox="0 0 620 340" width="620" height="340"><defs>${glow}</defs>
      <rect x="110" y="40" width="400" height="260" rx="22" fill="#e9eef4" stroke="#aab6c4" stroke-width="6"/>
      <rect x="140" y="72" width="340" height="112" rx="10" fill="#0e2a24"/>
      <g filter="url(#g)">
        <text x="310" y="132" text-anchor="middle" fill="#6effc4" font-size="44" font-weight="900"
              font-family="'Noto Sans JP'">おふろ</text>
        <text x="310" y="172" text-anchor="middle" fill="#6effc4" font-size="30" font-weight="900"
              font-family="'Noto Sans JP'">41℃</text></g>
      <g filter="url(#g)"><circle cx="196" cy="240" r="30" fill="#ff8a3c"/></g>
      <circle cx="310" cy="240" r="26" fill="#c9d3de"/><circle cx="424" cy="240" r="26" fill="#c9d3de"/></svg>`;
  }
  if (kind === 'microwave') {
    return `<svg viewBox="0 0 660 340" width="660" height="340"><defs>${glow}</defs>
      <rect x="40" y="40" width="580" height="270" rx="16" fill="#151a22" stroke="#2c3644" stroke-width="7"/>
      <rect x="70" y="72" width="380" height="206" rx="10" fill="#0c1016" stroke="#39465a" stroke-width="5"/>
      <g filter="url(#g)"><rect x="82" y="84" width="356" height="182" rx="6" fill="#ffb347" opacity=".82"/></g>
      <rect x="82" y="84" width="356" height="182" rx="6" fill="none" stroke="#5a6a80" stroke-width="3"/>
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
  // 背景画像は data URI で埋め込む（setContent では file:// が読めないため）
  let bg = '';
  if (c.bg && fs.existsSync(c.bg)) {
    const ext = path.extname(c.bg).toLowerCase().replace('.', '') || 'png';
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    const b64 = fs.readFileSync(c.bg).toString('base64');
    bg = `<div class="photo" style="background-image:url('data:image/${mime};base64,${b64}')"></div>`;
  }
  const top = (c.top || []).map(l => `<div class="tl">${esc(l)}</div>`).join('');
  const bot = c.bottom ? `<div class="bot"><span>${esc(c.bottom)}</span></div>` : '';
  const ts = c.topSize || 56, bs = c.bottomSize || 56;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:720px;overflow:hidden}
body{font-family:'Noto Sans JP',sans-serif;background:#04060b;position:relative;--bgb:${c.bgBright||0.45}}
.sky{position:absolute;inset:0;background:
  radial-gradient(140% 95% at 50% 62%, #243252 0%, #111a30 38%, #060a14 72%, #03050a 100%)}
.photo{position:absolute;inset:0;background-size:cover;background-position:center;
  filter:brightness(var(--bgb,.45)) saturate(.9)}
.hood{position:absolute;left:-8%;right:-8%;bottom:-150px;height:320px;border-radius:50% 50% 0 0;
  background:linear-gradient(#070c16,#03050a);box-shadow:0 -30px 70px rgba(0,0,0,.8)}
.vig{position:absolute;inset:0;background:
  radial-gradient(78% 62% at 50% 50%, transparent 0%, rgba(0,0,0,.55) 68%, rgba(0,0,0,.9) 100%)}
.mid{position:absolute;left:0;right:0;top:172px;height:330px;
  display:flex;align-items:center;justify-content:center}
.top{position:absolute;left:0;right:0;top:26px;padding:0 40px;text-align:center;z-index:5}
.tl{font-weight:900;font-size:${ts}px;line-height:1.24;color:#fff;letter-spacing:-.5px;
  -webkit-text-stroke:12px #000;paint-order:stroke fill;text-shadow:0 5px 24px rgba(0,0,0,.95)}
.bot{position:absolute;left:0;right:0;bottom:0;height:150px;z-index:5;
  display:flex;align-items:center;justify-content:center;padding:0 40px;
  background:linear-gradient(transparent,rgba(0,0,0,.72) 45%)}
.bot span{font-weight:900;font-size:${bs}px;line-height:1.1;color:#ff2b2b;
  -webkit-text-stroke:13px #000;paint-order:stroke fill;
  text-shadow:0 0 34px rgba(255,45,45,.55),0 5px 20px rgba(0,0,0,.95)}
</style></head><body>
${c.bg ? '' : '<div class="sky"></div>'}${bg}${c.bg ? '' : '<div class="hood"></div>'}
<div class="mid">${scene(c.scene)}</div>
<div class="vig"></div>
<div class="top">${top}</div>${bot}
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
