import {staticFile} from 'remotion';
import timings from '../timings.json';
import storyboard from '../storyboard.json';

// フォントは public/fonts に同梱（tools/get_fonts.js で取得）。描画中にネットへ出ない。
export const HAND = `"Yusei Magic", "Zen Maru Gothic", sans-serif`;
export const SUB = `"Zen Maru Gothic", sans-serif`;

const allText = JSON.stringify(storyboard) + JSON.stringify(timings) + '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ?!…';

export const fontsReady: Promise<void> = (async () => {
  if (typeof document === 'undefined') return;
  await new Promise<void>((res) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = staticFile('fonts.css');
    l.onload = () => res();
    l.onerror = () => res();
    document.head.appendChild(l);
  });
  await Promise.all([
    (document as any).fonts.load('400 40px "Yusei Magic"', allText),
    (document as any).fonts.load('700 40px "Zen Maru Gothic"', allText),
  ]);
})();
