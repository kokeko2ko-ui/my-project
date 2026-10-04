const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, ShadingType,
} = require('docx');
const fs = require('fs');

const TITLE = '図書館で借りた本の余白に、知らない誰かの文字があった。「ここが試験に出る」——【実話・感動】';

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
      new TextRun({ text: 'モチーフ：ページをめくる音「パラ……パラ……」＋余白の文字（3回登場）', font: 'Arial', size: 20, color: '555555' }),
    ]
  }),

  h('■ 作品情報'),
  p('ジャンル：無名の献身'),
  p('登場人物：エマ・クラーク（大学院生・28歳）／サラ（書き込みをした先輩）'),
  p('舞台：イギリス・ロンドン大学、2018年〜2023年'),
  p('注記：語り継がれている実話をもとにした物語として構成。', { color: '888888' }),
  blank(),

  // ===== フック =====
  h('◆ フェーズ①：フック（冒頭3〜8秒）'),
  note('BGM：完全無音。ページをめくるSEのみ。薄い紙の音。説明ゼロ。'),
  motif('モチーフ①登場：ページをめくる音'),
  blank(),

  p('パラ……パラ……'),
  blank(),
  p('深夜の図書館。'),
  p('蛍光灯の白い光。'),
  p('山積みの参考書。'),
  blank(),
  p('女性の手が、ある1ページで止まった。'),
  blank(),
  p('余白に、文字があった。'),
  blank(),
  p('鉛筆で、ていねいに書かれた文字。'),
  blank(),
  p('「ここが試験に出る。この定義だけは覚えて」', { bold: true }),
  blank(),
  p('彼女は、その文字を書いた人を知らなかった。'),
  p('名前も、顔も、いつ書かれたのかも。'),
  blank(),
  p('それでも——その文字が、彼女の人生を変えた。', { bold: true }),
  blank(),

  // ===== 背景 =====
  h('◆ フェーズ②：背景（エマの孤独な受験生活）'),
  note('BGM：静かなピアノ。深夜感のある、少し疲れた温度感。'),
  blank(),

  p('2018年、ロンドン大学の大学院。'),
  blank(),
  p('エマ・クラークは、法学部の博士課程に在籍していた。'),
  p('28歳。地方の小さな町の出身で、奨学金だけを頼りにロンドンに来た。'),
  blank(),
  p('周りの学生は、裕福な家庭の出身が多かった。'),
  p('親が弁護士。叔父が判事。'),
  p('そういう人たちが、当然のように席に座っていた。'),
  blank(),
  p('エマには、そういうものが何もなかった。'),
  p('あるのは、田舎の図書館で育てた「本を読む癖」だけだった。'),
  blank(),
  p('大学院の最初の1年は、ただ生き延びることだった。'),
  p('授業についていくために、毎晩図書館に残った。'),
  p('閉館ギリギリまで残って、終電で帰った。'),
  p('友人と呼べる人間は、ほとんどいなかった。'),
  blank(),
  p('そして——1年目の終わりに、関門が待っていた。'),
  blank(),
  p('博士課程の「資格試験」と呼ばれる試験だ。'),
  p('これに落ちると、課程を続けられない。'),
  p('毎年、受験者の半数近くが脱落すると言われていた。'),
  blank(),

  hook('試験まで、あと3日というその夜——エマは限界だった。'),
  blank(),

  // ===== 試練 =====
  h('◆ フェーズ③：試練・選択（余白の文字との出会い）'),
  note('BGM：ピアノが止まる。無音の緊張感。'),
  blank(),

  p('エマは図書館で、最後の一冊を手に取った。'),
  p('「国際条約法の基礎」——分厚い、古い本だった。'),
  p('表紙は擦れ、背表紙はひびが入っていた。'),
  blank(),
  p('読み始めて、すぐに気づいた。'),
  blank(),
  p('余白に、文字がある。'),
  blank(),
  p('鉛筆で書かれた、細かい文字。'),
  p('ページをめくるたびに、現れる。'),
  blank(),
  p('パラ……パラ……', { bold: true }),
  blank(),
  p('「第3章の定義は逐語で覚えること」'),
  p('「この判例は毎年出る。事実関係を押さえろ」'),
  p('「ここは読まなくていい。試験範囲外」'),
  blank(),
  p('誰かが、丁寧に道を作っていた。'),
  blank(),
  p('エマは3時間、その書き込みを追いかけた。'),
  p('指でなぞりながら、ノートに写した。'),
  p('その夜は初めて、「やれるかもしれない」と思えた。'),
  blank(),

  peak('①', '書き込みの夜——「誰が、なぜ」'),
  blank(),

  p('試験当日。'),
  blank(),
  p('問題用紙を開いた瞬間、エマは息を呑んだ。'),
  blank(),
  p('「第3章の定義」が出ていた。'),
  p('あの書き込みが示した判例が出ていた。'),
  p('「ここは読まなくていい」と書かれた箇所は、一問も出ていなかった。'),
  blank(),
  p('ペンが動いた。'),
  blank(),
  p('答案を書きながら、エマは何度も思った。'),
  p('あの文字を書いた人は、誰なのか。'),
  p('なぜ、図書館の本の余白に、こんなものを残したのか。'),
  blank(),
  p('結果が出た。合格だった。'),
  blank(),
  p('エマは図書館に走った。'),
  p('あの本を抱えて、受付に向かった。'),
  p('「この本を、過去に借りた人のリストを見せてもらえますか」'),
  blank(),
  p('司書は困った顔をした。'),
  p('「個人情報になりますので……」'),
  blank(),
  p('エマは頭を下げた。'),
  p('「この書き込みをした人に、お礼が言いたいんです」'),
  blank(),

  hook('でも、司書は首を縦に振らなかった。そして——本当の探索が始まった。'),
  blank(),

  // ===== 真実の発覚 =====
  h('◆ フェーズ④：真実の発覚（探索と、ある事実）'),
  note('BGM：少し希望のある音色。探索のテンポ。ゆっくりと高まる。'),
  blank(),

  p('エマはその日から、別の方法で探し始めた。'),
  blank(),
  p('書き込みの字体を写真に撮り、法学部の掲示板に貼った。'),
  p('「この字に心当たりのある方、連絡をください」'),
  blank(),
  p('反応はなかった。'),
  blank(),
  p('SNSにも投稿した。'),
  p('大学のコミュニティフォーラムにも書いた。'),
  p('「国際条約法の教科書の余白に書き込みをした方を探しています」'),
  blank(),
  p('数週間、何も起きなかった。'),
  blank(),
  p('あきらめかけた頃——一通のメッセージが届いた。'),
  blank(),
  p('差出人は、法学部の卒業生だという。'),
  p('「あなたが探している書き込みは、もしかしたらサラかもしれない」'),
  blank(),
  p('サラ・トンプソン。'),
  p('5年前に同じ課程を修了し、今は地方の法律援助機関で働いているという。'),
  blank(),
  p('エマは震える手で、メッセージを打った。'),
  p('「サラさんに連絡を取る方法を教えてもらえませんか」'),
  blank(),

  peak('②', 'メッセージ——「サラかもしれない」'),
  blank(),

  p('数日後、サラ本人からメッセージが届いた。'),
  blank(),
  p('「あの書き込みのことで連絡をくれたのですね。'),
  p('まさか誰かが気づくとは思っていませんでした」'),
  blank(),
  p('エマは電話を申し込んだ。サラはすぐに承諾した。'),
  blank(),
  p('通話が繋がった瞬間、エマは言葉が出なかった。'),
  p('やっと、声を絞り出した。'),
  blank(),
  p('「あなたの書き込みで、私は試験に合格しました。'),
  p('ずっとお礼が言いたかった。ありがとうございます」'),
  blank(),
  p('電話の向こうで、少し間があった。'),
  blank(),
  p('それからサラは言った。'),
  blank(),

  peak('③', 'サラの言葉——「誰かの役に立てばと思って」'),
  note('BGM：クライマックス。ピアノとストリングスの重なり。'),
  blank(),

  p('「私も、あの試験で一度落ちたんです。', { italic: true, bold: true }),
  p('2回目で合格したとき、自分が苦労したことを誰かに伝えたくて。', { italic: true, bold: true }),
  p('でも、後輩を知らなかった。誰に話せばいいかも分からなかった。', { italic: true, bold: true }),
  blank(),
  p('だから、本に書いた。', { italic: true, bold: true }),
  blank(),
  p('図書館の本なら、いつか誰かが読むと思って。', { italic: true, bold: true }),
  p('その誰かが、少しでも楽になればと思って。', { italic: true, bold: true }),
  p('名前なんて、関係なかった。', { italic: true, bold: true }),
  p('ただ、誰かの役に立てばいいと思っていた」', { italic: true, bold: true }),
  blank(),
  p('エマは、声が出なかった。'),
  blank(),
  p('電話口で、泣いていた。'),
  blank(),
  p('サラが続けた。'),
  blank(),
  p('「あなたが合格したと聞いて——私も報われた気がします。', { italic: true }),
  p('あの夜、本に書いてよかった」', { italic: true }),
  blank(),
  p('——しばらく、二人とも何も言わなかった。', { italic: true, color: '555555' }),
  blank(),

  motif('モチーフ③回収：ページをめくる音'),
  blank(),
  p('その夜、エマはあの本をもう一度開いた。'),
  blank(),
  p('パラ……パラ……', { bold: true }),
  blank(),
  p('見慣れた余白の文字たちが、今は違って見えた。'),
  blank(),
  p('これは、ただのメモではなかった。'),
  blank(),
  p('一度失敗した誰かが、次に来る誰かのために、'),
  p('名前も知らないまま、残していったものだった。', { bold: true }),
  blank(),

  // ===== 余韻・締め =====
  h('◆ フェーズ⑤：余韻・締め・CTA'),
  note('BGM：静かにピアノへ戻る。フェードアウト。'),
  blank(),

  peak('④', '視聴者への問いかけ'),
  blank(),

  p('エマは後に、こう語っている。'),
  blank(),
  p('「サラは私の顔を知らなかった。', { italic: true }),
  p('私の名前も知らなかった。', { italic: true }),
  p('それでも、あの夜の私を助けてくれた。', { italic: true }),
  blank(),
  p('世界には、そういう親切がある。', { italic: true }),
  p('名前のない、顔のない、見返りを求めない親切が」', { italic: true }),
  blank(),
  p('あなたの人生にも、「知らない誰かに助けられた」瞬間はありますか？'),
  blank(),
  p('誰かに席を譲ってもらった。'),
  p('転んだとき、知らない人が手を差し伸べた。'),
  p('道に迷っていたら、声をかけてもらった。'),
  blank(),
  p('その人たちは、あなたのことを今も知らない。'),
  p('でも、あなたの中に、確かに残っている。'),
  blank(),
  p('サラが本に書き込みをしたように——'),
  p('あなたも今日、誰かのための「余白の文字」を残せるかもしれない。', { bold: true }),
  blank(),
  p('あなたの人生で、「名前を知らない誰かに助けられた」経験はありますか？'),
  p('ぜひコメント欄で教えてください。', { bold: true }),
  blank(),
  p('もし「誰かのために何かしたい」と思っている人が身近にいたら、'),
  p('この動画をそっと届けてあげてください。', { bold: true }),
  blank(),
  p('親切は、名前がなくても、ちゃんと届く。'),
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
  fs.writeFileSync('/mnt/user-data/outputs/台本_余白の文字_v1.docx', buf);
  console.log('done');
});
