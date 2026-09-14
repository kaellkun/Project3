//=============================================================================
// RPG Maker MZ - Mobile Touch Controls
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Adds on-screen controls for touch devices.
 * @author kaellkun
 *
 * @help MobileTouchControls.js
 *
 * Displays a direction pad and OK, cancel, and menu buttons on touch devices.
 * Keyboard and gamepad controls continue to work normally.
 */

(() => {
    "use strict";

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
    const keyboardState = {};
    let controlsEnabled = false;

    Input.keyMapper[33] = null;
    Input.keyMapper[34] = null;
    Input.keyMapper[81] = "pageup";
    Input.keyMapper[87] = "pagedown";
    Input.keyMapper[76] = "pageup";
    Input.keyMapper[82] = "pagedown";

    const buttonNameFromKeyboardEvent = event => {
        if (Input.keyMapper[event.keyCode]) {
            return Input.keyMapper[event.keyCode];
        }
        switch (event.key || event.code) {
            case "ArrowUp":
                return "up";
            case "ArrowDown":
                return "down";
            case "ArrowLeft":
                return "left";
            case "ArrowRight":
                return "right";
            case " ":
            case "Enter":
            case "z":
            case "Z":
            case "KeyZ":
                return "ok";
            case "Escape":
            case "x":
            case "X":
            case "KeyX":
                return "escape";
            case "l":
            case "L":
            case "KeyL":
                return "pageup";
            case "r":
            case "R":
            case "KeyR":
                return "pagedown";
            default:
                return null;
        }
    };

    const consumePointerEvent = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    const originalInputClear = Input.clear;
    Input.clear = function() {
        originalInputClear.call(this);
        for (const keyName in touchState) {
            keyboardState[keyName] = false;
        }
    };

    document.addEventListener("keydown", event => {
        const buttonName = buttonNameFromKeyboardEvent(event);
        if (buttonName && buttonName in touchState) {
            keyboardState[buttonName] = true;
        }
    });

    document.addEventListener("keyup", event => {
        const buttonName = buttonNameFromKeyboardEvent(event);
        if (buttonName && buttonName in touchState) {
            keyboardState[buttonName] = false;
        }
    });

    window.addEventListener("blur", () => {
        for (const keyName in keyboardState) {
            keyboardState[keyName] = false;
        }
    });

    const originalInputUpdate = Input.update;
    Input.update = function() {
        if (controlsEnabled) {
            for (const keyName in touchState) {
                this._currentState[keyName] = !!keyboardState[keyName] || touchState[keyName];
            }
        }
        originalInputUpdate.call(this);
    };

    const clearTouchState = () => {
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
            #mobileTouchControls { --mtc-size: clamp(72px, 21vw, 104px); --mtc-gap: clamp(2px, 1vw, 6px); --mtc-edge: max(16px, env(safe-area-inset-right)); --mtc-bottom: max(54px, env(safe-area-inset-bottom)); position: fixed; inset: 0; z-index: 20; pointer-events: none; touch-action: none; }
            #mobileTouchControls .mtc-touch-blocker { position: absolute; right: 0; bottom: 0; width: min(58vw, calc(var(--mtc-size) * 3.25)); height: calc(var(--mtc-bottom) + var(--mtc-size) * 2.12); background: transparent; pointer-events: auto; touch-action: none; }
            #mobileTouchControls button { position: absolute; z-index: 1; width: var(--mtc-size); height: var(--mtc-size); border: 3px solid rgba(255, 255, 255, 0.7); border-radius: 50%; background: rgba(17, 24, 39, 0.58); color: #ffffff; font: 700 clamp(22px, 6vw, 38px) sans-serif; pointer-events: auto; touch-action: none; -webkit-tap-highlight-color: transparent; }
            #mobileTouchControls button:active { background: rgba(14, 116, 144, 0.9); transform: scale(0.94); }
            #mobileTouchControls .mtc-stick { position: absolute; z-index: 1; right: calc(var(--mtc-edge) + var(--mtc-size) * 0.18 + var(--mtc-gap)); bottom: calc(var(--mtc-bottom) - 16px); width: calc(var(--mtc-size) * 1.62); height: calc(var(--mtc-size) * 1.62); border: 3px solid rgba(255, 255, 255, 0.55); border-radius: 50%; background: rgba(17, 24, 39, 0.42); box-shadow: inset 0 0 0 8px rgba(255, 255, 255, 0.08); pointer-events: auto; touch-action: none; }
            #mobileTouchControls .mtc-stick::before, #mobileTouchControls .mtc-stick::after { content: ""; position: absolute; background: rgba(255, 255, 255, 0.22); }
            #mobileTouchControls .mtc-stick::before { top: 12%; bottom: 12%; left: 50%; width: 2px; }
            #mobileTouchControls .mtc-stick::after { right: 12%; left: 12%; top: 50%; height: 2px; }
            #mobileTouchControls .mtc-stick-knob { position: absolute; left: 50%; top: 50%; width: 52%; height: 52%; border: 3px solid rgba(255, 255, 255, 0.8); border-radius: 50%; background: rgba(5, 111, 146, 0.72); color: #ffffff; display: grid; place-items: center; font: 700 clamp(12px, 4vw, 22px) sans-serif; transform: translate(-50%, -50%); pointer-events: none; }
            #mobileTouchControls .mtc-cancel { right: var(--mtc-edge); bottom: calc(var(--mtc-bottom) + var(--mtc-size) * 1.32 + var(--mtc-gap)); width: calc(var(--mtc-size) * 0.72); height: calc(var(--mtc-size) * 0.72); font-size: clamp(20px, 5vw, 30px); }
            #mobileTouchControls .mtc-page { display: none; left: var(--mtc-edge); bottom: var(--mtc-bottom); width: calc(var(--mtc-size) * 0.84); height: calc(var(--mtc-size) * 0.84); }
            #mobileTouchControls .mtc-pageup { left: var(--mtc-edge); }
            #mobileTouchControls .mtc-pagedown { left: calc(var(--mtc-edge) + var(--mtc-size) + var(--mtc-gap)); }
            #mobileTouchControls .mtc-page.is-visible { display: block; }
        `;
        document.head.appendChild(style);

        const container = document.createElement("div");
        container.id = "mobileTouchControls";
        const blocker = document.createElement("div");
        blocker.className = "mtc-touch-blocker";
        for (const eventName of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
            blocker.addEventListener(eventName, consumePointerEvent);
        }
        container.appendChild(blocker);
        const stick = document.createElement("div");
        const stickKnob = document.createElement("div");
        let stickActive = false;
        let stickMoved = false;
        const stickDirectionThreshold = 0.24;
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
            if (distance > rect.width * stickDirectionThreshold) {
                stickMoved = true;
            }
            const knobX = distance > limit ? (distanceX / distance) * limit : distanceX;
            const knobY = distance > limit ? (distanceY / distance) * limit : distanceY;
            stickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
            touchState.left = distanceX < -rect.width * stickDirectionThreshold;
            touchState.right = distanceX > rect.width * stickDirectionThreshold;
            touchState.up = distanceY < -rect.height * stickDirectionThreshold;
            touchState.down = distanceY > rect.height * stickDirectionThreshold;
        };
        const releaseStick = event => {
            if (!stickActive) {
                return;
            }
            consumePointerEvent(event);
            if (event.type === "pointerup" && !stickMoved) {
                Input.virtualClick("ok");
            }
            stickActive = false;
            stickMoved = false;
            touchState.up = false;
            touchState.down = false;
            touchState.left = false;
            touchState.right = false;
            stickKnob.style.transform = "translate(-50%, -50%)";
        };
        stick.addEventListener("pointerdown", event => {
            consumePointerEvent(event);
            stickActive = true;
            stickMoved = false;
            try {
                stick.setPointerCapture(event.pointerId);
            } catch (error) {
                // Synthetic pointer events in editor previews can lack an active pointer.
            }
            updateStick(event);
        });
        stick.addEventListener("pointermove", event => {
            if (stickActive) {
                updateStick(event);
            }
        });
        stick.addEventListener("pointerup", releaseStick);
        stick.addEventListener("pointercancel", releaseStick);
        document.addEventListener("pointerup", event => {
            if (stickActive) {
                releaseStick(event);
            }
        }, true);
        document.addEventListener("pointercancel", event => {
            if (stickActive) {
                releaseStick(event);
            }
        }, true);
        container.appendChild(stick);
        const buttons = [
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
            const press = event => {
                consumePointerEvent(event);
                touchState[keyName] = true;
            };
            const release = event => {
                consumePointerEvent(event);
                touchState[keyName] = false;
            };
            button.addEventListener("pointerdown", press);
            button.addEventListener("pointerup", release);
            button.addEventListener("pointercancel", release);
            button.addEventListener("pointerleave", release);
            container.appendChild(button);
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