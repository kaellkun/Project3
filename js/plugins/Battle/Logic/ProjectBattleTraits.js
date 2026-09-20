/*:
 * @target MZ
 * @plugindesc 戦闘データ補完: パッシブ属性威力のKeke連携・銃威力参照
 * @author Project3
 * @orderAfter NUUN_PassiveSkill
 * @orderAfter Keke_ElementFullCustom
 * @help
 * NUUN_PassiveSkill、Keke_ElementFullCustomの後に登録してください。
 * パッシブ武器の「属性威力 / elementAtk」タグだけを、ダメージ式評価中に
 * アクター/敵のメモへ投影します。データ本体、装備一覧、能力値は変更しません。
 * 属性計算そのものはKekeに委譲します。TPタグは既存Keke_TpCustomが処理します。
 * a.projectGunPower(): 装備中の銃(wtypeId=9)の有効なGunPowerの最大値。
 * 未装備、銃以外、不正値は0。ATK/DEF、準備・弾丸・製作機構は扱いません。
 * PassiveSourceタグの専用武器は装備できません。
 */
(() => {
    "use strict";

    Game_BattlerBase.prototype.projectGunPower = function() {
        if (typeof this.weapons !== "function") return 0;
        return this.weapons().reduce((best, weapon) => {
            if (weapon.wtypeId !== 9) return best;
            const power = Number(weapon.meta?.GunPower);
            return Number.isFinite(power) && power > best ? power : best;
        }, 0);
    };

    const canEquipWeapon = Game_BattlerBase.prototype.canEquipWeapon;
    Game_BattlerBase.prototype.canEquipWeapon = function(weapon) {
        return !weapon.meta?.PassiveSource && canEquipWeapon.call(this, weapon);
    };

    // Keke's closure-local collector reads actor()/enemy(), not traitObjects().
    // Project only its supported attack tags, never the complete passive note
    // (doing so would double-count TP tags and other plugins' metadata).
    const projections = new WeakMap();
    for (const [prototype, method] of [
        [Game_Actor.prototype, "actor"], [Game_Enemy.prototype, "enemy"]
    ]) {
        const original = prototype[method];
        prototype[method] = function() {
            const data = original.call(this);
            const note = projections.get(this);
            return note ? { ...data, note: data.note + "\n" + note } : data;
        };
    }

    const evalDamageFormula = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function(target) {
        const subject = this.subject();
        const previous = projections.get(subject);
        const objects = typeof subject.passiveSkillObject === "function"
            ? subject.passiveSkillObject() : [];
        const tags = objects.filter(Boolean).flatMap(object =>
            object.note.match(/<(?:属性威力|elementAtk):[^>]*>/gi) || []
        ).join("\n");
        projections.set(subject, tags);
        try {
            return evalDamageFormula.call(this, target);
        } finally {
            if (previous === undefined) projections.delete(subject);
            else projections.set(subject, previous);
        }
    };
})();