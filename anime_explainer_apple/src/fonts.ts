import {staticFile} from 'remotion';

// フォントは public/fonts に同梱（tools/get_fonts.js で取得）。描画中にネットへ出ない。
export const HAND = `"Yusei Magic", "Zen Maru Gothic", sans-serif`;
export const SUB = `"Zen Maru Gothic", sans-serif`;

let linked: Promise<void> | null = null;
const linkCss = () => {
  if (!linked) {
    linked = new Promise<void>((res) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = staticFile('fonts.css');
      l.onload = () => res();
      l.onerror = () => res();
      document.head.appendChild(l);
    });
  }
  return linked;
};

// 使う文字を渡すと、その文字が入った分割フォントだけを読み込む
export const loadFonts = async (text: string): Promise<void> => {
  if (typeof document === 'undefined') return;
  await linkCss();
  const t = text + '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ?!…';
  await Promise.all([
    (document as any).fonts.load('400 40px "Yusei Magic"', t),
    (document as any).fonts.load('700 40px "Zen Maru Gothic"', t),
  ]);
};
