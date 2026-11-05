// キャラの見た目はここだけ。髪の色・服の色などを変えるときはこのファイルを編集する。
export type CharCfg = {
  skin: string; skinShade: string;
  hair: string; hairShade: string;
  style: 'bob' | 'spiky' | 'short' | 'long' | 'pony' | 'twin' | 'bun' | 'bald' | 'none';
  outfit: string; outfitShade: string;
  pants: string;
  hat?: string; scarf?: string; glasses?: boolean;
  cap?: string; headband?: string; ears?: string; whiskers?: boolean; antenna?: boolean;
  squareHead?: boolean; beard?: string; beardFull?: boolean; tie?: string;
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

// ---- キャラ候補10案（選ぶための見本。採用したものを上の CHARS に移す）----
export const CANDIDATES: {id: number; name: string; desc: string; cfg: CharCfg}[] = [
  {id: 1, name: 'ミナ先生', desc: '今の案内役', cfg: CHARS.mina},
  {id: 2, name: 'ハカセ', desc: '白衣＋メガネ＋ひげ', cfg: {skin: '#ffd9b8', skinShade: '#eab68a', hair: '#f0f0f0', hairShade: '#c9c9c9', style: 'short',
    outfit: '#ffffff', outfitShade: '#cdd3dc', pants: '#4a4a55', glasses: true, beard: '#f0f0f0', tie: '#e23d3d'}},
  {id: 3, name: 'ネコ博士', desc: '猫耳＋ひげ', cfg: {skin: '#ffc470', skinShade: '#e09a3a', hair: '#ffc470', hairShade: '#e09a3a', style: 'none',
    outfit: '#8a5bd6', outfitShade: '#6338a8', pants: '#4a4a55', ears: '#ffc470', whiskers: true, scarf: '#ff6b6b'}},
  {id: 4, name: 'ロボのピコ', desc: '四角い頭＋アンテナ', cfg: {skin: '#bfe3f5', skinShade: '#8ec2dd', hair: '#444', hairShade: '#222', style: 'none',
    outfit: '#4aa3df', outfitShade: '#2f78aa', pants: '#6a6a7a', antenna: true, squareHead: true}},
  {id: 5, name: 'お姉さん カナ', desc: 'ポニーテール', cfg: {skin: '#ffd9b8', skinShade: '#eab68a', hair: '#6b3b1e', hairShade: '#44230f', style: 'pony',
    outfit: '#ffd23f', outfitShade: '#d9a90f', pants: '#3a5aa8', headband: '#ff6b9a'}},
  {id: 6, name: '少年 ハル', desc: '青い帽子', cfg: {skin: '#ffd9b8', skinShade: '#eab68a', hair: '#3b2a1c', hairShade: '#21160c', style: 'short',
    outfit: '#ffd23f', outfitShade: '#d9a90f', pants: '#3a5aa8', cap: '#2e6fd8'}},
  {id: 7, name: '女の子 ユイ', desc: 'ツインテール', cfg: {skin: '#ffd9b8', skinShade: '#eab68a', hair: '#2a2a2a', hairShade: '#0e0e0e', style: 'twin',
    outfit: '#ff7aa8', outfitShade: '#d4507f', pants: '#7a5ac8'}},
  {id: 8, name: 'おじいさん ゲン', desc: '白ひげ＋メガネ', cfg: {skin: '#f3cba5', skinShade: '#dba97d', hair: '#f2f2f2', hairShade: '#cfcfcf', style: 'bald',
    outfit: '#37506b', outfitShade: '#223548', pants: '#6b5a45', glasses: true, beard: '#f2f2f2', beardFull: true}},
  {id: 9, name: 'ビジネスマン ケン', desc: 'スーツ＋赤ネクタイ', cfg: {skin: '#ffd9b8', skinShade: '#eab68a', hair: '#1f1f1f', hairShade: '#000', style: 'short',
    outfit: '#2b3a55', outfitShade: '#1b2538', pants: '#2b3a55', tie: '#d93636'}},
  {id: 10, name: 'モモ先生', desc: 'おだんご＋メガネ', cfg: {skin: '#ffd9b8', skinShade: '#eab68a', hair: '#7a4a2a', hairShade: '#4d2c14', style: 'bun',
    outfit: '#7bc67b', outfitShade: '#4f9a4f', pants: '#5a5a66', glasses: true}},
];

// ---- シンプル版10案（影・靴・眉・歯・飾りなし。特徴は1つだけ）----
const base = {skin: '#ffd9b8', skinShade: '#eab68a', pants: '#5a5a66'};
export const SIMPLE_CANDIDATES: {id: number; name: string; desc: string; cfg: CharCfg}[] = [
  {id: 1, name: 'ミナ先生', desc: 'おかっぱ＋赤い帽子', cfg: {...CHARS.mina, scarf: undefined}},
  {id: 2, name: 'ネコ', desc: '猫耳', cfg: {...base, hair: '#ffc470', hairShade: '#e09a3a', skin: '#ffc470', style: 'none', outfit: '#8a5bd6', outfitShade: '#6338a8', ears: '#ffc470'}},
  {id: 3, name: 'ロボ', desc: '四角い頭＋アンテナ', cfg: {...base, skin: '#bfe3f5', hair: '#444', hairShade: '#222', style: 'none', outfit: '#4aa3df', outfitShade: '#2f78aa', antenna: true, squareHead: true}},
  {id: 4, name: 'ポニー', desc: 'ポニーテール', cfg: {...base, hair: '#6b3b1e', hairShade: '#44230f', style: 'pony', outfit: '#ffd23f', outfitShade: '#d9a90f'}},
  {id: 5, name: 'ツイン', desc: 'ツインテール', cfg: {...base, hair: '#2a2a2a', hairShade: '#0e0e0e', style: 'twin', outfit: '#ff7aa8', outfitShade: '#d4507f'}},
  {id: 6, name: 'ボウシ', desc: '青い帽子', cfg: {...base, hair: '#3b2a1c', hairShade: '#21160c', style: 'short', outfit: '#ffd23f', outfitShade: '#d9a90f', cap: '#2e6fd8'}},
  {id: 7, name: 'おだんご', desc: 'おだんご頭', cfg: {...base, hair: '#7a4a2a', hairShade: '#4d2c14', style: 'bun', outfit: '#7bc67b', outfitShade: '#4f9a4f'}},
  {id: 8, name: 'ツンツン', desc: 'オレンジの髪', cfg: {...CHARS.taro}},
  {id: 9, name: 'ふつう', desc: '黒い短髪', cfg: {...base, hair: '#1f1f1f', hairShade: '#000', style: 'short', outfit: '#2b3a55', outfitShade: '#1b2538'}},
  {id: 10, name: 'じいさん', desc: 'つるっと＋白い毛', cfg: {...base, skin: '#f3cba5', hair: '#f2f2f2', hairShade: '#cfcfcf', style: 'bald', outfit: '#37506b', outfitShade: '#223548'}},
];
