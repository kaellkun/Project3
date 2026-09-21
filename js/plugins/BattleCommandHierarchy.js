//=============================================================================
// RPG Maker MZ - Actor-only battle commands
//=============================================================================
/*:
 * @target MZ
 * @plugindesc パーティーコマンドを使わない２階層のバトルコマンド。(v1.0.0)
 * @author Copilot
 * @orderAfter FlexibleTopDownUI
 * @orderAfter LinearTimeBattle
 * @orderAfter BattleEquipCommand
 * @orderAfter NRP_AutoBattle
 * @orderAfter KEN_BattleStateInformation
 * @orderAfter MPP_SmoothBattleLog
 *
 * @help
 * 関連する戦闘/UIプラグインより下に配置してください。
 * 戦う → 攻撃技(タイプ1)、必殺技(2)、アイテム、補助･回復(3)、妨害(4)
 * オート → NRP_AutoBattleの全員自動戦闘。キャンセルで解除。
 * 戦況確認 → 味方ステータス、敵ステータス、バトルログ
 * 編成変更 → 隊列変更、装備変更
 * 入れ替え → 入力中のアクターと控えを交代（その行動機会を消費）。
 * 逃げる → 通常の逃走判定。逃走禁止戦闘では選択不可。
 *
 * スキルタイプ未所持・封印中の項目は無効表示します。
 * 装備・情報・ログからは各サブメニューに戻り、行動ゲージを消費しません。
 * 入れ替えは並び替え許可時のみ。戦闘不能・行動不能・自動戦闘の控えは
 * 選択できません。HP/MP/TP・ステートは保持し、交代した２人のゲージと
 * 未実行行動をリセットします。控えがいなければ選択不可です。
 * サブメニューのキャンセルは１階層戻ります。最上位では戻りません。
 * パーティーウィンドウは互換性のため生成だけ行い、表示・操作しません。
 * 既存セーブ使用可。プラグインコマンドはありません。
 */

