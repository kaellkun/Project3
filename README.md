# Project3

## 素早さ比例ATB・行動順

[LinearTimeBattle](js/plugins/LinearTimeBattle.js) を有効化しています。
素早さ200対100なら「200側→200側→100側」の頻度で行動し、
味方の歩行グラフィック・敵画像（Ａ/Ｂ付き）による小さな行動順予測を戦闘画面に表示します。
設定・例外・互換性は [ATBの説明](docs/linear-time-battle.md) を参照してください。

## 村の東側の装備

ワールドマップの村の東側に、既存のキラキラと同じ接触式・一度限りの拾得イベントを配置しています。

- (172, 122)：さざ波の杖（武器205）。MAT+50（固定値）、装備中は「全体魔法攻撃（弱）」（スキル237）が使用可能。
  敵全体にMAT×1倍の魔法属性攻撃、MP25、1回攻撃です。
- (173, 123)：忍び足の靴（防具208）。誰かが装備中はパーティ全体のランダムエンカウント歩数+2（重複なし）。
  控えのメンバーの装備も対象で、所持しているだけでは効果はありません。

[EquipmentEncounterSteps](js/plugins/EquipmentEncounterSteps.js) を
[LL_EncounterAdjust](js/plugins/Encount/LL_EncounterAdjust.js) より下で有効化しています。
装備のメモ欄の `<EncounterStepPlusTwo>` で判定し、従来の歩数抽選後に2を加算します。
現在のカウントも次の一歩で差分補正するため、付け外しで残り歩数をリセット・累積できません。
既存セーブにも適用され、茂み・エンカウント半減・乗り物・エンカウント無効の仕様は維持します。

## 麻痺

[ParalysisActionChance](js/plugins/State/ParalysisActionChance.js) により、
麻痺（ステート9）は常時行動不能ではなく、敵味方とも各行動が30%の確率で不発になります。
判定は実行直前の1回だけで、入力・ATB充填・行動順予測では抽選しません。
不発時はその行動機会を消費しますが、MP・TP・アイテムは消費しません。
複数回行動は各行動ごとに判定し、連続攻撃は技全体で1回だけ判定します。
イベントの強制行動・反撃・追撃は従来通りです。
付与率、持続時間（1〜5T）、重ね掛け時のターン蓄積、回避低下は維持します。
既存セーブ内の麻痺にも適用されます。
ステート再変換時もステート9の制約「なし」と30%不発の説明を維持してください。

## ヘルプウィンドウ

[HelpWindowThreeLines](js/plugins/HelpWindowThreeLines.js) を有効化しています。
ヘルプは3行分の高さで統一し、プラグイン管理の「ヘルプ文字サイズ倍率（%）」で
ヘルプ内だけ文字を縮小できます（初期値85%、100%で縮小なし）。
戦闘中の「Xキー：戻る」などの操作説明はヘルプ本文ではなく左下の専用領域に表示します。
スキル・アイテム・敵の一覧は操作説明の上までとし、表示が重ならないようにしています。
行間隔・アイコンサイズは維持し、メッセージや一覧などの文字サイズは変更しません。
ゲーム内オプションではなく、制作側のプラグインパラメータです。
プロフィール、セーブ/ロード案内、スキル習得画面にも適用されます。
UIプラグインより下に配置してください。文章は手動改行で3行以内に収めてください。

## メッセージ表示位置の一括指定

[MessageWindowPosition](js/plugins/Message/MessageWindowPosition.js) を有効化しています。
イベントの「プラグインコマンド」で「メッセージ表示位置の一括指定」を選び、
「すべて上」「すべて下」「イベントコマンドの設定を採用」を指定できます。
以降の「文章の表示」の上・中・下指定を上書きし、「イベントコマンドの設定を採用」で固定を解除します。
イベント終了時にも自動解除され、別イベントや並列イベントには影響しません。
呼び出したコモンイベントには設定を引き継ぎますが、呼び出し先での変更は呼び出し元に影響しません。
実行中のセーブから再開した場合も、イベント終了まで設定を維持します。
顔グラフィック・背景・名前や選択肢の左右位置は変更しません。

## スマホで更新が反映されない場合

