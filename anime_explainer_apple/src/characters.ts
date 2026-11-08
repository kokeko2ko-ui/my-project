// キャラの見た目はここだけ。髪の色・服の色などを変えるときはこのファイルを編集する。
export type CharCfg = {
  skin: string; skinShade: string;
  hair: string; hairShade: string;
  style: 'bob' | 'spiky' | 'short' | 'long' | 'pony' | 'twin' | 'bun' | 'bald' | 'none';
  outfit: string; outfitShade: string;
  pants: string;
  hat?: string; scarf?: string; glasses?: boolean;
  cap?: string; headband?: string; ears?: string; whiskers?: boolean; antenna?: boolean;
  squareHead?: boolean; beard?: string; beardFull?: boolean; tie?: string; toque?: boolean; buttons?: boolean; tallToque?: boolean;
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

// シンプル版で動画を作るときのキャラ（案内役=ミナ先生、たとえ話=ツンツン、物語の主人公=メガネのふつう）
export const SIMPLE_CHARS: Record<string, CharCfg> = {
  mina: SIMPLE_CANDIDATES[0].cfg,
  taro: SIMPLE_CANDIDATES[7].cfg,
  jobs: {...SIMPLE_CANDIDATES[8].cfg, hair: '#4a3626', hairShade: '#2c1f15', outfit: '#2a2a2e', outfitShade: '#161618', glasses: true},
};

// ---- 配役ライブラリ：絵コンテの cast で「役名 → このキーの人」に差し替える ----
// 役名は mina（案内役）/ taro（たとえ話の主人公）/ jobs（物語の主人公）の3つで固定。見た目だけ入れ替わる。
const sc = (i: number) => SIMPLE_CANDIDATES[i].cfg;
export const CAST_LIB: Record<string, CharCfg> = {
  mina: SIMPLE_CHARS.mina, taro: SIMPLE_CHARS.taro, jobs: SIMPLE_CHARS.jobs,
  neko: sc(1), robo: sc(2), pony: sc(3), twin: sc(4), cap: sc(5), bun: sc(6), spiky: sc(7), futsu: sc(8), jiisan: sc(9),
  // 料理チャンネル向け
  chef_ko: {...base, hair: '#5a3a22', hairShade: '#3a2414', style: 'short', outfit: '#ffffff', outfitShade: '#d6dce6', toque: true, scarf: '#e23d3d'},
  chef_mina: {...base, hair: '#26231f', hairShade: '#0e0d0b', style: 'bob', outfit: '#ffffff', outfitShade: '#d6dce6', toque: true, scarf: '#ffcf2e'},
  // シェフ番組向け：男性シェフ（高いコック帽・白い調理服・口ひげ・赤いスカーフ）と、後輩（白いタオルの鉢巻き・黒いエプロン）
  chef_pro: {...base, hair: '#2a211c', hairShade: '#120d0a', style: 'short', outfit: '#ffffff', outfitShade: '#d6dce6',
    toque: true, tallToque: true, beard: '#3a2a22', scarf: '#d93636', buttons: true},
  kohai: {...base, hair: '#1f1f1f', hairShade: '#000', style: 'spiky', outfit: '#2a2f3a', outfitShade: '#161a22', headband: '#ffffff'},
  obaa: {...base, skin: '#f3cba5', hair: '#e6e6e6', hairShade: '#bdbdbd', style: 'bun', outfit: '#f29aa8', outfitShade: '#c9707f', glasses: true},
};
