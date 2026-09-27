//=============================================================================
// RPG Maker MZ - Enemy Escape Skill
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 敵が特殊効果「逃げる」のスキルを使ったとき、成功率と結果を戦闘ログに表示し、成功時は戦闘を中断します。(v1.0.0)
 * @author Copilot
 * @orderAfter Battle/Log/RIT_BattleLogEx
 * @orderAfter Battle/Log/MPP_SmoothBattleLog
 *
 * @help
 * 敵が「特殊効果：逃げる」を持つスキルを使用したときの処理を拡張します。
 *
 * ・逃走を試みた時点で、成功率を戦闘ログに表示します。
 * ・判定に失敗した場合は逃げられなかった旨を戦闘ログに表示し、
 * 　その敵は戦闘に残ります。
 * ・判定に成功した場合は敵が戦場から消え、勝利でも敗北でもない
 * 　「戦闘中断」としてマップに戻ります。その直前に「文章の表示」と同じ
 * 　メッセージウィンドウで中断メッセージを表示します。
 * 　（イベントコマンド「戦闘の処理」では「逃げたとき」の分岐に入ります）
 *
 * 成功率は敵のメモ欄で個別に指定できます。
 *   <スキル逃走率:70>   … 70% で成功
 * 指定が無い場合は 0.5 × 敵の敏捷性 ÷ パーティの平均敏捷性 を用い、
 * 下限率・上限率でクランプします。
 *
 * アクターが「逃げる」効果のスキル・アイテムを使った場合は
 * ツクール標準の動作のままです。
 *
 * @param MinRate
 * @text 下限成功率
 * @desc 自動計算時の成功率の下限(%)。
 * @type number
 * @min 0
 * @max 100
 * @default 10
 *
 * @param MaxRate
 * @text 上限成功率
 * @desc 自動計算時の成功率の上限(%)。
 * @type number
 * @min 0
 * @max 100
 * @default 100
 *
 * @param TryFormat
 * @text 逃走試行の書式
 * @desc %1 が敵の名前、%2 が成功率(整数)に置き換わります。
 * @type string
 * @default %1は逃げ出そうとした！（成功率 %2%）
 *
 * @param SuccessFormat
 * @text 逃走成功の書式
 * @desc %1 が敵の名前に置き換わります。
 * @type string
 * @default %1は逃げ出した！
 *
 * @param FailureFormat
 * @text 逃走失敗の書式
 * @desc %1 が敵の名前に置き換わります。
 * @type string
 * @default しかし%1は逃げられなかった！
 *
 * @param AbortMessage
 * @text 戦闘中断メッセージ
 * @desc 逃走成功で戦闘が中断されるときにメッセージウィンドウで表示する文章。%1 が敵の名前に置き換わります。空欄で非表示。
 * @type string
 * @default 逃げられてしまった・・・
 */

(() => {
    "use strict";

    const pluginName = "EnemyEscapeSkill";
    const parameters = PluginManager.parameters(pluginName);
    const paramMinRate = Number(parameters.MinRate ?? 10);
    const paramMaxRate = Number(parameters.MaxRate ?? 100);
    const paramTryFormat = String(parameters.TryFormat || "%1は逃げ出そうとした！（成功率 %2%）");
    const paramSuccessFormat = String(parameters.SuccessFormat || "%1は逃げ出した！");
    const paramFailureFormat = String(parameters.FailureFormat || "しかし%1は逃げられなかった！");
    const paramAbortMessage =
        parameters.AbortMessage === undefined ? "逃げられてしまった・・・" : String(parameters.AbortMessage);

    const clamp01 = value => Math.min(Math.max(Number(value) || 0, 0), 1);

    function noteRate(enemy) {
        const data = enemy.enemy ? enemy.enemy() : null;
        const meta = data && data.meta ? data.meta["スキル逃走率"] ?? data.meta.SkillEscapeRate : undefined;
        if (meta === undefined || meta === null || meta === true) return null;
        const value = Number(String(meta).trim());
        return Number.isFinite(value) ? clamp01(value / 100) : null;
    }

    Game_Enemy.prototype.escapeSkillRate = function() {
        const tagged = noteRate(this);
        if (tagged !== null) return tagged;
        const partyAgility = $gameParty.agility() || 1;
        const rate = (0.5 * this.agi) / partyAgility;
        const min = clamp01(paramMinRate / 100);
        const max = clamp01(paramMaxRate / 100);
        return Math.min(Math.max(clamp01(rate), min), Math.max(min, max));
    };

    const _Game_Action_itemEffectSpecial = Game_Action.prototype.itemEffectSpecial;
    Game_Action.prototype.itemEffectSpecial = function(target, effect) {
        const isEscape = effect.dataId === Game_Action.SPECIAL_EFFECT_ESCAPE;
        if (isEscape && target.isEnemy() && $gameParty.inBattle()) {
            this.applyEnemyEscapeSkill(target);
            return;
        }
        _Game_Action_itemEffectSpecial.call(this, target, effect);
    };

    Game_Action.prototype.applyEnemyEscapeSkill = function(target) {
        const rate = target.escapeSkillRate();
        const success = Math.random() < rate;
        this.makeSuccess(target);
        target.result().enemyEscapeSkill = { rate: Math.round(rate * 100), success };
        if (success) {
            target.escape();
            BattleManager.requestEnemyEscapeAbort(target.name());
        }
    };

    const _BattleManager_initMembers = BattleManager.initMembers;
    BattleManager.initMembers = function() {
        _BattleManager_initMembers.call(this);
        this._enemyEscapeAbort = false;
        this._enemyEscapeName = "";
    };

    BattleManager.requestEnemyEscapeAbort = function(enemyName) {
        this._enemyEscapeAbort = true;
        this._enemyEscapeName = enemyName || "";
    };

    const _BattleManager_checkBattleEnd = BattleManager.checkBattleEnd;
    BattleManager.checkBattleEnd = function() {
        if (this._phase && this._enemyEscapeAbort) {
            this._enemyEscapeAbort = false;
            this.processEnemyEscapeAbort();
            return true;
        }
        return _BattleManager_checkBattleEnd.call(this);
    };

    // 勝利・敗北のいずれでもない中断としてマップへ戻す(_escaped は立てない)。
    BattleManager.processEnemyEscapeAbort = function() {
        this.displayEnemyEscapeAbortMessage();
        this.processAbort();
    };

    BattleManager.displayEnemyEscapeAbortMessage = function() {
        if (!paramAbortMessage) return;
        $gameMessage.add(paramAbortMessage.format(this._enemyEscapeName));
    };

    const _Window_BattleLog_displayActionResults = Window_BattleLog.prototype.displayActionResults;
    Window_BattleLog.prototype.displayActionResults = function(subject, target) {
        _Window_BattleLog_displayActionResults.call(this, subject, target);
        this.displayEnemyEscapeSkill(target);
    };

    Window_BattleLog.prototype.displayEnemyEscapeSkill = function(target) {
        const info = target.result().enemyEscapeSkill;
        if (!info) return;
        target.result().enemyEscapeSkill = null;
        this.push("pushBaseLine");
        this.push("addText", paramTryFormat.format(target.name(), info.rate));
        this.push("addText", (info.success ? paramSuccessFormat : paramFailureFormat).format(target.name()));
        this.push("waitForNewLine");
        this.push("popBaseLine");
    };
})();
