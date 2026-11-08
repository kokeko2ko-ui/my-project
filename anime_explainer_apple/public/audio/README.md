# 音の素材（BGM・効果音）

`python3 tools/make_audio.py` で、ElevenLabs（効果音・音楽）から作った素材。音量はそろえてある（効果音=最大 -3dB、BGM=平均 -26dB）。
動画側（`src/Video.tsx`）で、音量を下げて混ぜる。絵コンテの `"audio": {"bgm": "bgm_cooking.mp3", "bgmVolume": 0.26, "se": true}` で有効になる。

| ファイル | 内容 | 鳴らす場面（`buildCues`） |
|---|---|---|
| bgm_cooking.mp3 | 軽快なアコースティックジャズ（約170秒・声なし） | 全体。声が出ている間は30%小さく。最初と最後にフェード |
| se_pop.mp3 | ポンという軽い音 | 材料・手順・コツ・比較・クイズ・食べ物のカードが出るとき |
| se_kira.mp3 | キラッという音 | 最初のカット、コツのパネルが増えたとき、最後の登録帯 |
| se_boing.mp3 | ボヨンという反応音 | 反応の文字（「マジっすか!?」など）が出るとき |
| se_correct.mp3 | 正解のチャイム | クイズの「せいかい!」 |
| se_sizzle.mp3 | ジューという調理音 | フライパンの場面（くり返し） |
| se_whoosh.mp3 | 場面切り替えの音（今は未使用） | — |

- 著作権・利用条件：ElevenLabs で生成した音。商用利用や公開の条件は、**ElevenLabs の契約プランの規約を確認すること**（私は確認していない）。
- ジャンルが変わったら、`tools/make_audio.py` の BGM プロンプトを変えて作り直す（`--force`）。
- Gemini に音のバランスを聞ける：`python3 tools/gemini_video.py <動画> --prompt "声が聞き取りやすいか、BGMの大きさ、効果音は…"`（私は音を聞けない）。
