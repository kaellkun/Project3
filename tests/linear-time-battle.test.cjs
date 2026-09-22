const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const database = {};
for (const name of ['System', 'Actors', 'Classes', 'Weapons', 'Armors', 'States',
    'Skills', 'Items', 'Enemies', 'Troops', 'CommonEvents']) {
    database[`$data${name}`] = JSON.parse(read(`data/${name}.json`));
}

function slice(file, from, to) {
    const source = read(file);
    const start = from ? source.indexOf(from) : 0;
    const end = source.indexOf(to, start + 1);
    assert.ok(start >= 0 && end > start, `Installed source boundaries: ${file}: ${from} / ${to}`);
    return source.slice(start, end);
}

function setup(parameters = {}, { keke = false, plugin = true, topUi = true } = {}) {
    const context = vm.createContext({ console, assert, parameters, topUi });
    const run = (source, filename = 'linear-time-battle-harness.js') =>
        vm.runInContext(source, context, { filename, timeout: 10000 });
    run(slice('js/rmmz_core.js', null, 'function Utils()'), 'installed-JsExtensions.js');
    run(slice('js/rmmz_managers.js', null, 'function ConfigManager()'), 'installed-DataManager.js');
    run(slice('js/rmmz_managers.js', 'function BattleManager()', 'function PluginManager()'),
        'installed-BattleManager.js');
    run(read('js/rmmz_objects.js'), 'js/rmmz_objects.js');
    run(`
        Object.assign(globalThis, ${JSON.stringify(database)});
        const PluginManager = {
            parameters: () => parameters,
            _scripts: topUi ? ['Keke_SpeedStarBattle', 'FlexibleTopDownUI', 'HelpWindowThreeLines'] : []
        };
        const Utils = { isOptionValid: () => false };
        const Graphics = { width: 816, height: 624, boxWidth: 816, boxHeight: 624 };
        const ColorManager = { normalColor: () => '#fff', outlineColor: () => '#000',
            textColor: n => ({ 1: '#20a0d6', 2: '#ff784c', 6: '#ffffa0' })[n] || '#fff' + n };
        const TextManager = { escapeStart: '%1 escapes', escapeFailure: 'Failed', partyName: '%1 party' };
        let pressed = false;
        const Input = { isLongPressed: () => false, isPressed: () => pressed };
        const TouchInput = { isLongPressed: () => false };
        const SceneManager = { _scene: { _partyCommandWindow: { active: false } } };

        // Only low-level rendering is simulated. Window_Base itself is installed engine code.
        class Rectangle {
            constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); }
        }
        class Bitmap {
            constructor(width, height) {
                Object.assign(this, { width, height, ready: false, text: [], fills: [], clears: 0 });
            }
            isReady() { return this.ready; }
            clear() { this.text = []; this.fills = []; this.clears++; }
            drawText(...args) { this.text.push(args); }
            fillRect(...args) { this.fills.push(args); }
            destroy() { this.destroyed = true; }
        }
        class Sprite {
            constructor() {
                this.visible = true;
                this.anchor = { set(x, y = x) { this.x = x; this.y = y; } };
                this.scale = { set(x, y = x) { this.x = x; this.y = y; } };
            }
            setFrame(...frame) { this.frame = frame; }
            setHue(hue) { this.hue = hue; }
        }
        function Window() {}
        Window.prototype.initialize = function() {
            this.children = [];
            this.openness = 255;
            // Client area draw order: contentsBack, cursor, contents (installed Window layout).
            this._contentsSprite = { name: 'contents' };
            this._clientArea = {
                children: [{ name: 'contentsBack' }, { name: 'cursor' }, this._contentsSprite],
                getChildIndex(child) { return this.children.indexOf(child); },
                setChildIndex(child, index) {
                    this.children.splice(this.children.indexOf(child), 1);
                    this.children.splice(index, 0, child);
                }
            };
        };
        Window.prototype.move = function(x, y, width, height) { Object.assign(this, { x, y, width, height }); };
        Window.prototype.setTone = function() {};
        Window.prototype.update = function() {};
        Window.prototype.addInnerChild = function(child) {
            this.children.push(child);
            this._clientArea.children.push(child);
            return child;
        };
        Object.defineProperties(Window.prototype, {
            innerWidth: { get() { return Math.max(0, this.width - 2 * this.padding); } },
            innerHeight: { get() { return Math.max(0, this.height - 2 * this.padding); } }
        });
        const imageCache = new Map();
        const imageSizes = { face: [576, 288], character: [576, 384], bigCharacter: [144, 192] };
        function image(kind, name) {
            const key = kind + ':' + name;
            if (!imageCache.has(key)) {
                const [width, height] = imageSizes[kind === 'character' && name.startsWith('$') ?
                    'bigCharacter' : kind] || [180, 90];
                imageCache.set(key, new Bitmap(width, height));
            }
            return imageCache.get(key);
        }
        const ImageManager = {
            faceWidth: 144, faceHeight: 144,
            loadFace: name => image('face', name), loadEnemy: name => image('enemy', name),
            loadCharacter: name => image('character', name),
            isBigCharacter: name => /^[!$]*[$]/.test(name),
            loadSvEnemy: name => image('svEnemy', name), loadSystem: name => image('system', name)
        };

        // Explicit scene layout seams, NOT a full Keke/FlexibleTopDownUI rendering integration.
        // Nested item/enemy -> skill calls reproduce the installed scene's rectangle delegation.
        function Scene_Battle() { this.windows = []; this._logWindow = { y: 0 }; }
        Scene_Battle.prototype.calcWindowHeight = () => 60;
        Scene_Battle.prototype.logWindowRect = () => new Rectangle(0, 0, 816, 60);
        Scene_Battle.prototype.skillWindowRect = () => new Rectangle(0, 60, 816, 360);
        Scene_Battle.prototype.itemWindowRect = function() { return this.skillWindowRect(); };
        Scene_Battle.prototype.enemyWindowRect = function() { return this.skillWindowRect(); };
        Scene_Battle.prototype.relayoutBattleWindows = function() { this._logWindow.y = 0; };
        Scene_Battle.prototype.createAllWindows = function() { this.createdBaseWindows = true; };
        Scene_Battle.prototype.addWindow = function(window) { this.windows.push(window); };
    `);
    run(slice('js/rmmz_windows.js', 'function Window_Base()', 'function Window_Scrollable()'),
        'installed-Window_Base.js');

    if (keke) {
        // Actual bounded Keke acceleration/reference-time and timeSpeed/longPressFast/autoFast
        // code, with explicit settings and input/scene seams. Not the full Keke plugin.
        run(`(() => {
            const keke_turboRate = 5;
            const keke_timeAutoFast = 3;
            ${slice('js/plugins/Keke_SpeedStarBattle.js', 'function timeSpeed()', 'function battleSpeed(')}
            ${slice('js/plugins/Keke_SpeedStarBattle.js',
                'const _Game_Battler_tpbAcceleration =', 'const _Sprite_Enemy_isEffecting =')}
        })();`, 'installed-Keke-bounded-timing-helpers.js');
    }
    if (plugin) run(read('js/plugins/LinearTimeBattle.js'), 'js/plugins/LinearTimeBattle.js');
    run(`
        // Controlled DB fixtures remove unrelated project equipment/traits/random extra actions.
        // AGI getters, parameters/buffs, AI, Game_Action, and the complete TPB lifecycle stay real.
        $dataSystem.battleSystem = 1;
        $dataClasses[1].traits = [];
        $dataClasses[1].params[6] = $dataClasses[1].params[6].map(() => 100);
        for (let id = 1; id <= 4; id++) {
            $dataActors[id] = { ...$dataActors[1], id, name: 'A' + id, classId: 1,
                initialLevel: 1, equips: [], traits: [], faceName: 'Actor1', faceIndex: id + 3 };
        }
        $dataSkills[999] = { ...$dataSkills[1], id: 999, name: 'Harmless timing probe',
            note: '<LinearTimeTest:true>', occasion: 0, scope: 0, speed: -10000,
            mpCost: 0, tpCost: 0, stypeId: 0, repeats: 1, effects: [],
            damage: { type: 0, elementId: 0, formula: '0', variance: 0, critical: false } };
        $dataEnemies[1] = { ...$dataEnemies[1], traits: [],
            params: [9999, 999, 10, 10, 10, 10, 100, 10],
            actions: [{ skillId: 999, conditionType: 0, conditionParam1: 0,
                conditionParam2: 0, rating: 5 }] };
        for (const value of Object.values(globalThis)) {
            if (Array.isArray(value)) for (const entry of value) {
                if (entry && typeof entry === 'object' && 'note' in entry) DataManager.extractMetadata(entry);
            }
        }
        $gameTemp = new Game_Temp();
        $gameSystem = new Game_System();
        $gameActors = new Game_Actors();
        $gameVariables = new Game_Variables();
        $gameSwitches = new Game_Switches();
        $gameMessage = new Game_Message();
        $gameParty = new Game_Party();
        $gameTroop = new Game_Troop();
        $gameSystem._timeSpeedKe = 1;
        let actors, enemies, actor, enemy;
        const started = [];
        const ended = [];
        const castInputs = [];
        const realEndBattlerActions = BattleManager.endBattlerActions;
        BattleManager.endBattlerActions = function(battler) {
            realEndBattlerActions.call(this, battler);
            ended.push(battler);
            assert.equal(battler.tpbChargeTime(), 0, 'real endBattlerActions resets only completed battler');
            assert.equal(battler._tpbState, 'charging');
        };
        const id = b => b.isActor() ? 'A' + b.actorId() : 'E' + (b.index() + 1);
        function near(actual, expected, message = '') {
            assert.ok(Math.abs(actual - expected) < 1e-9, message + ': ' + actual + ' != ' + expected);
        }
        function setAgility(battler, value) {
            battler.addParam(6, value - battler.agi);
            assert.equal(battler.agi, value);
        }
        function battle(actorSpeeds = [200], enemySpeeds = [100], { preemptive = false, surprise = false } = {}) {
            BattleManager.initMembers();
            BattleManager._phase = 'turn';
            BattleManager._tpbNeedsPartyCommand = false;
            BattleManager._preemptive = preemptive;
            BattleManager._surprise = surprise;
            $gameParty._actors = actorSpeeds.map((_, i) => i + 1);
            $gameParty._inBattle = true;
            actors = $gameParty.battleMembers();
            actors.forEach((b, i) => { b.clearStates(); b.clearBuffs(); b.clearParamPlus();
                b.clearActions(); setAgility(b, actorSpeeds[i]); b.recoverAll(); });
            $gameTroop.setup(1); // Retain a real troop ID/pages for increaseTurn and the interpreter.
            $gameTroop._enemies = enemySpeeds.map(speed => {
                const b = new Game_Enemy(1, 0, 0); setAgility(b, speed); return b;
            });
            $gameTroop._turnCount = 0;
            $gameTroop.makeUniqueNames();
            enemies = $gameTroop.members();
            [actor] = actors; [enemy] = enemies;
            $gameParty.onBattleStart(preemptive);
            $gameTroop.onBattleStart(surprise);
            started.length = ended.length = castInputs.length = 0;
            BattleManager._logWindow = {
                displayAutoAffectedStatus() {}, displayCurrentState() {}, displayRegeneration() {},
                endAction() {},
                startAction(b, action) {
                    assert.ok(action instanceof Game_Action);
                    assert.equal(action.item().id, 999, 'real enemy AI/manual actor input chose test skill');
                    started.push(b);
                }
            };
        }
        function submitInput() {
            BattleManager.updateTpbInput();
            while (BattleManager.actor()) {
                const b = BattleManager.actor();
                assert.equal(b.isAutoBattle(), false);
                assert.equal(b._tpbState, 'charged');
                const action = BattleManager.inputtingAction();
                assert.ok(action instanceof Game_Action);
                action.setSkill(999);
                BattleManager.selectNextCommand();
                assert.equal(b._tpbState, 'casting', 'actual finishActorInput enters casting');
                castInputs.push(b);
            }
            BattleManager.updateTpbInput();
        }
        function assertFrozen(frames = 3) {
            const members = BattleManager.allBattleMembers();
            const gauges = members.map(b => b.tpbChargeTime());
            for (let i = 0; i < frames; i++) {
                BattleManager.updateTpb();
                assert.deepEqual(members.map(b => b.tpbChargeTime()), gauges,
                    'pending input/casting/ready/acting preserves every fractional gauge');
            }
        }
        function runActions(count) {
            const target = started.length + count;
            for (let frame = 0; frame < 200000; frame++) {
                if (BattleManager._phase === 'action') {
                    assertFrozen(2);
                    BattleManager.updateAction();
                } else if (BattleManager._phase === 'turnEnd') {
                    BattleManager.updateTurnEnd();
                } else {
                    BattleManager.updateTurn(true);
                }
                submitInput();
                if (started.length >= target && !BattleManager._subject) {
                    assert.equal(ended.length, started.length, 'each actual action queue entry was consumed');
                    assert.ok(ended.every(b => b instanceof Game_Battler));
                    return started.map(id);
                }
            }
            assert.fail('Actual BattleManager progression stalled: ' + JSON.stringify({
                started: started.map(id), phase: BattleManager._phase,
                states: BattleManager.allBattleMembers().map(b => [id(b), b._tpbState, b.tpbChargeTime()])
            }));
        }
        function createTimeline() {
            const scene = new Scene_Battle();
            scene.createAllWindows();
            return { scene, window: scene._linearTimeOrderWindow };
        }
        battle();
    `);
    return run;
}

