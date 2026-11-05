// Google Fonts を動画フォルダに同梱する（描画時にネットへ出ないようにする）
const {execFileSync} = require('child_process');
const fs = require('fs');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const curl = (u, out) => execFileSync('curl', ['-sS', '--fail', '-m', '60', '-A', UA, ...(out ? ['-o', out] : []), u], {maxBuffer: 1 << 26});
const fams = [['Yusei+Magic', 'Yusei Magic', '400'], ['Zen+Maru+Gothic', 'Zen Maru Gothic', '700']];
let css = '';
for (const [q, name, w] of fams) {
  const src = curl(`https://fonts.googleapis.com/css2?family=${q}:wght@${w}&display=block`).toString();
  const blocks = src.match(/@font-face\s*{[^}]*}/g) || [];
  blocks.forEach((b, i) => {
    const url = b.match(/url\((https:[^)]+)\)/)[1];
    const file = `fonts/${q.replace(/\+/g, '')}_${w}_${i}.woff2`;
    if (!fs.existsSync('public/' + file)) curl(url, 'public/' + file);
    css += b.replace(/url\(https:[^)]+\)/, `url(${file.replace('fonts/', 'fonts/')})`) + '\n';
  });
  console.log(name, blocks.length, 'chunks');
}
fs.writeFileSync('public/fonts.css', css.replace(/url\(fonts\//g, 'url(fonts/'));
