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
        menu: false
    };
    const keyboardState = {};
    let controlsEnabled = false;

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
            default:
                return null;
        }
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
            #mobileTouchControls button { position: absolute; width: var(--mtc-size); height: var(--mtc-size); border: 3px solid rgba(255, 255, 255, 0.7); border-radius: 50%; background: rgba(17, 24, 39, 0.58); color: #ffffff; font: 700 clamp(22px, 6vw, 38px) sans-serif; pointer-events: auto; touch-action: none; -webkit-tap-highlight-color: transparent; }
            #mobileTouchControls button:active { background: rgba(14, 116, 144, 0.9); transform: scale(0.94); }
            #mobileTouchControls .mtc-stick { position: absolute; right: calc(var(--mtc-edge) + var(--mtc-size) * 0.84 + var(--mtc-gap)); bottom: var(--mtc-bottom); width: calc(var(--mtc-size) * 1.42); height: calc(var(--mtc-size) * 1.42); border: 3px solid rgba(255, 255, 255, 0.55); border-radius: 50%; background: rgba(17, 24, 39, 0.42); box-shadow: inset 0 0 0 8px rgba(255, 255, 255, 0.08); pointer-events: auto; touch-action: none; }
            #mobileTouchControls .mtc-stick::before, #mobileTouchControls .mtc-stick::after { content: ""; position: absolute; background: rgba(255, 255, 255, 0.22); }
            #mobileTouchControls .mtc-stick::before { top: 12%; bottom: 12%; left: 50%; width: 2px; }
            #mobileTouchControls .mtc-stick::after { right: 12%; left: 12%; top: 50%; height: 2px; }
            #mobileTouchControls .mtc-stick-knob { position: absolute; left: 50%; top: 50%; width: 43%; height: 43%; border: 3px solid rgba(255, 255, 255, 0.8); border-radius: 50%; background: rgba(5, 111, 146, 0.72); transform: translate(-50%, -50%); pointer-events: none; }
            #mobileTouchControls .mtc-ok { right: var(--mtc-edge); bottom: var(--mtc-bottom); width: calc(var(--mtc-size) * 0.84); height: calc(var(--mtc-size) * 0.84); background: rgba(5, 111, 146, 0.7); }
            #mobileTouchControls .mtc-cancel { right: var(--mtc-edge); bottom: calc(var(--mtc-bottom) + var(--mtc-size) * 0.84 + var(--mtc-gap)); width: calc(var(--mtc-size) * 0.72); height: calc(var(--mtc-size) * 0.72); font-size: clamp(20px, 5vw, 30px); }
        `;
        document.head.appendChild(style);

        const container = document.createElement("div");
        container.id = "mobileTouchControls";
        const stick = document.createElement("div");
        const stickKnob = document.createElement("div");
        let stickActive = false;
        stick.className = "mtc-stick";
        stickKnob.className = "mtc-stick-knob";
        stick.appendChild(stickKnob);
        const updateStick = event => {
            event.preventDefault();
            const rect = stick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distanceX = event.clientX - centerX;
            const distanceY = event.clientY - centerY;
            const limit = rect.width * 0.28;
            const distance = Math.hypot(distanceX, distanceY);
            const knobX = distance > limit ? (distanceX / distance) * limit : distanceX;
            const knobY = distance > limit ? (distanceY / distance) * limit : distanceY;
            stickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
            touchState.left = distanceX < -rect.width * 0.16;
            touchState.right = distanceX > rect.width * 0.16;
            touchState.up = distanceY < -rect.height * 0.16;
            touchState.down = distanceY > rect.height * 0.16;
        };
        const releaseStick = event => {
            event.preventDefault();
            stickActive = false;
            touchState.up = false;
            touchState.down = false;
            touchState.left = false;
            touchState.right = false;
            stickKnob.style.transform = "translate(-50%, -50%)";
        };
        stick.addEventListener("pointerdown", event => {
            event.preventDefault();
            stickActive = true;
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
        stick.addEventListener("lostpointercapture", releaseStick);
        container.appendChild(stick);
        const buttons = [
            ["ok", "mtc-ok", "OK"],
            ["escape", "mtc-cancel", "X"]
        ];

        for (const [keyName, className, label] of buttons) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = className;
            button.textContent = label;
            button.setAttribute("aria-label", keyName);
            const press = event => {
                event.preventDefault();
                touchState[keyName] = true;
            };
            const release = event => {
                event.preventDefault();
                touchState[keyName] = false;
            };
            button.addEventListener("pointerdown", press);
            button.addEventListener("pointerup", release);
            button.addEventListener("pointercancel", release);
            button.addEventListener("pointerleave", release);
            container.appendChild(button);
        }
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