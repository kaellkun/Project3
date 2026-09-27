//=============================================================================
// RPG Maker MZ - Enemy Swell System
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 敵の「膨張」をシステム変数で管理します。毎ターン加算、上限到達で強制行動・スイッチON、シールドブレイクで解除。自爆スキルタグ対応。(v1.2.1)
 * @author Copilot
 * @orderAfter ShieldBreakSystem
 *
 * @help
 * 敵専用の蓄積カウンター「膨張」を、指定したゲーム変数で管理します。
 * 同じ変数・スイッチを使い回す「膨張タイプ」をプラグインパラメータで
 * 複数定義しておき、敵のメモ欄からタイプを選ぶだけで、
 * 今後増える「膨張系」の敵に使い回せます。
 *
 * ・膨張タイプごとに、値を保持する変数と毎ターンの加算量、
 * 　上限値、上限到達時にONにするスイッチを設定できます。
 * ・上限値に達している間はスイッチがON、それ以外はOFFになります
 * 　（上限0は無制限で加算するだけ・スイッチ操作なし）。
 * ・上限に達すると、その敵の次の行動を指定スキル（自爆など）に
 * 　強制できます。通常のAI行動選択は行わず、必ずそのスキルを使います。
 * ・その敵のシールドがブレイクした瞬間（ShieldBreakSystem導入時）に
 * 　膨張を0にリセットできます（タイプごとにON/OFF可）。
 * ・シールドブレイク中は膨張が加算されません。
 * ・膨張で自爆を決定した後、同じターン中にその敵自身がブレイクしても、
 * 　<膨張>タグ付きスキルのダメージはShieldBreakSystemの「ブレイク中は
 * 　行動無効」処理を回避して必ず命中します（抑えられた自爆がパーティに
 * 　ダメージを与えない不具合の修正）。
 *
 * 【敵のメモ欄】
 *   <膨張:キー名>       … プラグインパラメータで定義した膨張タイプを指定
 *   <膨張速度:N>        … その敵だけ毎ターンの加算量を上書き（省略可）
 *   <膨張上限:N>        … その敵だけ上限値を上書き（省略可）
 *   <膨張スキル:N>      … その敵だけ強制発動スキルIDを上書き（省略可）
 *
 * 同じキー名を複数の敵に指定すると、変数とスイッチを共有します。
 * 群れで自爆する敵同士の連動（誰かが膨張したら皆に影響する等）も
 * この共有を利用して表現できます。
 *
 * 【スキルのメモ欄】
 *   <自爆>              … このスキルを使った敵は、行動終了時に
 * 　　　　　　　　　　　　　自動的に戦闘不能になります（通常の戦闘不能
 * 　　　　　　　　　　　　　メッセージ・演出つき）。膨張と無関係に、
 * 　　　　　　　　　　　　　どのスキルにも付けられます。
 * 　　　　　　　　　　　　　スキルの範囲は「敵全体」等パーティ側を狙う
 * 　　　　　　　　　　　　　設定にしておけば、通常のダメージ計算式・
 * 　　　　　　　　　　　　　属性・アニメがそのまま使えます。
 *
 * @param SwellTypes
 * @text 膨張タイプ定義
 * @desc 敵のメモ欄 <膨張:キー名> で参照する定義の一覧です。
 * @type struct<SwellType>[]
 * @default []
 */
/*~struct~SwellType:
 * @param Key
 * @text 識別キー
 * @desc 敵のメモ欄 <膨張:キー名> に書く名前です。
 * @type string
 *
 * @param VariableId
 * @text 膨張値の変数
 * @desc 膨張度を保持するゲーム変数です。
 * @type variable
 *
 * @param PerTurn
 * @text 毎ターンの加算量
 * @desc その敵が行動を終えるたびに変数へ加算する量です。
 * @type number
 * @min 0
 * @default 1
 *
 * @param Max
 * @text 上限値
 * @desc 到達したらスイッチをONにする上限値。0で無制限（スイッチは操作しません）。
 * @type number
 * @min 0
 * @default 100
 *
 * @param SwitchId
 * @text 満了スイッチ
 * @desc 上限値に達している間ONにするスイッチ。自爆スキルの使用条件などに使います。0で未使用。
 * @type switch
 * @default 0
 *
 * @param ForceSkillId
 * @text 強制発動スキル
 * @desc 上限値に達した敵の次の行動をこのスキルに強制します。0で強制しません（スイッチのみ利用）。
 * @type skill
 * @default 0
 *
 * @param ResetOnBreak
 * @text ブレイクで解除
 * @desc シールドブレイクが発生した瞬間に膨張を0へ戻すか。
 * @type boolean
 * @default true
 */

