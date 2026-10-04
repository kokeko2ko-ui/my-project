const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, ShadingType, WidthType,
} = require('docx');
const fs = require('fs');

const TITLE = '余命半年で書いた小説は誰にも読まれなかった。30年後、娘が出版すると——【実話・感動】';

function h(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: '2E4A7A' })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({
      text,
      font: 'Arial',
      size: 22,
      bold: opts.bold || false,
      color: opts.color || '222222',
      italics: opts.italic || false,
    })]
  });
}

function note(text) {
  return new Paragraph({
    spacing: { after: 120, before: 80 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'E07B39', space: 8 } },
    indent: { left: 240 },
    children: [new TextRun({ text: '【演出メモ】' + text, font: 'Arial', size: 20, color: 'E07B39', italics: true })]
  });
}

function hook(text) {
  return new Paragraph({
    spacing: { after: 120, before: 80 },
    shading: { fill: 'FFF3E0', type: ShadingType.CLEAR },
    children: [new TextRun({ text: '🔒 離脱防止フック｜' + text, font: 'Arial', size: 20, bold: true, color: 'C0392B' })]
  });
}

function peak(num, text) {
  return new Paragraph({
    spacing: { after: 120, before: 80 },
    shading: { fill: 'E8F4FD', type: ShadingType.CLEAR },
    children: [new TextRun({ text: `💡 感情ピーク${num}｜${text}`, font: 'Arial', size: 20, bold: true, color: '1A6FA8' })]
  });
}

function motif(text) {
  return new Paragraph({
    spacing: { after: 120, before: 80 },
    shading: { fill: 'F0F7E8', type: ShadingType.CLEAR },
    children: [new TextRun({ text: '🎵 モチーフ｜' + text, font: 'Arial', size: 20, bold: true, color: '2E7A2E' })]
  });
}

function blank() {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun('')] });
}

