//=============================================================================
// RPG Maker MZ - Vertical Display Fullscreen
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Expands map and battle visuals for portrait screens while keeping the existing PC-style UI area centered.
 * @author kaellkun
 *
 * @param PortraitOnly
 * @text Portrait Only
 * @type boolean
 * @default true
 *
 * @param MaxScreenHeight
 * @text Max Screen Height
 * @type number
 * @min 624
 * @default 1800
 *
 * @param DesktopPortraitPreview
 * @text Desktop Portrait Preview
 * @type boolean
 * @default true
 *
 * @help VerticalDisplayFullscreen.js
 *
 * On portrait screens, this plugin keeps Graphics.boxWidth/boxHeight at the
 * project's existing UI size, but expands Graphics.width/height to match the
 * browser display aspect. Map, battle backgrounds, pictures, weather, and
 * screen effects can then use the full vertical display area, while windows
 * remain centered in the original PC-style UI area.
 */

(() => {
    "use strict";

    const pluginName = "VerticalDisplayFullscreen";
    const parameters = PluginManager.parameters(pluginName);
    const portraitOnly = parameters.PortraitOnly !== "false";
    const maxScreenHeight = Number(parameters.MaxScreenHeight || 1800);
    const desktopPortraitPreview = parameters.DesktopPortraitPreview !== "false";
    const boxMargin = 4;

    const setupViewport = () => {
        const content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";
        let viewport = document.querySelector("meta[name='viewport']");
        if (!viewport) {
            viewport = document.createElement("meta");
            viewport.name = "viewport";
            document.head.appendChild(viewport);
        }
        viewport.content = content;
    };

    const viewportWidth = () => Math.max(1, window.visualViewport ? window.visualViewport.width : window.innerWidth);
    const viewportHeight = () => Math.max(1, window.visualViewport ? window.visualViewport.height : window.innerHeight);
    const isPortrait = () => viewportHeight() >= viewportWidth();
    const isNarrowPreview = () => desktopPortraitPreview && isPortrait() && viewportWidth() <= $dataSystem.advanced.uiAreaWidth;
    const isExpandedDisplay = () => Utils.isMobileDevice() || isNarrowPreview();

    const shouldExpand = () => {
        if (!isExpandedDisplay()) {
            return false;
        }
        return !portraitOnly || isPortrait();
    };

    const visualScreenSize = () => {
        const baseWidth = $dataSystem.advanced.screenWidth;
        const baseHeight = $dataSystem.advanced.screenHeight;
        const height = Math.ceil(baseWidth * viewportHeight() / viewportWidth());
        return {
            width: baseWidth,
            height: Math.min(maxScreenHeight, Math.max(baseHeight, height))
        };
    };


    setupViewport();

    const originalStretchWidth = Graphics._stretchWidth;
    Graphics._stretchWidth = function() {
        return isExpandedDisplay() ? viewportWidth() : originalStretchWidth.call(this);
    };

    const originalStretchHeight = Graphics._stretchHeight;
    Graphics._stretchHeight = function() {
        return isExpandedDisplay() ? viewportHeight() : originalStretchHeight.call(this);
    };

    const keepPcUiBox = () => {
        Graphics.boxWidth = $dataSystem.advanced.uiAreaWidth - boxMargin * 2;
        Graphics.boxHeight = $dataSystem.advanced.uiAreaHeight - boxMargin * 2;
    };

    const applyVisualScreenSize = () => {
        if (shouldExpand()) {
            const size = visualScreenSize();
            Graphics._stretchEnabled = true;
            Graphics.resize(size.width, size.height);
        }
        keepPcUiBox();
    };

    const originalResizeScreen = Scene_Boot.prototype.resizeScreen;
    Scene_Boot.prototype.resizeScreen = function() {
        originalResizeScreen.call(this);
        applyVisualScreenSize();
    };

    const originalCreateBattleField = Spriteset_Battle.prototype.createBattleField;
    Spriteset_Battle.prototype.createBattleField = function() {
        originalCreateBattleField.call(this);
        if (shouldExpand()) {
            this._battleField.setFrame(0, 0, Graphics.width, Graphics.height);
            this._battleField.x = 0;
            this._battleField.y = -this.battleFieldOffsetY();
        }
    };

    const originalCreateTilemap = Spriteset_Map.prototype.createTilemap;
    Spriteset_Map.prototype.createTilemap = function() {
        originalCreateTilemap.call(this);
        if (shouldExpand()) {
            this._tilemap.width = Graphics.width;
            this._tilemap.height = Graphics.height;
        }
    };
})();