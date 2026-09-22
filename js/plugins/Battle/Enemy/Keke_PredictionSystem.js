//=============================================================================
// Keke_PredictionSystem - 行動予測システム
// バージョン: 1.3.5
//=============================================================================
// Copyright (c) 2023 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 敵の行動&ターゲット先行表示システム
 * @author ケケー
 * @url https://kekeelabo.com
 * 
 * @help
 * 【ver.1.3.5】
 * 敵キャラの次の行動とターゲットを表示するシステム
 * ターン制&タイムプログレス両対応
 *
 * ● 使い方 ●
 * 
 * ■【最初にやること】ターゲットラインの調整
 * 　バトルのレイアウトに応じてターゲットラインの位置と方向を調整する
 * ◎ターゲットラインとは行動者からターゲットに向けて伸び、
 * 　誰がターゲットなのか示すラインのこと
 * ◎調整はプラグインパラメータで行う
 * ◎一例として、左が敵、右が味方のサイドビュー画面向けに調整してみる
 * 　そのままやってみてほしい
 * [1]プラグインパラメータ → 『ライン-進行方向』　を「右」にする
 * 　ラインは敵から味方に向けて伸びるもの
 * 　そして敵が左側、味方が右側なので「右」に向かって伸ばす
 * [2]プラグインパラメータ → 『ライン-終点』
 * 　『終点-方向(味方)』を「左」にする
 * 　ラインが味方グラの左側に向かって伸びるようになる
 * [3]以上。バトルを「サイドビュー」にしてテストしてみる
 * 
 *
 * ■【設定1】行動予測を手動で発動するようにする
 * [1]プラグインパラメータ → 『常に行動予測』　を「false」にする
 * 　行動予測が自動で発動しないようになる
 * [2]データベースのメモ欄orスイッチを使って行動予測をオンにする。詳細は後述
 * 
 * 
 * ■【設定2】行動ビュー/ターゲットラインを無効化
 * 　デフォルトでは行動とターゲットの両方が表示されるが、
 * 　どちらか片方だけにしたい場合に
 * ◎行動表示を無効化
 * 　プラグインパラメータ → 『行動表示』　を「false」
 * ◎ターゲット表示を無効化
 * 　プラグインパラメータ → 『ターゲット表示』　を「false」
 * 
 * 
 * ■【設定3】行動ビューの見た目をカスタマイズ
 * 　プラグインパラメータ → 『行動ビュー』
 * ◎色々と設定項目が並んでいるが、好きにいじってよい
 * 
 * 
 * ■【設定4】ターゲットラインの見た目をカスタマイズ
 * 　プラグインパラメータ → 『ターゲットライン』
 * ◎色々と設定項目が並んでいるが、好きにいじってよい
 * 
 * 
 * ■【機能1】データベースのメモ欄で行動予測の設定変更
 * 　行動予測の設定を動的に変更できる
 * 　・敵毎に行動ビューの位置をずらす
 * 　・行動ビューに表示される名前を指定
 * 　・行動予測を動的にオンオフ
 * 　といった機能がある
 * ◎アクター、職業、スキル、アイテム、武器、防具、敵キャラ、ステートのメモ欄に
 * 　<行動予測:  x:  y:  dire:  name:  icon:  redoAct  redoTarget  on  off>
 * ★例)
 * <行動予測:  x:100>
 * 　行動ビューの位置を右に 100 ピクセル ずらす。-100 なら左
 * <行動予測:  y:100>
 * 　行動ビューの位置を下に 100 ピクセル ずらす。-100 なら上
 * <行動予測:  dire:上>
 * 　行動ビューの表示方向を 上 にする
 * 　方向は「中央」「上」「下」「左」「右」を入れられる
 * <行動予測:  text:謎の攻撃>
 * 　行動ビューに表示されるテキストを『謎の攻撃』にする。制御文字も使用可能
 * 　\n で改行。指定がなければスキル名が表示される
 * <行動予測:  icon:11>
 * 　行動ビューに表示されるアイコンを ID 11 のアイコンにする
 * 　指定がなければスキルのアイコンが表示される
 * <行動予測:  redoAct>
 * 　敵キャラの行動を再決定する。ターゲットも同時に再決定される
 * <行動予測:  redoTarget>
 * 　敵キャラのターゲットを再決定する。行動はそのまま
 * <行動予測:  on>
 * 　行動予測を オン(有効) にする
 * <行動予測:  off>
 * 　行動予測を オフ(無効) にする
 * 　オンとオフが両方ある場合はオフが優先される
 * <行動予測:  showLine>
 * 　ターゲットラインを表示する
 * <行動予測:  hideLine>
 * 　ターゲットラインを表示しない
 * <行動予測:  x:100  y:100  dire:上  icon:11  name:謎の攻撃  on>
 * 　とまとめて設定することも可能
 * 
 * 
 * ■【機能2】スイッチで行動予測を有効/無効
 * [1]プラグインパラメータ → 
 * 　『行動予測"有効"スイッチ』/『行動予測"無効"スイッチ』　に、
 * 　それぞれ好きなスイッチを割り当てる
 * [2]有効スイッチをオンにすると行動予測有効、
 * 　無効スイッチをオンにすると無効になる
 * 　両方ともオンの場合は無効が優先され無効
 * 
 * 
 * ■【機能3】行動予測中ステート
 * スキルのメモ欄に
 * <行動予測中ステート: 10>
 * 　そのスキルを行動予測中にID10のステートを付与する
 * 
 * 
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 * 
 * 
 * 
 * A system that displays the next action and target of the enemy character
 * Supports both turn-based and time-progress
 *
 * ● How to use ●
 *
 * ■【First thing to do】 Adjust the target line
 * Adjust the position and direction of the target line 
 * according to the battle layout
 * ◎ The target line extends from the actor toward the target,
 *   A line that indicates who is the target
 * ◎ Adjustments are made with plug-in parameters
 * ◎ As an example, try adjusting for the side view screen 
 *   with enemies on the left and allies on the right.
 *   I want you to try it as it is
 * [1] Plug-in parameter → Set "ライン-進行方向" to "right"
 *   Lines extend from enemies to allies
 *   And since the enemy is on the left and the ally is on the right, 
 *   stretch toward "right"
 * [2] Plugin parameter → "ライン-進行方向"
 *   Set "終点-方向(味方)" to "left"
 * 　The line will extend toward the left side of the allied graphic
 * [3] and above. Test the battle in "side view"
 *
 *
 * ■ [Setting 1] Manually activate action prediction
 * [1] Plugin parameter → Set "常に行動予測r" to "false"
 * 　Action prediction will not be activated automatically
 * [2] Turn on action prediction using the memo field in the database 
 *    or switch. Details later
 *
 *
 * ■ [Setting 2] Disable action view/target line
 *   By default, both actions and targets are displayed,
 *   If you want to use only one of them
 * ◎ Disable action display
 *   Plugin parameter → "行動表示" to "false"
 * ◎ Disable target display
 *   Plugin parameter → "ターゲット表示" to "false"
 *
 *
 * ■ [Setting 3] Customize the action view appearance
 *   Plugin parameter → "行動ビュー"
 * ◎ Various setting items are lined up, but you can tweak them as you like.
 *
 *
 * ■ [Setting 4] Customize the appearance of the target line
 *   Plug-in parameter → "ターゲットライン"
 * ◎ Various setting items are lined up, but you can tweak them as you like.
 *
 *
 * ■ [Function 1] Change action prediction settings 
 * in the memo field of the database
 *   You can dynamically change action prediction settings
 * ・Shift the position of the action view for each enemy
 * ・Specify the name displayed in the action view
 * ・ Dynamically turn on/off action prediction
 * There are functions such as
 * ◎ Actor, class, skill, item, weapon, armor, enemy character, 
 *   state memo column
 * <prediction: x: y: dire: name: icon: redoAct redoTarget on off>
 * ★example)
 * <prediction: x:100>
 *   Shift the position of the action view by 100 pixels to the right. 
 *   -100 is left
 * <prediction: y:100>
 *   Shift the position of the action view downward by 100 pixels. -100 is up
 * <prediction: dire:up>
 *   Set the display direction of the action view to up
 *   Direction can be "Center", "Top", "Bottom", "Left", and "Right"
 * <prediction: text: Mysterious attack>
 *   Change the text displayed in the action view to "Mysterious Attack". 
 *   Control characters are allowed
 *   Newline with \n. If not specified, the skill name will be displayed
 * <prediction: icon:11>
 *   Set the icon displayed in the action view to the icon with ID 11
 *   If not specified, the skill icon will be displayed
 * <prediction: redoAct>
 *   Redetermine the actions of the enemy characters. 
 *   The target is also re-determined at the same time
 * <prediction: redoTarget>
 *   Redetermine the enemy character's target. action as it is
 * <prediction: on>
 *   Action prediction he turned on (enabled)
 * <prediction: off>
 *   He turns off (disables) action prediction
 *   If there are both on and off, off takes precedence
 * <prediction: showLine>
 *   display target line
 * <prediction: hideLine>
 *   Do not display target line
 * <prediction: x:100 y:100 dire:up icon:11 name:mysterious attack on>
 *   It is also possible to set together with
 *
 *
 * ■ [Function 2] Activate/deactivate action prediction with a switch
 * [1] Plugin parameters →
 *   In the "行動予測"有効"スイッチ" / "行動予測"無効"スイッチ",
 *   Allocate your favorite switch to each
 * [2] Action prediction is enabled when the enable switch is turned on,
 *   Disabled when the disabled switch is turned on
 *   If both are on, disable takes precedence over disable
 * 
 * 
 * ■【Function 3】State During Action Prediction
 * In the skill’s memo field, write:
 * <inPredictionState: 10>
 *   This will apply the state with ID 10 
 *   while the skill is in the action prediction phase.
 *
 *
 * ● Terms of Use ●
 * Feel free to use it under the MIT license.
 *
 *
 * 
 * @param 常に行動予測
 * @desc predictionAlways 常に有効予測を有効にする。有効にしない場合はデータベースのメモ欄で適宜有効にする
 * @type boolean
 * @default true
 * 
 * @param 行動予測"有効"スイッチ
 * @desc prediction"valid"switch 行動予測を有効にするスイッチ
 * @type switch
 * @default 
 * 
 * @param 行動予測"無効"スイッチ
 * @desc prediction"unValid"switch 行動予測を無効にするスイッチ
 * @type switch
 * @default 
 * 
 * @param 行動ビュー
 * 
 * @param 行動-表示
 * @parent 行動ビュー
 * @desc act-show 味方キャラの行動ビューを表示する(場合によっては味方キャラも)
 * @type boolean
 * @default true
 * 
 * @param 行動-入力中のみ表示
 * @parent 行動ビュー
 * @desc act-showOnlyInput 行動入力中のみ行動ビューを表示する
 * @type boolean
 * @default true
 * 
 * @param 行動-詠唱中の味方も表示
 * @parent 行動ビュー
 * @desc act-showCastActor 詠唱中の味方キャラも行動ビューを表示する
 * @type boolean
 * @default false
 * 
 * @param 行動-自動中の味方も表示
 * @parent 行動ビュー
 * @desc act-showAutoActor 自動戦闘中の味方キャラも行動ビューを表示する
 * @type boolean
 * @default false
 * 
 * @param 行動-フォント
 * @parent 行動ビュー
 * @desc act-font 行動ビューの使用フォント。Keke_CommonDataでフォント登録しそのフォント名を書く。空欄ならメインフォント
 * @default 
 * 
 * @param 行動-文字サイズ
 * @parent 行動ビュー
 * @desc act-fontSize 行動ビューの文字サイズ。基本 24
 * @default 24
 * 
 * @param 行動-文字色
 * @parent 行動ビュー
 * @desc act-fontColor 行動ビューの文字色。赤、緑、青、濃度。色0～255、濃度0～1。基本 240, 240, 0
 * @default 240, 240, 0
 * 
 * @param 行動-文字色(詠唱中)
 * @parent 行動ビュー
 * @desc act-fonColorCast 詠唱中の行動ビューの文字色。赤、緑、青、濃度。色0～255、濃度0～1。基本 255, 192, 255
 * @default 255, 192, 255
 * 
 * @param 行動-縁取り幅
 * @parent 行動ビュー
 * @desc act-outWidth 行動ビューの文字縁取り幅。5 なら 5ピクセル。基本 7 
 * @default 7
 * 
 * @param 行動-横幅
 * @parent 行動ビュー
 * @desc act-width 行動ビューの横幅。100 なら 100ピクセル。基本 200
 * @default 200
 * 
 * @param 行動-背景色
 * @parent 行動ビュー
 * @desc act-backColor 行動ビューの背景の色。(赤, 緑, 青, 濃度)。色0～255、濃度0～1。基本 0, 0, 0, 0.25
 * @default 0, 0, 0, 0.25
 * 
 * @param 行動-アイコン表示
 * @parent 行動ビュー
 * @desc act-showicon 行動のアイコンを表示する。基本 true
 * @type boolean
 * @default true
 * 
 * @param …アイコン間隔
 * @parent 行動ビュー
 * @desc act-space 行動テキストとアイコンの間隔。5 なら 5ピクセル。基本 0
 * @default 0
 * 
 * @param …アイコンサイズ
 * @parent 行動ビュー
 * @desc act-iconSize アイコンの大きさ。150 なら 150%、50 なら 50% の大きさになる。基本 100
 * @default 100
 * 
 * @param 行動-行間
 * @parent 行動ビュー
 * @desc act-lineSpace 行動を複数行にわたって表示する時の行間。5 なら 5ピクセル。基本 2
 * @default 2
 * 
 * @param 行動-表示位置/味方
 * @parent 行動ビュー
 * @desc act-showPos/actor 味方の行動ビューの表示位置
 * @type struct<viewPos>
 * @default {"表示方向":"上","ずらしX":"","ずらしY":""}
 * 
 * @param 行動-表示位置/敵
 * @parent 行動ビュー
 * @desc act-showPos/enemy 敵の行動ビューの表示位置
 * @type struct<viewPos>
 * @default {"表示方向":"上","ずらしX":"","ずらしY":""}
 * 
 * @param 行動-非表示範囲
 * @parent 行動ビュー
 * @desc act-noShowScope 行動ビューを表示しない範囲。下50 なら、画面下端から 50ピクセル の範囲には表示しない
 * @type struct<noShowScope>
 * @default {"上":"0","下":"0","左":"0","右":"0"}
 * 
 * @param 行動-表示レイヤー
 * @parent 行動ビュー
 * @desc act-showLayer 行動ビューの表示レイヤー。基本 ウインドウより下
 * @type select
 * @option ウインドウより下
 * @option ウインドウより上
 * @default ウインドウより下
 * 
 * @param 行動-不発エフェクト
 * @parent 行動ビュー
 * @desc act-misfireEffect 行動がMP不足等で不発に終わった時のエフェクト
 * @type struct<effect>
 * @default {"アニメーション":"64","効果音":"[\"{\\\"ファイル\\\":\\\"Monster4\\\",\\\"音量\\\":\\\"100\\\",\\\"ピッチ\\\":\\\"70\\\",\\\"位相\\\":\\\"0\\\"}\"]","画面フラッシュ":"true","…フラッシュ色":"255, 255, 255, 170","…フラッシュ遅延":"","…フラッシュ時間":"30","ヒットストップ":"0, 0","フリーアニメ":""}
 * 
 * @param 行動-フェード時間
 * @parent 行動ビュー
 * @desc act-fadeTime 行動ビューのフェードイン/アウトの所要時間。5 なら 5フレーム。基本 5
 * @default 5
 * 
 * @param ターゲットライン
 * 
 * @param ライン-表示
 * @parent ターゲットライン
 * @desc line-show 敵キャラのターゲットラインを表示する
 * @type boolean
 * @default true
 * 
 * @param ライン-入力中のみ表示
 * @parent ターゲットライン
 * @desc line-showOnlyInput 行動入力中のみターゲットラインを表示する
 * @type boolean
 * @default true
 * 
 * @param ライン-進行方向
 * @parent ターゲットライン
 * @desc line-vector ターゲットラインの向かう方向
 * @type select
 * @option 上
 * @option 下
 * @option 左
 * @option 右
 * @default 下
 * 
 * @param ライン-始点
 * @parent ターゲットライン
 * @desc line-startPoint ライン始点の位置設定。始点は敵キャラにのみ発生(ターゲットを表示するのは敵のみであるため)
 * @type struct<lineStart>
 * @default {"始点-方向":"右","始点-ずらしX":"","始点-ずらしY":""}
 * 
 * @param ライン-終点
 * @parent ターゲットライン
 * @desc line-endPoint ライン終点の位置設定。終点は味方と敵キャラ両方ある(回復行動など、敵が敵をターゲットすることがあるため)
 * @type struct<lineEnd>
 * @default {"味方へのライン":"","終点-方向(味方)":"上","終点-ずらしX(味方)":"","終点-ずらしY(味方)":"","敵同士のライン":"","終点-方向(敵)":"中央","終点-ずらしX(敵)":"","終点-ずらしY(敵)":""}
 * 
 * @param ライン-太さ
 * @parent ターゲットライン
 * @desc line-width ターゲットラインの太さ。5 なら 5ピクセル。基本 4
 * @default 4
 * 
 * @param ライン-縁取り幅
 * @parent ターゲットライン
 * @desc line-outWidth ターゲットラインの縁取りの幅。1 なら 1ピクセル。基本 1.5
 * @default 1.5
 * 
 * @param ライン-色リスト
 * @parent ターゲットライン
 * @desc line-colorList ターゲットラインの色。赤, 緑, 青。各0～255。1行目は一番目の敵、2行目は二番目の敵といった感じで適用
 * @type string[]
 * @default ["255, 255, 0","255, 0, 255","0, 255, 255","255, 128, 0","128, 255, 0","0, 128, 255","255, 255, 255","255, 0, 0"]
 * 
 * @param ライン-始点大きさ
 * @parent ターゲットライン
 * @desc line-startPointSize ターゲットラインの始点の円部分の大きさ。5 なら 5ピクセル。基本 3
 * @default 3
 * 
 * @param ライン-矢印大きさ
 * @parent ターゲットライン
 * @desc line-arrowSize ターゲットラインの矢印部分の大きさ。5 なら 5ピクセル。基本 4
 * @default 4
 * 
 * @param ライン-重なりずらし
 * @parent ターゲットライン
 * @desc line-pileOffset ターゲットラインが重なった時にずらす幅。5 なら 5ピクセル。基本 12
 * @default 12
 * 
 * @param ライン-最低長さ
 * @parent ターゲットライン
 * @desc line-minLength ターゲットラインが短すぎる場合の最低長さ。この長さは下回らない。50 なら 50ピクセル。基本 50
 * @default 50
 * 
 * @param ライン-全体時はワード
 * @parent ターゲットライン
 * @desc line-wordOnAll 全体対象の時はラインではなく指定の文字列を表示する
 * @type boolean
 * @default true
 * 
 * @param …全体ワード設定
 * @parent ターゲットライン
 * @desc line-allWordCfg 全体対象の時に表示する文字列の設定
 * @type struct<allWordCfg>
 * @default {"ワード":"ALL","フォント":"","文字サイズ":"22","文字色":"96, 255, 255","縁取り幅":"7","ずらしX":"","ずらしY":""}
 * 
 * @param ライン-表示レイヤー
 * @parent ターゲットライン
 * @desc line-showLayer ターゲットラインの表示レイヤー。基本 ウインドウより下
 * @type select
 * @option ウインドウより下
 * @option ウインドウより上
 * @default ウインドウより下
 */



