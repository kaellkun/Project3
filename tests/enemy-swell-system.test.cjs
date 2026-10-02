const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pluginSource = fs.readFileSync(path.join(root, 'js/plugins/Battle/Enemy/EnemySwellSystem.js'), 'utf8');

function swellTypeJson(entries) {
    return JSON.stringify(entries.map(entry => JSON.stringify(entry)));
}

function setup({ swellTypes = [], withShieldBreak = true, parameters = {} } = {}) {
    const variables = {};
    const switches = {};
    const messages = [];
    const log = [];
    let logBusy = false;
    let inBattle = true;
    const calls = { forceAction: [], originalMakeActions: 0, originalEndAction: 0, displayAffectedStatus: [], invokeAttempted: [], invokeApplied: [], originalApply: 0 };

    function Game_Enemy() {}
    Game_Enemy.prototype.enemy = function() {
        return this._enemyData;
    };
    Game_Enemy.prototype.name = function() { return this._enemyData.name; };
    Game_Enemy.prototype.setup = function() {};
    Game_Enemy.prototype.transform = function() {};
    Game_Enemy.prototype.revive = function() {};
    Game_Enemy.prototype.onBattleEnd = function() {};
    Game_Enemy.prototype.onTurnEnd = function() {};
    Game_Enemy.prototype.canMove = function() {
        return this._canMove !== false;
    };
    Game_Enemy.prototype.makeActions = function() {
        calls.originalMakeActions++;
    };
    Game_Enemy.prototype.forceAction = function(skillId, targetIndex) {
        calls.forceAction.push({ skillId, targetIndex });
    };
    Game_Enemy.prototype.setActionState = function(state) {
        this._actionState = state;
    };
    Game_Enemy.prototype.isEnemy = function() {
        return true;
    };
    Game_Enemy.prototype.isAlive = function() {
        return this._hp !== 0;
    };
    Game_Enemy.prototype.clearResult = function() {
        this._resultCleared = true;
    };
    Game_Enemy.prototype.setHp = function(hp) {
        this._hp = hp;
    };
    Game_Enemy.prototype.result = function() {
        return this._result || { isHit: () => false };
    };
    if (withShieldBreak) {
        Game_Enemy.prototype._broken = false;
        Game_Enemy.prototype.isShieldBroken = function() {
            return !!this._broken;
        };
        Game_Enemy.prototype.clearActions = function() {
            this._actions = [];
        };
        Game_Enemy.prototype.damageShield = function() {
            // Simulates ShieldBreakSystem: flips the break flag and wipes queued actions.
            this._broken = true;
            this.clearActions();
        };
    }

    function Game_Action(subject) {
        this._subject = subject;
    }
    Game_Action.prototype.apply = function() {
        calls.originalApply++;
    };
    Game_Action.prototype.subject = function() {
        return this._subject;
    };
    Game_Action.prototype.isHpEffect = function() {
        return true;
    };
    Game_Action.prototype.item = function() {
        return this._item;
    };

    const battleManager = {
        _subject: null,
        _action: null,
        _logWindow: {
            displayAffectedStatus(target) { calls.displayAffectedStatus.push(target); },
            push(...args) { log.push(args); },
            isBusy() { return logBusy; }
        },
        initMembers() {},
        update() { calls.originalUpdate = (calls.originalUpdate || 0) + 1; },
        isBusy() { return messages.length > 0 || logBusy; },
        endAction() { calls.originalEndAction++; },
        // Mirrors ShieldBreakSystem.invokeAction: skip entirely while the subject is broken.
        invokeAction(subject, target) {
            calls.invokeAttempted.push(target);
            if (subject && subject.isEnemy && subject.isEnemy() && subject.isShieldBroken && subject.isShieldBroken()) {
                return;
            }
            calls.invokeApplied.push(target);
        }
    };

    const context = vm.createContext({
        Game_Enemy,
        Game_Action,
        BattleManager: battleManager,
        $dataSkills: { 99: { name: '爆発' }, 32: { name: '自爆' } },
        $dataSystem: { elements: { 4: '雷' } },
        $gameParty: { inBattle: () => inBattle },
        $gameMessage: {
            isBusy: () => messages.length > 0,
            add: text => messages.push(text)
        },
        PluginManager: { parameters: () => ({ SwellTypes: swellTypeJson(swellTypes), ...parameters }) },
        $gameVariables: {
            value: id => variables[id] || 0,
            setValue: (id, value) => { variables[id] = value; }
        },
        $gameSwitches: {
            value: id => !!switches[id],
            setValue: (id, value) => { switches[id] = value; }
        },
        $gameTemp: {}
    });
    vm.runInContext(pluginSource, context, { filename: 'EnemySwellSystem.js' });

    function makeAction({ subject = {}, elementId = 1, type = 1 } = {}) {
        const action = Object.create(context.Game_Action.prototype);
        action._subject = subject;
        action._item = { damage: { elementId, type } };
        action.subject = () => subject;
        action.item = () => action._item;
        action.isHpEffect = () => true;
        return action;
    }

    function makeEnemy(meta = {}) {
        const enemy = Object.create(context.Game_Enemy.prototype);
        enemy._enemyId = 1;
        enemy._enemyData = { name: 'ボム', meta };
        enemy._hp = 100;
        enemy.setup();
        return enemy;
    }

    return { context, variables, switches, calls, makeEnemy, makeAction, battleManager, messages, log,
        setLogBusy(value) { logBusy = value; }, setInBattle(value) { inBattle = value; } };
}

