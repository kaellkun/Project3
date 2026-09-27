//=============================================================================
// RPG Maker MZ - Battle Retry On Party Death
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 全滅時に「リトライ」「宿屋に戻る」「タイトルに戻る」を選べます。
 * @author Copilot
 *
 * @param innCommonEventId
 * @text 宿屋へ戻るコモンイベントID
 * @type common_event
 * @default 5
 * @desc 宿屋への転送処理を行うコモンイベントIDです。標準は最後に利用した宿屋へ移動するコモンイベント5です。
 *
 * @help
 * 戦闘開始直前の状態を保存し、全滅時に3つの選択肢を表示します。
 * 「リトライ」は保存した状態に戻して同じ戦闘を再開します。
 * 「宿屋に戻る」は状態を戻してから指定コモンイベントを実行します。
 * 標準のコモンイベント5は最後に利用した宿屋へ移動する処理です。
 *
 * 戦闘開始前の状態を保存するため、セーブデータ全体を一時保存します。
 *
 * GameOverOnAnyDeath.js と併用する場合は、このプラグインをその後に
 * 配置してください。
 */

(() => {
    "use strict";

    const pluginName = "BattleRetryOnPartyDeath";
    const parameters = PluginManager.parameters(pluginName);
    const innCommonEventId = Number(parameters["innCommonEventId"] || 5);
    const innMapVariableId = 20;

    const hasInnMap = () => $gameVariables.value(innMapVariableId) !== 0;

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
        const result = _BattleManager_processEscape.apply(this, arguments);
        if (this._escaped) {
            clearRetryState();
        }
        return result;
    };

    class Window_BattleRetryCommand extends Window_Command {
        makeCommandList() {
            this.addCommand("リトライ", "retry");
            if (hasInnMap()) {
                this.addCommand("宿屋に戻る", "inn");
            }
            this.addCommand("タイトルに戻る", "title");
        }
    }

    const _Scene_Gameover_create = Scene_Gameover.prototype.create;
    Scene_Gameover.prototype.create = function() {
        _Scene_Gameover_create.apply(this, arguments);
        if (retryState.contents) {
            this.createWindowLayer();
            this.createBattleRetryWindow();
        }
    };

    Scene_Gameover.prototype.createBattleRetryWindow = function() {
        const width = 360;
        const commandCount = hasInnMap() ? 3 : 2;
        const height = this.calcWindowHeight(commandCount, true);
        const rect = new Rectangle(
            (Graphics.boxWidth - width) / 2,
            Graphics.boxHeight - height - 48,
            width,
            height
        );
        this._battleRetryWindow = new Window_BattleRetryCommand(rect);
        this._battleRetryWindow.setHandler("retry", this.retryBattle.bind(this));
        this._battleRetryWindow.setHandler("inn", this.goToInn.bind(this));
        this._battleRetryWindow.setHandler("title", this.gotoTitle.bind(this));
        this.addWindow(this._battleRetryWindow);
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

    Scene_Gameover.prototype.goToInn = function() {
        if (!retryState.contents || innCommonEventId <= 0) {
            this.gotoTitle();
            return;
        }
        const contents = JsonEx.parse(retryState.contents);
        clearRetryState();
        DataManager.extractSaveContents(contents);
        $gameTemp.reserveCommonEvent(innCommonEventId);
        SceneManager.goto(Scene_Map);
    };

    const _Scene_Gameover_gotoTitle = Scene_Gameover.prototype.gotoTitle;
    Scene_Gameover.prototype.gotoTitle = function() {
        clearRetryState();
        _Scene_Gameover_gotoTitle.apply(this, arguments);
    };
})();