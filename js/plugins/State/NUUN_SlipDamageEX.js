/*:-----------------------------------------------------------------------------------
 * NUUN_SlipDamageEX_Modified.js
 * 
 * Original Copyright (C) 2022 NUUN
 * Modified for individual slip damage display + Keke_TotalDamage compatibility
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 * -------------------------------------------------------------------------------------
 */ 
/*:
 * @target MZ
 * @plugindesc スリップダメージ拡張（修正版 - Keke_TotalDamage対応）
 * @author NUUN (Modified)
 * @version 1.3.1
 * @base NUUN_Base
 * @base NUUN_StateTurnCount
 * @orderAfter NUUN_Base
 * @orderAfter NUUN_StateTurnCount
 * @orderBefore Keke_TotalDamage_Modified
 * 
 * @help
 * NUUN_SlipDamageEXの改造版です。
 * 
 * ===== 修正版の変更点 =====
 * ・スリップダメージにフラグを付与し、Keke_TotalDamage_Modifiedと
 *   連携してヒットカウントから除外できるようにしました。
 * ・標準のダメージポップアップを使用せず、Keke形式で表示します。
 * ============================
 * 
 * 複数の固定スリップダメージステートが付与されている場合、
 * 各ステートごとに個別のダメージポップアップを表示し、
 * 戦闘ログにも各ダメージを記載します。
 * 
 * ※このプラグインはKeke_TotalDamage_Modifiedより上に配置してください。
 * 
 * ステートのメモ欄
 * <SlipDamageHP:[eval]> HPのスリップダメージを設定します。
 * <SlipDamageMP:[eval]> MPのスリップダメージを設定します。
 * <SlipDamageTP:[eval]> TPのスリップダメージを設定します。
 * <SlipDamageFixedHP:[eval]> HPのスリップダメージを固定値で設定します。
 * <SlipDamageFixedMP:[eval]> MPのスリップダメージを固定値で設定します。
 * <SlipDamageFixedTP:[eval]> TPのスリップダメージを固定値で設定します。
 * [eval]:評価式
 * b:バトラーゲームデータ
 * db:バトラーのデータベースデータ
 * st:ステートのターン
 * 
 * 例
 * <SlipDamageHP:-10 * st> 毎ターンごとに10%加算した割合のダメージを受けます。
 * <SlipDamageMP:10 * st> 毎ターンごとに10%加算した割合で回復します。
 * <SlipDamageHP:Math.pow(3, st) * -1> 毎ターンごとに3%ずつスリップダメージが倍化します。
 * <SlipDamageFixedHP:-10> 毎ターンごとに１０のスリップダメージを受けます。
 * 
 * 利用規約
 * このプラグインはMITライセンスで配布しています。
 * 
 * 更新履歴
 * 2025/1/12 Ver.1.3.1
 * Keke_TotalDamage_Modified対応版を作成。
 * スリップダメージフラグを追加。
 * 2025/1/12 Ver.1.3.0
 * 複数ステートの個別ダメージ表示・戦闘ログ対応版を作成。
 * 2024/6/28 Ver.1.2.0
 * 移動時のスリップダメージ時にSEを再生する機能を追加。
 * 移動時のスリップダメージ時のフラッシュの色を指定、フラッシュの再生を無効にする機能を追加。
 * 
 * @param SlipSeSetting
 * @text SE設定
 * @default ------------------------------
 * 
 * @param SlipDamageSe
 * @text 移動時スリップダメージSE
 * @desc 移動時のスリップダメージのSEを設定します。
 * @type struct<SlipSeSetting>
 * @default
 * @parent SlipSeSetting
 * 
 * @param FlashSetting
 * @text 移動時フラッシュ設定
 * @default ------------------------------
 * 
 * @param SlipDamageFlashColor
 * @text フラッシュ色
 * @desc 移動時のスリップダメージ時のフラッシュの色。フレーム数を0にすることでフラッシュしません。
 * @type struct<FlashColorSetting>
 * @default {"red":"255","green":"0","blue":"0","gray":"128","flame":"8"}
 * @parent FlashSetting
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
/*~struct~FlashColorSetting:
 * 
 * @param red
 * @text 赤
 * @desc 赤
 * @type number
 * @min 0
 * @max 255
 * @default 255
 * 
 * @param green
 * @text 緑
 * @desc 緑
 * @type number
 * @min 0
 * @max 255
 * @default 0
 * 
 * @param blue
 * @text 青
 * @desc 青
 * @type number
 * @min 0
 * @max 255
 * @default 0
 * 
 * @param gray
 * @text グレー
 * @desc グレー
 * @type number
 * @min 0
 * @max 255
 * @default 128
 * 
 * @param flame
 * @text フレーム数
 * @desc フレーム数
 * @type number
 * @min 0
 * @max 9999
 * @default 8
 * 
 */
