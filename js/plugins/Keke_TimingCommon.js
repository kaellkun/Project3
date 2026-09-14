//=============================================================================
//  Keke_TimingCommon - タイミングコモン
// バージョン: 1.3.8
//=============================================================================
// Copyright (c) 2022 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================
// Project3 local compatibility modifications (2026-09-15): see @help below.

/*:
 * @target MZ
 * @plugindesc 特定のタイミングでコモンを差し込む
 * @author ケケー
 * @url https://kekeelabo.com
 * 
 * @help
 * 【ver.1.3.8】
 * 【Project3 ローカル互換修正 / 2026-09-15】
 * ・プラグインURLのクエリ/フラグメント（キャッシュ対策の ?v 等）に対応。
 * ・Spriteset生成前の取得でも設定辞書を初期化（保存済み設定は維持）。
 * ・$gameMap未生成時の取得/実行中判定/シーン更新をスキップ。
 * ・saveActionDataのsubjectをローカル変数化（グローバル汚染防止）。
 * 上記以外の原作者のタイミング/ゲーム処理は変更していません。
 *
 * 特定のタイミングでコモンイベントを自動で差し込む
 * ◎ニューゲーム
 * ◎データロード
 * ◎場所移動
 * ◎メニュー
 * ◎バトル開始
 * ◎バトル勝利
 * ◎バトル逃走
 * ◎バトル敗北
 * ◎ゲームオーバー
 * ◎味方アクション
 * ◎敵アクション
 * ◎味方HPMPTPゼロ
 * ◎敵HPMPTPゼロ
 * 
 * 
 * ● 使い方 ●
 * プラグインパラメータで、各タイミングごとの実行コモンを設定する
 * ゲーム中に無効化/有効化したり、
 * 実行コモンを変更したい場合はプラグインコマンドで
 *
 * 【注釈】アクションコモン変数
 * アクションコモンは戦闘中、バトラーのアクション前後に実行するコモン
 * その際、特定の変数に行動者ID、スキルID、アイテムIDを自動で入れることができる
 * 行動者IDには味方の場合はアクターIDが、敵の場合は敵キャラIDが入る
 * 行動がスキルの場合はスキルIDが、アイテムの場合はアイテムIDが入る
 * 
 *
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 *
 *
 *
 * Automatically insert common events at specific timings
 * ◎ New Game
 * ◎ Data loading
 * ◎ Move location
 * ◎ Menu
 * ◎ Battle begins
 * ◎ Battle Victory
 * ◎ Battle Escape
 * ◎ Battle defeat
 * ◎ Game Over
 * ◎ Friendly action
 * ◎ Enemy actions
 * ◎ Actor HP/MP/TP zero
 * ◎ Enemy HP/MP/TP zero
 * 
 * ● How to use ●
 * Set the execution common for each timing with the plug-in parameter
 * disable/enable in-game,
 * If you want to change the execution common, use the plugin command
 *
 * [Note] Action common variable
 * Action commons are commons that are executed before
 *   and after the battler's action during battle.
 * At that time, you can automatically put the actor ID, skill ID,
 *   and item ID into a specific variable
 * Actor ID includes Actor ID for allies and Enemy ID for enemies
 * If the action is a skill, enter the skill ID.
 *   If the action is an item, enter the item ID.
 *
 *
 * ● Terms of Use ●
 * Feel free to use it under the MIT license.
 * 
 * 
 * 
 * @param コモン-ニューゲーム
 * @desc ニューゲーム時に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-データロード
 * @desc データロード時に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-場所移動-前
 * @desc 場所移動前に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-場所移動-後
 * @desc 場所移動後に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-メニュー開く
 * @desc メニューを開く時に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-メニュー閉じ
 * @desc メニューを閉じる時に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-バトル開始-前
 * @desc バトル開始前に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-バトル開始-後
 * @desc バトル開始後に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-バトル勝利-前
 * @desc バトル勝利時の遷移前に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-バトル勝利-後
 * @desc バトル勝利時の遷移後に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-バトル逃走-前
 * @desc バトル逃走時の遷移前に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-バトル逃走-後
 * @desc バトル逃走時の遷移後に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-バトル敗北-前
 * @desc バトル敗北時の遷移前に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-バトル敗北-後
 * @desc バトル敗北時の遷移後に実行するコモンイベント
 * @type common_event
 *
 * @param コモン-ゲームオーバー
 * @desc ゲームオーバー時に実行するコモンイベント。全滅してゲームオーバーになった場合、回復しないとコモンを繰り返すので注意
 * @type common_event
 *
 * @param コモン-味方アクション-前
 * @desc 戦闘中、味方がスキル/アイテムを使う直前に実行するコモンイベント。this._subject に行動者が入る
 * @type common_event
 *
 * @param コモン-味方アクション-後
 * @desc 戦闘中、味方がスキル/アイテムを使った直後に実行するコモンイベント。this._subject に行動者が入る
 * @type common_event
 *
 * @param コモン-敵アクション-前
 * @desc 戦闘中、敵がスキル/アイテムを使う直前に実行するコモンイベント。this._subject に行動者が入る
 * @type common_event
 *
 * @param コモン-敵アクション-後
 * @desc 戦闘中、敵がスキル/アイテムを使った直後に実行するコモンイベント。this._subject に行動者が入る
 * @type common_event
 * 
 * @param コモン-味方HPゼロ
 * @desc 戦闘中、味方のHPが 0 になった瞬間に実行するコモンイベント。this._subject に主体が入る
 * @type common_event
 * 
 * @param コモン-味方MPゼロ
 * @desc 戦闘中、味方のMPが 0 になった瞬間に実行するコモンイベント。this._subject に主体が入る
 * @type common_event
 * 
 * @param コモン-味方TPゼロ
 * @desc 戦闘中、味方のTPが 0 になった瞬間に実行するコモンイベント。this._subject に主体が入る
 * @type common_event
 * 
 * @param コモン-敵HPゼロ
 * @desc 戦闘中、敵のHPが 0 になった瞬間に実行するコモンイベント。this._subject に主体が入る
 * @type common_event
 * 
 * @param コモン-敵MPゼロ
 * @desc 戦闘中、敵のMPが 0 になった瞬間に実行するコモンイベント。this._subject に主体が入る
 * @type common_event
 * 
 * @param コモン-敵TPゼロ
 * @desc 戦闘中、敵のTPが 0 になった瞬間に実行するコモンイベント。this._subject に主体が入る
 * @type common_event
 * 
 * @param アクションコモン変数
 *
 * @param 変数-行動者ID
 * @parent アクションコモン変数
 * @desc アクションコモン時の行動者のIDを入れる変数。アクターならアクターID、敵キャラなら敵キャラID
 * @type variable
 *
 * @param 変数-スキルID
 * @parent アクションコモン変数
 * @desc アクションコモン時の使用スキルのIDを入れる変数
 * @type variable
 *
 * @param 変数-アイテムID
 * @parent アクションコモン変数
 * @desc アクションコモン時の使用アイテムのIDを入れる変数
 * @type variable
 *
 * @param 変数-対象が敵か味方か
 * @parent アクションコモン変数
 * @desc アクションコモン時の行動対象が敵か味方かを入れる変数。敵なら 0、味方なら 1
 * @type variable
 *
 * @param 変数-対象ID
 * @parent アクションコモン変数
 * @desc アクションコモン時の行動対象のIDを入れる変数。アクターならアクターID、敵キャラなら敵キャラのID
 * @type variable
 *
 * @param 変数-対象ID全て
 * @parent アクションコモン変数
 * @desc アクションコモン時の行動対象全てのIDを配列として入れる変数
 * @type variable
 * 
 * @param 変数-対象インデックス
 * @parent アクションコモン変数
 * @desc アクションコモン時の行動対象のインデックスを入れる変数。アクターならアクターインデックス、敵キャラなら敵キャラインデックス
 * @type variable
 *
 * @param 変数-対象インデックス全て
 * @parent アクションコモン変数
 * @desc アクションコモン時の行動対象全てのインデックスを配列として入れる変数
 * @type variable
 * 
 * @param 変数-対象インデックス全て
 * @parent アクションコモン変数
 * @desc アクションコモン時の行動対象全てのインデックスを配列として入れる変数
 * @type variable
 * 
 * @param 変数-ゼロバトラーID
 * @parent アクションコモン変数
 * @desc HP/MP/TPがゼロになったバトラーのIDを入れる変数。アクターならアクターID、敵キャラなら敵キャラID
 * @type variable
 * 
 * @param アクション後コモン遅延
 * @desc delayActionAfterCommon アクション後コモンの発動タイミングをスキルのコモンイベントの後にする
 * @type boolean
 * @default false
 *
 *
 *
 *
 * @command タイミングコモン有効/無効
 * @desc 各タイミングコモンを有効/無効を切り替える
 *
 * @arg コモン-ニューゲーム
 * @desc ニューゲーム時に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-データロード
 * @desc データロード時に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-場所移動-前
 * @desc 場所移動前に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-場所移動-後
 * @desc 場所移動後に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-メニュー開く
 * @desc メニューを開く時に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-メニュー閉じ
 * @desc メニューを閉じる時に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-バトル開始-前
 * @desc バトル開始前に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-バトル開始-後
 * @desc バトル開始後に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-バトル勝利-前
 * @desc バトル勝利時の遷移前に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-バトル勝利-後
 * @desc バトル勝利時の遷移後に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-バトル逃走-前
 * @desc バトル逃走時の遷移前に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-バトル逃走-後
 * @desc バトル逃走時の遷移後に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-バトル敗北-前
 * @desc バトル敗北時の遷移前に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-バトル敗北-後
 * @desc バトル敗北時の遷移後に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-ゲームオーバー
 * @desc ゲームオーバー時に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-味方アクション-前
 * @desc 戦闘中、味方がスキル/アイテムを使う直前に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-味方アクション-後
 * @desc 戦闘中、味方がスキル/アイテムを使った直後に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-敵アクション-前
 * @desc 戦闘中、敵がスキル/アイテムを使う直前に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 * @arg コモン-敵アクション-後
 * @desc 戦闘中、敵がスキル/アイテムを使った直後に実行するコモンイベントの有効/無効
 * @type boolean
 * @default 
 *
 *
 *
 * @command タイミングコモン全無効
 * @desc タイミングコモンを全て無効にする。個別の有効/無効より優先される
 *
 *
 *
 * @command タイミングコモン全無効解除
 * @desc タイミングコモンの全無効を解除する
 * 
 * 
 * 
 * @command 敵キャラの取得
 * @desc 敵キャラを取得する。このコマンド後に敵キャラ系のイベントコマンドを実行すると、取得した敵キャラを対象にできる
 * 
 * 
 * 
 * @command 敵キャラの解除
 * @desc 取得した敵キャラを解除する
 * 
 * 
 * 
 *
 *
 *
 * @command タイミングコモン変更
 * @desc 各タイミングコモンの使用コモンイベントを変更する
 *
 * @arg コモン-ニューゲーム
 * @desc ニューゲーム時に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-データロード
 * @desc データロード時に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-場所移動-前
 * @desc 場所移動前に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-場所移動-後
 * @desc 場所移動後に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-メニュー開く
 * @desc メニューを開く時に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-メニュー閉じ
 * @desc メニューを閉じる時に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-バトル開始-前
 * @desc バトル開始前に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-バトル開始-後
 * @desc バトル開始後に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-バトル勝利-前
 * @desc バトル勝利時の遷移前に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-バトル勝利-後
 * @desc バトル勝利時の遷移後に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-バトル逃走-前
 * @desc バトル逃走時の遷移前に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-バトル逃走-後
 * @desc バトル逃走時の遷移後に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-バトル敗北-前
 * @desc バトル敗北時の遷移前に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-バトル敗北-後
 * @desc バトル敗北時の遷移後に実行するコモンイベント
 * @type common_event
 * @default 
 *
 * @arg コモン-ゲームオーバー
 * @desc ゲームオーバー時に実行するコモンイベント。全滅した場合、回復しないとコモンを繰り返すので注意
 * @type common_event
 * @default 
 */
 
 
 
