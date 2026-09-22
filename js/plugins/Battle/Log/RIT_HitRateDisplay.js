//=============================================================================
// RIT_SucHitEva対応 命中率バトルログ表示
// RIT_HitRateDisplay.js
// Copyright (c) 2026
//=============================================================================

/*:
 * @target MZ
 * @plugindesc RIT_SucHitEva.jsの命中率計算をバトルログに表示します（対象ヘッダー方式）
 * @author 
 * @version 2.0.0
 * @orderAfter RIT_SucHitEva
 * @orderAfter MPP_SmoothBattleLog
 * @orderBefore RIT_BattleLogEx
 *
 * @help
 * RIT_SucHitEva.jsで計算された最終命中率をバトルログに表示します。
 * 
 * ■表示イメージ
 * リーシラは氷礫3連弾を放った！
 * ├ [想定ダメージ量: ...]
 * ├ [アイスオーガ] 命中率: 60% [成功95%+命中補正-5%-回避30%]
 * │ ├ 787 のダメージを与えた！
 * │ └ 800 のダメージを与えた！
 * └ [ゴブリン] 命中率: 90% [成功95%+命中補正-5%-回避0%]
 *   └ 300 のダメージを与えた！
 * 
 * 表示される命中率は実際の判定(itemHit × (1 - itemEva))と同じ値です。
 * 
 * ■ライセンス
 * MIT License
 *
 * @param ShowHitRate
 * @text 命中率を表示
 * @desc 命中率をバトルログに表示するか
 * @type boolean
 * @default true
 *
 * @param ShowDetail
 * @text 詳細表示
 * @desc 命中率の内訳を詳細に表示するか
 * @type boolean
 * @default true
 *
 * @param ShowOnMissEvasion
 * @text ミス/回避時に表示
 * @desc ミスや回避が発生した時に命中率を表示するか
 * @type boolean
 * @default true
 *
 * @param MinHitRate
 * @text 最低命中率
 * @desc 表示する命中率の下限（%）
 * @type number
 * @min 0
 * @max 100
 * @default 0
 *
 * @param MaxHitRate
 * @text 最高命中率
 * @desc 表示する命中率の上限（%）
 * @type number
 * @min 0
 * @max 999
 * @default 100
 *
 */

