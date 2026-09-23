# 行動目標のメニュー表示

## 設定

- 本体: [DestinationExternalData.js](../js/plugins/Menu/DestinationExternalData.js)
- 行動目標の内容とID: [NUUN_Destination.js](../js/plugins/Menu/NUUN_Destination.js)
- 登録: [plugins.js](../js/plugins.js) のBattleEquipCommandより後。NUUN_Destination必須、FlexibleTopDownUIの後に置く。
- パラメータ: `FontSize=24`（12〜48）。

行動目標の登録・変更・解除はNUUN_Destinationの既存仕様を使用します。追加のJSONファイルは読み込みません。保存値と既存セーブとの互換性も同プラグインに委ねます。

### プラグインコマンド

`NUUN_Destination:SetDestination` または `Menu/DestinationExternalData:SetDestination` を使用します。解除は `Menu/DestinationExternalData:ClearDestination` です。この表示プラグインは専用のメニューコマンドを追加しません。

### スクリプト

- `$gameSystem.getDestinationList()` / `Window_Base.getDestinationList()`: NUUN_Destinationが返す現在のテキスト。
- `window.Window_MenuDestination`: 公開ウィンドウクラス。`Scene_Menu._destinationWindow` が表示インスタンス。

## 表示

- メニュー画面のみ、所持金の上に全幅表示します。マップ・戦闘・セーブ画面の新規UIは追加しません。
- 見出し「行動目標」と本文1行を常に表示します。長い本文は表示領域内で折り返し、後半を省略します。
- 本文は入力フォーカスを持ちません。ホイール、タッチドラッグ、上下キー、ページ操作による専用スクロールはありません。
- `\V[n]`、`\N[n]`、`\P[n]`、`\G` を展開し、`\C[n]` と `\I[n]` を描画します。
- FlexibleTopDownUIがある場合は同プラグインのレイアウト後にステータス下部を確保します。標準UIでもコマンドや所持金に重ならないよう配置します。

## 検証

[専用テスト](../tests/destination-external-data.test.cjs) は、追加のJSONファイルを読み込まないこと、NUUN設定を表示に使うこと、1行常設表示、専用メニューコマンドとスクロール操作を追加しないことを検証します。

ゲーム上ではRPGツクールMZのテストプレイでメニューを開いて確認してください。目標の変更はNUUN_Destinationの設定または既存のプラグインコマンドで行います。
