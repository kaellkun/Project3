//=============================================================================
// RPG Maker MZ - Shield Break System
// Copyright (c) 2026 kaellkun
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 敵のシールドブレイクと、敵画像上部の弱点表示UI v1.0.0
 * @author kaellkun
 *
 * @param DefaultShield
 * @text 標準シールド数
 * @type number
 * @min 1
 * @max 999
 * @default 3
 *
 * @param DefaultWeakElements
 * @text 弱点未設定時の属性ID
 * @desc DBに弱点属性がない敵に使用。属性IDをカンマ区切りで指定。
 * @default 1
 *
 * @param BreakTurns
 * @text 標準ブレイク期間
 * @desc ターン制: 発生ターンに加え、このターン数休止。TPB: 本人のチャージ時間×この数。
 * @type number
 * @min 1
 * @max 99
 * @default 1
 *
 * @param BreakDamageRate
 * @text ブレイク中の被HPダメージ倍率
 * @type number
 * @decimals 2
 * @min 1
 * @max 100
 * @default 2
 *
 * @param RevealWeaknesses
 * @text 最初から弱点を表示
 * @type boolean
 * @default true
 *
 * @param UiOffsetY
 * @text 画像上端からの余白
 * @type number
 * @min 0
 * @max 300
 * @default 12
 *
 * @help
 * ■導入
 * 戦闘・表示変更プラグイン（Keke_SpeedStarBattle等）より下に配置。
 * 専用画像・ブレイク用ステートのDB登録は不要です。対象は敵のみ。
 *
 * ■タグなしでも動作
 * シールド3。DBの属性有効度が100%を超える属性を弱点に採用。
 * それもない敵は標準弱点属性（初期値1=物理）を採用します。
 * 弱点は最初から表示。弱点への正のHPダメージ1ヒットでシールド-1。
 * 0でBREAK、行動不能、以後のHPダメージ2倍。破壊した一撃は通常倍率。
 * 回復・ミス・回避・0ダメージ・MPダメージではシールドは減りません。
 * 連続攻撃は命中ごとに判定。複数弱点に一致しても減少は1回です。
 *
 * ■敵キャラのメモ欄（省略可、半角タグ）
 * <ShieldPoints:5>           最大シールド。0でシステム/UI対象外
 * <WeakElements:2,3,4>       弱点属性ID（システム→タイプ→属性）
 * <WeakWeapons:2,7>          弱点武器タイプID（剣・弓など）
 * <BreakTurns:1>             ブレイク期間
 * <BreakDamageRate:2.0>      ブレイク中の被HPダメージ倍率
 * <WeaknessHidden:true>      未発見弱点は「?」。falseで最初から表示
 * <ShieldUiOffsetX:0>        UI位置の横補正
 * <ShieldUiOffsetY:-16>      UI位置の縦補正（負数で上へ）
 * <WeakElements:0>           属性弱点なし（武器弱点だけにする場合など）
 * <WeakWeapons:0>            武器弱点なし
 * 弱点タグが片方でも有効なら未指定のもう片方は空です。
 * 空値・不正値のみのタグは未設定扱い。0は明示的な空リストです。
 * タグはシールド判定のみを変更し、DBの属性有効度は変更しません。
 * 通常攻撃属性(-1)は攻撃者の攻撃属性を参照。武器弱点は、アクターの
 * 通常攻撃属性(-1)の攻撃が対象で、装備中の武器タイプを参照します。
 *
 * ■スキル・アイテムのメモ欄
 * <ShieldDamage:2>           1ヒットのシールド減少量（0で減少なし）
 * <ShieldPierce>             弱点でなくてもシールドを削る
 * <RevealWeaknesses>         命中時に対象の全弱点を公開（分析用）
 * 弱点発見は敵個体ごと、その戦闘内のみ。ブレイク中も発見できます。
 *
 * ■期間と互換性
 * ターン制: 発生ターンの残り＋指定ターン休止し、終了時に全回復。
 * TPB: 本人の通常チャージ時間×指定数のあいだ休止し、全回復後は
 * チャージ0から再開。ウェイトTPBの入力停止・戦闘速度に追従します。
 * ブレイクで未実行行動を破棄。Kekeの遅延中の攻撃も無効にします。
 * 戦闘不能・復活・変身・戦闘終了時はシールド/ブレイクをリセット。
 * UIは敵画像の上端に追従。画面端で補正し、通常のステートアイコン
 * があるときはその上に表示。近接した敵は敵別の位置タグで調整。
 * 詳細と例: docs/shield-break-system.md
 */

