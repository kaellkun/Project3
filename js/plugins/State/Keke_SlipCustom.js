//=============================================================================
// Keke_SlipCustom_Modified - スリップカスタム（改造版）
// バージョン: 1.0.6
//=============================================================================
// Copyright (c) 2023 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================
// Modified: 個別ポップアップ・戦闘ログ階層表示対応
// v1.0.6: スリップダメージ/継続回復の階層表示対応

/*:
 * @target MZ
 * @plugindesc スリップの効きのよさや演出を設定（改造版：階層表示対応）
 * @author ケケー (Modified)
 * @url https://kekeelabo.com
 * 
 * @help
 * 【ver.1.0.6】
 * スリップダメージ/自動回復の効きのよさや固定値、演出を設定できる
 * 
 * ===== 改造版の追加機能 =====
 * ・複数の固定スリップダメージステートが付与されている場合、
 * 　各ステートごとに個別のダメージポップアップを表示
 * ・戦闘ログに階層付きで各ダメージを記載
 * 
 * ■表示イメージ
 * アイスオーガにスリップダメージ！
 * ├ 液体毒により 50 のHPダメージ！
 * └ 溶解により 30 のHPダメージ！
 * 
 * リーシラの継続回復！
 * ├ リジェネにより HP 50 回復！
 * └ 活性により MP 10 回復！
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
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 *
 * 
 * @param スリップ演出登録
 * @desc スリップの演出を登録する。ステートのメモ欄から呼び出せる
 * @type struct<effect>[]
 * @default []
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
 * @param SlipDamageHeader
 * @text スリップダメージヘッダー
 * @desc スリップダメージのヘッダー。%1=対象名
 * @type string
 * @default %1にスリップダメージ！
 * @parent BattleLogSetting
 * 
 * @param SlipHealHeader
 * @text 継続回復ヘッダー
 * @desc 継続回復のヘッダー。%1=対象名
 * @type string
 * @default %1の継続回復！
 * @parent BattleLogSetting
 * 
 * @param SlipDamageLogFormat
 * @text ダメージログ形式
 * @desc スリップダメージのログ形式。%1=ステート名, %2=ダメージ値, %3=HP/MP/TP
 * @type string
 * @default %1により %2 の%3ダメージ！
 * @parent BattleLogSetting
 * 
 * @param SlipHealLogFormat
 * @text 回復ログ形式
 * @desc スリップ回復のログ形式。%1=ステート名, %2=回復値, %3=HP/MP/TP
 * @type string
 * @default %1により %3 %2 回復！
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
 * @desc 効果音とフラッシュのディレイ
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
 * @type boolean
 * @default false
 * 
 * @param …フラッシュ色
 * @parent 演出
 * @default 255, 255, 255, 128
 * 
 * @param …フラッシュ時間
 * @parent 演出
 * @default 20
 * 
 * @param フリーアニメ
 * @parent 演出
 * @type multiline_string
 */



//==================================================
/*~struct~se:
//==================================================
 * @param ファイル
 * @type file
 * @dir audio/se
 *
 * @param 音量
 * @default 100
 *
 * @param ピッチ
 * @default 100
 *
 * @param 位相
 * @default 0
 */
 
 

