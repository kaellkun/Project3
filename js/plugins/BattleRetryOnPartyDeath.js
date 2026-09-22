//=============================================================================
// RPG Maker MZ - Battle Retry On Party Death
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 味方が戦闘不能になった時に、リトライかゲームオーバーを選べるようにします。
 * @author Copilot
 *
 * @help
 * 戦闘開始直前のゲーム状態を保存し、味方が戦闘不能になった時の
 * ゲームオーバー画面に「リトライ」と「ゲームオーバー」を表示します。
 * リトライを選ぶと、戦闘開始前の状態を復元して同じ戦闘を再開します。
 *
 * GameOverOnAnyDeath.js と併用する場合は、このプラグインをその後に
 * 配置してください。
 */

(() => {
    "use strict";

    const retryState = {
        contents: null,
        troopId: 0,
        canEscape: false,
        canLose: false
    };

    const clearRetryState = () => {
        retryState.contents = null;
        retryState.troopId = 0;
        retryState.canEscape = false;
        retryState.canLose = false;
    };

    const _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        retryState.contents = JsonEx.stringify(DataManager.makeSaveContents());
        retryState.troopId = troopId;
        retryState.canEscape = canEscape;
        retryState.canLose = canLose;
        _BattleManager_setup.apply(this, arguments);
    };

    const _BattleManager_processVictory = BattleManager.processVictory;
    BattleManager.processVictory = function() {
        clearRetryState();
        _BattleManager_processVictory.apply(this, arguments);
    };

    const _BattleManager_processEscape = BattleManager.processEscape;
    BattleManager.processEscape = function() {
        clearRetryState();
        _BattleManager_processEscape.apply(this, arguments);
    };

    class Window_BattleRetryCommand extends Window_Command {
        makeCommandList() {
            this.addCommand("リトライ", "retry");
            this.addCommand("タイトルに戻る", "gameover");
        }
    }

    const _Scene_Gameover_create = Scene_Gameover.prototype.create;
    Scene_Gameover.prototype.create = function() {
        _Scene_Gameover_create.apply(this, arguments);
        if (retryState.contents) {
            this.createWindowLayer();
            const width = 360;
            const height = this.calcWindowHeight(2, true);
            const rect = new Rectangle(
                (Graphics.boxWidth - width) / 2,
                Graphics.boxHeight - height - 48,
                width,
                height
            );
            this._battleRetryWindow = new Window_BattleRetryCommand(rect);
            this._battleRetryWindow.setHandler("retry", this.retryBattle.bind(this));
            this._battleRetryWindow.setHandler("gameover", this.gotoTitle.bind(this));
            this.addWindow(this._battleRetryWindow);
        }
    };

    const _Scene_Gameover_update = Scene_Gameover.prototype.update;
    Scene_Gameover.prototype.update = function() {
        if (this._battleRetryWindow) {
            Scene_Base.prototype.update.call(this);
        } else {
            _Scene_Gameover_update.apply(this, arguments);
        }
    };

    Scene_Gameover.prototype.retryBattle = function() {
        if (!retryState.contents) {
            this.gotoTitle();
            return;
        }

        const contents = JsonEx.parse(retryState.contents);
        const troopId = retryState.troopId;
        const canEscape = retryState.canEscape;
        const canLose = retryState.canLose;
        clearRetryState();
        DataManager.extractSaveContents(contents);
        BattleManager.setup(troopId, canEscape, canLose);
        BattleManager.saveBgmAndBgs();
        SoundManager.playBattleStart();
        SceneManager.goto(Scene_Battle);
    };

    const _Scene_Gameover_gotoTitle = Scene_Gameover.prototype.gotoTitle;
    Scene_Gameover.prototype.gotoTitle = function() {
        clearRetryState();
        _Scene_Gameover_gotoTitle.apply(this, arguments);
    };
})();