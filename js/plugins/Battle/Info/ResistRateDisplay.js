//=============================================================================
// ResistRateDisplay - selected-action preview for RPG Maker MZ
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 対象選択中の属性倍率・命中後の状態付与判定率を表示。(v1.0.0)
 * @author Project3
 * @orderAfter Keke_ElementFullCustom
 * @orderAfter NUUN_AddStateDeviation
 * @orderAfter FlexibleTopDownUI
 * @orderAfter HelpWindowThreeLines
 * @orderAfter LinearTimeBattle
 * @orderAfter BattleCommandHierarchy
 *
 * @help
 * 全戦闘プラグイン（BattleCommandHierarchyを含む）より下に登録。
 * SPD_ResistRateDisplayは不要。同時に有効にしないでください。
 * パラメータ・メモタグ・手動の属性IDリストは不要です。
 *
 * 対象選択中の現在のスキル/アイテムについてだけ実効属性倍率を開示。
 * 未知弱点一覧・図鑑・討伐数・セーブへの記録は作成しません。
 * 隔離したプレビューに現在のcalcElementRateを適用します。
 * Kekeの追加属性・複数属性計算に対応。ダメージ式は実行しません。
 * Kekeの属性威力/属性耐性メモによる式内補正・反転は対象外。
 * 表示は最終ダメージ/最終回復量ではありません。
 *
 * 状態付与はMZ/NUUN_AddStateDeviationの命中後・効果1件ごとの判定率。
 * 運、NoLuk、必中、攻撃時ステート、無効を考慮します。
 * 命中/回避/反射/身代わり/複数回命中は含みません。
 * 弱体はMZの有効度×運。最大段階では追加不可と表示します。
 * 回復の属性倍率は「弱点」と表記しません。
 *
 * FlexibleTopDownUIのskillWindowRect内に非操作の2行パネルを確保。
 * 敵リストの高さだけを減らし、行高/タッチ/戻るの処理は変更しません。
 * 狭い画面では長文を省略。最低1行の敵選択を確保できない高さでは
 * パネルを非表示にします。味方選択と重なる配置でも非表示です。
 * API: Project3ResistRateDisplay.describe(action, target)
 *      Project3ResistRateDisplay.elementIds()
 * 詳細: docs/resist-rate-display.md
 */

