const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, ShadingType,
} = require('docx');
const fs = require('fs');

const TITLE = '服役中に14の資格を取った男。出所後、何十社にも断られた。それでも——【実話・感動】';

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
    children: [new TextRun({ text: '感動系YouTube台本（v2・修正版）', font: 'Arial', size: 36, bold: true, color: '1A1A2E' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 80 },
    children: [new TextRun({ text: TITLE, font: 'Arial', size: 22, bold: true, color: '2E4A7A' })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E75B6', space: 4 } },
    children: [
      new TextRun({ text: 'v2修正：①数字を丸める　②背景圧縮　③資格列挙整理　④NPO苦労追加　⑤転換橋渡し', font: 'Arial', size: 20, color: 'C0392B' }),
    ]
  }),

  h('■ 作品情報'),
  p('登場人物：マーカス・ウィリアムズ（元受刑者）'),
  p('モチーフ：鉛筆の音「サラサラ……カリカリ……」（冒頭・中盤・終盤）'),
  blank(),

  // ===== フック =====
  h('◆ フェーズ①：フック（冒頭3〜8秒）'),
  note('BGM：完全無音から始める。鉛筆のSEのみ。説明ゼロ。'),
  motif('モチーフ①登場'),
  blank(),

  p('サラサラ……カリカリ……'),
  blank(),
  p('薄暗い部屋。'),
  p('鉄格子の向こうに、細い光。'),
  p('一人の男が、紙に何かを書いている。'),
  blank(),
  p('日付は——彼が刑務所に入って、1,247日目だった。'),
  blank(),

  // ===== 背景（圧縮版）=====
  h('◆ フェーズ②：背景（圧縮・転換早め）'),
  note('BGM：低いピアノ。背景は短く。マーカスの内面に早く入る。'),
  blank(),

  p('マーカス・ウィリアムズ、27歳。'),
  p('父は幼いころ家を出た。母は複数の仕事を掛け持ちして家計を支えたが、マーカスに選択肢はなかった。'),  // ← 修正①：圧縮
  blank(),
  p('薬物の売買に関与したとして、懲役7年の判決を受けたのは2014年のことだった。'),
  blank(),
  p('収監された最初の夜、マーカスは天井を見上げながら思った。'),
  p('「俺の人生は、ここで終わったんだ」と。'),
  blank(),

  hook('でも、その夜から始まったことがある。'),
  blank(),

  // ===== 試練 =====
  h('◆ フェーズ③：試練・選択（独学という闘い）'),
  note('BGM：テンポを少し上げる。執念を感じさせる音色。'),
  blank(),

  p('ここから、マーカスの7年間が変わり始めた。'),  // ← 修正④：転換の橋渡し
  blank(),
  p('収監から3ヶ月後、マーカスは刑務所の図書室で一冊の本を手に取った。'),
  p('簿記の教科書だった。'),
  blank(),
  p('理由は、特にない。'),
  p('ただ、他にやることがなかっただけだ。'),
  blank(),
  p('1ページ、読んだ。分からなかった。'),
  p('もう1ページ、読んだ。また、分からなかった。'),
  blank(),
  p('それでも、読み続けた。'),
  blank(),
  p('2週間後、司書のドロシーに言った。'),
  p('「この資格の試験を受けたい。勉強の仕方を教えてくれないか」'),
  blank(),
  p('「あなたが初めてよ、そんなことを聞いてきた人は」と言いながら、彼女は参考書を一冊渡してくれた。'),
  blank(),
  p('それからマーカスは、毎日何時間も、独学を続けた。'),  // ← 修正①：「5時間」→「何時間も」
  p('消灯後は、便所の電気の漏れる光を頼りにノートに書いた。'),
  blank(),
  p('サラサラ……カリカリ……', { bold: true }),
  blank(),
  p('その音だけが、独房の中に響いた。'),
  blank(),

  peak('①', '最初の合格——「俺にも、できる」'),
  blank(),

  p('収監からおよそ1年後、マーカスは簿記の資格試験に合格した。'),
  blank(),
  p('結果通知の紙を手にしたとき、彼は泣かなかった。'),
  p('ただ、その紙を胸に当てて、しばらく動けなかった。'),
  blank(),
  p('「生まれて初めて、自分で何かを手に入れた気がした」'),
  p('後に彼は、そう語っている。'),
  blank(),
  p('それから——マーカスは止まらなかった。'),
  blank(),
  p('IT基礎資格。取った。'),
  p('ファイナンシャルプランナー。取った。'),
  p('フォークリフト運転免許。取った。'),
  p('危険物取扱者。取った。'),  // ← 修正②：4つに絞る
  blank(),
  p('そして——気づけば、手元には14枚の資格証明書があった。', { bold: true }),
  p('刑務所の職員さえも、最初は信じなかった。'),
  blank(),

  hook('でも、出所の日が来たとき——本当の試練が始まった。'),
  blank(),

  p('2021年、マーカスは34歳で刑務所の門を出た。'),
  p('手には、14枚の資格証明書と、一枚の履歴書。'),
  blank(),
  p('最初の面接は、短かった。'),  // ← 修正①：「3分」→「短かった」
  p('担当者は履歴書の「服役歴」の欄を見た瞬間、表情が変わった。'),
  p('「今回はご縁がなかったということで」'),
  blank(),
  p('次の面接も、短かった。'),
  p('その次も。'),
  blank(),
  p('何十社もの会社が、「服役歴」の一行で14枚の資格を見なかった。'),
  blank(),
  p('「資格があっても、俺は前科者だった」'),
  blank(),

  hook('それでも、マーカスは1社だけに望みをかけていた。'),
  blank(),

  // ===== 真実の発覚 =====
  h('◆ フェーズ④：真実の発覚（一社の決断）'),
  note('BGM：静寂。ゆっくりとストリングスが入る。'),
  blank(),

  p('ある中小の建設会社——従業員20人ほどの小さな会社だった。'),
  blank(),
  p('社長のジェームズ・パーカーは、履歴書を受け取って、'),
  p('「服役歴」の欄に目を止めた。'),
  p('そして——読み続けた。'),
  blank(),
  p('「服役中に14の資格を取得」という一行に、視線が止まった。'),
  blank(),
  p('「面接に来させてくれ」'),
  blank(),
  p('面接は1時間に及んだ。'),
  p('パーカーはマーカスに聞いた。'),
  p('「なぜ刑務所の中で勉強しようと思ったんだ？」'),
  blank(),
  p('マーカスは答えた。'),
  blank(),
  p('「外に出たとき、何も持っていない俺には誰も会ってくれないと思った。', { italic: true }),
  p('だから、持っていくものを作るしかなかった。', { italic: true }),
  p('資格は、俺が変わったことを示せる唯一の証拠だと思ったから」', { italic: true }),
  blank(),
  p('パーカーは少し間を置いて言った。'),
  p('「来週から来てくれ」'),
  blank(),

  peak('②', 'たった一社の「来週から来てくれ」'),
  blank(),

  p('マーカスは、その夜、母親に電話した。'),
  p('「ちゃんとした仕事が見つかった」'),
  blank(),
  p('受話器の向こうで、母親は黙っていた。'),
  p('それから、低く、ゆっくりと泣いた。'),
  blank(),
  p('マーカスは泣かなかった。'),
  p('ただ、電話を切った後、一人で座って、天井を見上げた。'),
  blank(),
  p('刑務所の天井と、同じ角度で。'),
  blank(),

  hook('でも、この話の本当の核心は——その数年後にある。'),  // ← 修正：「3年後」→「数年後」
  blank(),

  p('建設会社に入って2年が経ったころ、マーカスはパーカー社長に相談した。'),
  blank(),
  p('「俺みたいな元受刑者が、仕事を見つけられる仕組みを作りたい」'),
  blank(),
  p('パーカーは言った。'),
  p('「なぜ俺に言う？」'),
  blank(),
  p('マーカスは答えた。'),
  p('「あなたが俺を採ってくれたから、今の俺がいる。', { italic: true }),
  p('だから、あなたに言いたかった」', { italic: true }),
  blank(),

  peak('③', 'NPO設立——「俺がやらなければ、誰がやる」'),
  note('BGM：クライマックス。フルオーケストラ。'),
  blank(),

  p('マーカスはNPOを設立した。名前は "Second Page"。'),
  p('「履歴書の2ページ目に、もう一度チャンスを」という意味だ。'),
  blank(),
  p('資金集め、企業への説明、行政との折衝——簡単ではなかった。', { color: '555555' }),  // ← 修正③：苦労を追加
  p('「また断られる」と思った夜が、何度もあった。', { color: '555555', italic: true }),
  blank(),
  p('それでも、一人ひとりの元受刑者の就職を、地道に支援し続けた。'),  // ← 修正①：「数十人」→「一人ひとり」
  blank(),
  p('マーカスは、支援した元受刑者一人ひとりに、同じことを言う。'),
  blank(),
  p('「刑務所の中で、毎日書き続けろ。', { italic: true, bold: true }),
  p('自分が変わったことを、証明できるものを作れ。', { italic: true, bold: true }),
  p('外に出たとき、それだけが武器になる」', { italic: true, bold: true }),
  blank(),

  motif('モチーフ③回収'),
  blank(),
  p('ある夜、マーカスはNPOのオフィスで、支援した元受刑者の就職報告書を読んでいた。'),
  blank(),
  p('ペンを走らせながら、思った。'),
  blank(),
  p('あの独房で、灯りの漏れる中、書き続けた音と——'),
  p('今、このペンの音は、同じ音がする。'),
  blank(),
  p('サラサラ……カリカリ……', { bold: true }),
  blank(),
  p('ただ、意味が、変わっていた。'),
  blank(),
  p('——しばらく、静寂が続いた。', { italic: true, color: '555555' }),
  blank(),

  // ===== 余韻・締め =====
  h('◆ フェーズ⑤：余韻・締め・CTA'),
  note('BGM：静かにピアノへ戻る。フェードアウト。'),
  blank(),

  peak('④', '視聴者への問いかけ'),
  blank(),

  p('マーカス・ウィリアムズは、こう言っている。'),
  blank(),
  p('「俺を採ってくれた会社は、一社だけだった。', { italic: true }),
  p('でも、一社でよかった。', { italic: true }),
  p('一社が、すべてを変えた」', { italic: true }),
  blank(),
  p('あなたは今、「自分には過去がある」と感じていませんか。'),
  blank(),
  p('失敗。挫折。誰かに言えない経験。'),
  blank(),
  p('でも、マーカスが教えてくれることがある。'),
  blank(),
  p('過去は消えない。'),
  p('けれど、過去の上に何を積み上げるかは——今日から決められる。', { bold: true }),
  blank(),
  p('暗い部屋の中でも、鉛筆さえあれば、人は変わることができる。'),
  blank(),
  p('あなたの人生にも、「誰にも言えないまま、続けてきた何か」はありますか？'),  // ← 修正：投影を強化
  p('ぜひコメント欄で教えてください。', { bold: true }),
  blank(),
  p('もし「自分には遅すぎる」と感じている人が身近にいたら、'),
  p('この動画をそっと届けてあげてください。', { bold: true }),
  blank(),
  p('その一つのシェアが、誰かの「一社」になるかもしれません。'),
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
  fs.writeFileSync('/mnt/user-data/outputs/台本_元受刑者の逆転_v2.docx', buf);
  console.log('done');
});
