# ResistRateDisplay — 選択した行動の耐性プレビュー

作者: **Project3** / v1.0.0

## 導入・登録

- 本体: [ResistRateDisplay.js](../js/plugins/Battle/Info/ResistRateDisplay.js)
- テスト: [resist-rate-display.test.cjs](../tests/resist-rate-display.test.cjs)
- プラグイン管理で **Battle/Info/ResistRateDisplay** をONにする。
- **すべての戦闘プラグインより後**に配置する。特に `Keke_ElementFullCustom`、`NUUN_AddStateDeviation`、`FlexibleTopDownUI`、`HelpWindowThreeLines`、`LinearTimeBattle`、`BattleCommandHierarchy` の後。準備効果などを追加した場合もその後に置く。
- 旧 `SPD_ResistRateDisplay` は不要。同時に有効にしない。旧ファイルを削除しても本プラグインは動作する。
- パラメータ、プラグインコマンド、必要なメモタグ、手動の `elementList` は **なし**。既存セーブで使用できる。
- この実装では登録ファイルや既存JS・データを編集していない。統合作業で次の1件を末尾に追加する。

```json
{"name":"Battle/Info/ResistRateDisplay","status":true,"description":"選択対象の属性倍率・命中後の付与判定率（Project3）","parameters":{}}
```

RPGツクールMZを開いたまま外部で登録を変更した場合は、MZで保存する前にプロジェクトを開き直すこと。

## UIと開示方針

敵／味方の**対象選択中だけ**、選択カーソルの対象に対する現在のスキル／アイテムの情報を2行で表示する。

1. 属性倍率・分類・今回の属性名
2. 実際の使用効果に含まれる状態付与／弱体の命中後判定率。該当効果がなければ倍率表示の注意文

現在の行動の実効倍率を最初から開示する仕様であり、旧SPDの「一度攻撃してから判明」「討伐数で全開示」は継承しない。無関係な属性・ステートの弱点一覧は表示しない。ShieldBreakSystem等の未知弱点記録も読み書きしない。現在の行動の属性名と倍率から、未判明の弱点を推測できることは意図した開示となる。

状態・装備・選択対象・行動・対象一覧が変化した場合は次のシーン更新で再計算。敵が倒れた後の対象一覧更新にも追従する。キャンセル、決定、入力終了時にはパネルを隠す。スキル一覧のホバーだけでは表示しない。全体・ランダム・使用者対象など、標準処理で対象選択画面を開かない行動では表示しない。

### 配置と操作

- `skillWindowRect()` の上端、LinearTimeBattleのタイムライン**下**に80pxを確保。
- 敵リストは上端を80px下げて高さを減らす。リストの列数、行高、スクロール処理、ヒットテストは変更しない。
- 味方リストは既存の下部ステータス位置を維持。HP/MP、顔画像、タッチ領域を上書きしない。
- パネルは非選択の `Window_Base`。キー・タッチ・キャンセルを処理しない。既存の対象ウィンドウと階層コマンドのハンドラーを保持する。
- 20pxの独立したsans-serifフォントを使用。幅を測って長文を `…` で省略する。複数効果は先頭から表示し、隠れた効果を自動ページ送りしない。APIでは全件取得可能。
- パネル＋最低1行の敵リストを確保できない低い画面では、パネルを表示せず元の敵リスト矩形を維持。元UIの低解像度での行切れ自体は修正しない。
- 味方対象ウィンドウとパネルが重なる別レイアウトでも、覆い隠さずパネルを非表示にする。
- PC、狭幅縦画面、VerticalDisplayFullscreenの内部幅808pxの縦画面を想定。既存UIの画面サイズ決定方針は変更しない。

## 属性倍率の意味

計算元は**現在インストールされている** `Game_Action.prototype.calcElementRate`。実行予定のアクションではなく、毎回独立したプレビューに対して呼ぶ。MZの `elementsMaxRate` を独自に呼んで代用しない。

| 値 | HP/MPダメージ・HP/MP吸収技 | HP/MP回復技 |
|---|---|---|
| 100%超 | 弱点 | 回復増幅 |
| 100% | 等倍 | 回復等倍 |
| 0%超100%未満 | 耐性 | 回復減衰 |
| 0% | 無効 | 回復無効 |
| 負数 | 吸収（負の倍率） | 回復反転 |

