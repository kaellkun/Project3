//=============================================================================
// RPG Maker MZ - Flexible Top-Down UI (Horizontal Command & Bottom Help)
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Responsive UI layout: Horizontal top-aligned commands & bottom-aligned help window for PC and Mobile.
 * @author Copilot
 *
 * @param MobileBreakpointWidth
 * @text Mobile Breakpoint Width
 * @type number
 * @default 640
 * @desc Screen width below which mobile portrait layout is enforced.
 *
 * @help FlexibleTopDownUI.js
 *
 * Layout Principles:
 * 1. Command Windows: Top-aligned and displayed horizontally (multi-column rows).
 * 2. Help Window: Bottom-aligned at the very bottom of the screen.
 * 3. PC (Landscape): Parallel multi-column content layout in the middle.
 * 4. Mobile (Portrait): Vertical stacked content in the middle with bottom-sheet modals.
 * 5. Status: Fixed basic-information panel on the left (no equipment list);
 *    active states, weakness/resistance or element power boosts on the right,
 *    selected by four commands at the top. Element tables use two entries per line.
 *    Confirm to browse details, Left/Right to change panels, Cancel to return
 *    to commands. Q/W or the page buttons change actors. Both panels support
 *    wheel/touch scrolling; the Back command exits the status screen.
 * 6. Equip: slots are listed in two columns; long names shrink to fit.
 * 7. Skill: an empty skill type shows "該当スキルなし" instead of a blank list.
 */

