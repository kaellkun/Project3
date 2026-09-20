//=============================================================================
// Keke_SlipCustom_Modified - スリップカスタム（改造版）
// バージョン: 1.0.5m2
//=============================================================================
// Copyright (c) 2023 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================
// Modified: 個別ポップアップ・戦闘ログ機能追加
// v1.0.5m2: 戦闘ログ更新処理を修正

/*:
 * @target MZ
 * @plugindesc スリップの効きのよさや演出を設定（改造版：個別ポップアップ・戦闘ログ対応）
 * @author ケケー (Modified)
 * @url https://kekeelabo.com
 * 
 * @help
 * 【ver.1.0.5m2】
 * スリップダメージ/自動回復の効きのよさや固定値、演出を設定できる
 * 
 * ===== 改造版の追加機能 =====
 * ・複数の固定スリップダメージステートが付与されている場合、
 * 　各ステートごとに個別のダメージポップアップを表示
 * ・戦闘ログに各ダメージを記載（ステート名付き）
 * ============================
 * 
 * ● 使い方 ●
 * 
 * 【機能1】キャラクターごとにスリップダメージの効きのよさを設定
 * 
 * アクター、職業、スキル、アイテム、装備、敵キャラ、ステート のメモ欄に
 * 
 * <HPスリップ率: (スリップダメージ率), (自動回復率)>
 * <MPスリップ率: (スリップダメージ率), (自動回復倍率)>
 * <TPスリップ率: (スリップダメージ率), (自動回復倍率)>
 * 
 * 例)
 * <HPスリップ率: 25, 50>
 * 　スリップダメージが 25%、自動回復が 50%
 * <HPスリップ率: 25>
 * 　スリップダメージが 25%、自動回復は変更なし
 * <HPスリップ率: , 50>
 * 　スリップダメージは変更なし、自動回復が 50%
 * 
 * 
 * 【機能2】スリップダメージを固定値で設定
 * 
 * ステートのメモ欄に
 * 
 * <HPスリップ値: (スリップ固定値)>
 * <MPスリップ値: (スリップ固定値)>
 * <TPスリップ値: (スリップ固定値)>
 * 
 * 例)
 * <HPスリップ値: 100>
 * 　100 のスリップダメージ
 * <HPスリップ値: -100>
 * 　100 の自動回復
 * 
 * ※固定値はプラスでダメージ、マイナスで回復する
 * 
 * 
 * 【機能3】スリップダメージの演出を設定
 * 
 * ★[手順1] プラグインパラメータで演出を登録
 * プラグインパラメータ → スリップ演出登録
 * ◎好きな演出名を付けて、演出内容を設定していく
 * 
 * ★[手順2] ステートのメモ欄から演出を呼び出す
 * ステートのメモ欄に
 * 
 * <スリップ演出: (演出名)>
 * 
 * 例)
 * <スリップ演出: 強い毒>
 * 　演出名が「強い毒」の演出を実行
 * 
 * 
 * 【機能4】スキルのダメージにもスリップ率を適用
 * 
 * スキルのメモ欄に
 * 
 * <割合攻撃>
 * 
 * と記述する。
 * 例えば最大HPの50%ダメージを与えるスキルに <割合攻撃> と記述すると、
 * HPスリップ率50%の敵には最大HPの25%ダメージしか与えられなくなる
 * 
 * 
 *
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 *
 * 
 * @param スリップ演出登録
 * @desc スリップの演出を登録する。ステートのメモ欄から呼び出せる
 * @type struct<effect>[]
 * @default ["{\"演出名\":\"毒\",\"優先度\":\"10\",\"演出\":\"\",\"アニメーション\":\"59\",\"ディレイ\":\"20\",\"効果音\":\"[\\\"{\\\\\\\"ファイル\\\\\\\":\\\\\\\"Slash8\\\\\\\",\\\\\\\"音量\\\\\\\":\\\\\\\"100\\\\\\\",\\\\\\\"ピッチ\\\\\\\":\\\\\\\"100\\\\\\\",\\\\\\\"位相\\\\\\\":\\\\\\\"0\\\\\\\"}\\\"]\",\"画面フラッシュ\":\"false\",\"…フラッシュ色\":\"255, 0, 0, 128\",\"…フラッシュ時間\":\"20\",\"フリーアニメ\":\"\"}","{\"演出名\":\"強い毒\",\"優先度\":\"10\",\"演出\":\"\",\"アニメーション\":\"59\",\"ディレイ\":\"20\",\"効果音\":\"[\\\"{\\\\\\\"ファイル\\\\\\\":\\\\\\\"Slash8\\\\\\\",\\\\\\\"音量\\\\\\\":\\\\\\\"100\\\\\\\",\\\\\\\"ピッチ\\\\\\\":\\\\\\\"80\\\\\\\",\\\\\\\"位相\\\\\\\":\\\\\\\"0\\\\\\\"}\\\"]\",\"画面フラッシュ\":\"false\",\"…フラッシュ色\":\"255, 0, 0, 128\",\"…フラッシュ時間\":\"20\",\"フリーアニメ\":\"\"}","{\"演出名\":\"弱い毒\",\"優先度\":\"10\",\"演出\":\"\",\"アニメーション\":\"59\",\"ディレイ\":\"20\",\"効果音\":\"[\\\"{\\\\\\\"ファイル\\\\\\\":\\\\\\\"Slash7\\\\\\\",\\\\\\\"音量\\\\\\\":\\\\\\\"100\\\\\\\",\\\\\\\"ピッチ\\\\\\\":\\\\\\\"80\\\\\\\",\\\\\\\"位相\\\\\\\":\\\\\\\"0\\\\\\\"}\\\"]\",\"画面フラッシュ\":\"false\",\"…フラッシュ色\":\"255, 0, 0, 128\",\"…フラッシュ時間\":\"20\",\"フリーアニメ\":\"\"}","{\"演出名\":\"炎上\",\"優先度\":\"10\",\"演出\":\"\",\"アニメーション\":\"66\",\"ディレイ\":\"20\",\"効果音\":\"[\\\"{\\\\\\\"ファイル\\\\\\\":\\\\\\\"Fire7\\\\\\\",\\\\\\\"音量\\\\\\\":\\\\\\\"150\\\\\\\",\\\\\\\"ピッチ\\\\\\\":\\\\\\\"100\\\\\\\",\\\\\\\"位相\\\\\\\":\\\\\\\"0\\\\\\\"}\\\"]\",\"画面フラッシュ\":\"false\",\"…フラッシュ色\":\"255, 0, 0, 128\",\"…フラッシュ時間\":\"30\",\"フリーアニメ\":\"\"}"]
 * 
 * @param BattleLogSetting
 * @text 戦闘ログ設定
 * @default ------------------------------
 * 
 * @param ShowBattleLog
 * @text 戦闘ログに表示
 * @desc スリップダメージを戦闘ログに表示するかどうか。
 * @type boolean
 * @default true
 * @parent BattleLogSetting
 * 
 * @param SlipDamageLogFormat
 * @text ダメージログ形式
 * @desc スリップダメージのログ形式。%1=対象名, %2=ステート名, %3=ダメージ値
 * @type string
 * @default %1は%2により%3のダメージを受けた！
 * @parent BattleLogSetting
 * 
 * @param SlipHealLogFormat
 * @text 回復ログ形式
 * @desc スリップ回復のログ形式。%1=対象名, %2=ステート名, %3=回復値
 * @type string
 * @default %1は%2により%3回復した！
 * @parent BattleLogSetting
 * 
 * @param PopupDelay
 * @text ポップアップ間隔
 * @desc 各ポップアップ間のフレーム間隔。
 * @type number
 * @default 8
 * @min 1
 * @max 60
 * @parent BattleLogSetting
 * 
 */