test('long paused active input does not time out or consume immobilized turns', () => {
    setup()(`
        actor._tpbState = 'charged';
        actor._tpbTurnEnd = false;
        actor._tpbIdleTime = 0;
        enemy.canMove = () => false;
        enemy._tpbIdleTime = 0;
        for (let i = 0; i < 1000; i++) BattleManager.updateTpb();
        assert.equal(actor._tpbIdleTime, 0);
        assert.equal(enemy._tpbIdleTime, 0);
        assert.equal(actor.isTpbTimeout(), false);
    `);
});

test('immobilized recovery time advances on the shared clock when nothing is pending', () => {
    setup()(`
        actor.canMove = () => false;
        enemy.canMove = () => false;
        BattleManager.updateTpb();
        near(actor._tpbIdleTime, 200 / 100 / 120);
        near(enemy._tpbIdleTime, 100 / 100 / 120);
        const before = actor._tpbTurnCount;
        for (let i = 0; i < 65; i++) BattleManager.updateTpb();
        assert.ok(actor._tpbTurnCount > before, 'recovery turns do not deadlock');
    `);
});

// Independent rational event oracle: compare k/AGI by cross multiplication,
// never by the plugin's forecast or by replacing battler acceleration methods.
function expectedOrder(actorSpeeds, enemySpeeds, count) {
    const entries = [...actorSpeeds.map((speed, i) => ({ id: `A${i + 1}`, speed })),
        ...enemySpeeds.map((speed, i) => ({ id: `E${i + 1}`, speed }))]
        .map((entry, index) => ({ ...entry, index, arrival: 1 }));
    return Array.from({ length: count }, () => {
        entries.sort((a, b) => a.arrival * b.speed - b.arrival * a.speed ||
            b.speed - a.speed || a.index - b.index);
        const next = entries[0];
        next.arrival++;
        return next.id;
    });
}

