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

// Installed engine: JsExtensions, DataManager/BattleManager, game objects, the
// Window_Base..Window_HorzCommand chain, Window_EquipCommand, Window_ActorCommand,
// and the Scene_Base/Scene_Message/Scene_MenuBase/Scene_Equip/Scene_Battle
// prototypes. Only rendering/audio/storage primitives are simulated.
function setup({ plugin = true } = {}) {
    const context = vm.createContext({ console, assert });
    const run = (source, filename = 'battle-equip-harness.js') =>
        vm.runInContext(source, context, { filename, timeout: 10000 });
    run(slice('js/rmmz_core.js', null, 'function Utils()'), 'installed-JsExtensions.js');
    run(slice('js/rmmz_managers.js', null, 'function ConfigManager()'), 'installed-DataManager.js');
    run(slice('js/rmmz_managers.js', 'function BattleManager()', 'function PluginManager()'),
        'installed-BattleManager.js');
    run(read('js/rmmz_objects.js'), 'js/rmmz_objects.js');
    run(`
        Object.assign(globalThis, ${JSON.stringify(database)});
        const PluginManager = { parameters: () => ({}), _scripts: [] };
        const Utils = { isOptionValid: () => false, isMobileDevice: () => false };
        const Graphics = { width: 816, height: 624, boxWidth: 816, boxHeight: 624 };
        const ConfigManager = { touchUI: false, commandRemember: false };
        const ColorManager = { normalColor: () => '#fff', outlineColor: () => '#000',
            itemBackColor1: () => '#111', itemBackColor2: () => '#222', textColor: () => '#fff' };
        const TextManager = { attack: '攻撃', guard: '防御', item: 'アイテム', skill: 'スキル',
            equip: '装備', equip2: '装備', optimize: '最強装備', clear: '全て外す' };
        const Input = { isTriggered: () => false, isRepeated: () => false, isPressed: () => false };
        const TouchInput = { isTriggered: () => false, isCancelled: () => false, isHovered: () => false };
        const calls = { startBattle: 0, playBattleBgm: 0, stopMe: 0, snap: 0, pushed: [] };
        BattleManager.startBattle = () => calls.startBattle++;
        BattleManager.playBattleBgm = () => calls.playBattleBgm++;
        const AudioManager = { stopMe: () => calls.stopMe++ };
        const SceneManager = {
            _nextScene: null, _previousClass: null,
            isNextScene(sceneClass) { return this._nextScene && this._nextScene.constructor === sceneClass; },
            isPreviousScene(sceneClass) { return this._previousClass === sceneClass; },
            push(sceneClass) { calls.pushed.push(sceneClass); },
            snapForBackground() { calls.snap++; }
        };

        class Rectangle {
            constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); }
        }
        class Bitmap {
            constructor(width, height) { Object.assign(this, { width, height, text: [] }); }
            clear() { this.text = []; }
            drawText(...args) { this.text.push(args); }
            fillRect() {}
            gradientFillRect() {}
            strokeRect() {}
            destroy() {}
        }
        class Sprite {}
        function Stage() {}
        Stage.prototype.initialize = function() {};
        class ColorFilter { setBlendColor() {} setBrightness() {} }
        function Window() {}
        Window.prototype.initialize = function() {
            this.openness = 255;
            this.visible = true;
            this.origin = { x: 0, y: 0 };
            this._contentsSprite = {};
            this._clientArea = { children: [] };
        };
        Window.prototype.move = function(x, y, width, height) { Object.assign(this, { x, y, width, height }); };
        Window.prototype.setTone = function() {};
        Window.prototype.setCursorRect = function() {};
        Window.prototype.update = function() {};
        Window.prototype.isOpen = function() { return this.openness >= 255; };
        Window.prototype.isClosed = function() { return this.openness <= 0; };
        Object.defineProperties(Window.prototype, {
            innerWidth: { get() { return Math.max(0, this.width - 2 * this.padding); } },
            innerHeight: { get() { return Math.max(0, this.height - 2 * this.padding); } }
        });
        const ImageManager = { loadSystem: () => new Bitmap(192, 192) };
        // Other scene classes only participate through SceneManager.isNextScene checks.
        function Scene_Map() {}
        function Scene_Title() {}
        function Scene_Gameover() {}
    `);
    run(slice('js/rmmz_windows.js', 'function Window_Base()', 'function Window_Help()'),
        'installed-Window_Base-to-HorzCommand.js');
    run(slice('js/rmmz_windows.js', 'function Window_EquipCommand()', 'function Window_EquipSlot()'),
        'installed-Window_EquipCommand.js');
    run(slice('js/rmmz_windows.js', 'function Window_ActorCommand()', 'function Window_BattleStatus()'),
        'installed-Window_ActorCommand.js');
    run(slice('js/rmmz_scenes.js', 'function Scene_Base()', 'function Scene_Boot()'), 'installed-Scene_Base.js');
    run(slice('js/rmmz_scenes.js', 'function Scene_Message()', 'function Scene_Map()'), 'installed-Scene_Message.js');
    run(slice('js/rmmz_scenes.js', 'function Scene_MenuBase()', 'function Scene_Menu()'), 'installed-Scene_MenuBase.js');
    run(slice('js/rmmz_scenes.js', 'function Scene_Equip()', 'function Scene_Status()'), 'installed-Scene_Equip.js');
    run(slice('js/rmmz_scenes.js', 'function Scene_Battle()', 'function Scene_Gameover()'), 'installed-Scene_Battle.js');
    if (plugin) run(read('js/plugins/BattleEquipCommand.js'), 'js/plugins/BattleEquipCommand.js');
    run(`
        $gameTemp = new Game_Temp();
        $gameSystem = new Game_System();
        $gameActors = new Game_Actors();
        $gameVariables = new Game_Variables();
        $gameSwitches = new Game_Switches();
        $gameMessage = new Game_Message();
        $gameParty = new Game_Party();
        $gameTroop = new Game_Troop();
        $gameParty._actors = [1, 2];
        $gameParty._inBattle = true;
        $gameTroop.setup(1);
        $gameTroop._inBattle = true;
        BattleManager.initMembers();
        BattleManager._phase = 'input';
        BattleManager._currentActor = $gameActors.actor(2);

        function battleScene() {
            const scene = new Scene_Battle();
            scene._windowLayer = { addChild() {} };
            scene._statusWindow = { closed: 0, refreshed: 0, close() { this.closed++; }, refresh() { this.refreshed++; } };
            scene._partyCommandWindow = { closed: 0, close() { this.closed++; } };
            scene.autosaves = 0;
            scene.requestAutosave = function() { this.autosaves++; };
            scene.createActorCommandWindow();
            return scene;
        }
        function equipScene() {
            const scene = new Scene_Equip();
            scene._windowLayer = { addChild() {} };
            scene._helpWindow = { clear() {}, setText() {} };
            scene.createCommandWindow();
            return scene;
        }
        const symbols = window => window._list.map(command => command.symbol);
    `);
    return { run, get: name => vm.runInContext(name, context) };
}

