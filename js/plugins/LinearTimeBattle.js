//=============================================================================
// LinearTimeBattle - RPG Maker MZ
//=============================================================================
/*:
 * @target MZ
 * @plugindesc 素早さ比例のATBと、敵味方の画像付き行動順予測。(v1.0.0)
 * @author kaellkun
 * @orderAfter Keke_SpeedStarBattle
 * @orderAfter FlexibleTopDownUI
 * @orderAfter HelpWindowThreeLines
 *
 * @param ReferenceAgility
 * @text 基準の素早さ
 * @type number
 * @min 1
 * @default 100
 *
 * @param ChargeFrames
 * @text 基準の充填フレーム数
 * @desc 基準の素早さでゲージが満タンになる時間。60フレーム≒1秒。既存の高速化倍率は別途適用。
 * @type number
 * @min 1
 * @default 120
 *
 * @param PauseDuringInput
 * @text 入力中も全員の時間を停止
 * @desc ONなら入力時間による行動頻度の差をなくします。OFFでもDBのウェイト設定は維持。
 * @type boolean
 * @default true
 *
 * @param ShowTimeline
 * @text 行動順を表示
 * @type boolean
 * @default true
 *
 * @param PreviewCount
 * @text 予測する行動数
 * @type number
 * @min 2
 * @max 16
 * @default 8
 *
 * @help
 * 戦闘・UI変更プラグインより下に配置してください。
 * DBの戦闘システムがTPB（アクティブ/ウェイト）の場合のみ適用します。
 * ターン制の戦闘、データベースの素早さ自体は変更しません。
 *
 * 充填速度 = max(素早さ, 1) / 基準の素早さ / 基準の充填フレーム数。
 * 開始ゲージは全員0（先制/不意打ち側は満タン）。ランダムなし。
 * スキル/アイテムの速度補正による詠唱待ちは無効になります。
 * 行動演出・行動待ち中は全員の充填を停止し、端数時間を保ちます。
 * 同時到着は素早さ順、同速なら味方の並び順→敵グループ順です。
 * 素早さ200対100なら、200側→200側→100側の順で開始します。
 *
 * 「入力中も全員の時間を停止」をOFFにし、DBをアクティブにすると
 * 入力中も時間が進みます。入力の遅さによる行動回数の減少が生じます。
 * 反撃・強制行動・行動回数追加・行動不能は通常のMZ仕様を維持します。
 * 2倍は行動機会の頻度であり、スキルの攻撃ヒット数ではありません。
 *
 * UI: 左から現在/次の行動順。青=味方の顔、赤=敵の戦闘画像。
 * 同じキャラも複数表示し、2回行動などが分かるようにします。
 * 名前と敵のA/B表記で同じ画像の敵も区別できます。
 * 未来の速度変更・死亡・復活・行動不能解除・強制行動は予測不能です。
 * 予測は現時点の状態から計算し、毎回更新します。
 *
 * Keke_SpeedStarBattleのゲージ高速化を維持します。
 * FlexibleTopDownUIの上部コマンド/下部ヘルプ配置に対応します。
 * 既存セーブ使用可。新しい画像の用意は不要です。
 */