(() => {
    "use strict";

    const pluginName = "EnemySwellSystem";
    const parameters = PluginManager.parameters(pluginName);

    function parseTypes(json) {
        let list = [];
        try {
            list = JSON.parse(json || "[]").map(entry => JSON.parse(entry));
        } catch (e) {
            list = [];
        }
        const map = new Map();
        for (const entry of list) {
            const key = String(entry.Key || "").trim();
            if (!key) continue;
            map.set(key, {
                key,
                variableId: Number(entry.VariableId) || 0,
                perTurn: Number(entry.PerTurn) || 0,
                max: Number(entry.Max) || 0,
                switchId: Number(entry.SwitchId) || 0,
                forceSkillId: Number(entry.ForceSkillId) || 0,
                resetOnBreak: entry.ResetOnBreak === "true" || entry.ResetOnBreak === true
            });
        }
        return map;
    }

    const swellTypes = parseTypes(parameters.SwellTypes);

    function number(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    Game_Enemy.prototype.setupSwell = function() {
        const meta = (this.enemy() && this.enemy().meta) || {};
        const key = meta["膨張"] === undefined ? "" : String(meta["膨張"]).trim();
        const base = key ? swellTypes.get(key) : null;
        this._swell = base
            ? {
                  ...base,
                  perTurn: number(meta["膨張速度"], base.perTurn),
                  max: number(meta["膨張上限"], base.max),
                  forceSkillId: number(meta["膨張スキル"], base.forceSkillId)
              }
            : null;
    };

    Game_Enemy.prototype.hasSwell = function() {
        return !!(this._swell && this._swell.variableId > 0);
    };

    Game_Enemy.prototype.isSwellMaxed = function() {
        return this.hasSwell() && this._swell.max > 0 && this.swellValue() >= this._swell.max;
    };

    Game_Enemy.prototype.swellValue = function() {
        return this.hasSwell() ? $gameVariables.value(this._swell.variableId) : 0;
    };

    Game_Enemy.prototype.setSwellValue = function(value) {
        if (!this.hasSwell()) return;
        const swell = this._swell;
        const clamped = swell.max > 0 ? Math.min(Math.max(value, 0), swell.max) : Math.max(value, 0);
        $gameVariables.setValue(swell.variableId, clamped);
        if (swell.switchId > 0) {
            $gameSwitches.setValue(swell.switchId, swell.max > 0 && clamped >= swell.max);
        }
    };

    Game_Enemy.prototype.resetSwell = function() {
        if (this.hasSwell()) this.setSwellValue(0);
    };

    Game_Enemy.prototype.advanceSwell = function() {
        if (!this.hasSwell() || this._swell.perTurn === 0) return;
        if (this.isShieldBroken && this.isShieldBroken()) return;
        this.setSwellValue(this.swellValue() + this._swell.perTurn);
    };

    for (const name of ["setup", "transform", "revive", "onBattleEnd"]) {
        const original = Game_Enemy.prototype[name];
        Game_Enemy.prototype[name] = function() {
            const result = original.apply(this, arguments);
            if (this._enemyId > 0) this.setupSwell();
            return result;
        };
    }

    const onTurnEnd = Game_Enemy.prototype.onTurnEnd;
    Game_Enemy.prototype.onTurnEnd = function() {
        onTurnEnd.apply(this, arguments);
        this.advanceSwell();
    };

    // 上限到達時は通常のAI選択を飛ばし、必ず膨張スキル(自爆など)を使わせる。
    const makeActions = Game_Enemy.prototype.makeActions;
    Game_Enemy.prototype.makeActions = function() {
        if (this.isSwellMaxed() && this._swell.forceSkillId > 0 && this.canMove()) {
            this.forceAction(this._swell.forceSkillId, -1);
            this.setActionState("waiting");
            return;
        }
        makeActions.apply(this, arguments);
    };

    function isSelfDestructSkill(item) {
        return !!(item && item.meta && item.meta["自爆"] !== undefined);
    }

    // ShieldBreakSystem 導入時のみ、ブレイクした瞬間に膨張を解除する。
    // また、決定済みの自爆行動はブレイクの clearActions() で失われないよう保持する。
    if (Game_Enemy.prototype.damageShield) {
        const damageShield = Game_Enemy.prototype.damageShield;
        Game_Enemy.prototype.damageShield = function(amount) {
            const wasBroken = this.isShieldBroken();
            const queuedSelfDestruct = !wasBroken && this._actions &&
                this._actions.some(action => isSelfDestructSkill(action.item()));
            const preservedActions = queuedSelfDestruct ? this._actions.slice() : null;
            damageShield.apply(this, arguments);
            if (preservedActions && this.isShieldBroken()) {
                this._actions = preservedActions;
            }
            if (!wasBroken && this.isShieldBroken() && this._swell && this._swell.resetOnBreak) {
                this.resetSwell();
            }
        };
    }

    // ShieldBreakSystem はブレイク中の敵の行動を丸ごと無効化するため、決定後に
    // 同じターン中でブレイクした自爆は無効化されてしまう。自爆だけは必ず着弾させる。
    if (typeof BattleManager.invokeAction === "function") {
        const invokeAction = BattleManager.invokeAction;
        BattleManager.invokeAction = function(subject, target) {
            const action = this._action;
            if (
                subject &&
                subject.isEnemy() &&
                typeof subject.isShieldBroken === "function" &&
                subject.isShieldBroken() &&
                isSelfDestructSkill(action && action.item())
            ) {
                const isShieldBroken = subject.isShieldBroken;
                subject.isShieldBroken = () => false;
                try {
                    return invokeAction.apply(this, arguments);
                } finally {
                    subject.isShieldBroken = isShieldBroken;
                }
            }
            return invokeAction.apply(this, arguments);
        };
    }

    // 自爆タグ付きスキルを使い終えた敵を、通常の戦闘不能演出・メッセージ付きで倒す。
    const endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        const subject = this._subject;
        const action = this._action;
        if (subject && subject.isEnemy() && subject.isAlive() && isSelfDestructSkill(action && action.item())) {
            subject.clearResult();
            subject.setHp(0);
            this._logWindow.displayAffectedStatus(subject);
        }
        endAction.apply(this, arguments);
    };
})();
