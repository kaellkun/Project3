//=============================================================================
// RPG Maker MZ - Mobile Touch Controls
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Adds on-screen controls for touch devices.
 * @author kaellkun
 *
 * @param EnableDiagonalMovement
 * @text 斜め移動を有効化
 * @type boolean
 * @on 有効
 * @off 無効
 * @default true
 * @desc スティック・方向ボタンで斜め移動できるようにします。
 *
 * @help MobileTouchControls.js
 *
 * Displays an eight-way joystick surrounded by four direction buttons.
 * Drag the stick to move, or hold a direction button. Tap the stick center
 * for OK. X cancels/opens the menu; L/R switch pages where available.
 * Touch directions support diagonal map movement using MZ collision checks
 * when EnableDiagonalMovement is enabled.
 * Menus, keyboard, gamepad, and map-tap movement keep their normal behavior.
 */

(() => {
    "use strict";

    const parameters = PluginManager.parameters("MobileTouchControls");
    const diagonalMovementEnabled = parameters.EnableDiagonalMovement !== "false";
    const touchState = {
        up: false,
        down: false,
        left: false,
        right: false,
        ok: false,
        escape: false,
        menu: false,
        pageup: false,
        pagedown: false
    };
    const directionKeys = ["up", "down", "left", "right"];
    const stickState = {};
    const buttonState = {};
    const appliedTouchState = {};
    let controlsEnabled = false;
    let resetControls = () => {};

    // Keep independent owners: releasing the stick must not release a held D-pad.
    const syncTouchState = () => {
        for (const keyName in touchState) {
            touchState[keyName] = !!(stickState[keyName] || buttonState[keyName]);
        }
    };

    Input.keyMapper[33] = null;
    Input.keyMapper[34] = null;
    Input.keyMapper[81] = "pageup";
    Input.keyMapper[87] = "pagedown";
    Input.keyMapper[76] = "pageup";
    Input.keyMapper[82] = "pagedown";

    const consumePointerEvent = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    const originalInputClear = Input.clear;
    Input.clear = function() {
        originalInputClear.call(this);
        clearTouchState();
        for (const keyName in touchState) {
            appliedTouchState[keyName] = false;
        }
    };

    const originalInputUpdate = Input.update;
    Input.update = function() {
        if (controlsEnabled) {
            for (const keyName in touchState) {
                const pressed = touchState[keyName];
                if (pressed) {
                    this._currentState[keyName] = true;
                } else if (appliedTouchState[keyName]) {
                    this._currentState[keyName] = false;
                }
                appliedTouchState[keyName] = pressed;
            }
        }
        originalInputUpdate.call(this);
    };

    const originalGetInputDirection = Game_Player.prototype.getInputDirection;
    Game_Player.prototype.getInputDirection = function() {
        if (controlsEnabled && directionKeys.some(key => touchState[key])) {
            return Input.dir8;
        }
        return originalGetInputDirection.call(this);
    };

    const originalExecuteMove = Game_Player.prototype.executeMove;
    Game_Player.prototype.executeMove = function(direction) {
        if (![1, 3, 7, 9].includes(direction)) {
            return originalExecuteMove.call(this, direction);
        }
        const horz = direction === 1 || direction === 7 ? 4 : 6;
        const vert = direction === 1 || direction === 3 ? 2 : 8;
        if (!diagonalMovementEnabled) {
            const straightDirection = [2, 4, 6, 8].includes(Input.dir4) ? Input.dir4 : horz;
            return originalExecuteMove.call(this, straightDirection);
        }
        // Use the player's native movement to preserve collision and followers.
        this.moveDiagonally(horz, vert);
        if (!this.isMovementSucceeded()) {
            // Slide along a wall, retaining normal touch-event checks if blocked.
            const primary = Input.dir4 === vert ? vert : horz;
            const secondary = primary === horz ? vert : horz;
            const fallback = this.canPass(this.x, this.y, primary) ? primary :
                this.canPass(this.x, this.y, secondary) ? secondary : primary;
            originalExecuteMove.call(this, fallback);
        }
    };

    const clearTouchState = () => {
        resetControls();
        for (const keyName in touchState) {
            touchState[keyName] = false;
        }
    };

    const isNarrowPortraitPreview = () => {
        const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        return height >= width && width <= 816;
    };

    const createControls = () => {
        if (!window.matchMedia("(pointer: coarse)").matches && !isNarrowPortraitPreview()) {
            return;
        }

        const style = document.createElement("style");
        controlsEnabled = true;
        style.textContent = `
            html, body { width: 100%; height: 100%; overflow: hidden; overscroll-behavior: none; touch-action: none; }
            #mobileTouchControls {
                --mtc-size: clamp(72px, 21vw, 104px);
                --mtc-gap: 4px;
                --mtc-stick-size: clamp(96px, 30vw, 128px);
                --mtc-direction-size: clamp(44px, 12vw, 48px);
                --mtc-direction-depth: clamp(32px, 9vw, 36px);
                --mtc-overlap: 8px;
                --mtc-pad-size: calc(var(--mtc-stick-size) + (var(--mtc-direction-depth) - var(--mtc-overlap)) * 2);
                --mtc-edge: max(10px, env(safe-area-inset-right));
                --mtc-bottom: max(10px, env(safe-area-inset-bottom));
                position: fixed; inset: 0; z-index: 20; pointer-events: none; touch-action: none;
                user-select: none; -webkit-user-select: none;
            }
            #mobileTouchControls .mtc-touch-blocker { position: absolute; right: 0; bottom: 0; width: calc(var(--mtc-edge) + var(--mtc-pad-size)); height: calc(var(--mtc-bottom) + var(--mtc-pad-size)); background: transparent; pointer-events: auto; touch-action: none; }
            #mobileTouchControls .mtc-movement-pad { position: absolute; z-index: 1; right: var(--mtc-edge); bottom: var(--mtc-bottom); width: var(--mtc-pad-size); height: var(--mtc-pad-size); pointer-events: none; }
            #mobileTouchControls button { position: absolute; z-index: 1; width: var(--mtc-size); height: var(--mtc-size); border: 3px solid rgba(255, 255, 255, 0.7); border-radius: 50%; background: rgba(17, 24, 39, 0.58); color: #ffffff; font: 700 clamp(22px, 6vw, 38px) sans-serif; pointer-events: auto; touch-action: none; -webkit-tap-highlight-color: transparent; }
            #mobileTouchControls button:active, #mobileTouchControls button.is-pressed { background: rgba(14, 116, 144, 0.9); transform: scale(0.94); }
            #mobileTouchControls .mtc-direction { box-sizing: border-box; z-index: 2; width: var(--mtc-direction-size); height: var(--mtc-direction-depth); padding: 0; border-radius: 8px; font-size: 24px; line-height: 1; }
            #mobileTouchControls .mtc-up, #mobileTouchControls .mtc-down { left: calc((var(--mtc-pad-size) - var(--mtc-direction-size)) / 2); }
            #mobileTouchControls .mtc-up { top: 0; }
            #mobileTouchControls .mtc-down { bottom: 0; }
            #mobileTouchControls .mtc-left, #mobileTouchControls .mtc-right { top: calc((var(--mtc-pad-size) - var(--mtc-direction-size)) / 2); width: var(--mtc-direction-depth); height: var(--mtc-direction-size); }
            #mobileTouchControls .mtc-left { left: 0; }
            #mobileTouchControls .mtc-right { right: 0; }
            #mobileTouchControls .mtc-stick { position: absolute; left: calc(var(--mtc-direction-depth) - var(--mtc-overlap)); top: calc(var(--mtc-direction-depth) - var(--mtc-overlap)); box-sizing: border-box; width: var(--mtc-stick-size); height: var(--mtc-stick-size); border: 3px solid rgba(255, 255, 255, 0.55); border-radius: 50%; background: rgba(17, 24, 39, 0.42); box-shadow: inset 0 0 0 8px rgba(255, 255, 255, 0.08); pointer-events: auto; touch-action: none; }
            #mobileTouchControls .mtc-stick::before, #mobileTouchControls .mtc-stick::after { content: ""; position: absolute; background: rgba(255, 255, 255, 0.22); }
            #mobileTouchControls .mtc-stick::before { top: 12%; bottom: 12%; left: 50%; width: 2px; }
            #mobileTouchControls .mtc-stick::after { right: 12%; left: 12%; top: 50%; height: 2px; }
            #mobileTouchControls .mtc-stick-knob { position: absolute; left: 50%; top: 50%; width: 52%; height: 52%; border: 3px solid rgba(255, 255, 255, 0.8); border-radius: 50%; background: rgba(5, 111, 146, 0.72); color: #ffffff; display: grid; place-items: center; font: 700 clamp(12px, 4vw, 22px) sans-serif; transform: translate(-50%, -50%); pointer-events: none; }
            #mobileTouchControls .mtc-cancel { box-sizing: border-box; right: var(--mtc-edge); bottom: calc(var(--mtc-bottom) + var(--mtc-pad-size) - var(--mtc-direction-size)); width: var(--mtc-direction-size); height: var(--mtc-direction-size); padding: 0; font-size: 24px; }
            #mobileTouchControls .mtc-page { display: none; left: max(10px, env(safe-area-inset-left)); bottom: var(--mtc-bottom); width: calc(var(--mtc-size) * 0.84); height: calc(var(--mtc-size) * 0.84); }
            #mobileTouchControls .mtc-pageup { bottom: calc(var(--mtc-bottom) + var(--mtc-size) * 0.84 + var(--mtc-gap)); }
            #mobileTouchControls .mtc-page.is-visible { display: block; }
        `;
        document.head.appendChild(style);

        const container = document.createElement("div");
        container.id = "mobileTouchControls";
        // MZ listens to Touch/Mouse Events on document, not Pointer Events.
        // Cancelling pointerdown alone does not stop the separate touch stream
        // from turning a stick/button press into a map destination underneath.
        for (const eventName of [
            "touchstart", "touchmove", "touchend", "touchcancel",
            "mousedown", "mousemove", "mouseup", "click", "contextmenu"
        ]) {
            container.addEventListener(eventName, consumePointerEvent, { passive: false });
        }
        const blocker = document.createElement("div");
        blocker.className = "mtc-touch-blocker";
        for (const eventName of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
            blocker.addEventListener(eventName, consumePointerEvent);
        }
        container.appendChild(blocker);
        const movementPad = document.createElement("div");
        movementPad.className = "mtc-movement-pad";
        container.appendChild(movementPad);
        const stick = document.createElement("div");
        const stickKnob = document.createElement("div");
        let stickPointerId = null;
        let stickMoved = false;
        const stickDirectionThreshold = 0.24;
        const stickSectors = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
        stick.className = "mtc-stick";
        stickKnob.className = "mtc-stick-knob";
        stickKnob.textContent = "OK";
        stick.appendChild(stickKnob);
        const updateStick = event => {
            consumePointerEvent(event);
            const rect = stick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distanceX = event.clientX - centerX;
            const distanceY = event.clientY - centerY;
            const limit = rect.width * 0.28;
            const distance = Math.hypot(distanceX, distanceY);
            const outsideDeadZone = distance > rect.width * stickDirectionThreshold;
            if (outsideDeadZone) {
                stickMoved = true;
            }
            const knobX = distance > limit ? (distanceX / distance) * limit : distanceX;
            const knobY = distance > limit ? (distanceY / distance) * limit : distanceY;
            stickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
            // Equal 45-degree sectors make diagonals accessible just outside
            // the circular dead zone, rather than requiring two axis thresholds.
            const sector = (Math.round(Math.atan2(distanceY, distanceX) / (Math.PI / 4)) + 8) % 8;
            const [x, y] = outsideDeadZone ? stickSectors[sector] : [0, 0];
            stickState.left = x < 0;
            stickState.right = x > 0;
            stickState.up = y < 0;
            stickState.down = y > 0;
            syncTouchState();
        };
        const resetStick = () => {
            const pointerId = stickPointerId;
            stickPointerId = null;
            stickMoved = false;
            for (const key of directionKeys) {
                stickState[key] = false;
            }
            syncTouchState();
            stickKnob.style.transform = "translate(-50%, -50%)";
            if (pointerId !== null && stick.hasPointerCapture(pointerId)) {
                stick.releasePointerCapture(pointerId);
            }
        };
        const buttonResets = [];
        resetControls = () => {
            resetStick();
            for (const reset of buttonResets) {
                reset();
            }
        };
        const releaseStick = event => {
            if (stickPointerId === null || event.pointerId !== stickPointerId) {
                return;
            }
            consumePointerEvent(event);
            const clicked = event.type === "pointerup" && !stickMoved;
            resetStick();
            if (clicked) {
                Input.virtualClick("ok");
            }
        };
        stick.addEventListener("pointerdown", event => {
            consumePointerEvent(event);
            if (stickPointerId !== null || event.button !== 0) {
                return;
            }
            stickPointerId = event.pointerId;
            stickMoved = false;
            try {
                stick.setPointerCapture(event.pointerId);
            } catch (error) {
                // Synthetic pointer events in editor previews can lack an active pointer.
            }
            updateStick(event);
        });
        stick.addEventListener("pointermove", event => {
            if (stickPointerId !== null && event.pointerId === stickPointerId) {
                updateStick(event);
            }
        });
        stick.addEventListener("pointerup", releaseStick);
        stick.addEventListener("pointercancel", releaseStick);
        stick.addEventListener("lostpointercapture", releaseStick);
        document.addEventListener("pointerup", releaseStick, true);
        document.addEventListener("pointercancel", releaseStick, true);
        movementPad.appendChild(stick);
        const buttons = [
            ["up", "mtc-direction mtc-up", "↑"],
            ["down", "mtc-direction mtc-down", "↓"],
            ["left", "mtc-direction mtc-left", "←"],
            ["right", "mtc-direction mtc-right", "→"],
            ["escape", "mtc-cancel", "X"],
            ["pageup", "mtc-page mtc-pageup", "L"],
            ["pagedown", "mtc-page mtc-pagedown", "R"]
        ];

        for (const [keyName, className, label] of buttons) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = className;
            button.textContent = label;
            button.setAttribute("aria-label", keyName);
            const pointers = new Set();
            const updateButton = () => {
                const pressed = pointers.size > 0;
                buttonState[keyName] = pressed;
                button.classList.toggle("is-pressed", pressed);
                button.setAttribute("aria-pressed", String(pressed));
                syncTouchState();
            };
            const resetButton = () => {
                const captured = [...pointers];
                pointers.clear();
                updateButton();
                for (const pointerId of captured) {
                    if (button.hasPointerCapture(pointerId)) {
                        button.releasePointerCapture(pointerId);
                    }
                }
            };
            buttonResets.push(resetButton);
            updateButton();
            const press = event => {
                consumePointerEvent(event);
                if (event.button !== 0) {
                    return;
                }
                pointers.add(event.pointerId);
                try {
                    button.setPointerCapture(event.pointerId);
                } catch (error) {
                    // Document release handlers also support editor previews.
                }
                updateButton();
            };
            const release = event => {
                if (!pointers.has(event.pointerId)) {
                    return;
                }
                consumePointerEvent(event);
                pointers.delete(event.pointerId);
                updateButton();
                if (button.hasPointerCapture(event.pointerId)) {
                    button.releasePointerCapture(event.pointerId);
                }
            };
            button.addEventListener("pointerdown", press);
            button.addEventListener("pointerup", release);
            button.addEventListener("pointercancel", release);
            button.addEventListener("lostpointercapture", release);
            button.addEventListener("pointerleave", event => {
                if (!button.hasPointerCapture(event.pointerId)) {
                    release(event);
                }
            });
            document.addEventListener("pointerup", release, true);
            document.addEventListener("pointercancel", release, true);
            (directionKeys.includes(keyName) ? movementPad : container).appendChild(button);
        }
        const pageButtons = [
            container.querySelector(".mtc-pageup"),
            container.querySelector(".mtc-pagedown")
        ];
        const updatePageButtons = () => {
            const scene = SceneManager._scene;
            const visible = !!(
                scene &&
                scene.needsPageButtons &&
                scene.needsPageButtons() &&
                (!scene.arePageButtonsEnabled || scene.arePageButtonsEnabled())
            );
            for (const button of pageButtons) {
                button.classList.toggle("is-visible", visible);
            }
        };
        const originalSceneBaseUpdate = Scene_Base.prototype.update;
        Scene_Base.prototype.update = function() {
            originalSceneBaseUpdate.call(this);
            updatePageButtons();
        };
        document.body.appendChild(container);
        window.addEventListener("blur", clearTouchState);
        window.addEventListener("pagehide", clearTouchState);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                clearTouchState();
            }
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createControls);
    } else {
        createControls();
    }
})();