//=============================================================================
// RPG Maker MZ - Encounter Step Display
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Displays the remaining encounter steps in the top-right corner of the map.
 * @author Copilot
 *
 * @help EncounterStepDisplay.js
 *
 * Shows the current number of steps remaining until a random encounter.
 * Maps without random encounters display "対象外".
 */

(() => {
    "use strict";

    class Window_EncounterStepDisplay extends Window_Base {
        initialize() {
            const width = 276;
            const height = 88;
            const x = Math.max(0, Graphics.width - width - 8);
            super.initialize(new Rectangle(x, 8, width, height));
            this.setBackgroundType(1);
            this._displayedSteps = this.displayedSteps();
            this.refresh();
        }

        update() {
            super.update();
            this.x = Math.max(0, Graphics.width - this.width - 8);
            const steps = this.displayedSteps();
            if (steps !== this._displayedSteps) {
                this._displayedSteps = steps;
                this.refresh();
            }
        }

        displayedSteps() {
            if ($gameMap.encounterStep() <= 0 || $gameMap.encounterList().length === 0) {
                return "対象外";
            }
            return String(Math.max(0, Math.ceil($gamePlayer._encounterCount)));
        }

        refresh() {
            this.contents.clear();
            this.resetFontSettings();
            this.contents.fontSize = 18;
            this.drawText("現在のエンカウント歩数", 0, 0, this.innerWidth, "center");
            const value = this._displayedSteps === "対象外"
                ? this._displayedSteps
                : `あと ${this._displayedSteps} 歩`;
            this.drawText(value, 0, 28, this.innerWidth, "center");
        }
    }

    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this._encounterStepDisplayWindow = new Window_EncounterStepDisplay();
        this.addChild(this._encounterStepDisplayWindow);
    };
})();
