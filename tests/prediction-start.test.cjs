const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function slice(file, from, to) {
    const source = read(file);
    const start = from ? source.indexOf(from) : 0;
    const end = source.indexOf(to, start + 1);
    assert.ok(start >= 0 && end > start, `Installed source boundaries: ${file}: ${from} / ${to}`);
    return source.slice(start, end);
}

// Real engine objects/BattleManager and the installed LinearTimeBattle plugin.
// Keke_PredictionSystem is the bounded 行動予測システム section (battle-start,
// turn and action hooks plus makeActionFast); target-line/view rendering and
// misfire effects are seams. Timers are collected and flushed explicitly.
function setup({ linear = true } = {}) {
    const context = vm.createContext({ console, assert });
    const run = (source, filename = 'prediction-start-harness.js') =>
        vm.runInContext(source, context, { filename, timeout: 10000 });
    run(slice('js/rmmz_core.js', null, 'function Utils()'), 'installed-JsExtensions.js');
    run(slice('js/rmmz_managers.js', null, 'function ConfigManager()'), 'installed-DataManager.js');
    run(slice('js/rmmz_managers.js', 'function BattleManager()', 'function PluginManager()'),
        'installed-BattleManager.js');
    run(read('js/rmmz_objects.js'), 'js/rmmz_objects.js');
    for (const name of ['System', 'Actors', 'Classes', 'Weapons', 'Armors', 'States',
        'Skills', 'Items', 'Enemies', 'Troops', 'CommonEvents']) {
        run(`globalThis.$data${name} = ${read(`data/${name}.json`)};`);
    }
    run(`
        const PluginManager = { parameters: () => ({}), _scripts: [] };
        const Utils = { isOptionValid: () => false };
        const Graphics = { width: 816, height: 624, boxWidth: 816, boxHeight: 624 };
        const ColorManager = { normalColor: () => '#fff', outlineColor: () => '#000', textColor: () => '#fff' };
        const TextManager = { partyName: '%1 party' };
        const Input = { isLongPressed: () => false, isPressed: () => false };
        const TouchInput = { isLongPressed: () => false };
        const SceneManager = { _scene: { _partyCommandWindow: { active: false } } };
        const ImageManager = { isObjectCharacter: () => false };
        class Rectangle { constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); } }
        const timers = [];
        function setTimeout(fn, ms, ...args) { timers.push(() => fn(...args)); }
        function flushTimers() { while (timers.length) timers.shift()(); }
        function Scene_Battle() { this.windows = []; this._logWindow = { y: 0 }; }
        Scene_Battle.prototype.calcWindowHeight = () => 60;
        Scene_Battle.prototype.logWindowRect = () => new Rectangle(0, 0, 816, 60);
        Scene_Battle.prototype.skillWindowRect = () => new Rectangle(0, 60, 816, 360);
        Scene_Battle.prototype.itemWindowRect = function() { return this.skillWindowRect(); };
        Scene_Battle.prototype.enemyWindowRect = function() { return this.skillWindowRect(); };
        Scene_Battle.prototype.createAllWindows = function() {};
        Scene_Battle.prototype.addWindow = function() {};
        function Window_Base() {}
        Window_Base.prototype.initialize = function() {};
    `);
    // Keke hooks; makeTargetFast/delTargetFast/effects are rendering seams.
    run(`(() => {
        const makeTargetFast = () => {};
        const delTargetFast = () => {};
        const doEffect = () => {};
        const keke_actMisfireEffect = null;
        ${slice('js/plugins/Battle/Enemy/Keke_PredictionSystem.js', '    // 再決定予約',
            '    //- 先行アクション済みのキャラをチャージ完了まで行動させない')}
    })();`, 'installed-Keke-prediction-section.js');
    run(`
        // Wrapper installed before LinearTimeBattle, like Keke's former initTpbChargeTime hook.
        globalThis.initProbeCalls = 0;
        const probeInit = Game_Battler.prototype.initTpbChargeTime;
        Game_Battler.prototype.initTpbChargeTime = function() {
            globalThis.initProbeCalls++;
            return probeInit.apply(this, arguments);
        };
    `);
    if (linear) run(read('js/plugins/LinearTimeBattle.js'), 'js/plugins/LinearTimeBattle.js');
    run(`
        $dataSystem.battleSystem = 1;
        $dataClasses[1].traits = [];
        for (let id = 1; id <= 2; id++) {
            $dataActors[id] = { ...$dataActors[1], id, name: 'A' + id, classId: 1,
                initialLevel: 1, equips: [], traits: [] };
        }
        $dataSkills[999] = { ...$dataSkills[1], id: 999, name: 'Probe', occasion: 0, scope: 1,
            mpCost: 0, tpCost: 0, stypeId: 0, repeats: 1, effects: [], note: '', speed: 0,
            damage: { type: 0, elementId: 0, formula: '0', variance: 0, critical: false } };
        $dataEnemies[1] = { ...$dataEnemies[1], traits: [], params: [9999, 999, 10, 10, 10, 10, 100, 10],
            actions: [{ skillId: 999, conditionType: 0, conditionParam1: 0, conditionParam2: 0, rating: 5 }] };
        for (const value of Object.values(globalThis)) {
            if (Array.isArray(value)) for (const entry of value) {
                if (entry && typeof entry === 'object' && 'note' in entry) DataManager.extractMetadata(entry);
            }
        }
        $gameTemp = new Game_Temp(); $gameSystem = new Game_System(); $gameActors = new Game_Actors();
        $gameVariables = new Game_Variables(); $gameSwitches = new Game_Switches(); $gameMessage = new Game_Message();
        $gameParty = new Game_Party(); $gameTroop = new Game_Troop();
        function battle({ preemptive = false, surprise = false } = {}) {
            BattleManager.initMembers();
            BattleManager._phase = 'turn';
            BattleManager._preemptive = preemptive;
            BattleManager._surprise = surprise;
            $gameParty._actors = [1, 2];
            $gameParty._inBattle = true;
            $gameTroop.setup(1);
            $gameTroop._enemies = [new Game_Enemy(1, 0, 0), new Game_Enemy(1, 0, 0)];
            $gameTroop.makeUniqueNames();
            $gameParty.onBattleStart(preemptive);
            $gameTroop.onBattleStart(surprise);
        }
    `);
    return run;
}

