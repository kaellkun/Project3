//=============================================================================
// RPG Maker MZ - Battle Retry On Party Death
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 味方が戦闘不能になった時に、リトライかゲームオーバーを選べるようにします。
 * @author Copilot
 *
 * @param askCommonEventId
 * @text 攻略法コモンイベントID
 * @type common_event
 * @default 0
 * @desc リトライ選択前に「攻略法を聞く」を選んだ場合に実行するコモンイベント。0にすると攻略法の確認自体を行いません。
 *
 * @param troopVariableId
 * @text 敵グループ格納変数ID
 * @type variable
 * @default 0
 * @desc 負けた敵グループ（トループID）を格納する変数。コモンイベント内の条件分岐で使い、敵ごとに説明文を切り替えられます。
 *
 * @param innCommonEventId
 * @text 宿屋コモンイベントID
 * @type common_event
 * @default 0
 * @desc 「宿屋へ」を選んだときに戦闘前のマップで実行するコモンイベント。0にすると「宿屋へ」は表示しません。
 *
 * @param askStrategyText
 * @text 確認メッセージ
 * @default 攻略法を聞きますか？
 *
 * @param askYesText
 * @text 「聞く」の文言
 * @default 聞く
 *
 * @param askNoText
 * @text 「聞かない」の文言
 * @default 聞かない
 *
 * @help
 * 戦闘開始直前のゲーム状態を保存し、味方が戦闘不能になった時の
 * ゲームオーバー画面に「戦闘直前に戻る」と「タイトルに戻る」を表示します。
 * 「戦闘直前に戻る」を選ぶと、「リトライ」「宿屋へ」「戦う前へ」から選べます。
 * 「リトライ」は戦闘開始前の状態を復元して同じ戦闘を再開します。
 * 「戦う前へ」は戦闘開始前のマップへ戻ります。
 *
 * 攻略法コモンイベントIDを設定すると、戦闘直前に戻る選択肢の
 * 前に「攻略法を聞きますか？」の確認を挟みます。「聞く」を選ぶと、
 * 敵グループ格納変数に負けたトループIDを代入したうえで指定のコモン
 * イベントを実行します。コモンイベント側では、この変数の値を条件分岐
 * で参照し、敵グループごとに異なる説明文（文章の表示）を出し分けて
 * ください。コモンイベント終了後は通常どおりリトライ/ゲームオーバーの
 * 選択肢を表示します。
 * 宿屋コモンイベントIDを設定すると、二段目に「宿屋へ」が追加されます。
 * 選択すると戦闘前の状態に戻り、指定したコモンイベントをマップ上で実行します。
 *
 * GameOverOnAnyDeath.js と併用する場合は、このプラグインをその後に
 * 配置してください。
 */

