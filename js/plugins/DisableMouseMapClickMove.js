//=============================================================================
// RPG Maker MZ - Disable Mouse Map Click Move
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Prevents mouse-originated clicks from moving the player on the map.
 * @author kaellkun
 *
 * @help DisableMouseMapClickMove.js
 *
 * Some gamepads (e.g. Joy-Con via certain drivers) emulate mouse clicks at
 * the cursor position, which RPG Maker MZ interprets as a map tap and moves
 * the player toward that position. This plugin ignores map-touch movement
 * that originates from a mouse click while keeping keyboard, gamepad, and
 * real touchscreen taps working normally.
 */

(() => {
    "use strict";

    const originalOnMouseDown = TouchInput._onMouseDown;
    TouchInput._onMouseDown = function(event) {
        this._isMouseOrigin = true;
        originalOnMouseDown.call(this, event);
    };

    const originalOnTouchStart = TouchInput._onTouchStart;
    TouchInput._onTouchStart = function(event) {
        this._isMouseOrigin = false;
        originalOnTouchStart.call(this, event);
    };

    const originalOnMapTouch = Scene_Map.prototype.onMapTouch;
    Scene_Map.prototype.onMapTouch = function() {
        if (TouchInput._isMouseOrigin) {
            return;
        }
        originalOnMapTouch.call(this);
    };
})();
