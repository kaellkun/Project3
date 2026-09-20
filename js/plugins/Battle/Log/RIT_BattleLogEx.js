//=============================================================================
// 戦闘ログ拡張プラグイン
// RIT_BattleLogEx.js
// Copyright (c) 2026
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 戦闘ログを拡張します（階層表示・想定ダメージ量・会心統合表示）
 * @author 
 * @version 2.0.0
 * @orderAfter MPP_SmoothBattleLog
 * @orderAfter RIT_HitRateDisplay
 *
 * @help
 * 戦闘ログの表示を拡張するプラグインです。
 * 
 * ■機能
 * 1. 階層表示（├ └ による視覚的な階層化）
 * 2. ステート継続メッセージのオン/オフ
 * 3. 想定ダメージ量の表示（スキル使用宣言直後）
 * 4. 会心の一撃をダメージ表示に統合
 * 
 * ■表示イメージ
 * リーシラは氷礫3連弾を放った！
 * ├ [想定ダメージ量: ATK(210)×250/100=525 倍率補正1.5倍 →787]
 * ├ [アイスオーガ] 命中率: 95%
 * │ ├ 787 のダメージを与えた！
 * │ └ 800 のダメージを与えた！会心の一撃で1.5倍！
 * └ [ゴブリン] 命中率: 100%
 *   └ 300 のダメージを与えた！
 * 
 * ■ライセンス
 * MIT License
 *
 * @param === 階層表示設定 ===
 * 
 * @param UseHierarchy
 * @text 階層表示を使用
 * @desc 戦闘ログに階層記号（├ └）を表示するか
 * @type boolean
 * @default true
 *
 * @param HierarchyBranch
 * @text 途中の記号
 * @desc 階層途中に使用する記号
 * @type string
 * @default ├ 
 *
 * @param HierarchyEnd
 * @text 最後の記号
 * @desc 階層最後に使用する記号
 * @type string
 * @default └ 
 *
 * @param HierarchyLine
 * @text 継続線の記号
 * @desc 計算式などの追加行に使用する記号
 * @type string
 * @default │ 
 *
 * @param === ステート設定 ===
 *
 * @param ShowStateContinueMessage
 * @text ステート継続メッセージ
 * @desc ステートの継続メッセージ（message3）を表示するか
 * @type boolean
 * @default false
 *
 * @param === 想定ダメージ量設定 ===
 *
 * @param ShowExpectedDamage
 * @text 想定ダメージ量を表示
 * @desc 想定ダメージ量を表示するか
 * @type boolean
 * @default true
 *
 * @param ExpectedDamageFormat
 * @text 想定ダメージ量の表示形式
 * @desc %1=計算式, %2=基礎ダメージ, %3=倍率情報, %4=最終ダメージ
 * @type string
 * @default [想定ダメージ量: %1=%2%3 →%4]
 *
 * @param === 会心設定 ===
 *
 * @param CriticalFormat
 * @text 会心表示形式
 * @desc 会心時にダメージ後に追加する文字列。%1=倍率
 * @type string
 * @default 会心の一撃で%1倍！
 *
 */