(() => {
    "use strict";

    const pluginName = "BattleRetryOnPartyDeath";
    const parameters = PluginManager.parameters(pluginName);
    const askCommonEventId = Number(parameters["askCommonEventId"] || 0);
    const troopVariableId = Number(parameters["troopVariableId"] || 0);
    const innCommonEventId = Number(parameters["innCommonEventId"] || 0);
    const askStrategyText = String(parameters["askStrategyText"] || "攻略法を聞きますか？");
    const askYesText = String(parameters["askYesText"] || "聞く");
    const askNoText = String(parameters["askNoText"] || "聞かない");

    const retryState = {
        contents: null,
        troopId: 0,
        canEscape: false,
        canLose: false
    };

    let lastMovePosition = null;
    let capturingRandomEncounter = false;

    const rememberPlayerPosition = function() {
        lastMovePosition = {
            mapId: $gameMap.mapId(),
            x: this.x,
            y: this.y,
            direction: this.direction()
        };
    };

    const _Game_Player_update = Game_Player.prototype.update;
    Game_Player.prototype.update = function(sceneActive) {
        rememberPlayerPosition.call(this);
        _Game_Player_update.apply(this, arguments);
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
        if (capturingRandomEncounter && lastMovePosition) {
            const contents = JsonEx.parse(retryState.contents);
            if (contents.player) {
                contents.player._mapId = lastMovePosition.mapId;
                contents.player._x = lastMovePosition.x;
                contents.player._y = lastMovePosition.y;
                contents.player._direction = lastMovePosition.direction;
                retryState.contents = JsonEx.stringify(contents);
            }
        }
        retryState.troopId = troopId;
        retryState.canEscape = canEscape;
        retryState.canLose = canLose;
        _BattleManager_setup.apply(this, arguments);
    };

    const _Game_Player_executeEncounter = Game_Player.prototype.executeEncounter;
    Game_Player.prototype.executeEncounter = function() {
        capturingRandomEncounter = true;
        try {
            return _Game_Player_executeEncounter.apply(this, arguments);
        } finally {
            capturingRandomEncounter = false;
            lastMovePosition = null;
        }
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
            this.addCommand("戦闘直前に戻る", "beforeBattle");
            this.addCommand("タイトルに戻る", "gameover");
        }
    }

    class Window_BattleRetrySubCommand extends Window_Command {
        makeCommandList() {
            this.addCommand("リトライ", "retry");
            if (innCommonEventId > 0) {
                this.addCommand("宿屋へ", "inn");
            }
            this.addCommand("戦う前（マップ）へ", "beforeMap");
        }
    }

    class Window_BattleRetryAskCommand extends Window_Command {
        makeCommandList() {
            this.addCommand(askYesText, "yes");
            this.addCommand(askNoText, "no");
        }
    }

    const _Scene_Gameover_create = Scene_Gameover.prototype.create;
    Scene_Gameover.prototype.create = function() {
        _Scene_Gameover_create.apply(this, arguments);
        if (retryState.contents) {
            this.createWindowLayer();
            if (askCommonEventId > 0) {
                this.createBattleRetryAskWindows();
            } else {
                this.createBattleRetryWindow();
            }
        }
    };

    Scene_Gameover.prototype.createBattleRetryWindow = function() {
        const width = 360;
        const height = this.calcWindowHeight(2, true);
        const rect = new Rectangle(
            (Graphics.boxWidth - width) / 2,
            Graphics.boxHeight - height - 48,
            width,
            height
        );
        this._battleRetryWindow = new Window_BattleRetryCommand(rect);
        this._battleRetryWindow.setHandler("beforeBattle", this.createBattleRetrySubWindow.bind(this));
        this._battleRetryWindow.setHandler("gameover", this.gotoTitle.bind(this));
        this.addWindow(this._battleRetryWindow);
    };

    Scene_Gameover.prototype.createBattleRetrySubWindow = function() {
        this._battleRetryWindow.deactivate();
        const width = 360;
        const height = this.calcWindowHeight(4, true);
        const rect = new Rectangle(
            (Graphics.boxWidth - width) / 2,
            Graphics.boxHeight - height - 48,
            width,
            height
        );
        this._battleRetrySubWindow = new Window_BattleRetrySubCommand(rect);
        this._battleRetrySubWindow.setHandler("retry", this.retryBattle.bind(this));
        this._battleRetrySubWindow.setHandler("inn", this.goToInn.bind(this));
        this._battleRetrySubWindow.setHandler("beforeMap", this.returnBeforeBattle.bind(this));
        this.addWindow(this._battleRetrySubWindow);
    };

    Scene_Gameover.prototype.createBattleRetryAskWindows = function() {
        const width = 400;
        const commandHeight = this.calcWindowHeight(3, true);
        const helpHeight = this.calcWindowHeight(1, false);
        const wy = Graphics.boxHeight - commandHeight - helpHeight - 48;
        const helpRect = new Rectangle((Graphics.boxWidth - width) / 2, wy, width, helpHeight);
        this._battleRetryAskHelpWindow = new Window_Help(helpRect);
        this._battleRetryAskHelpWindow.setText(askStrategyText);
        this.addWindow(this._battleRetryAskHelpWindow);

        const commandRect = new Rectangle(
            (Graphics.boxWidth - width) / 2,
            wy + helpHeight,
            width,
            commandHeight
        );
        this._battleRetryAskWindow = new Window_BattleRetryAskCommand(commandRect);
        this._battleRetryAskWindow.setHandler("yes", this.startBattleRetryStrategy.bind(this));
        this._battleRetryAskWindow.setHandler("no", this.closeBattleRetryAskWindows.bind(this, true));
        this.addWindow(this._battleRetryAskWindow);
    };

    Scene_Gameover.prototype.closeBattleRetryAskWindows = function(showRetryWindow) {
        if (this._battleRetryAskWindow) {
            this._battleRetryAskWindow.deactivate();
            this._battleRetryAskWindow.close();
        }
        if (this._battleRetryAskHelpWindow) {
            this._battleRetryAskHelpWindow.close();
        }
        if (showRetryWindow) {
            this.createBattleRetryWindow();
        }
    };

    Scene_Gameover.prototype.startBattleRetryStrategy = function() {
        this.closeBattleRetryAskWindows(false);
        if (troopVariableId > 0) {
            $gameVariables.setValue(troopVariableId, retryState.troopId);
        }
        const commonEvent = $dataCommonEvents[askCommonEventId];
        if (!commonEvent) {
            this.createBattleRetryWindow();
            return;
        }
        Scene_Message.prototype.createAllWindows.call(this);
        this._battleRetryInterpreter = new Game_Interpreter();
        this._battleRetryInterpreter.setup(commonEvent.list, 0);
    };

    Scene_Gameover.prototype.updateBattleRetryStrategy = function() {
        Scene_Base.prototype.update.call(this);
        this._battleRetryInterpreter.update();
        if (!this._battleRetryInterpreter.isRunning()) {
            this._battleRetryInterpreter = null;
            this.createBattleRetryWindow();
        }
    };

    const _Scene_Gameover_update = Scene_Gameover.prototype.update;
    Scene_Gameover.prototype.update = function() {
        if (this._battleRetryInterpreter) {
            this.updateBattleRetryStrategy();
        } else if (this._battleRetryWindow || this._battleRetrySubWindow || this._battleRetryAskWindow) {
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

    Scene_Gameover.prototype.restoreBeforeBattle = function() {
        if (!retryState.contents) {
            this.gotoTitle();
            return false;
        }
        const contents = JsonEx.parse(retryState.contents);
        clearRetryState();
        DataManager.extractSaveContents(contents);
        return true;
    };

    Scene_Gameover.prototype.returnBeforeBattle = function() {
        if (this.restoreBeforeBattle()) {
            SceneManager.goto(Scene_Map);
        }
    };

    Scene_Gameover.prototype.goToInn = function() {
        if (this.restoreBeforeBattle()) {
            $gameTemp.reserveCommonEvent(innCommonEventId);
            SceneManager.goto(Scene_Map);
        }
    };

    const _Scene_Gameover_gotoTitle = Scene_Gameover.prototype.gotoTitle;
    Scene_Gameover.prototype.gotoTitle = function() {
        clearRetryState();
        _Scene_Gameover_gotoTitle.apply(this, arguments);
    };
})();