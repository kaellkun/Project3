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

    const margin = 6;

    // Helper to refresh window geometry cleanly
    const setWindowRect = (win, x, y, width, height) => {
        if (!win) return;
        win.move(x, y, width, height);
    };

    //-----------------------------------------------------------------------------
    // Window Command Extensions (Horizontal Layout)
    //-----------------------------------------------------------------------------
    Window_MenuCommand.prototype.maxCols = function() {
        return Math.min(6, this._list ? Math.max(1, this._list.length) : 4);
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
        const wh = this.calcWindowHeight(1, true);
        const wx = 0;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Menu.prototype.statusWindowRect = function() {
        const portrait = isPortraitLayout();
        const cmdH = this.calcWindowHeight(1, true);
        const goldH = this.calcWindowHeight(1, true);
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;

        if (portrait) {
            const wx = margin;
            const wy = cmdH + margin;
            const ww = boxW - margin * 2;
            const wh = Math.max(120, boxH - cmdH - goldH - margin * 3);
            return new Rectangle(wx, wy, ww, wh);
        } else {
            const cmdW = 220;
            const wx = cmdW + margin * 2;
            const wy = cmdH + margin;
            const ww = boxW - cmdW - margin * 3;
            const wh = boxH - wy - margin;
            return new Rectangle(wx, wy, ww, wh);
        }
    };

    const _Scene_Menu_create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _Scene_Menu_create.call(this);
        this.relayoutMenuWindows();
    };

    Scene_Menu.prototype.relayoutMenuWindows = function() {
        const portrait = isPortraitLayout();
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;

        const cmdH = this._commandWindow ? this._commandWindow.height : 52;

        setWindowRect(this._commandWindow, 0, 0, boxW, cmdH);

        if (portrait) {
            const goldH = this._goldWindow ? this._goldWindow.height : 50;
            setWindowRect(this._goldWindow, margin, boxH - goldH - margin, boxW - margin * 2, goldH);
            setWindowRect(this._statusWindow, margin, cmdH + margin, boxW - margin * 2, Math.max(120, boxH - cmdH - goldH - margin * 3));
        } else {
            const goldH = this._goldWindow ? this._goldWindow.height : 50;
            setWindowRect(this._goldWindow, margin, cmdH + margin, 220, goldH);
            setWindowRect(this._statusWindow, 220 + margin * 2, cmdH + margin, boxW - 220 - margin * 3, boxH - (cmdH + margin) - margin);
        }
    };

    //-----------------------------------------------------------------------------
    // Scene_Item & Scene_Skill
    //-----------------------------------------------------------------------------
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
        const catH = this._categoryWindow ? this._categoryWindow.height : 52;

        // Command (Category) Top-aligned
        setWindowRect(this._categoryWindow, margin, margin, boxW - margin * 2, catH);
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
            setWindowRect(this._itemWindow, margin, topY, leftW, availableH);
            setWindowRect(this._actorWindow, leftW + margin * 2, topY, rightW, availableH);
        }
    };

    const _Scene_Skill_create = Scene_Skill.prototype.create;
    Scene_Skill.prototype.create = function() {
        _Scene_Skill_create.call(this);
        this.relayoutSkillWindows();
    };

    Scene_Skill.prototype.relayoutSkillWindows = function() {
        const portrait = isPortraitLayout();
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;

        const helpH = this._helpWindow ? this._helpWindow.height : 72;
        const skillTypeH = this._skillTypeWindow ? this._skillTypeWindow.height : 52;

        setWindowRect(this._skillTypeWindow, margin, margin, boxW - margin * 2, skillTypeH);
        setWindowRect(this._helpWindow, margin, boxH - helpH - margin, boxW - margin * 2, helpH);

        const topY = skillTypeH + margin * 2;
        const availableH = boxH - topY - helpH - margin * 2;

        if (portrait) {
            setWindowRect(this._itemWindow, margin, topY, boxW - margin * 2, availableH);
            const sheetH = Math.floor(boxH * 0.45);
            setWindowRect(this._actorWindow, margin, boxH - helpH - sheetH - margin * 2, boxW - margin * 2, sheetH);
        } else {
            const leftW = Math.floor((boxW - margin * 3) * 0.55);
            const rightW = boxW - leftW - margin * 3;
            setWindowRect(this._itemWindow, margin, topY, leftW, availableH);
            setWindowRect(this._actorWindow, leftW + margin * 2, topY, rightW, availableH);
        }
    };

    //-----------------------------------------------------------------------------
    // Scene_Shop
    //-----------------------------------------------------------------------------
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

        setWindowRect(this._commandWindow, margin, margin, cmdW, 52);
        setWindowRect(this._goldWindow, margin + cmdW + margin, margin, boxW - cmdW - margin * 3, 52);
        setWindowRect(this._helpWindow, margin, boxH - helpH - margin, boxW - margin * 2, helpH);

        const cmdH = this._commandWindow ? this._commandWindow.height : 52;
        const topY = cmdH + margin * 2;
        const contentH = boxH - topY - helpH - margin * 2;

        if (portrait) {
            setWindowRect(this._buyWindow, margin, topY, boxW - margin * 2, contentH);
            setWindowRect(this._sellWindow, margin, topY, boxW - margin * 2, contentH);
            const sheetH = Math.floor(boxH * 0.35);
            setWindowRect(this._statusWindow, margin, boxH - helpH - sheetH - margin * 2, boxW - margin * 2, sheetH);
            setWindowRect(this._numberWindow, margin, boxH - helpH - sheetH - margin * 2, boxW - margin * 2, sheetH);
        } else {
            const colW = Math.floor((boxW - margin * 4) / 3);
            setWindowRect(this._buyWindow, margin, topY, colW, contentH);
            setWindowRect(this._sellWindow, margin, topY, colW, contentH);
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

    Scene_Battle.prototype.partyCommandWindowRect = function() {
        const ww = Graphics.boxWidth;
        const wh = this.calcWindowHeight(1, true);
        const wx = 0;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.actorCommandWindowRect = function() {
        return this.partyCommandWindowRect();
    };

    Scene_Battle.prototype.statusWindowRect = function() {
        const portrait = isPortraitLayout();
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        const statusH = portrait ? 160 : 140;
        const wx = margin;
        const wy = boxH - statusH - margin;
        const ww = boxW - margin * 2;
        const wh = statusH;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.helpWindowRect = function() {
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        const helpH = this.calcWindowHeight(2, false);
        const statusH = isPortraitLayout() ? 160 : 140;
        const wx = margin;
        const wy = boxH - statusH - helpH - margin * 2;
        const ww = boxW - margin * 2;
        const wh = helpH;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.skillWindowRect = function() {
        const boxW = Graphics.boxWidth;
        const boxH = Graphics.boxHeight;
        const cmdH = this.calcWindowHeight(1, true);
        const statusH = isPortraitLayout() ? 160 : 140;
        const topY = cmdH + margin;
        const availableH = boxH - topY - statusH - margin * 2;
        return new Rectangle(margin, topY, boxW - margin * 2, Math.max(100, availableH));
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
        const cmdH = this.calcWindowHeight(1, true);
        const statusH = isPortraitLayout() ? 160 : 140;

        // Screen Top-aligned Commands (y = 0)
        setWindowRect(this._partyCommandWindow, 0, 0, boxW, cmdH);
        setWindowRect(this._actorCommandWindow, 0, 0, boxW, cmdH);

        // Screen Bottom-aligned Status (Fixed Operation Area at the Bottom)
        setWindowRect(this._statusWindow, margin, boxH - statusH - margin, boxW - margin * 2, statusH);

        // Help Window positioned just above status window if needed
        const helpH = this.calcWindowHeight(2, false);
        setWindowRect(this._helpWindow, margin, boxH - statusH - helpH - margin * 2, boxW - margin * 2, helpH);
    };

})();