ダメージタイプ0（なし）では属性倍率を出さず、状態付与等だけを表示。タイプ1～6すべて対応。回復技を敵へ使う場合でも「敵の弱点」とは表記しない。タイプ5/6の「使用者へのHP/MP吸収」と、対象の負の属性倍率による「吸収」は別の概念。

### Keke_ElementFullCustom

- 追加属性、通常攻撃属性 `-1`、属性なし `0`、スキルタイプ指定、重複排除はインストール済みKekeの処理を使う。
- 属性名一覧は `getAllElementsKe(preview)`、未導入時はMZの属性指定から取得。名前はデータベースの属性表を参照。
- 現在のKeke設定は「合算」「特徴にも適用」。例えば特徴の150%と50%を合算するケースは75%。独自に最大値150%へ置き換えない。
- Kekeで追加属性タグがない通常攻撃は、インストール版がMZの最大値計算へ委譲する。その挙動もそのまま表示。
- Kekeのスキル別「複数属性」メモはダメージ式側の補正に使われ、特徴倍率はインストール版のグローバル設定を使う。プレビュー独自の「修正」はしない。

**重要:** Kekeの「属性威力」「属性耐性」メモによる固定加減算、乗算、反転 `r` は `evalDamageFormula` 側の処理であり、この倍率とは別。該当タグが特徴オブジェクトにある場合は `※式補正別` を付けるが、その最終量・反転結果は予測しない。例えば `r` タグだけで回復する相手を、この倍率欄だけで「吸収」と判定することはない。

この表示は**属性倍率**であり、最終ダメージでも対象の素の耐性表でもない。計算式、PDR/MDR、回復効果率、クリティカル、分散、防御、準備効果／被ダメージ補正、HP吸収上限、反射、身代わり等は含まない。

## 状態付与・弱体の表示

メモ指定ではなく、行動の `effects` を読む。対応は `EFFECT_ADD_STATE` と `EFFECT_ADD_DEBUFF`。

- 表示の主数値は **命中後、各効果1件・1回についての現在の付与判定率**。技自体の命中・回避・成功率を掛けた最終成功率ではない。
- 括弧の `耐性倍率50%` は `stateRate`／`debuffRate` の倍率であり、付与確率50%という意味ではない。
- 通常ステート: 基礎付与率 × 適用される耐性倍率 × 適用される運補正。
- 攻撃時ステート（ID0）: `subject.attackStates()` に展開し、各 `attackStatesRate(id)` も掛ける。ID0を架空のステートとして表示しない。
- MZ単体の必中通常ステートは耐性・運を無視するが、攻撃時ステートは適用する。
- `NUUN_AddStateDeviation` 導入時はその `isAddNormalStateMode`／`certainState`／`noLukState` を参照し、敵対モード、全対象モード、`NoLukState`／`NoLukStateSkill`、`CertainState`／`CertainStateSkill`／`AddCertainState` を反映。タグを単に検出して常時無視する実装ではない。
- ステート完全無効／現在付与不可は0%。NUUNの耐性無視でもMZの完全無効を無視するわけではない。
- 弱体: `debuffRate(id) × lukEffectRate(target)`。`effect.value1` は継続ターンであり確率として掛けない。NUUNのNoLukステートタグは弱体に流用しない。死亡／既に最大弱体段階では追加不可。
- 確率は0～100%に丸めて範囲制限。耐性倍率の方は100%超など元の値を保持。

状態解除・HP/MP回復など他の使用効果は付与率欄の対象外。複数効果／繰り返しの合算成功率や、前の効果で状態・生死が変わった後の次の効果まではシミュレートしない。

## 純粋性・互換性の境界

- アクション、`Game_Item`、ネストしたフラグ、対象、使用者の保持データを、プロトタイプと循環参照を維持してコピーする。単なる浅いコピーではない。
- プレビューの `subject()`／`item()` はコピーを返す。グローバル経由で元のアクションに戻ることを防ぐ。
- インストール版Kekeの `calcElementRate`／`getAllElementsKe` 自体は読み取り経路。`_elementResultKeElfc` を書くのは別の `apply`／ダメージ式経路であり、それらは呼ばない。
- `evalDamageFormula`、`makeDamageValue`、`apply`、ステート／弱体付与メソッド、乱数、行動生成、変数・スイッチ操作、保存を一切呼ばない。
- 対象選択中は選択対象1体だけ毎フレーム再評価。表示文字列が変わらなければビットマップは描き直さない。全敵×全属性の走査はしない。
- 計算が例外や非有限倍率を返した場合は、前の結果を残さず「プレビュー不可」。選択・決定・戻るはそのまま利用できる。

