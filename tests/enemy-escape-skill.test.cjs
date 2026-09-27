const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pluginSource = fs.readFileSync(path.join(root, 'js/plugins/EnemyEscapeSkill.js'), 'utf8');

function setup({ parameters = {}, random = 0.5, partyAgility = 100 } = {}) {
    const state = { random };
    const calls = { abort: 0, victory: 0, defeat: 0, escapeSound: 0, originalSpecial: [] };
    const log = [];
    const messages = [];

    function Game_Action() {}
    Game_Action.SPECIAL_EFFECT_ESCAPE = 0;
    Game_Action.prototype.makeSuccess = function(target) {
        target.result().success = true;
    };
    Game_Action.prototype.itemEffectSpecial = function(target, effect) {
        calls.originalSpecial.push({ target, effect });
    };

    function Game_Enemy() {}

    function Window_BattleLog() {}
    Window_BattleLog.prototype.push = function(methodName, ...args) {
        log.push([methodName, ...args]);
    };
    Window_BattleLog.prototype.displayActionResults = function() {
        log.push(['base']);
    };

    const BattleManager = {
        _phase: 'turn',
        _escaped: false,
        initMembers() {
            this._phase = '';
            this._escaped = false;
        },
        checkBattleEnd() {
            calls.victory++;
            return true;
        },
        processAbort() {
            calls.abort++;
            this._phase = 'battleEnd';
        }
    };

    const context = vm.createContext({
        Game_Action,
        Game_Enemy,
        Window_BattleLog,
        BattleManager,
        PluginManager: { parameters: () => parameters },
        SoundManager: { playEscape: () => calls.escapeSound++ },
        $gameMessage: { add: text => messages.push(text) },
        $gameParty: { inBattle: () => true, agility: () => partyAgility },
        Math: Object.assign(Object.create(Math), { random: () => state.random })
    });
    vm.runInContext(
        'String.prototype.format = function() { const a = arguments; return this.replace(/%([0-9]+)/g, (s, n) => a[Number(n) - 1]); };',
        context
    );
    vm.runInContext(pluginSource, context, { filename: 'EnemyEscapeSkill.js' });

    function makeEnemy({ agi = 100, meta = {} } = {}) {
        const result = { success: false };
        const enemy = Object.create(context.Game_Enemy.prototype);
        enemy.agi = agi;
        enemy.hidden = false;
        enemy.name = () => 'スライム';
        enemy.isEnemy = () => true;
        enemy.enemy = () => ({ meta });
        enemy.result = () => result;
        enemy.escape = function() {
            this.hidden = true;
            calls.escapeSound++;
        };
        return enemy;
    }

    return { context, calls, log, messages, state, makeEnemy, BattleManager, Game_Action };
}

test('success rate falls back to the agility formula and is clamped', () => {
    const { context, makeEnemy } = setup({ partyAgility: 100 });
    const enemy = makeEnemy({ agi: 120 });
    // 0.5 * 120 / 100 = 0.6
    assert.equal(enemy.escapeSkillRate(), 0.6);
    assert.equal(makeEnemy({ agi: 400 }).escapeSkillRate(), 1, 'clamped to the 100% maximum');
    assert.equal(makeEnemy({ agi: 1 }).escapeSkillRate(), 0.1, 'clamped to the 10% minimum');
    assert.equal(typeof context.Game_Enemy.prototype.escapeSkillRate, 'function');
});

test('note tag overrides the calculated rate', () => {
    const { makeEnemy } = setup();
    assert.equal(makeEnemy({ agi: 1, meta: { 'スキル逃走率': '70' } }).escapeSkillRate(), 0.7);
    assert.equal(makeEnemy({ agi: 1, meta: { SkillEscapeRate: '25' } }).escapeSkillRate(), 0.25);
    assert.equal(makeEnemy({ agi: 200, meta: { 'スキル逃走率': true } }).escapeSkillRate(), 1, 'a value-less tag is ignored');
});

test('a successful escape hides the enemy and requests the abort', () => {
    const { context, calls, makeEnemy, BattleManager } = setup({ random: 0.1, partyAgility: 100 });
    const enemy = makeEnemy({ agi: 100 });
    const action = new context.Game_Action();
    action.itemEffectSpecial(enemy, { dataId: 0 });

    assert.equal(enemy.hidden, true);
    assert.equal(calls.escapeSound, 1);
    assert.equal(calls.originalSpecial.length, 0, 'the original escape effect is replaced');
    assert.equal(enemy.result().enemyEscapeSkill.rate, 50);
    assert.equal(enemy.result().enemyEscapeSkill.success, true);
    assert.equal(BattleManager._enemyEscapeAbort, true);
});

test('a failed escape keeps the enemy in battle and does not abort', () => {
    const { context, calls, makeEnemy, BattleManager } = setup({ random: 0.9, partyAgility: 100 });
    const enemy = makeEnemy({ agi: 100 });
    new context.Game_Action().itemEffectSpecial(enemy, { dataId: 0 });

    assert.equal(enemy.hidden, false);
    assert.equal(calls.escapeSound, 0);
    assert.equal(enemy.result().enemyEscapeSkill.rate, 50);
    assert.equal(enemy.result().enemyEscapeSkill.success, false);
    assert.ok(!BattleManager._enemyEscapeAbort);
});