test('actor command window appends 装備 after the standard commands', () => {
    const { run } = setup();
    run(`
        const scene = battleScene();
        const window = scene._actorCommandWindow;
        window.setup($gameActors.actor(1));
        assert.deepEqual(symbols(window), ['attack', 'guard', 'item', 'equip']);
        const equip = window._list.find(command => command.symbol === 'equip');
        assert.equal(equip.name, '装備');
        assert.equal(equip.enabled, true);
        assert.equal(typeof window._handlers.equip, 'function');
        assert.equal(window.contents.text.some(args => args[0] === '装備'), true, 'drawn with installed drawItem');
    `);
});

test('actor command window without the plugin keeps the four standard commands', () => {
    const { run } = setup({ plugin: false });
    run(`
        const scene = battleScene();
        scene._actorCommandWindow.setup($gameActors.actor(1));
        assert.deepEqual(symbols(scene._actorCommandWindow), ['attack', 'guard', 'item']);
        assert.equal(scene._actorCommandWindow._handlers.equip, undefined);
    `);
});

test('装備 opens Scene_Equip for the inputting actor, not the previous menu actor', () => {
    const { run } = setup();
    run(`
        $gameParty.setMenuActor($gameActors.actor(1));
        const scene = battleScene();
        scene._actorCommandWindow.setup(BattleManager.actor());
        scene._actorCommandWindow.callHandler('equip');
        assert.deepEqual(calls.pushed, [Scene_Equip]);
        assert.equal($gameParty.menuActor(), $gameActors.actor(2));
    `);
});

