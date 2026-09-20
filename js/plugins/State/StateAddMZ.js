/*=============================================================================
 StateAddMZ.js
----------------------------------------------------------------------------
 (C)2023 Kuchinashi
 This software is released under the MIT License.
 http://opensource.org/licenses/mit-license.php
----------------------------------------------------------------------------
 Version
 1.0.0 2023/04/15 初版
 1.1.0 2025/01/22 複数ステート同時付与に対応（修正版）
----------------------------------------------------------------------------
 [github] https://github.com/Kuchinashi-W/Plugin/blob/main/StateAddMZ.js
=============================================================================*/

/*:
 * @plugindesc ステートターン数蓄積プラグイン（複数ステート対応版）
 * @target MZ
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 * @author 梔子 (参考 トリアコンタン様のStateTurnKeep.jsプラグイン) / Modified
 *
 * @param outOfTargets
 * @text 対象外ステート
 * @desc ターン数蓄積の対象外となるステートです。ここで指定したステートは通常仕様通りに初期化されます。
 * @default []
 * @type state[]
 *
 * @help StateAddMZ.js
 *
 * ステートを重ね掛けしたとき、ターン数を初期化せず
 * 蓄積するように仕様変更致します。
 * また、メモ欄にメタタグを記入することにより、付与するステートのターン数を
 * スキルごと、アイテムごとに追加することができます。
 * 
 * ============================================================================
 * ■ v1.1.0 修正内容
 * ============================================================================
 * 複数のステートを同時に付与するスキル/アイテムに対応しました。
 * 
 * 【単一ステートの場合】（従来通り）
 * <addStateID:x>           x:ステートのID
 * <addStateExtraTurn:y>    y:追加する継続ターン数
 * 
 * 【複数ステートの場合】（新機能）
 * <addStateTurn ステートID:追加ターン>
 * 
 * 複数指定する場合は複数行記述してください：
 * <addStateTurn 10:2>
 * <addStateTurn 11:3>
 * <addStateTurn 12:2>
 * 
 * または、カンマ区切りで1行に記述：
 * <addStateTurns 10:2, 11:3, 12:2>
 * 
 * ============================================================================
 * ■ 使用例
 * ============================================================================
 * 例1: 単一ステート（従来方式）
 *   RPGツクールのデータベースでステート4番の毒の継続ターン数を1ターンに設定。
 *   スキル『毒液』のステート付加に毒を付加を設定。
 *   スキルのメモ欄に以下のように記入：
 *     <addStateID:4>
 *     <addStateExtraTurn:2>
 *   → 毒液を使用すると毒ステートの継続ターン数が1 + 2で3ターンとなる。
 * 
 * 例2: 複数ステート（新方式）
 *   スキル『禁断の一滴』で液体毒(10)、溶解(11)、腐食(12)を付与する場合：
 *     <addStateTurn 10:4>
 *     <addStateTurn 11:4>
 *     <addStateTurn 12:4>
 *   → 各ステートにそれぞれ4ターン追加される
 * 
 * 例3: 複数ステート（1行記述）
 *     <addStateTurns 10:4, 11:4, 12:4>
 *   → 上記と同じ効果
 * 
 * ============================================================================
 * 
 * ステートの残りターン数が分かるプラグインなど入れると分かりやすくなります。
 * 
 * このプラグインの利用にはベースプラグイン『PluginCommonBase.js』が必要です。
 * 『PluginCommonBase.js』は、RPGツクールMZのインストールフォルダ配下の
 * 以下のフォルダに格納されています。
 * dlc/BasicResources/plugins/official
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 */

(() => {
    'use strict';
    const script = document.currentScript;
    const param = PluginManagerEx.createParameter(script);
    if (!param.outOfTargets) {
        param.outOfTargets = [];
    }
    
    // 【修正】複数ステート対応: オブジェクトで管理
    let extraTurnMap = {};  // { stateId: extraTurn, ... }

    /**
     * メモ欄から追加ターン情報を解析
     * @param {Object} item - スキルまたはアイテム
     * @returns {Object} { stateId: extraTurn, ... }
     */
    function parseExtraTurns(item) {
        const result = {};
        if (!item || !item.note) return result;
        
        const note = item.note;
        
        // 従来形式: <addStateID:x> と <addStateExtraTurn:y>
        if (item.meta.addStateID && item.meta.addStateExtraTurn) {
            const stateId = Number(item.meta.addStateID);
            const extraTurn = Number(item.meta.addStateExtraTurn);
            if (stateId > 0 && extraTurn) {
                result[stateId] = extraTurn;
            }
        }
        
        // 新形式1: <addStateTurn ステートID:追加ターン> （複数行対応）
        const singlePattern = /<addStateTurn\s+(\d+)\s*:\s*(\d+)>/gi;
        let match;
        while ((match = singlePattern.exec(note)) !== null) {
            const stateId = Number(match[1]);
            const extraTurn = Number(match[2]);
            if (stateId > 0 && extraTurn) {
                result[stateId] = extraTurn;
            }
        }
        
        // 新形式2: <addStateTurns ID:ターン, ID:ターン, ...> （1行で複数指定）
        const multiPattern = /<addStateTurns\s+([^>]+)>/gi;
        while ((match = multiPattern.exec(note)) !== null) {
            const pairs = match[1].split(',');
            for (const pair of pairs) {
                const pairMatch = pair.trim().match(/(\d+)\s*:\s*(\d+)/);
                if (pairMatch) {
                    const stateId = Number(pairMatch[1]);
                    const extraTurn = Number(pairMatch[2]);
                    if (stateId > 0 && extraTurn) {
                        result[stateId] = extraTurn;
                    }
                }
            }
        }
        
        return result;
    }

    const _Game_BattlerBase_resetStateCounts = Game_BattlerBase.prototype.resetStateCounts;
    Game_BattlerBase.prototype.resetStateCounts = function(stateId) {
        const prevTurn = this._stateTurns[stateId];
        _Game_BattlerBase_resetStateCounts.apply(this, arguments);
        
        // ターン数蓄積（対象外でない場合）
        if (prevTurn && !param.outOfTargets.includes(stateId)) {
            this._stateTurns[stateId] = prevTurn + this._stateTurns[stateId];
        }

        // 【修正】メタタグで追加ターン指定があったら追加
        if (extraTurnMap[stateId]) {
            this._stateTurns[stateId] += extraTurnMap[stateId];
            // 処理済みなので削除（同じステートが複数回処理されることを防ぐ）
            delete extraTurnMap[stateId];
        }
    };

    // 【修正】スキル/アイテム使用時にメタタグを解析
    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        const item = this.item();
        // 追加ターン情報を解析してマップに格納
        extraTurnMap = parseExtraTurns(item);
        
        _Game_Action_apply.call(this, target);
        
        // 処理後にクリア（念のため）
        // Note: resetStateCountsで個別にdeleteしているが、
        //       付与されなかったステートの情報が残らないようにする
        extraTurnMap = {};
    };
})();
