//=============================================================================
// RPG Maker MZ - Battle Retry On Party Death
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 全滅時に「焚き火から再開」「リトライ」「宿屋に戻る」「タイトルに戻る」を選べます。
 * @author Copilot
 *
 * @param innCommonEventId
 * @text 宿屋へ戻るコモンイベントID
 * @type common_event
 * @default 5
 * @desc 宿屋への転送処理を行うコモンイベントIDです。標準は最後に利用した宿屋へ移動するコモンイベント5です。
 *
 * @help
 * 戦闘開始直前の状態を保存し、全滅時に選択肢を表示します。
 * 「リトライ」は保存した状態に戻して同じ戦闘を再開します。
 * 「宿屋に戻る」は状態を戻してから指定コモンイベントを実行します。
 * 標準のコモンイベント5は最後に利用した宿屋へ移動する処理です。
 *
 * CampRest.js の焚き火再開ポイントが記録されている場合は、
 * 「焚き火から再開」で記録時点の状態・位置に戻れます。
 * （マップ上でのゲームオーバーでも選択できます）
 *
 * 戦闘開始前の状態を保存するため、セーブデータ全体を一時保存します。
 *
 * GameOverOnAnyDeath.js と併用する場合は、このプラグインをその後に
 * 配置してください。CampRest.js より後に配置してください。
 */

(() => {
    "use strict";

    const pluginName = "BattleRetryOnPartyDeath";
    const parameters = PluginManager.parameters(pluginName);
    const innCommonEventId = Number(parameters["innCommonEventId"] || 5);
    const innMapVariableId = 21;

    const hasInnMap = () => $gameVariables.value(innMapVariableId) !== 0;

    const campRestCheckpoint = () => globalThis.CampRestCheckpoint || null;
    const hasCampfireCheckpoint = () => {
        const checkpoint = campRestCheckpoint();
        return !!(checkpoint && checkpoint.isValid());
    };

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
        initialize(rect) {
            super.initialize(rect);
            this.fitToContents();
        }

        maxCols() {
            return 1;
        }

        makeCommandList() {
            if (hasCampfireCheckpoint()) {
                this.addCommand("焚き火から再開", "campfire");
            }
            if (retryState.contents) {
                this.addCommand("リトライ", "retry");
                if (hasInnMap()) {
                    this.addCommand("宿屋に戻る", "inn");
                }
            }
            this.addCommand("タイトルに戻る", "title");
        }

        // コマンド文字列に合わせたジャストサイズで画面下部中央に配置します。
        fitToContents() {
            const maxTextWidth = this._list.reduce(
                (width, command) => Math.max(width, this.textWidth(command.name)), 0
            );
            const width = Math.ceil(maxTextWidth) +
                this.itemPadding() * 2 + this.colSpacing() + this.padding * 2 + 8;
            const height = this.fittingHeight(this.maxItems());
            const x = Math.floor((Graphics.boxWidth - width) / 2);
            const y = Graphics.boxHeight - height - 48;
            this.move(x, y, width, height);
            this.createContents();
            this.refresh();
            this.ensureCursorVisible(false);
            this.refreshCursor();
        }
    }

    const _Scene_Gameover_create = Scene_Gameover.prototype.create;
    Scene_Gameover.prototype.create = function() {
        _Scene_Gameover_create.apply(this, arguments);
        if (retryState.contents || hasCampfireCheckpoint()) {
            this.createWindowLayer();
            this.createBattleRetryWindow();
        }
    };

    Scene_Gameover.prototype.createBattleRetryWindow = function() {
        // 実サイズは Window_BattleRetryCommand.fitToContents が決定します。
        const rect = new Rectangle(0, 0, 320, Window_Command.prototype.fittingHeight(4));
        this._battleRetryWindow = new Window_BattleRetryCommand(rect);
        this._battleRetryWindow.setHandler("campfire", this.resumeFromCampfire.bind(this));
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

    Scene_Gameover.prototype.resumeFromCampfire = function() {
        const checkpoint = campRestCheckpoint();
        clearRetryState();
        if (!checkpoint || !checkpoint.resume()) {
            this.gotoTitle();
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