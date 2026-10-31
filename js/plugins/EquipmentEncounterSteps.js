/*:
 * @target MZ
 * @plugindesc Equipment can extend the party's random encounter interval by two steps.
 * @author Copilot
 * @orderAfter LL_EncounterAdjust
 * @help
 * Add <EncounterStepPlusTwo> to an equipment item's note.
 * While any party member (including reserves) wears it, add two to the
 * encounter countdown after the existing random calculation. Does not stack.
 * Equipping or removing it also adjusts the current countdown on the next step.
 * Repeated equipment changes do not reset or extend the countdown.
 * Bushes, encounter-half traits, vehicles and encounter disabling are unchanged.
 * Place below LL_EncounterAdjust.
 */
(() => {
    "use strict";

    function encounterStepBonus() {
        return $gameParty.allMembers().some(actor =>
            actor.equips().some(item => item && item.meta.EncounterStepPlusTwo)
        ) ? 2 : 0;
    }

    const makeEncounterCount = Game_Player.prototype.makeEncounterCount;
    Game_Player.prototype.makeEncounterCount = function() {
        makeEncounterCount.call(this);
        this._equipmentEncounterStepBonus = encounterStepBonus();
        this._encounterCount += this._equipmentEncounterStepBonus;
    };

    const updateEncounterCount = Game_Player.prototype.updateEncounterCount;
    Game_Player.prototype.updateEncounterCount = function() {
        if (this.canEncounter()) {
            const bonus = encounterStepBonus();
            this._encounterCount += bonus - (this._equipmentEncounterStepBonus || 0);
            this._equipmentEncounterStepBonus = bonus;
        }
        updateEncounterCount.call(this);
    };
})();
