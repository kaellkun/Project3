# 外部JSON行動目標とメニュー表示

## 設定とデータ

- 本体: [DestinationExternalData.js](../js/plugins/Menu/DestinationExternalData.js)
- 編集対象: [Destinations.json](../data/Destinations.json)
- 登録: [plugins.js](../js/plugins.js) のBattleEquipCommandより後。NUUN_Destination必須、FlexibleTopDownUIの後に置く。
- パラメータ: `DataFile=Destinations.json`（data以下の相対JSON名）、`FontSize=24`（12〜48）、`VisibleLines=2`（本文の表示行数、1〜8）。

ルートの必須項目は `initialId` と `destinations`。各エントリの必須項目は `id` と `text`。

- `id`: 1〜9007199254740991の重複しない整数。配列位置ではなく固定IDで検索する。文字列IDや小数は不可。
- `text`: 文字列、または文字列の行配列（改行で結合）。空文字・空配列も許可し、パネルでは「未設定」と表示する。
- `initialId`: 0、または登録済みID。新規 `Game_System.initialize()` にだけ適用する。既定値0なので既存進行を自動で変更しない。
- ルートと各エントリには任意の `$comment` を置ける。内容の型は問わず実行時には無視する。それ以外の追加項目はタイプミス検出のためエラー。
- 空の `destinations` 配列は有効。その場合 `initialId` は0にする。
- UTF-8 BOM対応。JSONのコメント構文（`//` など）は使えない。編集後はゲームを再起動し、デプロイにもJSONを含める。

既存NUUNパラメータの5件を、空白も維持してID1〜5へ移植済み。本体パラメータは変更せず残しているが、実行時の参照先は外部JSONになる。公開済みIDの再利用・別の意味への変更は避ける。

## API・既存セーブとの互換性

### プラグインコマンド

`DestinationExternalData` と `Menu/DestinationExternalData` の両名で登録する。

- `SetDestination`: 引数 `id` に固定IDを指定。0は解除。
- `ClearDestination`: 引数なし。IDを0にする。

本体の `NUUN_Destination:SetDestination` も継続使用できる。MZのイベントコマンド357向けに `Menu/NUUN_Destination:SetDestination` も登録する。正しい入力は元の本体ハンドラーへ渡す。

空文字・小数・負数・NaN・Infinity・安全な整数の範囲外はエラー。コマンドの文字列IDには10進数字を使用し、指数表記は許可しない。未登録でも有効な整数なら設定でき、削除IDと同じ警告表示になる。

### スクリプト

- `$gameSystem.setDestinationId(id)`: 数値の非負safe integerを設定。不正値は保存値を変更せず例外。
- `$gameSystem.getDestinationId()`: NUUNの既存実装を維持。旧セーブで未設定なら0。
- `$gameSystem.getDestinationList()` / `Window_Base.getDestinationList()`: 現在の外部テキスト。ID0なら `null`。未登録IDなら `未登録の行動目標（ID:...）`。
- `window.$dataDestinationExternal`: 読み込み前は `null`、読み込み後は `{ initialId, destinations, byId }`。`byId` は正規化済み固定ID辞書。
- `window.Window_MenuDestination`: 公開ウィンドウクラス。`Scene_Menu._destinationWindow` が表示インスタンス。

保存フィールドは既存の `_destinationId` のみ。`DataManager.extractSaveContents` は変更しない。既存IDをJSONから削除しても保存値は破棄せず、同じIDを復元すれば再びテキストが表示される。旧セーブへのロード時に `initialId` を適用しない。

## 読み込みとエラー

AchievementExternalDataと同じ独立ロード方式を使用する。`DataManager.loadDatabase` から `loadDataFile` を呼び、標準のキャッシュ対策・XHR・通信エラー再試行を利用する。`_databaseFiles` には追加しないため、通常・戦闘テスト・イベントテストで同じJSONを読み込む（`Test_` を付けない）。

外部データだけを `onXhrLoad` で処理し、他データのコールバックは元へ渡す。404・ネットワーク失敗は標準のRetry対象。JSON/schema不正は非同期コールバックでthrowせず、ファイル名と項目位置を付けたエラーを起動ループの `isDatabaseLoaded` からthrowする。不正なデータで起動を続行しない。

## 表示と操作

