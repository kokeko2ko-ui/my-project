const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, ShadingType,
} = require('docx');
const fs = require('fs');

const TITLE = '13年間、11,000kmを泳いで会いに来るペンギン。老漁師との絆の実話——【実話・感動】';

function h(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: '2E4A7A' })]
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 22, bold: opts.bold||false, color: opts.color||'222222', italics: opts.italic||false })]
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
function blank() { return new Paragraph({ spacing: { after: 80 }, children: [new TextRun('')] }); }

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: '感動系YouTube台本（v1）', font: 'Arial', size: 36, bold: true, color: '1A1A2E' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: TITLE, font: 'Arial', size: 22, bold: true, color: '2E4A7A' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E75B6', space: 4 } },
    children: [
      new TextRun({ text: 'モチーフ：波の音「ザァ……ザァ……」＋ペンギンの鳴き声「グァ……」（3回登場）', font: 'Arial', size: 20, color: '555555' }),
    ]
  }),

  h('■ 作品情報'),
  p('ジャンル：動物感動系（動物の知恵・奇跡の行動）'),
  p('登場人物：ジョアン・ペレイラ（老漁師・71歳）／ディンディン（マゼランペンギン）'),
  p('舞台：ブラジル・リオデジャネイロ州・プロカイオス海岸 / アルゼンチン南部'),
  p('注記：実話をもとにした物語として構成。語り継がれている出来事に基づく。', { color: '888888' }),
  blank(),

  // ===== フック =====
  h('◆ フェーズ①：フック（冒頭3〜8秒）'),
  note('BGM：完全無音。まず波の音のSEのみ。次にペンギンの鳴き声が重なる。説明ゼロ。'),
  motif('モチーフ①登場：波＋鳴き声'),
  blank(),

  p('ザァ……ザァ……'),
  blank(),
  p('ブラジルの海岸。朝の光。'),
  p('波打ち際に、一つの影が動いている。'),
  blank(),
  p('グァ……'),
  blank(),
  p('老人は振り返った。'),
  p('そして——息を呑んだ。'),
  blank(),
  p('その生きものは、また来ていた。'),
  p('去年も。一昨年も。そのまた前の年も。'),
  p('海を越えて、また来ていた。', { bold: true }),
  blank(),

  // ===== 背景 =====
  h('◆ フェーズ②：背景（ジョアンの日常と孤独）'),
  note('BGM：静かなアコースティックギター。ブラジルの海の雰囲気。'),
  blank(),

  p('ブラジル、リオデジャネイロ州の南。'),
  p('プロカイオスという小さな漁師町がある。'),
  blank(),
  p('ジョアン・ペレイラは、71歳の老漁師だ。'),
  p('40年以上、この海で魚を取り続けてきた。'),
  p('妻はすでに亡く、子どもたちは町を出て行った。'),
  blank(),
  p('毎朝、夜明け前に起き、舟を出し、夕方に帰る。'),
  p('それが、ジョアンの一日のすべてだった。'),
  blank(),
  p('「海は正直だ。裏切らない」'),
  p('それが口癖だった。'),
  p('人間には、そうはいかないこともあると、彼は知っていたから。'),
  blank(),
  p('2011年のある夏の朝、ジョアンはいつものように海岸を歩いていた。'),
  blank(),

  hook('そこで目にしたものが、彼の残りの人生を変えることになる。'),
  blank(),

  // ===== 試練 =====
  h('◆ フェーズ③：試練・選択（瀕死のペンギンとの出会い）'),
  note('BGM：ギターをやめ、ピアノのみに。緊張感と静けさを両立する。'),
  blank(),

  p('岩の陰に、小さな生きものが倒れていた。'),
  blank(),
  p('マゼランペンギンだった。'),
  p('全身が油で覆われていた。'),
  p('羽は動かず、目だけが、かすかに動いた。'),
  blank(),
  p('石油の流出による汚染——南大西洋ではまれではない。'),
  p('そういう鳥が海岸に打ち上げられることを、ジョアンは何度も見ていた。'),
  p('たいていは、もう助からない。'),
  blank(),
  p('それでも、彼はそのペンギンをそっと抱き上げた。'),
  blank(),
  p('重さは4キロほど。骨の感触が手に伝わった。'),
  blank(),
  p('「生きている」'),
  blank(),
  p('ジョアンは家に連れて帰った。'),
  p('油を丁寧に洗い落とし、小魚を与えた。'),
  p('最初の3日間、ペンギンは食べなかった。'),
  p('4日目、ほんの少し食べた。'),
  p('1週間後、立ち上がった。'),
  blank(),
  p('ジョアンはそのペンギンに、「ディンディン」という名前をつけた。'),
  p('ポルトガル語で、「小さなかわいいやつ」というような意味だ。'),
  blank(),

  peak('①', '回復——「ディンディンが立った」'),
  blank(),

  p('回復には、1ヶ月近くかかった。'),
  blank(),
  p('その間、ディンディンはジョアンの後をついて歩いた。'),
  p('庭を歩けば、後ろからよたよたとついてくる。'),
  p('椅子に座れば、足元に来て丸まる。'),
  p('夜、ジョアンがウトウトすると、膝の上に乗ってきた。'),
  blank(),
  p('「こいつは俺を家族だと思っているのかもしれない」'),
  p('ジョアンは、笑いながらそう語ったという。'),
  blank(),
  p('ある朝、ジョアンはディンディンを海岸に連れていった。'),
  p('「もう帰れ。お前の場所は、海だ」'),
  blank(),
  p('ディンディンは海に入った。'),
  p('波に乗り、沖へ向かった。'),
  p('振り返ることなく、水平線の向こうに消えていった。'),
  blank(),
  p('ジョアンは、しばらくその場に立っていた。'),
  p('波の音だけが残った。'),
  blank(),
  p('ザァ……ザァ……', { bold: true }),
  blank(),

  hook('それから1年後——ジョアンが信じられないものを見たのは、その同じ海岸だった。'),
  blank(),

  // ===== 真実の発覚 =====
  h('◆ フェーズ④：真実の発覚（再会、そして13年間）'),
  note('BGM：静寂から始まり、ゆっくりとストリングスが高まる。感動のクライマックスへ。'),
  blank(),

  p('2012年の夏、ジョアンはいつものように朝の海岸を歩いていた。'),
  blank(),
  p('すると——足元に何かが来た。'),
  blank(),
  p('グァ……', { bold: true }),
  blank(),
  p('振り返ると、一羽のペンギンが彼を見上げていた。'),
  blank(),
  p('「ディンディン……？」'),
  blank(),
  p('ペンギンはジョアンに近づき、くちばしで彼の足をつついた。'),
  p('それから、羽を広げ——ジョアンの足に、頭をすりつけた。'),
  blank(),
  p('ジョアンは、その場にしゃがみ込んだ。'),
  blank(),
  p('「こいつは……本物のディンディンだ」'),
  blank(),

  peak('②', '再会——「本物のディンディンだ」'),
  blank(),

  p('ディンディンは4ヶ月間、ジョアンのそばで過ごした。'),
  p('そして再び、海へ帰った。'),
  blank(),
  p('翌年、また来た。'),
  p('その翌年も、また来た。'),
  blank(),
  p('研究者たちの調査によると、マゼランペンギンの繁殖地はアルゼンチン南部だという。'),
  p('ブラジルのこの海岸との距離は、およそ11,000キロメートル。'),
  blank(),
  p('ディンディンは毎年、その距離を泳いでジョアンのもとへ来ていると、'),
  p('語り継がれている出来事として、研究者たちも注目している。'),
  blank(),
  p('「なぜこのペンギンがここへ来るのか、正確にはわからない」'),
  p('ブラジルの生物学者はそう述べながらも、こう付け加えた。'),
  blank(),
  p('「ただ、このペンギンがジョアンを見つけると行動が変わることは、', { italic: true }),
  p('間違いなく観察できる。あれは、愛着と呼ぶしかない」', { italic: true }),
  blank(),

  peak('③', '13年間——愛着と呼ぶしかない'),
  note('BGM：クライマックス。フルオーケストラ、または波音とピアノの重ね。'),
  blank(),

  p('それから13年が経った。'),
  blank(),
  p('ディンディンは今年も来た。'),
  p('ジョアンの足元に来て、羽をすりつけた。'),
  blank(),
  p('84歳になったジョアンは、腰を曲げてディンディンの頭をそっと撫でながら言った。'),
  blank(),
  p('「こいつが来ると、孫に会ったような気持ちになる。', { italic: true, bold: true }),
  p('俺のことを愛してくれているんだと思う。', { italic: true, bold: true }),
  p('俺もこいつを愛している」', { italic: true, bold: true }),
  blank(),
  p('記者が聞いた。'),
  p('「ペンギンがなぜ来るのかについて、どう思いますか」'),
  blank(),
  p('ジョアンは少し間を置いて答えた。'),
  blank(),
  p('「わからない。だが——', { italic: true }),
  p('助けた命が、また会いに来てくれた。', { italic: true }),
  p('それだけで、俺には十分だ」', { italic: true, bold: true }),
  blank(),
  p('——しばらく、波の音だけが続いた。', { italic: true, color: '555555' }),
  blank(),

  motif('モチーフ③回収：波＋鳴き声'),
  blank(),
  p('ザァ……ザァ……'),
  blank(),
  p('グァ……'),
  blank(),
  p('ブラジルの海岸。夕暮れの光。'),
  p('老人と、一羽のペンギンが、並んで波を見ていた。'),
  blank(),

  // ===== 余韻・締め =====
  h('◆ フェーズ⑤：余韻・締め・CTA'),
  note('BGM：静かにピアノへ戻る。波の音を薄く重ねる。フェードアウト。'),
  blank(),

  peak('④', '視聴者への問いかけ'),
  blank(),

  p('なぜディンディンは来るのか。'),
  p('科学はまだ、完全な答えを持っていない。'),
  blank(),
  p('でも、ジョアンはこう言う。'),
  p('「油まみれで死にかけていた命を、誰かが拾ってくれた。', { italic: true }),
  p('それを、この鳥は忘れていない」', { italic: true }),
  blank(),
  p('人間は、言葉で「ありがとう」と言う。'),
  p('ペンギンには、言葉がない。'),
  blank(),
  p('だから、11,000キロを泳ぐ。'),
  blank(),
  p('それが、ディンディンの「ありがとう」だ。', { bold: true }),
  blank(),
  p('あなたの人生に、「助けてくれた誰か」はいますか？'),
  p('ぜひコメント欄で教えてください。', { bold: true }),
  blank(),
  p('もし、「誰かのために何かしたい」と思っている人が身近にいたら、'),
  p('この動画をそっと届けてあげてください。', { bold: true }),
  blank(),
  p('言葉のない「ありがとう」が、世界には溢れているかもしれません。'),
  blank(),

  new Paragraph({
    spacing: { before: 200, after: 80 },
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: '2E4A7A', space: 4 } },
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
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '2E4A7A' },
        paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 } },
    ]
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/台本_ペンギンと老漁師_v1.docx', buf);
  console.log('done');
});