(() => {
    "use strict";

    const percent = rate => `${Math.round(rate * 1000) / 10}%`;
    const clampChance = n => Math.max(0, Math.min(1, n));
    const elementIds = () => ($dataSystem?.elements || [])
        .map((name, id) => ({ id, name })).filter(entry => entry.id > 0 && entry.name);

    // Do not Object.assign a live action: nested plugin flags and Game_Item would
    // remain shared. Preserve prototypes (and cycles), but copy all own storage.
    // Installed calculation/getter methods read DB data; no apply/eval/formula,
    // effects, makeActions, testApply or random calls belong on this code path.
    function copy(value, seen = new WeakMap()) {
        if (!value || typeof value !== "object") return value;
        if (seen.has(value)) return seen.get(value);
        const result = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
        seen.set(value, result);
        for (const key of Reflect.ownKeys(value)) {
            if (Array.isArray(value) && key === "length") continue;
            const descriptor = Object.getOwnPropertyDescriptor(value, key);
            if ("value" in descriptor) descriptor.value = copy(descriptor.value, seen);
            Object.defineProperty(result, key, descriptor);
        }
        return result;
    }

    function previewInputs(action, target) {
        const seen = new WeakMap();
        const preview = copy(action, seen);
        const subject = copy(action.subject(), seen);
        const item = copy(action.item(), seen);
        // Game_Action.subject and Game_Item.object normally resolve live globals.
        // Rebind these two entry points only on the disposable action.
        Object.defineProperty(preview, "subject", { value: () => subject, configurable: true });
        Object.defineProperty(preview, "item", { value: () => item, configurable: true });
        return { preview, subject, item, target: copy(target, seen) };
    }

    function elementLabel(rate, recovery) {
        if (recovery) return rate < 0 ? "回復反転" : rate === 0 ? "回復無効" :
            rate < 1 ? "回復減衰" : rate > 1 ? "回復増幅" : "回復等倍";
        return rate < 0 ? "吸収" : rate === 0 ? "無効" :
            rate < 1 ? "耐性" : rate > 1 ? "弱点" : "等倍";
    }

    function describeEffects(action, subject, target, item) {
        const result = [];
        const deviation = typeof action.certainState === "function" &&
            typeof action.isAddNormalStateMode === "function" && typeof action.noLukState === "function";
        for (const [effectIndex, effect] of (item.effects || []).entries()) {
            if (effect.code === Game_Action.EFFECT_ADD_STATE) {
                const attack = effect.dataId === 0;
                const ids = attack ? [...new Set(subject.attackStates())] : [effect.dataId];
                for (const id of ids) {
                    const state = $dataStates[id];
                    if (!state) continue;
                    const immune = target.isStateResist(id);
                    const blocked = !target.isStateAddable(id);
                    const usesResistance = deviation ?
                        (attack || action.isAddNormalStateMode(target)) && !action.certainState(target, id) :
                        attack || !action.isCertainHit();
                    const rate = target.stateRate(id);
                    const luck = usesResistance && !(deviation && action.noLukState(id)) ?
                        action.lukEffectRate(target) : 1;
                    let chance = effect.value1 * (attack ? subject.attackStatesRate(id) : 1);
                    if (usesResistance) chance *= rate * luck;
                    chance = blocked ? 0 : clampChance(chance);
                    const name = state.name || `ステート${id}`;
                    result.push({ kind: "state", effectIndex, id, name, attack, rate,
                        usesResistance, luck, immune, blocked, chance,
                        text: `${name} ${percent(chance)}（${immune ? "無効" : blocked ? "付与不可" :
                            usesResistance ? `耐性倍率${percent(rate)}` : "耐性・運無視"}）` });
                }
            } else if (effect.code === Game_Action.EFFECT_ADD_DEBUFF && effect.dataId >= 0 && effect.dataId < 8) {
                const id = effect.dataId;
                const rate = target.debuffRate(id);
                const luck = action.lukEffectRate(target);
                const blocked = !target.isAlive() || target.isMaxDebuffAffected(id);
                const chance = blocked ? 0 : clampChance(rate * luck);
                const name = `${TextManager.param(id)}弱体`;
                result.push({ kind: "debuff", effectIndex, id, name, rate, luck, blocked, chance,
                    text: `${name} ${percent(chance)}（${blocked ? "追加不可" : `耐性倍率${percent(rate)}`}）` });
            }
        }
        return result;
    }

    /** Pure for the installed MZ/Keke/NUUN chain. Never returns live game objects. */
    function describe(action, target) {
        try {
            if (!action || !target || !action.item() || !action.subject()) {
                return { valid: false, element: null, effects: [], lines: [] };
            }
            const inputs = previewInputs(action, target);
            const { preview, subject, item } = inputs;
            const victim = inputs.target;
            const damageType = item.damage?.type || 0;
            let element = null;
            if (damageType > 0 && damageType <= 6) {
                // Use the CURRENT installed implementation, never vanilla max or
                // evalDamageFormula (Keke's latter path writes _elementResultKeElfc).
                const rate = Game_Action.prototype.calcElementRate.call(preview, victim);
                if (!Number.isFinite(rate)) throw new Error("Non-finite element rate");
                const rawIds = typeof $gameTemp?.getAllElementsKe === "function" ?
                    $gameTemp.getAllElementsKe(preview) : item.damage.elementId < 0 ?
                        subject.attackElements() : [item.damage.elementId];
                const ids = [...new Set(rawIds)].filter(id => id > 0);
                const names = ids.map(id => $dataSystem.elements[id] || `属性${id}`);
                const recovery = damageType === 3 || damageType === 4;
                const label = elementLabel(rate, recovery);
                // These tags are handled inside Keke's damage-formula hook, NOT
                // calcElementRate. Warn rather than fabricate a damage prediction.
                const formulaModifiersExcluded = [...subject.traitObjects(), ...victim.traitObjects()]
                    .some(data => /<(?:属性威力|属性耐性|elementAtk|elementDef)\s*:/i.test(data?.note || ""));
                element = { rate, percent: percent(rate), label, recovery, ids, names,
                    formulaModifiersExcluded,
                    text: `属性倍率 ${label} ${percent(rate)}${formulaModifiersExcluded ? " ※式補正別" : ""}` +
                        ` [${names.join("＋") || "属性なし"}]` };
            }
            const effects = describeEffects(preview, subject, victim, item);
            const lines = [element?.text || "属性ダメージなし",
                effects.length ? `命中後: ${effects.map(effect => effect.text).join(" / ")}` :
                    "最終ダメージ・命中率ではありません"];
            return { valid: true, itemId: item.id, damageType, element, effects, lines };
        } catch (error) {
            // Fail closed: a broken/unsupported external getter must not prevent
            // target selection or accidentally leave the previous target's rates.
            return { valid: false, element: null, effects: [], error: String(error.message || error),
                lines: ["プレビュー不可", "対象選択・決定・キャンセルは通常どおり操作できます"] };
        }
    }

    const panelHeight = 80;
    function panelRect(scene) {
        const area = scene.skillWindowRect();
        const minimumList = scene.calcWindowHeight(1, true);
        return new Rectangle(area.x, area.y, area.width,
            area.height >= panelHeight + minimumList ? panelHeight : 0);
    }
    const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width &&
        a.y < b.y + b.height && b.y < a.y + a.height;

    class Window_ResistRateDetail extends Window_Base {
        constructor(rect) {
            super(rect);
            this._description = null;
            this._signature = "";
            this.hide();
        }
        lineHeight() { return 28; }
        resetFontSettings() {
            super.resetFontSettings();
            // MainFontLetterSpacing intentionally bypasses canvas maxWidth; use
            // an independent, measured font, and explicitly ellipsize narrow UI.
            this.contents.fontFace = "sans-serif";
            this.contents.fontSize = 20;
        }
        setDescription(description) {
            this._description = description;
            const signature = JSON.stringify(description.lines);
            if (signature === this._signature) return;
            this._signature = signature;
            this.contents.clear();
            this.resetFontSettings();
            description.lines.slice(0, 2).forEach((line, index) => {
                const chars = Array.from(line);
                if (this.textWidth(line) > this.innerWidth) {
                    while (chars.length && this.textWidth(chars.join("") + "…") > this.innerWidth) chars.pop();
                    line = chars.length ? chars.join("") + "…" : "";
                }
                this.drawText(line, 0, index * this.lineHeight(), this.innerWidth);
            });
        }
    }

    const enemyRect = Scene_Battle.prototype.enemyWindowRect;
    Scene_Battle.prototype.enemyWindowRect = function() {
        const rect = enemyRect.call(this);
        const panel = panelRect(this);
        if (panel.height && overlaps(rect, panel)) {
            const bottom = rect.y + rect.height;
            const top = panel.y + panel.height;
            if (bottom - top >= this.calcWindowHeight(1, true)) {
                rect.y = top;
                rect.height = bottom - top;
            }
        }
        return rect;
    };

    const createWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        createWindows.call(this);
        const rect = panelRect(this);
        this._resistRateWindow = new Window_ResistRateDetail(
            new Rectangle(rect.x, rect.y, rect.width, panelHeight));
        this.addWindow(this._resistRateWindow);
    };

    Scene_Battle.prototype.updateResistRateDisplay = function() {
        const panel = this._resistRateWindow;
        if (!panel) return;
        const enemy = this._enemyWindow;
        const actor = this._actorWindow;
        const selector = enemy?.active && enemy.visible ? enemy : actor?.active && actor.visible ? actor : null;
        const rect = panelRect(this);
        if (!selector || !rect.height || overlaps(rect, selector)) {
            panel.hide();
            panel._description = null;
            return;
        }
        if (panel.x !== rect.x || panel.y !== rect.y || panel.width !== rect.width) {
            panel.move(rect.x, rect.y, rect.width, panelHeight);
            panel.createContents();
            panel._signature = "";
        }
        const action = BattleManager.inputtingAction();
        const target = selector === enemy ? enemy.enemy() : actor.actor(actor.index());
        if (!action?.item() || !target) {
            panel.hide();
            panel._description = null;
            return;
        }
        // Recompute only the selected target, not every enemy/element. No stale
        // cache when a state, equipment, action, actor or troop member changes.
        panel.setDescription(describe(action, target));
        panel.show();
    };
    const update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        update.call(this);
        this.updateResistRateDisplay();
    };

    globalThis.Project3ResistRateDisplay = Object.freeze({ describe, elementIds, panelRect });
})();