- メニュー画面のみ、所持金の上に全幅表示。マップ・戦闘・セーブ画面の新規UIは追加しない。
- 見出し「行動目標」＋本文。既定は32px行高×3行＋上下paddingで120px。
- FlexibleTopDownUIの `relayoutMenuWindows` を先に呼び、その結果からステータス下部を確保する。create後にも再適用し、リサイズ時も元の配置から計算するため二重縮小しない。
- 縦が狭い場合はパネルを縮め、通常はステータス96pxを優先する。両方を確保できない極端な画面は残り領域で分配し、paddingすら収まらない場合はパネルを隠す。実用的な高さの画面で利用すること。
- 仲間一覧は顔画像と3行分のステータスが入る最低行高を確保する。表示領域を4等分して文字を重ねず、入りきらない仲間は標準の一覧スクロールで閲覧・選択する。
- 独自UIなしでは標準のstatus rectを基準に、所持金を下端の全幅にし、コマンドもパネルへ重ならないよう縮める。
- パネル上のホイール／タッチドラッグは非activeでも操作可能。ドラッグがコマンド領域まで出ても親コマンドへ入力を渡さない。
- メニューの「行動目標」を決定すると読み取りフォーカスへ移る。上下で行単位、Q/W（pageup/pagedown）でページ単位。Esc/Xなどの取消でコマンドに戻る。標準のタッチ取消（右クリック・2本指タップ）にも対応する。選択カーソルは表示しない。
- 見出しも本文と一緒にスクロールする。最終行まで到達でき、内容の長さに比例した巨大bitmapは作らない。bitmapは表示領域＋1行のみ。通常更新・スクロール・変数変更では再割り当てしない。
- `\V[n]`、`\N[n]`、`\P[n]`、`\G` をエンジンで展開し、`\C[n]` と `\I[n]` を描画する。JSON内ではバックスラッシュを2個で記述する。変数・名前等の展開結果が変わったときだけ折返しを再計算し、先頭へ戻す。
- 和文・スペースなしの長語を文字単位で折り返す（禁則処理・単語単位の整形は行わない）。MainFontLetterSpacingの `textWidth` を連続文字列として実測し、負の字間を考慮する。括弧等のインクはみ出し用に左右1emを確保する。極端に幅広い単一文字は縮小する。
- 指定外の制御コードによる文字サイズ変更・スクリプト実行等は対応しない。複雑な絵文字合字・RTLの高度な組版は対象外。

## 検証

[専用テスト](../tests/destination-external-data.test.cjs) はNode標準テストで49件成功。実エンジンのDataManager、PluginManager、Game_System、NUUN本体、ウィンドウ／メニューのプロトタイプを利用し、Canvas・PIXI・HTTP等の外部サービスだけをヘッドレス代替する。

対象: 通常／battle／eventテストロード、BOM、404／ネットワークRetry、schemaと重複、空データ、削除／並べ替えID、元コマンド／full path、保存復元、初期ID、登録と実JSON、4画面サイズ、再レイアウト、標準UI fallback、折返しと最終行、制御文字、負の字間、独立スクロールとフォーカス。

独自文字間描画にはNRP_MessageShadowとの互換対応を追加しています。フォント・登録・メニュー・ステータス詳細・戦闘装備・キャッシュ・ヘルプ・ATBの回帰テストと併せて検証します。

隔離したheadless Chromeでも実プラグイン構成でタイトル起動・JSON5件・メニューを確認。808×616のUI領域でパネル120px、ステータスとの重なりなし、長文36行の末尾スクロール、コマンド互換、フォーカス往復、再レイアウト後の高さ保持を確認した。統合ブラウザー接続はタイムアウトしたためChrome DevTools Protocolで代替。実機の指操作や目視のフォント品質は別途確認が必要。

## ブラウザーで確認するには

RPGツクールMZのテストプレイ、またはプロジェクトルートを静的HTTP配信して確認できます。ニューゲームまたは既存セーブからメニューを開くと、未設定なら「未設定」、イベントで設定済みなら該当目標が表示されます。ブラウザーでは単純なファイルURLではなくHTTP経由で開いてください。

RPGツクールMZを起動したまま外部から登録を追加すると、エディターが古い設定で上書きする場合がある。**MZで保存する前にプロジェクトを開き直し、末尾のアドオン登録を確認すること。**