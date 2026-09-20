/*:
 * @target MZ
 * @plugindesc v1.0 次の攻撃の準備ボーナスを行動単位で加算・消費
 * @author Project3
 * @orderAfter Keke_SpeedStarBattle
 * @orderAfter NRP_ChainSkill
 * @orderAfter StateAddMZ
 * @orderAfter CustomizeCritical
 * @orderAfter RIT_SucHitEva
 * @help
 * パラメータなし。上記プラグインより下、ShieldBreakSystemより上に配置。
 * ステート: <PrepBonus:1.5> / <TakenBonus:1> （倍率ではなく加算値）
 * 条件: <PrepSkillIds:1,2> <PrepElements:2,3> <PrepHitTypes:1,2>
 * 敵側は TakenSkillIds / TakenElements / TakenHitTypes。同種条件はOR、条件間はAND。
 * <PrepConsume:false> / <TakenConsume:false> で消費なし（既定はtrue）。
 * <PrepCertainHit> <PrepCritical> <PrepCriticalBonus:0.3> もPrep条件に従う。
 * 会心不可のスキルは会心を許可しない。PrepCritical単独では消費もしない。
 * 対象はHP/MPダメージ・吸収のスキルのみ。回復、支援、アイテムは対象外。
 * 同一Game_Actionの全対象・全リピートに有効。外れ・0ダメージでも消費。
 * Kekeのキュー投入を攻撃試行と扱う。投入前キャンセルは消費しない。
 * 反撃・反射されても元の攻撃の準備は消費。連結先は別のGame_Action。
 * 公開preview: action.preparationRate(target), preparationCriticalChance(target),
 * preparationCertainHit()。いずれも純粋な照会で、予約・消費しない。
 * ダメージ式への倍率追加は不要（二重適用禁止）。calcElementRateは変更しない。
 * 通常のATK/MATバフ、属性耐性、会心倍率は変更しない。
 */