test('registration: enabled exactly once after Keke and the UI plugins', () => {
    const context = vm.createContext({});
    vm.runInContext(read('js/plugins.js'), context);
    const enabled = context.$plugins.filter(p => p.status).map(p => p.name);
    assert.equal(enabled.filter(name => name === 'LinearTimeBattle').length, 1);
    for (const dependency of ['Keke_SpeedStarBattle', 'FlexibleTopDownUI', 'HelpWindowThreeLines']) {
        assert.ok(enabled.includes(dependency), `${dependency} must actually be enabled`);
        assert.ok(enabled.indexOf('LinearTimeBattle') > enabled.indexOf(dependency));
    }
});

test('real parameters: linear 200:100 and absolute rates independent of party maximum and TPB mode', () => {
    setup()(`
        assert.equal($dataSkills[999].meta.LinearTimeTest, 'true');
        assert.equal(actor.tpbSpeed(), 200);
        assert.equal(enemy.tpbSpeed(), 100);
        near(actor.tpbAcceleration(), 2 / 120);
        near(enemy.tpbAcceleration(), 1 / 120);
        battle([100], [200]);
        near(actor.tpbAcceleration(), 1 / 120);
        near(enemy.tpbAcceleration(), 2 / 120);
        battle([100, 999], [200]);
        near(actor.tpbAcceleration(), 1 / 120);
        near(enemy.tpbAcceleration(), 2 / 120);
        $dataSystem.battleSystem = 2;
        near(actor.tpbAcceleration(), 1 / 120);
        near(enemy.tpbAcceleration(), 2 / 120);
        setAgility(actor, 0);
        near(actor.tpbAcceleration(), 1 / 100 / 120);
    `);
});

