const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function setup({ enemy = false, tpb = true } = {}) {
    const context = vm.createContext({ console });
    const run = source => vm.runInContext(source, context);
    const core = read('js/rmmz_core.js');
    run(core.slice(0, core.indexOf('function Utils()')));
    const managers = read('js/rmmz_managers.js');
    run(managers.slice(0, managers.indexOf('function ConfigManager()')));
    run(managers.slice(managers.indexOf('function BattleManager()'),
        managers.indexOf('function PluginManager()')));
    run(read('js/rmmz_objects.js'));
    for (const name of ['System', 'Actors', 'Classes', 'Weapons', 'Armors', 'States',
        'Skills', 'Items', 'Enemies', 'Troops']) {
        run(`globalThis.$data${name} = ${read(`data/${name}.json`)};`);
    }
    run(`
        const Utils = {isOptionValid: () => false};
        for (const name of ['Actors', 'Classes', 'Weapons', 'Armors', 'States',
            'Skills', 'Items', 'Enemies']) {
            for (const entry of globalThis['$data' + name]) {
                if (entry) entry.meta = {};
            }
        }
        const TextManager = {partyName: '%1 party'};
        const SoundManager = {playActorDamage() {}, playEnemyDamage() {}};
        const $gameMap = {requestRefresh() {}};
        const $gameTemp = new Game_Temp();
        const $gameSystem = new Game_System();
        const $gameActors = new Game_Actors();
        const $gameParty = new Game_Party();
        const $gameTroop = new Game_Troop();
        const $gameVariables = new Game_Variables();
        const $gameSwitches = new Game_Switches();
        $gameParty._actors = [1];
        $gameParty._inBattle = true;
        $dataActors[1].equips = [];
        $dataEnemies[1].params[1] = 100;
        $dataSystem.battleSystem = ${tpb ? 2 : 0};
        const subject = ${enemy ? 'new Game_Enemy(1, 0, 0)' : '$gameActors.actor(1)'};
        const target = new Game_Enemy(2, 0, 0);
        $gameTroop._enemies = [${enemy ? 'subject, ' : ''}target];
        let randomValue = 0.5;
        let randomCalls = 0;
        Math.random = () => {randomCalls++; return randomValue;};
        subject.addState(9);
        subject._stateTurns[9] = 3;
        subject._tpbState = 'acting';
        subject.setMp(100);
        subject.setTp(100);
        const skill = {...$dataSkills[1], id: 1, mpCost: 10, tpCost: 5,
            repeats: 5, effects: [], meta: {}};
        $dataSkills[1] = skill;
        const logs = [];
        const starts = [];
        BattleManager.initMembers();
        BattleManager._phase = 'turn';
        BattleManager._subject = subject;
        BattleManager._logWindow = {
            push(...args) { logs.push(args); },
            startAction(s, a, targets) {starts.push({s, a, targets});},
            endAction() {},
            displayAutoAffectedStatus() {},
            displayCurrentState() {},
            displayRegeneration() {}
        };
        // Stand-in for prediction's prepare hook: each prepared action consumes
        // one target reservation before the paralysis decision.
        let prepared = 0;
        const originalPrepare = Game_Action.prototype.prepare;
        Game_Action.prototype.prepare = function() {
            originalPrepare.call(this);
            prepared++;
        };
        function queue(forcing = false) {
            const action = new Game_Action(subject, forcing);
            action.setSkill(1);
            action.setTarget(${enemy ? 1 : 0});
            subject._actions.push(action);
            return action;
        }
        randomCalls = 0;
    `);
    run(read('js/plugins/State/ParalysisActionChance.js'));
    return run;
}

test('state data enables input and keeps duration and existing evasion penalty', () => {
    const run = setup();
    assert.equal(run('subject.canMove()'), true);
    run("subject._tpbState = 'charged';");
    assert.equal(run('subject.canInput()'), true);
    assert.equal(run('$dataStates[9].minTurns'), 1);
    assert.equal(run('$dataStates[9].maxTurns'), 5);
    assert.equal(run('$dataStates[9].traits[0].value'), -10);
    assert.match(run('$dataStates[9].message1'), /30%/);
    assert.equal(run('randomCalls'), 0);
});