const children = [
  // ヘッダー
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: '感動系YouTube台本 v2（修正版）', font: 'Arial', size: 36, bold: true, color: '1A1A2E' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: TITLE, font: 'Arial', size: 22, bold: true, color: '2E4A7A' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E75B6', space: 4 } },
    children: [
      new TextRun({ text: 'バイラルスコア目標：150点　', font: 'Arial', size: 20, bold: true, color: 'C0392B' }),
      new TextRun({ text: 'ver.2（信憑性強化・間の調整済み）', font: 'Arial', size: 20, color: '555555' }),
    ]
  }),

  h('■ 作品情報'),
  p('モチーフ：タイプライターの音「カタカタカタカタ——チン」（冒頭・中盤・終盤の3回登場）', { bold: true }),
  p('登場人物：マーガレット・コリンズ（作家・母）／クレア・コリンズ（娘）'),
  p('舞台：1987年〜2021年、アメリカ・ルイジアナ州'),
  p('修正点：①数字を丸め信憑性を強化　②心理ブリッジ追加　③沈黙の間を挿入', { color: 'C0392B' }),
  blank(),

  // ===== フック =====
  h('◆ フェーズ①：フック（冒頭3〜8秒）'),
  note('BGM：ピアノのみ。極めて静かに。タイプライターのSEを先行させる。'),
  motif('モチーフ①登場'),
  blank(),

  p('カタカタカタカタ——チン。'),
  blank(),
  p('古い木製の机。'),
  p('薄暗い部屋。'),
  p('窓の外、雨が降っている。'),
  blank(),
  p('一枚の紙が、ゆっくりと床に落ちた。'),
  blank(),

  // ===== 背景（圧縮・テンポ改善版）=====
  h('◆ フェーズ②：背景'),
  note('BGM：穏やかなストリングス。v2では背景を圧縮し、ギャップを早めに提示。'),
  blank(),

  p('1987年、アメリカ・ルイジアナ州バトンルージュ。'),
  blank(),
  p('マーガレット・コリンズ、42歳。'),
  p('夢があった。小説を書いて、出版すること。ただ、それだけだった。'),
  blank(),
  p('17歳で初めて書いた。図書館の司書に「あなたの言葉は特別だ」と言われ、それだけで書き続けた。'),
  p('大学で文学を専攻し、卒業論文で最優秀賞を取った。'),
  p('けれど出版社への投稿は、毎回「お見送り」で戻ってきた。'),
  blank(),
  p('それでも、朝5時に起きてコーヒーを一杯いれ、タイプライターの前に座り続けた。'),
  p('夫のトムは黙って支えた。娘のクレアは、その背中を見て育った。'),
  blank(),
  p('朝起きると、台所からコーヒーの匂いと、タイプライターの音がした。'),
  blank(),
  p('カタカタカタカタ——チン。', { bold: true }),
  blank(),
  p('その音が、クレアにとっての「おはよう」だった。'),
  blank(),

  hook('でも、その音がある日——突然止まった。'),
  blank(),

  // ===== 試練 =====
  h('◆ フェーズ③：試練・選択'),
  note('BGM：ピアノのみ。テンポを落とす。'),
  blank(),

  p('1989年、秋。精密検査の結果は、膵臓がん。ステージ4。'),
  blank(),
  p('医師は静かな声で言った。'),
  p('「残された時間は、半年から1年です」', { italic: true }),
  blank(),
  p('その夜、マーガレットはトムに話した。9歳の娘には、まだ言えなかった。'),
  blank(),
  p('翌朝、マーガレットはいつもより早く起きた。'),
  p('コーヒーを一杯いれて、タイプライターの前に座った。'),
  blank(),
  p('カタカタカタカタ——チン。', { bold: true }),
  blank(),
  p('「書かなければ」'),
  blank(),
  p('彼女には、まだ書き終えていない小説があった。'),
  p('5年間、少しずつ書き続けてきた作品。'),
  p('南部の小さな町で生きた3世代の女性たちの物語。'),
  p('誰も知らない、名もなき女性たちの、誇り高い生の記録。'),
  blank(),
  p('余命を告げられてから、マーガレットは1日も休まず書いた。'),
  p('体が動く日は8時間。動かない日も、ベッドの上でノートに手書きした。'),
  blank(),
  p('「ママ、また書いてるの？」', { italic: true }),
  p('「そう。もうすぐ終わるから」', { italic: true }),
  blank(),

  peak('①', '完成と断絶——原稿が完成した夜'),
  note('BGM：一瞬無音。低いチェロ。'),
  blank(),

  p('原稿が完成したのは、診断から7ヶ月後のことだった。'),
  blank(),
  p('タイピングを終えた夜、マーガレットはトムに電話をかけた。'),
  p('「書き終えたよ」', { italic: true }),
  p('受話器の向こうで、トムが泣いていた。'),
  blank(),
  p('翌日から、マーガレットは出版社への売り込みを始めた。'),
  p('何十社もの出版社に、原稿を送り続けた。'),  // ← 修正①：数字を丸める
  blank(),
  p('返ってくるのは、いつも断りの手紙だった。'),
  blank(),
  p('「丁寧な文章ですが、現在のトレンドに合いません」', { italic: true }),
  blank(),
  p('そして、また。', { color: '888888' }),
  p('また。', { color: '888888' }),
  p('また。', { color: '888888' }),  // ← 修正：断り状3連続→1つ＋短文連打
  blank(),
  p('断られるたびに、マーガレットは次の封筒に宛名を書いた。'),
  p('体はどんどん弱っていったが、手は動かし続けた。'),
  blank(),

  hook('でも、マーガレットが知らなかったことがある。彼女が書き続けたもう一つの理由が——後になって、娘の口から語られることになる。'),
  blank(),

  p('クレアが10歳になった春、マーガレットはとうとう娘に本当のことを話した。'),
  p('「ママね、病気なんだ。重い病気。だから、あまり長くいられないかもしれない」'),
  blank(),
  p('クレアは、泣かなかった。'),
  p('ただ、母の手をぎゅっと握った。'),
  p('「ママの本、絶対に売れるよ」', { italic: true, bold: true }),
  blank(),
  p('マーガレットは笑った。'),
  p('「そうだね。絶対に売れる」'),
  blank(),
  p('その言葉を信じていた。'),
  p('ただ、時間が足りなかった。'),
  blank(),
  p('1990年8月14日。'),
  blank(),
  p('マーガレット・コリンズは、44歳で息を引き取った。'),
  p('出版されることのなかった原稿は、段ボール箱に入れられ、'),
  p('クレアの部屋のクローゼットにしまわれた。'),
  blank(),
  p('トムは、その箱を捨てることができなかった。'),
  p('クレアも、開けることができなかった。'),
  blank(),
  p('カタカタカタカタ——チン。', { bold: true }),
  blank(),
  p('その音は、もう二度と聞こえなかった。'),
  blank(),

  hook('でも30年後——あの段ボール箱が、世界を動かすことになる。'),
  blank(),

  // ===== 真実の発覚 =====
  h('◆ フェーズ④：真実の発覚（30年後の奇跡）'),
  note('BGM：静寂から始め、徐々にストリングスが高まる。'),
  blank(),

  p('2020年。クレア・コリンズは、40歳になっていた。'),
  p('離婚を経験し、仕事も変わり、人生の岐路に立っていた。'),
  p('コロナ禍で、長らく足の遠のいていた実家に戻ることになった。'),
  blank(),
  p('片づけをしていたある夜、クローゼットの奥にある段ボール箱を見つけた。'),
  p('30年間、誰も開けていなかった箱。'),
  blank(),
  p('手が震えた。'),
  p('その夜は、開けられなかった。'),
  blank(),
  p('翌日も。その次の日も。'),  // ← 修正②：心理ブリッジ追加
  blank(),
  p('一週間後、クレアはようやく蓋を開けた。'),
  p('黄ばんだ紙の束が出てきた。インクの匂いがした。そして、母の文字があった。'),
  blank(),
  p('最初の1ページを読んだ。'),
  p('2ページ、3ページ。'),
  p('気がつけば夜が明けていた。'),
  blank(),
  p('「これは——すごい」', { bold: true }),
  blank(),
  p('クレアは泣いていた。'),
  p('それは悲しみからではなかった。'),
  p('もっと別の、言葉にならない感情だった。'),
  blank(),
  p('「なんで。なんでこれが世に出なかったの」'),
  blank(),
  p('彼女はそこから数ヶ月、原稿を抱えたまま動けなかった。'),  // ← 修正②
  p('読み返すたびに泣いた。行動に移す勇気が、なかなか出なかった。'),
  blank(),
  p('それでも、ある日、動き出した。'),
  p('原稿をスキャンしてデジタル化し、文芸エージェントに連絡し始めた。'),
  blank(),
  p('最初の反応は冷たかった。'),
  p('「故人の原稿では権利関係が複雑で……」', { italic: true, color: '888888' }),
  p('「市場のニーズと合うかどうか……」', { italic: true, color: '888888' }),
  blank(),
  p('でもクレアは止まらなかった。'),
  p('母が止まらなかったように。'),
  blank(),
  p('数十社に連絡し続けた末に——ある小さな独立系出版社が、原稿を読んでくれた。'),  // ← 修正①
  blank(),
  p('編集者のサラは、原稿を受け取ったその夜に読み終え、翌朝クレアに電話をかけた。'),
  p('「これを今まで誰も出版しなかったことが、信じられない」', { italic: true, bold: true }),
  blank(),

  peak('②', '出版——世界がようやく「気づいた」瞬間'),
  blank(),

  p('2021年3月。'),
  p('マーガレット・コリンズの遺作——'),
  p('"The Women Who Carried the Sun"（太陽を運んだ女たちへ）が刊行された。', { bold: true }),
  blank(),
  p('初版は5,000部だった。3日で完売した。'),
  blank(),
  p('書評家たちは絶賛した。'),
  p('「この数十年で読んだ中で最も美しい文章だ」', { italic: true }),
  p('「なぜ今まで出版されなかったのか、理解できない」', { italic: true }),
  blank(),
  p('ある書評家は、原稿を読み終えた夜、自分の母親に電話したという。'),  // ← 修正：唯一性
  p('「ただ、ありがとうと言いたかった」と、後に語った。'),
  blank(),
  p('口コミがSNSに広がり、世界中で読まれた。'),
  p('40ヶ国語に翻訳され、今もなお各国で増刷が続いている。', { bold: true }),  // ← 修正①：800万部→質的表現主軸
  blank(),
  p('マーガレットが息を引き取った30年後——'),
  p('彼女の言葉は、ようやく世界に届いた。'),
  blank(),

  peak('③', '娘の言葉——「母が正しかったと証明できた」'),
  note('BGM：クライマックス。フルオーケストラ。'),
  blank(),

  p('クレアは、インタビューでこう語った。'),
  blank(),
  p('「母は余命を告げられてから、一日も書くことをやめませんでした。', { italic: true }),
  p('なぜそこまで書き続けられたのか、子どもの頃は分からなかった。', { italic: true }),
  p('でも今は分かります。', { italic: true }),
  p('母は、届かなくてもいいと思っていたんじゃないかと思う。', { italic: true }),
  blank(),
  p('書くことそのものが、母の命だったから」', { italic: true, bold: true }),
  blank(),
  p('記者が聞いた。'),
  p('「この成功を、お母さんに見せてあげたかったですか？」'),
  blank(),
  p('クレアは少し間を置いて、答えた。'),
  blank(),
  p('「見せたかった、というより——証明できた、と思っています。', { bold: true }),
  p('母が正しかったと。', { bold: true }),
  p('あの小説は本物だったと。', { bold: true }),
  p('誰も認めてくれなくても、母は正しかったと。', { bold: true }),
  p('それを証明できたことが、私にとっての一番の喜びです」', { bold: true }),
  blank(),
  p('インタビュアーは、言葉を失った。'),
  blank(),
  p('——しばらく、沈黙が続いた。', { italic: true, color: '555555' }),  // ← 修正③：沈黙の間
  blank(),

  motif('モチーフ③回収'),
  blank(),
  p('その夜、クレアは夢を見た。'),
  p('薄暗い部屋。雨の匂い。遠くから、聞こえてきた。'),
  blank(),
  p('カタカタカタカタ——チン。', { bold: true }),
  blank(),
  p('母は、まだ書いていた。'),
  blank(),

  // ===== 余韻・締め =====
  h('◆ フェーズ⑤：余韻・締め・CTA'),
  note('BGM：静かに落とす。ピアノに戻る。フェードアウト。'),
  blank(),

  peak('④', '視聴者への問いかけ'),
  blank(),

  p('あなたは今、誰かに「それは無理だ」と言われていませんか。'),
  blank(),
  p('「センスがない」「市場に向いていない」「時代遅れだ」——'),
  blank(),
  p('でも、マーガレットは知っていた。'),
  p('本物は、いつか必ず届く。'),
  p('それがたとえ、自分が生きている間でなくても。'),
  blank(),
  p('彼女がタイプライターを叩き続けた理由は、名声ではなかった。'),
  p('承認でも、お金でもなかった。'),
  blank(),
  p('ただ、書かずにはいられなかったから。'),
  p('それだけだった。', { bold: true }),
  blank(),
  p('そして30年後——'),
  p('その「ただ書かずにいられなかった」言葉が、'),
  p('世界中の人々の心を動かした。', { bold: true }),
  blank(),
  p('世界が認めなくても、続けることに意味がある。'),
  p('マーガレット・コリンズの人生が、そう教えてくれています。'),
  blank(),
  p('あなたの周りにも、今日も静かに書き続けている人がいるかもしれません。'),  // ← 修正：50代主婦向け投影
  blank(),

  p('あなたの人生で「諦めなくてよかった」と思った瞬間はありますか？'),
  p('ぜひコメント欄で教えてください。', { bold: true }),
  blank(),

  p('もし身近に「夢を諦めかけている人」がいたら、'),
  p('この動画をそっと送ってあげてください。', { bold: true }),
  blank(),

  p('この話を知って欲しい人が、あなたの周りにきっといるはずです。'),
  blank(),

  new Paragraph({
    spacing: { before: 200, after: 80 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: '2E4A7A', space: 4 },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E4A7A', space: 4 },
    },
    children: [new TextRun({ text: 'このチャンネルでは、忙しい毎日の中で忘れかけている「大切なこと」をお届けしています。', font: 'Arial', size: 22, bold: true, color: '2E4A7A' })]
  }),
  new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: 'チャンネル登録とベルマークで、次の話もあなたのもとに届けます。', font: 'Arial', size: 22, bold: true, color: '2E4A7A' })]
  }),
  new Paragraph({
    spacing: { after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E4A7A', space: 4 } },
    children: [new TextRun({ text: 'それではまた、心に響くお話でお会いしましょう。', font: 'Arial', size: 22, bold: true, color: '2E4A7A' })]
  }),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '2E4A7A' },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 }
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/台本_余命半年の遺稿_v2.docx', buf);
  console.log('docx v2 saved');
});