test('installed LinearTimeBattle bypasses earlier initTpbChargeTime wrappers', () => {
    setup()(`
        battle();
        assert.equal(initProbeCalls, 0, 'wrappers on initTpbChargeTime never run under LinearTimeBattle');
        assert.equal($gameTroop.members()[0].tpbChargeTime(), 0);
    `);
    setup({ linear: false })(`
        Math.random = () => 0.5;
        battle();
        assert.equal(initProbeCalls, 4);
    `);
});

test('enemies have predicted actions immediately after battle start with LinearTimeBattle', () => {
    setup()(`
        battle();
        assert.deepEqual($gameTroop.members().map(e => e._actions.length), [0, 0], 'prediction is deferred');
        flushTimers();
        for (const enemy of $gameTroop.members()) {
            assert.equal(enemy._actions.length, 1, 'first-turn action was pre-decided');
            assert.equal(enemy._actions[0].item().id, 999);
            assert.equal(enemy._actionMakedFastKe, true);
        }
        assert.deepEqual($gameParty.battleMembers().map(a => a._actions.length), [0, 0], 'actors are not predicted');
    `);
});

test('prediction start matches the engine without LinearTimeBattle and skips preemptive enemies', () => {
    setup({ linear: false })(`
        Math.random = () => 0.5;
        battle();
        flushTimers();
        assert.deepEqual($gameTroop.members().map(e => e._actions.length), [1, 1]);
        battle({ preemptive: true });
        flushTimers();
        assert.deepEqual($gameTroop.members().map(e => e._actions.length), [0, 0]);
    `);
    setup()(`
        battle({ preemptive: true });
        flushTimers();
        assert.deepEqual($gameTroop.members().map(e => e._actions.length), [0, 0]);
        battle({ surprise: true });
        flushTimers();
        assert.deepEqual($gameTroop.members().map(e => e._actions.length), [1, 1]);
    `);
});

test('pre-decided first-turn action is adopted by startTpbTurn instead of being re-rolled', () => {
    setup()(`
        battle();
        flushTimers();
        const enemy = $gameTroop.members()[0];
        const predicted = enemy._actions[0];
        enemy._tpbChargeTime = 1;
        enemy.onTpbCharged();
        enemy.onTurnEnd();
        enemy.startTpbTurn();
        assert.equal(enemy._actions[0], predicted, 'startTpbTurn keeps the predicted action object');
        assert.equal(enemy._actionMakedFastKe, false);
    `);
});