for (const enemy of [false, true]) {
    for (const tpb of [false, true]) {
        test(`30% threshold and normal completion (${enemy ? 'enemy' : 'actor'}, ${tpb ? 'TPB' : 'turn'})`, () => {
            const run = setup({ enemy, tpb });
            run('randomValue = 0.299999; queue(); BattleManager.processTurn();');
            assert.equal(run('randomCalls'), 1);
            assert.equal(run('starts.length'), 0);
            assert.equal(run('subject.numActions()'), 0);
            assert.equal(run('subject.mp'), 100);
            assert.equal(run('subject.tp'), 100);
            assert.equal(run('prepared'), 1);
            assert.match(run('logs[0][1]'), /麻痺で動けない/);
            run('BattleManager.processTurn();');
            assert.equal(run('BattleManager._subject'), null);
            assert.equal(run('subject._tpbChargeTime'), 0);
            assert.equal(run('subject.isStateAffected(9)'), true);

            run('BattleManager._subject = subject; randomValue = 0.3; queue(); BattleManager.processTurn();');
            assert.equal(run('starts.length'), 1);
            assert.equal(run('subject.mp'), 90);
            assert.equal(run('subject.tp'), 95);
        });
    }
}

test('each additional action rolls independently, not each hit of a repeated skill', () => {
    const run = setup();
    run('queue(); queue(); randomValue = 0.1; BattleManager.processTurn();');
    assert.equal(run('subject.numActions()'), 1);
    run('randomValue = 0.9; BattleManager.processTurn();');
    assert.equal(run('randomCalls'), 2);
    assert.equal(run('starts.length'), 1);
    assert.equal(run('starts[0].targets.length'), 5);
    assert.equal(run('prepared'), 2);
});

test('exactly 30 of 100 evenly spaced random samples cancel an action', () => {
    const run = setup();
    run(`
        let canceled = 0;
        for (let i = 0; i < 100; i++) {
            subject._actions = [];
            const action = queue();
            randomValue = (i + 0.5) / 100;
            action.prepare();
            if (!action.isValid()) canceled++;
        }
    `);
    assert.equal(run('canceled'), 30);
    assert.equal(run('randomCalls'), 100);
});

test('auto battle actions use the same paralysis decision', () => {
    const run = setup();
    run(`
        $dataActors[1].traits.push({code: 62, dataId: 0, value: 1});
        queue(); randomValue = 0.1; BattleManager.processTurn();
    `);
    assert.equal(run('subject.isAutoBattle()'), true);
    assert.equal(run('randomCalls'), 1);
    assert.equal(run('starts.length'), 0);
    assert.equal(run('subject.numActions()'), 0);
});

test('a skipped item action does not consume the item', () => {
    const run = setup();
    run(`
        $dataItems[1] = {...$dataItems[1], scope: 1, occasion: 0, consumable: true};
        $gameParty.gainItem($dataItems[1], 2);
        queue().setItem(1);
        randomValue = 0.1;
        BattleManager.processTurn();
    `);
    assert.equal(run('$gameParty.numItems($dataItems[1])'), 2);
    assert.equal(run('subject.numActions()'), 0);
});

test('no paralysis, stun, invalid actions and forced actions do not roll', () => {
    for (const change of [
        'subject.removeState(9);',
        'subject.addState(6);',
        'subject.setMp(0);'
    ]) {
        const run = setup();
        run(`queue(); ${change} randomCalls = 0; randomValue = 0.1; BattleManager.processTurn();`);
        assert.equal(run('randomCalls'), 0);
        assert.equal(run('logs.length'), 0);
    }
    const run = setup();
    run('queue(true); randomValue = 0.1; BattleManager.processTurn();');
    assert.equal(run('randomCalls'), 0);
    assert.equal(run('starts.length'), 1);
});

test('preparing an action outside execution does not roll or clear it', () => {
    const run = setup();
    run('const action = queue(); BattleManager._subject = null; action.prepare();');
    assert.equal(run('randomCalls'), 0);
    assert.equal(run('action.item().id'), 1);
    assert.equal(run('action.isValid()'), true);
});

test('recovery restores normal actions and turn countdown remains unchanged', () => {
    const run = setup();
    run('subject.onTurnEnd();');
    assert.equal(run('subject._stateTurns[9]'), 2);
    run('subject.onTurnEnd(); subject.onTurnEnd();');
    assert.equal(run('subject.isStateAffected(9)'), false);
    run('queue(); randomCalls = 0; randomValue = 0.1; BattleManager.processTurn();');
    assert.equal(run('randomCalls'), 0);
    assert.equal(run('starts.length'), 1);
});

test('the plugin is enabled after existing action preparation hooks', () => {
    const context = {};
    vm.runInNewContext(read('js/plugins.js'), context);
    const plugins = context.$plugins;
    const index = plugins.findIndex(p => p.name === 'State/ParalysisActionChance');
    assert.ok(index >= 0);
    assert.equal(plugins[index].status, true);
    for (const name of ['Battle/Enemy/Keke_PredictionSystem', 'Battle/Enemy/Keke_TotalDamage']) {
        assert.ok(plugins.findIndex(p => p.name === name) < index);
    }
});
