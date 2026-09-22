//=============================================================================
// RPG Maker MZ - Game Over On Any Death
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 仲間が一人でも戦闘不能になるとゲームオーバーにします。
 * @author Copilot
 *
 * @help
 * 戦闘中・マップ上を問わず、現在のパーティメンバーの誰か一人が
 * 戦闘不能になった時点でゲームオーバーになります。
 *
 * 「全滅」判定そのものは変更しません。そのため、逃走・行動対象などの
 * 標準処理に影響せず、ゲームオーバーになるタイミングだけを変更します。
 *
 * プラグインリストの末尾に配置してください。
 */

(() => {
    "use strict";

    const partyHasDeadMember = () =>
        $gameParty.members().some(member => member.isDead());

    const _BattleManager_checkBattleEnd = BattleManager.checkBattleEnd;
    BattleManager.checkBattleEnd = function() {
        if (this._phase && partyHasDeadMember()) {
            this._anyMemberDeathGameOver = true;
            this.processDefeat();
            return true;
        }
        return _BattleManager_checkBattleEnd.apply(this, arguments);
    };

    const _BattleManager_updateBattleEnd = BattleManager.updateBattleEnd;
    BattleManager.updateBattleEnd = function() {
        if (this._anyMemberDeathGameOver) {
            this._anyMemberDeathGameOver = false;
            SceneManager.goto(Scene_Gameover);
            this._phase = "";
            return;
        }
        _BattleManager_updateBattleEnd.apply(this, arguments);
    };

    const _Scene_Base_checkGameover = Scene_Base.prototype.checkGameover;
    Scene_Base.prototype.checkGameover = function() {
        if (partyHasDeadMember()) {
            SceneManager.goto(Scene_Gameover);
            return;
        }
        _Scene_Base_checkGameover.apply(this, arguments);
    };
})();