//==================================================
/*~struct~viewPos:
//==================================================
 * @param 表示方向
 * @desc showDire 行動ビューの表示方向。基本 上
 * @type select
 * @option 中央
 * @option 上
 * @option 下
 * @option 左
 * @option 右
 * @default 上
 * 
 * @param ずらしX
 * @desc offsetX 行動ビューのX位置ずらし。5 なら 5ピクセル 右へ。基本 0
 * @default
 * 
 * @param ずらしY
 * @desc offsetY 行動ビューのY位置ずらし。5 なら 5ピクセル 下へ。基本 0
 * @default
 */



//==================================================
/*~struct~noShowScope:
//==================================================
 * @param 上
 * @desc up 上側の非表示範囲。50 なら 画面上端から 50ピクセル の範囲には表示しない。基本 0
 * 
 * @param 下
 * @desc down 下側の非表示範囲。50 なら 画面下端から 50ピクセル の範囲には表示しない。基本 0
 *
 * @param 左
 * @desc left 左側の非表示範囲。50 なら 画面左端から 50ピクセル の範囲には表示しない。基本 0
 *
 * @param 右
 * @desc right 右側の非表示範囲。50 なら 画面右端から 50ピクセル の範囲には表示しない。基本 0
 */



//==================================================
/*~struct~allWordCfg:
//==================================================
 * @param ワード
 * @desc word 全体ワードとして表示する文字列
 * @default ALL
 * 
 * @param フォント
 * @parent 行動ビュー
 * @desc font 全体ワードの使用フォント。Keke_CommonDataでフォント登録したフォント名を書く。空欄ならメインフォント
 * @default 
 * 
 * @param 文字サイズ
 * @desc fontSize 全体ワードの文字サイズ。基本 22
 * @default 22
 * 
 * @param 文字色
 * @desc fontColor 全体ワードの文字色。赤、緑、青、濃度。各0〜255。基本 96, 255, 255
 * @default 96, 255, 255
 * 
 * @param 縁取り幅
 * @desc outWidth 全体ワードの文字縁取り幅。5 なら 5ピクセル。基本 7
 * @default 7
 * 
 * @param ずらしX
 * @desc offsetX 全体ワードのX位置ずらし。5 なら 5ピクセル 右へ。基本 0
 * @default 
 * 
 * @param ずらしY
 * @desc offsetY 全体ワードのY位置ずらし。5 なら 5ピクセル 下へ。基本 0
 * @default 
 */



//==================================================
/*~struct~lineStart:
//==================================================
 * @param 始点-方向
 * @desc startPoint-dire ライン始点の位置方向。基本 右
 * @type select
 * @option 中央
 * @option 上
 * @option 下
 * @option 左
 * @option 右
 * @default 右
 * 
 * @param 始点-ずらしX
 * @desc startPoint-offsetX ライン始点のXずらし。5 なら 5ピクセル 右へ。基本 0
 * @default 
 * 
 * @param 始点-ずらしY
 * @desc startPoint-offsetY ライン始点のYずらし。5 なら 5ピクセル 下へ。基本 0
 * @default 
 */



//==================================================
/*~struct~lineEnd:
//==================================================
 * @param 味方へのライン
 *
 * @param 終点-方向(味方)
 * @parent 味方へのライン
 * @desc endPoint-dire(actor) 味方のライン終点の位置方向。基本 上
 * @type select
 * @option 中央
 * @option 上
 * @option 下
 * @option 左
 * @option 右
 * @default 上
 * 
 * @param 終点-ずらしX(味方)
 * @parent 味方へのライン
 * @desc endPoint-offsetX(actor) 味方のライン終点のXずらし。5 なら 5ピクセル 右へ。基本 0
 * @default 
 * 
 * @param 終点-ずらしY(味方)
 * @parent 味方へのライン
 * @desc endPoint-offsetY(actor) 味方のライン終点のYずらし。5 なら 5ピクセル 下へ。基本 0
 * @default 
 * 
 * @param 敵同士のライン
 * 
 * @param 終点-方向(敵)
 * @parent 敵同士のライン
 * @desc endPoint-dire(enemy) 敵のライン終点の位置方向。基本 中央
 * @type select
 * @option 中央
 * @option 上
 * @option 下
 * @option 左
 * @option 右
 * @default 中央
 * 
 * @param 終点-ずらしX(敵)
 * @parent 敵同士のライン
 * @desc endPoint-offsetX(enemy) 敵のライン終点のXずらし。5 なら 5ピクセル 右へ。基本 0
 * @default 
 * 
 * @param 終点-ずらしY(敵)
 * @parent 敵同士のライン
 * @desc endPoint-offsetY(enemy) 敵のライン終点のYずらし。5 なら 5ピクセル 下へ。基本 0
 * @default 
 */



//================================================== 
/*~struct~effect:
//==================================================
 *
 * @param アニメーション
 * @desc animation 表示するアニメーション
 * @type animation
 * 
 * @param 効果音
 * @desc SE 鳴らす効果音
 * @type struct<se>[]
 * @default []
 * 
 * @param 画面フラッシュ
 * @desc screenFlash 画面フラッシュを実行する
 * @type boolean
 * @default false
 * 
 * @param …フラッシュ色
 * @desc flashColor 画面フラッシュの色。赤, 緑, 青, 強さ。各0～255。基本 255, 255, 255, 170
 * @default 255, 255, 255, 170
 * 
 * @param …フラッシュ遅延
 * @desc flashDelay フラッシュのディレイ。5 なら 5フレーム 待ってからフラッシュ。基本 0
 * @default 
 * 
 * @param …フラッシュ時間
 * @desc flashTime フラッシュの所要時間。5 なら 5フレーム。基本 30
 * @default 30
 * 
 * @param ヒットストップ
 * @desc hitStope 画面を止める演出。5, 7 なら 5フレーム 待ってから 7フレーム 止める。Keke_HitStopが必要。基本 0, 0
 * @default 0, 0
 * 
 * @param フリーアニメ
 * @desc freeAnime フリーアニメを再生する。メモ欄同様に記述。Keke_FreeAnimeが必要
 * @type multiline_string
 */



//==================================================
/*~struct~se:
//==================================================
 * @param ファイル
 * @desc file 効果音ファイル
 * @type file
 * @dir audio/se
 *
 * @param 音量
 * @desc volime 効果音の音量
 * @default 100
 *
 * @param ピッチ
 * @desc pitch 効果音のピッチ
 * @default 100
 *
 * @param 位相
 * @desc pan 効果音の位相
 * @default 0
 */
 
 
 
