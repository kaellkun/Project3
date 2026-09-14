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

function setup(parameters = {}) {
    const context = vm.createContext({ console, assert, parameters });
    const run = code => vm.runInContext(code, context);
    const core = read('js/rmmz_core.js');
    run(core.slice(0, core.indexOf('function Utils()')));
    // Execute the installed engine's actual battler, action, metadata and TPB
    // implementations. Only rendering/environment and battle-log I/O are stubbed.
    const managers = read('js/rmmz_managers.js');
    run(managers.slice(0, managers.indexOf('function ConfigManager()')));
    run(managers.slice(managers.indexOf('function BattleManager()'), managers.indexOf('function PluginManager()')));
    run(read('js/rmmz_objects.js'));
    run(`
        Object.assign(globalThis, ${JSON.stringify(database)});
        for (const name of Object.keys(globalThis).filter(name => name.startsWith('$data'))) {
            const data = globalThis[name];
            if (Array.isArray(data)) {
                for (const entry of data) if (entry && 'note' in entry) DataManager.extractMetadata(entry);
            }
        }
        const PluginManager = { parameters: () => parameters };
        const Utils = { isOptionValid: () => false };
        const ImageManager = { iconHeight: 32 };
        class Point { constructor(x = 0, y = 0) { this.x = x; this.y = y; } }
        const PIXI = { Point };
        const Graphics = { width: 816, height: 624 };
        class Sprite {
            constructor() {
                this.children = []; this.x = 0; this.y = 0;
                this.visible = true; this.opacity = 255; this.anchor = { x: 0.5, y: 1 };
                this.scale = { x: 1, y: 1 };
            }
            addChild(child) { this.children.push(child); child.parent = this; return child; }
            update() { for (const child of this.children) child.update(); }
            setBlendColor(color) { this.blendColor = color; }
            toGlobal(point) {
                const local = new Point(point.x * this.scale.x + this.x, point.y * this.scale.y + this.y);
                return this.parent ? this.parent.toGlobal(local) : local;
            }
            toLocal(point) {
                const parent = this.parent ? this.parent.toLocal(point) : point;
                return new Point((parent.x - this.x) / this.scale.x, (parent.y - this.y) / this.scale.y);
            }
            destroy() { for (const child of this.children) child.destroy(); }
        }
        class Bitmap {
            constructor(width, height) {
                this.width = width; this.height = height; this.text = [];
                this.context = Object.fromEntries(['save', 'beginPath', 'moveTo', 'lineTo',
                    'closePath', 'fill', 'stroke', 'restore'].map(key => [key, () => {}]));
            }
            clear() { this.text = []; }
            fillRect() {}
            drawText(text) { this.text.push(text); }
            isReady() { return true; }
            destroy() { this.destroyed = true; }
        }
        function Scene_Battle() { this.children = []; }
        Scene_Battle.prototype.addChild = Sprite.prototype.addChild;
        Scene_Battle.prototype.createSpriteset = function() { this._spriteset = { _enemySprites: sources }; };
        Scene_Battle.prototype.toGlobal = point => point;
        Scene_Battle.prototype.toLocal = point => point;
        let sources = [];
        let invoked = 0;
        BattleManager.startAction = function() { this._action = this._subject.currentAction(); };
        BattleManager.invokeAction = function() { invoked++; };
    `);
    run(read('js/plugins/ShieldBreakSystem.js'));
    run(`
        $gameTemp = new Game_Temp();
        $gameSystem = new Game_System();
        $gameActors = new Game_Actors();
        $gameVariables = new Game_Variables();
        $gameSwitches = new Game_Switches();
        $gameParty = new Game_Party();
        $gameTroop = new Game_Troop();
        $gameParty._actors = [1];
        $gameParty._inBattle = true;
        $gameTroop.setup(1);
        BattleManager.initMembers();
        BattleManager._phase = 'turn';
        const actor = $gameActors.actor(1);
        const enemy = $gameTroop.members()[0];
        function configure(note = '') {
            $dataEnemies[1].note = note;
            DataManager.extractMetadata($dataEnemies[1]);
            enemy.resetShieldBreak();
            enemy.setHp(enemy.mhp);
        }
        function attack({ element = 1, damage = '10', type = 1, note = '', hit = 100,
            hitType = 0, effects = [] } = {}) {
            $dataSkills[999] = { ...$dataSkills[1], id: 999, note, hitType, successRate: hit,
                damage: { type, elementId: element, formula: damage, variance: 0, critical: false }, effects };
            DataManager.extractMetadata($dataSkills[999]);
            const action = new Game_Action(actor);
            action.setSkill(999);
            return action;
        }
        function createPanel() {
            const source = new Sprite();
            source._enemy = enemy;
            source.bitmap = new Bitmap(100, 100);
            source.x = 300; source.y = 400;
            source._stateIconSprite = source.addChild(new Sprite());
            source._stateIconSprite.y = -130;
            sources = [source];
            const scene = new Scene_Battle();
            scene.createSpriteset();
            const panel = scene._shieldBreakLayer.children[0];
            panel.update();
            return { source, scene, panel };
        }
    `);
    return run;
}

