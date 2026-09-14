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
            #mobileTouchControls .mtc-up { left: var(--mtc-size); bottom: calc(var(--mtc-size) * 2.1); }
            #mobileTouchControls .mtc-left { left: 0; bottom: var(--mtc-size); }
            #mobileTouchControls .mtc-down { left: var(--mtc-size); bottom: var(--mtc-size); }
            #mobileTouchControls .mtc-right { left: calc(var(--mtc-size) * 2); bottom: var(--mtc-size); }
            #mobileTouchControls .mtc-menu { right: 36px; top: 36px; width: 180px; height: 110px; border-radius: 12px; font-size: 32px; }
            #mobileTouchControls .mtc-ok { right: 56px; bottom: calc(var(--mtc-size) * 1.4); width: calc(var(--mtc-size) * 1.2); height: calc(var(--mtc-size) * 1.2); background: rgba(5, 111, 146, 0.7); }
            #mobileTouchControls .mtc-cancel { right: calc(var(--mtc-size) * 1.9); bottom: calc(var(--mtc-size) * 0.7); width: calc(var(--mtc-size) * 0.9); height: calc(var(--mtc-size) * 0.9); font-size: 36px; }
            @media (orientation: portrait) { #mobileTouchControls { --mtc-size: clamp(100px, 31vw, 140px); } #mobileTouchControls .mtc-menu { right: 20px; top: 20px; width: 120px; height: 72px; font-size: 22px; } #mobileTouchControls .mtc-ok { right: 28px; } }
        `;
        document.head.appendChild(style);

        const container = document.createElement("div");
        container.id = "mobileTouchControls";
        const buttons = [
            ["up", "mtc-up", "^"],
            ["left", "mtc-left", "<"],
            ["down", "mtc-down", "v"],
            ["right", "mtc-right", ">"],
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