test('non-escape effects and actor targets keep the original behaviour', () => {
    const { context, calls, makeEnemy } = setup({ random: 0.1 });
    const action = new context.Game_Action();
    const enemy = makeEnemy();
    action.itemEffectSpecial(enemy, { dataId: 1 });
    const actor = { isEnemy: () => false, result: () => ({}) };
    action.itemEffectSpecial(actor, { dataId: 0 });

    assert.equal(calls.originalSpecial.length, 2);
    assert.equal(enemy.hidden, false);
});

test('the battle log shows the rate and the failure message', () => {
    const { context, log, makeEnemy } = setup({ random: 0.9, partyAgility: 100 });
    const enemy = makeEnemy({ agi: 100 });
    new context.Game_Action().itemEffectSpecial(enemy, { dataId: 0 });

    const win = new context.Window_BattleLog();
    win.displayActionResults({}, enemy);
    const texts = log.filter(entry => entry[0] === 'addText').map(entry => entry[1]);
    assert.equal(log[0][0], 'base', 'the standard result lines are kept');
    assert.deepEqual(texts, ['スライムは逃げ出そうとした！（成功率 50%）', 'しかしスライムは逃げられなかった！']);
    assert.equal(enemy.result().enemyEscapeSkill, null, 'the entry is consumed so it is not repeated');

    log.length = 0;
    win.displayActionResults({}, enemy);
    assert.equal(log.filter(entry => entry[0] === 'addText').length, 0);
});

test('the battle log shows the success message', () => {
    const { context, log, makeEnemy } = setup({ random: 0.1, partyAgility: 100 });
    const enemy = makeEnemy({ agi: 100 });
    new context.Game_Action().itemEffectSpecial(enemy, { dataId: 0 });

    new context.Window_BattleLog().displayActionResults({}, enemy);
    const texts = log.filter(entry => entry[0] === 'addText').map(entry => entry[1]);
    assert.deepEqual(texts, ['スライムは逃げ出そうとした！（成功率 50%）', 'スライムは逃げ出した！']);
});

test('checkBattleEnd aborts the battle instead of victory or defeat', () => {
    const { context, calls, makeEnemy, BattleManager } = setup({ random: 0.1 });
    const enemy = makeEnemy({ agi: 100 });
    new context.Game_Action().itemEffectSpecial(enemy, { dataId: 0 });

    assert.equal(BattleManager.checkBattleEnd(), true);
    assert.equal(calls.abort, 1);
    assert.equal(calls.victory, 0, 'the normal victory/defeat check is skipped');
    assert.equal(BattleManager._escaped, false, 'aborted, so it is neither a party escape nor a win');

    assert.equal(BattleManager.checkBattleEnd(), true);
    assert.equal(calls.abort, 1, 'the request is consumed once');
    assert.equal(calls.victory, 1);
});

test('the abort request is reset when a new battle starts', () => {
    const { context, makeEnemy, BattleManager } = setup({ random: 0.1 });
    new context.Game_Action().itemEffectSpecial(makeEnemy(), { dataId: 0 });
    BattleManager.initMembers();
    assert.equal(BattleManager._enemyEscapeAbort, false);
});

test('the abort shows the message window text before ending the battle', () => {
    const { context, messages, makeEnemy, BattleManager } = setup({ random: 0.1 });
    new context.Game_Action().itemEffectSpecial(makeEnemy(), { dataId: 0 });
    BattleManager.checkBattleEnd();
    assert.deepEqual(messages, ['逃げられてしまった・・・']);
});

test('the abort message accepts the enemy name and can be disabled', () => {
    const custom = setup({ random: 0.1, parameters: { AbortMessage: '%1に逃げられてしまった・・・' } });
    new custom.context.Game_Action().itemEffectSpecial(custom.makeEnemy(), { dataId: 0 });
    custom.BattleManager.checkBattleEnd();
    assert.deepEqual(custom.messages, ['スライムに逃げられてしまった・・・']);

    const silent = setup({ random: 0.1, parameters: { AbortMessage: '' } });
    new silent.context.Game_Action().itemEffectSpecial(silent.makeEnemy(), { dataId: 0 });
    silent.BattleManager.checkBattleEnd();
    assert.deepEqual(silent.messages, []);
    assert.equal(silent.calls.abort, 1, 'the battle is still aborted without a message');
});

test('custom message formats are used', () => {
    const { context, log, makeEnemy } = setup({
        random: 0.9,
        parameters: {
            TryFormat: '%1 escape chance %2%',
            FailureFormat: '%1 failed to flee'
        }
    });
    const enemy = makeEnemy({ agi: 100 });
    new context.Game_Action().itemEffectSpecial(enemy, { dataId: 0 });
    new context.Window_BattleLog().displayActionResults({}, enemy);
    const texts = log.filter(entry => entry[0] === 'addText').map(entry => entry[1]);
    assert.deepEqual(texts, ['スライム escape chance 50%', 'スライム failed to flee']);
});