test('plugin is enabled after the battle and display plugins', () => {
    const context = vm.createContext({});
    vm.runInContext(read('js/plugins.js'), context);
    const enabled = context.$plugins.filter(plugin => plugin.status).map(plugin => plugin.name);
    assert.ok(enabled.indexOf('ShieldBreakSystem') > enabled.indexOf('Keke_SpeedStarBattle'));
    assert.ok(enabled.indexOf('ShieldBreakSystem') > enabled.indexOf('VerticalDisplayFullscreen'));
});

test('no tags: shield 3, physical fallback, normal attack attributes, no DB rate changes', () => {
    setup()(`
        assert.equal(enemy.shieldPoints(), 3);
        assert.equal(enemy._sbWeaknesses[0].id, 1);
        assert.equal(enemy.elementRate(1), 1);
        assert.equal(enemy._sbConfig.hidden, false);
        attack({ element: -1 }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 2);
    `);
});

test('DB element rates are inferred before using fallback', () => {
    setup()(`
        $dataEnemies[1].traits.push({ code: 11, dataId: 3, value: 1.5 });
        configure();
        assert.equal(enemy._sbWeaknesses.length, 1);
        assert.equal(enemy._sbWeaknesses[0].id, 3);
        attack().apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
        attack({ element: 3 }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 2);
    `);
});

test('tags override defaults and filter duplicate/invalid IDs', () => {
    setup()(`
        configure('<ShieldPoints:5><WeakElements:2,3,2,999,-1><BreakTurns:2><BreakDamageRate:2.5>');
        assert.equal(enemy.shieldPoints(), 5);
        assert.equal(enemy._sbWeaknesses.length, 2);
        assert.equal(enemy._sbConfig.turns, 2);
        assert.equal(enemy._sbConfig.rate, 2.5);
        attack().apply(enemy);
        assert.equal(enemy.shieldPoints(), 5);
        attack({ element: 2, note: '<ShieldDamage:2>' }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
    `);
});

test('invalid and empty tags fall back; numeric values are bounded', () => {
    setup({ DefaultShield: 'NaN', BreakTurns: '', BreakDamageRate: 'Infinity' })(`
        configure('<ShieldPoints:NaN><WeakElements:999><BreakTurns:><BreakDamageRate:bad>');
        assert.equal(enemy.shieldPoints(), 3);
        assert.equal(enemy._sbWeaknesses[0].id, 1);
        assert.equal(enemy._sbConfig.turns, 1);
        assert.equal(enemy._sbConfig.rate, 2);
        configure('<ShieldPoints:9000><BreakTurns:-1><BreakDamageRate:0>');
        assert.equal(enemy.shieldPoints(), 999);
        assert.equal(enemy._sbConfig.turns, 1);
        assert.equal(enemy._sbConfig.rate, 1);
    `);
});

test('weapon-only weaknesses use attack-element actions and count a hit only once', () => {
    setup()(`
        const type = actor.weapons()[0].wtypeId;
        configure('<WeakWeapons:' + type + '>');
        assert.equal(enemy._sbWeaknesses.length, 1);
        attack({ element: 2 }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
        attack({ element: -1 }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 2);
        configure('<WeakElements:1><WeakWeapons:' + type + '>');
        attack({ element: -1 }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 2);
        assert.equal(enemy._sbKnown.length, 2);
    `);
});

test('explicit empty weakness and disabled shields are supported', () => {
    setup()(`
        configure('<WeakElements:0>');
        assert.equal(enemy._sbWeaknesses.length, 0);
        attack().apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
        attack({ note: '<ShieldPierce>' }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 2);
        configure('<ShieldPoints:0>');
        attack().apply(enemy);
        assert.equal(enemy.shieldPoints(), 0);
        assert.equal(enemy.isShieldBroken(), false);
        assert.equal(createPanel().panel.visible, false);
    `);
});

