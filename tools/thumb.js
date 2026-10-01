#!/usr/bin/env node
/**
 * サムネイル一括作成（背景の取得 → 文字の合成 → 表示サイズ確認 → 完成品の保存）
 *
 *   node tools/thumb.js tools/thumb_configs/48_mailbox.json
 *
 * 設定ファイル（make_thumbnail.js の項目に加えて）:
 *   "title":  "第48作_朝いちばんの郵便受け"   // 完成品のファイル名になる
 *   "bg":     "assets/thumb_bg/48_朝いちばんの郵便受け.png"  // 背景の保存先（リポジトリ内）
 *   "bgUrl":  "https://d8j0ntlcm91z4.cloudfront.net/....png" // Higgsfieldの生成結果URL
 *   "prompt": "..."                              // 背景の生成プロンプト（記録用）
 *
 * 背景が bg にまだ無く bgUrl があれば、ダウンロードしてから合成する。
 * 出力:
 *   /mnt/user-data/outputs/サムネ完成_<title>.png
 *   /mnt/user-data/outputs/サムネ下書き/<title>_表示サイズ確認.png
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTDIR = '/mnt/user-data/outputs';
const cfgPath = process.argv[2];
if (!cfgPath) { console.error('使い方: node tools/thumb.js 設定.json'); process.exit(1); }
const c = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
if (!c.title) { console.error('設定に "title" がありません（完成品のファイル名に使います）'); process.exit(1); }
if (!c.bg) { console.error('設定に "bg"（背景の保存先）がありません'); process.exit(1); }

const bgAbs = path.resolve(ROOT, c.bg);

// 1) 背景の取得
if (!fs.existsSync(bgAbs)) {
  if (!c.bgUrl) {
    console.error(`背景がありません: ${c.bg}\n"bgUrl" に生成結果のURLを入れるか、画像をこの場所に置いてください。`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(bgAbs), { recursive: true });
  console.log('背景をダウンロード中:', c.bgUrl);
  // curl は環境のプロキシ設定（HTTPS_PROXY）をそのまま使う
  const r = spawnSync('curl', ['-sS', '-L', '--max-time', '60', '-o', bgAbs, '-w', '%{http_code}', c.bgUrl],
    { encoding: 'utf8' });
  const code = (r.stdout || '').trim();
  if (r.status !== 0 || code !== '200') {
    try { fs.unlinkSync(bgAbs); } catch (_) {}
    const host = new URL(c.bgUrl).host;
    const blocked = /CONNECT tunnel failed, response 403/.test(r.stderr || '');
    console.error(`\n背景をダウンロードできませんでした（HTTP ${code || '-'}）`);
    if (blocked) {
      console.error(`原因: この環境のネットワーク設定で ${host} への接続が許可されていません。`);
      console.error(`対処: 環境の設定 → Network access の許可ドメインに ${host} を追加してください。`);
      console.error('それまでは、生成画像をダウンロードしてチャットに添付してもらえば合成できます。');
    } else {
      console.error((r.stderr || '').trim());
    }
    process.exit(2);
  }
  console.log(`背景を保存しました: ${c.bg}（${Math.round(fs.statSync(bgAbs).size / 1024)} KB）`);
} else {
  console.log('背景（保存済み）:', c.bg);
}

// 2) 文字の合成
const finalOut = path.join(OUTDIR, `サムネ完成_${c.title}.png`);
const draftDir = path.join(OUTDIR, 'サムネ下書き');
fs.mkdirSync(draftDir, { recursive: true });
const tmpCfg = path.join(require('os').tmpdir(), `thumb_${process.pid}.json`);
fs.writeFileSync(tmpCfg, JSON.stringify({ ...c, bg: bgAbs, out: finalOut }));
const r1 = spawnSync('node', [path.join(__dirname, 'make_thumbnail.js'), tmpCfg], { stdio: 'inherit', cwd: ROOT });
fs.unlinkSync(tmpCfg);
if (r1.status !== 0) process.exit(r1.status || 1);

// 3) 実際の表示サイズで確認用の画像を作る
const checkOut = path.join(draftDir, `${c.title}_表示サイズ確認.png`);
const r2 = spawnSync('node', [path.join(__dirname, 'thumb_sizecheck.js'), finalOut, checkOut], { stdio: 'inherit', cwd: ROOT });
if (r2.status !== 0) process.exit(r2.status || 1);

// 4) 仕様チェック（1280×720・2MB未満）
const buf = fs.readFileSync(finalOut);
const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20), kb = Math.round(buf.length / 1024);
const ok = w === 1280 && h === 720 && buf.length < 2 * 1024 * 1024;
console.log(`\n${ok ? '✅' : '⚠️'} ${w}×${h} / ${kb} KB（YouTubeの規格: 1280×720・2MB未満）`);
console.log('完成品:      ', finalOut);
console.log('表示サイズ確認:', checkOut);