test('custom fixed reference agility and charge frames affect absolute rates', () => {
    setup({ ReferenceAgility: '50', ChargeFrames: '30' })(`
        near(actor.tpbAcceleration(), 200 / 50 / 30);
        near(enemy.tpbAcceleration(), 100 / 50 / 30);
    `);
});

test('initialization: deterministic zero, advantage, restrictions, preemptive and surprise', () => {
    setup()(`
        const restriction = $dataStates.find(s => s && s.id !== 1 && s.restriction === 4);
        assert.ok(restriction, 'installed database has an immobilizing state');
        const random = Math.random;
        Math.random = () => { throw new Error('charge initialization must not consume randomness'); };
        for (let i = 0; i < 10; i++) {
            for (const b of [actor, enemy]) {
                b.initTpbChargeTime(false); assert.equal(b.tpbChargeTime(), 0);
                b.initTpbChargeTime(true); assert.equal(b.tpbChargeTime(), 1);
            }
        }
        Math.random = random;
        actor.addState(restriction.id);
        actor.initTpbChargeTime(true);
        assert.equal(actor.tpbChargeTime(), 0);
        assert.equal(actor._tpbState, 'charging');
        battle([200], [100], { preemptive: true });
        assert.equal(actor.tpbChargeTime(), 1); assert.equal(enemy.tpbChargeTime(), 0);
        battle([200], [100], { surprise: true });
        assert.equal(actor.tpbChargeTime(), 0); assert.equal(enemy.tpbChargeTime(), 1);
    `);
});

test('negative skill speed has zero cast delay using actual actions and casting transition', () => {
    setup()(`
        actor.makeActions(); actor.action(0).setSkill(999);
        assert.ok(actor.action(0).isValid());
        assert.equal(actor.tpbRequiredCastTime(), 0);
        actor.startTpbCasting();
        actor.updateTpbCastTime();
        assert.equal(actor.isTpbReady(), true);
        assert.equal(actor._tpbCastTime, 0);
    `);
});

test('turn-based behavior matches the installed engine without LinearTimeBattle', () => {
    const probe = `
        $dataSystem.battleSystem = 0;
        Math.random = () => 0.375;
        actor.makeActions(); actor.action(0).setSkill(999);
        actor.initTpbChargeTime(false);
        const values = { speed: actor.tpbSpeed(), relative: actor.tpbRelativeSpeed(),
            acceleration: actor.tpbAcceleration(), cast: actor.tpbRequiredCastTime(),
            initial: actor.tpbChargeTime() };
        assert.ok(values.cast > 0);
        BattleManager.updateTpb();
        values.updated = actor.tpbChargeTime();
        values.skillRect = new Scene_Battle().skillWindowRect();
        JSON.stringify(values);
    `;
    assert.equal(setup()(probe), setup({}, { plugin: false })(probe));
    setup()(`
        $dataSystem.battleSystem = 0;
        assert.equal(BattleManager.linearTimeOrder().length, 0);
        assert.equal(createTimeline().window, undefined);
    `);
});

