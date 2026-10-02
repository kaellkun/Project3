//=============================================================================
// RPG Maker MZ - Enemy Swell System
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 敵の膨張を管理し、発動予告をログと文章ウィンドウに表示します。(v1.4.0)
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
 * ・特定属性の攻撃を受けた時にも追加で加算できます
 * 　（Keke_ElementFullCustom導入時は「属性追加」で合成された
 * 　全属性も判定に含めます）。シールドブレイク中は加算されません。
 * ・上限値に達している間はスイッチがON、それ以外はOFFになります
 * 　（上限0は無制限で加算するだけ・スイッチ操作なし）。
 * ・上限に達すると、その敵の次の行動を指定スキル（自爆など）に
 * 　強制できます。通常のAI行動選択は行わず、必ずそのスキルを使います。
 * ・その敵のシールドがブレイクした瞬間（ShieldBreakSystem導入時）に
 * 　膨張を0にリセットできます（タイプごとにON/OFF可）。
 * ・シールドブレイク中は膨張が加算されません。
 * ・戦闘中の膨張進行・限界到達・ブレイク解除をログと文章ウィンドウに
 * 　表示します。進行時に属性被弾やブレイク解除の条件も表示します。
 * 　残り回数は毎ターンの増加量を基にした目安です。
 * 　属性被弾による増加で早まる場合は、その都度予告を更新します。
 * 　限界到達後は「次の行動」で指定スキルを使用します。
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
 *   <膨張属性:2,4>      … その敵だけ被弾で加算する属性IDを上書き（省略可）
 *   <膨張属性増加:N>    … その敵だけ属性被弾時の加算量を上書き（省略可）
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
 *
 * @param ProgressFormat
 * @text 膨張進行の予告
 * @desc %1=敵名 %2=現在値 %3=上限 %4=スキル名 %5=残り目安 %6=ギミック説明。\nで改行。空欄で非表示。
 * @type string
 * @default %1が膨張！ %2/%3。%4まで%5！\n%6
 *
 * @param ReadyFormat
 * @text 膨張限界の予告
 * @desc %1=敵名 %2=現在値 %3=上限 %4=スキル名。空欄で非表示。
 * @type string
 * @default %1の膨張が限界！ 次の行動で%4を使う！
 *
 * @param ResetFormat
 * @text ブレイク解除の予告
 * @desc %1=敵名 %2=現在値 %3=上限 %4=スキル名。空欄で非表示。
 * @type string
 * @default %1はブレイクされ、膨張がリセットされた！
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
 * @param TriggerElements
 * @text 被弾で加算する属性
 * @desc この属性の攻撃が命中しHPダメージを与えた時、追加で膨張を加算します。カンマ区切り、空欄で無効。
 * @type string
 * @default
 *
 * @param TriggerAmount
 * @text 属性被弾時の加算量
 * @desc TriggerElementsに一致した1ヒットごとの加算量。
 * @type number
 * @min 0
 * @default 1
 *
 * @param ResetOnBreak
 * @text ブレイクで解除
 * @desc シールドブレイクが発生した瞬間に膨張を0へ戻すか。
 * @type boolean
 * @default true
 *
 * @param NoticeHint
 * @text ギミック説明
 * @desc 予告に表示する説明。空欄では毎ターン増加量・属性被弾増加量・ブレイク条件から自動生成。
 * @type string
 * @default
 */

