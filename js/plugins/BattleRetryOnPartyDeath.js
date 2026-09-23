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
 * ゲームオーバー画面に「リトライ」と「ゲームオーバー」を表示します。
 * リトライを選ぶと、戦闘開始前の状態を復元して同じ戦闘を再開します。
 *
 * 攻略法コモンイベントIDを設定すると、リトライ/ゲームオーバーの選択肢の
 * 前に「攻略法を聞きますか？」の確認を挟みます。「聞く」を選ぶと、
 * 敵グループ格納変数に負けたトループIDを代入したうえで指定のコモン
 * イベントを実行します。コモンイベント側では、この変数の値を条件分岐
 * で参照し、敵グループごとに異なる説明文（文章の表示）を出し分けて
 * ください。コモンイベント終了後は通常どおりリトライ/ゲームオーバーの
 * 選択肢を表示します。
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
    const askStrategyText = String(parameters["askStrategyText"] || "攻略法を聞きますか？");
    const askYesText = String(parameters["askYesText"] || "聞く");
    const askNoText = String(parameters["askNoText"] || "聞かない");

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
        this._battleRetryWindow.setHandler("retry", this.retryBattle.bind(this));
        this._battleRetryWindow.setHandler("gameover", this.gotoTitle.bind(this));
        this.addWindow(this._battleRetryWindow);
    };

    Scene_Gameover.prototype.createBattleRetryAskWindows = function() {
        const width = 400;
        const commandHeight = this.calcWindowHeight(2, true);
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
        } else if (this._battleRetryWindow || this._battleRetryAskWindow) {
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