(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.split(/[?#]/)[0].split("/").pop().replace(/\.js$/, "");



    //==================================================
    //--  文字列オート変換 /ベーシック
    //==================================================
    
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
    
    function strToList(str) {
        if (!str || !str.length) { return []; }
        let array = JSON.parse(str);
        return array.map((val, i) => {
            return strToAuto(val);
        });
    };
    
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
    
    // 戦闘ログ設定
    const showBattleLog = parameters["ShowBattleLog"] === "true";
    const slipDamageHeader = parameters["SlipDamageHeader"] || '%1にスリップダメージ！';
    const slipHealHeader = parameters["SlipHealHeader"] || '%1の継続回復！';
    const slipDamageLogFormat = parameters["SlipDamageLogFormat"] || '%1により %2 の%3ダメージ！';
    const slipHealLogFormat = parameters["SlipHealLogFormat"] || '%1により %3 %2 回復！';
    const popupDelay = Number(parameters["PopupDelay"]) || 8;

    parameters = null;



    //==================================================
    //--  階層記号取得（RIT_BattleLogExから）
    //==================================================
    
    function getHierarchyBranch() {
        if (window.RIT_BattleLogEx && window.RIT_BattleLogEx.UseHierarchy) {
            return window.RIT_BattleLogEx.Branch;
        }
        return '├ ';
    }
    
    function getHierarchyEnd() {
        if (window.RIT_BattleLogEx && window.RIT_BattleLogEx.UseHierarchy) {
            return window.RIT_BattleLogEx.End;
        }
        return '└ ';
    }



    //==================================================
    //--  スリップダメージキュー管理
    //==================================================
    
    Game_Battler.prototype.initSlipDamageQueue = function() {
        this._slipDamageQueue = [];
    };
    
    Game_Battler.prototype.addSlipDamageQueue = function(stateId, stateName, value, type) {
        if (!this._slipDamageQueue) {
            this._slipDamageQueue = [];
        }
        this._slipDamageQueue.push({
            stateId: stateId,
            stateName: stateName,
            value: value,
            type: type
        });
    };
    
    Game_Battler.prototype.getSlipDamageQueue = function() {
        return this._slipDamageQueue || [];
    };
    
    Game_Battler.prototype.clearSlipDamageQueue = function() {
        this._slipDamageQueue = [];
    };



    //==================================================
    //--  スリップ率
    //==================================================
    
    const _Game_BattlerBase_traitsSum =  Game_BattlerBase.prototype.traitsSum;
    Game_BattlerBase.prototype.traitsSum = function(code, id) {
        if (code == Game_BattlerBase.TRAIT_XPARAM && (id == 7 || id == 8 || id == 9)) {
            return applySlipRate(this, code, id);
        }
        return _Game_BattlerBase_traitsSum.apply(this, arguments);
    };

    function applySlipRate(battler, code, id) {
        const word = id == 7 ? "HP" : id == 8 ? "MP" : "TP";
        const wordE = id == 7 ? "hp" : id == 8 ? "mp" : "tp";
        const slipRate = getSlipRate(battler, word, wordE);
        const minusSum = battler.traitsWithId(code, id).reduce((r, trait) => trait.value < 0 ? r + trait.value : r, 0);
        const minusLast = minusSum ? minusSum * slipRate.minus : 0;
        const plusSum = battler.traitsWithId(code, id).reduce((r, trait) => trait.value > 0 ? r + trait.value : r, 0);
        const plusLast = plusSum ? plusSum * slipRate.plus : 0;
        return minusLast + plusLast;
    };

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

    const _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        let result = _Game_Action_makeDamageValue.apply(this, arguments);
        if (this.item().note.match(/\<(割合攻撃|割合ダメージ|percentageAttack|percentageDamage)\>/i)) {
            const slipRate = getSlipRate(target, "HP", "hp");
            result = Math.round(result * slipRate.minus);
        }
        return result;
    };



    //==================================================
    //--   スリップ固定値
    //==================================================

    function getSlipFixValList(battler, word, wordE) {
        const states = battler._states;
        if (!states || !states.length) { return []; }
        const list = [];
        const slipRate = getSlipRate(battler, word, wordE);
        
        states.forEach(stateId => {
            const state = $dataStates[stateId];
            let valStr = state.meta[word + "スリップ値"] || state.meta[wordE + "SlipVal"];
            if (!valStr) { return; }
            valStr = valStr.replace(/\s/g, "");
            let val = -Number(valStr);
            
            if (val !== 0) {
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

    const _Game_Battler_regenerateHp = Game_Battler.prototype.regenerateHp;
    Game_Battler.prototype.regenerateHp = function() {
        _Game_Battler_regenerateHp.apply(this);
        const fixedList = getSlipFixValList(this, "HP", "hp");
        for (const item of fixedList) {
            const minRecover = -this.maxSlipDamage();
            const value = Math.max(item.value, minRecover);
            if (value !== 0) {
                this.addSlipDamageQueue(item.stateId, item.stateName, value, 'hp');
            }
        }
    };

    const _Game_Battler_regenerateMp = Game_Battler.prototype.regenerateMp;
    Game_Battler.prototype.regenerateMp = function() {
        _Game_Battler_regenerateMp.apply(this);
        const fixedList = getSlipFixValList(this, "MP", "mp");
        for (const item of fixedList) {
            if (item.value !== 0) {
                this.addSlipDamageQueue(item.stateId, item.stateName, item.value, 'mp');
            }
        }
    };

    const _Game_Battler_regenerateTp = Game_Battler.prototype.regenerateTp;
    Game_Battler.prototype.regenerateTp = function() {
        _Game_Battler_regenerateTp.apply(this);
        const fixedList = getSlipFixValList(this, "TP", "tp");
        for (const item of fixedList) {
            if (item.value !== 0) {
                this.addSlipDamageQueue(item.stateId, item.stateName, item.value, 'tp');
            }
        }
    };

    const _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        this.initSlipDamageQueue();
        _Game_Battler_onTurnEnd.call(this);
    };



    //==================================================
    //--  BattleManager: 個別スリップダメージ処理
    //==================================================

    const _BattleManager_endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function() {
        _BattleManager_endTurn.call(this);
        this.processIndividualSlipDamage();
    };

    BattleManager.processIndividualSlipDamage = function() {
        const allBattlers = this.allBattleMembers();
        
        // バトラーごとにダメージと回復を分類
        this._slipDamageBattlers = [];
        
        for (const battler of allBattlers) {
            const queue = battler.getSlipDamageQueue();
            if (queue.length > 0) {
                // ダメージと回復を分離
                const damages = queue.filter(item => item.value < 0);
                const heals = queue.filter(item => item.value > 0);
                
                if (damages.length > 0 || heals.length > 0) {
                    this._slipDamageBattlers.push({
                        battler: battler,
                        damages: damages,
                        heals: heals
                    });
                }
                battler.clearSlipDamageQueue();
            }
        }
        
        if (this._slipDamageBattlers.length > 0) {
            this._slipBattlerIndex = 0;
            this._slipPhase = 'damage';  // 'damage' or 'heal'
            this._slipItemIndex = 0;
            this._slipDamageWait = 0;
            this._slipHeaderDisplayed = false;
            this._processingSlipDamage = true;
        }
    };

    const _BattleManager_update = BattleManager.update;
    BattleManager.update = function(timeActive) {
        if (this._processingSlipDamage) {
            this.updateSlipDamageProcess();
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
        
        if (this._slipBattlerIndex >= this._slipDamageBattlers.length) {
            this._processingSlipDamage = false;
            return;
        }
        
        const battlerData = this._slipDamageBattlers[this._slipBattlerIndex];
        const currentList = this._slipPhase === 'damage' ? battlerData.damages : battlerData.heals;
        
        // ヘッダー表示
        if (!this._slipHeaderDisplayed && currentList.length > 0) {
            this.displaySlipHeader(battlerData.battler, this._slipPhase === 'damage');
            this._slipHeaderDisplayed = true;
            this._slipDamageWait = 4;
            return;
        }
        
        // アイテム処理
        if (this._slipItemIndex < currentList.length) {
            const item = currentList[this._slipItemIndex];
            const isLast = (this._slipItemIndex === currentList.length - 1);
            this.applyIndividualSlipDamage(battlerData.battler, item, isLast);
            this._slipItemIndex++;
            this._slipDamageWait = popupDelay;
            return;
        }
        
        // 次のフェーズまたは次のバトラーへ
        if (this._slipPhase === 'damage' && battlerData.heals.length > 0) {
            // 回復フェーズへ
            this._slipPhase = 'heal';
            this._slipItemIndex = 0;
            this._slipHeaderDisplayed = false;
        } else {
            // 次のバトラーへ
            this._slipBattlerIndex++;
            this._slipPhase = 'damage';
            this._slipItemIndex = 0;
            this._slipHeaderDisplayed = false;
        }
    };

    BattleManager.displaySlipHeader = function(battler, isDamage) {
        if (!showBattleLog || !this._logWindow) return;
        
        const headerFormat = isDamage ? slipDamageHeader : slipHealHeader;
        const text = headerFormat.format(battler.name());
        this._logWindow.addText(text);
    };

    BattleManager.applyIndividualSlipDamage = function(battler, data, isLast) {
        const value = data.value;
        const stateName = data.stateName;
        const type = data.type;
        
        // ダメージを適用
        battler.clearResult();
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
        
        // 戦闘ログに階層付きで表示
        if (showBattleLog && this._logWindow) {
            const absValue = Math.abs(value);
            const typeText = type.toUpperCase();
            const symbol = isLast ? getHierarchyEnd() : getHierarchyBranch();
            
            let text;
            if (value < 0) {
                // ダメージ
                text = slipDamageLogFormat
                    .replace('%1', stateName)
                    .replace('%2', absValue)
                    .replace('%3', typeText);
            } else {
                // 回復
                text = slipHealLogFormat
                    .replace('%1', stateName)
                    .replace('%2', absValue)
                    .replace('%3', typeText);
            }
            
            this._logWindow.addText(symbol + text);
        }
    };



    //==================================================
    //--  スリップ演出
    //==================================================

    const _Game_Battler_regenerateAll = Game_Battler.prototype.regenerateAll;
    Game_Battler.prototype.regenerateAll = function() {
        doSlipEffect(this);
        _Game_Battler_regenerateAll.apply(this);
    };

    function doSlipEffect(battler) {
        if (!$gameParty.inBattle()) { return; }
        const effect = getSlipEffectByMemo(battler);
        if (!effect) { return; }
        const delay = effect["ディレイ"];
        const delayEx = Math.round(delay / 60 * 1000);
        showAnimation(battler, effect["アニメーション"]);
        setTimeout(playSe, delayEx, effect["効果音"]); 
        setTimeout(showScreenFlash, delayEx, effect);
        doFreeAnimeSkill(battler, battler, effect["フリーアニメ"]);
        if (delayEx) {
            battler._popupDelayKeSlct = delayEx;
            setTimeout(remPopupDelay, delayEx, battler);
        }
    };

    function getSlipEffectByMemo(battler) {
        const states = battler._states;
        if (!states || !states.length) { return; }
        let effect = null;
        let maxPriority = null;
        states.forEach(stateId => {
            const state = $dataStates[stateId];
            let tageName = state.meta["スリップ演出"] || state.meta["slipEffect"];
            if (!tageName) { return; }
            tageName = tageName.replace(/\s/g, "");
            const effectData = keke_slipEffects.find(d => d["演出名"] == tageName);
            if (!effectData) { return; }
            const priority = Number(effectData["優先度"]);
            if (!maxPriority || priority >= maxPriority) {
                effect = effectData;
                maxPriority = priority;
            }
        });
        return effect;
    };

    function showAnimation(battler, animationId) {
        if (!animationId) { return; }
        Window_BattleLog.prototype.showAnimation(battler, [battler], animationId);
    };

    function playSe(ses) {
        if (!ses || !ses.length) { return; }
        ses.forEach(se => {
            if (!se) { return; }
            AudioManager.playSe({ name:se["ファイル"], volume:se["音量"], pitch:se["ピッチ"], pan:se["位相"] });
        });
    };

    function showScreenFlash(d) {
        if (!d["画面フラッシュ"] || !d["…フラッシュ色" || !d["…フラッシュ時間"]]) { return; }
        const delay = d["…フラッシュ遅延"] || 0;
        if (delay) {
            setTimeout(screenFlash, delay * 1000 / 60, d);
        } else {
            screenFlash(d);
        }
    };
    
    function screenFlash(d) {
        $gameScreen.startFlash(d["…フラッシュ色"], d["…フラッシュ時間"]);
    };

    function doFreeAnimeSkill(subject, target, note) {
        if (!isFreeAnime() || !note) { return; }
        const metaList = metaAll(note, ["フリーアニメ", "freeAnime"]);
        if (!metaList || !metaList.length) { return; }
        metaList.forEach(meta => {
            BattleManager.doFreeAnimeSkillKe(meta, subject, [target]);
        });
    };
    
    function isFreeAnime() {
        return PluginManager._scripts.some(n => n == "Keke_FreeAnime");
    };

    const _Window_BattleLog_popupDamage = Window_BattleLog.prototype.popupDamage;
    Window_BattleLog.prototype.popupDamage = function(target) {
        if (target._popupDelayKeSlct) {
            setTimeout(startDamagePopup, target._popupDelayKeSlct, target);
            target._popupDelayKeSlct = null;
            return
        }
        _Window_BattleLog_popupDamage.apply(this, arguments);
    };

    function startDamagePopup(target) {
        if (!target) { return; }
        if (target.shouldPopupDamage()) {
            target.startDamagePopup();
        }
    };

    function remPopupDelay(battler) {
        if (!battler) { return; }
        battler._popupDelayKeSlct = null;
    };



    //==================================================
    //--  メタ取得
    //==================================================
    
    function totalAllMetaArray(battler, words, action) {
        let data = null
        let array = [];
        data = battler._actorId ? battler.actor() : battler.enemy();
        if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        if (battler._actorId) {
            data = battler.currentClass();
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
            battler._equips.forEach(equip => {
                data = equip.object();
                if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
            });
        }
        battler._states.forEach(stateId => {
            data = $dataStates[stateId];
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        });
        if (action) {
            data = action.item();
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        }
        array = array.map(e => e.replace(/\s/g, ""));
        array = array.filter(e => e);
        return array;
    };
    
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
                    result.push(match[1]);
                });
            }
        });
        return result;
    };

})();