for (const [label, actorSpeeds, enemySpeeds, count] of [
    ['200 actor vs 100 enemy', [200], [100], 60],
    ['100 actor vs 200 enemy (reverse sides)', [100], [200], 60],
    ['3:1 actor', [300], [100], 80],
    ['3:1 enemy', [100], [300], 80],
    ['fractional 1.5:1 sustained', [150], [100], 250],
    ['coprime fractional 137:83 sustained', [137], [83], 440],
    ['same-speed stable party then troop order', [100, 100], [100, 100], 40]
]) {
    test(`actual updateTurn/updateTpb, manual input, AI and endBattlerActions: ${label}`, () => {
        const run = setup();
        const actual = JSON.parse(run(`
            battle(${JSON.stringify(actorSpeeds)}, ${JSON.stringify(enemySpeeds)});
            const order = runActions(${count});
            assert.ok(castInputs.length > 0, 'actors went through manual input into casting');
            assert.ok(started.some(b => b.isEnemy()), 'real enemy AI was executed');
            assert.equal(BattleManager._actionBattlers.length, 0);
            assert.equal(ended.length, ${count});
            JSON.stringify(order);
        `));
        assert.deepEqual(actual, expectedOrder(actorSpeeds, enemySpeeds, count));
        if (actorSpeeds[0] === 200 && enemySpeeds[0] === 100) {
            assert.deepEqual(actual.slice(0, 3), ['A1', 'A1', 'E1']);
        }
        if (actorSpeeds[0] === 100 && enemySpeeds[0] === 200) {
            assert.deepEqual(actual.slice(0, 3), ['E1', 'E1', 'A1']);
        }
    });
}

test('real input -> casting -> action queue -> acting preserves the slower fractional gauge', () => {
    setup()(`
        for (let i = 0; i < 100 && !actor.isTpbCharged(); i++) BattleManager.updateTpb();
        assert.equal(actor.isTpbCharged(), true);
        near(enemy.tpbChargeTime(), 0.5);
        BattleManager.updateTpbInput();
        assert.equal(BattleManager.actor(), actor);
        assertFrozen(20);
        submitInput();
        assert.equal(actor._tpbState, 'casting');
        assertFrozen(1);
        assert.equal(actor._tpbState, 'acting');
        assert.equal(BattleManager._actionBattlers[0], actor);
        assertFrozen(20);
        BattleManager._subject = BattleManager.getNextSubject();
        assert.equal(BattleManager._subject, actor);
        assert.equal(BattleManager._actionBattlers.length, 0);
        assertFrozen(20);
        BattleManager.processTurn();
        assert.equal(actor.numActions(), 0, 'processTurn consumed the actual action');
        assertFrozen(20);
        BattleManager.updateAction();
        assert.equal(ended.length, 1);
        assert.equal(actor.tpbChargeTime(), 0);
        near(enemy.tpbChargeTime(), 0.5);
    `);
});

test('ready state (before the real queue hook) also freezes the shared clock', () => {
    setup()(`
        actor.makeActions(); actor.action(0).setSkill(999);
        actor.startTpbCasting(); actor.updateTpbCastTime();
        assert.equal(actor.isTpbReady(), true);
        enemy._tpbChargeTime = 0.375;
        assertFrozen(1);
        assert.equal(BattleManager._actionBattlers[0], actor);
        near(enemy.tpbChargeTime(), 0.375);
    `);
});

for (const [pause, mode, advances] of [
    ['true', 1, false], ['false', 1, true], ['false', 2, false]
]) {
    test(`input policy: PauseDuringInput=${pause}, battleSystem=${mode}`, () => {
        setup({ PauseDuringInput: pause })(`
            $dataSystem.battleSystem = ${mode};
            for (let i = 0; i < 100 && !actor.isTpbCharged(); i++) BattleManager.updateTpb();
            assert.equal(actor.isTpbCharged(), true);
            BattleManager.updateTpbInput();
            assert.equal(BattleManager.actor(), actor);
            const before = enemy.tpbChargeTime();
            for (let i = 0; i < 12; i++) BattleManager.updateTpb();
            near(enemy.tpbChargeTime(), before + ${advances ? '12 / 120' : '0'});
            assert.equal(actor.tpbChargeTime(), 1, 'input never discards the actor gauge');
        `);
    });
}

test('dead, hidden, restricted and reserve battlers are excluded from clock and forecast', () => {
    setup()(`
        battle([100, 900], [100, 900, 800, 700]);
        actors[1].setHp(0);
        enemies[1].setHp(0);
        enemies[2].hide();
        const restriction = $dataStates.find(s => s && s.id !== 1 && s.restriction === 4);
        // Keep this fixture restricted: real TPB idle timeouts otherwise expire DB states.
        $dataStates[restriction.id].autoRemovalTiming = 0;
        enemies[3].addState(restriction.id);
        const reserve = $gameActors.actor(3);
        reserve.initTpbChargeTime(true);
        assert.equal(reserve.isBattleMember(), false);
        const omitted = [actors[1], enemies[1], enemies[2], enemies[3], reserve];
        const gauges = omitted.map(b => b.tpbChargeTime());
        assert.ok(BattleManager.linearTimeOrder(32).every(e => e.battler === actor || e.battler === enemy));
        assert.deepEqual(runActions(8), ['A1', 'E1', 'A1', 'E1', 'A1', 'E1', 'A1', 'E1']);
        assert.deepEqual(omitted.map(b => b.tpbChargeTime()), gauges);
    `);
});