(() => {
    "use strict";

    const reserves = () => $gameParty.allMembers().filter(actor =>
        !$gameParty.battleMembers().includes(actor));
    const canSwapIn = actor => actor.isAlive() && actor.canMove() && !actor.isAutoBattle();
    const canSwap = () => $gameSystem.isFormationEnabled() && reserves().some(canSwapIn);
    const columns = () => Graphics.boxWidth < 640 ? 3 : 6;

    // Reuse the actor command window itself. The engine's skill/item target
    // cancellation still sees the original symbol and skill-type ext.
    Window_ActorCommand.prototype.makeCommandList = function() {
        if (!this._actor) return;
        switch (this._battleCommandLayer) {
            case "fight": {
                // Obtain availability through installed seal-command hooks.
                this.addSkillCommands();
                this.addItemCommand();
                const available = this._list.slice();
                this.clearCommandList();
                for (const [name, type] of [["攻撃技", 1], ["必殺技", 2],
                    ["アイテム", 0], ["補助･回復", 3], ["妨害", 4]]) {
                    const symbol = type ? "skill" : "item";
                    const entry = available.find(c => c.symbol === symbol && (!type || c.ext === type));
                    const enabled = !!entry?.enabled && (!type || !this._actor.isSkillTypeSealed(type));
                    this.addCommand(name, symbol, enabled, type || null);
                }
                this.addCommand("戻る", "commandBack");
                break;
            }
            case "situation":
                this.addCommand("味方ステータス", "allyStatus", !!Scene_Battle.prototype.actorCommandStateInfo);
                this.addCommand("敵ステータス", "enemyStatus",
                    !!Scene_Battle.prototype.actorCommandStateInfo && $gameTroop.aliveMembers().length > 0);
                this.addCommand("バトルログ", "pastLog", !!Scene_Battle.prototype.commandPastLog);
                this.addCommand("戻る", "commandBack");
                break;
            case "formation":
                this.addCommand("隊列変更", "formation", !!Scene_Battle.prototype.commandBattleFormation);
                this.addCommand("装備変更", "equip", !!Scene_Battle.prototype.commandEquip);
                this.addCommand("戻る", "commandBack");
                break;
            default:
                this.addCommand("戦う", "fightMenu");
                this.addCommand("オート", "autoBattle", !!BattleManager.setAutoBattleMode);
                this.addCommand("戦況確認", "situationMenu");
                this.addCommand("入れ替え", "swap", canSwap());
                this.addCommand("逃げる", "escape", BattleManager.canEscape());
                break;
        }
    };

    Window_ActorCommand.prototype.maxCols = function() {
        return Math.min(columns(), Math.max(1, this._list?.length || 1));
    };
    // SealActorCommand's overlay replaces unreadable disabled labels with a
    // large sign. Keep the exact menu names visible using normal dimmed text;
    // availability still comes from its addSkillCommands/addItemCommand hooks.
    Window_ActorCommand.prototype.drawItem = function(index) {
        Window_Command.prototype.drawItem.call(this, index);
    };
    Window_ActorCommand.prototype.isTouchOkEnabled = function() { return true; };
    Window_ActorCommand.prototype.isCancelEnabled = function() {
        return this._battleCommandLayer !== "root";
    };
    // Never restore a leaf symbol into a root menu when command memory is on.
    Window_ActorCommand.prototype.selectLast = function() { this.select(0); };
    const setupActor = Window_ActorCommand.prototype.setup;
    Window_ActorCommand.prototype.setup = function(actor) {
        this._battleCommandLayer = "root";
        setupActor.call(this, actor);
    };
    Window_ActorCommand.prototype.setBattleCommandLayer = function(layer, symbol) {
        this._battleCommandLayer = layer;
        this.refresh();
        this.scrollTo(0, 0);
        this.selectSymbol(symbol || this.commandSymbol(0));
        this.show();
        this.open();
        this.activate();
    };

    Scene_Battle.prototype.battleCommandHeight = function() {
        const rows = Graphics.boxWidth < 640 ? 2 : 1;
        return this.calcCommandWindowHeight ? this.calcCommandWindowHeight(rows)
            : this.calcWindowHeight(rows, true);
    };

    const createCommands = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        createCommands.call(this);
        const win = this._actorCommandWindow;
        win.setHandler("fightMenu", () => win.setBattleCommandLayer("fight"));
        win.setHandler("situationMenu", () => win.setBattleCommandLayer("situation"));
        win.setHandler("formationMenu", () => win.setBattleCommandLayer("formation"));
        win.setHandler("commandBack", this.commandHierarchyBack.bind(this));
        win.setHandler("cancel", this.commandHierarchyBack.bind(this));
        win.setHandler("escape", this.commandEscape.bind(this));
        win.setHandler("swap", this.commandBattleSwap.bind(this));
        win.setHandler("allyStatus", () => this.commandHierarchyStatus("ally"));
        win.setHandler("enemyStatus", () => this.commandHierarchyStatus("enemy"));
        if (this.commandAutoBattle) win.setHandler("autoBattle", this.commandAutoBattle.bind(this));
        if (this.commandPastLog) win.setHandler("pastLog", () => {
            win.deactivate();
            this.commandPastLog();
        });
    };

    Scene_Battle.prototype.commandHierarchyBack = function() {
        const win = this._actorCommandWindow;
        const symbol = {
            fight: "fightMenu",
            situation: "situationMenu",
            formation: "formationMenu"
        }[win._battleCommandLayer] || "fightMenu";
        win.setBattleCommandLayer("root", symbol);
    };

    const startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        const subject = this._subject;
        const isReaction = !!subject?.currentAction()?._isReactionKe;
        startAction.apply(this, arguments);
        if (subject && this._logWindow && !isReaction) {
            this._logWindow._methods.unshift({
                name: "addText",
                params: [`${subject.name()}のターン！`]
            });
        }
    };

    // Skip both the initial TPB party gate and the turn-based party selection.
    // No selectPreviousCommand call: root Cancel must not undo actor input.
    const checkInputOpen = BattleManager.checkTpbInputOpen;
    BattleManager.checkTpbInputOpen = function() {
        this._tpbNeedsPartyCommand = false;
        checkInputOpen.call(this);
    };
    Scene_Battle.prototype.startPartyCommandSelection = function() {
        this._partyCommandWindow.deactivate();
        this._partyCommandWindow.close();
        this._partyCommandWindow.hide();
        if (BattleManager.isAutoBattleMode?.()) {
            BattleManager.setAutoBattleActions();
            this.endCommandSelection();
            return;
        }
        BattleManager.selectNextCommand();
        if (BattleManager.actor() && BattleManager.isInputting()) {
            this.startActorCommandSelection();
        } else {
            this.endCommandSelection();
        }
    };
    const createParty = Scene_Battle.prototype.createPartyCommandWindow;
    Scene_Battle.prototype.createPartyCommandWindow = function() {
        createParty.call(this);
        this._partyCommandWindow.hide();
        this._partyCommandWindow.deactivate();
    };

    // A Scene_Equip round-trip creates a fresh Scene_Battle; remember only that
    // transition on BattleManager, not on a saved actor or global persistent data.
    const commandEquip = Scene_Battle.prototype.commandEquip;
    if (commandEquip) {
        Scene_Battle.prototype.commandEquip = function() {
            BattleManager._hierarchyEquipActor = BattleManager.actor();
            BattleManager._hierarchyEquipLayer = this._actorCommandWindow._battleCommandLayer;
            commandEquip.call(this);
        };
    }
    const initBattle = BattleManager.initMembers;
    BattleManager.initMembers = function() {
        initBattle.call(this);
        this._hierarchyEquipActor = null;
        this._hierarchyEquipLayer = null;
    };
    const startActor = Scene_Battle.prototype.startActorCommandSelection;
    Scene_Battle.prototype.startActorCommandSelection = function() {
        startActor.call(this);
        this._partyCommandWindow.hide();
        this._partyCommandWindow.deactivate();
        if (BattleManager._hierarchyEquipActor) {
            if (BattleManager._hierarchyEquipActor === BattleManager.actor()) {
                this._actorCommandWindow.setBattleCommandLayer(BattleManager._hierarchyEquipLayer || "formation", "equip");
            }
            BattleManager._hierarchyEquipActor = null;
            BattleManager._hierarchyEquipLayer = null;
        }
    };

    if (Scene_Battle.prototype.onPastLogCancel) {
        Scene_Battle.prototype.pastLogWindowRect = function() {
            const top = this.skillWindowRect().y;
            return new Rectangle(0, top, Graphics.boxWidth,
                Math.max(1, this.statusWindowRect().y - top));
        };
        Scene_Battle.prototype.onPastLogCancel = function() {
            this._pastLogWindow.close();
            this._pastLogWindow.deactivate();
            this._actorCommandWindow.setBattleCommandLayer("situation", "pastLog");
        };
    }

    // Keep the existing state viewer, including descriptions and gauges, but
    // constrain its member list per entry point. The keyboard shortcut remains
    // an all-battler viewer and returns to whichever actor menu opened it.
    const createInfo = Scene_Battle.prototype.createBattleStateInfoWindow;
    if (createInfo) {
        Scene_Battle.prototype.createBattleStateInfoWindow = function() {
            createInfo.call(this);
            const win = this._windowBattleStateInfo;
            const makeList = win.makeCommandList;
            win.makeCommandList = function() {
                makeList.call(this);
                if (this._hierarchySide) {
                    this._list = this._list.filter(b => this._hierarchySide === "ally" ? b.isActor() : b.isEnemy());
                    this._index = Math.max(0, Math.min(this._index, this._list.length - 1));
                    this._stateListWindow.setBattler(this.battler(this._index));
                }
            };
        };
        const infoRect = Scene_Battle.prototype.battleStateInfoWindowRect;
        Scene_Battle.prototype.battleStateInfoWindowRect = function() {
            const rect = infoRect.call(this);
            const top = this.skillWindowRect().y;
            rect.width = Math.min(rect.width, Graphics.boxWidth);
            rect.height = Math.min(rect.height, Graphics.boxHeight - top);
            rect.x = Math.floor((Graphics.boxWidth - rect.width) / 2);
            rect.y = top;
            return rect;
        };
        const closeInfo = Scene_Battle.prototype.closeStateInfoWindow;
        Scene_Battle.prototype.closeStateInfoWindow = function() {
            this._stateInfoWindowWithActorCommand = true;
            closeInfo.call(this);
            this._windowBattleStateInfo._hierarchySide = null;
        };
    }
    Scene_Battle.prototype.commandHierarchyStatus = function(side) {
        const win = this._windowBattleStateInfo;
        win._hierarchySide = side;
        win.select(0);
        this._actorCommandWindow.deactivate();
        this.actorCommandStateInfo();
    };

    class Window_BattleReserve extends Window_Command {
        makeCommandList() {
            for (const actor of reserves()) {
                this.addCommand(`${actor.name()}  HP ${actor.hp}/${actor.mhp}`, "reserve", canSwapIn(actor), actor);
            }
            this.addCommand("戻る", "cancel");
        }
        maxCols() { return 1; }
        isTouchOkEnabled() { return true; }
    }
    const createAll = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        createAll.call(this);
        const rect = this.skillWindowRect();
        const win = new Window_BattleReserve(rect);
        win.setHandler("reserve", this.onBattleSwapOk.bind(this));
        win.setHandler("cancel", this.onBattleSwapCancel.bind(this));
        win.hide();
        win.deactivate();
        this.addWindow(win);
        this._battleReserveWindow = win;
    };
    Scene_Battle.prototype.commandBattleSwap = function() {
        this._actorCommandWindow.deactivate();
        this._battleReserveWindow.refresh();
        this._battleReserveWindow.select(0);
        this._battleReserveWindow.show();
        this._battleReserveWindow.activate();
    };
    Scene_Battle.prototype.onBattleSwapCancel = function() {
        this._battleReserveWindow.hide();
        this._battleReserveWindow.deactivate();
        this._actorCommandWindow.setBattleCommandLayer("root", "swap");
    };
    Scene_Battle.prototype.onBattleSwapOk = function() {
        const outgoing = BattleManager.actor();
        const incoming = this._battleReserveWindow.currentExt();
        if (!outgoing || !canSwap() || !reserves().includes(incoming) || !canSwapIn(incoming)) {
            SoundManager.playBuzzer();
            this.onBattleSwapCancel();
            return;
        }
        const members = $gameParty.allMembers();
        $gameParty.swapOrder(members.indexOf(outgoing), members.indexOf(incoming));
        for (const actor of [outgoing, incoming]) {
            actor.clearActions();
            actor.clearTpbChargeTime();
            actor._tpbCastTime = 0;
            actor._tpbIdleTime = 0;
            actor._tpbTurnEnd = false;
            actor.setActionState("undecided");
            actor.deselect();
        }
        BattleManager._actionBattlers = BattleManager._actionBattlers.filter(b => b !== outgoing && b !== incoming);
        BattleManager._currentActor = null;
        BattleManager._inputting = false;
        $gameParty.requestMotionRefresh();
        this._statusWindow.refresh();
        this._battleReserveWindow.hide();
        this._battleReserveWindow.deactivate();
        if (!BattleManager.isTpb()) {
            // Continue after the replaced slot, not from the beginning. The
            // incoming actor has no actions this turn (the swap consumed them).
            BattleManager._currentActor = incoming;
            BattleManager._inputting = true;
            BattleManager.selectNextCommand();
        }
        this.changeInputWindow();
    };
    const anyInput = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function() {
        return anyInput.call(this) || !!this._battleReserveWindow?.active;
    };
    const hideInputs = Scene_Battle.prototype.hideSubInputWindows;
    Scene_Battle.prototype.hideSubInputWindows = function() {
        hideInputs.call(this);
        this._battleReserveWindow?.hide();
        this._battleReserveWindow?.deactivate();
    };
    const timeActive = Scene_Battle.prototype.isTimeActive;
    Scene_Battle.prototype.isTimeActive = function() {
        return !this._battleReserveWindow?.active && !this._windowBattleStateInfo?.active &&
            !this._pastLogWindow?.active && timeActive.call(this);
    };
})();