//================================================== 
/*~struct~effect:
//==================================================
 * @param 演出名
 * @desc 演出の名前。ステートのメモ欄からの呼び出しに使う
 * 
 * @param 優先度
 * @desc エフェクトの優先度。複数のエフェクトがある場合、値が高いものが優先して実行される
 * @default 10
 * 
 * @param 演出
 * 
 * @param アニメーション
 * @parent 演出
 * @desc 表示するアニメーション
 * @type animation
 * 
 * @param ディレイ
 * @parent 演出
 * @desc 効果音とフラッシュのディレイ。5なら 5フレーム 待ってから実行される
 * @default 20
 * 
 * @param 効果音
 * @parent 演出
 * @desc 鳴らす効果音
 * @type struct<se>[]
 * @default []
 * 
 * @param 画面フラッシュ
 * @parent 演出
 * @desc 画面フラッシュを実行する
 * @type boolean
 * @default false
 * 
 * @param …フラッシュ色
 * @parent 演出
 * @desc 画面フラッシュの色。赤, 緑, 青, 強さ。各0～255
 * @default 255, 255, 255, 128
 * 
 * @param …フラッシュ時間
 * @parent 演出
 * @desc フラッシュの所要時間。5 なら 5フレーム
 * @default 20
 * 
 * @param フリーアニメ
 * @parent 演出
 * @desc フリーアニメを再生する。メモ欄同様に記述。プラグイン『Keke_FreeAnime』が必要
 * @type multiline_string
 */