test('misses, evasion, zero, healing and MP damage never reduce shields', () => {
    setup()(`
        enemy.setHp(100);
        attack({ hit: 0 }).apply(enemy);
        const evade = attack({ hitType: 1 });
        evade.itemEva = () => 1;
        evade.apply(enemy);
        attack({ damage: '0' }).apply(enemy);
        attack({ type: 3 }).apply(enemy);
        attack({ type: 2 }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
        assert.equal(enemy._sbKnown.length, 0);
    `);
});

test('shield 0 breaks after damage; only subsequent positive HP damage is multiplied', () => {
    setup()(`
        configure('<ShieldPoints:1>');
        enemy._actions = [attack(), attack()];
        const action = attack();
        action.apply(enemy);
        assert.equal(enemy.result().hpDamage, 10);
        assert.equal(enemy.isShieldBroken(), true);
        assert.equal(enemy.canMove(), false);
        assert.equal(enemy.numActions(), 0);
        action.apply(enemy);
        assert.equal(enemy.result().hpDamage, 20);
        assert.equal(enemy.shieldPoints(), 0);
        assert.equal(attack({ type: 3 }).makeDamageValue(enemy, false), -10);
        assert.equal(attack({ type: 2 }).makeDamageValue(enemy, false), 10);
        assert.equal(action.makeDamageValue(actor, false), 10);
    `);
});

test('each repeat reduces shield and surplus hits receive break damage', () => {
    setup()(`
        const action = attack();
        for (let i = 0; i < 4; i++) action.apply(enemy);
        assert.equal(enemy.hp, enemy.mhp - 50);
        assert.equal(enemy.isShieldBroken(), true);
    `);
});

test('ShieldDamage zero still reveals; pierce false does not bypass weakness', () => {
    setup()(`
        attack({ note: '<ShieldDamage:0>' }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
        assert.equal(enemy._sbKnown.length, 1);
        attack({ element: 2, note: '<ShieldPierce:false>' }).apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
        attack({ element: 2, note: '<ShieldPierce><ShieldDamage:3>' }).apply(enemy);
        assert.equal(enemy.isShieldBroken(), true);
    `);
});

test('hidden discovery is per enemy; scan works with a successful non-damage action', () => {
    setup({ RevealWeaknesses: 'false' })(`
        configure('<WeakElements:1,2,3>');
        assert.equal(enemy._sbConfig.hidden, true);
        attack().apply(enemy);
        assert.equal(enemy._sbKnown.length, 1);
        assert.equal($gameTroop.members()[1]._sbKnown.length, 0);
        attack({ type: 0, note: '<RevealWeaknesses>' }).apply(enemy);
        assert.equal(enemy._sbKnown.length, 3);
        configure('<WeaknessHidden:false>');
        assert.equal(enemy._sbConfig.hidden, false);
    `);
});

test('turn-based break lasts through the current turn and configured full turns', () => {
    setup()(`
        $dataSystem.battleSystem = 0;
        configure('<BreakTurns:2>');
        $gameTroop._turnCount = 5;
        enemy.damageShield(3);
        enemy.onTurnEnd();
        assert.equal(enemy._sbBreakRemaining, 2);
        $gameTroop._turnCount = 6;
        enemy.onTurnEnd();
        assert.equal(enemy._sbBreakRemaining, 1);
        $gameTroop._turnCount = 7;
        enemy.onTurnEnd();
        assert.equal(enemy.isShieldBroken(), false);
        assert.equal(enemy.shieldPoints(), 3);
        assert.equal(enemy.canMove(), true);
    `);
});

test('TPB break uses charge time, does not queue actions, recovers at zero charge', () => {
    setup()(`
        configure('<BreakTurns:2>');
        enemy.tpbAcceleration = () => 0.25;
        enemy._tpbTurnEnd = true;
        enemy._tpbState = 'ready';
        enemy.damageShield(3);
        for (let i = 0; i < 7; i++) {
            enemy.updateTpb();
            BattleManager.updateTpbBattler(enemy);
            assert.equal(enemy.isShieldBroken(), true);
            assert.equal(enemy.numActions(), 0);
            assert.equal(enemy.isTpbReady(), false);
        }
        enemy.updateTpb();
        BattleManager.updateTpbBattler(enemy);
        assert.equal(enemy.isShieldBroken(), false);
        assert.equal(enemy.tpbChargeTime(), 0);
        assert.equal(enemy.shieldPoints(), 3);
        enemy.updateTpb();
        assert.equal(enemy.tpbChargeTime(), 0.25);
    `);
});