(() => {
    "use strict";
    const params = PluginManager.parameters("LinearTimeBattle");
    const number = (key, fallback, min, max) => {
        const n = Number(params[key]);
        return params[key] && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
    };
    const referenceAgility = number("ReferenceAgility", 100, 1, 999999);
    const chargeFrames = number("ChargeFrames", 120, 1, 999999);
    const pauseInput = params.PauseDuringInput !== "false";
    const showTimeline = params.ShowTimeline !== "false";
    const previewCount = Math.floor(number("PreviewCount", 8, 2, 16));
    const agility = battler => Math.max(1, Number(battler.agi) || 1);
    const enabled = () => BattleManager.isTpb();
    const eligible = battler => battler.isBattleMember() && battler.isAlive() && battler.canMove();
    const compare = (a, b) => {
        const difference = a.time - b.time;
        return Math.abs(difference) > 1e-8 ? difference :
            agility(b.battler) - agility(a.battler) || a.index - b.index;
    };

    const originalSpeed = Game_Battler.prototype.tpbSpeed;
    Game_Battler.prototype.tpbSpeed = function() {
        return enabled() ? agility(this) : originalSpeed.call(this);
    };
    const originalRelativeSpeed = Game_Battler.prototype.tpbRelativeSpeed;
    Game_Battler.prototype.tpbRelativeSpeed = function() {
        return enabled() ? agility(this) / referenceAgility : originalRelativeSpeed.call(this);
    };
    // Keep already installed acceleration multipliers (including Keke), but use
    // a fixed reference instead of the fastest party member or active/wait mode.
    const originalAcceleration = Game_Battler.prototype.tpbAcceleration;
    Game_Battler.prototype.tpbAcceleration = function() {
        const value = originalAcceleration.call(this);
        return enabled() ? value * $gameParty.tpbReferenceTime() / chargeFrames : value;
    };
    const originalCast = Game_Battler.prototype.tpbRequiredCastTime;
    Game_Battler.prototype.tpbRequiredCastTime = function() {
        return enabled() ? 0 : originalCast.call(this);
    };
    const originalInit = Game_Battler.prototype.initTpbChargeTime;
    Game_Battler.prototype.initTpbChargeTime = function(advantageous) {
        if (!enabled()) return originalInit.call(this, advantageous);
        this._tpbState = "charging";
        this._tpbChargeTime = advantageous && !this.isRestricted() ? 1 : 0;
    };

    // A single shared clock step, limited to the next arrival. Only one tied
    // battler is released per step, so party iteration order cannot win ties.
    // The frame is sampled before updates: input/auto-fast changes cannot give
    // different multipliers to the actors and enemies within the same step.
    let clock = null;
    const originalUpdateTpb = BattleManager.updateTpb;
    BattleManager.updateTpb = function() {
        if (!enabled()) return originalUpdateTpb.call(this);
        const members = this.allBattleMembers().filter(eligible);
        const pending = this._subject || this._actionBattlers.some(eligible) ||
            members.some(b => ["casting", "ready", "acting"].includes(b._tpbState) ||
                ((pauseInput || !this.isActiveTpb()) && b.isTpbCharged()));
        const entries = members.filter(b => b._tpbState === "charging").map((battler, index) => {
            const rate = battler.tpbAcceleration();
            return { battler, index, rate,
                time: rate > 0 ? Math.max(0, 1 - battler.tpbChargeTime()) / rate : Infinity };
        });
        entries.sort(compare);
        const next = entries[0];
        const step = pending ? 0 : Math.min(1, next ? next.time : 1);
        clock = { rates: new Map(entries.map(e => [e.battler, e.rate * step])),
            idleRates: new Map(this.allBattleMembers().filter(b => b.isAlive()).map(b =>
                [b, b.tpbAcceleration() * step])),
            winner: !pending && next && next.time <= 1 + 1e-8 ? next.battler : null };
        try {
            originalUpdateTpb.call(this);
        } finally {
            clock = null;
        }
    };
    const originalCharge = Game_Battler.prototype.updateTpbChargeTime;
    Game_Battler.prototype.updateTpbChargeTime = function() {
        if (!enabled() || !clock) return originalCharge.call(this);
        if (this._tpbState !== "charging") return;
        this._tpbChargeTime = Math.min(1, this._tpbChargeTime + (clock.rates.get(this) || 0));
        if (clock.winner === this) {
            this._tpbChargeTime = 1;
            this.onTpbCharged();
        }
    };

    // Idle time drives input timeout and recovery turns for immobile battlers.
    // It must use the same clock; otherwise an active-mode paused input times
    // out, or a long animation silently consumes paralysis/sleep turns.
    const originalIdle = Game_Battler.prototype.updateTpbIdleTime;
    Game_Battler.prototype.updateTpbIdleTime = function() {
        if (!enabled() || !clock) return originalIdle.call(this);
        if (!this.canMove() || this.isTpbCharged()) {
            this._tpbIdleTime += clock.idleRates.get(this) || 0;
        }
    };

    // Public read-only forecast; one entry is one action opportunity, not a hit.
    // Use normalized AGI time, so drawing never calls acceleration hooks with
    // side effects, creates actions, consumes random numbers, or modifies gauges.
    BattleManager.linearTimeOrder = function(count = previewCount) {
        if (!enabled()) return [];
        const limit = Math.max(0, Math.min(32, Math.floor(Number(count) || 0)));
        const members = this.allBattleMembers().filter(eligible);
        const result = [];
        const committed = new Set();
        const push = (battler, label) => {
            if (members.includes(battler) && !committed.has(battler)) {
                result.push({ battler, label });
                committed.add(battler);
            }
        };
        push(this._subject, "行動中");
        for (const battler of this._actionBattlers) push(battler, "行動待ち");
        for (const battler of members) {
            if (["casting", "ready", "acting"].includes(battler._tpbState)) push(battler, "行動待ち");
        }
        for (const battler of members) {
            if (battler.isTpbCharged()) push(battler, "入力待ち");
        }
        const future = members.map((battler, index) => {
            const period = referenceAgility / agility(battler);
            const remaining = committed.has(battler) ? 1 : Math.max(0, 1 - battler.tpbChargeTime());
            return { battler, index, period, time: period * remaining };
        });
        while (result.length < limit && future.length) {
            future.sort(compare);
            const next = future[0];
            result.push({ battler: next.battler, label: "" });
            next.time += next.period;
        }
        return result.slice(0, limit);
    };

    const barHeight = 124;
    const gap = 6;
    const hasTopUi = () => PluginManager._scripts.includes("FlexibleTopDownUI");
    const timelineEnabled = () => enabled() && showTimeline;
    const top = scene => hasTopUi() ? scene.calcWindowHeight(1, true) + gap : gap;
    // Reserve space for lists as well as the battle log, rather than covering
    // selectable rows. Existing bottom help/status locations remain unchanged.
    for (const method of ["logWindowRect", "skillWindowRect", "itemWindowRect", "enemyWindowRect"]) {
        const original = Scene_Battle.prototype[method];
        // item/enemy can call skillWindowRect; nested wrappers must not shift twice.
        Scene_Battle.prototype[method] = function() {
            const nested = this._linearTimeRectDepth || 0;
            this._linearTimeRectDepth = nested + 1;
            let rect;
            try { rect = original.call(this); } finally { this._linearTimeRectDepth = nested; }
            if (!nested && timelineEnabled()) {
                const bottom = rect.y + rect.height;
                rect.y = Math.max(rect.y, top(this) + barHeight + gap);
                if (method !== "logWindowRect") rect.height = Math.max(1, bottom - rect.y);
            }
            return rect;
        };
    }
    const relayout = Scene_Battle.prototype.relayoutBattleWindows;
    if (relayout) {
        Scene_Battle.prototype.relayoutBattleWindows = function() {
            relayout.call(this);
            if (timelineEnabled() && this._logWindow) this._logWindow.y = this.logWindowRect().y;
        };
    }

    class Window_LinearTimeOrder extends Window_Base {
        constructor(rect) {
            super(rect);
            this.opacity = 220;
            this._portraits = [];
            this._signature = "";
            this._refreshTick = 0;
        }
        updatePadding() { this.padding = 8; }
        resetFontSettings() {
            super.resetFontSettings();
            this.contents.fontFace = "sans-serif";
            this.contents.fontSize = 14;
        }
        update() {
            super.update();
            this.visible = timelineEnabled() && !BattleManager.isBattleEnd() &&
                !BattleManager.isAborting() && !$gameMessage.isBusy();
            if (!this.visible) return;
            if (++this._refreshTick % 4 === 1) this.refreshOrder();
            this.updatePortraits();
        }
        refreshOrder() {
            const count = Math.min(previewCount, Math.max(1, Math.floor(this.innerWidth / 76)));
            const order = BattleManager.linearTimeOrder(count);
            const signature = JSON.stringify(order.map(({ battler: b, label }) => [
                b.isActor() ? "a" + b.actorId() : "e" + b.index(), label, b.name(),
                b.isActor() ? b.faceName() : b.battlerName(),
                b.isActor() ? b.faceIndex() : b.battlerHue(), b.isSelected()
            ]));
            if (signature === this._signature) return;
            this._signature = signature;
            this.contents.clear();
            this.resetFontSettings();
            this.contents.textColor = "#e8edf7";
            this.contents.drawText("行動順予測  →", 2, 0, 150, 20, "left");
            this.contents.textColor = "#b9c8de";
            this.contents.drawText("青:味方 / 赤:敵", 150, 0, Math.max(1, this.innerWidth - 152), 20, "right");
            const width = Math.floor(this.innerWidth / Math.max(1, count));
            this._portraits.forEach(sprite => { sprite.visible = false; sprite._entry = null; });
            order.forEach((entry, index) => {
                const b = entry.battler;
                const x = index * width;
                const color = b.isActor() ? "#58bbff" : "#ff797e";
                this.contents.fillRect(x + 1, 23, width - 4, 83, "#152036");
                this.contents.fillRect(x + 1, 23, width - 4, 2, b.isSelected() ? "#ffe08a" : color);
                this.contents.fillRect(x + 1, 25, 2, 81, color);
                this.contents.textColor = color;
                this.contents.drawText(entry.label || String(index + 1), x + 4, 26, width - 10, 17, "center");
                this.contents.textColor = "#ffffff";
                this.contents.drawText(b.name(), x + 4, 88, width - 10, 17, "center");
                let sprite = this._portraits[index];
                if (!sprite) {
                    sprite = new Sprite();
                    sprite.anchor.set(0.5, 0.5);
                    this.addInnerChild(sprite);
                    this._portraits[index] = sprite;
                }
                sprite._entry = entry;
                sprite.x = x + width / 2;
                sprite.y = 65;
                sprite._portraitSize = Math.min(42, width - 12);
                sprite.bitmap = b.isActor() ? ImageManager.loadFace(b.faceName()) :
                    ($gameSystem.isSideView() ? ImageManager.loadSvEnemy(b.battlerName()) : ImageManager.loadEnemy(b.battlerName()));
                sprite.setHue(b.isActor() ? 0 : b.battlerHue());
            });
        }
        updatePortraits() {
            for (const sprite of this._portraits) {
                const bitmap = sprite.bitmap;
                sprite.visible = !!sprite._entry && !!bitmap && bitmap.isReady() && bitmap.width > 0;
                if (!sprite.visible) continue;
                const b = sprite._entry.battler;
                let width = bitmap.width;
                let height = bitmap.height;
                let sx = 0;
                let sy = 0;
                if (b.isActor()) {
                    width = ImageManager.faceWidth;
                    height = ImageManager.faceHeight;
                    sx = b.faceIndex() % 4 * width;
                    sy = Math.floor(b.faceIndex() / 4) * height;
                }
                sprite.setFrame(sx, sy, width, height);
                sprite.scale.set(sprite._portraitSize / Math.max(width, height, 1));
            }
        }
    }
    const originalCreate = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        originalCreate.call(this);
        if (!timelineEnabled()) return;
        this._linearTimeOrderWindow = new Window_LinearTimeOrder(
            new Rectangle(gap, top(this), Math.max(1, Graphics.boxWidth - gap * 2), barHeight));
        this.addWindow(this._linearTimeOrderWindow);
    };
})();