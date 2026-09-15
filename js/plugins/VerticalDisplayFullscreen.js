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
 * @param MapScale
 * @text Map Scale
 * @type number
 * @decimals 2
 * @min 1.00
 * @default 2.00
 *
 * @help VerticalDisplayFullscreen.js
 *
 * On portrait screens, this plugin keeps Graphics.boxWidth/boxHeight at the
 * project's existing UI size, but expands Graphics.width/height to match the
 * browser display aspect. Map, battle backgrounds, pictures, weather, and
 * screen effects can then use the full vertical display area. Top-positioned
 * message windows are anchored to the actual display top; other windows remain
 * centered in the original PC-style UI area.
 */

(() => {
    "use strict";

    const pluginName = "VerticalDisplayFullscreen";
    const parameters = PluginManager.parameters(pluginName);
    const portraitOnly = parameters.PortraitOnly !== "false";
    const maxScreenHeight = Number(parameters.MaxScreenHeight || 1800);
    const desktopPortraitPreview = parameters.DesktopPortraitPreview !== "false";
    const mapScale = Math.max(1, Number(parameters.MapScale || 2));
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

    const originalCreateTilemap = Spriteset_Map.prototype.createTilemap;
    Spriteset_Map.prototype.createTilemap = function() {
        originalCreateTilemap.call(this);
        if (shouldExpand()) {
            this._tilemap.width = Graphics.width;
            this._tilemap.height = Graphics.height;
        }
    };

    const originalMapUpdate = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        originalMapUpdate.call(this);
        if (shouldExpand()) {
            this._baseSprite.scale.x = mapScale;
            this._baseSprite.scale.y = mapScale;
        }
    };

    const originalScreenTileX = Game_Map.prototype.screenTileX;
    Game_Map.prototype.screenTileX = function() {
        if (shouldExpand()) {
            return Math.round((Graphics.width / this.tileWidth() / mapScale) * 16) / 16;
        }
        return originalScreenTileX.call(this);
    };

    const originalScreenTileY = Game_Map.prototype.screenTileY;
    Game_Map.prototype.screenTileY = function() {
        if (shouldExpand()) {
            return Math.round((Graphics.height / this.tileHeight() / mapScale) * 16) / 16;
        }
        return originalScreenTileY.call(this);
    };

    const originalMessageUpdatePlacement = Window_Message.prototype.updatePlacement;
    Window_Message.prototype.updatePlacement = function() {
        originalMessageUpdatePlacement.call(this);
        if (shouldExpand() && this._positionType === 0 && this.parent) {
            this.y -= this.parent.y;
        }
    };
})();