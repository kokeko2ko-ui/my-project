#!/usr/bin/env node
// 科学ミステリー用サムネイル（1280x720）。黒い宇宙＋右に被写体＋左に極太明朝（上=白／下=赤）。
// 使い方: node tools/thumb.js <回のフォルダ>/thumb.json
//   thumb.json: {"img": "PIA19048.jpg", "imgX": "62%", "imgY": "50%", "imgScale": 1.15,
//                "top": "氷の下には", "bottom": "何が\n眠っている？", "chip": "木星の衛星エウロパ",
//                "topSize": 92, "bottomSize": 150, "out": "out/thumb.png"}
//   img は回の assets/ の画像。chip は左上の小さな札（なくてよい）。
// 出力: <回>/out/thumb.png と、スマホで見える大きさの確認画像 out/thumb_small.png（2MB未満を確認）
const fs = require('fs');
const path = require('path');
const {chromium} = require('playwright');

const cfgPath = path.resolve(process.argv[2] || 'episodes/europa_demo/thumb.json');
const EP = path.dirname(cfgPath);
const c = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const root = path.resolve(__dirname, '..');
const fontsCss = fs.readFileSync(path.join(root, 'public/fonts.css'), 'utf8').replace(/url\(fonts\//g, `url(file://${root}/public/fonts/`);
const img = `file://${path.join(EP, 'assets', c.img)}`;
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontsCss}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#000;overflow:hidden;position:relative;font-family:"Shippori Mincho B1",serif}
.bg{position:absolute;inset:0;background:url('${img}') no-repeat;background-size:${(c.imgScale || 1.1) * 100}% auto;background-position:${c.imgX || '70%'} ${c.imgY || '50%'};filter:saturate(1.15) contrast(1.1)}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse at ${c.glowX || '72%'} ${c.glowY || '55%'}, rgba(80,170,255,${c.glow ?? 0.22}) 0%, rgba(0,0,0,0) 45%)}
.shade{position:absolute;inset:0;background:linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 38%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0) 100%)}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)}
.txt{position:absolute;left:56px;top:50%;transform:translateY(-50%);}
.top{font-weight:800;color:#fff;font-size:${c.topSize || 92}px;line-height:1.15;letter-spacing:4px;
  text-shadow:0 0 4px #000,0 0 18px #000;-webkit-text-stroke:3px #000;paint-order:stroke fill}
.bottom{font-weight:800;color:#ff2a2a;font-size:${c.bottomSize || 150}px;line-height:1.08;margin-top:14px;letter-spacing:2px;
  -webkit-text-stroke:10px #000;paint-order:stroke fill;text-shadow:0 0 30px rgba(255,40,40,0.35),0 6px 14px #000}
.chip{position:absolute;left:56px;top:40px;font-family:"Noto Sans JP",sans-serif;font-weight:700;font-size:34px;color:#cfe4ff;
  border:3px solid rgba(160,200,255,0.8);padding:6px 18px;border-radius:6px;background:rgba(0,10,30,0.6)}
</style></head><body><div class="bg"></div><div class="glow"></div><div class="shade"></div><div class="vig"></div>
${c.chip ? `<div class="chip">${esc(c.chip)}</div>` : ''}
<div class="txt"><div class="top">${esc(c.top)}</div><div class="bottom">${esc(c.bottom)}</div></div></body></html>`;
(async () => {
  const out = path.join(EP, c.out || 'out/thumb.png');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1280, height: 720}});
  const hp = out.replace(/\.png$/, '.html');
  fs.writeFileSync(hp, html);
  await p.goto('file://' + hp, {waitUntil: 'load'});
  await p.evaluate(async () => { await document.fonts.ready; });
  await p.waitForTimeout(400);
  await p.screenshot({path: out});
  // スマホの一覧で見える大きさ（幅 320px）
  const p2 = await b.newPage({viewport: {width: 320, height: 180}});
  const sp = out.replace(/\.png$/, '_small.html');
  fs.writeFileSync(sp, `<body style="margin:0"><img src="file://${out}" style="width:320px;height:180px"></body>`);
  await p2.goto('file://' + sp, {waitUntil: 'load'});
  await p2.screenshot({path: out.replace(/\.png$/, '_small.png')});
  await b.close();
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log('保存', out, kb + 'KB', kb < 2048 ? 'OK(2MB未満)' : '★2MB以上：jpgにする');
})();
