//=============================================================================
// RPG Maker MZ - Etrian-style front/back row party formation
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 前衛/後衛付き5人パーティー編成 (v1.0.0)
 * @author Copilot
 *
 * @param MaxBattleMembers
 * @text 最大戦闘人数
 * @type number
 * @min 1
 * @default 5
 *
 * @param FrontLabel
 * @text 前衛ラベル
 * @default 前衛
 *
 * @param BackLabel
 * @text 後衛ラベル
 * @default 後衛
 *
 * @param ReserveLabel
 * @text 控えラベル
 * @default 控えメンバー
 *
 * @param FrontTag
 * @text 前衛タグ(短縮)
 * @default 前
 *
 * @param BackTag
 * @text 後衛タグ(短縮)
 * @default 後
 *
 * @help
 * メニューの「並び替え」コマンドを、前衛/後衛を持つ5人パーティー編成画面に
 * 差し替えます。
 *
 * ・戦闘参加人数がMaxBattleMembers以下のときは前衛/後衛を自由に選べます
 *   （前衛には最低1人必要）。
 * ・戦闘参加人数がMaxBattleMembers人ちょうどいる状態で、控えメンバーが
 *   いる場合は、控えと入れ替えできます。
 * ・戦闘中のアクターウィンドウにも前衛/後衛タグを表示します。
 *
 * 操作:
 *   前衛/後衛ウィンドウでOK … その場で前衛⇔後衛を切り替え
 *   控えウィンドウでOK … 交代待ちにして前衛/後衛のメンバーを選択
 *   前衛/後衛ウィンドウでキャンセル(交代待ち中) … 交代を中止
 *   前衛/後衛ウィンドウでキャンセル(通常時) … メニューへ戻る
 *
 * プラグインコマンドはありません。既存セーブでも利用できます。
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "EtrianPartyFormation";
    const params = PluginManager.parameters(PLUGIN_NAME);
    const maxBattleMembers = Math.max(1, Number(params.MaxBattleMembers) || 5);
    const frontLabel = String(params.FrontLabel || "前衛");
    const backLabel = String(params.BackLabel || "後衛");
    const reserveLabel = String(params.ReserveLabel || "控えメンバー");
    const frontTag = String(params.FrontTag || "前");
    const backTag = String(params.BackTag || "後");

    //-------------------------------------------------------------------
    // Game_Party / Game_Actor - front/back row bookkeeping
    //-------------------------------------------------------------------
    Game_Party.prototype.maxBattleMembers = function() {
        return maxBattleMembers;
    };

    Game_Party.prototype.formationActiveMembers = function() {
        return this.allBattleMembers();
    };

    Game_Party.prototype.formationReserveMembers = function() {
        return this.allMembers().slice(this.maxBattleMembers());
    };

    Game_Party.prototype.formationFrontMembers = function() {
        return this.formationActiveMembers().filter(actor => actor.isFrontRow());
    };

    Game_Party.prototype.formationBackMembers = function() {
        return this.formationActiveMembers().filter(actor => !actor.isFrontRow());
    };

    Game_Actor.prototype.formationRow = function() {
        return this._formationRow === "back" ? "back" : "front";
    };

    Game_Actor.prototype.setFormationRow = function(row) {
        this._formationRow = row === "back" ? "back" : "front";
    };

    Game_Actor.prototype.isFrontRow = function() {
        return this.formationRow() === "front";
    };

    //-------------------------------------------------------------------
    // Scene_Menu - reuse the existing "並び替え" command
    //-------------------------------------------------------------------
    Scene_Menu.prototype.commandFormation = function() {
        SceneManager.push(Scene_PartyFormation);
    };

    //-------------------------------------------------------------------
    // Formation captions (non-selectable header windows)
    //-------------------------------------------------------------------
    class Window_FormationCaption extends Window_Base {
        initialize(rect, text) {
            super.initialize(rect);
            this._text = text;
            this.refresh();
        }
        setText(text) {
            if (this._text === text) return;
            this._text = text;
            this.refresh();
        }
        refresh() {
            this.contents.clear();
            this.drawText(this._text, 0, 0, this.innerWidth, "center");
        }
    }

    //-------------------------------------------------------------------
    // Formation member lists (front / back / reserve)
    //-------------------------------------------------------------------
    class Window_FormationMemberList extends Window_Selectable {
        initialize(rect) {
            super.initialize(rect);
            this._list = [];
            this._onBoundary = null;
        }
        setOnBoundary(handler) {
            this._onBoundary = handler;
        }
        setList(list) {
            this._list = list;
            const maxIndex = Math.max(0, this._list.length - 1);
            if (this.index() > maxIndex) this.select(maxIndex);
            this.refresh();
        }
        maxItems() {
            return this._list.length;
        }
        item(index) {
            return this._list[index !== undefined ? index : this.index()];
        }
        maxCols() {
            return 1;
        }
        cursorDown(wrap) {
            if (this.index() < this.maxItems() - 1) {
                super.cursorDown(false);
            } else if (this._onBoundary) {
                this._onBoundary("down");
            }
        }
        cursorUp(wrap) {
            if (this.index() > 0) {
                super.cursorUp(false);
            } else if (this._onBoundary) {
                this._onBoundary("up");
            }
        }
        cursorRight(wrap) {
            if (this._onBoundary) this._onBoundary("right");
        }
        cursorLeft(wrap) {
            if (this._onBoundary) this._onBoundary("left");
        }
        isCurrentItemEnabled() {
            return !!this.item();
        }
        drawItem(index) {
            const actor = this.item(index);
            if (!actor) return;
            const rect = this.itemLineRect(index);
            this.changePaintOpacity(this.isCurrentItemEnabled());
            const lvWidth = 60;
            const hpWidth = 140;
            const nameWidth = Math.max(60, rect.width - lvWidth - hpWidth);
            this.resetTextColor();
            this.drawText(actor.name(), rect.x, rect.y, nameWidth);
            this.drawText(`Lv${actor.level}`, rect.x + nameWidth, rect.y, lvWidth);
            this.changeTextColor(ColorManager.hpColor(actor));
            this.drawText(`${actor.hp}/${actor.mhp}`, rect.x + nameWidth + lvWidth, rect.y, hpWidth, "right");
            this.resetTextColor();
            this.changePaintOpacity(true);
        }
    }

    //-------------------------------------------------------------------
    // Scene_PartyFormation
    //-------------------------------------------------------------------
    function Scene_PartyFormation() {
        this.initialize(...arguments);
    }
    Scene_PartyFormation.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_PartyFormation.prototype.constructor = Scene_PartyFormation;

    Scene_PartyFormation.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
        this._pendingReserveActor = null;
    };

    Scene_PartyFormation.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createFrontWindows();
        this.createBackWindows();
        this.createReserveWindows();
        this.refreshAll();
        const firstWindow = this._frontWindow.maxItems() > 0 ? this._frontWindow : this._backWindow;
        this.activateFormationWindow(firstWindow);
    };

    Scene_PartyFormation.prototype.helpAreaRect = function() {
        const wx = 0;
        const wy = this.mainAreaTop();
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(2, false);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_PartyFormation.prototype.labelHeight = function() {
        return this.calcWindowHeight(1, false);
    };

    Scene_PartyFormation.prototype.activeListHeight = function() {
        return this.calcWindowHeight(this.constructor.visibleActiveRows(), true);
    };

    Scene_PartyFormation.visibleActiveRows = function() {
        return Math.min(5, maxBattleMembers);
    };

    Scene_PartyFormation.prototype.createHelpWindow = function() {
        this._helpWindow = new Window_Help(this.helpAreaRect());
        this.addWindow(this._helpWindow);
    };

    Scene_PartyFormation.prototype.createFrontWindows = function() {
        const help = this.helpAreaRect();
        const labelH = this.labelHeight();
        const listH = this.activeListHeight();
        const ww = Math.floor(Graphics.boxWidth / 2);
        const wx = 0;
        const labelRect = new Rectangle(wx, help.y + help.height, ww, labelH);
        const listRect = new Rectangle(wx, labelRect.y + labelH, ww, listH);
        this._frontLabelWindow = new Window_FormationCaption(labelRect, frontLabel);
        this._frontWindow = new Window_FormationMemberList(listRect);
        this._frontWindow.setHandler("ok", this.onActiveOk.bind(this, this._frontWindow));
        this._frontWindow.setHandler("cancel", this.onActiveCancel.bind(this, this._frontWindow));
        this.addWindow(this._frontLabelWindow);
        this.addWindow(this._frontWindow);
    };

    Scene_PartyFormation.prototype.createBackWindows = function() {
        const help = this.helpAreaRect();
        const labelH = this.labelHeight();
        const listH = this.activeListHeight();
        const wx = Math.floor(Graphics.boxWidth / 2);
        const ww = Graphics.boxWidth - wx;
        const labelRect = new Rectangle(wx, help.y + help.height, ww, labelH);
        const listRect = new Rectangle(wx, labelRect.y + labelH, ww, listH);
        this._backLabelWindow = new Window_FormationCaption(labelRect, backLabel);
        this._backWindow = new Window_FormationMemberList(listRect);
        this._backWindow.setHandler("ok", this.onActiveOk.bind(this, this._backWindow));
        this._backWindow.setHandler("cancel", this.onActiveCancel.bind(this, this._backWindow));
        this.addWindow(this._backLabelWindow);
        this.addWindow(this._backWindow);
    };

    Scene_PartyFormation.prototype.createReserveWindows = function() {
        const help = this.helpAreaRect();
        const labelH = this.labelHeight();
        const top = help.y + help.height + labelH + this.activeListHeight();
        const listH = Math.max(this.calcWindowHeight(1, true), this.mainAreaBottom() - top - labelH);
        const wx = 0;
        const ww = Graphics.boxWidth;
        const labelRect = new Rectangle(wx, top, ww, labelH);
        const listRect = new Rectangle(wx, top + labelH, ww, listH);
        this._reserveLabelWindow = new Window_FormationCaption(labelRect, reserveLabel);
        this._reserveWindow = new Window_FormationMemberList(listRect);
        this._reserveWindow.setHandler("ok", this.onReserveOk.bind(this));
        this._reserveWindow.setHandler("cancel", this.onReserveCancel.bind(this));
        this.addWindow(this._reserveLabelWindow);
        this.addWindow(this._reserveWindow);
    };

    Scene_PartyFormation.prototype.wireBoundaries = function() {
        this._frontWindow.setOnBoundary(dir => this.onFrontBoundary(dir));
        this._backWindow.setOnBoundary(dir => this.onBackBoundary(dir));
        this._reserveWindow.setOnBoundary(dir => this.onReserveBoundary(dir));
    };

    Scene_PartyFormation.prototype.onFrontBoundary = function(dir) {
        if (dir === "right") this.activateFormationWindow(this._backWindow);
        else if (dir === "down") this.activateFormationWindow(this._reserveWindow);
    };

    Scene_PartyFormation.prototype.onBackBoundary = function(dir) {
        if (dir === "left") this.activateFormationWindow(this._frontWindow);
        else if (dir === "down") this.activateFormationWindow(this._reserveWindow);
    };

    Scene_PartyFormation.prototype.onReserveBoundary = function(dir) {
        if (dir === "up") {
            const target = this._frontWindow.maxItems() > 0 ? this._frontWindow : this._backWindow;
            this.activateFormationWindow(target);
        }
    };

    Scene_PartyFormation.prototype.activateFormationWindow = function(win) {
        if (!win || win.maxItems() === 0) return;
        for (const w of [this._frontWindow, this._backWindow, this._reserveWindow]) {
            w.deactivate();
        }
        win.select(Math.max(0, Math.min(win.index(), win.maxItems() - 1)));
        win.activate();
    };

    Scene_PartyFormation.prototype.refreshAll = function() {
        this._frontWindow.setList($gameParty.formationFrontMembers());
        this._backWindow.setList($gameParty.formationBackMembers());
        this._reserveWindow.setList($gameParty.formationReserveMembers());
        this._reserveLabelWindow.setText(`${reserveLabel} (${$gameParty.formationReserveMembers().length})`);
        this.wireBoundaries();
        this.updateHelpText();
    };

    Scene_PartyFormation.prototype.updateHelpText = function() {
        if (this._pendingReserveActor) {
            this._helpWindow.setText(
                `${this._pendingReserveActor.name()} と交代するメンバーを前衛/後衛から選択してください。キャンセルで中止します。`
            );
        } else {
            this._helpWindow.setText(
                `${frontLabel}/${backLabel}のメンバーはOKで前衛⇔後衛を切り替えられます（${frontLabel}には最低1人必要）。控えを選ぶと入れ替えできます。`
            );
        }
    };

    Scene_PartyFormation.prototype.onActiveOk = function(win) {
        const actor = win.item();
        if (!actor) {
            win.activate();
            return;
        }
        if (this._pendingReserveActor) {
            this.completeSwap(actor, this._pendingReserveActor, win);
        } else {
            this.toggleRow(actor, win);
        }
    };

    Scene_PartyFormation.prototype.toggleRow = function(actor, win) {
        const movingToBack = actor.isFrontRow();
        if (movingToBack && $gameParty.formationFrontMembers().length <= 1) {
            SoundManager.playBuzzer();
            win.activate();
            return;
        }
        actor.setFormationRow(movingToBack ? "back" : "front");
        SoundManager.playEquip();
        const stillActiveWindow = movingToBack ? this._backWindow : this._frontWindow;
        this.refreshAll();
        this.activateFormationWindow(stillActiveWindow);
    };

    Scene_PartyFormation.prototype.onActiveCancel = function(win) {
        if (this._pendingReserveActor) {
            this._pendingReserveActor = null;
            this.updateHelpText();
            this.activateFormationWindow(this._reserveWindow);
        } else {
            SoundManager.playCancel();
            this.popScene();
        }
    };

    Scene_PartyFormation.prototype.onReserveOk = function() {
        const actor = this._reserveWindow.item();
        if (!actor) {
            this._reserveWindow.activate();
            return;
        }
        this._pendingReserveActor = actor;
        this.updateHelpText();
        const target = this._frontWindow.maxItems() > 0 ? this._frontWindow : this._backWindow;
        this.activateFormationWindow(target);
    };

    Scene_PartyFormation.prototype.onReserveCancel = function() {
        SoundManager.playCancel();
        this.popScene();
    };

    Scene_PartyFormation.prototype.completeSwap = function(activeActor, reserveActor, win) {
        const members = $gameParty.allMembers();
        const activeIndex = members.indexOf(activeActor);
        const reserveIndex = members.indexOf(reserveActor);
        if (activeIndex < 0 || reserveIndex < 0) {
            this._pendingReserveActor = null;
            SoundManager.playBuzzer();
            this.updateHelpText();
            win.activate();
            return;
        }
        const row = activeActor.formationRow();
        $gameParty.swapOrder(activeIndex, reserveIndex);
        reserveActor.setFormationRow(row);
        this._pendingReserveActor = null;
        SoundManager.playEquip();
        this.refreshAll();
        this.activateFormationWindow(row === "front" ? this._frontWindow : this._backWindow);
    };

    //-------------------------------------------------------------------
    // Battle actor window - front/back tag display
    //-------------------------------------------------------------------
    Window_BattleStatus.prototype.maxCols = function() {
        return Math.max(1, Math.min(maxBattleMembers, $gameParty.battleMembers().length));
    };

    const _Window_BattleStatus_drawItemStatus = Window_BattleStatus.prototype.drawItemStatus;
    Window_BattleStatus.prototype.drawItemStatus = function(index) {
        _Window_BattleStatus_drawItemStatus.call(this, index);
        this.drawFormationRowTag(index);
    };

    Window_BattleStatus.prototype.drawFormationRowTag = function(index) {
        const actor = this.actor(index);
        if (!actor) return;
        const rect = this.itemRectWithPadding(index);
        const text = actor.isFrontRow() ? frontTag : backTag;
        const color = actor.isFrontRow() ? ColorManager.textColor(24) : ColorManager.textColor(6);
        const fontSize = this.contents.fontSize;
        this.contents.fontSize = Math.max(12, fontSize - 6);
        this.changeTextColor(color);
        this.drawText(text, rect.x, rect.y, 32, "left");
        this.contents.fontSize = fontSize;
        this.resetTextColor();
    };
})();