test('real agility buffs/debuffs change the next rate without rescaling stored charge', () => {
    setup()(`
        battle([100], [100]);
        for (let i = 0; i < 24; i++) BattleManager.updateTpb();
        near(actor.tpbChargeTime(), 0.2);
        actor.addBuff(6, 10);
        assert.equal(actor.agi, 125);
        near(actor.tpbChargeTime(), 0.2);
        near(actor.tpbAcceleration(), 1.25 / 120);
        BattleManager.updateTpb();
        near(actor.tpbChargeTime(), 0.2 + 1.25 / 120);
        near(enemy.tpbChargeTime(), 25 / 120);
        actor.removeBuff(6);
        actor.addDebuff(6, 10);
        assert.equal(actor.agi, 75);
        near(actor.tpbAcceleration(), 0.75 / 120);
        assert.equal(BattleManager.linearTimeOrder(1)[0].battler, enemy);
    `);
});

test('forecast repeats portraits in exact order, is bounded, and has no observable mutation', () => {
    setup()(`
        const expected = ['A1', 'A1', 'E1', 'A1', 'A1', 'E1', 'A1', 'A1'];
        const before = JSON.stringify([actor, enemy, BattleManager._actionBattlers,
            $gameParty, $gameTroop, $gameSystem, $gameTemp]);
        const random = Math.random;
        const acceleration = Game_Battler.prototype.tpbAcceleration;
        const makeActions = Game_Battler.prototype.makeActions;
        Math.random = () => { throw new Error('forecast consumed randomness'); };
        Game_Battler.prototype.tpbAcceleration = () => { throw new Error('forecast called acceleration'); };
        Game_Battler.prototype.makeActions = () => { throw new Error('forecast created actions'); };
        try {
            for (let i = 0; i < 30; i++) {
                assert.deepEqual(BattleManager.linearTimeOrder().map(e => id(e.battler)), expected);
            }
            assert.equal(BattleManager.linearTimeOrder(100).length, 32);
            for (const count of [0, -1, NaN, 'bad']) assert.equal(BattleManager.linearTimeOrder(count).length, 0);
            assert.equal(BattleManager.linearTimeOrder(3.9).length, 3);
        } finally {
            Math.random = random;
            Game_Battler.prototype.tpbAcceleration = acceleration;
            Game_Battler.prototype.makeActions = makeActions;
        }
        assert.equal(JSON.stringify([actor, enemy, BattleManager._actionBattlers,
            $gameParty, $gameTroop, $gameSystem, $gameTemp]), before);
    `);
});

test('forecast prioritizes subject, queued, casting and input labels without duplicate commitments', () => {
    setup()(`
        battle([200, 100], [100, 50]);
        BattleManager._subject = actor;
        actor.startTpbAction();
        BattleManager._actionBattlers.push(actor, enemy);
        enemy.startTpbAction();
        enemies[1].startTpbCasting();
        actors[1].finishTpbCharge();
        const order = BattleManager.linearTimeOrder(8);
        assert.deepEqual(order.slice(0, 4).map(e => [id(e.battler), e.label]), [
            ['A1', '行動中'], ['E1', '行動待ち'], ['E2', '行動待ち'], ['A2', '入力待ち']
        ]);
        assert.equal(order[4].battler, actor, 'committed battler starts its next forecast cycle at zero');
    `);
});

test('actual escape failure keeps negative charge and delays the next opportunity', () => {
    setup()(`
        battle([100], [100]);
        actor._tpbChargeTime = 0.25;
        BattleManager.onEscapeFailure();
        near(actor.tpbChargeTime(), -0.75);
        near(BattleManager._escapeRatio, 0.1);
        $gameMessage.clear();
        assert.deepEqual(BattleManager.linearTimeOrder(3).map(e => id(e.battler)), ['E1', 'A1', 'E1']);
        BattleManager.updateTpb();
        near(actor.tpbChargeTime(), -0.75 + 1 / 120);
        assert.deepEqual(runActions(3), ['E1', 'A1', 'E1']);
    `);
});

test('bounded installed Keke helpers preserve time/turbo/auto-fast multipliers and fixed reference', () => {
    setup({}, { keke: true })(`
        near(actor.tpbAcceleration(), 2 / 120 * 3);
        $gameSystem._timeSpeedKe = 2;
        pressed = true;
        near(actor.tpbAcceleration(), 2 / 120 * 2 * 3 * 3);
        assert.equal(BattleManager._inLongPressFastKeSpsb, true);
        BattleManager._currentActor = actor;
        near(actor.tpbAcceleration(), 2 / 120 * 2 * 3);
        BattleManager._currentActor = null;
        SceneManager._scene._partyCommandWindow.active = true;
        near(enemy.tpbAcceleration(), 1 / 120 * 2 * 3);
        SceneManager._scene._partyCommandWindow.active = false;
        pressed = false;
        $gameSystem._timeSpeedKe = 1;
        const restriction = $dataStates.find(s => s && s.id !== 1 && s.restriction === 4);
        actor.addState(restriction.id);
        assert.equal($gameParty.tpbReferenceTime(), 60, 'actual Keke inoperable-party helper applies');
        near(enemy.tpbAcceleration(), 1 / 120 * 3, 'reference-time change cancels, not a party maximum');
    `);
});

