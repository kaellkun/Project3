const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const plugin = fs.readFileSync(
    path.join(root, 'js/plugins/Battle/Log/RIT_BattleLogEx.js'),
    'utf8'
);

function setupLog() {
    function Window_BattleLog() {}
    Object.assign(Window_BattleLog.prototype, {
        startAction() {},
        displayAction() {},
        endAction() {},
        clear() {},
        displayHpDamage() {},
        displayMpDamage() {},
        displayTpDamage() {},
        displayMiss() {},
        displayEvasion() {},
        displayAddedStates() {},
        displayCurrentState() {}
    });
    const context = {
        PluginManager: { parameters: () => ({}) },
        Window_BattleLog,
        TextManager: {},
        window: {}
    };
    vm.runInNewContext(plugin, context, { filename: 'RIT_BattleLogEx.js' });
    context.Window_BattleLog.context = context;
    return context.Window_BattleLog;
}

test('death state schedules enemy collapse', () => {
    const Window_BattleLog = setupLog();
    const commands = [];
    const target = {
        isActor: () => false,
        deathStateId: () => 1,
        result: () => ({ addedStateObjects: () => [{ id: 1, message2: '' }] })
    };

    Window_BattleLog.prototype.displayAddedStates.call({
        push: (...args) => commands.push(args)
    }, target);

    assert.deepEqual(commands, [['performCollapse', target]]);
});

test('non-death state does not schedule collapse', () => {
    const Window_BattleLog = setupLog();
    const commands = [];
    const target = {
        isActor: () => false,
        deathStateId: () => 1,
        result: () => ({ addedStateObjects: () => [{ id: 5, message2: '' }] })
    };

    Window_BattleLog.prototype.displayAddedStates.call({
        push: (...args) => commands.push(args)
    }, target);

    assert.deepEqual(commands, []);
});

test('zero HP damage displays a concise zero-damage message', () => {
    const Window_BattleLog = setupLog();
    const commands = [];
    const target = {
        result: () => ({ hpAffected: true, hpDamage: 0 })
    };

    Window_BattleLog.prototype.displayHpDamage.call({
        push: (...args) => commands.push(args),
        getHierarchyPrefix: () => ''
    }, target);

    assert.deepEqual(commands, [['addText', 'ダメージ0！']]);
});

test('evasion displays the configured ordinary attack-evaded message', () => {
    const Window_BattleLog = setupLog();
    const commands = [];
    const target = {
        result: () => ({ physical: true }),
        name: () => '対象'
    };
    const battleLog = {
        push: (...args) => commands.push(args),
        getHierarchyPrefix: () => ''
    };

    Window_BattleLog.context.TextManager.evasion = {
        format: name => `${name}は攻撃を避けた！`
    };
    Window_BattleLog.prototype.displayEvasion.call(battleLog, target);

    assert.deepEqual(commands, [['addText', '対象は攻撃を避けた！']]);
});