test('battle -> equip: no fade, windows stay open, battle state and autosave untouched, background snapped', () => {
    const { run } = setup();
    run(`
        const scene = battleScene();
        scene._actorCommandWindow.setup(BattleManager.actor());
        const actor = BattleManager.actor();
        actor._tpbChargeTime = 0.5;
        actor.makeActions();
        SceneManager._nextScene = Object.create(Scene_Equip.prototype);
        scene.stop();
        assert.equal(scene._active, false);
        assert.equal(scene.isFading(), false, 'no fade out');
        assert.equal(scene._statusWindow.closed, 0);
        assert.equal(scene._partyCommandWindow.closed, 0);
        scene.terminate();
        assert.equal(calls.snap, 1, 'menu background snapshot');
        assert.equal(scene._actorCommandWindow.visible, false, 'command row hidden from the snapshot');
        assert.equal($gameParty.inBattle(), true, 'onBattleEnd skipped');
        assert.equal($gameTroop.inBattle(), true);
        assert.equal(actor.numActions(), 1, 'pending action kept');
        assert.equal(actor._tpbChargeTime, 0.5);
        assert.equal(calls.stopMe, 0);
        assert.equal(scene.autosaves, 0);
    `);
});

test('equip -> battle: input resumes without startBattle/BGM restart or fade in', () => {
    const { run } = setup();
    run(`
        SceneManager._previousClass = Scene_Equip;
        const scene = battleScene();
        scene.start();
        assert.equal(scene._started, true);
        assert.equal(scene._active, true);
        assert.equal(scene.isFading(), false);
        assert.equal(scene._statusWindow.refreshed, 1);
        assert.equal(calls.startBattle, 0);
        assert.equal(calls.playBattleBgm, 0);
        assert.equal(BattleManager._phase, 'input');
        assert.equal(BattleManager.actor(), $gameActors.actor(2));
    `);
});

test('normal battle transitions are unchanged', () => {
    const { run } = setup();
    run(`
        SceneManager._previousClass = Scene_Map;
        const scene = battleScene();
        scene.start();
        assert.equal(calls.startBattle, 1);
        assert.equal(calls.playBattleBgm, 1);
        assert.equal(scene.isFading(), true);

        SceneManager._nextScene = Object.create(Scene_Map.prototype);
        scene.stop();
        assert.equal(scene.isFading(), true);
        assert.equal(scene._statusWindow.closed, 1);
        scene.terminate();
        assert.equal(calls.snap, 0);
        assert.equal($gameParty.inBattle(), false);
        assert.equal(calls.stopMe, 1);
        assert.equal(scene.autosaves, 1);
    `);
});

test('Scene_Equip in battle disables actor paging; menu keeps it', () => {
    const { run } = setup();
    run(`
        const battle = equipScene();
        assert.deepEqual(symbols(battle._commandWindow), ['equip', 'optimize', 'clear']);
        assert.equal(battle._commandWindow.isHandled('pagedown'), false);
        assert.equal(battle._commandWindow.isHandled('pageup'), false);
        assert.equal(battle._commandWindow.isHandled('cancel'), true);
        assert.equal(battle._commandWindow.isHandled('equip'), true);
        assert.equal(battle.needsPageButtons(), false);

        $gameParty._inBattle = false;
        const menu = equipScene();
        assert.equal(menu._commandWindow.isHandled('pagedown'), true);
        assert.equal(menu._commandWindow.isHandled('pageup'), true);
        assert.equal(menu.needsPageButtons(), true);
    `);
});
