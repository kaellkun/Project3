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

    const originalTouchInputClear = TouchInput.clear;
    TouchInput.clear = function() {
        originalTouchInputClear.call(this);
        this._isMouseOrigin = false;
    };

    const originalOnMouseDown = TouchInput._onMouseDown;
    TouchInput._onMouseDown = function(event) {
        if (!this._screenPressed) {
            this._isMouseOrigin = true;
        }
        originalOnMouseDown.call(this, event);
    };

    const originalOnMouseUp = TouchInput._onMouseUp;
    TouchInput._onMouseUp = function(event) {
        originalOnMouseUp.call(this, event);
        if (!this._mousePressed) {
            this._isMouseOrigin = false;
        }
    };

    const originalOnTouchStart = TouchInput._onTouchStart;
    TouchInput._onTouchStart = function(event) {
        this._isMouseOrigin = false;
        originalOnTouchStart.call(this, event);
    };

    const originalOnTouchEnd = TouchInput._onTouchEnd;
    TouchInput._onTouchEnd = function(event) {
        originalOnTouchEnd.call(this, event);
        this._isMouseOrigin = false;
    };

    const originalProcessMapTouch = Scene_Map.prototype.processMapTouch;
    Scene_Map.prototype.processMapTouch = function() {
        if (TouchInput._isMouseOrigin) {
            this._touchCount = 0;
            $gameTemp.clearDestination();
            return;
        }
        originalProcessMapTouch.call(this);
    };
})();