//==================================================
/*~struct~se:
//==================================================
 * @param ファイル
 * @desc 効果音ファイル
 * @type file
 * @dir audio/se
 *
 * @param 音量
 * @desc 効果音の音量
 * @default 100
 *
 * @param ピッチ
 * @desc 効果音のピッチ
 * @default 100
 *
 * @param 位相
 * @desc 効果音の位相
 * @default 0
 */
 
 

(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.split("/").pop().split("?")[0].replace(/\.js$/, "");



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
        for (let key in strs) {
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
    
    let parameters = PluginManager.parameters(pluginName);
    
    const keke_slipEffects = strToList(parameters["スリップ演出登録"]);
    
    // 追加パラメータ
    const showBattleLog = parameters["ShowBattleLog"] === "true";
    const slipDamageLogFormat = parameters["SlipDamageLogFormat"] || '%1は%2により%3のダメージを受けた！';
    const slipHealLogFormat = parameters["SlipHealLogFormat"] || '%1は%2により%3回復した！';
    const popupDelay = Number(parameters["PopupDelay"]) || 8;

    parameters = null;



    //==================================================
    //--  スリップダメージキュー管理（追加）
    //==================================================
    
    //- キューの初期化
    Game_Battler.prototype.initSlipDamageQueue = function() {
        this._slipDamageQueue = [];
    };
    
    //- キューに追加
    Game_Battler.prototype.addSlipDamageQueue = function(stateId, stateName, value, type) {
        if (!this._slipDamageQueue) {
            this._slipDamageQueue = [];
        }
        this._slipDamageQueue.push({
            stateId: stateId,
            stateName: stateName,
            value: value,
            type: type // 'hp', 'mp', 'tp'
        });
    };
    
    //- キューの取得
    Game_Battler.prototype.getSlipDamageQueue = function() {
        return this._slipDamageQueue || [];
    };
    
    //- キューのクリア
    Game_Battler.prototype.clearSlipDamageQueue = function() {
        this._slipDamageQueue = [];
    };



    //==================================================
    //--  スリップ率
    //==================================================
    
    //- ゲーム・バトラーベース/特徴(処理追加)
    const _Game_BattlerBase_traitsSum =  Game_BattlerBase.prototype.traitsSum;
    Game_BattlerBase.prototype.traitsSum = function(code, id) {
        // 特徴にスリップ率を適用
        if (code == Game_BattlerBase.TRAIT_XPARAM && (id == 7 || id == 8 || id == 9)) {
            // スリップ率の適用
            return applySlipRate(this, code, id);
        }

        return _Game_BattlerBase_traitsSum.apply(this, arguments);
    };

    //- スリップ率の適用
    function applySlipRate(battler, code, id) {
        const word = id == 7 ? "HP" : id == 8 ? "MP" : "TP";
        const wordE = id == 7 ? "hp" : id == 8 ? "mp" : "tp";
        // スリップ率の取得
        const slipRate = getSlipRate(battler, word, wordE);
        // マイナスのスリップ量
        const minusSum = battler.traitsWithId(code, id).reduce((r, trait) => trait.value < 0 ? r + trait.value : r, 0);
        const minusLast = minusSum ? minusSum * slipRate.minus : 0;
        // プラスのスリップ量
        const plusSum = battler.traitsWithId(code, id).reduce((r, trait) => trait.value > 0 ? r + trait.value : r, 0);
        const plusLast = plusSum ? plusSum * slipRate.plus : 0;
        return minusLast + plusLast;
    };

    //- スリップ率の取得
    function getSlipRate(battler, word, wordE) {
        let minusRate = 1;
        let plusRate = 1;
        const metas = totalAllMetaArray(battler, [word + "スリップ率", wordE + "SlipRate"]);
        metas.forEach(meta => {
            const params = meta.split(",");
            if (params[0]) { minusRate *= Number(params[0]) / 100; }
            if (params[1]) { plusRate *= Number(params[1]) / 100; }
        });
        return { minus:minusRate, plus:plusRate };
    };



    //==================================================
    //--  割合ダメージ
    //==================================================

    //- ゲームアクション/ダメージ量の作成(処理追加)
    const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        let result = _Game_Action_makeDamageValue.apply(this, arguments);

        // スキルのメモ欄に割合攻撃の記述があったらスリップ率を適用
        if (this.item().note.match(/\<(割合攻撃|割合ダメージ|percentageAttack|percentageDamage)\>/i)) {
            // スリップ率の取得
            const slipRate = getSlipRate(target, "HP", "hp");
            // ダメージ量に乗算
            result = Math.round(result * slipRate.minus);
        }
        return result;
    };



    //==================================================
    //--   スリップ固定値（個別表示対応版に改造）
    //==================================================

    //- スリップ固定値リストの取得（個別情報を返す）
    function getSlipFixValList(battler, word, wordE) {
        const states = battler._states;
        if (!states || !states.length) { return []; }
        const list = [];
        const slipRate = getSlipRate(battler, word, wordE);
        
        states.forEach(stateId => {
            const state = $dataStates[stateId];
            // メモ欄から固定値を取得
            let valStr = state.meta[word + "スリップ値"] || state.meta[wordE + "SlipVal"];
            if (!valStr) { return; }
            valStr = valStr.replace(/\s/g, "");
            let val = -Number(valStr);
            
            if (val !== 0) {
                // スリップ率を適用
                val = Math.floor(val * (val < 0 ? slipRate.minus : slipRate.plus));
                if (val !== 0) {
                    list.push({
                        stateId: stateId,
                        stateName: state.name,
                        value: val
                    });
                }
            }
        });
        return list;
    };

    //- スリップ固定値の取得（従来互換：合計値を返す）
    function getSlipFixVal(battler, word, wordE) {
        const list = getSlipFixValList(battler, word, wordE);
        return list.reduce((sum, item) => sum + item.value, 0);
    };

    //- ゲームバトラー/HPの再生(処理追加)
    const _Game_Battler_regenerateHp = Game_Battler.prototype.regenerateHp;
    Game_Battler.prototype.regenerateHp = function() {
        _Game_Battler_regenerateHp.apply(this);

        // HPスリップ固定値を個別にキューに追加
        const fixedList = getSlipFixValList(this, "HP", "hp");
        for (const item of fixedList) {
            // 最大スリップダメージの制限を適用
            const minRecover = -this.maxSlipDamage();
            const value = Math.max(item.value, minRecover);
            if (value !== 0) {
                this.addSlipDamageQueue(item.stateId, item.stateName, value, 'hp');
            }
        }
    };

    //- ゲームバトラー/MPの再生(処理追加)
    const _Game_Battler_regenerateMp = Game_Battler.prototype.regenerateMp;
    Game_Battler.prototype.regenerateMp = function() {
        _Game_Battler_regenerateMp.apply(this);

        // MPスリップ固定値を個別にキューに追加
        const fixedList = getSlipFixValList(this, "MP", "mp");
        for (const item of fixedList) {
            if (item.value !== 0) {
                this.addSlipDamageQueue(item.stateId, item.stateName, item.value, 'mp');
            }
        }
    };

    //- ゲームバトラー/TPの再生(処理追加)
    const _Game_Battler_regenerateTp = Game_Battler.prototype.regenerateTp;
    Game_Battler.prototype.regenerateTp = function() {
        _Game_Battler_regenerateTp.apply(this);

        // TPスリップ固定値を個別にキューに追加
        const fixedList = getSlipFixValList(this, "TP", "tp");
        for (const item of fixedList) {
            if (item.value !== 0) {
                this.addSlipDamageQueue(item.stateId, item.stateName, item.value, 'tp');
            }
        }
    };

    //- ターン終了時にキューを初期化
    const _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        // キューを初期化
        this.initSlipDamageQueue();
        
        // 元の処理（regenerate系が呼ばれる）
        _Game_Battler_onTurnEnd.call(this);
    };



    //==================================================
    //--  BattleManager: 個別スリップダメージ処理（追加）
    //==================================================

    const _BattleManager_endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function() {
        _BattleManager_endTurn.call(this);
        
        // 全バトラーの固定スリップダメージを処理
        this.processIndividualSlipDamage();
    };

    BattleManager.processIndividualSlipDamage = function() {
        const allBattlers = this.allBattleMembers();
        this._slipDamageProcessList = [];
        
        for (const battler of allBattlers) {
            const queue = battler.getSlipDamageQueue();
            if (queue.length > 0) {
                for (const item of queue) {
                    this._slipDamageProcessList.push({
                        battler: battler,
                        stateId: item.stateId,
                        stateName: item.stateName,
                        value: item.value,
                        type: item.type
                    });
                }
                battler.clearSlipDamageQueue();
            }
        }
        
        if (this._slipDamageProcessList.length > 0) {
            this._slipDamageIndex = 0;
            this._slipDamageWait = 0;
            this._processingSlipDamage = true;
        }
    };

    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        if (this._processingSlipDamage) {
            this.updateSlipDamageProcess();
            // 【修正】戦闘ログウィンドウも更新する
            if (this._logWindow) {
                this._logWindow.update();
            }
            return;
        }
        _BattleManager_update.call(this, timeActive);
    };

    BattleManager.updateSlipDamageProcess = function() {
        if (this._slipDamageWait > 0) {
            this._slipDamageWait--;
            return;
        }
        
        if (this._slipDamageIndex >= this._slipDamageProcessList.length) {
            this._processingSlipDamage = false;
            return;
        }
        
        const data = this._slipDamageProcessList[this._slipDamageIndex];
        this.applyIndividualSlipDamage(data);
        this._slipDamageIndex++;
        this._slipDamageWait = popupDelay;
    };

    BattleManager.applyIndividualSlipDamage = function(data) {
        const battler = data.battler;
        const value = data.value;
        const stateName = data.stateName;
        const type = data.type;
        
        // ダメージを適用
        battler.clearResult();
        
        // スリップダメージフラグを設定（Keke_TotalDamage対応用）
        battler._result._isSlipDamageKe = true;
        
        if (type === 'hp') {
            battler.gainHp(value);
            battler._result.hpDamage = -value;
        } else if (type === 'mp') {
            battler.gainMp(value);
            battler._result.mpDamage = -value;
        } else if (type === 'tp') {
            battler.gainSilentTp(value);
            battler._result.tpDamage = -value;
        }
        
        // ダメージポップアップを表示
        if (type === 'hp' || type === 'mp') {
            battler.startDamagePopup();
        }
        
        // 戦闘ログに表示
        if (showBattleLog && this._logWindow) {
            const targetName = battler.name();
            const absValue = Math.abs(value);
            
            if (value < 0) {
                // ダメージ
                const text = slipDamageLogFormat.format(targetName, stateName, absValue);
                // 【修正】push経由ではなく直接addTextを呼ぶ
                this._logWindow.addText(text);
            } else if (value > 0) {
                // 回復
                const text = slipHealLogFormat.format(targetName, stateName, absValue);
                this._logWindow.addText(text);
            }
        }
    };



    //==================================================
    //--  スリップ演出
    //==================================================

    //- ゲームバトラー/全ての再生(処理追加)
    const _Game_Battler_regenerateAll = Game_Battler.prototype.regenerateAll;
    Game_Battler.prototype.regenerateAll = function() {
        // スリップ演出の実行
        doSlipEffect(this);

        _Game_Battler_regenerateAll.apply(this);
    };

    //- スリップ演出の実行
    function doSlipEffect(battler) {
        if (!$gameParty.inBattle()) { return; }
        // メモ欄からのスリップ演出の取得
        const effect = getSlipEffectByMemo(battler);
        if (!effect) { return; }
        // ディレイ
        const delay = effect["ディレイ"];
        const delayEx = Math.round(delay / 60 * 1000);
        // アニメｰションの表示
        showAnimation(battler, effect["アニメーション"]);
        // 効果音の再生
        setTimeout(playSe, delayEx, effect["効果音"]); 
        // 画面フラッシュの表示
        setTimeout(showScreenFlash, delayEx, effect);
        // フリーアニメ・スキルの実行
        doFreeAnimeSkill(battler, battler, effect["フリーアニメ"]);
        // ダメージポップのディレイ
        if (delayEx) {
            battler._popupDelayKeSlct = delayEx;
            setTimeout(remPopupDelay, delayEx, battler);
        }
    };

    //- メモ欄からのスリップ演出の取得
    function getSlipEffectByMemo(battler) {
        const states = battler._states;
        if (!states || !states.length) { return; }
        let effect = null;
        let maxPriority = null;
        states.forEach(stateId => {
            const state = $dataStates[stateId];
            // メモ欄から演出名を取得
            let tageName = state.meta["スリップ演出"] || state.meta["slipEffect"];
            if (!tageName) { return; }
            tageName = tageName.replace(/\s/g, "");
            // 登録した演出を取得
            const effectData = keke_slipEffects.find(d => d["演出名"] == tageName);
            if (!effectData) { return; }
            // 優先度の判定
            const priority = Number(effectData["優先度"]);
            if (!maxPriority || priority >= maxPriority) {
                effect = effectData;
                maxPriority = priority;
            }
        });
        return effect;
    };

    //- アニメｰションの表示
    function showAnimation(battler, animationId) {
        if (!animationId) { return; }
        Window_BattleLog.prototype.showAnimation(battler, [battler], animationId);
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


    //- フリーアニメ・スキルの実行
    function doFreeAnimeSkill(subject, target, note) {
        if (!isFreeAnime() || !note) { return; }
        // アニメファイルとコモンを取得
        const metaList = metaAll(note, ["フリーアニメ", "freeAnime"]);
        if (!metaList || !metaList.length) { return; }
        metaList.forEach(meta => {
            // フリーアニメ・スキルの実行-個別
            BattleManager.doFreeAnimeSkillKe(meta, subject, [target]);
        });
    };
    
    //- フリーアニメフラグ
    function isFreeAnime() {
        return PluginManager._scripts.some(n => n == "Keke_FreeAnime");
    };


    //- ウインドウ・バトルログ/ダメージのポップアップ(処理追加)
    const _Window_BattleLog_popupDamage = Window_BattleLog.prototype.popupDamage;
    Window_BattleLog.prototype.popupDamage = function(target) {
        //- ディレイ時はポップアップ開始を遅らせる
        if (target._popupDelayKeSlct) {
            setTimeout(startDamagePopup, target._popupDelayKeSlct, target);
            target._popupDelayKeSlct = null;
            return
        }
        
        _Window_BattleLog_popupDamage.apply(this, arguments);
    };

    //- ダメージポップアップの開始
    function startDamagePopup(target) {
        if (!target) { return; }
        if (target.shouldPopupDamage()) {
            target.startDamagePopup();
        }
    };


    //- ポップアップディレイの解除
    function remPopupDelay(battler) {
        if (!battler) { return; }
        battler._popupDelayKeSlct = null;
    };



    //==================================================
    //--  メタ取得 /ベーシック
    //==================================================
    
    //- 全てのメタ配列の合算
    function totalAllMetaArray(battler, words, action) {
        let data = null
        let array = [];
        // バトラー値
        data = battler._actorId ? battler.actor() : battler.enemy();
        if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        if (battler._actorId) {
            // 職業値
            data = battler.currentClass();
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
            // 装備値
            battler._equips.forEach(equip => {
                data = equip.object();
                if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
            });
        }
        // ステート値
        battler._states.forEach(stateId => {
            data = $dataStates[stateId];
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        });
        // アクション値
        if (action) {
            data = action.item();
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        }
        // スペースを削除
        array = array.map(e => e.replace(/\s/g, ""));
        // 空の要素は削除
        array = array.filter(e => e);
        return array;
    };
    
    //- 全取得メタ
    function metaAll(note, words) {
        var result = [];
        words.forEach(word => {
            var regText = '\<' + word + ':([^\>]*)\>';
            var regExp_g = new RegExp(regText, 'gi');
            var regExp = new RegExp(regText, 'i');
            var matches = note.match(regExp_g);
            if (matches) {
                matches.forEach(function(line) {
                    const match = line.match(regExp);
                    const vals = match[1].replace(/\s/g, "").split(",");
                    result.push(match[1]);
                });
            }
        });
        return result;
    };

})();