任意の未知プラグインが読み取りメソッド内でグローバルを書き換える／乱数を使う場合まで隔離するJavaScriptサンドボックスではない。保証対象は検証した現行MZ/Keke/NUUN計算経路。今後 `calcElementRate`、特徴参照、付与判定の仕様を別プラグインで変更した場合は再検証すること。

## 公開API／ブラウザープローブ

グローバル名前空間は `Project3ResistRateDisplay`。次の呼び出しは登録・ロード後に使用する。

```js
const scene = SceneManager._scene;
const action = BattleManager.inputtingAction();
const target = scene._enemyWindow.active
    ? scene._enemyWindow.enemy()
    : scene._actorWindow.actor(scene._actorWindow.index());
Project3ResistRateDisplay.describe(action, target);
```

`describe` の返却値:

- `valid`, `itemId`, `damageType`
- `element`: `rate`, `percent`, `label`, `recovery`, `ids`, `names`, `formulaModifiersExcluded`, `text`。属性ダメージなしは `null`。
- `effects`: 全効果の `kind`, `effectIndex`, `id`, `name`, `rate`, `luck`, `blocked`, `chance`, `text`。ステートはさらに `attack`, `usesResistance`, `immune`。
- `lines`: 省略前の表示文2行。空入力は `valid:false`、空配列。計算エラー時は `error` 文字列も返す。

`rate`／`chance` の1は100%。返却データはゲームオブジェクトを共有しない。

その他:

- `Project3ResistRateDisplay.elementIds()` — データベースの有効な属性の `{id,name}` 一覧。**対象の耐性値は取得しない**。
- `Project3ResistRateDisplay.panelRect(scene)` — 予定矩形。高さ0なら表示スペース不足。
- `scene.updateResistRateDisplay()` — 現在の選択からUIを即時同期。
- `scene._resistRateWindow.visible`／`_description` — 表示状態と省略前の結果。非表示時の `_description` は `null`。
- `scene._enemyWindow.itemRect(i)`／`hitTest(x,y)`、`scene._actorWindow.itemRect(i)` — 既存のタッチ領域を検査可能。

UIだけを一時ロードするブラウザー検証では、**戦闘シーン生成前**に本プラグインを読み込む。生成済みシーンへの後付けでは矩形／パネルが再生成されないため、別の戦闘シーンに入り直す。テスト中の保存を無効にした隔離プロファイルを使い、ユーザーの進行中セーブでは実験しない。

## 検証

```sh
node --check js/plugins/Battle/Info/ResistRateDisplay.js
node --check tests/resist-rate-display.test.cjs
node --test tests/resist-rate-display.test.cjs
git diff --check
```

専用22テスト: 実MZオブジェクト／実Keke全文／実NUUN全文／実ウィンドウ・シーン／FlexibleTopDownUI／HelpWindowThreeLines／LinearTimeBattle／BattleCommandHierarchyを読み込む。描画基盤・画像・音声はヘッドレス境界として代替し、対象選択・行矩形・タッチ・キャンセルの実装は実物を使う。

検証内容: 全ダメージタイプ、0/-1属性、複数・重複属性、合算・平均・最大、NoLuk／必中／完全無効、ID0展開、状態付与・弱体、アイテム、ネストしたフラグの隔離、RNG・式・効果適用の禁止、対象更新、アクション変更、階層へのキャンセル復帰、スプライトからのタッチ転送、例外／NaN、PC・縦・低い画面のレイアウト。

全プラグインを読み込んだ隔離Chromeでも、敵選択の実表示、ゲーム状態不変、敵／味方の実タッチ選択とキャンセル復帰を確認。データベースの実スキル値・初期装備に依存しない一時スキルをメモリ上に作って検証し、データ・セーブには書き込まない。