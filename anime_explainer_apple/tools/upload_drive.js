// 完成した動画を Google Drive に自動アップロードする。
// 使い方: node tools/upload_drive.js <ファイル> [<ファイル>...]
// 必要な環境変数（環境の設定で登録する）:
//   GDRIVE_CLIENT_ID / GDRIVE_CLIENT_SECRET / GDRIVE_REFRESH_TOKEN
// 保存先: マイドライブ直下の「解説アニメ」フォルダ（なければ作る）
const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const need = ['GDRIVE_CLIENT_ID', 'GDRIVE_CLIENT_SECRET', 'GDRIVE_REFRESH_TOKEN'];
const miss = need.filter((k) => !process.env[k]);
if (miss.length) {
  console.error('未設定の環境変数があります:', miss.join(', '));
  console.error('環境の設定（Network secrets か環境変数）に登録して、新しいセッションで実行してください。');
  process.exit(2);
}
const files = process.argv.slice(2);
if (!files.length) { console.error('使い方: node tools/upload_drive.js <ファイル>...'); process.exit(1); }

const curl = (args) => execFileSync('curl', ['-sS', '-m', '1800', ...args], {maxBuffer: 1 << 26}).toString();
const json = (s) => { try { return JSON.parse(s); } catch { throw new Error('想定外の応答: ' + s.slice(0, 300)); } };

const tok = json(curl(['https://oauth2.googleapis.com/token', '-d', `client_id=${process.env.GDRIVE_CLIENT_ID}`,
  '-d', `client_secret=${process.env.GDRIVE_CLIENT_SECRET}`, '-d', `refresh_token=${process.env.GDRIVE_REFRESH_TOKEN}`, '-d', 'grant_type=refresh_token']));
if (!tok.access_token) { console.error('トークン取得に失敗:', tok.error_description || tok.error); process.exit(3); }
const auth = ['-H', `Authorization: Bearer ${tok.access_token}`];

const FOLDER = '解説アニメ';
const q = encodeURIComponent(`name='${FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
let found = json(curl([...auth, `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`])).files || [];
let folderId = found[0] && found[0].id;
if (!folderId) {
  folderId = json(curl([...auth, '-H', 'Content-Type: application/json', '-d', JSON.stringify({name: FOLDER, mimeType: 'application/vnd.google-apps.folder'}), 'https://www.googleapis.com/drive/v3/files?fields=id'])).id;
}

for (const f of files) {
  const name = path.basename(f);
  const size = fs.statSync(f).size;
  const mime = f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.txt') ? 'text/plain' : 'application/octet-stream';
  // 再開可能アップロード
  const hdr = execFileSync('curl', ['-sS', '-i', '-m', '60', '-X', 'POST', ...auth, '-H', 'Content-Type: application/json; charset=UTF-8',
    '-H', `X-Upload-Content-Type: ${mime}`, '-H', `X-Upload-Content-Length: ${size}`,
    '-d', JSON.stringify({name, parents: [folderId]}), 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink']).toString();
  const loc = (hdr.match(/^location:\s*(\S+)/im) || [])[1];
  if (!loc) { console.error('アップロード開始に失敗:', hdr.slice(0, 400)); process.exit(4); }
  const res = json(curl(['-X', 'PUT', '-H', `Content-Type: ${mime}`, '-T', f, loc]));
  console.log('アップロード完了:', name, res.webViewLink || res.id);
}
