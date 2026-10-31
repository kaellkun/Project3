/*:
 * @target MZ
 * @plugindesc 麻痺中の行動を30%の確率で不発にします。
 * @author kaellkun
 * @orderAfter Keke_PredictionSystem
 * @orderAfter Keke_TotalDamage
 *
 * @help
 * ステート9（麻痺）は制約を「なし」に設定してください。
 * 敵味方とも、通常行動の実行直前に1回だけ30%の確率で判定します。
 * 不発時はその行動だけを消費し、MP・TP・アイテムは消費しません。
 * 連続攻撃の各ヒットではなく、スキル・アイテム1回につき1判定です。
 * 自動行動にも適用します。イベントの強制行動、反撃、追撃は従来通りです。
 * 麻痺の付与率・持続時間・回避低下は変更しません。
 * 行動準備を拡張するプラグインより下に配置してください。
 */

(() => {
    "use strict";

    const prepare = Game_Action.prototype.prepare;
    Game_Action.prototype.prepare = function() {
        prepare.apply(this, arguments);
        const subject = this.subject();
        if (BattleManager._subject !== subject || subject.currentAction() !== this ||
            this._forcing || !subject.isStateAffected(9) || !this.isValid()) {
            return;
        }
        if (Math.random() < 0.3) {
            this.clear();
            BattleManager._logWindow.push("addText", `${subject.name()}は麻痺で動けない！`);
            BattleManager._logWindow.push("wait");
        }
    };
})();