(() => {
    'use strict';

    const pluginName = 'RIT_BattleLogEx';
    const parameters = PluginManager.parameters(pluginName);
    
    // 階層表示設定
    const param_UseHierarchy = parameters['UseHierarchy'] !== 'false';
    const param_HierarchyBranch = parameters['HierarchyBranch'] || '├ ';
    const param_HierarchyEnd = parameters['HierarchyEnd'] || '└ ';
    const param_HierarchyLine = parameters['HierarchyLine'] || '│ ';
    
    // 他のプラグインから参照できるようグローバルに公開
    window.RIT_BattleLogEx = {
        UseHierarchy: param_UseHierarchy,
        Branch: param_HierarchyBranch,
        End: param_HierarchyEnd,
        Line: param_HierarchyLine
    };
    
    // ステート設定
    const param_ShowStateContinueMessage = parameters['ShowStateContinueMessage'] === 'true';
    
    // 想定ダメージ量設定
    const param_ShowExpectedDamage = parameters['ShowExpectedDamage'] !== 'false';
    const param_ExpectedDamageFormat = parameters['ExpectedDamageFormat'] || '[想定ダメージ量: %1=%2%3 →%4]';
    
    // 会心設定
    const param_CriticalFormat = parameters['CriticalFormat'] || '会心の一撃で%1倍！';

    // 現在のアクション情報
    let _currentAction = null;
    let _currentTargets = [];
    let _currentTargetIndex = 0;
    let _targetHitCounts = {};  // 対象ごとのヒット数
    let _expectedDamageDisplayed = false;  // 想定ダメージ量表示済みフラグ

    //=========================================================================
    // 階層表示用のユーティリティ
    //=========================================================================

    /**
     * 階層記号を取得（レベル1）
     */
    function getLevel1Symbol(isLast) {
        if (!param_UseHierarchy) return '';
        return isLast ? param_HierarchyEnd : param_HierarchyBranch;
    }

    /**
     * 階層記号を取得（レベル2 - 対象内のダメージ表示用）
     */
    function getLevel2Symbol(isLast) {
        if (!param_UseHierarchy) return '  ';
        return param_HierarchyLine + (isLast ? param_HierarchyEnd : param_HierarchyBranch);
    }

    //=========================================================================
    // 想定ダメージ量の計算
    //=========================================================================

    /**
     * 想定ダメージ量を計算（最初のターゲットを基準）
     */
    function calculateExpectedDamage(action, targets) {
        if (!action || !targets || targets.length === 0) return null;
        
        const item = action.item();
        if (!item || !item.damage || item.damage.type === 0) return null;
        
        const formula = item.damage.formula;
        if (!formula) return null;
        
        const a = action.subject();
        const b = targets[0];  // 最初のターゲットを基準
        const v = $gameVariables._data;
        
        // 基礎ダメージを計算
        let baseDamage = 0;
        try {
            baseDamage = Math.max(eval(formula), 0);
        } catch (e) {
            return null;
        }
        
        // 属性倍率を取得
        let elementRate = 1;
        try {
            elementRate = action.calcElementRate(b);
        } catch (e) {
            elementRate = 1;
        }
        
        // 計算式を人間が読める形式に変換
        let readableFormula = formula;
        
        // a.xxx を実際の値に置き換え
        readableFormula = readableFormula.replace(/a\.atk/g, `ATK(${a.atk})`);
        readableFormula = readableFormula.replace(/a\.mat/g, `MAT(${a.mat})`);
        readableFormula = readableFormula.replace(/a\.def/g, `DEF(${a.def})`);
        readableFormula = readableFormula.replace(/a\.mdf/g, `MDF(${a.mdf})`);
        readableFormula = readableFormula.replace(/a\.agi/g, `AGI(${a.agi})`);
        readableFormula = readableFormula.replace(/a\.luk/g, `LUK(${a.luk})`);
        readableFormula = readableFormula.replace(/a\.mhp/g, `MHP(${a.mhp})`);
        readableFormula = readableFormula.replace(/a\.mmp/g, `MMP(${a.mmp})`);
        readableFormula = readableFormula.replace(/a\.hp/g, `HP(${a.hp})`);
        readableFormula = readableFormula.replace(/a\.mp/g, `MP(${a.mp})`);
        readableFormula = readableFormula.replace(/a\.tp/g, `TP(${a.tp})`);
        readableFormula = readableFormula.replace(/a\.level/g, `Lv(${a.level || 1})`);
        
        readableFormula = readableFormula.replace(/b\.atk/g, `敵ATK(${b.atk})`);
        readableFormula = readableFormula.replace(/b\.mat/g, `敵MAT(${b.mat})`);
        readableFormula = readableFormula.replace(/b\.def/g, `敵DEF(${b.def})`);
        readableFormula = readableFormula.replace(/b\.mdf/g, `敵MDF(${b.mdf})`);
        readableFormula = readableFormula.replace(/b\.agi/g, `敵AGI(${b.agi})`);
        readableFormula = readableFormula.replace(/b\.luk/g, `敵LUK(${b.luk})`);
        readableFormula = readableFormula.replace(/b\.mhp/g, `敵MHP(${b.mhp})`);
        readableFormula = readableFormula.replace(/b\.mmp/g, `敵MMP(${b.mmp})`);
        readableFormula = readableFormula.replace(/b\.hp/g, `敵HP(${b.hp})`);
        readableFormula = readableFormula.replace(/b\.mp/g, `敵MP(${b.mp})`);
        
        // 演算子を見やすく
        readableFormula = readableFormula.replace(/\*/g, '×');
        readableFormula = readableFormula.replace(/\//g, '÷');
        readableFormula = readableFormula.replace(/\s+/g, '');
        
        // 倍率補正テキスト
        let rateText = '';
        if (elementRate !== 1) {
            const rateStr = elementRate.toFixed(2).replace(/\.?0+$/, '');
            rateText = ` 倍率補正${rateStr}倍`;
        }
        
        // 最終ダメージ
        const finalDamage = Math.floor(baseDamage * elementRate);
        
        return {
            formula: readableFormula,
            baseDamage: Math.floor(baseDamage),
            rateText: rateText,
            finalDamage: finalDamage
        };
    }

    //=========================================================================
    // Window_BattleLog の拡張
    //=========================================================================

    // アクション開始時
    const _Window_BattleLog_startAction = Window_BattleLog.prototype.startAction;
    Window_BattleLog.prototype.startAction = function(subject, action, targets) {
        _currentAction = action;
        _currentTargets = targets.slice();
        _currentTargetIndex = 0;
        _targetHitCounts = {};
        _expectedDamageDisplayed = false;
        
        // 各ターゲットのヒット数を初期化
        targets.forEach((target, index) => {
            _targetHitCounts[index] = { current: 0, total: 0 };
        });
        
        _Window_BattleLog_startAction.apply(this, arguments);
    };

    // スキル使用メッセージ表示後に想定ダメージ量を追加
    const _Window_BattleLog_displayAction = Window_BattleLog.prototype.displayAction;
    Window_BattleLog.prototype.displayAction = function(subject, item) {
        _Window_BattleLog_displayAction.apply(this, arguments);
        
        // 想定ダメージ量を表示
        if (param_ShowExpectedDamage && !_expectedDamageDisplayed && _currentAction) {
            this.displayExpectedDamage();
            _expectedDamageDisplayed = true;
        }
    };

    /**
     * 想定ダメージ量を表示
     */
    Window_BattleLog.prototype.displayExpectedDamage = function() {
        const info = calculateExpectedDamage(_currentAction, _currentTargets);
        if (!info) return;
        
        const symbol = getLevel1Symbol(false);
        const text = param_ExpectedDamageFormat
            .replace('%1', info.formula)
            .replace('%2', info.baseDamage)
            .replace('%3', info.rateText)
            .replace('%4', info.finalDamage);
        
        this.push('addText', symbol + '\\C[8]' + text + '\\C[0]');
    };

    // アクション終了時
    const _Window_BattleLog_endAction = Window_BattleLog.prototype.endAction;
    Window_BattleLog.prototype.endAction = function(subject) {
        _currentAction = null;
        _currentTargets = [];
        _currentTargetIndex = 0;
        _targetHitCounts = {};
        _expectedDamageDisplayed = false;
        _Window_BattleLog_endAction.apply(this, arguments);
    };

    // バトルログのclear時にもフラグをリセット
    const _Window_BattleLog_clear = Window_BattleLog.prototype.clear;
    Window_BattleLog.prototype.clear = function() {
        _Window_BattleLog_clear.apply(this, arguments);
        _expectedDamageDisplayed = false;
    };

    //=========================================================================
    // ダメージ表示の拡張
    //=========================================================================

    // HPダメージ表示をオーバーライド
    const _Window_BattleLog_displayHpDamage = Window_BattleLog.prototype.displayHpDamage;
    Window_BattleLog.prototype.displayHpDamage = function(target) {
        if (target.result().hpAffected) {
            const result = target.result();
            const hpDamage = result.hpDamage;
            
            if (hpDamage > 0) {
                // ダメージ
                let text = target.name() + 'に ' + hpDamage + ' のダメージを与えた！';
                
                // 会心の一撃を統合表示
                if (result.critical) {
                    let critRate = 1.5;
                    try {
                        if (_currentAction) {
                            const testDamage = 1000;
                            const critDamage = _currentAction.applyCritical(testDamage);
                            critRate = critDamage / testDamage;
                        }
                    } catch (e) {
                        critRate = 1.5;
                    }
                    const critRateStr = critRate.toFixed(1).replace(/\.0$/, '');
                    text += param_CriticalFormat.replace('%1', critRateStr);
                }
                
                this.push("addText", this.getHierarchyPrefix(target) + text);
            } else if (hpDamage < 0) {
                // 回復
                const text = target.name() + 'の HPが ' + (-hpDamage) + ' 回復した！';
                this.push("addText", this.getHierarchyPrefix(target) + text);
            } else if (hpDamage === 0) {
                // ノーダメージ
                const text = target.name() + 'に ダメージを与えられなかった！';
                this.push("addText", this.getHierarchyPrefix(target) + text);
            }
        }
    };

    // MPダメージ表示をオーバーライド
    const _Window_BattleLog_displayMpDamage = Window_BattleLog.prototype.displayMpDamage;
    Window_BattleLog.prototype.displayMpDamage = function(target) {
        if (target.isAlive() && target.result().mpDamage !== 0) {
            const mpDamage = target.result().mpDamage;
            let text;
            if (mpDamage < 0) {
                text = target.name() + 'の MPが ' + (-mpDamage) + ' 回復した！';
            } else {
                text = target.name() + 'の MPが ' + mpDamage + ' 減った！';
            }
            this.push("addText", this.getHierarchyPrefix(target) + text);
        }
    };

    // TPダメージ表示をオーバーライド
    const _Window_BattleLog_displayTpDamage = Window_BattleLog.prototype.displayTpDamage;
    Window_BattleLog.prototype.displayTpDamage = function(target) {
        if (target.isAlive() && target.result().tpDamage !== 0) {
            const tpDamage = target.result().tpDamage;
            let text;
            if (tpDamage < 0) {
                text = target.name() + 'の TPが ' + (-tpDamage) + ' 回復した！';
            } else {
                text = target.name() + 'の TPが ' + tpDamage + ' 減った！';
            }
            this.push("addText", this.getHierarchyPrefix(target) + text);
        }
    };

    /**
     * 階層プレフィックスを取得
     */
    Window_BattleLog.prototype.getHierarchyPrefix = function(target) {
        if (!param_UseHierarchy) return '';
        
        // RIT_HitRateDisplayが対象ごとの命中率表示をしている場合、
        // ダメージ表示はレベル2の階層になる
        if (window.RIT_HitRateDisplay && window.RIT_HitRateDisplay.isTargetHeaderDisplayed) {
            return getLevel2Symbol(false);
        }
        
        return getLevel1Symbol(false);
    };

    // ミス表示
    const _Window_BattleLog_displayMiss = Window_BattleLog.prototype.displayMiss;
    Window_BattleLog.prototype.displayMiss = function(target) {
        let fmt;
        if (target.result().physical) {
            fmt = TextManager.actorNoHit;
        } else {
            fmt = TextManager.actionFailure;
        }
        this.push("addText", this.getHierarchyPrefix(target) + fmt.format(target.name()));
    };

    // 回避表示
    const _Window_BattleLog_displayEvasion = Window_BattleLog.prototype.displayEvasion;
    Window_BattleLog.prototype.displayEvasion = function(target) {
        let fmt;
        if (target.result().physical) {
            fmt = TextManager.evasion;
        } else {
            fmt = TextManager.magicEvasion;
        }
        this.push("addText", this.getHierarchyPrefix(target) + fmt.format(target.name()));
    };

    // 会心表示を無効化（ダメージ表示に統合したため）
    Window_BattleLog.prototype.displayCritical = function(target) {
        // 何もしない（会心表示はdisplayHpDamageで統合表示）
    };

    // ステート付与表示
    const _Window_BattleLog_displayAddedStates = Window_BattleLog.prototype.displayAddedStates;
    Window_BattleLog.prototype.displayAddedStates = function(target) {
        const result = target.result();
        const states = result.addedStateObjects();
        for (const state of states) {
            const stateText = target.isActor() ? state.message1 : state.message2;
            if (stateText) {
                const symbol = param_UseHierarchy ? param_HierarchyBranch : '';
                this.push("addText", symbol + stateText.format(target.name()));
            }
        }
    };

    //=========================================================================
    // ステート継続メッセージの制御
    //=========================================================================

    const _Window_BattleLog_displayCurrentState = Window_BattleLog.prototype.displayCurrentState;
    Window_BattleLog.prototype.displayCurrentState = function(subject) {
        if (param_ShowStateContinueMessage) {
            _Window_BattleLog_displayCurrentState.apply(this, arguments);
        }
        // param_ShowStateContinueMessageがfalseの場合は何も表示しない
    };

})();