(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.split("/").pop().split("?")[0].replace(/\.js$/, "");



    //==================================================
    //--  公開メソッド
    //==================================================

    //- 行動予測の開始(公開)
    Game_Temp.prototype.startPredictionKe = function(subject, force) {
        // 行動予測の開始
        startPrediction(subject, force);
    };



    //==================================================
    //-- 他プラグインとの連携メソッド
    //==================================================

    //- フルアニメステータスの取得
    function getFullAnimeStatus() {
        if ($gameSystem.isSideView()) { return null; }
        return $gameTemp._fullAnimeStatusKe;
    };

    //- フルアニメステータスASIの取得
    function getFullAnimeStatusAsi(battler) {
        // サイドビュー時はバトグラに表示
        if ($gameSystem.isSideView()) { return null; }
        if (!$gameTemp._fullAnimeStatusKe) { return null; }
        const asi = $gameTemp.getFullAnimeStatusAsiKe(battler);
        // 顔アイコンがなければバトグラに表示
        if (!asi || !asi.faceBaseSprite || !asi.faceBaseSprite.visible) { return null; }
        return asi;
    };


    //- スピードスターバトルか
    function isSpeedStar() {
        const gs = $gameSystem;
        return gs._speedStarInitedKe && !gs._noSpeedStarKe;
    };


    //- フリーアニメプラグインがあるか
    function isFreeAnime() {
        return PluginManager._scripts.some(n => n == "Keke_FreeAnime");
    };


    //- アイコンバックを描画するか - メニュー快適化
    function isIconBackDraw() {
        if (!$gameTemp.isIconBackDrawKe) { return false; };
        return $gameTemp.isIconBackDrawKe.apply(this, arguments);
    };

    //- アイコンバックの描画 - メニュー快適化
    function drawIconBack(bitmap, iconIndex, x, y) {
        if (!$gameTemp.drawIconBackKe) { return; };
        $gameTemp.drawIconBackKe.apply(this, arguments);
    };

    

    //==================================================
    //--  追加スプライト /ベーシック
    //==================================================
    
    //- 破棄付きスプライト
    function SpriteKePrds() {
        this.initialize(...arguments);
    }

    SpriteKePrds.prototype = Object.create(Sprite.prototype);
    SpriteKePrds.prototype.constructor = SpriteKePrds;

    SpriteKePrds.prototype.destroy = function() {
        if (this.bitmap && !this.bitmap._url) { this.bitmap.destroy(); }

        if (this._texture) { Sprite.prototype.destroy.apply(this); }
    };



    //==================================================
    //--  文字列オート変換 /ベーシック
    //==================================================
    
    //- 文字列のハッシュ化
    function strToHash(str) {
        if (!str || !str.length) { return {}; }
        let hash = {};
        const strs = JSON.parse(str);
        let val = null;
        let val2 = null;
        for (const key in strs) {
            val = strs[key];
            if (!key || !val) { continue; }
            val2 = strToAuto(val, key);
            hash[key] = val2;
        }
        return hash;
    };

    //- 文字列のリスト化
    function strToList(str) {
        if (!str || !str.length) { return []; }
        let array = JSON.parse(str);
        return array.map((val, i) => {
            return strToAuto(val);
        });
    };
    
    //- 文字列の自動処理
    function strToAuto(val, key = "") {
        let val2 = null;
        let match = null;
        let end = false;
        if (!end) {
            if (val[0] == "{") {
                val2 = strToHash(val);
                end = true;
            }
        }
        if (!end) {
            if (val[0] == "[") {
                val2 = strToList(val);
                end = true;
            }
        }
        if (!end) { val = val + ","; }
        if (!end) {
            match = val.match(/^\s*(-?\d+\s*,\s*-?\d+\s*,\s*-?\d+\s*,?\s*-?\d*\.?\d*)\s*,$/);
            if (match && !val.match(/[^\d\.\-,\s]/)) {
                if (key.match(/(カラー|色|塗り)/) && !key.includes("トーン") && !key.includes("ブレンド") && !key.includes("配色") && !key.includes("着色") &&  !key.includes("フラッシュ") && !key.includes("チェンジ") &&  !key.includes("選択")) {
                    val2 = "rgba(" +  match[1] + ")";
                } else {
                    val2 = JSON.parse("[" +  match[1] + "]");
                }
                end = true;
            }
        }
        if (!end) {
            match = val.match(/(-?\d+\.?\d*),\s*/g);
            if (match && match.length >= 2 && !val.match(/[^\d\.\-,\s]/)) {
                val2 = JSON.parse("[" + match.reduce((r, s) => r + s).replace(/,$/, "") + "]");
                end = true;
            }
        }
        if (!end) {
            match = val.match(/^(true|false)\s*,/);
            if (match) {
                val2 = match[1] == "true" ? true : false;
                end = true;
            }
        }
        if (!end) {
            match = val.match(/^(-?\d+\.?\d*)\s*,/);
            if (match && !val.match(/[a-z]/)) {
                val2 = Number(match[1]); end = true;
                end = true;
            }
        }
        if (!end) {
            if (val[0] == "\"") { val = val.slice(1); }
            val2 = val.slice(0, -1);
        }
        return val2;
    };



    //==================================================
    //--  パラメータ受け取り
    //==================================================
    
    //- 真偽化
    function toBoolean(str) {
        if (!str) { return false; }
        const str2 = str.toString().toLowerCase();
        if (str2 == "true" || str2 == "on") { return true; }
        if (str2 == "false" || str2 == "off") { return false; }
        return Number(str);
    };

    let parameters = PluginManager.parameters(pluginName);

    const keke_predictionAlways = toBoolean(parameters["常に行動予測"]);
    const keke_predictionOnSwitch = Number(parameters["行動予測\"有効\"スイッチ"]);
    const keke_predictionOffSwitch = Number(parameters["行動予測\"無効\"スイッチ"]);

    //- 行動ビュー
    const keke_actShow = toBoolean(parameters["行動-表示"]);
    const keke_actOnlyInput = toBoolean(parameters["行動-入力中のみ表示"]);
    const keke_actShowCastActor = toBoolean(parameters["行動-詠唱中の味方も表示"]);
    const keke_actShowAutoActor = toBoolean(parameters["行動-自動中の味方も表示"]);
    const keke_actFontFace = parameters["行動-フォント"];
    const keke_actFontSize = Math.max(1, Number(parameters["行動-文字サイズ"]) - 4);
    const keke_actFontColor = "rgba(" + parameters["行動-文字色"] + ")";
    const keke_actFontColorCast = "rgba(" + parameters["行動-文字色(詠唱中)"] + ")";
    const keke_actOutW = Number(parameters["行動-縁取り幅"]);
    const keke_actW = Math.max(1, Number(parameters["行動-横幅"]) - 40);
    const keke_actBackColor = parameters["行動-背景色"] ? `rgba(${parameters["行動-背景色"]})` : "";
    const keke_actShowIcon = toBoolean(parameters["行動-アイコン表示"]);
    const keke_actIconSpace = Number(parameters["…アイコン間隔"]);
    const keke_actIconSize = Math.max(1, (Number(parameters["…アイコンサイズ"]) || 100) - 15);
    const keke_actLineSpace = Number(parameters["行動-行間"]);
    const keke_actPosActor = strToHash(parameters["行動-表示位置/味方"]);
    const keke_actPosEnemy = strToHash(parameters["行動-表示位置/敵"]);
    const keke_actNoShowScope = strToHash(parameters["行動-非表示範囲"]);
    const keke_actLayer = parameters["行動-表示レイヤー"];
    const keke_actMisfireEffect = strToHash(parameters["行動-不発エフェクト"]);
    const keke_actFadeTime = Number(parameters["行動-フェード時間"]);

    //- ターゲットライン
    const keke_lineShow = toBoolean(parameters["ライン-表示"]);
    const keke_lineOnlyInput = toBoolean(parameters["ライン-入力中のみ表示"]);
    const keke_lineDire = parameters["ライン-進行方向"];
    const keke_lineStart = strToHash(parameters["ライン-始点"]);
    const keke_lineEnd = strToHash(parameters["ライン-終点"]);
    const keke_lineW = Number(parameters["ライン-太さ"]);
    const keke_lineOutW = Number(parameters["ライン-縁取り幅"]);
    const keke_lineColorList = makeColorList(parameters["ライン-色リスト"]);
    const keke_linePileOffset = Number(parameters["ライン-重なりずらし"]);
    const keke_lineStartSize = Number(parameters["ライン-始点大きさ"]);
    const keke_lineArrowSize = Number(parameters["ライン-矢印大きさ"]);
    const keke_lineMinLength = Number(parameters["ライン-最低長さ"]);
    const keke_lineWordIfAll = toBoolean(parameters["ライン-全体時はワード"]);
    const keke_allWordCfg = strToHash(parameters["…全体ワード設定"]);
    const keke_lineLayer = parameters["ライン-表示レイヤー"];

    parameters = null;

    //- カラーリストの作成
    function makeColorList(str) {
        const list = strToList(str);
        return list.map(s => `rgba(${s})`);
    };



    //==================================================
    //--  レイヤー
    //==================================================

    //- シーンバトル/全ウインドウの形成(処理追加)
    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.apply(this);

        // 行動予測レイヤーの形成
        createPredictionLayer(this);
    };

    //- 行動予測レイヤーの形成
    function createPredictionLayer(scene) {
        const spriteset = scene._spriteset;
        const fast = getFullAnimeStatus();
        const layers = {};
        const downLayer = spriteset;
        const upLayer = fast ? fast._layers[fast._viewerLayer] : scene;
        // Aレイヤー
        const layerA = new SpriteKePrds();
        downLayer.addChild(layerA);
        layers["A"] = layerA;
        // Bレイヤー
        const layerB = new SpriteKePrds();
        downLayer.addChild(layerB);
        layers["B"] = layerB;
        // Cレイヤー
        const layerC = new SpriteKePrds();
        upLayer.addChild(layerC);
        layers["C"] = layerC;
        // Dレイヤー
        const layerD = new SpriteKePrds();
        upLayer.addChild(layerD);
        layers["D"] = layerD;
        // 変数にセット
        spriteset._predictionLayersKe = layers;

    };

    //- レイヤーチルド
    function childLayer(sprite, id) {
        SceneManager._scene._spriteset._predictionLayersKe[id].addChild(sprite);
    };
    


    //==================================================
    //--  メモ欄からの取得
    //==================================================

    //- 行動予測設定の取得
    function getPredictionCfg(battler, tage, calc = "*", action = null, radioIndex) {
        const metas = bundleAllMeta_array(battler, ["行動予測", "prediction"], action, true, radioIndex);
        if (!metas || !metas.length) { return null; }
        for (const str of metas.reverse()) {
            if (!str) { continue; }
            // ずらしX
            if (tage == "ずらしX") {
                const match = str.match(/(^|[,\s\n])(x|offsetX|posX|ずらしX|位置X):\s*(\-*\d+\.*\d*)/i);
                if (match && match[3]) {
                    return Number(match[3]);
                }
                continue;
            }
            // ずらしY
            if (tage == "ずらしY") {
                const match = str.match(/(^|[,\s\n])(y|offsetY|posY|ずらしY|位置Y):\s*(\-*\d+\.*\d*)/i);
                if (match && match[3]) {
                    return Number(match[3]);
                }
                continue;
            }
            // 表示方向
            if (tage == "表示方向") {
                const match = str.match(/(^|[,\s\n])(dire|direction|showDire|表示方向|方向):\s*(中央|左|右|上|下|center|left|right|up|down|c|l|r|u|d)/i);
                if (match && match[3]) {
                    return convertDirection(match[3]);
                }
                continue;
            }
            // テキスト
            if (tage == "テキスト") {
                const match = str.match(/(^|[,\s\n])(text|name|テキスト|文章|名前):\s*([^\s,]+)/i);
                if (match && match[3]) {
                    return match[3];
                }
                continue;
            }
            // アイコン
            if (tage == "アイコン") {
                const match = str.match(/(^|[,\s\n])(icon|showIcon|アイコン|表示アイコン):\s*(\d*),*\s*(\-*\d*\.*\d*)/i);
                if (match && (match[3] || match[4])) {
                    return { index:Number(match[3]), size:Number(match[4]) };
                }
                continue;
            }
            // 行動再決定
            if (tage == "行動再決定") {
                const match = str.match(/(^|[,\s\n])(actRedo|redoAct|行動再決定|再行動)/i);
                if (match && match[2]) {
                    return true
                }
                continue;
            }
            // ターゲット再決定
            if (tage == "ターゲット再決定") {
                const match = str.match(/(^|[,\s\n])(targetRedo|redoAct|ターゲット再決定|再ターゲット)/i);
                if (match && match[2]) {
                    return true
                }
                continue;
            }
            // ラインあり
            if (tage == "ラインあり") {
                const match = str.match(/(^|[,\s\n])(showLine|showTarget|ラインあり|ターゲットあり|ライン表示|ターゲット表示)/i);
                if (match && match[2]) {
                    return true
                }
                continue;
            }
            // ラインなし
            if (tage == "ラインなし") {
                const match = str.match(/(^|[,\s\n])(hideLine|hideTarget|ラインなし|ターゲットなし|ライン非表示|ターゲット非表示)/i);
                if (match && match[2]) {
                    return true
                }
                continue;
            }
            // 無効
            if (tage == "無効") {
                const match = str.match(/(^|[,\s\n])(no|off|none|無効|オフ)/i);
                if (match && match[2]) {
                    return true
                }
                continue;
            }
            // 有効
            if (tage == "有効") {
                const match = str.match(/(^|[,\s\n])(ok|on|valid|有効|オン)/i);
                if (match && match[2]) {
                    return true
                }
                continue;
            }
        }
        return null;
    };

    //- 方向の変換
    function convertDirection(d) {
        if (d.match(/center|c/i)) {
            return "中央";
        } else if (d.match(/left|l/i)) {
            return "左";
        } else if (d.match(/right|r/i)) {
            return "右";
        } else if (d.match(/up|u/i)) {
            return "上";
        } else if (d.match(/down|d/i)) {
            return "下";
        }
        return d;
    };



    //==================================================
    //--  行動予測システム
    //==================================================

    // 再決定予約
    let redoReserve = null;

    //- ゲームバトラー/TPBの初期化(処理追加)
    const _Game_Battler_initTpbChargeTime = Game_Battler.prototype.initTpbChargeTime;
    Game_Battler.prototype.initTpbChargeTime = function(advantageous) {
        _Game_Battler_initTpbChargeTime.apply(this, arguments);

        // 行動予測の開始(TPB)
        if (BattleManager.isTpb()) {
            setTimeout(startPrediction, 0, this);
        }
    };
    
    //- バトルマネージャー/アクション終了時の処理(処理追加)
    const _BattleManager_endBattlerActions = BattleManager.endBattlerActions;
    BattleManager.endBattlerActions = function(subject) {
        _BattleManager_endBattlerActions.apply(this, arguments);

        // 行動予測の開始
        startPrediction(subject);
    };

    //- ゲームバトラー/ターン終了時の処理(処理追加)
    const _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        _Game_Battler_onTurnEnd.apply(this);
        // 行動予測の開始
        startPrediction(this);
    };

    //- ゲームバトラーベース/出現時の処理(処理追加)
    const _Game_BattlerBase_appear = Game_BattlerBase.prototype.appear;
    Game_BattlerBase.prototype.appear = function() {
        _Game_BattlerBase_appear.apply(this);

        // 行動予測の開始
        startPrediction(this);
    };

    //- バトルマネージャー/入力の開始(処理追加)
    const _BattleManager_startInput = BattleManager.startInput;
    BattleManager.startInput = function() {
        _BattleManager_startInput.apply(this);

        // 行動予測の開始-全員(ターン)
        if (!BattleManager.isTpb()) {
            startPredictionAll();
        }
    };

    // 行動予測の開始
    function startPrediction(subject, force) {
        // アクターは行動予測しない
        if (subject._actorId) { return; }
        // 先制攻撃時の敵は行動予測しない
        if (BattleManager._preemptive && subject._enemyId) { return; }
        // 行動の先行作成
        force = makeActionFast(subject, force);
        // ターゲットの先行作成
        makeTargetFast(subject, force);
    };
    
    // 行動の先行作成
    function makeActionFast(subject, force) {
        // アクターは先行作成しない
        if (!subject || subject._actorId) { return; }
        let maked = false;
        // 行動作成(TPB時のみ)
        if (BattleManager.isTpb()) {
            if (!subject._actions.length || force) {
                // アクションのクリア
                subject.clearActions();
                const preActionState = subject._actionState;
                // アクション作成
                subject.makeActions();  
                subject.setActionState(preActionState);
                // 先行アクションフラグをオン
                subject._actionMakedFastKe = true;
                maked = true;
            }
        }
        // 行動ビューのリフレッシュフラグをオン
        subject._refreshsActViewKe = true;
        return maked;
    };


    // 行動予測の開始-全員
    function startPredictionAll() {
        // 全てのキャラに対して処理
        const members = [...$gameTroop.aliveMembers(), ...$gameParty.aliveMembers()];
        members.forEach(subject => {
            // 行動予測の開始
            startPrediction(subject);
        });
    };


    //- ゲームバトラー/TPBターンの開始(処理追加)
    const _Game_Battler_startTpbTurn = Game_Battler.prototype.startTpbTurn;
    Game_Battler.prototype.startTpbTurn = function() {
        // TPB行動入力時に先行アクションを適用

        // アクション先行作成をしていたら
        if (this._actionMakedFastKe) {
            // フラグオフ
            this._actionMakedFastKe = false;
            // 使用できないアクションは不発にさせる
            const preActionNum = this._actions.filter(action => action.item()).length;
            this._actions = this._actions.filter(action => action.isValid());
            // 不発エフェクト
            if (preActionNum >= 1 && this._actions.length < preActionNum) {
                misfireEffect(this);
            }
            // 行動作成済みフラグをオン
            this._isActionMakedKe = true;
        }

        _Game_Battler_startTpbTurn.apply(this);

        // 行動作成済みフラグをオフ
        this._isActionMakedKe = false;
        // 被キャンセルフラグをオフ
        this._isCanceledKe = true;
    };

    //- 不発エフェクト
    function misfireEffect(battler) {
        // エフェクトの実行
        doEffect(keke_actMisfireEffect, battler);
        // 不発ポップアップ
        misfirePopup(battler);
    };

    //- 不発ポップアップ
    function misfirePopup(battler) {
        if (!PluginManager._scripts.some(n => n == "Keke_StatePopup")) { return; }
        // 不発ポップの表示
        battler.showMisfirePopKeStpp();
    };


    //- ゲームバトラー/アクション作成(処理追加)
    const _Game_Battler_makeActions = Game_Battler.prototype.makeActions;
    Game_Battler.prototype.makeActions = function() {
        // 行動作成時、行動作成済みなら作成スキップしてそれを採用
        if (this._isActionMakedKe) { return; }

        _Game_Battler_makeActions.apply(this);
    };

    const _Game_Battler_numActions = Game_Battler.prototype.numActions;
    Game_Battler.prototype.numActions = function() {
        // 行動作成時、行動作成済みなら作成スキップしてそれを採用
        if (this._isActionMakedKe) { return 0; }

        return _Game_Battler_numActions.apply(this);
    };


    //- ゲームバトラー/行動不能時の処理(処理追加)
    const _Game_Battler_onRestrict = Game_Battler.prototype.onRestrict;
    Game_Battler.prototype.onRestrict = function() {
        _Game_Battler_onRestrict.apply(this);

        // 行動予約の消去
        delPrediction(this);
    };

    //- 行動予約の消去
    function delPrediction(subject) {
        // アクションを消去
        subject._actions = [];
        // アクション先行作成フラグをオフ
        subject._actionMakedFastKe = false;
        // 行動作成済みフラグをオフ
        subject._isActionMakedKe = false;
        // ターゲット先行作成の消去
        delTargetFast(subject);
    };


    //- ゲームバトラー/TPBターンの初期化(処理追加)
    const _Game_Battler_initTpbTurn = Game_Battler.prototype.initTpbTurn;
    Game_Battler.prototype.initTpbTurn = function() {
        // 行動予測時はTPBターン初期値を 1 にする
        _Game_Battler_initTpbTurn.apply(this);

        this._tpbTurnCount = 1;
    };


    //- 先行アクション済みのキャラをチャージ完了まで行動させない
    /*const _BattleManager_getNextSubject = BattleManager.getNextSubject;
    BattleManager.getNextSubject = function() {
        const battler = this._actionBattlers[0];
        if (battler && battler._actionMakedFastKe) {
            this._actionBattlers.shift();
            return null;
        }

        return _BattleManager_getNextSubject.apply(this);
    };*/



    //==================================================
    //--  行動の再決定
    //==================================================

    //- 再決定の処理
    function processRedo(subject, targets, action) {
        // ターゲットの重複を削除、敵キャラのみに限定
        targets = Array.from(new Set(targets)).filter(target => target && target._enemyId);
        if (!targets.length) { return; }
        // 行動再決定
        if (getPredictionCfg(subject, "行動再決定", "", action)) {
            // 行動再決定を予約
            redoReserve = { targets:getRedoTarget(targets), type:"act" };
            return;
        }
        // ターゲット再決定
        if (getPredictionCfg(subject, "ターゲット再決定", "", action)) {
            // ターゲット再決定を予約
            redoReserve = { targets:getRedoTarget(targets), type:"target" };
            return;
        }
    };

    //- 再決定ターゲットの取得
    function getRedoTarget(targets) {
        // ターゲットの敵キャラが入っていたらそのまま返す
        if (targets.length && targets.some(battler => battler._enemyId)) {
            return targets;
        }
        // そうでなければ敵キャラ全てを返す
        return $gameTroop.aliveMembers();
    };


    //- バトルマネージャー/ターンの更新(処理追加)
    const _BattleManager_updateTurn = BattleManager.updateTurn;
    BattleManager.updateTurn = function(timeActive) {
        // 再決定の実行
        executeRedo();

        _BattleManager_updateTurn.apply(this, arguments);
    };

    //- 再決定の実行
    function executeRedo() {
        if (!redoReserve) { return; }
        const targets = redoReserve.targets;
        if (!targets || !targets.length) { return; }
        // 行動再決定の実行
        if (redoReserve.type == "act") {
            targets.forEach(target => {
                // 行動の先行作成
                makeActionFast(target, true);
                // ターゲットの先行作成
                makeTargetFast(target, true);
            });
        // ターゲット再決定の実行
        } else {
            targets.forEach(target => {
                // ターゲットの先行作成
                makeTargetFast(target, true);
            });
        }
        // 予約を消去
        redoReserve = null;
    };



    //==================================================
    //--  行動ビューウインドウ
    //==================================================

    //- 行動ビューウインドウ
    function Window_ActViewKe() {
        this.initialize(...arguments);
    }
    
    Window_ActViewKe.prototype = Object.create(Window_Base.prototype);
    Window_ActViewKe.prototype.constructor = Window_ActViewKe;

    //- 初期化
    Window_ActViewKe.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);

        this.frameVisible = false;
        this._backSprite.visible = false;
    };

    //- 独自背景スプライトの形成
    Window_ActViewKe.prototype._createBackSprite = function() {
        Window_Base.prototype._createBackSprite.call(this);

        // スプライト形成 & チルド
        this._backSpriteKe = new SpriteKePrds();
        this.addChild(this._backSpriteKe);
    };

    //- 背景の描画
    Window_ActViewKe.prototype.drawBackKe = function(width, height, color) {
        // 背景を描画
        const bitmap = new Bitmap(this._width, this._height);
        const padding = this._padding;
        fillSquare(bitmap, padding, padding, width, height, color, height / 3);
        // ビットマップを挿入
        const backSprite = this._backSpriteKe;
        if (backSprite.bitmap) { backSprite.bitmap.destroy(); }
        backSprite.bitmap = bitmap;
        // 最初は見えない化
        backSprite.opacity = 0;
    };

    //- フォント基本設定(処理追加)
    Window_ActViewKe.prototype.resetFontSettings = function() {
        const contents = this.contents;
        contents.fontFace = keke_actFontFace || $gameSystem.mainFontFace();
        contents.fontSize = keke_actFontSize;
        this.changeTextColor(isCasting(this._battlerKe) ? keke_actFontColorCast : keke_actFontColor);
        this.changeOutlineColor(ColorManager.outlineColor());
        contents.outlineWidth = keke_actOutW;
    };

    //- テキストの高さの計算(処理追加)
    Window_ActViewKe.prototype.calcTextHeight = function(textState) {
        const lastFontSize = this.contents.fontSize;
        const lines = textState.text.slice(textState.index).split("\n");
        const textHeight = this.maxFontSizeInLine(lines[0]) + keke_actLineSpace;
        this.contents.fontSize = lastFontSize;
        return textHeight;
    };

    //- テキストステート作成処理(処理追加)
    Window_ActViewKe.prototype.createTextState = function(text, x, y, width) {
        const textState = Window_Base.prototype.createTextState.call(this, text, x, y, width);

        // テキストステートを保存
        this._textState = textState;
        // 各行のフレームを記録する変数を作成
        textState.lineFrames = [];
        // 1行目のフレームを保存
        textState.lineFrames.push(this.getLineFrame(textState));
        return textState;
    };

    //- 行替えの処理(処理追加)
    Window_ActViewKe.prototype.processNewLine = function(textState) {
        Window_Base.prototype.processNewLine.call(this, textState);

        // 新しい行のフレームを保存
        textState.lineFrames.push(this.getLineFrame(textState));
    };

    //- 行フレームの取得
    Window_ActViewKe.prototype.getLineFrame = function(textState) {
        const x = textState.x;
        const y = textState.y;
        const width = 0;
        const height = textState.height;
        const heightEx = textState.height - keke_actLineSpace;
        const text = textState.text.slice(textState.index);
        // 行頭か判定(改行文字による行でないか)
        let isTop = false;
        if (text.match(/^topke/)) {
            isTop = true;
            textState.index += 5;
        }
        return { x:x, y:y, width:width, height:height, heightEx:heightEx, isTop:isTop };
    };

    //- テキスト書き出しの処理(処理追加)
    Window_ActViewKe.prototype.flushTextState = function(textState) {
        const preOutputHeight = textState.outputHeight;
        // テキスト横幅を取得
        const text = textState.buffer;
        const textW = this.textWidth(text);

        Window_Base.prototype.flushTextState.call(this, textState);

        // 行フレームの横幅を更新
        const lineFrames = textState.lineFrames;
        lineFrames[lineFrames.length - 1].width += textW;
        // 書き出しがなかったらアウトプットヘイトの更新を無効
        if (!text) {
            textState.outputHeight = preOutputHeight;
        }
    };



    //==================================================
    //--  行動ビュー
    //==================================================

    //- ゲームバトラー/詠唱開始時の処理(処理追加)
    const _Game_Battler_startTpbCasting = Game_Battler.prototype.startTpbCasting;
    Game_Battler.prototype.startTpbCasting = function() {
        _Game_Battler_startTpbCasting.apply(this);

        // 行動ビューのリフレッシュフラグをオン
        this._refreshsActViewKe = true;
    };

    //- スブライトバトラｰ/バトラーのセット(処理追加)
    const _Sprite_Battler_setBattler = Sprite_Battler.prototype.setBattler;
    Sprite_Battler.prototype.setBattler = function(battler) {
        _Sprite_Battler_setBattler.apply(this, arguments);

        // 行動ビューのリフレッシュフラグをオン
        this._refreshsActViewKe = true;
    };


    //- スプライトバトラー/更新(処理追加)
    const _Sprite_Battler_update = Sprite_Battler.prototype.update;
    Sprite_Battler.prototype.update = function() {
        _Sprite_Battler_update.apply(this);

        // 行動ビューの更新
        updateActView(this, this._battler);
    };

    //- 行動ビューの更新
    function updateActView(battlerSprite, battler) {
        if (!battler) { return; }
        if (BattleManager._phase == "start" && !$gameTroop.isEventRunning()) { return; }
        // 行動ビューリフレッシュの更新
        updateActViewRefresh(battler);
        // 行動ビュースプライトを更新
        const actWindow = battlerSprite._actWindowKe;
        if (actWindow) {
            // 行動ビューの可視更新
            updateViewVisibleAct(actWindow, battler);
        }
    };


    //- 行動ビューリフレッシュの更新
    function updateActViewRefresh(subject) {
        if (!subject._refreshsActViewKe) { return; }
        const asi = getFullAnimeStatusAsi(subject);
        const faceSprite = asi ? asi.faceBaseSprite : null;
        if (faceSprite) {
            if (asi.startNear) { return; }
            // 行動ビューのリフレッシュ
            refreshActView(subject);
        } else {
            const subjectSprite = searchSpriteBattler(subject);
            if (!subjectSprite || !subjectSprite._frame.width) { return;}
            // 行動ビューのリフレッシュ
            refreshActView(subject, subjectSprite);
        }
    };

    //- 行動ビューのリフレッシュ
    function refreshActView(battler, battlerSprite) {
        battlerSprite = battlerSprite || searchSpriteBattler(battler);
        if (!battlerSprite) { return; }
        const actions = battler._actions.filter(action => action && action.item());
        const skillNames = actions.map(action => getSkillName(action)).filter(a => a);
        // 行動テキストの作成
        const text = makeActText(skillNames);
        // 行動ビューの形成
        createActView(battlerSprite, battler, actions.length, text);
        const actWindow = battlerSprite._actWindowKe;
        // テキストを描画
        const outW = keke_actOutW;
        actWindow.drawTextEx(text, outW / 2, outW / 2, Graphics.width);
        // 描画したテキストステートからフレームを取得
        const textState = actWindow._textState;
        const frames = textState.lineFrames;
        // 行動アイコンの作成
        const iconW = makeActIcon(actWindow, battler, actions, frames);
        // 行動ビューの可視更新
        updateViewVisibleAct(actWindow, battler);
        // メモ欄からの位置設定を取得
        actWindow._memoXKe = getPredictionCfg(battler, "ずらしX", "", actions[0]) || 0;
        actWindow._memoYKe = getPredictionCfg(battler, "ずらしY", "", actions[0]) || 0;
        actWindow._showDireKe = getPredictionCfg(battler, "表示方向", "", actions[0]);
        // 最大横幅を保存
        let widthMax = null;
        frames.forEach(frame => {
            // アイコン幅をフレームに保存
            frame.iconW = iconW;
            if (widthMax == null || frame.width > widthMax) {
                widthMax = frame.width;
            }
        });
        // 背景の描画
        const backW = widthMax ? widthMax + keke_actOutW : 0;
        const backH = textState.outputHeight ? textState.outputHeight + keke_actOutW : 0;
        actWindow.drawBackKe(backW, backH, keke_actBackColor);
        if (widthMax != null) { actWindow._widthKe = widthMax; }
        // 行動ビューの位置更新
        updateViewPosAct(actWindow, battlerSprite, battler);
        // フレームを保存
        battlerSprite._actFramesKe = frames;
        // 行動予測中ステートの処理
        processInPredictionState(battler, actions);
        // リフレッシュフラグをオフ
        battler._refreshsActViewKe = null;
    };

    //- スキル名の取得
    function getSkillName(action) {
        const item = action.item();
        // スキル名を取得
        const skillName = item.name;
        // メモ欄から表示名を取得
        const showName = getPredictionCfg(null, "テキスト", "", action);
        return showName || skillName;
    };

    //- 行動テキストの作成
    function makeActText(skillNames) {
        let text = "";
        skillNames.forEach(name => {
            name = name.replace(/\\n/g, "\n");
            text += "topke" + name +"\n";
        });
        return text;
    };

    //- 行動ビューの形成
    function createActView(battlerSprite, battler, actionNum, text) {
        const preSprite = battlerSprite._actWindowKe;
        if (preSprite && preSprite._actionNum == actionNum) { return; }
        // 前のがあったら破棄
        if (preSprite) {
            destroyActView(preSprite);
        }
        // 仮ウインドウを作成
        const tempWindow = new Window_ActViewKe({ x:0, y:0, width:Graphics.width, height:Graphics.height });
        // テキストのサイズを取得
        const outW = keke_actOutW;
        const sizes = tempWindow.textSizeEx(text, 0, 0, Graphics.width);
        sizes.width += outW;
        sizes.height += outW;
        // ウインドウ形成
        const padding = tempWindow._padding;
        const windowWidth = keke_actW + padding * 2;
        const windowHeight = sizes.height + padding * 2;
        const windo = new Window_ActViewKe({ x:0, y:0, width:windowWidth, height:windowHeight });
        tempWindow.destroy();
        // チルド
        const layerId = keke_actLayer == "ウインドウより上" ? "D" : "B";
        childLayer(windo, layerId);
        // 原点
        const pos = battler._enemyId ? keke_actPosEnemy : keke_actPosActor;
        // 変数にセット
        battlerSprite._actWindowKe = windo;
        // スプライトにサイズを保存
        windo._widthKe = sizes.width;
        windo._heightKe = sizes.height + keke_actLineSpace;
        // ウインドウを中心に配置するために位置補正
        windo._centerXKe = -windo._width / 2 - windo._padding + (windowWidth - sizes.width) / 2;
        windo._centerYKe = -windo._height + windo._padding
        // バトラーを保存
        windo._battlerKe = battler;
        // アクション数を保存
        windo._actionNumKe = actionNum;
        // 表示方向を保存
        windo._direKe = pos["表示方向"];
        // 最初は見えない化
        windo._clientArea.opacity = 0;
    };

    //- 行動ビューの破棄
    function destroyActView(actWindow) {
        actWindow.destroy();
        const iconSprites = actWindow._iconSpritesKe;
        if (iconSprites && iconSprites.length) {
            iconSprites.forEach(sprite => sprite.destroy());
        }
        actWindow._iconSpritesKe = [];
    };

    //- 行動アイコンの作成
    function makeActIcon(actWindow, battler, actions, frames) {
        if (!keke_actShowIcon) { return; }
        let iconWMax = 0;
        // 全てのアクションに対して処理
        actions.forEach((action, i) => {
            // アイコンデータの取得
            const iconData = getIconData(action);
            // 行フレームの取得
            const frame = getLineFrame(frames, i);
            // アイコンスプライトの形成
            const iconSprite = createIconSprite(iconData.index);
            // サイズを設定
            const iconW = frame.height * iconData.size;
            iconSprite.scale.x = iconW / ImageManager.iconWidth;
            iconSprite.scale.y = iconW / ImageManager.iconHeight;
            iconWMax = Math.max(iconW, iconWMax);
            const iconOffset = iconW / 2 + keke_actIconSpace;
            // 位置を設定
            const padding = actWindow._padding;
            iconSprite.x = padding - iconOffset;
            iconSprite.y = padding + frame.y + frame.height / 2;
            // レイヤーチルド
            actWindow.addChild(iconSprite);
            // 変数にセット
            if (!actWindow._iconSpritesKe) { actWindow._iconSpritesKe = []; }
            actWindow._iconSpritesKe.push(iconSprite);
            // 烈の中心をアイコン分だけ左にずらす
            frame.x -= iconOffset;
            // 最初は見えない化
            iconSprite.opacity = 0;
        });
        iconWMax += keke_actIconSpace;
        // 行動ビューをアイコンの分、右にずらす
        actWindow._iconXKe = iconWMax / 2;
        return iconWMax;
    };

    //- 行フレームの取得
    function getLineFrame(frames, tage_i) {
        let i = -1;
        let true_i = 0;
        for (const frame of frames) {
            i++;
            if (!frame.isTop) { continue; }
            if (true_i == tage_i) { break; }
            true_i++;
        };
        return frames[i];
    };

    //- アイコンデータの取得
    function getIconData(action) {
        const item = action.item();
        // スキルのアイコンを取得
        const iconIndex = item.iconIndex;
        // メモ欄から表示アイコンを取得
        const d = getPredictionCfg(null, "アイコン", "", action) || {};
        return { index:d.index || iconIndex, size:(d.size || keke_actIconSize) / 100 };
    };

    //- 行動ビューの位置更新
    function updateViewPosAct(sprite, battlerSprite, battler) {
        const pos = battler._enemyId ? keke_actPosEnemy : keke_actPosActor;
        const dire = sprite._showDireKe || pos["表示方向"];
        const asi = getFullAnimeStatusAsi(battler);
        // フルアニメ
        if (asi && asi.visible) {
            const frame = asi.frame;
            const faceFrame = asi.faceFrame;
            sprite.x = frame.x;
            sprite.y = frame.y;
            if (faceFrame.width) {
                const direX = dire == "左" ? -faceFrame.width / 2 : dire == "右" ? faceFrame.width / 2 : 0;
                const direY = dire == "上" ? -faceFrame.height / 2 : dire == "下" ? faceFrame.height / 2 : 0;
                sprite.x += faceFrame.x + direX;
                sprite.y += faceFrame.y + direY;
            } else {
                const direX = dire == "左" ? -frame.width / 2 : dire == "右" ? frame.width / 2 : 0;
                const direY = dire == "上" ? -frame.height / 2 : dire == "下" ? frame.height / 2 : 0;
                sprite.y += direY;
                sprite.x += direX;
            }
        // 通常
        } else {
            const frame = battlerSprite._frame;
            const battlerW = frame.width * battlerSprite.scale.x;
            const battlerH = frame.height * battlerSprite.scale.y;
            const direX = dire == "左" ? -battlerW / 2 : dire == "右" ? battlerW / 2 : 0;
            const direY = dire == "下" ? 0 : dire == "中央" ? -battlerH / 2 : -battlerH * 1.1;
            sprite.x = battlerSprite._homeX + direX;
            sprite.y = battlerSprite._homeY + direY;
        }
        // 共通の位置
        sprite.x += (pos["ずらしX"] || 0) + (sprite._iconXKe || 0) + sprite._memoXKe + sprite._centerXKe;
        sprite.y += (pos["ずらしY"] || 0) + sprite._memoYKe + sprite._centerYKe;
        const gauge = battler._enemyId && battlerSprite._battlerHp;
        if (gauge && gauge.bitmap && sprite.parent && sprite.parent.toLocal) {
            const center = gauge.toGlobal(new PIXI.Point(0, 0));
            const local = sprite.parent.toLocal(center);
            sprite.x = local.x - sprite._width / 2;
            sprite.y = local.y - gauge.bitmap.height - sprite._height - 4;
        }
        // 鋼体ビューがあるなら上にずらす
        /*if (existSteelView(battlerSprite, dire)) {
            sprite.y -= battlerSprite._steelSpriteKe._heightKe || 0;
        }*/
         // 行動ビューとの合計高さを取得
         const isSteelView = existSteelView(battlerSprite, dire);
         const steelH = isSteelView ? battlerSprite._steelSpriteKe._heightKe : 0;
        // 画面外に出さない
        noOutScreen(sprite, sprite._widthKe, sprite._heightKe, sprite._padding, steelH);
    };

    //- 鋼体ビューがあるか
    function existSteelView(battlerSprite, dire) {
        const steelSprite = battlerSprite._steelSpriteKe;
        if (!steelSprite) { return false; }
        if (steelSprite._direKe != dire) { return false;}
        if (!steelSprite.visible) { return false;}
        return true;
    };

    //- 画面外に出さない
    function noOutScreen(sprite, width, height, padding, upPlus) {
        // 非表示範囲を取得
        noShowScope = keke_actNoShowScope || {};
        // 上下左右の端の位置を取得
        const leftEdge = sprite.x + padding;
        const rightEdge = sprite.x + width - padding;
        const upEdge = sprite.y + padding - upPlus;
        const downEdge = sprite.y + height - padding;
        // 上下左右の超過分を取得
        const leftOver = leftEdge - (noShowScope["左"] || 0);
        const rightOver = rightEdge - (Graphics.width - (noShowScope["右"] || 0));
        const upOver = upEdge - (noShowScope["上"] || 0);
        const downOver = downEdge - (Graphics.height - (noShowScope["下"] || 0));
        // 超過分だけ位置をずらす
        if (leftOver < 0) {
            sprite.x -= leftOver;
        } else if (rightOver > 0) {
            sprite.x -= rightOver;
        }
        if (upOver < 0) {
            sprite.y -= upOver;
        } else if (downOver > 0) {
            sprite.y -= downOver;
        }
    };


    //- 行動ビューの可視更新
    function updateViewVisibleAct(sprite, battler) {
        // 行動ビューの可視状態を取得
        const visible = isVisibleAct(battler);
        // 対象スプライトを取得
        let sprites = [sprite._clientArea];
        if (sprite._backSpriteKe) { sprites.push(sprite._backSpriteKe); }
        if (sprite._iconSpritesKe) { sprites = [...sprites, ...sprite._iconSpritesKe]; }
        // スプライトフェードの更新
        if (!updateSpriteFade(sprite, visible, keke_actFadeTime, sprites)) {
            // フェード中でなければ可視状態を更新
            /*if (visible) { 
                sprite.visible = true;
            } else {
                sprite.visible = false;
            }*/
        }
    };

    //- 見えるか-行動
    function isVisibleAct(battler) {
        if (BattleManager._phase == "battleEnd") { return false;}
        if (!isActShow() || !isValidPrediction(battler)) { return false; }
        if (isActing(battler) || battler.isRestricted()) { return false; }
        if (keke_actOnlyInput && !BattleManager.isInputting()) { return false; }
        if (BattleManager._preemptive && battler._enemyId) { return false; }
        if (battler._actorId) {
            let valid = false;
            if (keke_actShowCastActor && isCasting(battler)) { valid = true; }
            if (keke_actShowAutoActor && isAutoBattle(battler)) { valid = true; }
            if (!valid) { return false; }
        }
        if ($gameTemp._uiHideKeSmrc) { return false; }
        return true;
    };

    // 行動ビューを表示するか
    function isActShow() {
        return keke_actShow;
    };

    //- 行動予測有効か
    function isValidPrediction(subject) {
        // 無効スイッチがオンなら無効
        if ($gameSwitches.value(keke_predictionOffSwitch)) { return false; };
        //メモ欄に無効フラグがあったら無効
        const memoValid = getValidByMemo(subject);
        if (memoValid == false) { return false; }
        // 常に行動予測/有効スイッチ/有効フラグのいずれかがオンなら有効
        return keke_predictionAlways || memoValid == true || $gameSwitches.value(keke_predictionOnSwitch);
    };

    //- メモ欄からのフラグの取得
    function getValidByMemo(subject) {
        const members = [subject, ...$gameParty.aliveMembers()];
        // メモ欄に無効フラグがあったら無効
        if (members.some(battler => getPredictionCfg(battler, "無効"))) { return false; };
        // メモ欄に有効フラグがあったら有効
        if (members.some(battler => getPredictionCfg(battler, "有効"))) { return true; };
        return  null;
    };

    //- 行動中か
    function isActing(battler) {
        return battler.isActing() || isActingSpeedStar(battler);
    };

    //- 行動中か(スピードスター)
    function isActingSpeedStar(battler) {
        const subject = BattleManager._action ? BattleManager._action.subject() : null;
        return isSpeedStar() && BattleManager._battleWaitKe && subject && subject == battler;
    };

    //- 詠唱中か
    function isCasting(battler, isStart) {
        if (!battler) { return false; }
        const state = battler._tpbState;
        const isActive = battler.isAlive() && !battler.isRestricted() && BattleManager._phase != "battleEnd";
        return state.match(/casting/) && isActive && (isStart ? true : battler._tpbCastTime);
    };



    //==================================================
    //--  ターゲット予測
    //==================================================

    //- ターゲットの先行作成
    function makeTargetFast(subject, redo) {
        // アクターは先行作成しない
        if (!subject || subject._actorId) { return; }
        // すでに作成済みならリターン
        if (!redo && subject._targetsFastKe && subject._targetsFastKe.lists.length) { return; }
        // アクションを取得
        const actions = subject._actions;
        if (!actions.length) { return; }
        // ターゲットを作成
        let targets = [];
        let targetsForLine = [];
        actions.forEach((action, i) => {
            // 再決定時は強制ターゲットを消去
            if (redo) { action._targetIndex = -1; }
            // アクションのターゲットを取得
            const t = getActionTargets(action);
            if (t.list) { targets[i] = t.list; }
            if (t.listForLine) { targetsForLine[i] = t.listForLine; }
        });
        // ターゲットを保存
        if (targets.length) {
            subject._targetsFastKe = { lists:targets, listsForLine:targetsForLine };
            // ターゲットラインのリフレッシュ
            refreshTargetLine(subject);
        }
    };

    //- アクションのターゲットを取得
    function getActionTargets(action) {
        if (!action.item()) { return {}; }
        // ターゲットの作成
        const tages = action.makeTargets();
        if (!tages.length) { return {}; }
        // 実際のターゲット用
        let list = tages.map(target => battlerToData(target));
        // ターゲットライン用
        let listForLine = [];
        // 対全体アクションか
        const isAll = isForAllAction(action);
        // 全体ワードの時は全体ワードフラグを挿入
        if (isAll && keke_lineWordIfAll) {
            listForLine.push({ isAll:true, isAllWord:true });
        // それ以外はターゲットが重複しないように挿入
        } else {
            const line = [];
            tages.forEach(target => {
                if (!line.includes(target)) { line.push(target); }
            });
            listForLine = line.map(target => battlerToData(target));
            listForLine[0].isAll = isAll;
        }
        return { list:list, listForLine:listForLine };
    };

    //- 対全体アクションか
    function isForAllAction(action) {
        if (!action || !action.item()) { return false; }
        return action.isForAll() || action.isForEveryone();
    };


    //- ゲームアクション/行動直前の処理(処理追加)
    const _Game_Action_prepare = Game_Action.prototype.prepare;
    Game_Action.prototype.prepare = function() {
        _Game_Action_prepare.apply(this);

        // ターゲット先行作成の適用
        applyTargetFast(this.subject(), this);
    };

    //- ターゲット先行作成の適用
    function applyTargetFast(subject, action) {
        if (!subject._targetsFastKe || !subject._targetsFastKe.lists.length) { return; }
        // ターゲットラインの消去
        delTargetLine(subject);
        // 先行作成ターゲットリストを取得
        const targets = subject._targetsFastKe.lists.shift();
        if (!targets || !targets.length) { return; }
        // アクションに先行作成ターゲットをセット
        const newTargets = targets.map(data => dataToBattler(data)).filter(target => target && target.isAlive()).map(battler => battlerToData(battler));
        if (newTargets.length) {
           action._targetsFastKePrds = newTargets;
        }
    };


    //- ゲームアクション/ターゲットの作成(処理追加)
    const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
    Game_Action.prototype.makeTargets = function() {
        // 先行作成ターゲットがあればそれを採用
        if (this._targetsFastKePrds) {
            return this._targetsFastKePrds.map(data => dataToBattler(data));
        }

        return _Game_Action_makeTargets.apply(this);
    };


    //- ターゲット先行作成の消去
    function delTargetFast(subject) {
        if (subject._actorId) { return; }
        if (!subject._targetsFastKe || !subject._targetsFastKe.lists.length) { return; }
        subject._targetsFastKe = null;
        // ターゲットラインの消去
        delTargetLine(subject);
    };
    
    //- ターゲット先行作成の消去-全員
    function delTargetFastAll() {
        $gameTroop.members().forEach(subject => {
            // ターゲット先行作成の消去
            delTargetFast(subject);
        });
    };



    //==================================================
    //--  ターゲットの再決定
    //==================================================

    //- ゲームバトラー/戦闘不能の処理(処理追加)
    if (Game_Battler.prototype.die == Game_BattlerBase.prototype.die) {
        Game_Battler.prototype.die = function() {
            Game_BattlerBase.prototype.die.call(this);
        };
    }
    const _Game_Battler_die = Game_Battler.prototype.die;
    Game_Battler.prototype.die = function() {
        // ターゲットが戦闘不能になったらターゲットの修正
        _Game_Battler_die.apply(this);

        // 個別ターゲットの修正
        setTimeout(restoreEachTarget, 0, this);
        // 全体ターゲットの修正
        setTimeout(restoreAllTarget, 0, this);
    };
    
    //- ゲームバトラー/復活の処理(処理追加)
    if (Game_Battler.prototype.revive == Game_BattlerBase.prototype.revive) {
        Game_Battler.prototype.revive = function() {
            Game_BattlerBase.prototype.revive.call(this);
        };
    }
    const _Game_Battler_revive = Game_Battler.prototype.revive;
    Game_Battler.prototype.revive = function() {
        // ターゲット側が復活したら全体ターゲットの修正
        _Game_Battler_revive.apply(this);

        // 全体ターゲットの修正
        setTimeout(restoreAllTarget, 0, this);
    };

    //- ゲームパーティ/アクターの追加(処理追加)
    const _Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
         // メンバーが加わった時に全体ターゲットの修正
        _Game_Party_addActor.apply(this, arguments);

        if (inBattle()) {
            // 加わったアクターを取得
            const actor = $gameParty.members().find(a => a._actorId == actorId);
            if (actor) {
                // 全体ターゲットの修正
                setTimeout(restoreAllTarget, 300, actor);   
            }
        }
    };

    //- ゲームパーティ/アクターの除外(処理追加)
    const _Game_Party_removeActor = Game_Party.prototype.removeActor;
    Game_Party.prototype.removeActor = function(actorId) {
        // メンバーが外れた時にターゲットの修正

        // 外れたアクターを取得
        let actor = null;
        if (inBattle()) {
            actor = $gameParty.members().find(a => a._actorId == actorId);
        }

        _Game_Party_removeActor.apply(this, arguments);

        if (actor) {
            // 個別ターゲットの修正
            setTimeout(restoreEachTarget, 300, actor);
            // 全体ターゲットの修正
            setTimeout(restoreAllTarget, 300, actor);
        }
    };

    //- 戦闘中か
    function inBattle() {
        // 戦闘中以外はリターン
        if (!$gameParty.inBattle) { return false; }
        // 戦闘開始時はリターン
        if (!BattleManager._phase || BattleManager._phase == "start") { return false; }
        return true;
    };

    //- 個別ターゲットの修正
    function restoreEachTarget(delTarget) {
        if (!delTarget) { return; }
        // 全ての敵キャラに対して処理
        $gameTroop.aliveMembers().forEach(subject => {
            const targets = subject._targetsFastKe;
            if (!targets || !targets.listsForLine.length) { return; }
            // 全ての行動に対して判定
            targets.listsForLine.forEach((tages, i) => {
                // 対全体はリターン
                if (tages[0].isAll) { return; }
                // 消去ターゲットがターゲットに含まれてなければリターン
                if (!tages.some(target => target.id == delTarget._actorId)) { return; }
                // アクションを取得
                const action = subject._actions[i];
                if (!action) { return; }
                // アクションのターゲットを取得
                const t = getActionTargets(action);
                // ターゲットを修正
                if (t.list) { targets.lists[i] = t.list; };
                if (t.listForLine) { targets.listsForLine[i] = t.listForLine; };
                // ターゲットラインのリフレッシュ
                refreshTargetLine(subject);
            });
        });
    };

    //- 全体ターゲットの修正
    function restoreAllTarget(target) {
        if (!target) { return; }
        // 全ての敵キャラに対して処理
        $gameTroop.aliveMembers().forEach(subject => {
            const targets = subject._targetsFastKe;
            if (!targets || !targets.listsForLine.length) { return; }
            // 全ての行動に対して判定
            targets.listsForLine.forEach((tages, i) => {
                // 対全体以外はリターン
                if (!tages[0].isAll) { return; }
                // アクションを取得
                const action = subject._actions[i];
                if (!action) { return; }
                // アクションのターゲットを取得
                const t = getActionTargets(action);
                // ターゲットを修正
                if (t.list) { targets.lists[i] = t.list; };
                if (t.listForLine) { targets.listsForLine[i] = t.listForLine; };
                // ターゲットラインのリフレッシュ
                refreshTargetLine(subject);
            });
        });
    };



    //==================================================
    //--  ターゲットラインの開始
    //==================================================

    //- ターゲットラインのリフレッシュ
    function refreshTargetLine(subject) {
        subject._makesTargetLineKe = true;
    };

    //- ターゲットラインのリフレッシュ-全員
    function refreshTargetLineAll() {
        $gameTroop.members().forEach(subject => {
            subject._makesTargetLineKe = true;
        });
    };

    //- シーンバトル/ステータスウインドウ位置の更新(処理追加)
    const _Scene_Battle_updateStatusWindowPosition = Scene_Battle.prototype.updateStatusWindowPosition;
    Scene_Battle.prototype.updateStatusWindowPosition = function() {
        // ステータスウインドウが移動したらターゲットラインのリフレッシュ
        const statusWindow = this._statusWindow;
        const targetX = this.statusWindowX();
        const preSame = statusWindow.x == targetX;

        _Scene_Battle_updateStatusWindowPosition.apply(this);

        if (statusWindow.visible) {
            const same = statusWindow.x == targetX;;
            if (!preSame && same) {
                // ターゲットラインのリフレッシュ-全員
                refreshTargetLineAll();
            }
        }
    };

    //- スブライトアクター/移動終了時の処理(処理追加)
    const _Sprite_Actor_onMoveEnd = Sprite_Actor.prototype.onMoveEnd;
    Sprite_Actor.prototype.onMoveEnd = function() {
        //  アクター移動終了時にターゲットラインのリフレッシュ
        _Sprite_Actor_onMoveEnd.apply(this);

        // ターゲットラインのリフレッシュ-全員
        refreshTargetLineAll();
    };



    //==================================================
    //--  ターゲットラインの更新
    //==================================================


    //- スプライトエネミー/更新(処理追加)
    const _Sprite_Enemy_update = Sprite_Enemy.prototype.update;
    Sprite_Enemy.prototype.update = function() {
        _Sprite_Enemy_update.apply(this);

        // ターゲットラインの更新
        updateTargetLine(this);
    };

    //- ターゲットラインの更新
    function updateTargetLine(sprite) {
        if (BattleManager._phase == "start" && !$gameTroop.isEventRunning()) { return; }
        const subject = sprite._battler;
        // ターゲットライン作成の更新
        updateTargetLineMake(subject);
        // ターゲットライン明滅の更新
        updataTargetLineFlicker(subject, sprite);
        // ターゲットラインの可視更新
        updateTargetLineVisible(subject, sprite);
    };


    //- ターゲットライン作成の更新
    function updateTargetLineMake(subject) {
        if (!subject._makesTargetLineKe) { return; }
        const asi = getFullAnimeStatusAsi(subject);
        const faceSprite = asi ? asi.faceBaseSprite : null;
        if (faceSprite) {
            if (asi.startNear) { return; }
            // ターゲットラインの作成
            makeTargetLine(subject);
        } else {
            const subjectSprite = searchSpriteBattler(subject);
            if (!subjectSprite || !subjectSprite._frame.width) { return;}
            // ターゲットラインの作成
            makeTargetLine(subject);
        }
    };

    //- ターゲットラインの作成
    function makeTargetLine(subject) {
        if (!subject) { return; }
        // ターゲットラインの消去
        delTargetLine(subject);
        // アクションがない場合はリターン
        if (!subject._actions.filter(action => action.item()).length) {
            subject._makesTargetLineKe = null;
            return;
        }
        const targets = subject._targetsFastKe;
        if (!targets || !targets.listsForLine.length) { return; }
        // 全てのターゲットに対して処理
        targets.listsForLine.forEach((tages, i) => {
            tages.forEach(targetId => {
                if (!targetId) { return; }
                // 全体ワードの作成
                if (targetId.isAllWord) {
                    makeAllWord(subject, i);
                // ワイヤーの形成
                } else {
                    const target = dataToBattler(targetId);
                    if (target) { createWire(subject, target, i); }
                }
            })
        });
        // 作成開始フラグをオフ
        subject._makesTargetLineKe = null;
        // ターゲットラインのリチルド
        rechildTargetLine();
    };


    //- 全体ワードの作成
    function makeAllWord(subject, i) {
        subjectSprite = searchSpriteBattler(subject);
        const allCfg = keke_allWordCfg;
        //if (!subjectSprite) { return }
        // 全体ワードの形成
        const allSprite = createAllWord(subjectSprite, subject, i);
        // ワードの描画
        const cfg = {};
        cfg.word = allCfg["ワード"];
        cfg.fontFace = allCfg["フォント"];
        cfg.fontSize = allCfg["文字サイズ"] || keke_actFontSize;
        cfg.fontColor = allCfg["文字色"] || keke_lineColorList[subject.index() % 8] || "rgba(255, 255, 255)";
        cfg.outW = allCfg["縁取り幅"] || keke_actOutW;
        const frame = drawWard(allSprite, subject, cfg);
        // ライン始点の取得
        const point = getLineStart(subject, subjectSprite, i, frame);
        // 位置をセット
        allSprite.x = point.x + (allCfg["ずらしX"] || 0);
        allSprite.y = point.y + (allCfg["ずらしY"] || 0);
        // 最初は見えない化
        allSprite.opacity = 0;
    };

    //- 全体ワードの形成
    function createAllWord(subjectSprite, subject, i) {
        const allCfg = keke_allWordCfg;
        // サイズを取得
        const outW = allCfg["縁取り幅"] || keke_actOutW;
        const width = keke_actW + outW;
        const height = keke_actFontSize + outW;
        // スプライト & ビットマップ形成
        const bitmap = new Bitmap(width, height);
        const sprite = new SpriteKePrds(bitmap);
        // チルド
        const layerId = keke_lineLayer == "ウインドウより上" ? "D" : "B";
        childLayer(sprite, layerId);
        // 原点
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        // 変数にセット
        if (!subjectSprite._targetLinesKe) { subjectSprite._targetLinesKe = { list:[] }; }
        subjectSprite._targetLinesKe.list.push(sprite);
        // スプライトにサイズを保存
        sprite._widthKe = width;
        sprite._heightKe = height;
        // 表示方向を保存
        const pos = subject._enemyId ? keke_actPosEnemy : keke_actPosActor;
        sprite._direKe = pos["表示方向"];
        // 全体ワードフラグをセット
        sprite._isAllWordKe = true;
        return sprite;
    };

    //- ワードの描画
    function drawWard(sprite, subject, cfg) {
        const fontSize = cfg.fontSize;
        const word = cfg.word;
        const outW = cfg.outW;
        // フォント設定
        const bitmap = sprite.bitmap;
        bitmap.fontFace = cfg.fontFace || $gameSystem.mainFontFace();;
        bitmap.fontSize = fontSize;
        bitmap.textColor = cfg.fontColor;
        bitmap.outlineWidth = cfg.outW;
        // サイズを取得
        const width = bitmap.measureTextWidth(word);
        const height = fontSize + outW;
        // 描画
        bitmap.drawText(word, 0, 0, bitmap.width, height, "center");
        // フレームを保存
        const frame = { x:0, y:0, width:width, height:height, outW:outW }
        return frame;
    };


    //- ワイヤーの形成
    function createWire(subject, target, i) {
        // バトラースプライト取得
        const subjectSprite = searchSpriteBattler(subject);
        if (!subjectSprite) { return; }
        const targetSprite = searchSpriteBattler(target);
        if (!isFrontViewActor(target) && !targetSprite ) { return; }
        // ライン始点の取得
        const subjectPoint = getLineStart(subject, subjectSprite, i);
        // ワイヤー始点Yの補正
        subjectPoint.y += keke_lineW / 2 + keke_lineOutW;
        // ライン終点の取得
        const targetPoint = getLineEnd(target, targetSprite);
        // 受容ラインの選択
        const receptIndex = saveReceptLine(target, subject);
        // ワイヤーの形成
        const wireBitmap = new Bitmap(Graphics.width, Graphics.height);
        const wireSprite = new SpriteKePrds(wireBitmap);
        drawWire(subject, target, wireBitmap, subjectPoint.x, subjectPoint.y, targetPoint.x, targetPoint.y, receptIndex);
        wireSprite._isWireKe = true;
        // 矢印の形成
        const arrowBitmap = new Bitmap(Graphics.width, Graphics.height);
        const arrowSprite = new SpriteKePrds(arrowBitmap);
        drawWire(subject, target, arrowBitmap, subjectPoint.x, subjectPoint.y, targetPoint.x, targetPoint.y, receptIndex, true);
        arrowSprite._isArrowKe = true;
        // スプライト内にターゲットIDを保存
        wireSprite._targetIdKe = battlerToData(target);
        arrowSprite._targetIdKe = wireSprite._targetIdKe;
        // チルド
        const layerId = keke_lineLayer == "ウインドウより上" ? "C" : "A";
        childLayer(wireSprite, layerId);
        childLayer(arrowSprite, layerId);
        // 変数にセット
        if (!subjectSprite._targetLinesKe) { subjectSprite._targetLinesKe = { list:[] }; }
        subjectSprite._targetLinesKe.list.push(wireSprite);
        subjectSprite._targetLinesKe.list.push(arrowSprite);
        // ワイヤーの長さを保存
        const length = pointDistance(subjectPoint.x, subjectPoint.y, targetPoint.x, targetPoint.y);
        const preLength = subjectSprite._targetLinesKe.length || 0;
        subjectSprite._targetLinesKe.length = Math.max(length, preLength);
        // 最初は見えない化
        wireSprite.opacity = 0;
        arrowSprite.opacity = 0;
    };

    //- フロントビューアクターか
    function isFrontViewActor(battler) {
        return !$gameSystem.isSideView() && battler._actorId;
    };

    //- ライン始点の取得
    function getLineStart(battler, battlerSprite, i, allData) {
        // 行動ビューからのポイント取得
        const point = getPointFromActView(battler, battlerSprite, i, allData);
        if (point) { return point; }
        // 取得できなければバトグラから始点を取得
        const asi = getFullAnimeStatusAsi(battler);
        const faceSprite = asi ? asi.faceBaseSprite : null;
        const startCfg = keke_lineStart;
        const dire = startCfg["始点-方向"];
        const offsetX = startCfg["始点-ずらしX"] || 0;
        const offsetY = startCfg["始点-ずらしY"] || 0;
        // ラインポイントの取得
        return getLinePoint(battler, battlerSprite, asi, faceSprite, dire, offsetX, offsetY);
    };

    //- 行動ビューからのポイント取得
    function getPointFromActView(battler, battlerSprite, i, allData) {
        // 行動ビュースプライトを取得
        const actWindow = battlerSprite._actWindowKe;
        if (!actWindow) { return; }
        // 行動ビューのフレームを取得
        const actFrames = battlerSprite._actFramesKe;
        if (!actFrames || !actFrames.length) { return; }
        const frame = getLineFrame(actFrames, i);
        if (!frame) { return; }
        // 始点の設定を取得
        const startCfg = keke_lineStart;
        const dire = startCfg["始点-方向"];
        const offsetX = startCfg["始点-ずらしX"] || 0;
        const offsetY = startCfg["始点-ずらしY"] || 0;
        // ポイント位置を取得
        const point = {};
        const padding = actWindow._padding;
        point.x = actWindow.x + padding + offsetX;
        point.y = actWindow.y + padding + frame.y + frame.height / 2 + offsetY;
        const actOutW = keke_actOutW;
        const iconW = frame.iconW || 0;
        const space = 4;
        // 全体ワードの位置
        if (allData) {
            const adjustX = actOutW + allData.width / 2;
            point.x += dire == "左" ? -iconW - adjustX : frame.width + adjustX + space;
            // 画面外に出さない-全体ワード
            noOutScreenAllWord(point, frame.width, allData.width, iconW);
        // 始点ポイントの位置
        } else {
            const startSize = keke_lineStartSize;
            const adjustX = actOutW + startSize / 2;
            point.x += dire == "左" ? -iconW - adjustX : dire == "右" ? frame.width + adjustX + space : frame.width / 2;
            point.y += dire == "上" ? -frame.height / 2 - startSize - space : dire == "下" ? frame.height / 2 + startSize : 0;
        }
        return point;
    };

    //- 画面外に出さない-全体ワード
    function noOutScreenAllWord(point, frameW, allW, iconW) {
        // 非表示範囲を取得
        noShowScope = keke_actNoShowScope || {};
        // 左右の端の位置を取得
        const leftEdge = point.x - allW / 2;
        const rightEdge = point.x + allW / 2;
        // 左右の超過分を取得
        const leftOver = leftEdge - (noShowScope["左"] || 0);
        const rightOver = rightEdge - (Graphics.width - (noShowScope["右"] || 0));
        // 超過分だけ位置をずらす
        if (leftOver < 0) {
            sprite.x -= leftOver;
        } else if (rightOver > 0) {
            sprite.x -= rightOver;
        }
    };

    //- ライン終点の取得
    function getLineEnd(battler, battlerSprite) {
        const asi = getFullAnimeStatusAsi(battler);
        const faceSprite = asi ? asi.faceBaseSprite : null;
        const endCfg = keke_lineEnd;
        const word = battler._actorId ? "(味方)" : "(敵)";
        const dire = endCfg["終点-方向" + word];
        const offsetX = endCfg["終点-ずらしX" + word] || 0;
        const offsetY = endCfg["終点-ずらしY" + word] || 0;
        // ラインポイントの取得
        return getLinePoint(battler, battlerSprite, asi, faceSprite, dire, offsetX, offsetY);
    };

    //- ラインポイントの取得
    function getLinePoint(battler, battlerSprite, asi, faceSprite, dire, offsetX, offsetY) {
        const point = {}
        let frame = null;
        let x = 0;
        let y = 0;
        let inX = 0;
        let inY = 0;
        // 顔アイコンの位置情報
        if (faceSprite) {
            frame = asi.faceFrame;
            x = asi.faceHomeX;
            y = asi.faceHomeY;
        // バトグラの位置情報
        } else {
            // フロントビュー時のアクターはステータス位置を取得
            if (isFrontViewActor(battler)) {
                const statusWindow = SceneManager._scene._statusWindow;
                $gameTemp.omitSupportMember = true;
                const i = $gameParty.battleMembers().indexOf(battler);
                frame = copyHash(statusWindow.faceRect(i));
                frame.height = 0;
                x = statusWindow.x + frame.x + frame.width / 2;
                y = statusWindow.y + frame.y;
            // その他はバトグラ位置
            } else {
                frame = copyHash(battlerSprite._frame);
                frame.width *= battlerSprite.scale.x;
                frame.height *= battlerSprite.scale.y;
                x = battlerSprite.x;
                y = battlerSprite.y - frame.height / 4;
                // 原点による補正
                inX += (0.5 - battlerSprite.anchor.x) * frame.width;
                inY += (0.5 - battlerSprite.anchor.y) * frame.height;
            }
        }
        // ポイントの位置
        inX += dire == "左" ? -frame.width / 2 : dire == "右" ? frame.width / 2 : 0;
        inY += dire == "上" ? -frame.height / 2 : dire == "下" ? frame.height / 2 : 0;
        // 座標
        point.x = x + inX + offsetX;
        point.y = y + inY + offsetY;
        // 画面外に出さない-ポイント
        noOutScreenPoint(point);
        return point;
    };

    //- 画面外に出さない-ポイント
    function noOutScreenPoint(point) {
        // 非表示範囲を取得
        noShowScope = keke_actNoShowScope || {};
        // 上下左右の限界位置を取得
        const leftMax = noShowScope["左"] || 0;
        const rightMax = Graphics.width - (noShowScope["右"] || 0);
        const upMax = noShowScope["上"] || 0;
        const downMax = Graphics.height - (noShowScope["下"] || 0);
        // 限界位置を超えた分だけずらす
        if (point.x < leftMax) { point.x += leftMax - point.x; } else
        if (point.x > rightMax) { point.x += rightMax - point.x; }
        if (point.y < upMax) { point.y += upMax - point.y; } else
        if (point.y > downMax) { point.y += downMax - point.y; }
    };
    
    //- ワイヤーの描画
    function drawWire(subject, target, bitmap, ax, ay, bx, by, receptIndex, isArrow) {
        if (!target) { return; }
        const context = bitmap.context;
        // 矢印の方向を取得
        let dire = keke_lineDire;
        // 敵キャラ同志をつなぐ場合は反転
        if (target._enemyId) {
            dire = dire == "左" ? "右" : dire == "右" ? "左" : dire == "上" ? "下" : "上";
        }
        const lineW = keke_lineW;
        const ow = keke_lineOutW;
        // ラインが複数ある時のずらしを取得
        const pileOffset = keke_linePileOffset;
        let offsetX = 0;
        let offsetY = 0;
        // 横ラインの時
        if (dire.match(/左|右/)) {
            offsetY = pileOffset * receptIndex;
        // 縦ラインの時
        } else {
            offsetX = -pileOffset * receptIndex;
        }
        // アウトラインを描画
        context.strokeStyle = "rgba(0, 0, 0)";
        context.lineWidth = ow;
        const radius = keke_lineStartSize || lineW;
        context.beginPath();
        context.arc(ax, ay, radius, 0, Math.PI * 2, false);
        context.stroke();

        context.lineWidth = lineW + ow * 2;
        if (isArrow) { strokeArrow(context, ax, ay, bx, by, dire, offsetX, offsetY, lineW, ow, true); } else
        { strokeWire(context, ax, ay, bx, by, dire, offsetX, offsetY, lineW, ow, true); }
        // 本線を描画
        context.strokeStyle = keke_lineColorList[subject.index() % 8] || "rgba(255, 255, 255)";
        context.fillStyle = context.strokeStyle;

        context.beginPath();
        context.arc(ax, ay, radius, 0, Math.PI * 2, false);
        context.fill();

        context.lineWidth = lineW;
        if (isArrow) { strokeArrow(context, ax, ay, bx, by, dire, offsetX, offsetY, lineW, ow); } else
        { strokeWire(context, ax, ay, bx, by, dire, offsetX, offsetY, lineW, ow); }
        // 終了
        context.restore();
        bitmap._baseTexture.update();
    };

    //- ワイヤーの線描画
    function strokeWire(context, ax, ay, bx, by, dire, offsetX, offsetY, lineW, ow, isOutLine) {
        const arrowW = keke_lineArrowSize + ow;
        const minLength = keke_lineMinLength;
        const xLength = Math.abs(bx - ax);
        const yLength = Math.abs(by - ay);
        const w = dire.match(/左|右/i) ? bx - ax : by - ay;
        context.beginPath();
        // 上
        if (dire == "上") {
            by += arrowW;
            bx += offsetX;
            if (ax == bx) { ax -= keke_linePileOffset; }
            const middleY= by > ay || yLength < minLength ? by + minLength : ay + w * 0.5;
            context.moveTo(ax, ay);
            context.lineTo(bx, middleY);
        // 下
        } else if (dire == "下") {
            by += -arrowW;
            bx += offsetX;
            if (ax == bx) { ax -= keke_linePileOffset; }
            const middleY= by < ay || yLength < minLength ? by - minLength : ay + w * 0.5;
            context.moveTo(ax, ay);
            context.lineTo(bx, middleY);
        // 左
        } else if (dire == "左") {
            bx += arrowW;
            by += offsetY;
            if (ay == by) { ay += keke_linePileOffset; }
            const middleX= bx > ax || xLength < minLength ? bx + minLength : ax + w * 0.5;
            context.moveTo(ax, ay);
            context.lineTo(middleX, by);

        // 右
        } else if (dire == "右") { 
            bx += -arrowW;
            by += offsetY;
            if (ay == by) { ay += keke_linePileOffset; }
            const middleX= bx < ax || xLength < minLength ? bx - minLength : ax + w * 0.5;
            context.moveTo(ax, ay);
            context.lineTo(middleX, by);
        }
        context.lineTo(bx, by);
        context.stroke();
    };

    //- 矢印の線描画
    function strokeArrow(context, ax, ay, bx, by, dire, offsetX, offsetY, lineW, ow, isOutLine) {
        const arrowW = keke_lineArrowSize;
        const middleW = Math.max((arrowW * 2 - lineW - ow * 2) / 2, 1);
        const sharp = arrowW / 20;
        context.beginPath();
        // 上
        if (dire == "上") {
            bx += offsetX;
            if (ax == bx) { ax -= keke_linePileOffset; }
            context.beginPath();
            context.moveTo(bx, by);
            context.lineTo(bx - arrowW, by + arrowW);
            context.lineTo(bx, by);
            context.lineTo(bx + arrowW, by + arrowW);
            if (isOutLine) {
                context.lineTo(bx + arrowW - middleW, by + arrowW - sharp);
                context.moveTo(bx - arrowW + middleW, by + arrowW - sharp);
            }
            context.lineTo(bx - arrowW, by + arrowW);
        // 下
        } else if (dire == "下") {
            bx += offsetX;
            if (ax == bx) { ax -= keke_linePileOffset; }
            context.beginPath();
            context.moveTo(bx, by);
            context.lineTo(bx - arrowW, by - arrowW);
            context.lineTo(bx, by);
            context.lineTo(bx + arrowW, by - arrowW);
            if (isOutLine) {
                context.lineTo(bx + arrowW - middleW, by - arrowW + sharp);
                context.moveTo(bx - arrowW + middleW, by - arrowW + sharp);
            }
            context.lineTo(bx - arrowW, by - arrowW);
        // 左
        } else if (dire == "左") {
            by += offsetY;
            if (ay == by) { ay += keke_linePileOffset; }
            context.beginPath();
            context.moveTo(bx, by);
            context.lineTo(bx + arrowW, by - arrowW);
            context.lineTo(bx, by);
            context.lineTo(bx + arrowW, by + arrowW);
            if (isOutLine) {
                context.lineTo(bx + arrowW - sharp, by + arrowW - middleW);
                context.moveTo(bx + arrowW - sharp, by - arrowW + middleW);
            }
            context.lineTo(bx + arrowW, by - arrowW);
        // 右
        } else if (dire == "右") {
            by += offsetY;
            if (ay == by) { ay += keke_linePileOffset; }
            context.beginPath();
            context.moveTo(bx, by);
            context.lineTo(bx - arrowW, by - arrowW);
            context.lineTo(bx, by);
            context.lineTo(bx - arrowW, by + arrowW);
            if (isOutLine) {
                context.lineTo(bx - arrowW + sharp, by + arrowW - middleW);
                context.moveTo(bx - arrowW + sharp, by - arrowW + middleW);
            }
            context.lineTo(bx - arrowW, by - arrowW)
        }
        context.lineTo(bx, by);
        context.stroke();
        context.fill();
    };


    //- 受容ラインの選択
    function saveReceptLine(target, subject) {
        if (!target._receptLinesKe) { target._receptLinesKe = []; }
        const recepts = target._receptLinesKe;
        let receptIndex = 0;
        // 攻撃者ID
        const subjectId = battlerToData(subject);
        // 空きがあったらそこを選択
        let saved = false;
        recepts.forEach((slot, i) => {
            if (!slot && !saved) {
                recepts[i] = subjectId;
                receptIndex = i;
                saved = true;
            }
        });
        // 空きがなかったら末尾を選択
        if (!saved) {
            recepts.push(subjectId);
            receptIndex = recepts.length - 1;
        }
        return receptIndex;
    };

    //- 受容ラインの消去
    function delReceptLine(target, subject) {
        if (!target || !target._receptLinesKe) { return; }
        const recepts = target._receptLinesKe;
        // 行動者のスロットがあったら消去
        recepts.forEach((slot, i) => {
            if (dataToBattler(slot) == subject) {
                recepts[i] = null;
            }
        });
    };

    //- 受容ラインの初期化
    function initReceptLine() {
        $gameParty.battleMembers().forEach(target => {
            target._receptLinesKe = null;
        });
    };


    //- ターゲットラインのリチルド
    function rechildTargetLine() {
        const layerId = keke_lineLayer == "ウインドウより上" ? "C" : "A";
        // ラインを全て取得
        const allLines = [];
        $gameTroop.aliveMembers().forEach(enemy => {
            const sprite = searchSpriteBattler(enemy);
            if (!sprite) { return false; }
            const lines = sprite._targetLinesKe;
            if (!lines || !lines.list.length) { return false; }
            allLines.push(lines);
        });
        if (!allLines.length) { return; }
        // ラインを長さが長い順にソート
        allLines.sort((a, b) => b.length - a.length);
        // ワイヤーを再チルド
        allLines.forEach(lines => {
            lines.list.forEach(sprite => {
                // ワイヤーでなければ除外
                if (!sprite._isWireKe) { return; }
                childLayer(sprite, layerId);
            });
        });
        // 矢印を再チルド
        allLines.forEach(lines => {
            lines.list.forEach(sprite => {
                // 矢印でなければ除外
                if (!sprite._isArrowKe) { return; }
                childLayer(sprite, layerId);
            });
        });
    };


    //- ターゲットラインの消去
    function delTargetLine(subject) {
        // ターゲットライン作成フラグを消去
        subject._makesTargetLineKe = null;
        if (!subject) { return; }
        // ラインを取得
        const sprite = searchSpriteBattler(subject);
        if (!sprite) { return; }
        const lines = sprite._targetLinesKe;
        if (!lines || !lines.list.length) { return; }
        // 全てのラインに対して処理
        lines.list.forEach(sprite => {
            // スプライト破棄
            sprite.parent.removeChild(sprite);
            sprite.destroy();
            // 受容ラインの消去
            delReceptLine(dataToBattler(sprite._targetIdKe), subject)
        });
        sprite._targetLinesKe = null;
    };



    //==================================================
    //--  ターゲットライン-アニメ
    //==================================================

    //- スプライトセット・バトル/バトル背景の更新(処理追加)
    const _Spriteset_Battle_updateBattleback = Spriteset_Battle.prototype.updateBattleback;
    Spriteset_Battle.prototype.updateBattleback = function() {
        // ターゲットライン周期の更新
        updateTargetLineCycle();
        
        _Spriteset_Battle_updateBattleback.apply(this);
    };

    //- ターゲットライン周期の更新
    function updateTargetLineCycle() {
        const gt = $gameTemp;
        if (gt._tlFlickerDurationKe == null) { gt._tlFlickerDurationKe = 45; }
        gt._tlFlickerDurationKe--;
        if (gt._tlFlickerDurationKe <= 0) {
            gt._tlFlickerDurationKe = 45;
        }
    };


    //- ターゲットライン明滅の更新
    function updataTargetLineFlicker(subject, sprite) {
        const lines = sprite._targetLinesKe;
        if (!lines || !lines.list.length) { return; }
        if (lines.list[0]._fadeKe || !lines.list[0]._visibleKe) { return; }
        // 全てのラインに対して処理
        lines.list.forEach(sprite => {
            // 明滅の更新
            updataFlicker(sprite);
        });
    };

    //- 明滅の更新
    function updataFlicker(sprite) {
        // 明滅の開始
        startFlicker(sprite);
        // 明滅の処理
        processFlicker(sprite);
    };

    //- 明滅の開始
    function startFlicker(sprite) {
        if (sprite._flickerKe) { return; }
        const d = {};
        d.start = 64;
        d.target = 255;
        d.timeMax = 45;
        d.easing = "eo";
        d.duration = $gameTemp._tlFlickerDurationKe || d.timeMax;
        d.current = d.start;
        sprite._flickerKe = d;
    };

    //- 明滅の処理
    function processFlicker(sprite) {
        if (!sprite._flickerKe) { return; }
        const d = sprite._flickerKe;
        // カウントを減らす
        d.duration--;
        // ターンの処理
        //d.current = processTurn(d.current, d.start, d.target, d.duration + 1, d.timeMax);
        d.current = processEasing(d.current, d.target, d.duration + 1, d.timeMax, d.easing);
        sprite.opacity = d.current;
        // ループ
        if (d.duration <= 0) {
            d.duration = d.timeMax;
            d.current = d.start;
        }
    };


    //- ターゲットラインの可視更新
    function updateTargetLineVisible(subject, subjectSprite) {
        if (!subjectSprite._targetLinesKe || !subjectSprite._targetLinesKe.list.length) { return; }
        let valid = true;
        while (true) {
            if (!isTargetLineShow(subject) || !isValidPrediction(subject)) { valid = false;  break; }
            if ($gameTemp._uiHideKeSmrc) { valid = false;  break; }
            if (BattleManager._phase == "battleEnd") { valid = false;  break; }
            if (BattleManager.actor()) { valid = true;  break; }
            if (subject.isRestricted()) { valid = false;  break; }
            if (keke_lineOnlyInput && !BattleManager.actor()) { valid = false;  break; }
            //if (isActing(subject) && !BattleManager.actor()) { valid = false;  break; }
            break;
        }
        // スプライトフェードの更新
        const lines = subjectSprite._targetLinesKe.list;
        updateSpriteFade(lines[0], valid, keke_actFadeTime, lines);
        lines[0]._visibleKe = valid;
        /*subjectSprite._targetLinesKe.list.forEach(line => {
            line.visible = valid;
        });*/
    };

    // ターゲットラインを表示するか
    function isTargetLineShow(subject) {
        if (getPredictionCfg(subject, "ラインあり")) { return true; };
        if (getPredictionCfg(subject, "ラインなし")) { return false; };
        return keke_lineShow;
    };



    //==================================================
    //--  行動予測中ステート
    //==================================================

    //- 行動予測中ステートの処理
    function processInPredictionState(battler, actions) {
        // 行動予測中ステートのクリア
        clearInPredictionState(battler)
        if (!actions.length) { return; }
        // 全てのアクションを処理
        actions.forEach(action => {
            // 行動予測中ステートIDの取得
            const stateId = getInPredictionStateId(action);
            if (!stateId) { return; }
            // 行動予測中ステートのセット
            setInPredictionState(battler, stateId);
        });
    };

    //- 行動予測中ステートIDの取得
    function getInPredictionStateId(action) {
        const item = action.item();
        // メモ欄からステートIDを取得
        const metas = metaAll(item.note, ["行動予測中ステート", "inPredictionState"])
        if (!metas || !metas.length) { return null; }
        return Number(metas[metas.length - 1]);
        
    };

    //- 行動予測中ステートのセット
    function setInPredictionState(battler, stateId) {
        // ステートを付与
        battler.addState(stateId);
        // 付与したステートIDを保存
        if (!battler._addedInPredictionStatesKe) { battler._addedInPredictionStatesKe = []; }
        battler._addedInPredictionStatesKe.push(stateId);
    };

    //- 行動予測中ステートのクリア
    function clearInPredictionState(battler) {
        if (!battler._addedInPredictionStatesKe) { return; }
        battler._addedInPredictionStatesKe.forEach(stateId => battler.removeState(stateId));
        battler._addedInPredictionStatesKe = [];
    };


    //- 行動予測中ステートのクリア-全員
    function clearInPredictionStateAll() {
        $gameParty.members().forEach(actor => {
            clearInPredictionState(actor);
        });
    };



    //==================================================
    //--  共通開始
    //==================================================

    //- バトルマネージャー/スタートアクション(処理追加)
    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        _BattleManager_startAction.apply(this);

        // 再決定の処理
        processRedo(this._subject, this._targets, this._action);
        // 行動予測中ステートのクリア
        //clearInPredictionState(this._subject);
    };



    //===============================================
    //--  共通終了
    //==================================================

    //- バトルマネージャー/バトル終了(処理追加)
    const _BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        _BattleManager_endBattle.apply(this, arguments);

        // ターゲット先行作成の消去-全員
        delTargetFastAll();
        // 受容ラインの初期化
        initReceptLine();
        // 行動予測中ステートのクリア-全員
        clearInPredictionStateAll();
    };


    //- スプライトセット・バトル/破棄(処理追加)
    const _Spriteset_Battle_destroy = Spriteset_Battle.prototype.destroy
    Spriteset_Battle.prototype.destroy = function(options) {
        // スプライトの全破棄
        destroySpriteAll(this);
        
        _Spriteset_Battle_destroy.apply(this, arguments);
    };

    //- スプライトの全破棄
    function destroySpriteAll(spriteset) {
        const layers = spriteset._predictionLayersKe;
        if (!layers) { return; }
        // 全てのレイヤーに対して処理
        Object.keys(layers).forEach(key => {
            // スプライトの破棄
            destroySprite(layers[key]);
        });
        spriteset._predictionLayersKe = null;
    };

    //- スプライトの破棄
    function destroySprite(sprite) {
        if (!sprite) { return; }
        sprite.children.forEach(s => destroySprite(s));
        if (sprite.bitmap && !sprite.bitmap._url) { sprite.bitmap.destroy(); }
        if (sprite._texture) { sprite.destroy(); }
    };



    //==================================================
    //--  配列基本 /ベーシック
    //==================================================
    
    //- ハッシュのディープコピー
    function copyHash(hash) {
        const copy = {};
        Object.keys(hash).forEach(k => {
            if (!hash[k]) { copy[k] = hash[k];  return; }
            if (hash[k].constructor.name == "Object") {
                copy[k] = copyHash(hash[k]);
            } else if (hash[k].constructor.name == "Array") {
                copy[k] = copyArray(hash[k]);
            } else {
                copy[k] = hash[k];
            }
        });
        return copy;
    };
    
    //- 配列のディープコピー
    function copyArray(array) {
        const copy = [];
        array.forEach((v, i) => {
            if (v.constructor.name == "Object") {
                copy[i] = copyHash(v);
            } else if (v.constructor.name == "Array") {
                copy[i] = copyArray(v);
            } else {
                copy[i] = v;
            }
        });
        return copy;
    };



    //==================================================
    //--  バトラー基本 /ベーシック
    //==================================================

    //- バトラーをデータへ
    function battlerToData(battler) {
        if (battler._actorId) {
            return { type:"actor", id:battler._actorId, isData:true }
        } else {
            return { type:"enemy", index:battler.index(), isData:true }
        }
    };
    
    //- データをバトラーへ
    function dataToBattler(data) {
        if (!data) { return null; }
        if (data.type == "actor") {
            return $gameParty.allMembers().find(actor => actor._actorId == data.id);
        } else {
            return $gameTroop.members()[data.index];
        }
    };

    //- 自動戦闘中か
    function isAutoBattle(battler) {
        if (!battler) { return false; }
        return battler.isAutoBattle();
    };



    //==================================================
    //--  スプライト基本 /ベーシック
    //==================================================
    
    //- スプライトの検索-バトラー
    function searchSpriteBattler(battler) {
        const spriteset = SceneManager._scene._spriteset;
        let result = null;
        const sprites = battler._enemyId ? spriteset._enemySprites : spriteset._actorSprites;
        for (const sprite of sprites) {
            if(!sprite._battler) { continue; }
            if ((battler._actorId && sprite._battler._actorId == battler._actorId) || (battler._enemyId && sprite._battler.index() == battler.index())) {
                result = sprite;
                break;
            }
        }
        return result;
    };

    //- ポイント間の距離
    function pointDistance(ax, ay, bx, by) {
        return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
    };

    //- スプライトフェードの更新
    function updateSpriteFade(sprite, visible, fadeTime, sprites) {
        if (visible && !sprite._visiblePreKe) {
            startSpriteFade(sprite, fadeTime, 255, sprites);
        } else if (!visible && sprite._visiblePreKe) {
            startSpriteFade(sprite, fadeTime, 0, sprites);
        }
        sprite._visiblePreKe = visible;
        return doSpriteFade(sprite, sprites);
    };

    //- スプライトフェードの開始
    function startSpriteFade(sprite, fadeTime, fadeEnd, sprites) {
        sprites = sprites ? sprites : [sprite];
        const opacity = sprites[0].opacity;
        const fade = {};
        fade.timeMax = fadeTime || 1;
        fade.duration = fade.timeMax;
        fade.end = fadeEnd;
        fade.speed = (fade.end - opacity) / fade.timeMax;
        if (fade.end) { sprites.forEach(sprite => sprite.visible = true); }
        sprite._fadeKe = fade;
    };

    //- スプライトフェードの実行
    function doSpriteFade(sprite, sprites) {
        if (!sprite._fadeKe) { return false; }
        const fade = sprite._fadeKe;
        sprites = sprites ? sprites : [sprite];
        sprites.forEach(sprite => sprite.opacity += fade.speed);
        fade.duration--;
        if (fade.duration <= 0) {
            sprites.forEach(sprite => {
                sprite.opacity = fade.end
                if (!sprite.opacity) { sprite.visible = false; }
            }); 
            sprite._fadeKe = null;
        }
        return true;
    };



    //==================================================
    //--  メタ取得 /ベーシック
    //==================================================
    
    //- 全てのメタの合算-配列
    function bundleAllMeta_array(battler, words, action, noDelSpace, ratioIndex) {
        let data = null
        let array = [];
        // バトラー値
        if (battler) {
            data = battler._actorId ? battler.actor() : battler.enemy();
            if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
            if (battler._actorId) {
                // 職業値
                data = battler.currentClass();
                if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
                // 装備値
                battler._equips.forEach(equip => {
                    data = equip.object();
                    if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
                });
            }
            // ステート値
            battler._states.forEach(stateId => {
                data = $dataStates[stateId];
                if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
            });
        }
        // アクション値
        if (action) {
            data = action.item ? action.item() : action;
            if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
        }
        // 空の要素は削除
        array = array.filter(e => e);
        return array;
    };
    
    //- 全取得メタ
    function metaAll(note, words, noDelSpace, ratioIndex) {
        let result = [];
        words.forEach(word => {
            // 複数用と単体用の正規表現を作成
            const regText = '\<' + word + ':([^\>]*)\>';
            const regExp_g = new RegExp(regText, 'gi');
            const regExp = new RegExp(regText, 'i');
            // マッチ判定
            let matches = note.match(regExp_g);
            if (matches) {
                // 全てのマッチを処理
                matches.forEach(function(line) {
                    const match = line.match(regExp);
                    // 成功率として扱う引数の処理
                    const vals = match[1].replace(/\s/g, "").split(",");
                    const ratioIndexEx = ratioIndex - 1;
                    if (ratioIndex && vals[ratioIndexEx] && Math.randomInt(100) >= Number(vals[ratioIndexEx])) {
                        return;
                    }
                    let str = match[1];
                    // スペースを削除
                    if (str && !noDelSpace) { str = str.replace(/\s/g, ""); }
                    result.push(str);
                });
            }
        });
        return result;
    };



    //==================================================
    //--  イージング /ベーシック
    //==================================================

    //- イージングの処理
    function processEasing(current, target, duration, timeMax, easing, easingRate = 1) {
        const lt = calcEasing((timeMax - duration) / timeMax, easing, easingRate);
        const t = calcEasing((timeMax - duration + 1) / timeMax, easing, easingRate);
        const start = (current - target * lt) / (1 - lt);
        return start + (target - start) * t;
    };

    //- イージングの計算
    function calcEasing(t, easing, easingRate = 1) {
        const exponent = 2 * easingRate;
        switch (easing.toUpperCase()) {
            case "EI":
                return easeIn(t, exponent);
            case "EO":
                return easeOut(t, exponent);
            case "E":
                return easeInOut(t, exponent);
            default:
                return t;
        }
    };

    //- 各イージング処理
    function easeIn(t, exponent) {
        return Math.pow(t, exponent) || 0.001;
    };
    
    function easeOut(t, exponent) {;
        return 1 - (Math.pow(1 - t, exponent) || 0.001);
    };
    
    function easeInOut(t, exponent) {
        if (t < 0.5) {
            return easeIn(t * 2, exponent) / 2;
        } else {
            return easeOut(t * 2 - 1, exponent) / 2 + 0.5;
        }
    };



    //==================================================
    //--  アイコンスプライト /ベーシック
    //==================================================
    
    //- アイコンスプライトの形成
    function createIconSprite(iconIndex, anchorX, anchorY) {
        const baseSprite = new SpriteKePrds();
        baseSprite.anchor.x = anchorX || 0.5;
        baseSprite.anchor.y = anchorY || 0.5;
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (iconIndex % 16) * pw;
        const sy = Math.floor(iconIndex / 16) * ph;
        if (isIconBackDraw()) {
            const backSprite = new SpriteKePrds(new Bitmap(pw, ph));
            backSprite.anchor.x = anchorX || 0.5;
            backSprite.anchor.y = anchorY || 0.5;
            drawIconBack(backSprite.bitmap, iconIndex);
            baseSprite.addChild(backSprite)
        }
        const iconSprite = new SpriteKePrds();
        const bitmap = ImageManager.loadSystem("IconSet");
        iconSprite.bitmap = bitmap;
        iconSprite.anchor.x = anchorX || 0.5;
        iconSprite.anchor.y = anchorY || 0.5;
        iconSprite.setFrame(sx, sy, pw, ph);
        baseSprite.addChild(iconSprite)
        return baseSprite;
    };



    //==================================================
    //--  エフェクト /ベーシック
    //==================================================

    //- エフェクトの実行
    function doEffect(effect, subject, target) {
        target = target || subject;
        // アニメの表示
        showAnime(subject, target, effect["アニメーション"]);
        // 効果音の再生
        playSe(effect["効果音"]); 
        // 画面フラッシュの表示
        showScreenFlash(effect);
        // 画面ストップの開始
        startScreenStop(effect["ヒットストップ"]);
        // フリーアニメ・スキルの実行
        doFreeAnimeSkill(subject, target, effect["フリーアニメ"]);
    };

    //- アニメの表示
    function showAnime(subject, target, animeId) {
        if (!animeId) { return; }
        Window_BattleLog.prototype.showAnimation(subject, [target], animeId);
    };

    //- 効果音の再生
    function playSe(ses) {
        if (!ses || !ses.length) { return; }
        ses.forEach(se => {
            if (!se) { return; }
            AudioManager.playSe({ name:se["ファイル"], volume:se["音量"], pitch:se["ピッチ"], pan:se["位相"] });
        });
        
    };

    //- 画面フラッシュの表示
    function showScreenFlash(d) {
        if (!d["画面フラッシュ"] || !d["…フラッシュ色" || !d["…フラッシュ時間"]]) { return; }
        const delay = d["…フラッシュ遅延"] || 0;
        if (delay) {
            setTimeout(screenFlash, delay * 1000 / 60, d);
        } else {
            screenFlash(d);
        }
    };

    //- 画面フラッシュ
    function screenFlash(d) {
        $gameScreen.startFlash(d["…フラッシュ色"], d["…フラッシュ時間"]);
    };

    //- 画面ストップの開始
    function startScreenStop(str) {
        if (!PluginManager._scripts.some(n => n == "Keke_HitStop")) { return; }
        // 画面ストップ
        $gameTemp.screenStopKe(str);
    };

    //- フリーアニメ・スキルの実行
    function doFreeAnimeSkill(subject, target, note) {
        if (!isFreeAnime() || !note) { return; }
        // アニメファイルとコモンを取得
        const metaList = metaAll(note, ["フリーアニメ", "freeAnime"]);
        if (!metaList || !metaList.length) { return; }
        metaList.forEach(meta => {
            //-フリーアニメ・スキルの実行-個別
            BattleManager.doFreeAnimeSkillKe(meta, subject, [target]);
        });
    };



    //==================================================
    //--  図形描画 /ベーシック
    //==================================================
    
     // スクエアの塗り潰し
     function fillSquare(bitmap, x, y, width, height, color = "rgba(0,0,0,1)",  round = 0, corner = "") {
        const context = bitmap.context;
        context.save();
        context.fillStyle = color;
        designSquare(bitmap, x, y, width, height,  round, corner);
        context.fill();
        context.restore();
        bitmap._baseTexture.update();
    };
    
    //- スクエアの線画
    function strokeSquare(bitmap, x, y, width, height, color = "rgba(0,0,0,1)", lineW = 1,  round = 0, corner = "", tsuno = {}, dire = "") {
        const context = bitmap.context;
        context.save();
        context.strokeStyle = color;
        context.lineWidth = lineW;
        designSquare(bitmap, x, y, width, height,  round, corner, tsuno, dire, lineW);
        context.stroke();
        context.restore();
        bitmap._baseTexture.update();
    };
    
    //- スクエアのデザイン
    function designSquare(bitmap, x, y, width, height,  round = 0, corner = "", tsuno = {}, dire = "", lineW = 0) {
        const context = bitmap.context;
        context.beginPath();
        const c1 = corner.includes("1") ? 0 : round;    // 左上
        const c2 = corner.includes("2") ? 0 : round;    // 左下
        const c3 = corner.includes("3") ? 0 : round;    // 右上
        const c4 = corner.includes("4") ? 0 : round;    // 右下
        context.moveTo(x +  c1, y);
        if (tsuno.w && dire == "下") {
            context.lineTo(x + width / 2 + tsuno.o - tsuno.w / 2, y);
            context.moveTo(x + width / 2 + tsuno.o + tsuno.w / 2, y);
        }
        context.lineTo(x + width -  c3, y);
        context.quadraticCurveTo(x + width, y, x + width, y +  c3);
        context.lineTo(x + width, y + height -  c4);
        context.quadraticCurveTo(x + width, y + height, x + width -  c4, y + height);
        if (tsuno.w && dire == "上") {
            context.lineTo(x + width / 2 + tsuno.o + tsuno.w / 2, y + height);
            context.moveTo(x + width / 2 + tsuno.o - tsuno.w / 2, y + height);
        }
        context.lineTo(x +  c2, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height -  c2);
        context.lineTo(x, y + c1);
        if (c1) {
            context.quadraticCurveTo(x, y, x + c1, y);
        } else {
            context.lineTo(x, y - lineW / 2);
        }
    };
    
})();