test('an enemy without the note tag has no swell', () => {
    const { makeEnemy } = setup({ swellTypes: [{ Key: '肥大化', VariableId: 1, PerTurn: 1, Max: 3, SwitchId: 1 }] });
    const enemy = makeEnemy();
    assert.equal(enemy.hasSwell(), false);
    enemy.onTurnEnd();
    assert.equal(enemy.swellValue(), 0);
});

test('swell accumulates per turn end and stops at the max, flipping the switch', () => {
    const { makeEnemy, variables, switches } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 5, PerTurn: 2, Max: 5, SwitchId: 7 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });

    enemy.onTurnEnd();
    assert.equal(variables[5], 2);
    assert.equal(switches[7], false);

    enemy.onTurnEnd();
    assert.equal(variables[5], 4);
    assert.equal(switches[7], false);

    enemy.onTurnEnd();
    assert.equal(variables[5], 5, 'clamped to the max instead of overflowing to 6');
    assert.equal(switches[7], true, 'the switch turns on once the max is reached');
});

test('per-enemy note tags override the type defaults', () => {
    const { makeEnemy, variables, switches } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 2, PerTurn: 1, Max: 100, SwitchId: 9 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化', '膨張速度': '10', '膨張上限': '20' });

    enemy.onTurnEnd();
    enemy.onTurnEnd();
    assert.equal(variables[2], 20, 'uses the overridden speed/max, not the type default');
    assert.equal(switches[9], true);
});

test('swelling pauses while the shield is broken', () => {
    const { makeEnemy } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 3, PerTurn: 1, Max: 0, SwitchId: 0 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy._broken = true;
    enemy.onTurnEnd();
    assert.equal(enemy.swellValue(), 0, 'no accumulation while shield-broken');
});

test('breaking the shield resets swell to zero when ResetOnBreak is true', () => {
    const { makeEnemy, variables } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 4, PerTurn: 1, Max: 0, SwitchId: 0, ResetOnBreak: true }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy.onTurnEnd();
    enemy.onTurnEnd();
    assert.equal(variables[4], 2);

    enemy.damageShield(999);
    assert.equal(variables[4], 0, 'reset the instant the break happens');

    variables[4] = 5;
    enemy.damageShield(999);
    assert.equal(variables[4], 5, 'already broken: no repeated reset on the same break');
});

test('a queued self-destruct action survives the shield-break clearActions() wipe', () => {
    const { makeEnemy } = setup();
    const enemy = makeEnemy();
    const selfDestructAction = { item: () => ({ meta: { '自爆': true } }) };
    enemy._actions = [selfDestructAction];

    enemy.damageShield(999);

    assert.deepEqual(enemy._actions, [selfDestructAction], 'the decided self-destruct is not wiped by the break');
});