test('other restrictions remain after break recovery', () => {
    setup()(`
        const state = $dataStates.find(state => state && state.restriction === 4 && state.id !== 1);
        assert.ok(state);
        enemy.addState(state.id);
        enemy.damageShield(3);
        enemy._sbBreakRemaining = 1;
        enemy.onTurnEnd();
        assert.equal(enemy.isShieldBroken(), false);
        assert.equal(enemy.canMove(), false);
    `);
});

test('death/revival, transformation and battle end reset break data', () => {
    setup()(`
        enemy.damageShield(3);
        enemy.setHp(0);
        assert.equal(enemy.isShieldBroken(), false);
        enemy.setHp(enemy.mhp);
        assert.equal(enemy.shieldPoints(), 3);
        enemy.damageShield(3);
        enemy.transform(2);
        assert.equal(enemy.isShieldBroken(), false);
        assert.equal(enemy.shieldPoints(), 3);
        enemy.damageShield(3);
        enemy.onBattleEnd();
        assert.equal(enemy.isShieldBroken(), false);
    `);
});

test('Keke temporary simulation does not reveal or reduce real shield data', () => {
    setup()(`
        const action = attack();
        action._isTempApplyKe = true;
        action.apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
        assert.equal(enemy._sbKnown.length, 0);
        action._isTempApplyKe = false;
        enemy._isTempKe = true;
        action.apply(enemy);
        assert.equal(enemy.shieldPoints(), 3);
    `);
});

test('Keke delayed actions are invalid during break and after recovery', () => {
    setup()(`
        const delayed = new Game_Action(enemy);
        delayed.setAttack();
        enemy._actions = [delayed];
        BattleManager._subject = enemy;
        BattleManager.startAction();
        enemy.damageShield(3);
        BattleManager._action = delayed;
        BattleManager.invokeAction(enemy, actor);
        assert.equal(invoked, 0);
        enemy.onTurnEnd();
        assert.equal(enemy.isShieldBroken(), false);
        BattleManager.invokeAction(enemy, actor);
        assert.equal(invoked, 0);
        const fresh = new Game_Action(enemy);
        fresh.setAttack();
        enemy._actions = [fresh];
        BattleManager.startAction();
        BattleManager.invokeAction(enemy, actor);
        assert.equal(invoked, 1);
    `);
});

test('UI follows image top and scales without inheriting hue; redraw is cached', () => {
    setup()(`
        const { source, scene, panel } = createPanel();
        assert.equal(panel.visible, true);
        assert.ok(panel.y + panel.bitmap.height < 300);
        assert.equal(panel.parent, scene._shieldBreakLayer);
        const bitmap = panel.bitmap;
        source.x += 50; source.scale.y = 1.5;
        panel.update();
        assert.equal(panel.x, 350 - bitmap.width / 2);
        assert.equal(panel.y + bitmap.height, 250 - 12);
        assert.equal(panel.bitmap, bitmap);
        enemy.damageShield(3);
        panel.update();
        assert.ok(panel.bitmap.text.includes('BREAK'));
        panel.destroy();
        assert.equal(bitmap.destroyed, true);
    `);
});

test('UI handles hidden enemies, death, appearance, unknown cells and edge clamps', () => {
    setup()(`
        configure('<WeaknessHidden:true><WeakElements:1,2,3,4,5,6,7,8,9>');
        const { source, panel } = createPanel();
        assert.equal(panel.bitmap.text.filter(text => text === '?').length, 9);
        assert.ok(panel.bitmap.height > 82);
        source.x = 0; source.y = 0;
        panel.update();
        assert.equal(panel.x, 4);
        assert.equal(panel.y, 4);
        enemy.hide(); panel.update();
        assert.equal(panel.visible, false);
        enemy.appear(); panel.update();
        assert.equal(panel.visible, true);
        enemy.setHp(0); panel.update();
        assert.equal(panel.visible, false);
    `);
});

test('state icons retain their space above the enemy image', () => {
    setup()(`
        const state = $dataStates.find(state => state && state.iconIndex && state.id !== 1);
        enemy.addState(state.id);
        const { panel } = createPanel();
        assert.ok(panel.y + panel.bitmap.height <= 400 - 130 - ImageManager.iconHeight / 2 - 12);
    `);
});