/*~struct~SlipSeSetting:
 * 
 * @param SlipDamageSE
 * @text スリップダメージ時SE
 * @desc スリップダメージ時のSE
 * @type file
 * @dir audio/se/
 * 
 * @param volume
 * @text 音量
 * @desc 音量。
 * @type number
 * @default 90
 * @min 0
 * @max 9999
 * 
 * @param pitch
 * @text ピッチ
 * @desc ピッチ。
 * @type number
 * @default 100
 * 
 * @param pan
 * @text 位相
 * @desc 位相。
 * @type number
 * @default 0
 * @max 100
 * @min -100
 * 
 */
var Imported = Imported || {};
Imported.NUUN_SlipDamageEX = true;
Imported.NUUN_SlipDamageEX_Individual = true;
Imported.NUUN_SlipDamageEX_Modified = true;

(() => {
const params = Nuun_PluginParams.getPluginParams(document.currentScript);
const parameters = PluginManager.parameters('NUUN_SlipDamageEX_Modified');
let _onMapSlipDamage = false;

// パラメータ取得
const showBattleLog = params.ShowBattleLog !== undefined ? params.ShowBattleLog : true;
const slipDamageLogFormat = params.SlipDamageLogFormat || '%1は%2により%3のダメージを受けた！';
const slipHealLogFormat = params.SlipHealLogFormat || '%1は%2により%3回復した！';
const popupDelay = params.PopupDelay || 8;

// スリップダメージキューを管理
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
        type: type // 'hp', 'mp', 'tp'
    });
};

Game_Battler.prototype.getSlipDamageQueue = function() {
    return this._slipDamageQueue || [];
};

Game_Battler.prototype.clearSlipDamageQueue = function() {
    this._slipDamageQueue = [];
};

// 割合スリップダメージ（従来通り累積）
Game_Battler.prototype.slipDamageEX = function(type) {
    let slipDamage = 0;
    const tag = 'SlipDamage' + type;
    const b = this;
    const db = this.isActor() ? this.actor() : this.enemy();
    for (const stateId of this._states) {
        const data = $dataStates[stateId].meta[tag];
        if (data) {
            const st = this.getStateNowTurn(stateId);
            slipDamage += eval(data) / 100;
        }
    }
    return slipDamage;
};

// 固定スリップダメージ（各ステートの情報を配列で返す）
Game_Battler.prototype.slipDamageFixedEXList = function(type) {
    const list = [];
    const tag = 'SlipDamageFixed' + type;
    const b = this;
    const db = this.isActor() ? this.actor() : this.enemy();
    for (const stateId of this._states) {
        const state = $dataStates[stateId];
        const data = state.meta[tag];
        if (data) {
            const st = this.getStateNowTurn(stateId);
            const value = eval(data);
            if (value !== 0) {
                list.push({
                    stateId: stateId,
                    stateName: state.name,
                    value: value
                });
            }
        }
    }
    return list;
};

// 固定スリップダメージ合計（従来互換）
Game_Battler.prototype.slipDamageFixedEX = function(type) {
    let slipDamage = 0;
    const list = this.slipDamageFixedEXList(type);
    for (const item of list) {
        slipDamage += item.value;
    }
    return slipDamage;
};

// HP再生処理（個別表示対応版）
const _Game_Battler_regenerateHp = Game_Battler.prototype.regenerateHp;
Game_Battler.prototype.regenerateHp = function() {
    // 元の処理（通常の再生）
    _Game_Battler_regenerateHp.call(this);
    
    // 割合スリップダメージ（まとめて処理）
    const minRecover = -this.maxSlipDamage();
    const percentValue = Math.max(Math.floor(this.mhp * this.slipDamageEX('HP')), minRecover);
    if (percentValue !== 0) {
        const hpDamage = this._result.hpDamage;
        this.gainHp(percentValue);
        this._result.hpDamage += hpDamage;
    }
    
    // 固定スリップダメージ（個別にキューに追加）
    const fixedList = this.slipDamageFixedEXList('HP');
    for (const item of fixedList) {
        this.addSlipDamageQueue(item.stateId, item.stateName, item.value, 'hp');
    }
};

