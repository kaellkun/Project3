# Project3

## ヘルプウィンドウ

[HelpWindowThreeLines](js/plugins/HelpWindowThreeLines.js) を有効化しています。
ヘルプは3行分の高さで統一し、プラグイン管理の「ヘルプ文字サイズ倍率（%）」で
ヘルプ内だけ文字を縮小できます（初期値85%、100%で縮小なし）。
行間隔・アイコンサイズは維持し、メッセージや一覧などの文字サイズは変更しません。
ゲーム内オプションではなく、制作側のプラグインパラメータです。
プロフィール、セーブ/ロード案内、スキル習得画面にも適用されます。
UIプラグインより下に配置してください。文章は手動改行で3行以内に収めてください。

## スマホで更新が反映されない場合

[キャッシュ再読み込みページ](clear-cache.html) を開くと、セーブデータを残してゲームを読み直します。
起動時のキャッシュ回避の対象と公開先の注意点は [ブラウザーキャッシュの説明](docs/browser-cache.md) を参照してください。

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