(() => {
    'use strict';

    const pluginName = 'RIT_HitRateDisplay';
    const parameters = PluginManager.parameters(pluginName);
    
    const param_ShowHitRate = parameters['ShowHitRate'] !== 'false';
    const param_ShowDetail = parameters['ShowDetail'] !== 'false';
    const param_ShowOnMissEvasion = parameters['ShowOnMissEvasion'] !== 'false';
    const param_MinHitRate = Number(parameters['MinHitRate']) || 0;
    const param_MaxHitRate = Number(parameters['MaxHitRate']) || 100;

    // 対象ごとのヘッダー表示済みフラグ
    let _displayedTargetHeaders = new Set();
    let _currentTargets = [];
    let _isTargetHeaderDisplayed = false;
    
    // 他のプラグインから参照可能にする
    window.RIT_HitRateDisplay = {
        isTargetHeaderDisplayed: false
    };

    //=========================================================================
    // 階層記号取得（RIT_BattleLogExから取得）
    //=========================================================================

    function getLevel1Symbol(isLast) {
        if (window.RIT_BattleLogEx && window.RIT_BattleLogEx.UseHierarchy) {
            return isLast ? window.RIT_BattleLogEx.End : window.RIT_BattleLogEx.Branch;
        }
        return '';
    }

    //=========================================================================
    // Game_Action - 命中率計算情報を取得
    //=========================================================================

    /**
     * RIT_SucHitEva.jsの計算式に基づいた命中率情報を返す
     */
    Game_Action.prototype.getHitRateInfo = function(target) {
        const item = this.item();
        if (!item) {
            return { type: 'none', finalRate: 0 };
        }
        
        const successRate = item.successRate;
        let additionalSuccessRate = 0;
        
        // メモ欄から追加成功率を取得
        if (item.meta && item.meta.additionalSuccessRate) {
            additionalSuccessRate = Number(item.meta.additionalSuccessRate);
        }
        
        const info = {
            type: '',
            finalRate: 0,
            hit: 0,
            eva: 0,
            mev: 0,
            successRate: successRate,
            additionalSuccessRate: additionalSuccessRate,
            totalSuccess: successRate + additionalSuccessRate
        };
        
        // hitType: 0=必中, 1=物理, 2=魔法
        const hitType = item.hitType;
        
        if (hitType === 0) {
            info.type = 'certain';
        } else if (hitType === 1) {
            info.type = 'physical';
            // RIT_SucHitEva の命中補正。無い場合は素の命中率を表示に使う
            const correction = this.hitCorrection ? this.hitCorrection() : this.subject().hit;
            info.hit = Math.round(correction * 100);
            info.eva = Math.round(target.eva * 100);
        } else if (hitType === 2) {
            info.type = 'magical';
            info.mev = Math.round(target.mev * 100);
        } else {
            info.type = 'other';
            info.hit = Math.round(this.subject().hit * 100);
            info.eva = Math.round(target.eva * 100);
        }
        
        // 実際の判定と同じ値を表示する（成功/命中判定 × 回避判定）
        const hitChance = Math.min(Math.max(this.itemHit(target), 0), 1);
        const evaChance = Math.min(Math.max(this.itemEva(target), 0), 1);
        info.finalRate = Math.round(hitChance * (1 - evaChance) * 100);

        info.displayRate = Math.max(param_MinHitRate, Math.min(param_MaxHitRate, info.finalRate));
        
        return info;
    };

    //=========================================================================
    // Window_BattleLog - 対象ヘッダー表示
    //=========================================================================

    // アクション開始時にリセット
    const _Window_BattleLog_startAction = Window_BattleLog.prototype.startAction;
    Window_BattleLog.prototype.startAction = function(subject, action, targets) {
        _displayedTargetHeaders = new Set();
        _currentTargets = targets.slice();
        window.RIT_HitRateDisplay.isTargetHeaderDisplayed = false;
        _Window_BattleLog_startAction.apply(this, arguments);
    };

    // バトルログのclear時にもフラグをリセット
    const _Window_BattleLog_clear_HitRate = Window_BattleLog.prototype.clear;
    Window_BattleLog.prototype.clear = function() {
        _Window_BattleLog_clear_HitRate.apply(this, arguments);
        _displayedTargetHeaders = new Set();
        window.RIT_HitRateDisplay.isTargetHeaderDisplayed = false;
    };

    // アクション終了時
    const _Window_BattleLog_endAction = Window_BattleLog.prototype.endAction;
    Window_BattleLog.prototype.endAction = function(subject) {
        _displayedTargetHeaders = new Set();
        _currentTargets = [];
        window.RIT_HitRateDisplay.isTargetHeaderDisplayed = false;
        _Window_BattleLog_endAction.apply(this, arguments);
    };

    // ダメージ表示の前に対象ヘッダーを表示
    const _Window_BattleLog_displayDamage = Window_BattleLog.prototype.displayDamage;
    Window_BattleLog.prototype.displayDamage = function(target) {
        // 対象ヘッダーを表示（まだ表示していない場合）
        if (param_ShowHitRate && BattleManager._action && !_displayedTargetHeaders.has(target)) {
            this.displayTargetHeader(target, true);
            _displayedTargetHeaders.add(target);
        }
        
        _Window_BattleLog_displayDamage.apply(this, arguments);
    };

    /**
     * 対象ヘッダーを表示（命中率付き）
     * @param {Game_Battler} target - 対象
     * @param {boolean} isHit - ヒットしたかどうか
     */
    Window_BattleLog.prototype.displayTargetHeader = function(target, isHit) {
        const action = BattleManager._action;
        if (!action || !action.item()) return;
        
        const info = action.getHitRateInfo(target);
        const targetIndex = _currentTargets.indexOf(target);
        const isLastTarget = (targetIndex === _currentTargets.length - 1);
        
        const symbol = getLevel1Symbol(isLastTarget);
        
        let text = symbol + '[' + target.name() + '] 命中率: ' + info.displayRate + '%';
        
        if (param_ShowDetail) {
            text += ' ' + this.makeHitRateDetailText(info);
        }
        
        this.push('addText', text);
        
        // ヘッダー表示済みフラグをセット
        window.RIT_HitRateDisplay.isTargetHeaderDisplayed = true;
    };

    /**
     * 命中率詳細テキストを生成
     */
    Window_BattleLog.prototype.makeHitRateDetailText = function(info) {
        switch (info.type) {
            case 'physical': {
                const sign = info.hit < 0 ? '' : '+';
                return '[成功' + info.totalSuccess + '%+命中補正' + sign + info.hit + '%-回避' + info.eva + '%]';
            }
            case 'magical':
                return '[成功' + info.totalSuccess + '%-魔回避' + info.mev + '%]';
            case 'certain':
                return '[必中]';
            case 'other':
                return '[命中' + info.hit + '%-回避' + info.eva + '%]';
            default:
                return '';
        }
    };

    //=========================================================================
    // ミス/回避時の命中率表示
    //=========================================================================

    // ミス時に対象ヘッダーを表示
    const _Window_BattleLog_displayMiss = Window_BattleLog.prototype.displayMiss;
    Window_BattleLog.prototype.displayMiss = function(target) {
        // 対象ヘッダーを表示（まだ表示していない場合）
        if (param_ShowHitRate && param_ShowOnMissEvasion && BattleManager._action && !_displayedTargetHeaders.has(target)) {
            this.displayTargetHeader(target, false);
            _displayedTargetHeaders.add(target);
        }
        
        _Window_BattleLog_displayMiss.apply(this, arguments);
    };

    // 回避時に対象ヘッダーを表示
    const _Window_BattleLog_displayEvasion = Window_BattleLog.prototype.displayEvasion;
    Window_BattleLog.prototype.displayEvasion = function(target) {
        // 対象ヘッダーを表示（まだ表示していない場合）
        if (param_ShowHitRate && param_ShowOnMissEvasion && BattleManager._action && !_displayedTargetHeaders.has(target)) {
            this.displayTargetHeader(target, false);
            _displayedTargetHeaders.add(target);
        }
        
        _Window_BattleLog_displayEvasion.apply(this, arguments);
    };

})();
