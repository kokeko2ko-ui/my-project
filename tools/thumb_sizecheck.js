// サムネを実際の表示サイズ（スマホ320px・PC関連欄246px・最小168px）で並べて可読性を確認する
// 使い方: node tools/thumb_sizecheck.js 完成画像.png 出力.png
const { chromium } = require('playwright-core'); const fs = require('fs');
const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'].find(p=>fs.existsSync(p));
const [src, out] = process.argv.slice(2);
const b64 = fs.readFileSync(src).toString('base64');
const cell = (w,l) => `<div><img src="data:image/png;base64,${b64}" width="${w}">
  <div style="color:#aaa;font-size:11px;padding-top:4px">${l}</div></div>`;
const html = `<html><body style="margin:0;background:#0f0f0f;display:flex;gap:18px;align-items:flex-start;padding:18px;font-family:sans-serif">
  ${cell(320,'320px（スマホ）')}${cell(246,'246px（PC関連欄）')}${cell(168,'168px（最小）')}</body></html>`;
(async()=>{const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:800,height:230}}); await p.setContent(html,{waitUntil:'load'});
await p.screenshot({path:out}); await b.close(); console.log('OK', out);})();
