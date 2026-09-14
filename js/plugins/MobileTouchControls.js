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
            #mobileTouchControls { position: fixed; inset: 0; z-index: 20; pointer-events: none; touch-action: none; }
            #mobileTouchControls button { position: absolute; width: 58px; height: 58px; border: 2px solid rgba(255, 255, 255, 0.7); border-radius: 50%; background: rgba(17, 24, 39, 0.58); color: #ffffff; font: 700 16px sans-serif; pointer-events: auto; touch-action: none; -webkit-tap-highlight-color: transparent; }
            #mobileTouchControls button:active { background: rgba(14, 116, 144, 0.9); transform: scale(0.94); }
            #mobileTouchControls .mtc-up { left: 58px; bottom: 126px; }
            #mobileTouchControls .mtc-left { left: 0; bottom: 68px; }
            #mobileTouchControls .mtc-down { left: 58px; bottom: 68px; }
            #mobileTouchControls .mtc-right { left: 116px; bottom: 68px; }
            #mobileTouchControls .mtc-menu { right: 18px; top: 18px; width: 54px; height: 42px; border-radius: 8px; font-size: 12px; }
            #mobileTouchControls .mtc-ok { right: 28px; bottom: 96px; width: 68px; height: 68px; background: rgba(5, 111, 146, 0.7); }
            #mobileTouchControls .mtc-cancel { right: 100px; bottom: 48px; width: 52px; height: 52px; font-size: 14px; }
            @media (max-width: 500px) { #mobileTouchControls button { width: 52px; height: 52px; } #mobileTouchControls .mtc-up { left: 52px; bottom: 112px; } #mobileTouchControls .mtc-left { bottom: 60px; } #mobileTouchControls .mtc-down { left: 52px; bottom: 60px; } #mobileTouchControls .mtc-right { left: 104px; bottom: 60px; } #mobileTouchControls .mtc-ok { right: 22px; bottom: 84px; width: 62px; height: 62px; } #mobileTouchControls .mtc-cancel { right: 88px; bottom: 42px; } }
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