for (const [actorSpeed, enemySpeed] of [[200, 100], [100, 200], [137, 83]]) {
    test(`high multiplier cannot cross arrivals (${actorSpeed}:${enemySpeed}, installed bounded Keke)`, () => {
        const actual = JSON.parse(setup({}, { keke: true })(`
            battle([${actorSpeed}], [${enemySpeed}]);
            $gameSystem._timeSpeedKe = 1000;
            assert.ok(actor.tpbAcceleration() > 1 && enemy.tpbAcceleration() > 1);
            BattleManager.updateTpb();
            near(actor.tpbChargeTime(), ${actorSpeed / Math.max(actorSpeed, enemySpeed)});
            near(enemy.tpbChargeTime(), ${enemySpeed / Math.max(actorSpeed, enemySpeed)});
            assert.equal([actor, enemy].filter(b => b._tpbState !== 'charging').length, 1);
            JSON.stringify(runActions(80));
        `));
        assert.deepEqual(actual, expectedOrder([actorSpeed], [enemySpeed], 80));
    });
}

test('sampled shared clock gives both sides the same installed Keke multiplier within a frame', () => {
    setup({ PauseDuringInput: 'false' }, { keke: true })(`
        battle([200], [100]);
        $gameSystem._timeSpeedKe = 1000;
        BattleManager.updateTpb();
        near(enemy.tpbChargeTime(), 0.5);
        BattleManager.updateTpbInput();
        assert.equal(BattleManager.actor(), actor);
        const rate = enemy.tpbAcceleration();
        near(rate, 1000 / 120, 'actual auto-fast switches off during actor input');
        BattleManager.updateTpb();
        near(enemy.tpbChargeTime(), 1);
        assert.equal(actor.tpbChargeTime(), 1);
    `);
});

test('Window_Base subclass reserves layout once across nested rectangles and relayout', () => {
    setup()(`
        const { scene, window } = createTimeline();
        assert.ok(window instanceof Window_Base);
        assert.equal(scene.createdBaseWindows, true);
        assert.equal(window.x, 0);
        assert.equal(window.y, 60);
        assert.equal(window.height, 64);
        assert.equal(window.padding, 8);
        assert.equal(window.width, 8 * 48 + 16, 'compact: only as wide as the preview chips');
        assert.ok(window.width < Graphics.boxWidth / 2);
        for (const method of ['skillWindowRect', 'itemWindowRect', 'enemyWindowRect']) {
            const rect = scene[method]();
            assert.equal(rect.y, 124);
            assert.equal(rect.y + rect.height, 420, 'original list bottom is retained');
            assert.equal(scene._linearTimeRectDepth, 0);
        }
        assert.equal(scene.logWindowRect().height, 60);
        scene.relayoutBattleWindows();
        assert.equal(scene._logWindow.y, 124);
        assert.equal(window.y + window.height, scene._logWindow.y, 'timeline and log touch with no gap');
    `);
});

test('layout without top UI, narrow screen and ShowTimeline=false', () => {
    setup({}, { topUi: false })(`
        Graphics.boxWidth = 320;
        const { scene, window } = createTimeline();
        assert.equal(window.y, 0);
        assert.equal(window.width, 6 * 48 + 16);
        assert.ok(window.x + window.width <= Graphics.boxWidth);
        assert.equal(scene.skillWindowRect().y, 64);
        window.update();
        assert.equal(window._portraits.length, 6);
    `);
    setup({ ShowTimeline: 'false' })(`
        const { scene, window } = createTimeline();
        assert.equal(window, undefined);
        assert.equal(scene.skillWindowRect().y, 60);
        assert.equal(BattleManager.linearTimeOrder().length, 8, 'display setting does not disable timing');
    `);
});