(() => {
    "use strict";

    const pluginName = "EnemySwellSystem";
    const parameters = PluginManager.parameters(pluginName);
    const progressFormat = parameters.ProgressFormat === undefined ?
        "%1が膨張！ %2/%3。%4まで%5！\\n%6" : parameters.ProgressFormat;
    const readyFormat = parameters.ReadyFormat === undefined ?
        "%1の膨張が限界！ 次の行動で%4を使う！" : parameters.ReadyFormat;
    const resetFormat = parameters.ResetFormat === undefined ?
        "%1はブレイクされ、膨張がリセットされた！" : parameters.ResetFormat;

    function mechanicHint(swell) {
        if (swell.noticeHint) return swell.noticeHint;
        const hints = [];
        if (swell.perTurn > 0) hints.push(`行動終了ごと+${swell.perTurn}`);
        if (swell.triggerAmount > 0 && swell.triggerElements.length) {
            const names = swell.triggerElements.map(id => $dataSystem?.elements[id] || `属性${id}`);
            hints.push(`${names.join("・")}被弾で+${swell.triggerAmount}`);
        }
        if (swell.resetOnBreak) hints.push("ブレイクで解除");
        return hints.join("／");
    }

    function formatNotice(format, enemy, value) {
        const swell = enemy._swell;
        const skill = $dataSkills[swell.forceSkillId];
        const remaining = swell.perTurn > 0 && swell.max > 0 ?
            `${Math.ceil((swell.max - value) / swell.perTurn)}回の行動終了` : "属性被弾が必要";
        return String(format).replace(/%([1-6])/g, (_, index) =>
            [enemy.name(), value, swell.max, skill ? skill.name : "膨張限界", remaining,
                mechanicHint(swell)][Number(index) - 1]).replace(/\\n/g, "\n").trim();
    }

    function announceSwell(enemy, value) {
        if (!$gameParty.inBattle() || !enemy.isAlive()) return;
        const format = value === 0 ? resetFormat :
            value >= enemy._swell.max && enemy._swell.max > 0 ?
                enemy._swell.forceSkillId > 0 || !readyFormat ? readyFormat :
                    "%1の膨張が限界！" : progressFormat;
        if (!format) return;
        const text = formatNotice(format, enemy, value);
        if (BattleManager._logWindow) {
            for (const line of text.split("\n")) BattleManager._logWindow.push("addText", line);
        }
        const notices = BattleManager._enemySwellNotices ||= [];
        const existing = notices.findIndex(notice => notice.enemy === enemy);
        if (existing >= 0) notices[existing].text = text;
        else notices.push({ enemy, text });
    }

    const initMembers = BattleManager.initMembers;
    BattleManager.initMembers = function() {
        initMembers.apply(this, arguments);
        this._enemySwellNotices = [];
    };

    const updateBattle = BattleManager.update;
    BattleManager.update = function() {
        const notices = this._enemySwellNotices;
        if (notices?.length && !$gameMessage.isBusy() && !this._logWindow?.isBusy()) {
            $gameMessage.add(notices.shift().text);
        }
        return updateBattle.apply(this, arguments);
    };

    const battleIsBusy = BattleManager.isBusy;
    BattleManager.isBusy = function() {
        return !!this._enemySwellNotices?.length || battleIsBusy.apply(this, arguments);
    };

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
                triggerElements: elementIds(entry.TriggerElements),
                triggerAmount: Number(entry.TriggerAmount) || 0,
                resetOnBreak: entry.ResetOnBreak === "true" || entry.ResetOnBreak === true,
                noticeHint: String(entry.NoticeHint || "")
            });
        }
        return map;
    }

    const swellTypes = parseTypes(parameters.SwellTypes);

    function number(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function elementIds(value) {
        if (typeof value !== "string" || !value.trim()) return [];
        return [...new Set(value.split(/[,、\s]+/).map(Number))]
            .filter(id => Number.isInteger(id) && id > 0);
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
                  forceSkillId: number(meta["膨張スキル"], base.forceSkillId),
                  triggerElements: meta["膨張属性"] !== undefined ?
                      elementIds(String(meta["膨張属性"])) : base.triggerElements,
                  triggerAmount: number(meta["膨張属性増加"], base.triggerAmount)
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
        const previous = this.swellValue();
        const clamped = swell.max > 0 ? Math.min(Math.max(value, 0), swell.max) : Math.max(value, 0);
        $gameVariables.setValue(swell.variableId, clamped);
        if (swell.switchId > 0) {
            $gameSwitches.setValue(swell.switchId, swell.max > 0 && clamped >= swell.max);
        }
        if (clamped !== previous) announceSwell(this, clamped);
    };

    Game_Enemy.prototype.resetSwell = function() {
        if (this.hasSwell()) this.setSwellValue(0);
    };

    Game_Enemy.prototype.advanceSwell = function() {
        if (!this.hasSwell() || this._swell.perTurn === 0) return;
        if (this.isShieldBroken && this.isShieldBroken()) return;
        this.setSwellValue(this.swellValue() + this._swell.perTurn);
    };

    // 一致する属性の攻撃がHPダメージを与えるたびに膨張を追加加算する。
    Game_Enemy.prototype.advanceSwellByElements = function(elements) {
        if (!this.hasSwell() || !this._swell.triggerElements.length || this._swell.triggerAmount === 0) return;
        if (this.isShieldBroken && this.isShieldBroken()) return;
        if (!elements.some(id => this._swell.triggerElements.includes(id))) return;
        this.setSwellValue(this.swellValue() + this._swell.triggerAmount);
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

    // 特定属性の被弾で膨張を追加加算する（Keke_ElementFullCustom導入時は合成属性も判定）。
    const applyAction = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        applyAction.apply(this, arguments);
        if (this._isTempApplyKe || target._isTempKe) return;
        if (!target.isEnemy || !target.isEnemy() || !target.hasSwell || !target.hasSwell()) return;
        const result = target.result();
        if (!result.isHit() || !this.isHpEffect() || ![1, 5].includes(this.item().damage.type) ||
            !result.hpAffected || result.hpDamage <= 0) return;
        const elementId = this.item().damage.elementId;
        const subject = this.subject();
        const elements = typeof $gameTemp !== "undefined" && $gameTemp &&
            typeof $gameTemp.getAllElementsKe === "function" ?
            $gameTemp.getAllElementsKe(this) :
            elementId < 0 ? subject.attackElements() : [elementId];
        target.advanceSwellByElements(elements);
    };

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