(() => {
    "use strict";

    // Weak keys deliberately outlive endAction: Keke can still hold this exact action
    // in several target queues, and ChainSkill can finish a different action first.
    // No cleanup hook can prematurely drop a snapshot or erase a reapplied state.
    const snapshots = new WeakMap();
    const own = (o, key) => Object.prototype.hasOwnProperty.call(o, key);
    const flag = value => value !== undefined && value !== false && value !== "false";
    const number = value => typeof value === "boolean" || value === "" ? 0 :
        (Number.isFinite(Number(value)) ? Number(value) : 0);
    const meta = state => state.meta || {};
    const attack = action => !!action.item() && action.isSkill() &&
        [1, 2, 5, 6].includes(action.item().damage.type);
    const temporary = (action, target) => action._isTempApplyKe || target?._isTempKe;

    function filter(value, candidates) {
        if (value === undefined) return true;
        if (typeof value !== "string" || !value.trim()) return false;
        const ids = value.split(",").map(s => s.trim()).filter(Boolean).map(Number);
        return candidates.some(id => ids.includes(id));
    }

    function matches(action, m, prefix) {
        if (!attack(action)) return false;
        const item = action.item();
        const elements = item.damage.elementId < 0 ? action.subject().attackElements() :
            [item.damage.elementId];
        return filter(m[prefix + "SkillIds"], [item.id]) &&
            filter(m[prefix + "Elements"], elements) &&
            filter(m[prefix + "HitTypes"], [item.hitType]);
    }

    function entries(action, battler, prefix) {
        if (!battler || !attack(action)) return [];
        // Deduplicate IDs even when another state extension supplies duplicates.
        return [...new Set(battler.states())].flatMap(state => {
            const m = meta(state);
            if (!matches(action, m, prefix)) return [];
            const criticalAllowed = action.item().damage.critical;
            const hasBonus = own(m, prefix + "Bonus") &&
                m[prefix + "Bonus"] !== true && Number.isFinite(Number(m[prefix + "Bonus"]));
            const certain = prefix === "Prep" && flag(m.PrepCertainHit);
            const critical = prefix === "Prep" && criticalAllowed && flag(m.PrepCritical);
            const criticalBonus = prefix === "Prep" && criticalAllowed ? number(m.PrepCriticalBonus) : 0;
            if (!hasBonus && !certain && !critical && !criticalBonus) return [];
            return [{ id: state.id, bonus: hasBonus ? number(m[prefix + "Bonus"]) : 0,
                certain, critical, criticalBonus,
                consume: m[prefix + "Consume"] !== "false" && m[prefix + "Consume"] !== false }];
        });
    }

    function outgoing(action) {
        return snapshots.get(action)?.prep ?? entries(action, action.subject(), "Prep");
    }

    function incoming(action, target) {
        return snapshots.get(action)?.taken.get(target) ?? entries(action, target, "Taken");
    }

    function consume(battler, list) {
        for (const entry of list) if (entry.consume) battler.removeState(entry.id);
    }

    function attempt(action, target) {
        if (!attack(action) || temporary(action, target)) return;
        let snapshot = snapshots.get(action);
        // Capture both sides before removing anything, including self-targeted
        // attacks where one state supplies both PrepBonus and TakenBonus.
        const taken = target && !snapshot?.taken.has(target) ? entries(action, target, "Taken") : null;
        if (!snapshot) {
            snapshot = { prep: entries(action, action.subject(), "Prep"), taken: new WeakMap() };
            snapshots.set(action, snapshot);
            consume(action.subject(), snapshot.prep);
        }
        if (taken) {
            snapshot.taken.set(target, taken);
            consume(target, taken);
        }
    }

    Game_Action.prototype.preparationRate = function(target) {
        if (!attack(this)) return 1;
        return Math.max(0, 1 + [...outgoing(this), ...incoming(this, target)]
            .reduce((sum, entry) => sum + entry.bonus, 0));
    };

    Game_Action.prototype.preparationCertainHit = function() {
        return attack(this) && outgoing(this).some(entry => entry.certain);
    };

    function adjustCritical(action, target, base) {
        if (!attack(action) || !action.item().damage.critical) return base;
        const list = outgoing(action);
        if (list.some(entry => entry.critical)) return 1;
        return Math.max(0, Math.min(1, base + list.reduce((n, e) => n + e.criticalBonus, 0) *
            (1 - target.cev)));
    }

    // Independent of CustomizeCritical's destructive itemCri queue reads.
    Game_Action.prototype.preparationCriticalChance = function(target) {
        if (!this.item()?.damage.critical) return 0;
        let base = this.subject().cri * (1 - target.cev);
        if (typeof PluginManagerEx !== "undefined" && this.judgeCritical) {
            const change = PluginManagerEx.findMetaValue(this.item(), ["CC確率変更", "CCProbChange"]);
            const add = PluginManagerEx.findMetaValue(this.item(), ["CC確率加算", "CCProbAdd"]);
            base = change ? number(change) / 100 : base + number(add) / 100;
        }
        return adjustCritical(this, target, base);
    };

    const invokeAction = BattleManager.invokeAction;
    BattleManager.invokeAction = function(subject, target) {
        const action = this._action;
        if (action) attempt(action, target);
        const queue = action?._criticalQueue;
        const length = queue?.length;
        const scheduling = typeof $gameTemp.getAnimeSpeedKeSpsb === "function" &&
            !$gameSystem._noSpeedStarKe && !this._invokePopWaitKe;
        try {
            return invokeAction.apply(this, arguments);
        } finally {
            // A counter never calls apply on the original action. Its pre-rolled
            // critical slot still belongs to this attempt, not the next target.
            if (!scheduling && length && queue.length === length) queue.shift();
        }
    };

    const apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        // Covers ordinary counterattacks (new action, no startAction/invokeAction),
        // substituted targets, reflected recipients and scripted real applications.
        attempt(this, target);
        const queue = this._criticalQueue;
        const length = queue?.length;
        const preview = temporary(this, target);
        const savedQueue = preview && queue ? queue.slice() : null;
        try {
            return apply.apply(this, arguments);
        } finally {
            if (savedQueue) queue.splice(0, queue.length, ...savedQueue);
            // MZ does not call itemCri on a miss. Advance CustomizeCritical's
            // pre-roll on that path too, otherwise different target CEVs drift.
            if (!preview && length && queue.length === length) queue.shift();
        }
    };

    const evalDamageFormula = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function(target) {
        const value = evalDamageFormula.apply(this, arguments);
        // Before variance/rounding, after the raw formula: heals remain untouched.
        return attack(this) && value > 0 ? value * this.preparationRate(target) : value;
    };

    const itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        return this.preparationCertainHit() ? 1 : itemHit.apply(this, arguments);
    };
    const itemEva = Game_Action.prototype.itemEva;
    Game_Action.prototype.itemEva = function(target) {
        return this.preparationCertainHit() ? 0 : itemEva.apply(this, arguments);
    };

    const itemCri = Game_Action.prototype.itemCri;
    Game_Action.prototype.itemCri = function(target) {
        const queued = this._criticalQueue?.length > 0;
        const base = itemCri.apply(this, arguments);
        // CustomizeCritical already rolled the adjusted probability at startAction.
        return queued ? base : adjustCritical(this, target, base);
    };
    if (Game_Action.prototype.judgeCritical) {
        const judgeCritical = Game_Action.prototype.judgeCritical;
        Game_Action.prototype.judgeCritical = function(target) {
            const length = this._criticalQueue.length;
            judgeCritical.apply(this, arguments);
            if (this._criticalQueue.length > length && outgoing(this).some(e => e.critical || e.criticalBonus)) {
                this._criticalQueue[length] = Math.random() < this.preparationCriticalChance(target);
            }
        };
    }

    const resetStateCounts = Game_BattlerBase.prototype.resetStateCounts;
    Game_BattlerBase.prototype.resetStateCounts = function(stateId) {
        const m = meta($dataStates[stateId]);
        const managed = ["PrepBonus", "TakenBonus", "PrepCertainHit", "PrepCritical", "PrepCriticalBonus"]
            .some(key => own(m, key));
        // Let StateAddMZ apply skill-specific extra turns, but never add the old turns.
        if (managed) delete this._stateTurns[stateId];
        return resetStateCounts.apply(this, arguments);
    };
})();