test('walking sprites wait for image readiness, crop down-facing frames, fit enemies and reuse sprites', () => {
    setup()(`
        $dataSystem.optSideView = false;
        const { window } = createTimeline();
        window.update();
        assert.equal(window.contents.fontSize, 14);
        assert.equal(window.contents.fontFace, $gameSystem.mainFontFace(), 'letters use the game UI font');
        assert.equal(window._portraits.length, 8);
        const [first, repeated, enemySprite] = window._portraits;
        assert.notEqual(first, repeated, 'repeated actor has independent sprites');
        assert.equal(first.bitmap, repeated.bitmap);
        assert.equal(first.bitmap, ImageManager.loadCharacter(actor.characterName()), 'walking graphic, not face');
        assert.equal(first.visible, false);
        assert.equal(enemySprite.visible, false);
        const contentsIndex = window._clientArea.getChildIndex(window._contentsSprite);
        for (const sprite of window._portraits) {
            assert.ok(window._clientArea.getChildIndex(sprite) < contentsIndex, 'sprites render under letters');
            assert.ok(window._clientArea.getChildIndex(sprite) > 0, 'sprites render over chip backgrounds');
        }
        const redraws = window.contents.clears;
        first.bitmap.ready = true;
        enemySprite.bitmap.ready = true;
        window.update();
        assert.equal(first.visible, true);
        assert.equal(enemySprite.visible, true);
        const n = actor.characterIndex();
        const pattern = [0, 1, 2, 1][Math.floor(window._tick / 10) % 4];
        assert.deepEqual(first.frame, [((n % 4) * 3 + pattern) * 48, Math.floor(n / 4) * 4 * 48, 48, 48]);
        assert.deepEqual(repeated.frame, [((n % 4) * 3 + 1) * 48, Math.floor(n / 4) * 4 * 48, 48, 48],
            'only the head of the queue animates');
        assert.deepEqual(enemySprite.frame, [0, 0, 180, 90]);
        assert.equal(first.scale.x, 1, 'pixel art is not rescaled');
        near(enemySprite.scale.x, 42 / 180);
        assert.equal(window.contents.clears, redraws, 'readiness does not require signature invalidation');
        assert.equal(first.hue, 0);
        const frames = new Set();
        for (let i = 0; i < 40; i++) { window.update(); frames.add(first.frame[0]); }
        assert.equal(frames.size, 3, 'head steps through the three walking patterns');
        assert.equal(window._portraits[0], first);
        assert.equal(window.contents.clears, redraws);
        assert.ok(window.contents.text.length > 0 &&
            window.contents.text.every(args => args[0] === enemy._letter.trim()), 'only enemy letters, no names/labels');
        enemy.hide(); window.refreshOrder(); window.updatePortraits();
        assert.ok(window._portraits.every(s => !s._entry || s._entry.battler !== enemy));
        actor.setHp(0); window.refreshOrder(); window.updatePortraits();
        assert.ok(window._portraits.every(s => !s.visible && !s._entry));
    `);
});

test('big character sheets, enemy letters and chip colors', () => {
    setup()(`
        battle([200], [100, 50]);
        assert.ok(enemies.every(e => e._plural && e._letter.trim()), 'installed troop letters (full-width table)');
        assert.notEqual(enemies[0]._letter, enemies[1]._letter);
        actor.setCharacterImage('$Hero', 5);
        const { window } = createTimeline();
        window.update();
        const order = BattleManager.linearTimeOrder(8);
        const sprite = window._portraits[0];
        assert.equal(sprite.bitmap, ImageManager.loadCharacter('$Hero'));
        sprite.bitmap.ready = true;
        window.updatePortraits();
        assert.deepEqual(sprite.frame.slice(1), [0, 48, 48], 'big sheet ignores the character index');
        const letters = window.contents.text.map(args => args[0]);
        assert.deepEqual(letters, order.filter(e => e.battler.isEnemy()).map(e => e.battler._letter.trim()));
        assert.equal(new Set(letters).size, 2, 'both enemies are distinguished by letter');
        for (const args of window.contents.text) assert.equal(args[5], 'right');
        const fills = window.contentsBack.fills;
        assert.equal(fills.filter(f => f[4] === '#20a0d6').length, order.filter(e => e.battler.isActor()).length * 2);
        assert.equal(fills.filter(f => f[4] === '#ff784c').length, order.filter(e => e.battler.isEnemy()).length * 2);
        assert.ok(fills.every(f => f[2] <= 48 && f[3] <= 48));
        assert.equal(window.contents.fills.length, 0);
    `);
});

test('side-view enemy images, hue, graphic/selection invalidation and timeline visibility', () => {
    setup()(`
        $dataSystem.optSideView = true;
        $dataEnemies[1].battlerHue = 75;
        const { window } = createTimeline();
        window.update();
        const sprite = window._portraits[2];
        assert.equal(sprite.bitmap, ImageManager.loadSvEnemy(enemy.battlerName()));
        assert.equal(sprite.hue, 75);
        sprite.bitmap.ready = true; sprite.bitmap.width = 0;
        window.updatePortraits(); assert.equal(sprite.visible, false);
        sprite.bitmap.width = 180;
        window.updatePortraits(); assert.equal(sprite.visible, true);
        let redraws = window.contents.clears;
        actor.setName('Renamed'); window.refreshOrder();
        assert.equal(window.contents.clears, redraws, 'names are not displayed, so renaming does not redraw');
        actor.setCharacterImage('Actor2', 3); window.refreshOrder();
        assert.equal(window.contents.clears, redraws + 1);
        assert.equal(window._portraits[0].bitmap, ImageManager.loadCharacter('Actor2'));
        redraws = window.contents.clears;
        enemy.select(); window.refreshOrder();
        assert.equal(window.contents.clears, redraws + 1);
        assert.ok(window.contentsBack.fills.some(args => args[4] === '#ffffa0'), 'selected chip has a gold frame');
        enemy.deselect(); window.refreshOrder();
        assert.ok(!window.contentsBack.fills.some(args => args[4] === '#ffffa0'));
        $gameMessage.add('Busy'); window.update(); assert.equal(window.visible, false);
        $gameMessage.clear(); window.update(); assert.equal(window.visible, true);
        for (const phase of ['battleEnd', 'aborting']) {
            BattleManager._phase = phase; window.update(); assert.equal(window.visible, false);
        }
        BattleManager._phase = 'turn';
        $dataSystem.battleSystem = 0; window.update(); assert.equal(window.visible, false);
    `);
});