(() => {
    "use strict";

    const pluginName = "FlexibleTopDownUI";
    const parameters = PluginManager.parameters(pluginName);
    const mobileBreakpointWidth = Number(parameters.MobileBreakpointWidth || 640);

    const isPortraitLayout = () => {
        if (Utils.isMobileDevice()) {
            return Graphics.height > Graphics.width;
        }
        return Graphics.width <= mobileBreakpointWidth || Graphics.height > Graphics.width;
    };

    const margin = 0;
    const contentGap = 6;
    const compactFaceSize = 64;
    const commandTextExtraPadding = 20;

    const compactSkillStatusHeight = scene => {
        return Math.max(compactFaceSize + margin * 2, scene.calcWindowHeight(2, false));
    };

    // Helper to refresh window geometry cleanly
    const setWindowRect = (win, x, y, width, height) => {
        if (!win) return;
        const resized = win.width !== width || win.height !== height;
        win.move(x, y, width, height);
        // Window.move resizes the frame, not its contents bitmap.
        if (resized && win.contents) {
            win.createContents();
            win.refresh();
            // A window built at a smaller size (one-row command bar) may still
            // hold a scroll offset that the grown frame no longer needs.
            if (win.maxScrollY && win.scrollY() > win.maxScrollY()) win.scrollTo(win.scrollX(), win.maxScrollY());
            if (win.ensureCursorVisible && win.index() >= 0) win.ensureCursorVisible(false);
            if (win.refreshCursor) win.refreshCursor();
        }
    };

    //-----------------------------------------------------------------------------
    // Window Command Extensions (Horizontal Layout)
    //-----------------------------------------------------------------------------
    const _Window_Command_itemHeight = Window_Command.prototype.itemHeight;
    Window_Command.prototype.itemHeight = function() {
        return _Window_Command_itemHeight.call(this) + commandTextExtraPadding;
    };

    // MainFontLetterSpacing draws glyphs individually and cannot rely on
    // Canvas maxWidth compression. Fit long labels without losing padding.
    const installFittedDrawText = prototype => {
        const original = prototype.drawText;
        prototype.drawText = function(text, x, y, maxWidth, align) {
            const fontSize = this.contents.fontSize;
            const width = this.textWidth(text);
            if (maxWidth > 0 && width > maxWidth) {
                this.contents.fontSize = Math.max(1, Math.floor(fontSize * maxWidth / width));
            }
            try {
                original.call(this, text, x, y, maxWidth, align);
            } finally {
                this.contents.fontSize = fontSize;
            }
        };
    };
    installFittedDrawText(Window_Command.prototype);
    installFittedDrawText(Window_EquipSlot.prototype);

    Window_EquipSlot.prototype.maxCols = function() {
        return 2;
    };

    Window_EquipSlot.prototype.slotNameWidth = function() {
        const names = this._actor ? this._actor.equipSlots().map(id => $dataSystem.equipTypes[id]) : [];
        const widest = Math.max(0, ...names.map(name => this.textWidth(name || "")));
        return Math.min(widest + this.itemPadding(), Math.floor(this.itemWidth() * 0.4));
    };

    const _Window_EquipSlot_drawItem = Window_EquipSlot.prototype.drawItem;
    Window_EquipSlot.prototype.drawItem = function(index) {
        _Window_EquipSlot_drawItem.call(this, index);
        if (this._actor && !this.itemAt(index)) {
            const rect = this.itemLineRect(index);
            const slotNameWidth = this.slotNameWidth();
            this.changePaintOpacity(this.isEnabled(index));
            this.drawText("選択した装備を外す", rect.x + slotNameWidth, rect.y,
                rect.width - slotNameWidth, rect.height);
            this.changePaintOpacity(true);
        }
    };

    const _Window_SkillList_drawAllItems = Window_SkillList.prototype.drawAllItems;
    Window_SkillList.prototype.drawAllItems = function() {
        _Window_SkillList_drawAllItems.call(this);
        if (this._actor && this._data && this._data.length === 0) {
            const rect = this.itemLineRect(0);
            this.resetFontSettings();
            this.changePaintOpacity(false);
            this.drawText("該当スキルなし", rect.x, rect.y, this.innerWidth - rect.x * 2, "center");
            this.changePaintOpacity(true);
        }
    };

    // calcWindowHeight(..., true) deliberately measures Window_Selectable,
    // NOT Window_Command. Keep ordinary lists unchanged and size commands explicitly.
    Scene_Base.prototype.calcCommandWindowHeight = function(numLines) {
        return Window_Command.prototype.fittingHeight(numLines);
    };

    // These scenes use selectable sizing for command/category bars only
    // (shop gold intentionally matches its adjacent command bar).
    for (const type of [Scene_Title, Scene_Options, Scene_GameEnd, Scene_Item, Scene_Shop]) {
        const original = type.prototype.calcWindowHeight;
        type.prototype.calcWindowHeight = function(numLines, selectable) {
            return selectable ? this.calcCommandWindowHeight(numLines)
                : original.call(this, numLines, selectable);
        };
    }

    const _Scene_Equip_commandWindowRect = Scene_Equip.prototype.commandWindowRect;
    Scene_Equip.prototype.commandWindowRect = function() {
        const rect = _Scene_Equip_commandWindowRect.call(this);
        rect.height = this.calcCommandWindowHeight(1);
        return rect;
    };

    const _Scene_MenuBase_buttonAreaHeight = Scene_MenuBase.prototype.buttonAreaHeight;
    Scene_MenuBase.prototype.buttonAreaHeight = function() {
        return PluginManager._scripts?.includes("HideTouchBackMenuButtons")
            ? 0 : _Scene_MenuBase_buttonAreaHeight.call(this);
    };

    const _Window_Gold_baseTextRect = Window_Gold.prototype.baseTextRect;
    Window_Gold.prototype.baseTextRect = function() {
        const rect = _Window_Gold_baseTextRect.call(this);
        rect.y += Math.max(0, (rect.height - this.lineHeight()) / 2);
        rect.height = this.lineHeight();
        return rect;
    };

    Window_MenuCommand.prototype.maxCols = function() {
        const columns = Math.max(1, Math.min(6, Math.floor(Graphics.boxWidth / 140)));
        return Math.min(columns, this._list ? Math.max(1, this._list.length) : 4);
    };

    Window_ShopCommand.prototype.maxCols = function() {
        return 3;
    };

    Window_PartyCommand.prototype.maxCols = function() {
        return Math.min(4, this._list ? Math.max(1, this._list.length) : 4);
    };

    Window_ActorCommand.prototype.maxCols = function() {
        return Math.min(4, this._list ? Math.max(1, this._list.length) : 4);
    };

    Window_SkillType.prototype.maxCols = function() {
        return Math.min(6, this._list ? Math.max(1, this._list.length) : 3);
    };

    Window_SkillType.prototype.itemTextAlign = function() {
        return "center";
    };

    Window_SkillStatus.prototype.refresh = function() {
        Window_StatusBase.prototype.refresh.call(this);
        if (this._actor) {
            const faceSize = Math.min(compactFaceSize, Math.max(1, this.innerHeight - margin * 2));
            const faceY = Math.floor((this.innerHeight - faceSize) / 2);
            const textX = faceSize + this.itemPadding() + contentGap * 2;
            const textWidth = Math.max(1, this.innerWidth - textX - this.itemPadding());
            const textY = Math.floor((this.innerHeight - this.lineHeight() * 2) / 2);
            this.drawActorFace(this._actor, this.itemPadding(), faceY, faceSize, faceSize);
            this.drawActorName(this._actor, textX, textY, textWidth);
            this.drawActorClass(this._actor, textX, textY + this.lineHeight(), textWidth);
        }
    };

    const _Window_MenuActor_itemHeight = Window_MenuActor.prototype.itemHeight;
    Window_MenuActor.prototype.itemHeight = function() {
        if (this._flexSkillTargetModal) {
            return compactFaceSize + contentGap * 2;
        }
        return _Window_MenuActor_itemHeight.call(this);
    };

    const _Window_MenuActor_drawItem = Window_MenuActor.prototype.drawItem;
    Window_MenuActor.prototype.drawItem = function(index) {
        if (!this._flexSkillTargetModal) {
            _Window_MenuActor_drawItem.call(this, index);
            return;
        }
        this.drawPendingItemBackground(index);
        const actor = this.actor(index);
        const rect = this.itemRect(index);
        const faceSize = Math.min(compactFaceSize, Math.max(1, rect.height - contentGap * 2));
        const faceY = rect.y + Math.floor((rect.height - faceSize) / 2);
        const textX = rect.x + faceSize + this.itemPadding() + contentGap * 2;
        const textWidth = Math.max(1, rect.width - (textX - rect.x) - this.itemPadding());
        const textY = rect.y + Math.floor((rect.height - this.lineHeight() * 2) / 2);
        this.changePaintOpacity(actor.isBattleMember());
        this.drawActorFace(actor, rect.x + this.itemPadding(), faceY, faceSize, faceSize);
        this.changePaintOpacity(true);
        this.drawActorName(actor, textX, textY, textWidth);
        this.drawActorClass(actor, textX, textY + this.lineHeight(), textWidth);
    };

    const positionSkillActorModal = scene => {
        const win = scene._actorWindow;
        if (!win) return;
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        const rows = Math.max(1, Math.min($gameParty.size(), 4));
        const wh = Math.min(win.itemHeight() * rows + win.padding * 2, boxH - margin * 6);
        const ww = Math.min(boxW - margin * 4, Math.max(360, Math.floor(boxW * 0.58)));
        const wx = Math.floor((boxW - ww) / 2);
        const wy = Math.floor((boxH - wh) / 2);
        setWindowRect(win, wx, wy, ww, wh);
        win.createContents();
        win.refresh();
    };

    //-----------------------------------------------------------------------------
    // Scene_MenuBase - Bottom-aligned Help Window
    //-----------------------------------------------------------------------------
    const _Scene_MenuBase_helpWindowRect = Scene_MenuBase.prototype.helpWindowRect;
    Scene_MenuBase.prototype.helpWindowRect = function() {
        const rect = _Scene_MenuBase_helpWindowRect.call(this);
        rect.x = margin;
        rect.y = Graphics.boxHeight - rect.height - margin;
        rect.width = Graphics.boxWidth - margin * 2;
        return rect;
    };

    //-----------------------------------------------------------------------------
    // Scene_Menu
    //-----------------------------------------------------------------------------
    Scene_Menu.prototype.commandWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.calcCommandWindowHeight(this._commandWindow?.maxRows() || 1);
        const wx = 0;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Menu.prototype.statusWindowRect = function() {
        const cmdH = this.commandWindowRect().height;
        const goldH = this.calcWindowHeight(1, true);
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        return new Rectangle(0, cmdH, boxW, Math.max(1, boxH - cmdH - goldH));
    };

    const _Scene_Menu_create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _Scene_Menu_create.call(this);
        this.relayoutMenuWindows();
    };

    Scene_Menu.prototype.relayoutMenuWindows = function() {
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;

        const cmdH = this.commandWindowRect().height;

        setWindowRect(this._commandWindow, 0, 0, boxW, cmdH);

        const goldH = this.calcWindowHeight(1, true);
        setWindowRect(this._goldWindow, 0, boxH - goldH, boxW, goldH);
        setWindowRect(this._statusWindow, 0, cmdH, boxW, Math.max(1, boxH - cmdH - goldH));
    };

    //-----------------------------------------------------------------------------
    // Scene_Status - Basic information + switchable details
    //-----------------------------------------------------------------------------
    class Window_StatusDetailCommand extends Window_HorzCommand {
        maxCols() { return 4; }
        isTouchOkEnabled() { return true; }
        makeCommandList() {
            this.addCommand("ステート状況", "states");
            this.addCommand("弱点･耐性", "resistance");
            this.addCommand("威力増加", "power");
            this.addCommand("戻る", "back");
        }
        callUpdateHelp() {
            // This command drives a detail panel, not a Window_Help instance.
            if (this.active) this.updateHelp();
        }
        updateHelp() {
            if (this._detailWindow && this.currentSymbol() !== "back") {
                this._detailWindow.setMode(this.currentSymbol());
            }
        }
    }

    class Window_StatusDetailList extends Window_Selectable {
        initialize(rect) {
            this._rows = [];
            this._lines = [];
            this._mode = "states";
            super.initialize(rect);
        }
        maxItems() { return this._lines.length; }
        itemHeight() { return this._mode === "states" ? 76 : 40; }
        // Element tables show two entries per line; headings always span the line.
        columns() { return this._mode === "resistance" || this._mode === "power" ? 2 : 1; }
        isScrollEnabled() { return true; }
        drawItemBackground() {} // Read-only information, not a grid of buttons.
        setActor(actor) {
            this._actor = actor;
            this.rebuild();
        }
        setMode(mode) {
            if (mode && this._mode !== mode) {
                this._mode = mode;
                this.rebuild();
            }
        }
        rebuild() {
            this._rows = this._actor ? this.makeRows() : [];
            this._lines = [];
            const columns = this.columns();
            for (const row of this._rows) {
                const last = this._lines[this._lines.length - 1];
                if (!row.heading && last && !last[0].heading && last.length < columns) last.push(row);
                else this._lines.push([row]);
            }
            this.scrollTo(0, 0);
            this.select(this.active && this.maxItems() ? 0 : -1);
            this.refresh();
        }
        makeRows() {
            if (this._mode === "basic") return this.basicRows();
            if (this._mode === "states") return this.stateRows();
            if (this._mode === "power") return this.powerRows();
            return this.resistanceRows();
        }

        stateDisplayPriority(state) {
            const match = String(state?.note || "").match(/<StatusState\s*:\s*(-?\d+(?:\.\d+)?)\s*>/i);
            return match ? Number(match[1]) : null;
        }
        basicRows() {
            const actor = this._actor;
            const visibleParamIds = globalThis.StatusVisibleParamIds || [2, 3, 4, 5, 6, 7];
            const rows = [
                { label: actor.name(), heading: true },
                { label: actor.currentClass().name, value: `${TextManager.levelA} ${actor.level}` },
                { label: TextManager.hpA, value: `${actor.hp} / ${actor.mhp}` },
                { label: TextManager.mpA, value: `${actor.mp} / ${actor.mmp}` }
            ];
            if ($dataSystem.optDisplayTp) rows.push({ label: TextManager.tpA, value: String(actor.tp) });
            for (const id of visibleParamIds) {
                rows.push({ label: TextManager.param(id), value: String(actor.param(id)) });
            }
            rows.push({ label: "経験値", heading: true },
                { label: "現在", value: String(actor.currentExp()) },
                { label: "次のレベルまで", value: actor.isMaxLevel() ? "――" : String(actor.nextRequiredExp()) });
            const profile = [actor.nickname(), actor.profile()].filter(Boolean).join("\n");
            if (profile) {
                rows.push({ label: "プロフィール", heading: true });
                this.contents.fontSize = this.detailFontSize();
                for (const paragraph of profile.split("\n")) {
                    let line = "";
                    for (const char of paragraph) {
                        if (line && this.textWidth(line + char) > this.innerWidth - this.itemPadding() * 2) {
                            rows.push({ label: line });
                            line = "";
                        }
                        line += char;
                    }
                    rows.push({ label: line });
                }
            }
            return rows;
        }
        resistanceRows() {
            const actor = this._actor;
            const rows = [{ label: "属性の弱点・耐性", value: "被ダメ 100%が通常", heading: true }];
            $dataSystem.elements.forEach((name, id) => {
                if (!id || !name) return;
                const rate = actor.elementRate(id);
                const type = rate < 0 ? "吸収" : rate === 0 ? "無効" : rate < 1 ? "耐性" : rate > 1 ? "弱点" : "通常";
                rows.push({ label: name, value: `${type} ${this.percent(rate)}`, tone: rate > 1 ? 2 : rate < 1 ? 3 : null });
            });
            rows.push({ label: "状態異常の耐性", value: "付与率 100%が通常", heading: true });
            const displayStates = $dataStates.filter(state => state && state.name &&
                this.stateDisplayPriority(state) !== null)
                .sort((a, b) => this.stateDisplayPriority(a) - this.stateDisplayPriority(b) || a.id - b.id);
            for (const state of displayStates) {
                const rate = actor.isStateResist(state.id) ? 0 : actor.stateRate(state.id);
                const type = rate === 0 ? "無効" : rate < 1 ? "耐性" : rate > 1 ? "弱点" : "通常";
                rows.push({ label: state.name, icon: state.iconIndex, value: `${type} ${this.percent(rate)}`,
                    tone: rate > 1 ? 2 : rate < 1 ? 3 : null });
            }
            return rows;
        }
        // Keke_ElementFullCustom "属性威力" tags: "*n" multiplies, "+*n" adds n×damage,
        // "+n" adds a flat amount; targets are element names, "全", or "!name".
        elementPowerRates() {
            const actor = this._actor;
            const passives = typeof actor.passiveSkillObject === "function" ? actor.passiveSkillObject() : [];
            const objects = [actor.actor(), actor.currentClass(), ...actor.equips(), ...actor.states(), ...passives];
            const tags = objects.filter(Boolean).flatMap(object =>
                [...String(object.note || "").matchAll(/<(?:属性威力|elementAtk)\s*:([^>]*)>/gi)]
                    .map(match => match[1].replace(/\s/g, "")));
            const rates = $dataSystem.elements.map(() => ({ times: 1, add: 0, flat: 0 }));
            for (const tag of tags) {
                const [calc, ...targets] = tag.split(",");
                const parsed = calc.match(/^([+\-*/]*)(\d*\.?\d*)/);
                if (!parsed || !targets.length) continue;
                const symbol = parsed[1] || "+";
                const num = Number(parsed[2]) || 0;
                const anti = targets[0].includes("!");
                const names = targets.map(name => name.replace(/!/g, ""));
                const all = names.some(name => /全|all/i.test(name));
                rates.forEach((rate, id) => {
                    if (!id || !$dataSystem.elements[id]) return;
                    const listed = names.includes($dataSystem.elements[id]);
                    if (!(all || (anti ? !listed : listed))) return;
                    const sign = symbol.includes("-") ? -1 : 1;
                    if (/[*/]/.test(symbol) && /[+\-]/.test(symbol)) rate.add += sign * (symbol.includes("/") ? 1 / num : num);
                    else if (symbol.includes("/")) rate.times *= 1 / num;
                    else if (symbol.includes("*")) rate.times *= num;
                    else rate.flat += sign * num;
                });
            }
            return rates.map(rate => ({ rate: (1 + rate.add) * rate.times, flat: rate.flat * rate.times }));
        }
        powerRows() {
            const actor = this._actor;
            const rows = [{ label: "属性の威力増加", value: "与ダメ 100%が通常", heading: true }];
            const power = this.elementPowerRates();
            $dataSystem.elements.forEach((name, id) => {
                if (!id || !name) return;
                const { rate, flat } = power[id];
                const type = rate > 1 ? "増加" : rate < 1 ? "減少" : "通常";
                const extra = flat ? ` ${flat > 0 ? "+" : ""}${Math.round(flat)}` : "";
                rows.push({ label: name, value: `${type} ${this.percent(rate)}${extra}`,
                    tone: rate > 1 || flat > 0 ? 3 : rate < 1 || flat < 0 ? 2 : null });
            });
            const attack = [...new Set(actor.attackElements())].sort((a, b) => a - b)
                .map(id => $dataSystem.elements[id]).filter(Boolean);
            rows.push({ label: "通常攻撃の属性", value: attack.join("・") || "なし", heading: true });
            return rows;
        }
        percent(rate) { return `${Math.round(rate * 1000) / 10}%`; }
        stateRows() {
            const actor = this._actor;
            const visibleParamIds = globalThis.StatusVisibleParamIds || [2, 3, 4, 5, 6, 7];
            const rows = [{ label: "現在のステート", value: "付与中の効果・残り期間", heading: true }];
            for (const state of actor.states()) {
                const turns = actor._stateTurns[state.id];
                let duration = "自動解除なし";
                if (state.autoRemovalTiming && Number.isFinite(turns)) {
                    const timing = state.autoRemovalTiming === 1 ? "行動終了時" : "ターン終了時";
                    duration = `残り ${Math.max(0, Math.ceil(turns))} ターン／${timing}`;
                } else if (state.removeAtBattleEnd) {
                    duration = "戦闘終了時に解除";
                }
                rows.push({ label: state.name, icon: state.iconIndex, value: duration });
                if (state.removeByWalking) rows.push({ label: "歩行で解除", value: `残り ${actor._stateSteps[state.id] ?? state.stepsToRemove} 歩` });
            }
            if (rows.length === 1) rows.push({ label: "ステートなし", value: "現在、付与されているステートはありません。" });
            rows.push({ label: "能力強化・弱体", value: "現在の段階と残り期間", heading: true });
            let count = 0;
            for (const id of [0, 1, ...visibleParamIds]) {
                const level = actor._buffs[id];
                if (!level) continue;
                count++;
                rows.push({ label: `${TextManager.param(id)} ${level > 0 ? "強化" : "弱体"} ${Math.abs(level)}段階`,
                    icon: actor.buffIconIndex(level, id),
                    value: `${this.percent(actor.paramBuffRate(id))}／残り ${Math.max(0, Math.ceil(actor._buffTurns[id] || 0))} ターン`,
                    tone: level > 0 ? 3 : 2 });
            }
            if (!count) rows.push({ label: "強化・弱体なし", value: "能力値への一時的な補正はありません。" });
            return rows;
        }
        detailFontSize() { return Math.min($gameSystem.mainFontSize(), this.innerWidth < 280 ? 20 : 24); }
        drawFittedText(text, x, y, width, align = "left") {
            const size = this.contents.fontSize;
            const measured = this.textWidth(String(text));
            if (measured > width && width > 0) this.contents.fontSize = Math.max(1, Math.floor(size * width / measured));
            this.drawText(String(text), x, y, width, align);
            this.contents.fontSize = size;
        }
        drawItem(index) {
            const line = this._lines[index];
            const rect = this.itemRectWithPadding(index);
            const gap = line.length > 1 ? contentGap * 2 : 0;
            const cellWidth = Math.floor((rect.width - gap * (line.length - 1)) / line.length);
            line.forEach((row, i) => this.drawCell(row, rect.x + (cellWidth + gap) * i, rect.y, cellWidth, line.length));
        }
        drawCell(row, x, y, width, cells) {
            this.resetFontSettings();
            this.contents.fontSize = cells > 1 ? Math.min(this.detailFontSize(), 20) : this.detailFontSize();
            this.changeTextColor(row.heading ? ColorManager.systemColor() : ColorManager.normalColor());
            const left = x;
            if (row.icon) {
                this.drawIcon(row.icon, x, y + 2);
                x += ImageManager.iconWidth + 6;
                width -= ImageManager.iconWidth + 6;
            }
            const valueColor = row.tone != null ? ColorManager.textColor(row.tone) : ColorManager.normalColor();
            if (row.value === undefined) {
                this.drawFittedText(row.label, x, y, width);
            } else if (this._mode === "states") {
                this.drawFittedText(row.label, x, y, width);
                this.changeTextColor(valueColor);
                this.drawFittedText(row.value, left, y + this.lineHeight(), width + x - left);
            } else {
                const labelWidth = Math.min(this.textWidth(row.label), Math.floor(width * 0.55));
                this.drawFittedText(row.label, x, y, labelWidth);
                this.changeTextColor(valueColor);
                this.drawFittedText(row.value, x + labelWidth + contentGap, y, width - labelWidth - contentGap, "right");
            }
        }
        cursorLeft() {
            this.updateInputData(); // Do not pass the same key to the next panel this frame.
            this.callHandler("otherPanel");
        }
        cursorRight() { this.cursorLeft(); }
    }

    Scene_Status.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const commandHeight = this.calcCommandWindowHeight(1);
        // Reserve the engine's actor page buttons when touch UI is enabled.
        const top = this.buttonAreaHeight();
        const width = Graphics.boxWidth;
        const leftWidth = Math.floor(width * 0.46);
        const y = top + commandHeight;
        const height = Math.max(1, Graphics.boxHeight - y);
        this._statusWindow = new Window_StatusDetailList(new Rectangle(0, y, leftWidth, height));
        this._statusWindow.setMode("basic");
        this._statusDetailWindow = new Window_StatusDetailList(new Rectangle(leftWidth, y, width - leftWidth, height));
        this._statusCommandWindow = new Window_StatusDetailCommand(new Rectangle(0, top, width, commandHeight));
        const command = this._statusCommandWindow;
        command._detailWindow = this._statusDetailWindow;
        command.setHandler("resistance", () => this.openStatusDetail("resistance"));
        command.setHandler("power", () => this.openStatusDetail("power"));
        command.setHandler("states", () => this.openStatusDetail("states"));
        command.setHandler("back", this.popScene.bind(this));
        command.setHandler("cancel", this.popScene.bind(this));
        for (const win of [this._statusWindow, this._statusDetailWindow, command]) {
            win.setHandler("pageup", this.previousActor.bind(this));
            win.setHandler("pagedown", this.nextActor.bind(this));
            if (win !== command) {
                win.setHandler("cancel", () => this.focusStatusPanel(command));
                win.setHandler("otherPanel", () => this.focusStatusPanel(
                    win === this._statusWindow ? this._statusDetailWindow : this._statusWindow));
            }
            this.addWindow(win);
        }
        this.focusStatusPanel(command);
    };

    Scene_Status.prototype.focusStatusPanel = function(target) {
        for (const win of [this._statusWindow, this._statusDetailWindow, this._statusCommandWindow]) {
            win.deactivate();
            if (win !== this._statusCommandWindow && win !== target) win.deselect();
        }
        target.activate();
        if (target.index() < 0 && target.maxItems()) target.select(target.topIndex());
        this._statusFocusedWindow = target;
    };
    Scene_Status.prototype.openStatusDetail = function(mode) {
        this._statusDetailWindow.setMode(mode);
        this.focusStatusPanel(this._statusDetailWindow);
    };
    Scene_Status.prototype.refreshActor = function() {
        this._statusWindow.setActor(this.actor());
        this._statusDetailWindow.setActor(this.actor());
    };
    Scene_Status.prototype.onActorChange = function() {
        Scene_MenuBase.prototype.onActorChange.call(this);
        this.refreshActor();
        this.focusStatusPanel(this._statusFocusedWindow || this._statusCommandWindow);
    };
    const _Scene_Status_update = Scene_Status.prototype.update;
    Scene_Status.prototype.update = function() {
        // Touching either panel or the command bar changes focus immediately,
        // including while browsing details. Page buttons remain engine-managed.
        if (this.isActive() && TouchInput.isTriggered()) {
            const target = [this._statusCommandWindow, this._statusWindow, this._statusDetailWindow]
                .find(win => win && win.isTouchedInsideFrame());
            if (target) this.focusStatusPanel(target);
        }
        _Scene_Status_update.call(this);
    };

    //-----------------------------------------------------------------------------
    // Scene_Item & Scene_Skill
    //-----------------------------------------------------------------------------
    Scene_Item.prototype.categoryWindowRect = function() {
        return new Rectangle(0, 0, Graphics.boxWidth, this.calcCommandWindowHeight(1));
    };

    const _Scene_Item_create = Scene_Item.prototype.create;
    Scene_Item.prototype.create = function() {
        _Scene_Item_create.call(this);
        this.relayoutItemWindows();
    };

    Scene_Item.prototype.relayoutItemWindows = function() {
        const portrait = isPortraitLayout();
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;

        const helpH = this._helpWindow ? this._helpWindow.height : 72;
        const catH = this._categoryWindow?.needsSelection() === false
            ? 0 : this.categoryWindowRect().height;

        // Command (Category) Top-aligned
        setWindowRect(this._categoryWindow, margin, margin, boxW - margin * 2, this.categoryWindowRect().height);
        // Help Window Bottom-aligned
        setWindowRect(this._helpWindow, margin, boxH - helpH - margin, boxW - margin * 2, helpH);

        const topY = catH + margin * 2;
        const availableH = boxH - topY - helpH - margin * 2;

        if (portrait) {
            setWindowRect(this._itemWindow, margin, topY, boxW - margin * 2, availableH);
            const sheetH = Math.floor(boxH * 0.45);
            setWindowRect(this._actorWindow, margin, boxH - helpH - sheetH - margin * 2, boxW - margin * 2, sheetH);
        } else {
            const leftW = Math.floor((boxW - margin * 3) * 0.55);
            const rightW = boxW - leftW - margin * 3;
            // Target selection is an overlay; don't reserve an empty column while hidden.
            setWindowRect(this._itemWindow, margin, topY, boxW - margin * 2, availableH);
            setWindowRect(this._actorWindow, leftW + margin * 2, topY, rightW, availableH);
        }
    };

    const _Scene_Skill_create = Scene_Skill.prototype.create;
    Scene_Skill.prototype.create = function() {
        _Scene_Skill_create.call(this);
        if (this._actorWindow) {
            this._actorWindow._flexSkillTargetModal = true;
        }
        this.relayoutSkillWindows();
    };

    Scene_Skill.prototype.skillTypeWindowRect = function() {
        const wx = margin;
        const wy = margin;
        const ww = Graphics.boxWidth - margin * 2;
        const wh = this.calcCommandWindowHeight(1);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Skill.prototype.statusWindowRect = function() {
        const wx = margin;
        const wy = this._skillTypeWindow.y + this._skillTypeWindow.height + margin;
        const ww = Graphics.boxWidth - margin * 2;
        const wh = compactSkillStatusHeight(this);
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Skill.prototype.itemWindowRect = function() {
        const helpH = this._helpWindow ? this._helpWindow.height : 72;
        const wx = margin;
        const wy = this._statusWindow.y + this._statusWindow.height + margin;
        const ww = Graphics.boxWidth - margin * 2;
        const wh = Graphics.boxHeight - wy - helpH - margin * 2;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Skill.prototype.relayoutSkillWindows = function() {
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;

        const helpH = this._helpWindow ? this._helpWindow.height : 72;
        const skillTypeH = this.calcCommandWindowHeight(1);
        const statusH = compactSkillStatusHeight(this);

        setWindowRect(this._skillTypeWindow, margin, margin, boxW - margin * 2, skillTypeH);
        setWindowRect(this._helpWindow, margin, boxH - helpH - margin, boxW - margin * 2, helpH);

        const statusY = skillTypeH + margin * 2;
        const itemY = statusY + statusH + margin;
        const itemH = Math.max(1, boxH - itemY - helpH - margin * 2);
        setWindowRect(this._statusWindow, margin, statusY, boxW - margin * 2, statusH);
        setWindowRect(this._itemWindow, margin, itemY, boxW - margin * 2, itemH);
        positionSkillActorModal(this);
    };

    Scene_Skill.prototype.showActorWindow = function() {
        positionSkillActorModal(this);
        this._actorWindow.show();
        this._actorWindow.activate();
    };

    //-----------------------------------------------------------------------------
    // Scene_Shop
    //-----------------------------------------------------------------------------
    Scene_Shop.prototype.commandWindowRect = function() {
        return new Rectangle(0, 0, Math.floor(Graphics.boxWidth * 0.6), this.calcCommandWindowHeight(1));
    };

    Scene_Shop.prototype.goldWindowRect = function() {
        const rect = this.commandWindowRect();
        return new Rectangle(rect.width, 0, Graphics.boxWidth - rect.width, rect.height);
    };

    Scene_Shop.prototype.categoryWindowRect = function() {
        return new Rectangle(0, this.commandWindowRect().height, Graphics.boxWidth,
            this.calcCommandWindowHeight(1));
    };

    const _Scene_Shop_create = Scene_Shop.prototype.create;
    Scene_Shop.prototype.create = function() {
        _Scene_Shop_create.call(this);
        this.relayoutShopWindows();
    };

    Scene_Shop.prototype.relayoutShopWindows = function() {
        const portrait = isPortraitLayout();
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;

        const helpH = this._helpWindow ? this._helpWindow.height : 72;
        const cmdW = Math.floor(boxW * 0.6);
        const cmdH = this.calcCommandWindowHeight(1);

        setWindowRect(this._commandWindow, margin, margin, cmdW, cmdH);
        setWindowRect(this._goldWindow, margin + cmdW + margin, margin, boxW - cmdW - margin * 3, cmdH);
        setWindowRect(this._helpWindow, margin, boxH - helpH - margin, boxW - margin * 2, helpH);

        const topY = cmdH + margin * 2;
        const contentH = boxH - topY - helpH - margin * 2;
        const categoryH = this._categoryWindow?.needsSelection() === false
            ? 0 : this.categoryWindowRect().height;
        setWindowRect(this._dummyWindow, 0, topY, boxW, contentH);
        setWindowRect(this._categoryWindow, 0, topY, boxW, this.categoryWindowRect().height);

        if (portrait) {
            setWindowRect(this._buyWindow, margin, topY, boxW - margin * 2, contentH);
            setWindowRect(this._sellWindow, margin, topY + categoryH, boxW - margin * 2, contentH - categoryH);
            const sheetH = Math.floor(boxH * 0.35);
            setWindowRect(this._statusWindow, margin, boxH - helpH - sheetH - margin * 2, boxW - margin * 2, sheetH);
            setWindowRect(this._numberWindow, margin, boxH - helpH - sheetH - margin * 2, boxW - margin * 2, sheetH);
        } else {
            const colW = Math.floor((boxW - margin * 4) / 3);
            setWindowRect(this._buyWindow, margin, topY, colW, contentH);
            setWindowRect(this._sellWindow, margin, topY + categoryH, colW, contentH - categoryH);
            setWindowRect(this._statusWindow, margin + colW + margin, topY, colW, contentH);
            setWindowRect(this._numberWindow, margin + (colW + margin) * 2, topY, colW, contentH);
        }
    };

    //-----------------------------------------------------------------------------
    // Scene_Battle (Top-aligned Commands at y=0, Static Bottom Status Window)
    //-----------------------------------------------------------------------------
    // Disable dynamic horizontal sliding of status window in battle
    Scene_Battle.prototype.updateStatusWindowPosition = function() {
        // Keep status window statically aligned at the bottom
    };

    Scene_Battle.prototype.battleCommandHeight = function() {
        return this.calcCommandWindowHeight(1);
    };

    Scene_Battle.prototype.partyCommandWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.battleCommandHeight();
        const wx = 0;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.actorCommandWindowRect = function() {
        return this.partyCommandWindowRect();
    };

    Scene_Battle.prototype.logWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(10, false);
        const wx = 0;
        const wy = this.battleCommandHeight();
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.statusWindowRect = function() {
        const portrait = isPortraitLayout();
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        const statusH = portrait ? 160 : 140;
        const wx = 0;
        const wy = boxH - statusH;
        const ww = boxW;
        const wh = statusH;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.helpWindowRect = function() {
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        const helpH = this.helpAreaHeight();
        const statusH = isPortraitLayout() ? 160 : 140;
        const wx = 0;
        const wy = boxH - statusH - helpH;
        const ww = boxW;
        const wh = helpH;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.skillWindowRect = function() {
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        const cmdH = this.battleCommandHeight();
        const statusH = isPortraitLayout() ? 160 : 140;
        const topY = cmdH;
        const availableH = boxH - topY - statusH - this.helpAreaHeight();
        return new Rectangle(0, topY, boxW, Math.max(1, availableH));
    };

    Scene_Battle.prototype.itemWindowRect = function() {
        return this.skillWindowRect();
    };

    Scene_Battle.prototype.actorWindowRect = function() {
        return this.statusWindowRect();
    };

    Scene_Battle.prototype.enemyWindowRect = function() {
        return this.skillWindowRect();
    };

    const _Scene_Battle_create = Scene_Battle.prototype.create;
    Scene_Battle.prototype.create = function() {
        _Scene_Battle_create.call(this);
        this.relayoutBattleWindows();
    };

    Scene_Battle.prototype.relayoutBattleWindows = function() {
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        const cmdH = this.battleCommandHeight();
        const statusH = isPortraitLayout() ? 160 : 140;

        // Screen Top-aligned Commands (y = 0)
        setWindowRect(this._partyCommandWindow, 0, 0, boxW, cmdH);
        setWindowRect(this._actorCommandWindow, 0, 0, boxW, cmdH);

        // Battle log sits directly below the active command row.
        setWindowRect(this._logWindow, 0, cmdH, boxW, this.calcWindowHeight(10, false));

        // Screen Bottom-aligned Status (Fixed Operation Area at the Bottom)
        setWindowRect(this._statusWindow, 0, boxH - statusH, boxW, statusH);

        // Help Window positioned just above status window if needed
        const helpH = this.helpAreaHeight();
        setWindowRect(this._helpWindow, 0, boxH - statusH - helpH, boxW, helpH);
    };

})();