// MP再生処理（個別表示対応版）
const _Game_Battler_regenerateMp = Game_Battler.prototype.regenerateMp;
Game_Battler.prototype.regenerateMp = function() {
    _Game_Battler_regenerateMp.call(this);
    
    // 割合スリップダメージ
    const percentValue = Math.floor(this.mmp * this.slipDamageEX('MP'));
    if (percentValue !== 0) {
        const mpDamage = this._result.mpDamage;
        this.gainMp(percentValue);
        this._result.mpDamage += mpDamage;
    }
    
    // 固定スリップダメージ（個別にキューに追加）
    const fixedList = this.slipDamageFixedEXList('MP');
    for (const item of fixedList) {
        this.addSlipDamageQueue(item.stateId, item.stateName, item.value, 'mp');
    }
};

// TP再生処理（個別表示対応版）
const _Game_Battler_regenerateTp = Game_Battler.prototype.regenerateTp;
Game_Battler.prototype.regenerateTp = function() {
    _Game_Battler_regenerateTp.call(this);
    
    // 割合スリップダメージ
    const percentValue = Math.floor(100 * this.slipDamageEX('TP'));
    if (percentValue !== 0) {
        const tpDamage = this._result.tpDamage;
        this.gainSilentTp(percentValue);
        this._result.tpDamage += tpDamage;
    }
    
    // 固定スリップダメージ（個別にキューに追加）
    const fixedList = this.slipDamageFixedEXList('TP');
    for (const item of fixedList) {
        this.addSlipDamageQueue(item.stateId, item.stateName, item.value, 'tp');
    }
};

// ターン終了時に固定スリップダメージを個別処理
const _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
Game_Battler.prototype.onTurnEnd = function() {
    // キューを初期化
    this.initSlipDamageQueue();
    
    // 元の処理（regenerate系が呼ばれる）
    _Game_Battler_onTurnEnd.call(this);
};

// BattleManager: 固定スリップダメージの個別表示処理
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
    
    // 【修正】スリップダメージフラグを設定
    battler._result._isSlipDamageKe = true;
    
    if (type === 'hp') {
        battler.gainHp(value);
    } else if (type === 'mp') {
        battler.gainMp(value);
    } else if (type === 'tp') {
        battler.gainSilentTp(value);
    }
    
    // ダメージポップアップを表示
    if (type === 'hp') {
        battler._result.hpDamage = -value;
        battler.startDamagePopup();
    } else if (type === 'mp') {
        battler._result.mpDamage = -value;
        battler.startDamagePopup();
    }
    
    // 戦闘ログに表示
    if (showBattleLog && this._logWindow) {
        const targetName = battler.name();
        const absValue = Math.abs(value);
        
        if (value < 0) {
            // ダメージ
            const text = slipDamageLogFormat.format(targetName, stateName, absValue);
            this._logWindow.push('addText', text);
        } else if (value > 0) {
            // 回復
            const text = slipHealLogFormat.format(targetName, stateName, absValue);
            this._logWindow.push('addText', text);
        }
    }
};

// マップ上での処理（従来通り）
const _Game_Actor_turnEndOnMap = Game_Actor.prototype.turnEndOnMap;
Game_Actor.prototype.turnEndOnMap = function() {
    _onMapSlipDamage = true;
    _Game_Actor_turnEndOnMap.apply(this, arguments);
    _onMapSlipDamage = false;
};

const _Game_Actor_performMapDamage = Game_Actor.prototype.performMapDamage;
Game_Actor.prototype.performMapDamage = function() {
    const slipDamage = _onMapSlipDamage;
    _Game_Actor_performMapDamage.apply(this, arguments);
    this.exSlipDamage(slipDamage);
};

Game_Actor.prototype.exSlipDamage = function(mode) {
    if (mode) {
        this.slipDamagePlaySe();
    }
};

Game_Actor.prototype.slipDamagePlaySe = function() {
    if (params.SlipDamageSe && params.SlipDamageSe.SlipDamageSE) {
        AudioManager.playSe({
            "name": params.SlipDamageSe.SlipDamageSE,
            "volume": params.SlipDamageSe.volume,
            "pitch": params.SlipDamageSe.pitch,
            "pan": params.SlipDamageSe.pan
        });
    }
};

const _Game_Screen_startFlashForDamage = Game_Screen.prototype.startFlashForDamage;
Game_Screen.prototype.startFlashForDamage = function() {
    if (_onMapSlipDamage) {
        this.startFlashSlipDamage();
    } else {
        _Game_Screen_startFlashForDamage.apply(this, arguments);
    }
};

Game_Screen.prototype.startFlashSlipDamage = function() {
    const flashColor = params.SlipDamageFlashColor;
    if (!flashColor) {
        _Game_Screen_startFlashForDamage.apply(this, arguments);
        return;
    }
    if (flashColor.flame > 0) {
        this.startFlash([flashColor.red, flashColor.green, flashColor.blue, flashColor.gray], flashColor.flame);
    }
};

})();