test('a queued ordinary action is still wiped by the shield-break clearActions()', () => {
    const { makeEnemy } = setup();
    const enemy = makeEnemy();
    enemy._actions = [{ item: () => ({ meta: {} }) }];

    enemy.damageShield(999);

    assert.deepEqual(enemy._actions, [], 'ShieldBreakSystem still clears non-self-destruct actions as before');
});

test('a self-destruct action queued while already broken is still wiped (nothing to preserve)', () => {
    const { makeEnemy } = setup();
    const enemy = makeEnemy();
    enemy._broken = true;
    enemy._actions = [{ item: () => ({ meta: { '自爆': true } }) }];

    enemy.damageShield(999);

    assert.deepEqual(enemy._actions, [], 'no rising edge, so no special preservation applies');
});

test('ResetOnBreak can be disabled per type', () => {
    const { makeEnemy, variables } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 6, PerTurn: 1, Max: 0, SwitchId: 0, ResetOnBreak: false }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy.onTurnEnd();
    enemy.onTurnEnd();
    enemy.damageShield(999);
    assert.equal(variables[6], 2, 'kept because ResetOnBreak is false');
});

test('works standalone without ShieldBreakSystem installed', () => {
    const { makeEnemy, variables } = setup({
        withShieldBreak: false,
        swellTypes: [{ Key: '肥大化', VariableId: 8, PerTurn: 1, Max: 0, SwitchId: 0 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy.onTurnEnd();
    assert.equal(variables[8], 1);
});

test('an unknown key in the note tag leaves the enemy without swell', () => {
    const { makeEnemy } = setup({ swellTypes: [{ Key: '肥大化', VariableId: 1, PerTurn: 1, Max: 1, SwitchId: 1 }] });
    const enemy = makeEnemy({ '膨張': '未定義キー' });
    assert.equal(enemy.hasSwell(), false);
});

test('reaching the max forces the configured skill instead of normal AI', () => {
    const { makeEnemy, calls } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 10, PerTurn: 5, Max: 5, SwitchId: 0, ForceSkillId: 99 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });

    enemy.makeActions();
    assert.equal(calls.originalMakeActions, 1, 'below the max, normal AI selection runs');
    assert.equal(calls.forceAction.length, 0);

    enemy.onTurnEnd();
    enemy.makeActions();
    assert.equal(calls.originalMakeActions, 1, 'at the max, normal AI selection is skipped');
    assert.deepEqual(calls.forceAction, [{ skillId: 99, targetIndex: -1 }]);
});

test('ForceSkillId of 0 keeps the normal AI selection even at the max', () => {
    const { makeEnemy, calls } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 11, PerTurn: 5, Max: 5, SwitchId: 0, ForceSkillId: 0 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy.onTurnEnd();
    enemy.makeActions();
    assert.equal(calls.originalMakeActions, 1);
    assert.equal(calls.forceAction.length, 0);
});

test('a per-enemy note tag overrides the forced skill', () => {
    const { makeEnemy, calls } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 12, PerTurn: 5, Max: 5, SwitchId: 0, ForceSkillId: 99 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化', '膨張スキル': '42' });
    enemy.onTurnEnd();
    enemy.makeActions();
    assert.deepEqual(calls.forceAction, [{ skillId: 42, targetIndex: -1 }]);
});

test('an immobile enemy at the max still runs normal makeActions (e.g. shield-broken restriction)', () => {
    const { makeEnemy, calls } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 13, PerTurn: 5, Max: 5, SwitchId: 0, ForceSkillId: 99 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy.onTurnEnd();
    enemy._canMove = false;
    enemy.makeActions();
    assert.equal(calls.originalMakeActions, 1, 'falls back to normal handling when the enemy cannot act');
    assert.equal(calls.forceAction.length, 0);
});

test('a <自爆> skill defeats the enemy at endAction with the standard collapse/message flow', () => {
    const { makeEnemy, calls, battleManager } = setup();
    const enemy = makeEnemy();
    battleManager._subject = enemy;
    battleManager._action = { item: () => ({ meta: { '自爆': true } }) };

    battleManager.endAction();

    assert.equal(enemy.isAlive(), false, 'the enemy is defeated');
    assert.equal(enemy._resultCleared, true, 'clears stale result data first');
    assert.deepEqual(calls.displayAffectedStatus, [enemy], 'reuses the standard death message/collapse display');
    assert.equal(calls.originalEndAction, 1, 'the original endAction still runs');
});

test('endAction leaves a non-self-destruct skill untouched', () => {
    const { makeEnemy, calls, battleManager } = setup();
    const enemy = makeEnemy();
    battleManager._subject = enemy;
    battleManager._action = { item: () => ({ meta: {} }) };

    battleManager.endAction();

    assert.equal(enemy.isAlive(), true);
    assert.equal(calls.displayAffectedStatus.length, 0);
    assert.equal(calls.originalEndAction, 1);
});

test('a <自爆> skill used by an actor does not self-destruct (enemy-only mechanic)', () => {
    const { context, calls, battleManager } = setup();
    const actor = { isEnemy: () => false, isAlive: () => true };
    battleManager._subject = actor;
    battleManager._action = { item: () => ({ meta: { '自爆': true } }) };

    battleManager.endAction();

    assert.equal(calls.displayAffectedStatus.length, 0);
});

test('an already-dead subject is not processed again', () => {
    const { makeEnemy, calls, battleManager } = setup();
    const enemy = makeEnemy();
    enemy._hp = 0;
    battleManager._subject = enemy;
    battleManager._action = { item: () => ({ meta: { '自爆': true } }) };

    battleManager.endAction();

    assert.equal(calls.displayAffectedStatus.length, 0);
});

test('a self-destruct skill still lands damage even if the enemy broke earlier the same turn', () => {
    const { makeEnemy, calls, battleManager } = setup();
    const enemy = makeEnemy();
    enemy._broken = true; // decided the forced skill while healthy, then got broken before it executed
    battleManager._subject = enemy;
    battleManager._action = { item: () => ({ meta: { '自爆': true } }) };
    const target = {};

    battleManager.invokeAction(enemy, target);

    assert.deepEqual(calls.invokeApplied, [target], 'damage is applied despite the break');
    assert.equal(enemy.isShieldBroken(), true, 'the break flag itself is restored afterward');
});

test('a broken enemy using a normal (non self-destruct) skill still has its action skipped', () => {
    const { makeEnemy, calls, battleManager } = setup();
    const enemy = makeEnemy();
    enemy._broken = true;
    battleManager._subject = enemy;
    battleManager._action = { item: () => ({ meta: {} }) };
    const target = {};

    battleManager.invokeAction(enemy, target);

    assert.deepEqual(calls.invokeApplied, [], 'ShieldBreakSystem still suppresses ordinary broken-enemy actions');
});

test('self-destruct invokeAction bypass is a no-op when the enemy is not broken', () => {
    const { makeEnemy, calls, battleManager } = setup();
    const enemy = makeEnemy();
    battleManager._subject = enemy;
    battleManager._action = { item: () => ({ meta: { '自爆': true } }) };
    const target = {};

    battleManager.invokeAction(enemy, target);

    assert.deepEqual(calls.invokeApplied, [target]);
});

test('a matching-element hit that deals HP damage adds the trigger amount to swell', () => {
    const { makeEnemy, variables, makeAction } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 20, PerTurn: 0, Max: 0, TriggerElements: '2,4', TriggerAmount: 2 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy._result = { isHit: () => true, hpAffected: true, hpDamage: 10 };
    const action = makeAction({ elementId: 4 });

    action.apply(enemy);

    assert.equal(variables[20], 2);
});

test('a non-matching element does not add swell', () => {
    const { makeEnemy, makeAction } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 21, PerTurn: 0, Max: 0, TriggerElements: '2,4', TriggerAmount: 2 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy._result = { isHit: () => true, hpAffected: true, hpDamage: 10 };
    const action = makeAction({ elementId: 11 });

    action.apply(enemy);

    assert.equal(enemy.swellValue(), 0);
});

test('a miss, non-HP-affecting, or non-positive-damage hit does not add swell even with a matching element', () => {
    const { makeEnemy, variables, makeAction } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 22, PerTurn: 0, Max: 0, TriggerElements: '4', TriggerAmount: 2 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    const action = makeAction({ elementId: 4 });

    enemy._result = { isHit: () => false, hpAffected: true, hpDamage: 10 };
    action.apply(enemy);
    assert.equal(enemy.swellValue(), 0, 'missed');

    enemy._result = { isHit: () => true, hpAffected: false, hpDamage: 10 };
    action.apply(enemy);
    assert.equal(enemy.swellValue(), 0, 'no hp effect');

    enemy._result = { isHit: () => true, hpAffected: true, hpDamage: 0 };
    action.apply(enemy);
    assert.equal(enemy.swellValue(), 0, 'zero damage');
});

test('element-triggered swell respects the Max clamp and switch, and is skipped while shield-broken', () => {
    const { makeEnemy, variables, switches, makeAction } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 23, PerTurn: 0, Max: 3, SwitchId: 5, TriggerElements: '4', TriggerAmount: 2 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy._result = { isHit: () => true, hpAffected: true, hpDamage: 10 };
    const action = makeAction({ elementId: 4 });

    action.apply(enemy);
    assert.equal(variables[23], 2);
    assert.equal(switches[5], false);

    action.apply(enemy);
    assert.equal(variables[23], 3, 'clamped to the max');
    assert.equal(switches[5], true);

    enemy._broken = true;
    variables[23] = 0;
    action.apply(enemy);
    assert.equal(variables[23], 0, 'no accumulation while shield-broken');
});

test('per-enemy note tags override the trigger elements and amount', () => {
    const { makeEnemy, variables, makeAction } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 24, PerTurn: 0, Max: 0, TriggerElements: '4', TriggerAmount: 2 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化', '膨張属性': '11', '膨張属性増加': '5' });
    enemy._result = { isHit: () => true, hpAffected: true, hpDamage: 10 };

    makeAction({ elementId: 4 }).apply(enemy);
    assert.equal(enemy.swellValue(), 0, 'the overridden trigger no longer matches the original element');

    makeAction({ elementId: 11 }).apply(enemy);
    assert.equal(enemy.swellValue(), 5, 'uses the overridden element and amount');
});

test('an enemy without TriggerElements configured is unaffected by any element hit', () => {
    const { makeEnemy, variables, makeAction } = setup({
        swellTypes: [{ Key: '肥大化', VariableId: 25, PerTurn: 0, Max: 0 }]
    });
    const enemy = makeEnemy({ '膨張': '肥大化' });
    enemy._result = { isHit: () => true, hpAffected: true, hpDamage: 10 };

    makeAction({ elementId: 1 }).apply(enemy);

    assert.equal(enemy.swellValue(), 0);
});

test('progress forecasts the skill and remaining actions in both log and message window', () => {
    const { makeEnemy, log, messages, battleManager } = setup({
        swellTypes: [{ Key: 'ボム', VariableId: 3, PerTurn: 1, Max: 3, ForceSkillId: 32 }]
    });
    makeEnemy({ '膨張': 'ボム' }).onTurnEnd();
    const expected = 'ボムが膨張！ 1/3。自爆まで2回の行動終了！\n行動終了ごと+1';
    assert.deepEqual(log.at(-1), ['addText', '行動終了ごと+1']);
    assert.equal(battleManager.isBusy(), true, 'pending notice pauses the next action');
    battleManager.update();
    assert.deepEqual(messages, [expected]);
    assert.equal(battleManager.isBusy(), true, 'battle waits for the message');
    messages.shift();
    assert.equal(battleManager.isBusy(), false);
});

test('rapid progress coalesces pending messages after the battle log finishes', () => {
    const { makeEnemy, makeAction, battleManager, messages, log, setLogBusy } = setup({
        swellTypes: [{ Key: 'ボム', VariableId: 3, PerTurn: 1, Max: 3, ForceSkillId: 32,
            TriggerElements: '4', TriggerAmount: 1 }]
    });
    const enemy = makeEnemy({ '膨張': 'ボム' });
    enemy._result = { isHit: () => true, hpAffected: true, hpDamage: 10 };
    setLogBusy(true);
    enemy.onTurnEnd();
    makeAction({ elementId: 4 }).apply(enemy);
    battleManager.update();
    assert.equal(messages.length, 0);
    assert.equal(log.length, 4, 'both two-line progress steps remain in the battle log');
    setLogBusy(false);
    battleManager.update();
    assert.deepEqual(messages, ['ボムが膨張！ 2/3。自爆まで1回の行動終了！\n行動終了ごと+1／雷被弾で+1']);
});

test('limit and break reset notify the next skill and its cancellation', () => {
    const { makeEnemy, battleManager, messages, log } = setup({
        swellTypes: [{ Key: 'ボム', VariableId: 3, PerTurn: 1, Max: 2, ForceSkillId: 32,
            ResetOnBreak: true }]
    });
    const enemy = makeEnemy({ '膨張': 'ボム' });
    enemy.onTurnEnd();
    enemy.onTurnEnd();
    assert.deepEqual(log.at(-1), ['addText', 'ボムの膨張が限界！ 次の行動で自爆を使う！']);
    battleManager.update();
    assert.deepEqual(messages, ['ボムの膨張が限界！ 次の行動で自爆を使う！']);
    messages.shift();
    enemy.damageShield(999);
    battleManager.update();
    assert.deepEqual(messages, ['ボムはブレイクされ、膨張がリセットされた！']);
});

test('pending notice waits until an existing event message finishes', () => {
    const { makeEnemy, battleManager, messages } = setup({
        swellTypes: [{ Key: 'ボム', VariableId: 3, PerTurn: 1, Max: 2, ForceSkillId: 32 }]
    });
    messages.push('イベント文章');
    makeEnemy({ '膨張': 'ボム' }).onTurnEnd();
    battleManager.update();
    assert.deepEqual(messages, ['イベント文章']);
    messages.shift();
    battleManager.update();
    assert.match(messages[0], /自爆/);
});

test('disabled formats and battle-external updates show no notices', () => {
    const { makeEnemy, log, messages, battleManager, setInBattle } = setup({
        swellTypes: [{ Key: 'ボム', VariableId: 3, PerTurn: 1, Max: 3, ForceSkillId: 32 }],
        parameters: { ProgressFormat: '', ReadyFormat: '', ResetFormat: '' }
    });
    const enemy = makeEnemy({ '膨張': 'ボム' });
    enemy.onTurnEnd();
    enemy.setSwellValue(1);
    setInBattle(false);
    enemy.setSwellValue(2);
    battleManager.update();
    assert.deepEqual(log, []);
    assert.deepEqual(messages, []);
});

test('zero per-turn gain shows an element-dependent forecast', () => {
    const { makeEnemy, log } = setup({
        swellTypes: [{ Key: 'ボム', VariableId: 3, PerTurn: 0, Max: 3, ForceSkillId: 32,
            TriggerElements: '4', TriggerAmount: 1 }]
    });
    makeEnemy({ '膨張': 'ボム' }).advanceSwellByElements([4]);
    assert.deepEqual(log.at(-2), ['addText', 'ボムが膨張！ 1/3。自爆まで属性被弾が必要！']);
    assert.deepEqual(log.at(-1), ['addText', '雷被弾で+1']);
});

test('custom mechanic hint overrides the automatically generated hint', () => {
    const { makeEnemy, messages, battleManager } = setup({
        swellTypes: [{ Key: 'ボム', VariableId: 3, PerTurn: 1, Max: 3, ForceSkillId: 32,
            NoticeHint: '水を浴びると鎮火する' }]
    });
    makeEnemy({ '膨張': 'ボム' }).onTurnEnd();
    battleManager.update();
    assert.match(messages[0], /水を浴びると鎮火する/);
});

test('a swell type without a forced skill does not announce a nonexistent action', () => {
    const { makeEnemy, log, messages, battleManager } = setup({
        swellTypes: [{ Key: '蓄積', VariableId: 3, PerTurn: 1, Max: 2, ForceSkillId: 0 }]
    });
    const enemy = makeEnemy({ '膨張': '蓄積' });
    enemy.onTurnEnd();
    enemy.onTurnEnd();
    battleManager.update();
    assert.deepEqual(messages, ['ボムの膨張が限界！']);
    assert.deepEqual(log.at(-1), ['addText', 'ボムの膨張が限界！']);
});



