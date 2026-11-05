// キャラの見た目はここだけ。髪の色・服の色などを変えるときはこのファイルを編集する。
export type CharCfg = {
  skin: string; skinShade: string;
  hair: string; hairShade: string;
  style: 'bob' | 'spiky' | 'short';
  outfit: string; outfitShade: string;
  pants: string;
  hat?: string; scarf?: string; glasses?: boolean;
};
export const CHARS: Record<string, CharCfg> = {
  // 案内役：ミナ先生（黒髪おかっぱ・赤いベレー帽・黄色いマフラー・紺のセーター）
  mina: {skin: '#ffd9b8', skinShade: '#eab68a', hair: '#26231f', hairShade: '#0e0d0b', style: 'bob',
    outfit: '#2c3b7a', outfitShade: '#1c2754', pants: '#5a5a66', hat: '#e23d3d', scarf: '#ffcf2e'},
  // たとえ話の主人公：タロウ（オレンジの髪・緑のTシャツ）
  taro: {skin: '#ffd9b8', skinShade: '#eab68a', hair: '#ff8a1f', hairShade: '#d9680a', style: 'spiky',
    outfit: '#3fae5a', outfitShade: '#2b8444', pants: '#3a5aa8'},
  // 物語の主人公（まるメガネ・黒いセーター）
  jobs: {skin: '#f3cba5', skinShade: '#dba97d', hair: '#4a3626', hairShade: '#2c1f15', style: 'short',
    outfit: '#2a2a2e', outfitShade: '#161618', pants: '#4a6fa5', glasses: true},
};
