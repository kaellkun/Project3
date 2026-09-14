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
    let controlsEnabled = false;

    const originalInputUpdate = Input.update;
    Input.update = function() {
        if (controlsEnabled) {
            for (const keyName in touchState) {
                if (touchState[keyName]) {
                    this._currentState[keyName] = true;
                } else if (this._currentState[keyName]) {
                    this._currentState[keyName] = false;
                }
            }
        }
        originalInputUpdate.call(this);
    };

    const clearTouchState = () => {
        for (const keyName in touchState) {
            touchState[keyName] = false;
        }
    };

    const createControls = () => {
        if (!window.matchMedia("(pointer: coarse)").matches) {
            return;
        }

        const style = document.createElement("style");
        controlsEnabled = true;
        style.textContent = `
            html, body { width: 100%; height: 100%; overflow: hidden; overscroll-behavior: none; touch-action: none; }
            #mobileTouchControls { --mtc-size: clamp(120px, 35vw, 200px); position: fixed; inset: 0; z-index: 20; pointer-events: none; touch-action: none; }
            #mobileTouchControls button { position: absolute; width: var(--mtc-size); height: var(--mtc-size); border: 4px solid rgba(255, 255, 255, 0.7); border-radius: 50%; background: rgba(17, 24, 39, 0.58); color: #ffffff; font: 700 clamp(32px, 8vw, 56px) sans-serif; pointer-events: auto; touch-action: none; -webkit-tap-highlight-color: transparent; }
            #mobileTouchControls button:active { background: rgba(14, 116, 144, 0.9); transform: scale(0.94); }
            #mobileTouchControls .mtc-stick { position: absolute; right: calc(var(--mtc-size) * 1.65); bottom: 28px; width: calc(var(--mtc-size) * 1.45); height: calc(var(--mtc-size) * 1.45); border: 5px solid rgba(255, 255, 255, 0.55); border-radius: 50%; background: rgba(17, 24, 39, 0.42); box-shadow: inset 0 0 0 12px rgba(255, 255, 255, 0.08); pointer-events: auto; touch-action: none; }
            #mobileTouchControls .mtc-stick::before, #mobileTouchControls .mtc-stick::after { content: ""; position: absolute; background: rgba(255, 255, 255, 0.22); }
            #mobileTouchControls .mtc-stick::before { top: 12%; bottom: 12%; left: 50%; width: 2px; }
            #mobileTouchControls .mtc-stick::after { right: 12%; left: 12%; top: 50%; height: 2px; }
            #mobileTouchControls .mtc-stick-knob { position: absolute; left: 50%; top: 50%; width: 43%; height: 43%; border: 4px solid rgba(255, 255, 255, 0.8); border-radius: 50%; background: rgba(5, 111, 146, 0.72); transform: translate(-50%, -50%); pointer-events: none; }
            #mobileTouchControls .mtc-menu { right: 28px; bottom: calc(var(--mtc-size) * 1.65); width: 180px; height: 90px; border-radius: 12px; font-size: 28px; }
            #mobileTouchControls .mtc-ok { right: 28px; bottom: 42px; width: calc(var(--mtc-size) * 1.2); height: calc(var(--mtc-size) * 1.2); background: rgba(5, 111, 146, 0.7); }
            #mobileTouchControls .mtc-cancel { right: calc(var(--mtc-size) * 1.18); bottom: 26px; width: calc(var(--mtc-size) * 0.72); height: calc(var(--mtc-size) * 0.72); font-size: 36px; }
            @media (orientation: portrait) { #mobileTouchControls { --mtc-size: clamp(100px, 31vw, 140px); } #mobileTouchControls .mtc-menu { right: 20px; bottom: calc(var(--mtc-size) * 1.55); width: 120px; height: 66px; font-size: 20px; } #mobileTouchControls .mtc-ok { right: 20px; bottom: 26px; } #mobileTouchControls .mtc-cancel { right: calc(var(--mtc-size) * 1.12); bottom: 18px; } #mobileTouchControls .mtc-stick { right: calc(var(--mtc-size) * 1.55); bottom: 18px; } }
        `;
        document.head.appendChild(style);

        const container = document.createElement("div");
        container.id = "mobileTouchControls";
        const stick = document.createElement("div");
        const stickKnob = document.createElement("div");
        stick.className = "mtc-stick";
        stickKnob.className = "mtc-stick-knob";
        stick.appendChild(stickKnob);
        const updateStick = event => {
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
            touchState.up = false;
            touchState.down = false;
            touchState.left = false;
            touchState.right = false;
            stickKnob.style.transform = "translate(-50%, -50%)";
        };
        stick.addEventListener("pointerdown", event => {
            event.preventDefault();
            stick.setPointerCapture(event.pointerId);
            updateStick(event);
        });
        stick.addEventListener("pointermove", updateStick);
        stick.addEventListener("pointerup", releaseStick);
        stick.addEventListener("pointercancel", releaseStick);
        container.appendChild(stick);
        const buttons = [
            ["menu", "mtc-menu", "MENU"],
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