[キャッシュ再読み込みページ](clear-cache.html) を開くと、セーブデータを残してゲームを読み直します。
起動時のキャッシュ回避の対象と公開先の注意点は [ブラウザーキャッシュの説明](docs/browser-cache.md) を参照してください。

## スマホ縦画面のカメラ

[VerticalDisplayFullscreen](js/plugins/VerticalDisplayFullscreen.js) は
[Keke_FreeCamera](js/plugins/HUG/Map/Keke_FreeCamera.js) より下に配置してください。
スマホ縦画面のマップ拡大率とイベントのカメラズーム倍率を組み合わせ、
注視位置・マップ端のスクロール制限・タップ位置を同じ倍率で計算します。
「ずらしX/Y」はPCと同じマップ上のピクセル単位で、動作時間も変更しません。
縦画面の拡大表示は維持するため、PCと見える範囲や画面上の移動距離は異なりますが、
ズーム時にも指定したキャラを画面中央に注視します（マップ端では表示範囲内に制限）。

## シールドブレイク

敵のシールドブレイクと弱点表示UIを導入しています。DBタグなしでも動作します。
設定方法は [シールドブレイクの説明](docs/shield-break-system.md) を参照してください。

## 実績の編集

実績とカテゴリは [外部JSONデータ](data/Achievements.json)で編集できます。サンプル実績5件を登録済みです。
項目の説明とイベントからの獲得方法は [実績データの編集手順](docs/achievement-external-data.md) を参照してください。

## Copyright and License Notice

Copyright (c) 2026 kaellkun.

The original game content created for this project, including original text,
events, configuration, and the `MobileTouchControls` and `LicenseNotice`
plugins, is copyright kaellkun unless otherwise noted.

## RPG Maker MZ

This game is made with RPG Maker MZ version 1.10.0. The RPG Maker MZ runtime,
default plugins, and any included RPG Maker MZ sample or default assets remain
the property of their respective rights holders. Their use and redistribution
are subject to the RPG Maker MZ license and terms of use. This repository does
not grant rights to redistribute third-party game assets separately.

## Enabled Plugins

- MobileTouchControls.js: Copyright (c) 2026 kaellkun.
- Keke_SpeedStarBattle.js: Copyright (c) 2021 ケケー. Released under the MIT License. https://opensource.org/licenses/mit-license.php
- LicenseNotice.js: Copyright (c) 2026 kaellkun.
- MainFontLetterSpacing.js: Copyright (c) 2026 kaellkun.

The project folder also includes the RPG Maker MZ default plugins
`AltMenuScreen`, `AltSaveScreen`, `ButtonPicture`, and `TextPicture`, authored
by Yoji Ojima. They are not enabled in the current plugin configuration.

## Runtime Libraries

- PixiJS 5.3.12: MIT License. https://pixijs.com/
- pako: MIT License. https://github.com/nodeca/pako
- localForage 1.7.3: Apache License 2.0. https://localforage.github.io/localForage/
- Effekseer for WebGL 1.70b: MIT License. https://github.com/effekseer/EffekseerForWebGL
- vorbisdecoder.js 1.0.1: based on stb_vorbis. See the source file for its
  bundled attribution and license details.

## Third-Party Assets

Audio, images, fonts, movies, and other assets in this project may have
separate copyright and license terms. Use, modification, and redistribution of
those assets require confirmation of the applicable rights and licenses.

### Enemy Material

This project uses enemy material assets from the following site:

- Author: 氏家まさら
- Site name: 素材屋『氏』
- URL: https://uzi-material.com/
- Source: https://uzi-material.com/service/

The enemy materials are incorporated into this game as part of the project
assets and are used in accordance with the rights and terms of the source site.

### Senobi Gothic

The Senobi Gothic font files in `fonts/` are distributed by MODI (MODI工房),
version 1.00, dated 2017-07-02. Senobi Gothic is based on M+ FONTS and includes
the M+ OUTLINE FONTS glyphs. The font is provided under the terms stated in the
font's accompanying readme and the M+ OUTLINE FONTS terms:

- MODI: http://modi.jpn.org/
- M+ OUTLINE FONTS: http://mplus-fonts.sourceforge.jp/

The Senobi Gothic author requests that the font be used at the user's own
responsibility. The original font readme should be retained with any separate
redistribution of the font files.
