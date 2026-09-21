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
 *   "scene":"gauge|panel|microwave|tape|rice|window|frost|none",
 *   "topSize":68, "bottomSize":66,
 *   "scenePos":"left|right|center", "sceneScale":1.0, "sceneY":210,
 *   "align":"left|right|center", "textWidth":"58%",
 *   "vignette":0-1, "shade":0-1, "spot":0-1,  // 既に暗い写真では下げる
 *   "scrim":0-1, "scrimSide":"left|right",     // 文字側だけ落として可読性を上げる
 *   "lamp":0-1, "lampX":"68%", "lampY":"71%", "lampSize":260 }
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
const mark = (s, hi) => esc(s)
  .replace(/\[([^\]]+)\]/g, `<em style="color:${hi};font-style:normal">$1</em>`)
  .replace(/\\n|\n/g, '<br>');

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
  if (kind === 'rice') {
    // 炊飯器：金属質のグラデ＋反射＋「保温」のオレンジ点灯＋湯気
    const steam = (x, o) => `<path d="M${x} 88 c-13 -20 13 -32 0 -52 c-13 -20 13 -28 0 -48"
        fill="none" stroke="#e3ecf6" stroke-width="7" stroke-linecap="round" opacity="${o}"/>`;
    return `<svg viewBox="0 0 620 340" width="620" height="340"><defs>${glow}
      <linearGradient id="bodyG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f4f8fc"/><stop offset=".42" stop-color="#cfd9e5"/>
        <stop offset=".72" stop-color="#8f9dae"/><stop offset="1" stop-color="#5d6a7b"/></linearGradient>
      <linearGradient id="lidG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#dde5ee"/>
        <stop offset="1" stop-color="#9aa7b7"/></linearGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".5" stop-color="#fff" stop-opacity=".55"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <g filter="url(#g)">${steam(252, '.62')}${steam(318, '.44')}${steam(384, '.56')}</g>
      <ellipse cx="312" cy="298" rx="188" ry="17" fill="#000" opacity=".6"/>
      <rect x="146" y="152" width="332" height="136" rx="24" fill="url(#bodyG)"/>
      <rect x="146" y="152" width="332" height="136" rx="24" fill="none" stroke="#39445270" stroke-width="3"/>
      <rect x="168" y="166" width="288" height="12" rx="6" fill="url(#shine)"/>
      <rect x="132" y="114" width="360" height="50" rx="21" fill="url(#lidG)"/>
      <rect x="132" y="114" width="360" height="50" rx="21" fill="none" stroke="#39445270" stroke-width="3"/>
      <rect x="286" y="98" width="50" height="22" rx="10" fill="#b9c5d2" stroke="#7d8b9b" stroke-width="4"/>
      <rect x="180" y="198" width="146" height="58" rx="9" fill="#0d131c"/>
      <rect x="180" y="198" width="146" height="58" rx="9" fill="none" stroke="#4a5768" stroke-width="3"/>
      <g filter="url(#g)"><circle cx="410" cy="210" r="17" fill="#ffa233"/>
        <circle cx="410" cy="210" r="7" fill="#fff2d8"/></g>
      <text x="410" y="262" text-anchor="middle" fill="#ffc271" font-size="28" font-weight="900"
        font-family="'Noto Sans JP'">保温</text></svg>`;
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

function heroBlock(c) {
  const hi = c.highlight || '#ffe23d';
  const sub  = c.sub  ? `<div class="sub">${mark(c.sub, hi)}</div>` : '';
  const main = c.main ? `<div class="main">${mark(c.main, hi)}</div>` : '';
  const foot = c.foot ? `<div class="foot">${mark(c.foot, '#ffe23d')}</div>` : '';
  const al = c.align === 'right' ? 'hr' : (c.align === 'left' ? 'hl' : '');
  return `<div class="hero ${al}"><div class="col">${sub}${main}${foot}</div></div>`;
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
.spot{position:absolute;inset:0;background:radial-gradient(38% 52% at ${c.spotX||'26%'} ${c.spotY||'58%'},
  rgba(255,190,90,${(c.spot??1)*0.30}) 0%, rgba(255,150,60,${(c.spot??1)*0.10}) 42%, rgba(0,0,0,0) 72%);
  mix-blend-mode:screen;z-index:2}
.dark{position:absolute;inset:0;background:radial-gradient(62% 72% at ${c.spotX||'26%'} ${c.spotY||'58%'},
  rgba(0,0,0,0) 30%, rgba(0,0,0,${(c.vignette??1)*0.55}) 72%, rgba(0,0,0,${(c.vignette??1)*0.88}) 100%);z-index:3}
/* 文字側だけを落とす横スクリム（写真の上で文字を読ませる） */
.scrim{position:absolute;inset:0;z-index:5;background:linear-gradient(
  ${c.scrimSide==='right'?'270deg':'90deg'},
  rgba(0,0,0,${c.scrim??0}) 0%, rgba(0,0,0,${(c.scrim??0)*0.82}) 34%,
  rgba(0,0,0,${(c.scrim??0)*0.35}) 58%, rgba(0,0,0,0) 78%)}
/* 光点の強調（保温ランプ等） */
.lamp{position:absolute;z-index:4;left:${c.lampX||'50%'};top:${c.lampY||'50%'};
  width:${c.lampSize||260}px;height:${c.lampSize||260}px;transform:translate(-50%,-50%);
  border-radius:50%;mix-blend-mode:screen;background:radial-gradient(circle,
  rgba(255,150,40,${c.lamp??0}) 0%, rgba(255,120,30,${(c.lamp??0)*0.45}) 26%, rgba(0,0,0,0) 62%)}
.shade{position:absolute;inset:0;z-index:5;background:
  linear-gradient(180deg,rgba(0,0,0,${(c.shade??1)*0.82}) 0%,rgba(0,0,0,${(c.shade??1)*0.35}) 26%,
  rgba(0,0,0,0) 44%,rgba(0,0,0,${(c.shade??1)*0.45}) 74%,rgba(0,0,0,${(c.shade??1)*0.9}) 100%)}
.mid{position:absolute;left:0;right:0;top:${c.sceneY||210}px;height:300px;z-index:4;
  display:flex;align-items:center;justify-content:${c.scenePos==='right'?'flex-end':
  (c.scenePos==='left'?'flex-start':'center')};padding:0 ${c.scenePad||40}px;
  transform:scale(${c.sceneScale||1});transform-origin:${c.scenePos==='right'?'right':
  (c.scenePos==='left'?'left':'center')} center}
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
.hero{position:absolute;z-index:9;left:0;right:0;top:0;bottom:0;
  display:flex;flex-direction:column;justify-content:center;align-items:center;
  text-align:center;padding:0 40px;gap:10px}
.hero.hr{align-items:flex-end;text-align:right;padding-right:48px}
.hero.hl{align-items:flex-start;text-align:left;padding-left:52px}
.hero .col{max-width:${c.textWidth||'100%'}}
.sub{font-weight:900;font-size:${c.subSize||40}px;color:#fff;letter-spacing:-1px;
  -webkit-text-stroke:10px #000;paint-order:stroke fill;
  filter:drop-shadow(0 4px 12px rgba(0,0,0,.95))}
.main{font-weight:900;font-size:${c.mainSize||132}px;line-height:1.02;color:${c.mainColor||'#ffe23d'};
  letter-spacing:-4px;-webkit-text-stroke:22px #000;paint-order:stroke fill;
  filter:drop-shadow(0 8px 22px rgba(0,0,0,1))}
.foot{font-weight:900;font-size:${c.footSize||46}px;color:${c.footColor||'#fff'};letter-spacing:-1.5px;
  -webkit-text-stroke:12px #000;paint-order:stroke fill;
  filter:drop-shadow(0 4px 12px rgba(0,0,0,.95))}
.glowline{position:absolute;left:50%;transform:translateX(-50%);bottom:132px;width:560px;height:5px;
  background:linear-gradient(90deg,transparent,#ff3b3b,transparent);opacity:.75;z-index:8}
</style></head><body>
${c.bg ? '' : '<div class="sky"></div>'}${bg}
<div class="spot"></div><div class="dark"></div>${c.lamp ? '<div class="lamp"></div>' : ''}
<div class="mid">${scene(c.scene)}</div>
${c.scrim ? '<div class="scrim"></div>' : ''}<div class="shade"></div>
${c.main ? heroBlock(c) : `<div class="band-t"></div>${bot ? '<div class="band-b"></div>' : ''}
<div class="topwrap">${top}</div>
${bot ? `<div class="glowline"></div><div class="botwrap">${bot}</div>` : ''}`}
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