(() => {
    //- プラグイン名 (Project3: cache-busted URLs)
    const pluginName = document.currentScript.src.match(/^.*\/([^/?#]+)\.js(?:[?#].*)?$/)[1];
    
    
    
    //==================================================
    //--  公開メソッド
    //==================================================

    //- バトル前コモンがあるか(公開)
    Game_Temp.prototype.isBattlePreCommonKe = function() {
        return existCommonEvent("BattleStartPre");
    };
    
    //- タイミングコモン中か(公開)
    Game_Temp.prototype.inTimingCommonKe = function(...args) {
        return inTimingCommon(...args);
    };



    //==================================================
    //--  他プラグインからの引用メソッド
    //==================================================

    //- セーブのためのスナップショット(公開)
    function snapshotBySave() {
        if (!$gameTemp.snapshotBySaveKe) { return; }
        return $gameTemp.snapshotBySaveKe();
    };



    //==================================================
    //--  ファイル変数
    //==================================================
    
    // アクションコモン中フラグ
    let InPreActionCommon = null;
    // コモン無視フラグ
    let IgnoresCommon = null;
    // インタープリターのインデックス
    let InterpreterIndex = null;
    // ニューゲーム後フラグ
    let AfterNewGame = null;
    // ロード後フラグ
    let AfterLoad = null;
    // ゲームオーバー後フラグ
    let AfterGameOver = null;
    // 戦闘結果
    let BattleResult = "";
    // 戦闘終了コモン実行済みフラグ
    let DidBattleEndCommon = null;
    // 敵キャラインデックス
    let EnemyIndex = 0;
    // 敵キャラデータ
    let EnemyData = null;



    //==================================================
    //-- ワードの定義と変換
    //==================================================
    
    
    const Words = ["NewGame", "DataLoad", "TransfarPre", "TransfarAfter", "MenuOpen", "MenuClose", "BattleStartPre", "BattleStartAfter", "BattleVictoryPre",  "BattleVictoryAfter", "BattleEscapePre", "BattleEscapeAfter", "BattleLosePre", "BattleLoseAfter", "GameOver", "actorActionPre", "actorActionAfter", "enemyActionPre", "enemyActionAfter", "actorHpZero", "actorMpZero", "actorTpZero", "enemyHpZero", "enemyMpZero", "enemyTpZero"];
    
    const Jpns = ["ニューゲーム", "データロード", "場所移動-前", "場所移動-後", "メニュー開く", "メニュー閉じ", "バトル開始-前", "バトル開始-後", "バトル勝利-前",  "バトル勝利-後", "バトル逃走-前", "バトル逃走-後", "バトル敗北-前", "バトル敗北-後", "ゲームオーバー", "味方アクション-前", "味方アクション-後", "敵アクション-前", "敵アクション-後", "味方HPゼロ", "味方MPゼロ", "味方TPゼロ", "敵HPゼロ", "敵MPゼロ", "敵TPゼロ"];
    
    function toWord(jpn) {
        const index = Jpns.indexOf(jpn);
        if (index < 0) { return; }
        return Words[index];
    };
    
    function toJpn(word) {
        const index = Words.indexOf(word);
        if (index < 0) { return; }
        return Jpns[index];
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

    //- タイミングコモンの構築
    const keke_timingCommons = buildTimingCommon(parameters);

    //- アクションコモン変数
    const keke_varSubjectId = Number(parameters["変数-行動者ID"]);
    const keke_varSkillId = Number(parameters["変数-スキルID"]);
    const keke_varItemId = Number(parameters["変数-アイテムID"]);
    const keke_varTargetIs = Number(parameters["変数-対象が敵か味方か"]);
    const keke_varTargetId = Number(parameters["変数-対象ID"]);
    const keke_varTargetIdAll = Number(parameters["変数-対象ID全て"]);
    const keke_varTargetIndex = Number(parameters["変数-対象インデックス"]);
    const keke_varTargetIndexAll = Number(parameters["変数-対象インデックス全て"]);
    const keke_varZeroBattlerId = Number(parameters["変数-ゼロバトラーID"]);

    const keke_delayActionAfterCommon = toBoolean(parameters["アクション後コモン遅延"]);

    parameters = null;

    //- タイミングコモンの構築
    function buildTimingCommon(parameters) {
        const commons = {};
        Words.forEach(word => {
            commons[word] = Number(parameters["コモン-"+toJpn(word)]);
        });
        return commons;
    };
    
    

    //==================================================
    //--  プラグインコマンド
    //==================================================
    
    //- タイミングコモン有効/無効
    PluginManager.registerCommand(pluginName, "タイミングコモン有効/無効", args => {
        Jpns.forEach(jpn => {
            const param = args["コモン-" + jpn];
            if (param) { $gameMap._timingCommonInvalidsKe[toWord(jpn)] = !toBoolean(param); }
        });
    });
    
    
    //- タイミングコモン全無効
    PluginManager.registerCommand(pluginName, "タイミングコモン全無効", args => {
        $gameMap._noTimingCommonKe = true;
    });
    
    
    //- タイミングコモン全無効解除
    PluginManager.registerCommand(pluginName, "タイミングコモン全無効解除", args => {
        $gameMap._noTimingCommonKe = false;
    });
    
    
    //- タイミングコモン変更
    PluginManager.registerCommand(pluginName, "タイミングコモン変更", args => {
        Jpns.forEach(jpn => {
            const param = args["コモン-" + jpn];
            if (param) { $gameMap._timingCommonChangesKe[toWord(jpn)] = Number(param); }
        });
    });


    //- 敵キャラの取得
    PluginManager.registerCommand(pluginName, "敵キャラの取得", args => {
        if (!EnemyIndex) { return; }
        const enemyIndex = EnemyIndex;
        const enemy = $gameTroop.members()[enemyIndex];
        if (enemy) {
            PlcmPreter._enemyDataKeTmcm = { enemy:enemy, index:enemyIndex };
        }
    });


    //- 敵キャラの解除
    PluginManager.registerCommand(pluginName, "敵キャラの解除", args => {
        PlcmPreter._enemyDataKeTmcm = null;
    });


    
    //==================================================
    //--  コモンの初期化
    //==================================================

    //- スプライトセット・マップ/開始(処理追加)
    const _Spriteset_Map_initialize = Spriteset_Map.prototype.initialize;
    Spriteset_Map.prototype.initialize = function() {
        // タイミングコモンの初期化
        initTimingCommon();

        _Spriteset_Map_initialize.apply(this);
    };
    
    //- スプライトセット・バトル/開始(処理追加)
    const _Spriteset_Battle_initialize = Spriteset_Battle.prototype.initialize;
    Spriteset_Battle.prototype.initialize = function() {
        // タイミングコモンの初期化
        initTimingCommon();

        _Spriteset_Battle_initialize.apply(this);
    };

    //- タイミングコモンの初期化
    function initTimingCommon() {
        // Project3: early lookup / older saves; preserve each existing dictionary.
        if (!$gameMap) { return; }
        if (!$gameMap._timingCommonChangesKe) { $gameMap._timingCommonChangesKe = {}; }
        if (!$gameMap._timingCommonInvalidsKe) { $gameMap._timingCommonInvalidsKe = {}; }
    };
    
    

    //==================================================
    //--  コモンの実行
    //==================================================

    //- コモンイベントの呼び出し
    function callCommonEvent(word, handler, subject) {
        const commonId = getTimingCommon(word);
        if (!commonId) { return; }
        // コモンイベントの実行
        return exeCommonEvent(commonId, $gameMap, word, handler, subject);
    };
    
    //- タイミングコモンの取得
    function getTimingCommon(word) {
        if (!$gameMap) { return; }
        initTimingCommon(); // Project3: lookups can precede Spriteset initialization.
        if ($gameMap._noTimingCommonKe) { return; }
        if ($gameMap._timingCommonInvalidsKe[word]) { return; }
        return $gameMap._timingCommonChangesKe[word] || keke_timingCommons[word];
    };
    
    //- コモンイベントの実行
    function exeCommonEvent(commonId, body, word, handler, subject) {
        // コモンイベントを取得
        const commonEvent = $dataCommonEvents[commonId];
        if (!commonEvent || isListEmpty(commonEvent)) { return; }
        // 通常のインタープリターの停止
        stopNormalPreter();
        // インタープリターを作成
        const preter = new Game_Interpreter(0);
        preter.tCommonType = word;
        // 変数にセット
        if (!body._tCommonPretersKe) { body._tCommonPretersKe = []; }
        body._tCommonPretersKe.push({ preter:preter, handler:handler, word:word, subject:subject });
        // インタープリターに主体を保存
        preter._subject = subject;
        // セットアップ
        preter.setup(commonEvent.list);
        // コモンプリターの更新
        updateCommonPreter(body);
        return true;
    };

    //- リストが空か
    function isListEmpty(event) {
        const list = event.list;
        if (!list || !list.length) { return true; }
        if (!list[0].code) { return true; }
        return false;
    };

    //- 通常のインタープリターの停止
    function stopNormalPreter() {
        if (!$gameMap) { return; }
        $gameMap._interpreter._stopByTimingCommonKe = true;
        $gameTroop._interpreter._stopByTimingCommonKe = true;
    };


    //- コモンイベントがあるか
    function existCommonEvent(word) {
        const commonId = getTimingCommon(word);
        if (!commonId) { return false; }
        const commonEvent = $dataCommonEvents[commonId];
        if (!commonEvent) { return false;}
        return commonEvent.list.length; 
    };


    //- タイミングコモン中か
    function inTimingCommon(word, subject) {
        if (!$gameMap || !$gameMap._tCommonPretersKe) { return false; }
        return $gameMap._tCommonPretersKe.some(d => {
            if (!d.preter.isRunning()) { return false; }
            if (word && d.word != word) { return false; }
            if (subject && d.subject != subject) { return false; }
            return true;
        });
    };
    
    

    //==================================================
    //--  コモンの更新
    //==================================================

    //- シーンベース/更新(処理追加)
    const _Scene_Base_update = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        _Scene_Base_update.apply(this);

        // Project3: retain the base update before game objects exist.
        if (!$gameMap) { return; }
        // コモンプリターの更新
        updateCommonPreter($gameMap);
        // コモンハンドラの更新
        updateCommonHandler($gameMap);
    };

    //- コモンプリターの更新
    function updateCommonPreter(body) {
        // ウェイトを更新
        if (body._tCommonPreterWaitKe) { body._tCommonPreterWaitKe--; }
        if (!body._tCommonPretersKe || !body._tCommonPretersKe.length) { return; }
        // 全てのプリターを更新
        let del = true;
        body._tCommonPretersKe.forEach((d, i) => {
            if (!d) {
                body._tCommonPretersKe[i] = null;
                del = true;
                return;
            }
            const preter = d.preter;
            // バトル終了していたらウェイトモードを解除
            if (BattleManager._phase == "battleEnd") {
                preter._waitMode = null;
            }
            // コモンプリターを更新
            preter.update();
            // コモン単体の終了
            if (!preter.isRunning()) {
                body._tCommonPretersKe[i] = null;
                // ハンドラを実行
                if (d.handler) { d.handler(); }
                del = true;
            }
        });
        // null を消去
        if (del) {
            body._tCommonPretersKe = body._tCommonPretersKe.filter(d => d);
        }
        // プリターが空になったら終了
        if (!body._tCommonPretersKe.length) {
            // 通常のインタープリターの再開
            runNormalPreter();
            // ドット移動の停止を解除
            $gamePlayer._noDotMoveKe = false;
        }
    };

    //- 通常のインタープリターの再開
    function runNormalPreter() {
        if (!$gameMap) { return; }
        $gameMap._interpreter._stopByTimingCommonKe = false;
        $gameTroop._interpreter._stopByTimingCommonKe = false;
    };

    
    //- コモンハンドラの更新
    function updateCommonHandler(body) {
        if (!body._tCommonHandlerKe) { return; }
        if (body._tCommonPretersKe && body._tCommonPretersKe.length) { return; }
        IgnoresCommon = true;
        body._tCommonHandlerKe();
        body._tCommonHandlerKe = null;
        IgnoresCommon = false;
    };



    //==================================================
    //--  コモンに付随する処理
    //==================================================
    
    //- ゲームマップ/イベント実行中か(処理追加)
    const _Game_Map_isEventRunning = Game_Map.prototype.isEventRunning;
    Game_Map.prototype.isEventRunning = function() {
        // イベント中条件にタイミングコモン中を追加
        let result = _Game_Map_isEventRunning.apply(this);

        result = result || inTimingCommon();
        return result;
    };

    
    //- ゲームインタープリター/小要素の更新(処理追加)
    const _Game_Interpreter_updateChild = Game_Interpreter.prototype.updateChild;
    Game_Interpreter.prototype.updateChild = function() {
        // インタープリター停止を適用
        if (this._stopByTimingCommonKe) { return true; }

        return _Game_Interpreter_updateChild.apply(this);
    };
    
    
    
    //==================================================
    //--  各種タイミングでのコモン
    //==================================================
    
    //- ゲームインタープリター/場所移動(処理追加)
    const _Game_Interpreter_command201 = Game_Interpreter.prototype.command201;
    Game_Interpreter.prototype.command201 = function(params) {
        // 「場所移動-前」コモン
        if (!IgnoresCommon && !inTimingCommon()) {
            const gm = $gameMap;
            if (gm._tCommonHandlerKe) { return false; }
            // コモンイベントの呼び出し
            const run = callCommonEvent("TransfarPre");
            if (run) {
                InterpreterIndex = this._index;
                gm._tCommonHandlerKe = this.command201.bind(this, params);  return false;
            }
        }

        const result =  _Game_Interpreter_command201.apply(this, arguments);

        if (IgnoresCommon && result) {
            this._index = InterpreterIndex;
            InterpreterIndex = null;
            this._index++;
        }
        return result;
        
    };


    //- シーンマップ/メニューの呼び出し(処理追加)
    const _Scene_Map_callMenu = Scene_Map.prototype.callMenu;
    Scene_Map.prototype.callMenu = function() {
        // 「メニュー開く」コモン
        if (!IgnoresCommon && !inTimingCommon()) {
            const gm = $gameMap;
            if (gm._tCommonHandlerKe) { return; }
            // コモンイベントの呼び出し
            const run = callCommonEvent("MenuOpen");
            if (run) { gm._tCommonHandlerKe = this.callMenu.bind(this);  return; }
        }

        _Scene_Map_callMenu.apply(this);
    };
    
    
    //- ゲームインタープリター/戦闘の処理(処理追加)
    const _Game_Interpreter_command301 = Game_Interpreter.prototype.command301;
    Game_Interpreter.prototype.command301 = function(params) {
        // 「バトル開始-前」コモン
        if (checkBattlePreCommon()) {
            snapshotBySave() // セーブのためのスナップショット
            // コモンイベントの呼び出し
            const run = callCommonEvent("BattleStartPre");
            if (run) {
                InterpreterIndex = this._index;
                $gameMap._tCommonHandlerKe = this.command301.bind(this, params);  return false;
            }
        }

        const result = _Game_Interpreter_command301.apply(this, arguments);

        if (IgnoresCommon && result) {
            this._index = InterpreterIndex;
            InterpreterIndex = null;
            this._index++;
        }
        return result;
    };

    //- ゲームパーティ/エンカウントの実行(処理追加)
    const _Game_Player_executeEncounter = Game_Player.prototype.executeEncounter;
    Game_Player.prototype.executeEncounter = function() {
        if (!inTimingCommon() && !this._battleStartPreKe) {
            if (!$gameMap.isEventRunning() && this._encounterCount <= 0) {
                const troopId = this.makeEncounterTroopId();
                if ($dataTroops[troopId]) {
                    // 「バトル開始-前」コモン(ランダムエンカウント)
                    if (checkBattlePreCommon()) {
                        snapshotBySave() // セーブのためのスナップショット
                        // コモンイベントの呼び出し
                        const run = callCommonEvent("BattleStartPre");
                        // コモン実行済みフラグ
                        if (run) { this._battleStartPreKe = true; }
                    }
                }
            }
        };

        let result = _Game_Player_executeEncounter.apply(this);

        // エンカウント実行したらコモン実行済みフラグを消去
        if (result) {
            this._battleStartPreKe = null;
        }
        return result;
    };

    //- バトル前コモンを実行するか
    function checkBattlePreCommon() {
        return !IgnoresCommon && !inTimingCommon() && !$gameParty.inBattle() && !$gameMap._tCommonHandlerKe;
    };

    //- ゲーム・インタープリター/勝利の処理(処理追加)
    const _Game_Interpreter_command601 = Game_Interpreter.prototype.command601;
    Game_Interpreter.prototype.command601 = function() {
        // 戦闘開始時にタッチしていると勝利後イベントを実行しないバグの対策
        if (SceneManager._scene.constructor.name == "Scene_Battle") {
            this._index--;
            return true;
        }

        return _Game_Interpreter_command601.apply(this);
    };
    
    
    //- シーンバトル/開始(処理追加)
    const _Scene_Battle_start = Scene_Battle.prototype.start;
    Scene_Battle.prototype.start = function() {
        _Scene_Battle_start.apply(this);

        // 「バトル開始-後」コモン

        // コモンイベントの呼び出し(遅延)
        setTimeout(callCommonEvent, 0, "BattleStartAfter");
    };
    
    
    
    //- バトルマネージャー/勝利の処理(処理追加)
    const _BattleManager_processVictory = BattleManager.processVictory;
    BattleManager.processVictory = function() {
        _BattleManager_processVictory.apply(this);

        // 戦闘結果を保存
        BattleResult = "Victory";
    };

    //- バトルマネージャー/敗北の処理(処理追加)
    const _BattleManager_processDefeat = BattleManager.processDefeat;
    BattleManager.processDefeat = function() {
        _BattleManager_processDefeat.apply(this);

        // 戦闘結果を保存
        BattleResult = "Lose";
    };

    //- バトルマネージャー/逃走の処理(処理追加)
    const _BattleManager_processAbort = BattleManager.processAbort;
    BattleManager.processAbort = function() {
        _BattleManager_processAbort.apply(this);

        // 戦闘結果を保存
        BattleResult = "Escape";
    };

    //- バトルマネージャー/バトル終了の更新(処理追加)
    const _BattleManager_updateBattleEnd = BattleManager.updateBattleEnd;
    BattleManager.updateBattleEnd = function() {
        // 「バトル終了-前」コモン
         if (!IgnoresCommon && !inTimingCommon() && !DidBattleEndCommon) {
            const gm = $gameMap;
            if (gm._tCommonHandlerKe) { return true; }
            // コモンイベントの呼び出し
            const run = callCommonEvent("Battle" + BattleResult + "Pre");
            if (run) {
                gm._tCommonHandlerKe = BattleManager.updateBattleEnd.bind(this);
                DidBattleEndCommon = true;
                return true;
            }
        }
        // タイミングコモン中は実行しない
        if (inTimingCommon()) { return }

        _BattleManager_updateBattleEnd.apply(this);
    };


    //- シーンバトル/終了(処理追加)
    const _Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function() {
        _Scene_Battle_terminate.apply(this);

        // 戦闘終了コモン実行済みフラグを初期化
        DidBattleEndCommon = null;
    };
    
    
    //- シーンマネージャー/シーン移行(処理追加)
    const _SceneManager_goto = SceneManager.goto;
    SceneManager.goto = function(sceneClass) {
        // 「ゲームオーバー」コモン
        if (sceneClass == Scene_Gameover && !inTimingCommon()) {
            if (getTimingCommon("GameOver")) {
                if (AfterGameOver || inGameOverCommon()) { return; }
                // マップ以外ならマップ移行後にコモン
                if (this._scene.constructor.name != "Scene_Map") {
                    sceneClass = Scene_Map;
                    AfterGameOver = true;
                // マップならすぐにコモン
                } else {
                    // コモンイベントの呼び出し
                    callCommonEvent("GameOver");
                    return;
                }
            }
        }

        _SceneManager_goto.apply(this, arguments);
    };

    //- ゲームオーバコモン中か
    function inGameOverCommon() {
        const gm = $gameMap;
        if (!gm._tCommonPretersKe) { return false; }
        return gm._tCommonPretersKe.some(preter => preter.tCommonType == "GameOver");
    };
    
    

    //==================================================
    //--  マップ開始時のコモン
    //==================================================

    //- データマネージャー/ニューゲームのセットアップ(処理追加)
    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.apply(this);

        // ニューゲーム時にニューゲーム後フラグをオン
        if (SceneManager._scene.constructor.name != "Scene_Boot") {
            AfterNewGame = true;
        }
    };

    
    //- シーンロード/ロード成功時の処理(処理追加)
    const _Scene_Load_onLoadSuccess = Scene_Load.prototype.onLoadSuccess;
    Scene_Load.prototype.onLoadSuccess = function() {
        _Scene_Load_onLoadSuccess.call(this);

        // ロード時にロード後フラグオン
        AfterLoad = true;
    };


    //- シーンマップ/開始(処理追加)
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.apply(this);

        // マップ開始時のコモン群
        commonsOnMapStart();
        // マップ開始時のコモン群2
        commonsOnMapStart_2();
    };

    //- マップ開始時のコモン群
    function commonsOnMapStart() {
        if (inTimingCommon()) { return; }
        // ニューゲーム
        if (AfterNewGame) { callCommonEvent("NewGame");  AfterNewGame = false; }
        // データロード
        if (AfterLoad) { callCommonEvent("DataLoad");  AfterLoad = false; }
        // メニュー閉じ
        if (SceneManager.isPreviousScene(Scene_Menu)) { callCommonEvent("MenuClose"); }
        // バトル終了-後
        if (SceneManager.isPreviousScene(Scene_Battle)) { 
            callCommonEvent("Battle" + BattleResult + "After");
            // アクション後コモン予約を消去
            BattleManager._actionAfterCommonAppoKe = null;
        }
        // ゲームオーバー
        if (AfterGameOver) { callCommonEvent("GameOver");  AfterGameOver = false; }
    };
    
    //- マップ開始時のコモン群2
    function commonsOnMapStart_2() {
        if (inTimingCommon()) { return; }
        // 場所移動-後
        if (SceneManager.isPreviousScene(Scene_Map)) {
            // コモンイベントの呼び出し
            callCommonEvent("TransfarAfter");
        }
    };
    


    //==================================================
    //--  アクションコモン
    //==================================================

    //- バトルマネージャー/スタートアクション(処理追加)
    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        // 「アクションコモン-前」
        if (!inTimingCommon()) {
            // アクションデータの保存
            const isEnemy = saveActionData(this);
            const subjectWord = isEnemy ? "enemy" : "actor";
            const word = subjectWord + "ActionPre";
            // 敵キャラインデックスの取得
            getEnemyIndex(this._subject);
            // コモンイベントの呼び出し
            callCommonEvent(word);
        }

        _BattleManager_startAction.apply(this);
    };
    
    
    //- バトルマネージャー/エンドアクション(処理追加)
    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
         // 「アクションコモン-後」
        if (!inTimingCommon()) {
            // アクションデータの保存
            const isEnemy = saveActionData(this, true);
            const subjectWord = isEnemy ? "enemy" : "actor";
            const word = subjectWord + "ActionAfter";
            // 敵キャラインデックスの取得
            getEnemyIndex(this._subject);
            // アクション後コモン遅延なら
            if (keke_delayActionAfterCommon) {
                // アクション後コモンの予約
                reserveActionAfterCommon(this, word);
            // 遅延しないならすぐ実行
            } else {
                // コモンイベントの呼び出し
                callCommonEvent(word, null, this._subject);
            }
        }

        _BattleManager_endAction.apply(this);
    };

    //- アクション後コモンの予約
    function reserveActionAfterCommon(bm, word) {
        const commonId = getTimingCommon(word);
        if (!commonId) { return; }
        $gameTemp.reserveCommonEvent(commonId);
    };
    
    
    //- アクションデータの保存
    function saveActionData(bm, isEnd) {
        // 行動者ID
        const subject = bm._subject;
        if (!subject) { return; }
        const isEnemy = subject._enemyId;
        const subjectId = isEnemy ? subject._enemyId : subject._actorId;
        if (keke_varSubjectId) { $gameVariables.setValue(keke_varSubjectId, subjectId); }
        // スキルID/アイテムID
        const action = subject.currentAction();
        if (!action) { return isEnemy; }
        const item = action._item;
        const obje = action.item();
        if (!obje) { return isEnemy; }
        const isItem = item.isItem();
        const skillId = isItem ? 0 : obje.id;
        const itemId = isItem ? obje.id : 0;
        if (keke_varSkillId) { $gameVariables.setValue(keke_varSkillId, skillId); }
        if (keke_varItemId) { $gameVariables.setValue(keke_varItemId, itemId); }
        // ターゲットを取得
        let targets = [];
        // 行動後の場合は使ったターゲットを取得
        if (isEnd) {
            targets = bm._targets;
        // 行動予測の先行作成ターゲットがあったらそれを取得
        } else if (action._targetsFastKePrds) {
            targets = action._targetsFastKePrds.map(data => dataToBattler(data));
        // 決まっていなかったらターゲット作成
        } else {
            targets = action.makeTargets();
            // 先行作成ターゲットを保存
            action._targetsFastKeTmcm = targets.map(battler => battlerToData(battler));
        }
        // ターゲットID
        const target = targets[0];
        const tageIsActor = target && target._actorId ? 1 : 0;
        const targetId = target ? (tageIsActor ? target._actorId : target._enemyId) : 0;
        const targetIds = targets.map(t => t ? (t._enemyId ? t._enemyId : t._actorId) : 0);
        const targetIndex = target ? target.index() : 0;
        const targetIndexs = targets.map(t => t ? t.index() : 0);
        if (keke_varTargetIs) { $gameVariables.setValue(keke_varTargetIs, tageIsActor); }
        if (keke_varTargetId) { $gameVariables.setValue(keke_varTargetId, targetId); }
        if (keke_varTargetIdAll) { $gameVariables.setValue(keke_varTargetIdAll, targetIds); }
        if (keke_varTargetIndex) { $gameVariables.setValue(keke_varTargetIndex, targetIndex); }
        if (keke_varTargetIndexAll) { $gameVariables.setValue(keke_varTargetIndexAll, targetIndexs); }
        return isEnemy;
    };

    //- 敵キャラインデックスの取得
    function getEnemyIndex(battler) {
        const isEnemy = battler._enemyId;
        // 敵キャラの取得用のインデックスを取得
        EnemyIndex = isEnemy ? battler.index(): null;
    };


    //- ゲームアクション/ターゲットの作成(処理追加)
    const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
    Game_Action.prototype.makeTargets = function() {
        // 先行作成ターゲットがあったらそれを適用
        if (this._targetsFastKeTmcm) {
            const targets = this._targetsFastKeTmcm.map(data => dataToBattler(data));
            this._targetsFastKeTmcm = null;
            return targets;
        }

        return _Game_Action_makeTargets.apply(this);
    };
    
    
    //- ゲームバトラー/カレントアクションの削除(処理追加)
    const _Game_Battler_removeCurrentAction = Game_Battler.prototype.removeCurrentAction;
    Game_Battler.prototype.removeCurrentAction = function() {
        // アクション前コモン中はカレントアクションを削除させない
        if (InPreActionCommon) { return; }

        _Game_Battler_removeCurrentAction.apply(this);
    };



    //==================================================
    //--  ゼロコモン
    //==================================================

    // ゼロコモン中フラグ
    let InZeroCommon = null;
    
    //- ゲームバトラー/HPの変動
    const _Game_Battler_gainHp = Game_Battler.prototype.gainHp;
    Game_Battler.prototype.gainHp = function(value) {
        // ゼロコモンがあるか
        const commonWord = existZeroCommon(this, "Hp");
        const preHp = this._hp;
        if (commonWord) { InZeroCommon = true; }

        _Game_Battler_gainHp.apply(this, arguments);

        InZeroCommon = null;
        if (!commonWord) { return; }
        // HPゼロになったら
        if (preHp && this._hp <= 0 && !this._isTempKe) {
            // すでにHPゼロコモン実行中ならHPがゼロにならないようにしてリターン
            if (inTimingCommon(commonWord, this)) { this._hp = preHp;  return; }
            // ゼロバトラーの保存
            saveZeroBattler(this);
            // コモンイベントの呼び出し
            callCommonEvent(commonWord, checkDead.bind(this), this);
        }
        
    };

    //- ゲームバトラー/MPの変動
    const _Game_Battler_gainMp = Game_Battler.prototype.gainMp;
    Game_Battler.prototype.gainMp = function(value) {
        // ゼロコモンがあるか
        const commonWord = existZeroCommon(this, "Mp");
        const preMp = this._mp;

        _Game_Battler_gainMp.apply(this, arguments);

        if (!commonWord) { return; }
        // MPゼロになったら
        if (preMp && this._mp <= 0 && !this._isTempKe) {
            // ゼロバトラーの保存
            saveZeroBattler(this);
            // コモンイベントの呼び出し
            callCommonEvent(commonWord, null, this);
        }
    };

    //- ゲームバトラー/TPの変動
    const _Game_Battler_gainTp = Game_Battler.prototype.gainTp;
    Game_Battler.prototype.gainTp = function(value) {
        // ゼロコモンがあるか
        const commonWord = existZeroCommon(this, "Tp");
        const preTp = this._tp;

        _Game_Battler_gainTp.apply(this, arguments);

        if (!commonWord) { return; }
        // TPゼロになったら
        if (preTp && this._tp <= 0 && !this._isTempKe) {
            // ゼロバトラーの保存
            saveZeroBattler(this);
            // コモンイベントの呼び出し
            callCommonEvent(commonWord, null, this);
        }
    };

    //- ゼロコモンがあるか
    function existZeroCommon(battler, type) {
        // 主体を取得
        const isEnemy = battler._enemyId;
        const subjectWord = isEnemy ? "enemy" : "actor";
        const word = subjectWord + type + "Zero";
        // コモンイベントがあるか
        const commonEvent = existCommonEvent(word);
        return commonEvent ? word : null;
    };

    //- ゼロバトラーの保存
    function saveZeroBattler(battler) {
        if (!keke_varZeroBattlerId) { return; }
        const battlerId = battler._actorId ? battler._actorId : battler._enemyId;
        if (keke_varZeroBattlerId) { $gameVariables.setValue(keke_varZeroBattlerId, battlerId); }
        // アクションデータの保存
        saveActionData(BattleManager, true);
        // 敵キャラインデックスの取得
        getEnemyIndex(battler);
    };

    //- 戦闘不能判定
    function checkDead() {
        if (this._hp == 0) {
            this.addState(this.deathStateId());
        }
    };


    //- ゲームバトラー/ステートの付与(処理追加)
    const _Game_Battler_addState = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function(stateId) {
        // ゼロコモン中は戦闘不能の付与を遅らせる
        if (stateId == this.deathStateId() && InZeroCommon) { return; }

        _Game_Battler_addState.apply(this, arguments);
    };



    //==================================================
    //--  敵キャラの取得
    //==================================================

    //- ゲームインタープリター/インデックスでの敵キャラ取得(処理追加)
    const _Game_Interpreter_iterateEnemyIndex = Game_Interpreter.prototype.iterateEnemyIndex;
    Game_Interpreter.prototype.iterateEnemyIndex = function(param, callback) {
        // 敵キャラを取得している時はそれを使用
        if (this._enemyDataKeTmcm) {
            callback(this._enemyDataKeTmcm.enemy);
            return;
        }

        _Game_Interpreter_iterateEnemyIndex.apply(this, arguments);
    };


    //- ゲームインタープリター/ゲームデータの取得(処理追加)
    const _Game_Interpreter_gameDataOperand = Game_Interpreter.prototype.gameDataOperand;
    Game_Interpreter.prototype.gameDataOperand = function(type, param1, param2) {
        // 敵キャラを取得している時はそれを使用
        if (type == 4 && this._enemyDataKeTmcm) {
            param1 = this._enemyDataKeTmcm.index;
        }
        
        return _Game_Interpreter_gameDataOperand.call(this, type, param1, param2);
    };


    //- ゲームインタープリター/終了(処理追加)
    const _Game_Interpreter_terminate = Game_Interpreter.prototype.terminate;
    Game_Interpreter.prototype.terminate = function() {
        _Game_Interpreter_terminate.apply(this);

        // 敵キャラデータを削除
        this._enemyDataKeTmcm = null;
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



    //==================================================
    //--  プラグインコマンド基本 /ベーシック
    //==================================================
    
    let PlcmPreter = null;
    
    //- プラグインコマンド呼び出しプリターを保存
    const _PluginManager_callCommand = PluginManager.callCommand;
    PluginManager.callCommand = function(self, pluginName, commandName, args) {
        PlcmPreter = self;

        _PluginManager_callCommand.apply(this, arguments);

        PlcmPreter = null;
    };

    
})();
