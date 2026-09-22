//=============================================================================
// RPG Maker MZ - Etrian-style front/back row party formation
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 前衛3/後衛3の6マスに5人を割り当てる隊列編成 (v2.0.0)
 * @author Copilot
 *
 * @param MaxBattleMembers
 * @text 最大戦闘人数
 * @type number
 * @min 1
 * @max 6
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
 * @param FrontTag
 * @text 前衛タグ(短縮)
 * @default 前
 *
 * @param BackTag
 * @text 後衛タグ(短縮)
 * @default 後
 *
 * @param ReserveTag
 * @text 控えタグ
 * @default 控え
 *
 * @param EmptySlotText
 * @text 空きマス表示
 * @default ――――――――
 *
 * @param FrontRowState
 * @text 前衛ステート
 * @type state
 * @default 0
 * @desc 前衛にいる間ずっと付与するステート。0で無し。
 *
 * @param BackRowState
 * @text 後衛ステート
 * @type state
 * @default 0
 * @desc 後衛にいる間ずっと付与するステート。0で無し。
 *
 * @help
 * メニューの「並び替え」コマンドを、前衛3・後衛3の合計6マスに全メンバーから
 * 最大MaxBattleMembers人を割り当てる隊列編成画面に差し替えます。
 *
 * 左側: 全パーティメンバーの一覧（配置済みなら前1〜3/後1〜3、未配置なら控え）
 * 右側: 前衛3マス・後衛3マスのグリッド（割り当て済みメンバー名 or 空きマス）
 *
 * 操作:
 *   左の一覧でOK … そのメンバーを選択して右のマス選択に移る
 *   右のマスでOK … 選択中のメンバーをそのマスに配置（既にいる場合は入れ替え）
 *   右のマスでキャンセル … 配置を中止して左の一覧に戻る
 *   左の一覧でキャンセル … 編成を終えてメニューへ戻る
 *
 * 前衛(スロット1〜3)には最低1人必要です。それ以外は自由に配置できます。
 * 戦闘中のアクターウィンドウも、前衛グループを上段、後衛グループを下段に
 * 分けて表示します（HP/MP横並び、TP常時表示、TPBゲージ無し）。
 *
 * 前衛ステート/後衛ステートを設定すると、そのマスにいる間は常に付与され、
 * 列を移ると入れ替わります。控えには付与しません。解除されても自動で
 * 再付与されるため、通常のステート解除手段では外れません。
 *
 * プラグインコマンドはありません。既存セーブでも利用できます
 * （初回アクセス時に現在のバトルメンバーを前衛優先で自動配置します）。
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "EtrianPartyFormation";
    const params = PluginManager.parameters(PLUGIN_NAME);
    const maxBattleMembers = Math.min(6, Math.max(1, Number(params.MaxBattleMembers) || 5));
    const frontLabel = String(params.FrontLabel || "前衛");
    const backLabel = String(params.BackLabel || "後衛");
    const frontTag = String(params.FrontTag || "前");
    const backTag = String(params.BackTag || "後");
    const reserveTag = String(params.ReserveTag || "控え");
    const emptySlotText = String(params.EmptySlotText || "――――――――");
    const frontRowStateId = Number(params.FrontRowState) || 0;
    const backRowStateId = Number(params.BackRowState) || 0;
    const FRONT_SLOTS = 3;
    const BACK_SLOTS = 3;
    const TOTAL_SLOTS = FRONT_SLOTS + BACK_SLOTS;

    //-------------------------------------------------------------------
    // Game_Party - fixed 6-slot (front3/back3) formation grid
    //-------------------------------------------------------------------
    Game_Party.prototype.maxBattleMembers = function() {
        return maxBattleMembers;
    };

    Game_Party.prototype.formationSlots = function() {
        if (!this._formationSlots) this.initFormationSlots();
        return this._formationSlots;
    };

    Game_Party.prototype.initFormationSlots = function() {
        this._formationSlots = new Array(TOTAL_SLOTS).fill(null);
        const members = this.allBattleMembers();
        for (let i = 0; i < members.length && i < TOTAL_SLOTS; i++) {
            this._formationSlots[i] = members[i].actorId();
        }
        this.refreshFormationRowStates();
    };

    Game_Party.prototype.slotIndexOfActor = function(actor) {
        return actor ? this.formationSlots().indexOf(actor.actorId()) : -1;
    };

    Game_Party.prototype.actorInSlot = function(slotIndex) {
        const id = this.formationSlots()[slotIndex];
        return id ? $gameActors.actor(id) : null;
    };

    Game_Party.prototype.formationFrontMembers = function() {
        return this.formationSlots()
            .slice(0, FRONT_SLOTS)
            .map(id => (id ? $gameActors.actor(id) : null))
            .filter(actor => actor);
    };

    Game_Party.prototype.formationBackMembers = function() {
        return this.formationSlots()
            .slice(FRONT_SLOTS, TOTAL_SLOTS)
            .map(id => (id ? $gameActors.actor(id) : null))
            .filter(actor => actor);
    };

    Game_Party.prototype.formationReserveMembers = function() {
        const slots = this.formationSlots();
        return this.allMembers().filter(actor => !slots.includes(actor.actorId()));
    };

    Game_Party.prototype.syncActorsWithFormation = function() {
        const activeIds = this.formationSlots().filter(id => id);
        const others = this._actors.filter(id => !activeIds.includes(id));
        this._actors = activeIds.concat(others);
        this.refreshFormationRowStates();
        $gamePlayer.refresh();
    };

    Game_Party.prototype.refreshFormationRowStates = function() {
        for (const actor of this.allMembers()) actor.refresh();
    };

    // Places actor into slotIndex, swapping with whoever already occupies it.
    // Returns false (no change) if this would empty the front row or exceed
    // the active member cap.
    Game_Party.prototype.assignFormationSlot = function(actor, slotIndex) {
        const slots = this.formationSlots();
        const oldSlot = slots.indexOf(actor.actorId());
        if (oldSlot === slotIndex) return true;
        const occupantId = slots[slotIndex];
        const filledCount = slots.filter(id => id).length;
        if (oldSlot < 0 && !occupantId && filledCount >= maxBattleMembers) {
            return false;
        }
        const next = slots.slice();
        if (oldSlot >= 0) next[oldSlot] = occupantId || null;
        next[slotIndex] = actor.actorId();
        const frontCount = next.slice(0, FRONT_SLOTS).filter(id => id).length;
        if (frontCount === 0) return false;
        this._formationSlots = next;
        this.syncActorsWithFormation();
        return true;
    };

    Game_Party.prototype.autoAssignFormationSlot = function(actorId) {
        const slots = this.formationSlots();
        if (slots.includes(actorId)) return;
        if (slots.filter(id => id).length >= maxBattleMembers) return;
        const emptyIndex = slots.findIndex(id => !id);
        if (emptyIndex >= 0) {
            slots[emptyIndex] = actorId;
            this.syncActorsWithFormation();
        }
    };

    const _Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
        const isNew = !this._actors.includes(actorId);
        _Game_Party_addActor.call(this, actorId);
        if (isNew) this.autoAssignFormationSlot(actorId);
    };

    // New game and loaded saves: place members (and their row states) eagerly.
    const _Game_Party_setupStartingMembers = Game_Party.prototype.setupStartingMembers;
    Game_Party.prototype.setupStartingMembers = function() {
        _Game_Party_setupStartingMembers.call(this);
        this.initFormationSlots();
    };

    const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        _Game_System_onAfterLoad.call(this);
        $gameParty.formationSlots();
        $gameParty.refreshFormationRowStates();
    };

    const _Game_Party_removeActor = Game_Party.prototype.removeActor;
    Game_Party.prototype.removeActor = function(actorId) {
        _Game_Party_removeActor.call(this, actorId);
        const slots = this.formationSlots();
        const idx = slots.indexOf(actorId);
        if (idx >= 0) slots[idx] = null;
        $gameActors.actor(actorId)?.refresh();
    };

    //-------------------------------------------------------------------
    // Game_Actor - row states follow the slot; re-applied on every refresh
    //-------------------------------------------------------------------
    Game_Actor.prototype.formationRowStateId = function() {
        const slots = $gameParty?._formationSlots;
        if (!slots || !$gameParty._actors.includes(this.actorId())) return 0;
        const slot = slots.indexOf(this.actorId());
        if (slot < 0) return 0;
        return slot < FRONT_SLOTS ? frontRowStateId : backRowStateId;
    };

    // Uses addNewState/eraseState (not addState/removeState) so row changes
    // never produce battle-log "state added" messages or trigger refresh loops.
    Game_Actor.prototype.syncFormationRowStates = function() {
        if (!frontRowStateId && !backRowStateId) return;
        const wanted = this.formationRowStateId();
        for (const id of [frontRowStateId, backRowStateId]) {
            if (id && id !== wanted && this.isStateAffected(id)) this.eraseState(id);
        }
        if (wanted && !this.isStateAffected(wanted) && this.isStateAddable(wanted)) {
            this.addNewState(wanted);
            this.resetStateCounts(wanted);
        }
    };

    const _Game_Actor_refresh = Game_Actor.prototype.refresh;
    Game_Actor.prototype.refresh = function() {
        this.syncFormationRowStates();
        _Game_Actor_refresh.call(this);
    };

    // Row states are permanent while placed; skip their turn/battle-end expiry.
    const _Game_Actor_removeState = Game_Actor.prototype.removeState;
    Game_Actor.prototype.removeState = function(stateId) {
        if (stateId && stateId === this.formationRowStateId()) return;
        _Game_Actor_removeState.call(this, stateId);
    };

    //-------------------------------------------------------------------
    // Scene_Menu - reuse the existing "並び替え" command
    //-------------------------------------------------------------------
    Scene_Menu.prototype.commandFormation = function() {
        SceneManager.push(Scene_PartyFormation);
    };

    const slotTag = actor => {
        const slot = $gameParty.slotIndexOfActor(actor);
        if (slot < 0) return reserveTag;
        return `${slot < FRONT_SLOTS ? frontTag : backTag}${(slot % FRONT_SLOTS) + 1}`;
    };

    // drawFace only crops, so scale the portrait to fit small cells.
    const drawScaledFace = (win, actor, x, y, size) => {
        const bitmap = ImageManager.loadFace(actor.faceName());
        const pw = ImageManager.faceWidth;
        const ph = ImageManager.faceHeight;
        const sx = (actor.faceIndex() % 4) * pw;
        const sy = Math.floor(actor.faceIndex() / 4) * ph;
        win.contents.blt(bitmap, sx, sy, pw, ph, x, y, size, size);
    };

    // Row text sized to the row (MainFontLetterSpacing ignores canvas maxWidth,
    // so shrink the font explicitly instead of relying on squeeze).
    const drawRowText = (win, text, x, y, width, height, align) => {
        const contents = win.contents;
        const original = contents.fontSize;
        let size = Math.min($gameSystem.mainFontSize(), Math.max(14, height - 8));
        contents.fontSize = size;
        const measured = contents.measureTextWidth(text);
        if (measured > width) size = Math.max(12, Math.floor(size * width / measured));
        contents.fontSize = size;
        contents.drawText(text, x, y, width, height, align || "left");
        contents.fontSize = original;
    };

    //-------------------------------------------------------------------
    // Roster window (left) - every party member, tagged with their slot
    //-------------------------------------------------------------------
    class Window_FormationRoster extends Window_Selectable {
        initialize(rect, rowHeight) {
            this._rowHeight = rowHeight || 56;
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
        maxCols() {
            return 1;
        }
        itemHeight() {
            return this._rowHeight;
        }
        item(index) {
            return this._list[index !== undefined ? index : this.index()];
        }
        selectActor(actor) {
            const index = this._list.indexOf(actor);
            if (index >= 0) this.select(index);
        }
        cursorDown(wrap) {
            if (this.index() < this.maxItems() - 1) super.cursorDown(false);
        }
        cursorUp(wrap) {
            if (this.index() > 0) super.cursorUp(false);
        }
        cursorRight(wrap) {
            if (this._onBoundary) this._onBoundary("right");
        }
        cursorLeft(wrap) {}
        drawItem(index) {
            const actor = this.item(index);
            if (!actor) return;
            const rect = this.itemRectWithPadding(index);
            const faceSize = rect.height - 4;
            const tagWidth = Math.max(40, Math.floor(rect.height * 1.2));
            const textX = rect.x + faceSize + 8;
            const textWidth = rect.width - faceSize - 8 - tagWidth;
            this.changePaintOpacity($gameParty.slotIndexOfActor(actor) >= 0);
            drawScaledFace(this, actor, rect.x, rect.y + 2, faceSize);
            this.resetTextColor();
            drawRowText(this, actor.name(), textX, rect.y, textWidth, rect.height);
            this.changeTextColor(ColorManager.systemColor());
            drawRowText(this, slotTag(actor), rect.x + rect.width - tagWidth, rect.y, tagWidth, rect.height, "right");
            this.resetTextColor();
            this.changePaintOpacity(true);
        }
    }

    //-------------------------------------------------------------------
    // Grid window (right) - front3/back3 cells with a group label column
    //-------------------------------------------------------------------
    class Window_FormationGrid extends Window_Selectable {
        initialize(rect, rowHeight) {
            this._rowHeight = rowHeight || 56;
            super.initialize(rect);
            this._onBoundary = null;
            this.refresh();
        }
        setOnBoundary(handler) {
            this._onBoundary = handler;
        }
        maxItems() {
            return TOTAL_SLOTS;
        }
        maxCols() {
            return 1;
        }
        itemHeight() {
            return this._rowHeight;
        }
        labelWidth() {
            return 80;
        }
        groupGap() {
            return 16;
        }
        fittingBoardHeight() {
            return this.itemHeight() * TOTAL_SLOTS + this.groupGap() + this.padding * 2;
        }
        overallHeight() {
            return super.overallHeight() + this.groupGap();
        }
        itemRect(index) {
            const rect = super.itemRect(index);
            rect.x += this.labelWidth();
            rect.width -= this.labelWidth();
            if (index >= FRONT_SLOTS) rect.y += this.groupGap();
            return rect;
        }
        cursorDown(wrap) {
            if (this.index() < this.maxItems() - 1) super.cursorDown(false);
        }
        cursorUp(wrap) {
            if (this.index() > 0) super.cursorUp(false);
        }
        cursorRight(wrap) {}
        cursorLeft(wrap) {
            if (this._onBoundary) this._onBoundary("left");
        }
        drawItem(index) {
            const rect = this.itemRectWithPadding(index);
            const actor = $gameParty.actorInSlot(index);
            if (actor) {
                const faceSize = rect.height - 4;
                drawScaledFace(this, actor, rect.x, rect.y + 2, faceSize);
                this.resetTextColor();
                drawRowText(this, actor.name(), rect.x + faceSize + 8, rect.y, rect.width - faceSize - 8, rect.height);
            } else {
                this.changeTextColor(ColorManager.textColor(8));
                drawRowText(this, emptySlotText, rect.x, rect.y, rect.width, rect.height, "center");
                this.resetTextColor();
            }
        }
        paint() {
            super.paint();
            if (!this.contents) return;
            this.drawGroupLabel(frontLabel, 0, FRONT_SLOTS - 1);
            this.drawGroupLabel(backLabel, FRONT_SLOTS, TOTAL_SLOTS - 1);
        }
        drawGroupLabel(text, firstIndex, lastIndex) {
            const top = this.itemRect(firstIndex).y;
            const last = this.itemRect(lastIndex);
            const bottom = last.y + last.height;
            const height = Math.min(44, bottom - top);
            const y = top + Math.floor((bottom - top - height) / 2);
            this.changeTextColor(ColorManager.systemColor());
            drawRowText(this, text, 0, y, this.labelWidth() - 8, height, "center");
            this.resetTextColor();
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
        this._pendingActor = null;
    };

    Scene_PartyFormation.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createRosterWindow();
        this.createGridWindow();
        this.wireBoundaries();
        this.refreshAll();
        this._rosterWindow.select(0);
        this.activateFormationWindow(this._rosterWindow);
    };

    Scene_PartyFormation.prototype.rosterWindowRect = function() {
        const ww = Math.floor(Graphics.boxWidth * 0.42);
        return new Rectangle(0, this.mainAreaTop(), ww, this.mainAreaHeight());
    };

    Scene_PartyFormation.prototype.gridWindowRect = function() {
        const roster = this.rosterWindowRect();
        const wx = roster.width;
        return new Rectangle(wx, this.mainAreaTop(), Graphics.boxWidth - wx, this.mainAreaHeight());
    };

    Scene_PartyFormation.prototype.createRosterWindow = function() {
        this._rosterWindow = new Window_FormationRoster(this.rosterWindowRect());
        this._rosterWindow.setHandler("ok", this.onRosterOk.bind(this));
        this._rosterWindow.setHandler("cancel", this.onRosterCancel.bind(this));
        this.addWindow(this._rosterWindow);
    };

    Scene_PartyFormation.prototype.createGridWindow = function() {
        const rect = this.gridWindowRect();
        const grid = new Window_FormationGrid(rect);
        // Shrink to the six cells so the grid reads as a fixed formation board.
        const fitted = Math.min(rect.height, grid.fittingBoardHeight());
        if (fitted !== rect.height) {
            grid.move(rect.x, rect.y, rect.width, fitted);
            grid.createContents();
            grid.refresh();
        }
        grid.setHandler("ok", this.onGridOk.bind(this));
        grid.setHandler("cancel", this.onGridCancel.bind(this));
        this.addWindow(grid);
        this._gridWindow = grid;
    };

    Scene_PartyFormation.prototype.wireBoundaries = function() {
        this._rosterWindow.setOnBoundary(dir => {
            if (dir === "right") this.pickUpAndOpenGrid();
        });
        this._gridWindow.setOnBoundary(dir => {
            if (dir === "left") this.cancelPending();
        });
    };

    Scene_PartyFormation.prototype.activateFormationWindow = function(win) {
        this._rosterWindow.deactivate();
        this._gridWindow.deactivate();
        if (win === this._rosterWindow) this._gridWindow.deselect();
        win.activate();
    };

    Scene_PartyFormation.prototype.refreshAll = function() {
        this._rosterWindow.setList($gameParty.allMembers());
        this._gridWindow.refresh();
        this.updateHelpText();
    };

    Scene_PartyFormation.prototype.updateHelpText = function() {
        if (this._pendingActor) {
            this._helpWindow.setText(
                `${this._pendingActor.name()} を置くマスを選択\n${frontLabel}には最低1人必要です`
            );
        } else {
            this._helpWindow.setText(
                `メンバーを選び、${frontLabel}/${backLabel}のマスへ配置\nキャンセルで戻る`
            );
        }
    };

    Scene_PartyFormation.prototype.pickUpAndOpenGrid = function() {
        const actor = this._rosterWindow.item();
        if (!actor) return;
        this._pendingActor = actor;
        this.updateHelpText();
        const slot = $gameParty.slotIndexOfActor(actor);
        this._gridWindow.select(slot >= 0 ? slot : 0);
        this.activateFormationWindow(this._gridWindow);
    };

    Scene_PartyFormation.prototype.onRosterOk = function() {
        this.pickUpAndOpenGrid();
        if (!this._pendingActor) this._rosterWindow.activate();
    };

    Scene_PartyFormation.prototype.onRosterCancel = function() {
        this.popScene();
    };

    Scene_PartyFormation.prototype.cancelPending = function() {
        this._pendingActor = null;
        this.updateHelpText();
        this.activateFormationWindow(this._rosterWindow);
    };

    Scene_PartyFormation.prototype.onGridOk = function() {
        const actor = this._pendingActor;
        if (!actor) {
            this._gridWindow.activate();
            return;
        }
        const ok = $gameParty.assignFormationSlot(actor, this._gridWindow.index());
        if (!ok) {
            SoundManager.playBuzzer();
            this._gridWindow.activate();
            return;
        }
        SoundManager.playEquip();
        this._pendingActor = null;
        this.refreshAll();
        this._rosterWindow.selectActor(actor);
        this.activateFormationWindow(this._rosterWindow);
    };

    Scene_PartyFormation.prototype.onGridCancel = function() {
        this.cancelPending();
    };

    //-------------------------------------------------------------------
    // Menu party list - compact cards (2 columns when wide) with slot tags
    //-------------------------------------------------------------------
    const isMenuStatusGrid = win => !(win instanceof Window_MenuActor);
    const menuFaceGap = 10;
    const gaugeStep = 128 + 8;

    const _Window_MenuStatus_maxCols = Window_MenuStatus.prototype.maxCols;
    Window_MenuStatus.prototype.maxCols = function() {
        if (!isMenuStatusGrid(this)) return _Window_MenuStatus_maxCols.call(this);
        return this.innerWidth >= 640 ? 2 : 1;
    };

    const _Window_MenuStatus_numVisibleRows = Window_MenuStatus.prototype.numVisibleRows;
    Window_MenuStatus.prototype.numVisibleRows = function() {
        if (!isMenuStatusGrid(this)) return _Window_MenuStatus_numVisibleRows.call(this);
        const shown = Math.min(Math.max($gameParty.size(), 1), TOTAL_SLOTS);
        return Math.max(1, Math.ceil(shown / this.maxCols()));
    };

    const _Window_MenuStatus_itemHeight = Window_MenuStatus.prototype.itemHeight;
    Window_MenuStatus.prototype.itemHeight = function() {
        if (!isMenuStatusGrid(this)) return _Window_MenuStatus_itemHeight.call(this);
        const gaugeCount = $dataSystem.optDisplayTp ? 3 : 2;
        const candidate = Math.floor(this.innerHeight / this.numVisibleRows());
        const cellWidth = Math.floor(this.innerWidth / this.maxCols()) - this.colSpacing() - this.itemPadding() * 2;
        const textWidth = cellWidth - Math.min(ImageManager.faceHeight, candidate - 8) - menuFaceGap;
        const gaugeRows = textWidth >= gaugeStep * gaugeCount - 8 ? 1 : gaugeCount;
        // Name/tag row + attack/magic/agility row + gauge rows.
        const minHeight = this.lineHeight() * 2 + this.gaugeLineHeight() * gaugeRows + 8;
        return Math.max(minHeight, candidate);
    };

    // Attack/Magic Attack/Agility, requested for the menu party list.
    Window_MenuStatus.prototype.menuStatsLineParams = function() {
        return [{ id: 2, label: "攻" }, { id: 4, label: "魔" }, { id: 6, label: "敏" }];
    };

    Window_MenuStatus.prototype.drawActorStatsLine = function(actor, x, y, width) {
        const stats = this.menuStatsLineParams();
        const colWidth = Math.floor(width / stats.length);
        const labelWidth = this.textWidth("攻") + 4;
        for (let i = 0; i < stats.length; i++) {
            const cx = x + colWidth * i;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(stats[i].label, cx, y, labelWidth);
            this.resetTextColor();
            this.drawText(actor.param(stats[i].id), cx + labelWidth, y, colWidth - labelWidth - 4, "right");
        }
    };

    Window_MenuStatus.prototype.menuFaceSize = function(rect) {
        return Math.min(ImageManager.faceHeight, rect.height - 8);
    };

    const _Window_MenuStatus_drawItemImage = Window_MenuStatus.prototype.drawItemImage;
    Window_MenuStatus.prototype.drawItemImage = function(index) {
        if (!isMenuStatusGrid(this)) return _Window_MenuStatus_drawItemImage.call(this, index);
        const actor = this.actor(index);
        const rect = this.itemRectWithPadding(index);
        const size = this.menuFaceSize(rect);
        this.changePaintOpacity($gameParty.slotIndexOfActor(actor) >= 0);
        drawScaledFace(this, actor, rect.x, rect.y + Math.floor((rect.height - size) / 2), size);
        this.changePaintOpacity(true);
    };

    const _Window_MenuStatus_drawItemStatus = Window_MenuStatus.prototype.drawItemStatus;
    Window_MenuStatus.prototype.drawItemStatus = function(index) {
        if (!isMenuStatusGrid(this)) return _Window_MenuStatus_drawItemStatus.call(this, index);
        const actor = this.actor(index);
        const rect = this.itemRectWithPadding(index);
        const size = this.menuFaceSize(rect);
        const x = rect.x + size + menuFaceGap;
        const width = rect.width - size - menuFaceGap;
        const lineH = this.lineHeight();
        const gaugeH = this.gaugeLineHeight();
        const types = $dataSystem.optDisplayTp ? ["hp", "mp", "tp"] : ["hp", "mp"];
        const sideBySide = width >= gaugeStep * types.length - 8;
        const gaugeRows = sideBySide ? 1 : types.length;
        const threeLines = rect.height >= lineH * 3 + gaugeH * gaugeRows + 8;
        const blockH = (threeLines ? lineH * 2 : lineH) + lineH + gaugeH * gaugeRows;
        let y = rect.y + Math.floor((rect.height - blockH) / 2);
        const tagWidth = 56;
        const lvWidth = 72;
        this.drawActorName(actor, x, y, width - tagWidth - lvWidth);
        this.drawCompactLevel(actor, x + width - tagWidth - lvWidth, y);
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(slotTag(actor), x + width - tagWidth, y, tagWidth, "right");
        this.resetTextColor();
        y += lineH;
        if (threeLines) {
            this.drawActorClass(actor, x, y, width);
            y += lineH;
        }
        this.drawActorStatsLine(actor, x, y, width);
        y += lineH;
        let gx = x;
        for (const type of types) {
            this.placeGauge(actor, type, gx, y);
            if (sideBySide) gx += gaugeStep;
            else y += gaugeH;
        }
    };

    Window_MenuStatus.prototype.drawCompactLevel = function(actor, x, y) {
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(TextManager.levelA, x, y, 32);
        this.resetTextColor();
        this.drawText(actor.level, x + 32, y, 40, "right");
    };

    // DestinationExternalData pins this instance's rows to a full face height;
    // the compact cards need the prototype value again.
    const _Scene_Menu_create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _Scene_Menu_create.call(this);
        const status = this._statusWindow;
        if (status && Object.prototype.hasOwnProperty.call(status, "itemHeight")) {
            delete status.itemHeight;
            status.createContents();
            status.refresh();
        }
    };

    //-------------------------------------------------------------------
    // Battle status window - taller status area for face + gauges + chips
    //-------------------------------------------------------------------
    Scene_Battle.prototype.formationStatusHeight = function() {
        return 150;
    };

    const _Scene_Battle_statusWindowRect = Scene_Battle.prototype.statusWindowRect;
    Scene_Battle.prototype.formationStatusDelta = function() {
        return this.formationStatusHeight() - _Scene_Battle_statusWindowRect.call(this).height;
    };
    Scene_Battle.prototype.statusWindowRect = function() {
        const rect = _Scene_Battle_statusWindowRect.call(this);
        const delta = this.formationStatusDelta();
        rect.y -= delta;
        rect.height += delta;
        return rect;
    };
    const _Scene_Battle_helpWindowRect = Scene_Battle.prototype.helpWindowRect;
    Scene_Battle.prototype.helpWindowRect = function() {
        const rect = _Scene_Battle_helpWindowRect.call(this);
        rect.y -= this.formationStatusDelta();
        return rect;
    };
    const _Scene_Battle_skillWindowRect = Scene_Battle.prototype.skillWindowRect;
    Scene_Battle.prototype.skillWindowRect = function() {
        const rect = _Scene_Battle_skillWindowRect.call(this);
        rect.height = Math.max(1, rect.height - this.formationStatusDelta());
        return rect;
    };
    // FlexibleTopDownUI re-applies hardcoded heights after create; follow it.
    const _Scene_Battle_relayout = Scene_Battle.prototype.relayoutBattleWindows;
    if (_Scene_Battle_relayout) {
        Scene_Battle.prototype.relayoutBattleWindows = function() {
            _Scene_Battle_relayout.call(this);
            const status = this.statusWindowRect();
            const help = this.helpWindowRect();
            for (const [win, rect] of [[this._statusWindow, status], [this._helpWindow, help]]) {
                if (!win) continue;
                const resized = win.height !== rect.height || win.width !== rect.width;
                win.move(rect.x, rect.y, rect.width, rect.height);
                if (resized) {
                    win.createContents();
                    win.refresh();
                }
            }
        };
    }

    Window_BattleStatus.prototype.maxCols = function() {
        return FRONT_SLOTS;
    };

    Window_BattleStatus.prototype.colSpacing = function() {
        return 0;
    };

    Window_BattleStatus.prototype.rowSpacing = function() {
        return 0;
    };

    Window_BattleStatus.prototype.itemRect = function(index) {
        const actor = this.actor(index);
        const front = $gameParty.formationFrontMembers();
        const back = $gameParty.formationBackMembers();
        const inFront = actor && front.includes(actor);
        const rowMembers = inFront ? front : back;
        const row = inFront ? 0 : 1;
        const col = actor ? Math.max(0, rowMembers.indexOf(actor)) : 0;
        const cellW = Math.floor(this.innerWidth / FRONT_SLOTS);
        const blockW = cellW * Math.min(FRONT_SLOTS, rowMembers.length);
        const cellH = Math.floor(this.innerHeight / 2);
        const colSpacing = this.colSpacing();
        const rowSpacing = this.rowSpacing();
        const x = Math.floor((this.innerWidth - blockW) / 2) + col * cellW + colSpacing / 2 - this.scrollBaseX();
        const y = row * cellH + rowSpacing / 2 - this.scrollBaseY();
        return new Rectangle(x, y, cellW - colSpacing, cellH - rowSpacing);
    };

    // Compact gauge: caller-defined width, fixed small fonts so a 36px main
    // font does not spill over the 20px gauge line.
    class Sprite_FormationGauge extends Sprite_Gauge {
        setupWidth(width) {
            if (this._formationWidth === width) return;
            this._formationWidth = width;
            this.bitmap.destroy();
            this.createBitmap();
            this._battler && this.redraw();
        }
        bitmapWidth() { return this._formationWidth || 128; }
        bitmapHeight() { return 22; }
        textHeight() { return 20; }
        gaugeHeight() { return 8; }
        labelY() { return 0; }
        labelFontSize() { return 14; }
        valueFontSize() { return 16; }
        labelOutlineWidth() { return 2; }
        valueOutlineWidth() { return 2; }
        gaugeX() { return this.measureLabelWidth() + 4; }
    }

    // Ring gauge with the value in the middle (used for TP).
    class Sprite_RingGauge extends Sprite_FormationGauge {
        bitmapHeight() { return this.bitmapWidth(); }
        labelFontSize() { return 10; }
        valueFontSize() { return 16; }
        ringWidth() { return 5; }
        drawGauge() {
            const size = this.bitmapWidth();
            const ctx = this.bitmap.context;
            const cx = size / 2;
            const cy = size / 2;
            const r = size / 2 - this.ringWidth() / 2 - 1;
            ctx.save();
            ctx.lineWidth = this.ringWidth();
            ctx.lineCap = "round";
            ctx.strokeStyle = this.gaugeBackColor();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            const rate = this.gaugeRate();
            if (rate > 0) {
                const grad = ctx.createLinearGradient(0, 0, size, size);
                grad.addColorStop(0, this.gaugeColor1());
                grad.addColorStop(1, this.gaugeColor2());
                ctx.strokeStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rate);
                ctx.stroke();
            }
            ctx.restore();
            this.bitmap._baseTexture.update();
        }
        drawLabel() {
            const size = this.bitmapWidth();
            this.setupLabelFont();
            this.bitmap.paintOpacity = this.labelOpacity();
            this.bitmap.drawText(this.label(), 0, Math.floor(size * 0.18), size, 12, "center");
            this.bitmap.paintOpacity = 255;
        }
        drawValue() {
            const size = this.bitmapWidth();
            this.setupValueFont();
            this.bitmap.drawText(this.currentValue(), 0, Math.floor(size * 0.42), size, 20, "center");
        }
    }

    // Two-character state names in small boxes instead of icons. Redraws only
    // when the affected state list changes.
    class Sprite_StateChips extends Sprite {
        initialize() {
            super.initialize();
            this._battler = null;
            this._key = null;
            this._chipWidth = 0;
            this.bitmap = new Bitmap(1, 1);
        }
        setup(battler, width) {
            if (this._chipWidth !== width) {
                this._chipWidth = width;
                this.bitmap.destroy();
                this.bitmap = new Bitmap(Math.max(1, width), 18);
                this._key = null;
            }
            this._battler = battler;
        }
        update() {
            super.update();
            if (!this._battler) return;
            const states = this._battler.states().filter(s => s.iconIndex > 0);
            const key = states.map(s => s.id).join(",");
            if (key !== this._key) {
                this._key = key;
                this.redraw(states);
            }
        }
        redraw(states) {
            const bitmap = this.bitmap;
            bitmap.clear();
            bitmap.fontFace = "sans-serif";
            bitmap.fontSize = 11;
            bitmap.outlineWidth = 0;
            bitmap.textColor = "#ffffff";
            const chipW = 26;
            const gap = 2;
            let x = 0;
            for (const state of states) {
                if (x + chipW > bitmap.width) break;
                bitmap.fillRect(x, 1, chipW, 16, "rgba(0, 0, 0, 0.55)");
                bitmap.fillRect(x, 1, chipW, 1, "rgba(255, 255, 255, 0.35)");
                bitmap.drawText(state.name.slice(0, 2), x, 1, chipW, 16, "center");
                x += chipW + gap;
            }
        }
    }

    Window_BattleStatus.prototype.placeFormationGauge = function(actor, type, x, y, width, spriteClass) {
        const key = "formation-gauge-%1-%2".format(actor.actorId(), type);
        const sprite = this.createInnerSprite(key, spriteClass || Sprite_FormationGauge);
        sprite.setupWidth(width);
        sprite.setup(actor, type);
        sprite.move(x, y);
        sprite.show();
    };

    Window_BattleStatus.prototype.placeStateChips = function(actor, x, y, width) {
        const key = "formation-chips-%1".format(actor.actorId());
        const sprite = this.createInnerSprite(key, Sprite_StateChips);
        sprite.setup(actor, width);
        sprite.move(x, y);
        sprite.show();
    };

    Window_BattleStatus.prototype.formationCellLayout = function(rect) {
        const gap = 0;
        const faceSize = Math.min(52, rect.height - 2);
        const ringSize = Math.min(46, rect.height - 2);
        const middleX = rect.x + faceSize + gap;
        const middleW = rect.width - faceSize - ringSize - gap * 2;
        return { gap, faceSize, ringSize, middleX, middleW, ringX: rect.x + rect.width - ringSize };
    };

    Window_BattleStatus.prototype.drawItemImage = function(index) {
        const actor = this.actor(index);
        if (!actor) return;
        const rect = this.itemRectWithPadding(index);
        const layout = this.formationCellLayout(rect);
        this.changePaintOpacity(actor.isAlive());
        drawScaledFace(this, actor, rect.x, rect.y + 1, layout.faceSize);
        this.changePaintOpacity(true);
    };

    Window_BattleStatus.prototype.drawItemStatus = function(index) {
        const actor = this.actor(index);
        if (!actor) return;
        const rect = this.itemRectWithPadding(index);
        const layout = this.formationCellLayout(rect);
        const isFront = $gameParty.formationFrontMembers().includes(actor);
        const nameH = 16;
        const gaugeH = 16;
        const x = layout.middleX;
        const width = layout.middleW;
        let y = rect.y;
        const tagWidth = 20;
        this.drawFormationRowTag(isFront, x, y, tagWidth, nameH);
        this.drawBattleName(actor, x + tagWidth + 2, y, width - tagWidth - 2, nameH);
        y += nameH + 1;
        this.placeFormationGauge(actor, "hp", x, y, width);
        y += gaugeH;
        this.placeFormationGauge(actor, "mp", x, y, width);
        y += gaugeH;
        this.placeStateChips(actor, x, y, rect.x + rect.width - x);
        this.placeFormationGauge(actor, "tp", layout.ringX, rect.y, layout.ringSize, Sprite_RingGauge);
    };

    Window_BattleStatus.prototype.drawBattleName = function(actor, x, y, width, height) {
        const fontSize = this.contents.fontSize;
        const base = 16;
        this.contents.fontSize = base;
        const measured = this.textWidth(actor.name());
        if (measured > width) {
            this.contents.fontSize = Math.max(11, Math.floor(base * width / measured));
        }
        this.changeTextColor(ColorManager.hpColor(actor));
        this.contents.drawText(actor.name(), x, y, width, height, "left");
        this.contents.fontSize = fontSize;
        this.resetTextColor();
    };

    Window_BattleStatus.prototype.drawFormationRowTag = function(isFront, x, y, width, height) {
        const fontSize = this.contents.fontSize;
        this.contents.fontSize = 13;
        this.changeTextColor(isFront ? ColorManager.textColor(24) : ColorManager.textColor(6));
        this.contents.drawText(isFront ? frontTag : backTag, x, y, width, height, "center");
        this.contents.fontSize = fontSize;
        this.resetTextColor();
    };

    //-------------------------------------------------------------------
    // In-battle formation is opened from BattleCommandHierarchy's 編成変更 menu.
    //-------------------------------------------------------------------
    const _Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function() {
        _Window_ActorCommand_makeCommandList.call(this);
        if (!this._actor) return;
        const layer = this._battleCommandLayer;
        if (layer !== undefined && layer !== "root") return;
        const enabled = $gameSystem.isFormationEnabled();
        // BattleCommandHierarchy's reserve swap is superseded by full formation.
        const swap = this._list.find(c => c.symbol === "swap");
        if (swap) {
            swap.name = "編成変更";
            swap.symbol = "formationMenu";
            swap.enabled = enabled;
        } else {
            this.addCommand("編成変更", "formationMenu", enabled);
        }
    };

    const _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        _Scene_Battle_createActorCommandWindow.call(this);
        this._actorCommandWindow.setHandler("formation", this.commandBattleFormation.bind(this));
    };

    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this.createBattleFormationWindows();
    };

    Scene_Battle.prototype.createBattleFormationWindows = function() {
        const top = this.skillWindowRect().y;
        const bottom = this.statusWindowRect().y;
        const available = bottom - top;
        // Fit all six cells (plus the group gap and padding) in the free area.
        const rowH = Math.max(28, Math.min(44, Math.floor((available - 16 - 24) / TOTAL_SLOTS)));
        const height = Math.min(available, rowH * TOTAL_SLOTS + 16 + 24);
        const rosterW = Math.floor(Graphics.boxWidth * 0.42);
        const roster = new Window_FormationRoster(new Rectangle(0, top, rosterW, height), rowH);
        const grid = new Window_FormationGrid(new Rectangle(rosterW, top, Graphics.boxWidth - rosterW, height), rowH);
        roster.setHandler("ok", this.onBattleFormationRosterOk.bind(this));
        roster.setHandler("cancel", this.onBattleFormationRosterCancel.bind(this));
        roster.setOnBoundary(dir => { if (dir === "right") this.onBattleFormationRosterOk(); });
        grid.setHandler("ok", this.onBattleFormationGridOk.bind(this));
        grid.setHandler("cancel", this.onBattleFormationGridCancel.bind(this));
        grid.setOnBoundary(dir => { if (dir === "left") this.onBattleFormationGridCancel(); });
        for (const win of [roster, grid]) {
            win.hide();
            win.deactivate();
            this.addWindow(win);
        }
        this._battleFormationRoster = roster;
        this._battleFormationGrid = grid;
        this._battleFormationPending = null;
        this._battleFormationBefore = null;
    };

    Scene_Battle.prototype.commandBattleFormation = function() {
        this._actorCommandWindow.deactivate();
        this._battleFormationBefore = $gameParty.formationSlots().slice();
        this._battleFormationActor = BattleManager.actor();
        this._battleFormationPending = null;
        const targets = $gameParty.battleMembers().filter(actor => actor !== this._battleFormationActor);
        this._battleFormationRoster.setList(targets);
        this._battleFormationRoster.select(0);
        this._battleFormationGrid.deselect();
        this._battleFormationGrid.refresh();
        this._battleFormationRoster.show();
        this._battleFormationGrid.show();
        this._battleFormationRoster.activate();
    };

    Scene_Battle.prototype.onBattleFormationRosterOk = function() {
        const target = this._battleFormationRoster.item();
        if (!target) {
            this._battleFormationRoster.activate();
            return;
        }
        this._battleFormationPending = target;
        const slot = $gameParty.slotIndexOfActor(target);
        this._battleFormationRoster.deactivate();
        this._battleFormationGrid.select(slot >= 0 ? slot : -1);
        this._battleFormationGrid.activate();
    };

    Scene_Battle.prototype.onBattleFormationGridCancel = function() {
        this._battleFormationPending = null;
        this._battleFormationGrid.deactivate();
        this._battleFormationGrid.deselect();
        this._battleFormationRoster.activate();
    };

    Scene_Battle.prototype.onBattleFormationGridOk = function() {
        const actor = this._battleFormationActor;
        const target = this._battleFormationPending;
        const targetSlot = target ? $gameParty.slotIndexOfActor(target) : -1;
        if (!actor || !target || actor === target || targetSlot < 0 ||
            this._battleFormationGrid.index() !== targetSlot ||
            !$gameParty.assignFormationSlot(actor, targetSlot)) {
            SoundManager.playBuzzer();
            this._battleFormationGrid.activate();
            return;
        }
        SoundManager.playEquip();
        this._battleFormationPending = null;
        this._battleFormationGrid.refresh();
        this.consumeTurnForFormation(this._battleFormationBefore, $gameParty.formationSlots());
    };

    Scene_Battle.prototype.hideBattleFormationWindows = function() {
        for (const win of [this._battleFormationRoster, this._battleFormationGrid]) {
            if (!win) continue;
            win.hide();
            win.deactivate();
        }
        this._battleFormationPending = null;
        this._battleFormationActor = null;
    };

    Scene_Battle.prototype.onBattleFormationRosterCancel = function() {
        const before = this._battleFormationBefore || [];
        const after = $gameParty.formationSlots();
        const changed = before.some((id, i) => id !== after[i]);
        this.hideBattleFormationWindows();
        if (!changed) {
            if (this._actorCommandWindow.setBattleCommandLayer) {
                this._actorCommandWindow.setBattleCommandLayer("root", "formation");
            } else {
                this._actorCommandWindow.activate();
            }
            return;
        }
        this.consumeTurnForFormation(before, after);
    };

    // Same reset the reserve swap uses: moved actors and the commanding actor
    // lose their pending actions and TPB charge; HP/MP/TP/states are kept.
    Scene_Battle.prototype.consumeTurnForFormation = function(before, after) {
        const acting = BattleManager.actor();
        const previousIndex = acting ? $gameParty.battleMembers().indexOf(acting) : 0;
        const movedIds = new Set();
        before.forEach((id, i) => {
            if (id !== after[i]) {
                if (id) movedIds.add(id);
                if (after[i]) movedIds.add(after[i]);
            }
        });
        const affected = [...movedIds].map(id => $gameActors.actor(id)).filter(a => a);
        if (acting && !affected.includes(acting)) affected.push(acting);
        for (const actor of affected) {
            actor.clearActions();
            actor.clearTpbChargeTime();
            actor._tpbCastTime = 0;
            actor._tpbIdleTime = 0;
            actor._tpbTurnEnd = false;
            actor.setActionState("undecided");
            actor.deselect();
        }
        BattleManager._actionBattlers = BattleManager._actionBattlers.filter(b => !affected.includes(b));
        BattleManager._currentActor = null;
        BattleManager._inputting = false;
        $gameParty.requestMotionRefresh();
        $gameTemp.requestBattleRefresh();
        this._statusWindow.refresh();
        if (!BattleManager.isTpb()) {
            const members = $gameParty.battleMembers();
            let index = acting ? members.indexOf(acting) : -1;
            if (index < 0) index = Math.min(previousIndex, members.length - 1);
            BattleManager._currentActor = members[Math.max(0, index)] || null;
            BattleManager._inputting = true;
            BattleManager.selectNextCommand();
        }
        this.changeInputWindow();
    };

    const _Scene_Battle_isAnyInputWindowActive = Scene_Battle.prototype.isAnyInputWindowActive;
    Scene_Battle.prototype.isAnyInputWindowActive = function() {
        return _Scene_Battle_isAnyInputWindowActive.call(this) ||
            !!this._battleFormationRoster?.active || !!this._battleFormationGrid?.active;
    };
    const _Scene_Battle_hideSubInputWindows = Scene_Battle.prototype.hideSubInputWindows;
    Scene_Battle.prototype.hideSubInputWindows = function() {
        _Scene_Battle_hideSubInputWindows.call(this);
        this.hideBattleFormationWindows();
    };
    const _Scene_Battle_isTimeActive = Scene_Battle.prototype.isTimeActive;
    Scene_Battle.prototype.isTimeActive = function() {
        return !this._battleFormationRoster?.active && !this._battleFormationGrid?.active &&
            _Scene_Battle_isTimeActive.call(this);
    };
})();