(() => {
    "use strict";

    const parameters = PluginManager.parameters("ShieldBreakSystem");
    function number(value, fallback, min, max, integer = false) {
        if (value === undefined || value === null || typeof value === "boolean" ||
            String(value).trim() === "") return fallback;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        const bounded = Math.max(min, Math.min(max, parsed));
        return integer ? Math.floor(bounded) : bounded;
    }
    function flag(value, fallback = false) {
        if (value === true || String(value).trim().toLowerCase() === "true") return true;
        if (value === false || String(value).trim().toLowerCase() === "false") return false;
        return fallback;
    }
    function ids(value, names) {
        if (typeof value !== "string" || !value.trim()) return null;
        if (value.trim() === "0") return [];
        const list = [...new Set(value.split(/[,、\s]+/).map(Number))]
            .filter(id => Number.isInteger(id) && id > 0 && !!names[id]);
        return list.length ? list : null;
    }
    const defaults = {
        shield: number(parameters.DefaultShield, 3, 1, 999, true),
        turns: number(parameters.BreakTurns, 1, 1, 99, true),
        rate: number(parameters.BreakDamageRate, 2, 1, 100),
        reveal: flag(parameters.RevealWeaknesses, true),
        gap: number(parameters.UiOffsetY, 12, 0, 300)
    };

    Game_Enemy.prototype.resetShieldBreak = function() {
        const meta = this.enemy().meta || {};
        let elements = ids(meta.WeakElements, $dataSystem.elements);
        const weapons = ids(meta.WeakWeapons, $dataSystem.weaponTypes);
        if (elements === null && weapons === null) {
            elements = $dataSystem.elements.map((name, id) => id)
                .filter(id => id > 0 && $dataSystem.elements[id] && this.elementRate(id) > 1);
            if (!elements.length) {
                elements = ids(parameters.DefaultWeakElements, $dataSystem.elements) ||
                    ids("1", $dataSystem.elements) || [];
            }
        }
        this._sbConfig = {
            max: number(meta.ShieldPoints, defaults.shield, 0, 999, true),
            turns: number(meta.BreakTurns, defaults.turns, 1, 99, true),
            rate: number(meta.BreakDamageRate, defaults.rate, 1, 100),
            hidden: flag(meta.WeaknessHidden, !defaults.reveal),
            x: number(meta.ShieldUiOffsetX, 0, -2000, 2000),
            y: number(meta.ShieldUiOffsetY, 0, -2000, 2000)
        };
        this._sbWeaknesses = [
            ...(elements || []).map(id => ({ key: `e${id}`, id, kind: "element" })),
            ...(weapons || []).map(id => ({ key: `w${id}`, id, kind: "weapon" }))
        ];
        this._sbKnown = [];
        this._sbShield = this._sbConfig.max;
        this._sbBreakRemaining = 0;
        this._sbBreakProgress = 0;
        this._sbBreakTurn = -1;
        this._sbActionEpoch = (this._sbActionEpoch || 0) + 1;
        this._sbUiRevision = (this._sbUiRevision || 0) + 1;
    };

    Game_Enemy.prototype.shieldPoints = function() {
        return this._sbShield || 0;
    };
    Game_Enemy.prototype.isShieldBroken = function() {
        return this._sbBreakRemaining > 0;
    };
    Game_Enemy.prototype.revealShieldWeaknesses = function(keys) {
        for (const key of keys) {
            if (!this._sbKnown.includes(key)) {
                this._sbKnown.push(key);
                this._sbUiRevision++;
            }
        }
    };
    Game_Enemy.prototype.damageShield = function(amount) {
        if (!this._sbConfig || !this._sbConfig.max || !this.isAlive() ||
            this.isShieldBroken() || amount <= 0) return;
        this._sbShield = Math.max(0, this._sbShield - amount);
        this._sbUiRevision++;
        if (this._sbShield === 0) {
            this._sbBreakRemaining = this._sbConfig.turns;
            this._sbBreakProgress = 0;
            this._sbBreakTurn = $gameTroop.turnCount();
            this._sbActionEpoch++;
            this.clearActions();
            this.clearTpbChargeTime();
            this._tpbCastTime = 0;
            this._tpbIdleTime = 0;
            this._tpbTurnEnd = false;
            this.requestEffect("blink");
        }
    };

    for (const name of ["setup", "transform", "revive", "onBattleEnd"]) {
        const original = Game_Enemy.prototype[name];
        Game_Enemy.prototype[name] = function() {
            const result = original.apply(this, arguments);
            if (this._enemyId > 0) this.resetShieldBreak();
            return result;
        };
    }
    // Death resets after the original refresh, without interfering with death states.
    const enemyDie = Game_Enemy.prototype.die;
    Game_Enemy.prototype.die = function() {
        enemyDie.apply(this, arguments);
        if (this._sbConfig) this.resetShieldBreak();
    };
    const restriction = Game_Enemy.prototype.restriction;
    Game_Enemy.prototype.restriction = function() {
        return this.isShieldBroken() ? 4 : restriction.apply(this, arguments);
    };
    const onTurnEnd = Game_Enemy.prototype.onTurnEnd;
    Game_Enemy.prototype.onTurnEnd = function() {
        onTurnEnd.apply(this, arguments);
        if (!this.isShieldBroken()) return;
        if (!BattleManager.isTpb() && $gameTroop.turnCount() <= this._sbBreakTurn) return;
        this._sbBreakRemaining--;
        this._sbUiRevision++;
        if (!this.isShieldBroken()) {
            this._sbShield = this._sbConfig.max;
            this.clearTpbChargeTime();
            this._tpbIdleTime = 0;
            this._tpbTurnEnd = false;
        }
    };
    const updateTpb = Game_Enemy.prototype.updateTpb;
    Game_Enemy.prototype.updateTpb = function() {
        if (!this.isShieldBroken()) return updateTpb.apply(this, arguments);
        if (!this.isAlive()) return;
        // Only called by the engine while TPB time is active. Do not advance
        // the ordinary charge/cast/idle clocks or enqueue empty actions here.
        this._sbBreakProgress += this.tpbAcceleration();
        if (this._sbBreakProgress >= 1) {
            this._sbBreakProgress -= 1;
            this.onTurnEnd();
            this._tpbTurnCount++;
        }
    };

    const startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        const action = this._subject && this._subject.currentAction();
        if (action) action._sbActionEpoch = this._subject._sbActionEpoch || 0;
        return startAction.apply(this, arguments);
    };
    const invokeAction = BattleManager.invokeAction;
    BattleManager.invokeAction = function(subject, target) {
        // Keke restores the delayed action into _action before invoking it.
        // Epochs prevent an already launched attack returning after recovery.
        if (subject && subject.isEnemy() &&
            (subject.isShieldBroken() || (this._action &&
                this._action._sbActionEpoch !== undefined &&
                this._action._sbActionEpoch !== subject._sbActionEpoch))) return;
        return invokeAction.apply(this, arguments);
    };

    function enabledEnemy(target) {
        return target.isEnemy() && target._sbConfig && target._sbConfig.max > 0;
    }
    function matchingWeaknesses(action, target) {
        const elementId = action.item().damage.elementId;
        const subject = action.subject();
        const elements = elementId < 0 ? subject.attackElements() : [elementId];
        const weapons = elementId < 0 && subject.isActor() ?
            subject.weapons().map(weapon => weapon.wtypeId) : [];
        return target._sbWeaknesses.filter(weakness =>
            (weakness.kind === "element" ? elements : weapons).includes(weakness.id));
    }
    const makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        const value = makeDamageValue.apply(this, arguments);
        return enabledEnemy(target) && target.isShieldBroken() && this.isHpEffect() && value > 0 ?
            Math.round(value * target._sbConfig.rate) : value;
    };
    const apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        apply.apply(this, arguments);
        if (this._isTempApplyKe || target._isTempKe || !enabledEnemy(target)) return;
        const result = target.result();
        if (!result.isHit()) return;
        const meta = this.item().meta || {};
        if (flag(meta.RevealWeaknesses)) {
            target.revealShieldWeaknesses(target._sbWeaknesses.map(weakness => weakness.key));
        }
        if (!this.isHpEffect() || ![1, 5].includes(this.item().damage.type) ||
            !result.hpAffected || result.hpDamage <= 0) return;
        const matches = matchingWeaknesses(this, target);
        target.revealShieldWeaknesses(matches.map(weakness => weakness.key));
        if (matches.length || flag(meta.ShieldPierce)) {
            target.damageShield(number(meta.ShieldDamage, 1, 0, 999, true));
        }
    };

    // A separate scene layer avoids inheriting enemy hue, blink, collapse,
    // shake scale or state icon filters. Only positions follow the enemy.
    class Sprite_ShieldBreakPanel extends Sprite {
        constructor(enemySprite) {
            super();
            this._enemySprite = enemySprite;
            this._revision = -1;
            this._enemy = null;
            this._flash = 0;
        }

        update() {
            super.update();
            const source = this._enemySprite;
            const enemy = source._enemy;
            this.visible = !!(enemy && enabledEnemy(enemy) && enemy.isAlive() &&
                source.visible && source.opacity > 0 && source.bitmap && source.bitmap.isReady());
            if (!this.visible) return;
            if (enemy !== this._enemy || this._revision !== enemy._sbUiRevision) {
                this._flash = this._enemy === enemy ? 24 : 0;
                this._enemy = enemy;
                this._revision = enemy._sbUiRevision;
                this.redraw();
            }
            if (this._flash > 0) this._flash--;
            this.setBlendColor([255, 211, 125, this._flash * 3]);
            this.updatePosition();
        }

        updatePosition() {
            const source = this._enemySprite;
            const enemy = this._enemy;
            const gauge = source._battlerHp;
            if (gauge && gauge.bitmap) {
                const center = gauge.toGlobal(new PIXI.Point(0, 0));
                const local = this.parent.toLocal(center);
                const origin = this.parent.toLocal(new PIXI.Point(0, 0));
                const edge = this.parent.toLocal(new PIXI.Point(Graphics.width, Graphics.height));
                this.x = Math.round(Math.max(origin.x + 4, Math.min(
                    local.x - this.bitmap.width / 2,
                    edge.x - this.bitmap.width - 4)));
                this.y = Math.round(Math.max(origin.y + 4, Math.min(
                    local.y + defaults.gap,
                    edge.y - this.bitmap.height - 4)));
                return;
            }
            const top = source.toGlobal(new PIXI.Point(0, -source.bitmap.height * source.anchor.y));
            // Leave the standard state icon unobstructed, including its top-edge clamp.
            if (enemy.allIcons().length && source._stateIconSprite) {
                const icon = source._stateIconSprite.toGlobal(new PIXI.Point(0, -ImageManager.iconHeight / 2));
                top.y = Math.min(top.y, icon.y);
            }
            const local = this.parent.toLocal(top);
            const origin = this.parent.toLocal(new PIXI.Point(0, 0));
            const edge = this.parent.toLocal(new PIXI.Point(Graphics.width, Graphics.height));
            this.x = Math.round(Math.max(origin.x + 4, Math.min(
                local.x - this.bitmap.width / 2 + enemy._sbConfig.x,
                edge.x - this.bitmap.width - 4)));
            this.y = Math.round(Math.max(origin.y + 4, Math.min(
                local.y - this.bitmap.height - defaults.gap + enemy._sbConfig.y,
                edge.y - this.bitmap.height - 4)));
        }

        redraw() {
            const enemy = this._enemy;
            const broken = enemy.isShieldBroken();
            const accent = broken ? "#ff7a55" : "#e9ca83";
            const probe = this.bitmap || new Bitmap(1, 1);
            probe.fontFace = "sans-serif";
            probe.fontSize = 13;
            const chips = [];
            if (broken) chips.push({ label: "BREAK", style: "break" });
            for (const weakness of enemy._sbWeaknesses) {
                const known = !enemy._sbConfig.hidden || enemy._sbKnown.includes(weakness.key);
                const weapon = weakness.kind === "weapon";
                const name = (weapon ? $dataSystem.weaponTypes : $dataSystem.elements)[weakness.id] || "";
                chips.push({
                    label: known ? name.replace(/[（(].*$/, "").trim() || "?" : "?",
                    style: known ? (weapon ? "weapon" : "element") : "unknown"
                });
            }
            // Flow layout: pills wrap to the right of the shield, Octopath style.
            const chipH = 22, gap = 3, flowX = 44, maxFlow = 180;
            const rows = [[]];
            let rowW = 0;
            for (const chip of chips) {
                chip.w = Math.max(chipH, Math.ceil(probe.measureTextWidth(chip.label)) + 16);
                if (rowW > 0 && rowW + gap + chip.w > maxFlow) {
                    rows.push([]);
                    rowW = 0;
                }
                chip.x = flowX + (rowW > 0 ? rowW + gap : 0);
                rowW = chip.x - flowX + chip.w;
                chip.row = rows.length - 1;
                rows[rows.length - 1].push(chip);
            }
            const flowW = Math.max(0, ...rows.map(row => row.length ? row[row.length - 1].x + row[row.length - 1].w - flowX : 0));
            const flowH = rows[0].length ? rows.length * (chipH + gap) - gap : 0;
            const width = flowW ? flowX + flowW + 2 : 46;
            const height = Math.max(46, flowH + 2);
            if (probe !== this.bitmap) probe.destroy();
            if (!this.bitmap || this.bitmap.width !== width || this.bitmap.height !== height) {
                if (this.bitmap) this.bitmap.destroy();
                this.bitmap = new Bitmap(width, height);
            }
            const bitmap = this.bitmap;
            bitmap.clear();
            // A compact UI font must not inherit MainFontLetterSpacing's
            // fixed negative spacing, which is tuned for larger window text.
            bitmap.fontFace = "sans-serif";
            bitmap.outlineWidth = 0;
            const context = bitmap.context;

            // Original vector shield; no external artwork or icon dependency.
            const shieldY = Math.floor((height - 36) / 2);
            context.save();
            context.beginPath();
            context.moveTo(4, shieldY + 4);
            context.lineTo(34, shieldY + 4);
            context.lineTo(32, shieldY + 24);
            context.lineTo(19, shieldY + 34);
            context.lineTo(6, shieldY + 24);
            context.closePath();
            context.fillStyle = broken ? "rgba(96, 30, 24, 0.92)" : "rgba(20, 38, 66, 0.92)";
            context.fill();
            context.strokeStyle = accent;
            context.lineWidth = 2;
            context.stroke();
            context.restore();
            bitmap.fontSize = 16;
            bitmap.fontBold = true;
            bitmap.textColor = "#ffffff";
            bitmap.drawText(String(enemy.shieldPoints()), 2, shieldY + 3, 36, 26, "center");
            bitmap.fontBold = false;

            const flowTop = Math.floor((height - flowH) / 2);
            for (const chip of chips) {
                const y = flowTop + chip.row * (chipH + gap);
                const fill = { break: accent, element: "rgba(14, 22, 38, 0.88)",
                    weapon: "rgba(14, 22, 38, 0.88)", unknown: "rgba(30, 34, 44, 0.8)" }[chip.style];
                const ring = { break: accent, element: accent, weapon: "#9fd0ee", unknown: "#6b7486" }[chip.style];
                context.save();
                context.beginPath();
                const r = chipH / 2;
                context.moveTo(chip.x + r, y);
                context.lineTo(chip.x + chip.w - r, y);
                context.arc(chip.x + chip.w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
                context.lineTo(chip.x + r, y + chipH);
                context.arc(chip.x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
                context.closePath();
                context.fillStyle = fill;
                context.fill();
                context.strokeStyle = ring;
                context.lineWidth = 1.5;
                context.stroke();
                context.restore();
                bitmap.fontSize = 11;
                bitmap.fontBold = chip.style === "break";
                bitmap.textColor = { break: "#2a1410", element: "#fff1ca",
                    weapon: "#e6f4ff", unknown: "#98a3b8" }[chip.style];
                bitmap.drawText(chip.label, chip.x, y, chip.w, chipH, "center");
            }
            bitmap.fontBold = false;
        }

        destroy(options) {
            if (this.bitmap) {
                this.bitmap.destroy();
                this.bitmap = null;
            }
            super.destroy(options);
        }
    }

    const createSpriteset = Scene_Battle.prototype.createSpriteset;
    Scene_Battle.prototype.createSpriteset = function() {
        createSpriteset.apply(this, arguments);
        this._shieldBreakLayer = new Sprite();
        this.addChild(this._shieldBreakLayer);
        for (const sprite of this._spriteset._enemySprites) {
            this._shieldBreakLayer.addChild(new Sprite_ShieldBreakPanel(sprite));
        }
    };
})();