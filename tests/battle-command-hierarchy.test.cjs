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

// Standalone variant of battle-equip-command.test.cjs's VM harness. All game
// objects, DataManager/BattleManager and ALL window/scene prototypes are the
// installed MZ engine, not replicas of battle selection/action logic.
// Rendering/audio/map refresh are headless boundaries. Info/log display windows
// are explicit vendor doubles; their scene open/close hooks are installed source.
// Every test owns its VM and database copy. No plugins.js evaluation or mutation.
function setup({ auto = true, equip = true, info = true, log = true,
    layout = true, hierarchy = true, seal = false, sealDisable = false, tpb = true,
    sealSign = '', width = 816, height = 624 } = {}) {
    const context = vm.createContext({ console, assert });
    const run = (source, filename = 'battle-command-hierarchy-harness.js') =>
        vm.runInContext(source, context, { filename, timeout: 10000 });
    const load = file => run(read(file), file);
    run(slice('js/rmmz_core.js', null, 'function Utils()'), 'installed-JsExtensions.js');
    run(slice('js/rmmz_managers.js', null, 'function ConfigManager()'), 'installed-DataManager.js');
    run(slice('js/rmmz_managers.js', 'function BattleManager()', 'function PluginManager()'),
        'installed-BattleManager.js');
    load('js/rmmz_objects.js');
    run(`
        Object.assign(globalThis, ${JSON.stringify(database)});
        const calls = { buzzer: 0, cancel: 0, escape: 0, snap: 0, pushed: [], mapRefresh: 0 };
        const PluginManager = { _scripts: [], parameters(name) {
            return name === 'NRP_AutoBattle' ? {
                CommandName: 'AUTO', PartyCommandPosition: '1', ActorCommandPosition: '1',
                ShortcutKey: '', NormalAttackOnly: 'false', Only1Turn: 'false'
            } : {};
        } };
        const document = { currentScript: { src: 'js/plugins/Battle/CMenu/SealActorCommand.js' } };
        // Typed parameters and metadata service only; seal hooks themselves are real.
        const PluginManagerEx = {
            createParameter: () => ({ commandDisable: ${sealDisable}, disableSign: ${JSON.stringify(sealSign)} }),
            findMetaValue(object, names) {
                for (const name of names) if (object?.meta?.[name] !== undefined) return object.meta[name];
            }
        };
        const Utils = { isOptionValid: () => false, isMobileDevice: () => false,
            RPGMAKER_NAME: 'MZ', containsArabic: () => false };
        const Graphics = { width: ${width}, height: ${height}, boxWidth: ${width}, boxHeight: ${height} };
        const ConfigManager = { touchUI: false, commandRemember: false };
        const ColorManager = {
            normalColor: () => '#fff', outlineColor: () => '#000', textColor: () => '#fff',
            itemBackColor1: () => '#111', itemBackColor2: () => '#222',
            systemColor: () => '#fff', mpCostColor: () => '#fff', tpCostColor: () => '#fff'
        };
        const TextManager = {
            attack: '攻撃', guard: '防御', item: 'アイテム', skill: 'スキル', fight: '戦う',
            escape: '逃げる', equip: '装備', equip2: '装備', optimize: '最強装備', clear: '全て外す',
            escapeStart: '%1 escaped', escapeFailure: 'Failed', partyName: '%1 party'
        };
        const Input = { _pressed: '', _triggered: '', update() {},
            isTriggered(key) { return key === this._triggered; },
            isRepeated: () => false, isPressed(key) { return key === this._pressed; } };
        const TouchInput = { update() {}, isTriggered: () => false, isCancelled: () => false,
            isHovered: () => false, isLongPressed: () => false };
        const SoundManager = { playOk() {}, playCursor() {}, playBuzzer() { calls.buzzer++; },
            playCancel() { calls.cancel++; }, playEscape() { calls.escape++; } };
        const AudioManager = { stopMe() {}, stopBgm() {}, checkErrors() {}, playSe() {},
            replayBgm() {}, replayBgs() {} };
        const SceneManager = {
            _nextScene: null, _previousClass: null,
            isNextScene(type) { return this._nextScene?.constructor === type; },
            isPreviousScene(type) { return this._previousClass === type; },
            push(type) { calls.pushed.push(type); this._nextScene = Object.create(type.prototype); },
            snapForBackground() { calls.snap++; }, isSceneChanging: () => false
        };
        class Rectangle {
            constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); }
            pad(n) { this.x -= n; this.y -= n; this.width += n * 2; this.height += n * 2; }
        }
        class Bitmap {
            constructor(width, height) { Object.assign(this, { width, height, text: [], fontSize: 26 }); }
            clear() { this.text = []; }
            drawText(...args) { this.text.push(args); }
            measureTextWidth(text) { return String(text).length * this.fontSize / 2; }
            addLoadListener(fn) { fn(this); }
            isReady() { return true; }
            fillRect() {} gradientFillRect() {} strokeRect() {} blt() {} destroy() {}
        }
        class Sprite { constructor() { this.children = []; this.anchor = { x: 0, y: 0 }; } }
        function Stage() {}
        Stage.prototype.initialize = function() { this.children = []; };
        class ColorFilter { setBlendColor() {} setBrightness() {} }
        function Window() {}
        Window.prototype.initialize = function() {
            Object.assign(this, { openness: 255, visible: true, origin: { x: 0, y: 0 },
                _contentsSprite: {}, _clientArea: { children: [] }, children: [] });
        };
        Window.prototype.move = function(x, y, width, height) { Object.assign(this, { x, y, width, height }); };
        Window.prototype.setTone = function() {};
        Window.prototype.setCursorRect = function() {};
        Window.prototype.update = function() {};
        Window.prototype.isOpen = function() { return this.openness >= 255; };
        Window.prototype.isClosed = function() { return this.openness <= 0; };
        Window.prototype.addChild = function(child) { this.children.push(child); return child; };
        Window.prototype.addChildToBack = Window.prototype.addChild;
        Object.defineProperties(Window.prototype, {
            innerWidth: { get() { return Math.max(0, this.width - 2 * this.padding); } },
            innerHeight: { get() { return Math.max(0, this.height - 2 * this.padding); } }
        });
        const ImageManager = { loadSystem: () => new Bitmap(192, 192),
            loadFace: () => new Bitmap(576, 288), faceWidth: 144, faceHeight: 144,
            iconWidth: 32, iconHeight: 32, isObjectCharacter: () => false };
    `);
    load('js/rmmz_windows.js');
    load('js/rmmz_scenes.js');
    run(`
        // Sprite gauges/faces are outside these state/geometry tests. Leave
        // status refresh, selection and all real target-window handlers intact.
        Window_BattleStatus.prototype.drawItem = function() {};
        Scene_Message.prototype.createAllWindows = function() {
            this._messageWindow = new Window_Base(new Rectangle(0, 0, 100, 100));
            this._messageWindow.openness = 0;
        };
        Scene_Battle.prototype.createLogWindow = function() {
            this._logWindow = new Window_Base(this.logWindowRect());
            Object.assign(this._logWindow, { startTurn() {}, clear() {}, isBusy: () => false });
            this.addWindow(this._logWindow);
        };
    `);
    if (layout) load('js/plugins/FlexibleTopDownUI.js');
    if (equip) load('js/plugins/BattleEquipCommand.js');
    if (auto) load('js/plugins/Battle/CMenu/NRP_AutoBattle.js');
    if (seal) load('js/plugins/Battle/CMenu/SealActorCommand.js');
    if (info) {
        run(`
            // KEN display double: battler objects (NOT command descriptors),
            // child detail window and list rebuild match the installed contract.
            class Window_BattleStateInfo extends Window_Command {
                initialize(rect) {
                    super.initialize(rect);
                    this._stateListWindow = new Window_Selectable(rect);
                    this._stateListWindow.setBattler = function(b) { this._battler = b; };
                    this.openness = 0;
                    this.deactivate();
                }
                makeCommandList() {
                    if (this._stateListWindow) {
                        this._list = $gameParty.members().concat($gameTroop.members().filter(b => b.isAppeared()));
                        this._stateListWindow.setBattler(this.battler(this._index));
                    }
                }
                battler(index) { return this._list.length ? this._list[index] : null; }
                drawItem() {} hideGaugeSprite() {}
            }
        `);
        // Use actual vendor scene lifecycle/return/input gating. Only parameter
        // expression evaluation and the complex gauge-rendering window are stubbed.
        const source = slice('js/plugins/Battle/CMenu/KEN_BattleStateInformation.js',
            'const goingToStatus =',
            '//-------------------------------------------------------------------------\n// Window_PartyCommand');
        run(`(() => {
            const WindowWidth = 800, WindowX = '0', WindowY = '0';
            const BattlerAreaRows = 3, StateLineNum = 1, StateMaxRows = 5;
            const evalAxis = () => 0;
            ${source}
        })();`, 'installed-KEN-scene-hooks.js');
    }
    if (log) {
        run(`
            class TestPastLog extends Window_Command {
                makeCommandList() { this.addCommand('Recorded battle entry', 'entry'); }
                selectBottom() { this.select(this.maxItems() - 1); }
            }
            const createWithLog = Scene_Battle.prototype.createAllWindows;
            Scene_Battle.prototype.createAllWindows = function() {
                createWithLog.call(this);
                this._pastLogWindow = new TestPastLog(this.skillWindowRect());
                this._pastLogWindow.openness = 0;
                this._pastLogWindow.deactivate();
                this._pastLogWindow.setHandler('cancel', this.onPastLogCancel.bind(this));
                this.addWindow(this._pastLogWindow);
            };
        `);
        run(slice('js/plugins/Battle/Log/MPP_SmoothBattleLog.js',
            '    Scene_Battle.prototype.commandPastLog =',
            '    const _Scene_Battle_closeCommandWindows ='), 'installed-MPP-log-scene-hooks.js');
    }
    if (hierarchy) load('js/plugins/BattleCommandHierarchy.js');
    run(`
        // Deterministic fixtures, using installed DB shapes and real traits,
        // actions and state restrictions rather than mocking canInput/canMove.
        $dataSystem.battleSystem = ${tpb ? 1 : 0};
        const actorTemplate = JSON.parse(JSON.stringify($dataActors[1]));
        const classId = actorTemplate.classId;
        $dataClasses[classId].traits = [];
        $dataClasses[classId].learnings = [];
        for (let id = 1; id <= 7; id++) {
            $dataActors[id] = { ...JSON.parse(JSON.stringify(actorTemplate)), id,
                name: 'Actor' + id, initialLevel: 1, equips: [], note: '', meta: {},
                traits: [1, 2, 3, 4].map(dataId => ({ code: 41, dataId, value: 1 })) };
        }
        const skillIds = [1, 2, 3, 4].map(stypeId => {
            const id = $dataSkills.length;
            $dataSkills.push({ ...JSON.parse(JSON.stringify($dataSkills[1])), id,
                name: 'Type' + stypeId, stypeId, scope: 1, occasion: 0,
                mpCost: 0, tpCost: 0, requiredWtypeId1: 0, requiredWtypeId2: 0,
                note: '', meta: {}, effects: [] });
            return id;
        });
        const itemId = $dataItems.length;
        $dataItems.push({ ...JSON.parse(JSON.stringify($dataItems[1])), id: itemId,
            name: 'Fixture item', scope: 7, occasion: 0, effects: [], note: '', meta: {} });
        const makeState = (restriction, traits = []) => {
            const id = $dataStates.length;
            $dataStates.push({ ...JSON.parse(JSON.stringify($dataStates[1])), id,
                name: 'Fixture state', restriction, traits, removeAtBattleEnd: false,
                autoRemovalTiming: 0, note: '', meta: {} });
            return id;
        };
        const immobileState = makeState(4);
        const autoState = makeState(0, [{ code: 62, dataId: 0, value: 1 }]);
        const sealedState = makeState(0, [{ code: 42, dataId: 2, value: 1 }]);
        const retainedState = makeState(0);
        for (const data of Object.values(globalThis).filter(x => Array.isArray(x))) {
            for (const object of data) if (object && typeof object.note === 'string') DataManager.extractMetadata(object);
        }
        $gameTemp = new Game_Temp();
        $gameSystem = new Game_System();
        $gameActors = new Game_Actors();
        $gameVariables = new Game_Variables();
        $gameSwitches = new Game_Switches();
        $gameMessage = new Game_Message();
        $gameScreen = new Game_Screen();
        $gameTimer = new Game_Timer();
        $gameMap = new Game_Map();
        $gameParty = new Game_Party();
        $gameTroop = new Game_Troop();
        $gamePlayer = { refresh() { calls.mapRefresh++; } };
        $gameParty._actors = [1, 2, 3, 4, 5];
        $gameParty._inBattle = true;
        $gameTroop.setup(1);
        BattleManager.initMembers();
        BattleManager._phase = ${tpb ? "'turn'" : "'input'"};
        BattleManager._canEscape = true;
        BattleManager._inputting = true;
        for (const actor of $gameParty.allMembers()) {
            actor.recoverAll();
            for (const id of skillIds) actor.learnSkill(id);
            actor._tpbState = 'charged';
            actor._tpbChargeTime = 1;
            actor.makeActions();
        }
        $gameParty.gainItem($dataItems[itemId], 3);
        BattleManager._currentActor = $gameActors.actor(1);
        BattleManager.startActorInput();

        function battleScene() {
            const scene = new Scene_Battle();
            scene._windowLayer = { children: [], addChild(child) { this.children.push(child); } };
            scene.createAllWindows();
            if (scene.relayoutBattleWindows) scene.relayoutBattleWindows();
            BattleManager.setLogWindow(scene._logWindow);
            scene.startActorCommandSelection();
            return scene;
        }
        function choose(win, symbol, ext) {
            const index = win._list.findIndex(c => c.symbol === symbol && (ext === undefined || c.ext === ext));
            assert.ok(index >= 0, 'command exists: ' + symbol);
            win.select(index);
            win.openness = 255;
            win.processOk();
        }
        function cancel(win) { win.openness = 255; win.processCancel(); }
        function assertPartyHidden(scene) {
            assert.equal(scene._partyCommandWindow.visible, false);
            assert.equal(scene._partyCommandWindow.active, false);
        }
        function assertLayer(scene, layer, symbol) {
            const win = scene._actorCommandWindow;
            assert.equal(win._battleCommandLayer, layer);
            assert.equal(win.active, true);
            assert.equal(win.visible, true);
            if (symbol) assert.equal(win.currentSymbol(), symbol);
            assertPartyHidden(scene);
        }
        const commandShape = win => win._list.map(c => [c.name, c.symbol, c.ext]);
        const entry = (win, symbol) => win._list.find(c => c.symbol === symbol);
        const resources = actor => [actor.hp, actor.mp, actor.tp, actor._states.slice()];
    `);
    return { run };
}

test('baseline real actor command constructor works without hierarchy or initialization workaround', () => {
    setup({ hierarchy: false }).run(`
        const scene = new Scene_Battle();
        assert.doesNotThrow(() => new Window_ActorCommand(scene.actorCommandWindowRect()));
    `);
});

test('hierarchy real actor command constructor works without initialization workaround', () => {
    setup().run(`
        const scene = new Scene_Battle();
        assert.equal(Object.hasOwn(Window_ActorCommand.prototype, '_list'), false);
        assert.doesNotThrow(() => new Window_ActorCommand(scene.actorCommandWindowRect()),
            'maxCols must tolerate the pre-command-list stage of MZ initialization');
    `);
});

test('root has exactly five labels in order, with real optional integrations', () => {
    setup().run(`
        const scene = battleScene(), win = scene._actorCommandWindow;
        assert.deepEqual(commandShape(win), [
            ['戦う', 'fightMenu', null], ['オート', 'autoBattle', null], ['戦況確認', 'situationMenu', null],
            ['入れ替え', 'swap', null], ['逃げる', 'escape', null]
        ]);
        assert.ok(win._list.every(c => c.enabled));
        assert.equal(win.isTouchOkEnabled(), true);
        assertLayer(scene, 'root', 'fightMenu');
    `);
});

test('setup resets remembered leaf selection and scrolling to a usable root', () => {
    setup().run(`
        const scene = battleScene(), win = scene._actorCommandWindow;
        ConfigManager.commandRemember = true;
        win.setBattleCommandLayer('fight');
        win.selectExt(4);
        win.actor().setLastCommandSymbol('skill');
        win.actor().setLastBattleSkill($dataSkills[skillIds[3]]);
        win.setup($gameActors.actor(2));
        assertLayer(scene, 'root', 'fightMenu');
        assert.equal(win.index(), 0);
        win.setup(null);
        assert.equal(win.maxItems(), 0);
        assert.equal(win.maxCols(), 1);
    `);
});

test('fight first five commands are types 1, 2, item, 3, 4 with Back last', () => {
    setup().run(`
        const scene = battleScene(), win = scene._actorCommandWindow;
        choose(win, 'fightMenu');
        assert.deepEqual(commandShape(win), [
            ['攻撃技', 'skill', 1], ['必殺技', 'skill', 2], ['アイテム', 'item', null],
            ['補助･回復', 'skill', 3], ['妨害', 'skill', 4], ['戻る', 'commandBack', null]
        ]);
        assert.ok(win._list.every(c => c.enabled));
        assertLayer(scene, 'fight', 'skill');
    `);
});

test('unavailable skill types stay visible and disabled; disabled OK cannot dispatch', () => {
    setup().run(`
        $dataActors[1].traits = [{ code: 41, dataId: 1, value: 1 }];
        const scene = battleScene(), win = scene._actorCommandWindow;
        choose(win, 'fightMenu');
        assert.deepEqual(win._list.map(c => c.enabled), [true, false, true, false, false, true]);
        choose(win, 'skill', 2);
        assert.equal(calls.buzzer, 1);
        assert.equal(scene._skillWindow.active, false);
        assertLayer(scene, 'fight', 'skill');
    `);
});

test('engine skill-type seal disables the corresponding fight command', () => {
    setup().run(`
        $gameActors.actor(1).addState(sealedState);
        assert.equal($gameActors.actor(1).isSkillTypeSealed(2), true);
        const scene = battleScene();
        choose(scene._actorCommandWindow, 'fightMenu');
        const strong = scene._actorCommandWindow._list.find(c => c.ext === 2);
        assert.equal(strong.enabled, false, 'sealed type 2 must not remain selectable');
    `);
});

for (const sealDisable of [false, true]) {
    test(`installed SealActorCommand preserves disabled type/item entries (commandDisable=${sealDisable})`, () => {
        setup({ seal: true, sealDisable }).run(`
            $dataActors[1].meta = { SkillType2SealSwitch: true, ItemSealSwitch: true };
            const scene = battleScene(), win = scene._actorCommandWindow;
            choose(win, 'fightMenu');
            assert.deepEqual(win._list.map(c => c.enabled), [true, false, false, true, true, true]);
            choose(win, 'item');
            assert.equal(calls.buzzer, 1);
            assert.equal(scene._itemWindow.active, false);
        `);
    });
}

test('situation and formation labels/order and all action handlers are installed', () => {
    setup().run(`
        const scene = battleScene(), win = scene._actorCommandWindow;
        choose(win, 'situationMenu');
        assert.deepEqual(commandShape(win), [
            ['バトルログ', 'pastLog', null], ['味方ステータス', 'allyStatus', null],
            ['敵ステータス', 'enemyStatus', null], ['戻る', 'commandBack', null]
        ]);
        for (const c of win._list) {
            assert.equal(c.enabled, true);
            assert.equal(win.isHandled(c.symbol), true, c.symbol);
        }
        win.setBattleCommandLayer('formation');
        assert.deepEqual(commandShape(win), [
            ['隊列変更', 'formation', null], ['装備変更', 'equip', null], ['戻る', 'commandBack', null]
        ]);
        for (const symbol of ['fightMenu', 'situationMenu', 'formationMenu', 'swap', 'escape', 'autoBattle', 'cancel']) {
            assert.equal(win.isHandled(symbol), true, symbol);
        }
    `);
});

test('missing optional plugins disable auto/equip/info/log without crashing', () => {
    setup({ auto: false, equip: false, info: false, log: false }).run(`
        const scene = battleScene(), win = scene._actorCommandWindow;
        assert.equal(entry(win, 'autoBattle').enabled, false);
        choose(win, 'autoBattle');
        assert.equal(calls.buzzer, 1);
        choose(win, 'situationMenu');
        assert.deepEqual(win._list.map(c => c.enabled), [false, false, false, true]);
    `);
});

for (const layer of ['fight', 'situation']) {
    for (const back of ['cancel', 'commandBack']) {
        test(`${layer} ${back} returns to matching root entry, never previous actor/party`, () => {
            setup().run(`
                const scene = battleScene(), win = scene._actorCommandWindow;
                const actor = BattleManager.actor(), action = actor.inputtingAction();
                const phase = BattleManager._phase, gauge = actor._tpbChargeTime;
                BattleManager.selectPreviousCommand = () => assert.fail('must not undo actor input');
                choose(win, '${layer === 'fight' ? 'fightMenu' : 'situationMenu'}');
                ${back === 'cancel' ? 'cancel(win);' : "choose(win, 'commandBack');"}
                assertLayer(scene, 'root', '${layer === 'fight' ? 'fightMenu' : 'situationMenu'}');
                assert.equal(BattleManager.actor(), actor);
                assert.equal(actor.inputtingAction(), action);
                assert.equal(actor._tpbChargeTime, gauge);
                assert.equal(BattleManager._phase, phase);
            `);
        });
    }
}

test('root cancel is gated by real Window_Selectable handling', () => {
    setup().run(`
        const scene = battleScene(), win = scene._actorCommandWindow;
        BattleManager.selectPreviousCommand = () => assert.fail('root must not undo input');
        win.openness = 255;
        Input._triggered = 'cancel';
        win.processHandling();
        assert.equal(win.isCancelEnabled(), false);
        assert.equal(calls.cancel, 0);
        assertLayer(scene, 'root', 'fightMenu');
    `);
});

for (const kind of ['skill', 'item']) {
    for (const target of ['enemy', 'actor']) {
        test(`${kind} -> ${target} target cancel -> list cancel stays in fight`, () => {
            setup().run(`
                const scene = battleScene(), win = scene._actorCommandWindow;
                const actor = BattleManager.actor();
                const data = ${kind === 'skill' ? '$dataSkills[skillIds[2]]' : '$dataItems[itemId]'};
                data.scope = ${target === 'enemy' ? 1 : 7};
                choose(win, 'fightMenu');
                choose(win, '${kind}'${kind === 'skill' ? ', 3' : ''});
                const list = scene.${kind === 'skill' ? '_skillWindow' : '_itemWindow'};
                assert.equal(list.active, true);
                ${kind === 'skill' ? 'assert.equal(list._stypeId, 3);' : ''}
                list.select(list._data.indexOf(data));
                assert.ok(list.index() >= 0);
                list.processOk();
                const target = scene.${target === 'enemy' ? '_enemyWindow' : '_actorWindow'};
                assert.equal(target.active, true);
                assert.equal(actor.inputtingAction().item(), data);
                cancel(target);
                assert.equal(target.active, false);
                assert.equal(target.visible, false);
                assert.equal(list.active, true);
                assert.equal(win._battleCommandLayer, 'fight');
                assert.equal(win.currentSymbol(), '${kind}');
                cancel(list);
                assertLayer(scene, 'fight', '${kind}');
                ${kind === 'skill' ? 'assert.equal(win.currentExt(), 3);' : ''}
                assert.equal(actor._tpbChargeTime, 1);
                assert.equal(BattleManager.actor(), actor);
            `);
        });
    }
}

test('initial TPB input opens an actor directly and clears party gate', () => {
    setup().run(`
        const scene = battleScene();
        BattleManager._currentActor = null;
        BattleManager._inputting = false;
        BattleManager._tpbNeedsPartyCommand = true;
        BattleManager.checkTpbInputOpen();
        assert.equal(BattleManager._tpbNeedsPartyCommand, false);
        assert.equal(BattleManager.actor(), $gameActors.actor(1));
        assert.equal(BattleManager.isInputting(), true);
        scene.changeInputWindow();
        assertLayer(scene, 'root');
    `);
});

test('TPB with no charged actors never opens the party window', () => {
    setup().run(`
        const scene = battleScene();
        for (const actor of $gameParty.battleMembers()) actor.clearTpbChargeTime();
        BattleManager._currentActor = null;
        BattleManager._inputting = false;
        BattleManager._tpbNeedsPartyCommand = true;
        BattleManager.checkTpbInputOpen();
        scene.changeInputWindow();
        assert.equal(BattleManager.actor(), null);
        assert.equal(BattleManager.isInputting(), false);
        assert.equal(scene._actorCommandWindow.active, false);
        assertPartyHidden(scene);
    `);
});

test('turn-based startInput skips party selection and opens first inputtable actor', () => {
    setup({ tpb: false }).run(`
        const scene = battleScene();
        $gameActors.actor(1).addState(immobileState);
        BattleManager.startInput();
        assert.equal(BattleManager.actor(), null);
        scene.changeInputWindow();
        assert.equal(BattleManager.actor(), $gameActors.actor(2));
        assert.equal(BattleManager._phase, 'input');
        assertLayer(scene, 'root');
    `);
});

test('turn-based party skip with no eligible actor starts the turn', () => {
    setup({ tpb: false }).run(`
        const scene = battleScene();
        for (const actor of $gameParty.battleMembers()) actor.addState(immobileState);
        BattleManager._currentActor = null;
        scene.startPartyCommandSelection();
        assert.equal(BattleManager._phase, 'turn');
        assert.equal(BattleManager.isInputting(), false);
        assertPartyHidden(scene);
    `);
});

test('escape prohibition disables root entry and prevents processEscape dispatch', () => {
    setup().run(`
        BattleManager._canEscape = false;
        const scene = battleScene();
        BattleManager.processEscape = () => assert.fail('prohibited escape dispatched');
        assert.equal(entry(scene._actorCommandWindow, 'escape').enabled, false);
        choose(scene._actorCommandWindow, 'escape');
        assert.equal(calls.buzzer, 1);
        assertLayer(scene, 'root', 'escape');
    `);
});

for (const tpb of [true, false]) {
    test(`failed escape uses real engine penalty and keeps party hidden (tpb=${tpb})`, () => {
        setup({ tpb }).run(`
            const scene = battleScene();
            BattleManager._escapeRatio = 0;
            choose(scene._actorCommandWindow, 'escape');
            assert.equal(calls.escape, 1);
            assert.equal(BattleManager.isEscaped(), false);
            assert.equal(BattleManager._escapeRatio, 0.1);
            assert.equal(BattleManager._phase, 'turn');
            assert.equal($gameMessage.hasText(), true);
            assertPartyHidden(scene);
            ${tpb ? "assertLayer(scene, 'root');" : `
                assert.equal(BattleManager.isInputting(), false);
                assert.equal(scene._actorCommandWindow.active, false);
            `}
        `);
    });
}

for (const tpb of [true, false]) {
    test(`actual NRP_AutoBattle starts auto from actor root and cancel releases it (tpb=${tpb})`, () => {
        setup({ tpb }).run(`
            const scene = battleScene();
            choose(scene._actorCommandWindow, 'autoBattle');
            assert.equal(BattleManager.isAutoBattleMode(), true);
            assert.ok($gameParty.members().every(a => a.isAutoBattle()));
            assert.equal(scene._actorCommandWindow.active, false);
            assertPartyHidden(scene);
            ${tpb ? `
                BattleManager.updateTpbInput();
                assert.equal(BattleManager.isInputting(), false);
                const actor = $gameActors.actor(2);
                actor.clearActions();
                actor.makeTpbActions();
                assert.ok(actor.numActions() > 0);
                assert.ok(actor.action(0).item());
            ` : `
                assert.equal(BattleManager._phase, 'turn');
                assert.equal(BattleManager.isInputting(), false);
                assert.ok($gameParty.members().every(a => a.action(0)?.item()));
            `}
            // Exercise NRP's actual update wrapper plus installed scene update;
            // the scene is inactive, so no unrelated battle simulation is run.
            Input._pressed = 'cancel';
            scene.update();
            Input._pressed = '';
            assert.equal(BattleManager.isAutoBattleMode(), false);
            assert.equal(calls.cancel, 1);
            assert.ok($gameParty.members().every(a => !a.isAutoBattle()));
            assertPartyHidden(scene);
        `);
    });
}

test('turn-based auto party gate still assigns actions and starts turn', () => {
    setup({ tpb: false }).run(`
        const scene = battleScene();
        BattleManager.setAutoBattleMode(true);
        BattleManager._currentActor = null;
        scene.startPartyCommandSelection();
        assert.equal(BattleManager._phase, 'turn');
        assert.equal(BattleManager.isInputting(), false);
        assert.ok($gameParty.members().every(a => a.action(0)?.item()));
        assertPartyHidden(scene);
    `);
});

test('real BattleEquipCommand roundtrip to fresh Scene_Battle restores formation/equip without consuming action', () => {
    setup().run(`
        const scene = battleScene(), actor = BattleManager.actor();
        const action = actor.inputtingAction(), before = resources(actor);
        actor._tpbChargeTime = 0.75;
        scene._actorCommandWindow.setBattleCommandLayer('formation');
        choose(scene._actorCommandWindow, 'equip');
        assert.deepEqual(calls.pushed, [Scene_Equip]);
        assert.equal($gameParty.menuActor(), actor);
        assert.equal(BattleManager._hierarchyEquipActor, actor);
        scene.stop();
        scene.terminate();
        assert.equal(calls.snap, 1);
        assert.equal($gameParty.inBattle(), true);
        SceneManager._nextScene = null;
        SceneManager._previousClass = Scene_Equip;
        const resumed = battleScene();
        BattleManager.startBattle = () => assert.fail('must not restart battle');
        BattleManager.playBattleBgm = () => assert.fail('must not restart BGM');
        resumed.start();
        assertLayer(resumed, 'formation', 'equip');
        assert.equal(BattleManager._hierarchyEquipActor, null);
        assert.equal(BattleManager.actor(), actor);
        assert.equal(actor.inputtingAction(), action);
        assert.equal(actor._tpbChargeTime, 0.75);
        assert.deepEqual(resources(actor), before);
        assert.equal(BattleManager._phase, 'turn');
        resumed.startActorCommandSelection();
        assertLayer(resumed, 'root');
    `);
});

test('status inspection roundtrip keeps the battle active and does not restart it', () => {
    setup().run(`
        const scene = battleScene();
        const phase = BattleManager._phase;
        scene.openStateInfoWindow();
        assert.deepEqual(calls.pushed, [Scene_Status]);
        scene.stop();
        scene.terminate();
        assert.equal($gameParty.inBattle(), true);
        assert.equal(BattleManager._phase, phase);
        SceneManager._nextScene = null;
        SceneManager._previousClass = Scene_Status;
        const resumed = battleScene();
        BattleManager.startBattle = () => assert.fail('must not restart battle');
        resumed.start();
        assert.equal(BattleManager._phase, phase);
        assert.equal($gameParty.inBattle(), true);
    `);
});

test('equip marker cannot leak to a different actor or another battle', () => {
    setup().run(`
        BattleManager._hierarchyEquipActor = $gameActors.actor(2);
        const scene = battleScene();
        assertLayer(scene, 'root');
        assert.equal(BattleManager._hierarchyEquipActor, null);
        BattleManager._hierarchyEquipActor = $gameActors.actor(1);
        BattleManager.initMembers();
        assert.equal(BattleManager._hierarchyEquipActor, null);
    `);
});

for (const side of ['ally', 'enemy']) {
    test(`${side} status filters members/details, pauses time, returns to situation selection`, () => {
        setup().run(`
            const scene = battleScene(), actor = BattleManager.actor();
            const action = actor.inputtingAction(), before = resources(actor);
            choose(scene._actorCommandWindow, 'situationMenu');
            choose(scene._actorCommandWindow, '${side}Status');
            const info = scene._windowBattleStateInfo;
            const expected = ${side === 'ally' ? '$gameParty.battleMembers()' : '$gameTroop.members().filter(b => b.isAppeared())'};
            assert.deepEqual(info._list, expected);
            assert.equal(info._stateListWindow._battler, expected[0]);
            assert.equal(info.index(), 0);
            assert.equal(info.active, true);
            assert.equal(scene._actorCommandWindow.active, false);
            assert.equal(scene.isAnyInputWindowActive(), true);
            assert.equal(scene.needsInputWindowChange(), false);
            assert.equal(scene.isTimeActive(), false);
            cancel(info);
            assert.equal(info.active, false);
            assert.equal(info._hierarchySide, null);
            assertLayer(scene, 'situation', '${side}Status');
            assert.equal(scene.isTimeActive(), true);
            assert.equal(actor.inputtingAction(), action);
            assert.deepEqual(resources(actor), before);
            assert.equal(actor._tpbChargeTime, 1);
        `);
    });
}

test('status reopening switches sides and shortcut returns to its original fight layer', () => {
    setup().run(`
        const scene = battleScene(), win = scene._actorCommandWindow;
        choose(win, 'situationMenu');
        choose(win, 'enemyStatus');
        scene._windowBattleStateInfo.select(99);
        scene._windowBattleStateInfo.refresh();
        assert.equal(scene._windowBattleStateInfo.index(), scene._windowBattleStateInfo.maxItems() - 1);
        cancel(scene._windowBattleStateInfo);
        choose(win, 'allyStatus');
        assert.ok(scene._windowBattleStateInfo._list.every(b => b.isActor()));
        cancel(scene._windowBattleStateInfo);
        win.setBattleCommandLayer('fight');
        win.selectExt(4);
        win.deactivate();
        win.callHandler('stateInfo');
        const info = scene._windowBattleStateInfo;
        assert.equal(info._hierarchySide, null);
        assert.ok(info._list.some(b => b.isActor()));
        assert.ok(info._list.some(b => b.isEnemy()));
        cancel(info);
        assertLayer(scene, 'fight', 'skill');
        assert.equal(win.currentExt(), 4);
    `);
});

test('no alive enemies disables enemy status, while ally status remains available', () => {
    setup().run(`
        for (const enemy of $gameTroop.members()) enemy.setHp(0);
        const scene = battleScene(), win = scene._actorCommandWindow;
        choose(win, 'situationMenu');
        assert.equal(entry(win, 'enemyStatus').enabled, false);
        assert.equal(entry(win, 'allyStatus').enabled, true);
        choose(win, 'enemyStatus');
        assert.equal(calls.buzzer, 1);
        assert.equal(scene._windowBattleStateInfo.active, false);
    `);
});

test('past log deactivates actor input, pauses time and returns to situation/pastLog', () => {
    setup().run(`
        const scene = battleScene(), actor = BattleManager.actor();
        const action = actor.inputtingAction();
        choose(scene._actorCommandWindow, 'situationMenu');
        choose(scene._actorCommandWindow, 'pastLog');
        assert.equal(scene._pastLogWindow.active, true);
        assert.equal(scene._actorCommandWindow.active, false);
        assert.equal(scene.isTimeActive(), false);
        cancel(scene._pastLogWindow);
        assert.equal(scene._pastLogWindow.active, false);
        assertLayer(scene, 'situation', 'pastLog');
        assert.equal(scene.isTimeActive(), true);
        assert.equal(actor.inputtingAction(), action);
        assert.equal(actor._tpbChargeTime, 1);
    `);
});

test('reserve list uses actor identities/HP, tracks input, pauses time and cancels to root/swap', () => {
    setup().run(`
        const scene = battleScene(), actor = BattleManager.actor(), action = actor.inputtingAction();
        const before = $gameParty.allMembers().slice();
        choose(scene._actorCommandWindow, 'swap');
        const win = scene._battleReserveWindow, reserve = $gameActors.actor(5);
        assert.deepEqual(commandShape(win), [
            [reserve.name() + '  HP ' + reserve.hp + '/' + reserve.mhp, 'reserve', reserve],
            ['戻る', 'cancel', null]
        ]);
        assert.equal(win.maxCols(), 1);
        assert.equal(win.isTouchOkEnabled(), true);
        assert.equal(scene.isAnyInputWindowActive(), true);
        assert.equal(scene.needsInputWindowChange(), false);
        assert.equal(scene.isTimeActive(), false);
        cancel(win);
        assertLayer(scene, 'root', 'swap');
        assert.equal(win.active, false);
        assert.equal(win.visible, false);
        assert.deepEqual($gameParty.allMembers(), before);
        assert.equal(actor.inputtingAction(), action);
        assert.equal(actor._tpbChargeTime, 1);
        choose(scene._actorCommandWindow, 'swap');
        choose(win, 'cancel');
        assertLayer(scene, 'root', 'swap');
    `);
});

for (const unavailable of ['no reserve', 'formation disabled', 'dead', 'immobile', 'auto']) {
    test(`swap root disabled when ${unavailable}`, () => {
        setup().run(`
            ${unavailable === 'no reserve' ? '$gameParty._actors = [1, 2, 3, 4];' : ''}
            ${unavailable === 'formation disabled' ? '$gameSystem.disableFormation();' : ''}
            ${unavailable === 'dead' ? '$gameActors.actor(5).setHp(0);' : ''}
            ${unavailable === 'immobile' ? '$gameActors.actor(5).addState(immobileState);' : ''}
            ${unavailable === 'auto' ? '$gameActors.actor(5).addState(autoState);' : ''}
            const scene = battleScene();
            assert.equal(entry(scene._actorCommandWindow, 'swap').enabled, false);
            choose(scene._actorCommandWindow, 'swap');
            assert.equal(calls.buzzer, 1);
            assert.equal(scene._battleReserveWindow.active, false);
            assertLayer(scene, 'root', 'swap');
        `);
    });
}

test('mixed reserves keep invalid entries disabled and valid entry selectable', () => {
    setup().run(`
        $gameParty._actors.push(6, 7);
        $gameActors.actor(5).setHp(0);
        $gameActors.actor(6).addState(immobileState);
        const scene = battleScene();
        choose(scene._actorCommandWindow, 'swap');
        const win = scene._battleReserveWindow;
        assert.deepEqual(win._list.map(c => c.enabled), [false, false, true, true]);
        choose(win, 'reserve', $gameActors.actor(5));
        assert.equal(calls.buzzer, 1);
        assert.equal(win.active, true);
        assert.equal(BattleManager.actor(), $gameActors.actor(1));
    `);
});

for (const stale of ['formation', 'dead', 'immobile', 'auto', 'no longer reserve', 'no actor']) {
    test(`swap revalidates stale selection: ${stale}`, () => {
        setup().run(`
            const scene = battleScene(), outgoing = BattleManager.actor(), incoming = $gameActors.actor(5);
            choose(scene._actorCommandWindow, 'swap');
            ${stale === 'formation' ? '$gameSystem.disableFormation();' : ''}
            ${stale === 'dead' ? 'incoming.setHp(0);' : ''}
            ${stale === 'immobile' ? 'incoming.addState(immobileState);' : ''}
            ${stale === 'auto' ? 'incoming.addState(autoState);' : ''}
            ${stale === 'no longer reserve' ? '$gameParty.swapOrder(3, 4);' : ''}
            ${stale === 'no actor' ? 'BattleManager._currentActor = null;' : ''}
            const before = $gameParty.allMembers().slice(), action = outgoing.inputtingAction();
            choose(scene._battleReserveWindow, 'reserve', incoming);
            assert.equal(calls.buzzer, 1);
            assert.deepEqual($gameParty.allMembers(), before);
            assert.equal(outgoing.inputtingAction(), action);
            assertLayer(scene, 'root', 'swap');
            assert.equal(scene._battleReserveWindow.active, false);
            assert.equal(scene._battleReserveWindow.visible, false);
        `);
    });
}

test('TPB swap preserves resources/states, removes both queued actions and clears both gauges', () => {
    setup().run(`
        const scene = battleScene(), outgoing = BattleManager.actor(), incoming = $gameActors.actor(5);
        for (const actor of [outgoing, incoming]) {
            actor.setHp(Math.max(1, actor.mhp - 2));
            actor.setMp(Math.max(0, actor.mmp - 1));
            actor.setTp(23);
            actor.addState(retainedState);
            actor._tpbCastTime = 0.8;
            actor._tpbIdleTime = 0.7;
            actor._tpbTurnEnd = true;
            actor.select();
        }
        const snapshots = [resources(outgoing), resources(incoming)];
        const other = $gameActors.actor(2), enemy = $gameTroop.members()[0];
        const otherAction = other.inputtingAction();
        BattleManager._actionBattlers = [outgoing, other, incoming, enemy, outgoing];
        choose(scene._actorCommandWindow, 'swap');
        choose(scene._battleReserveWindow, 'reserve', incoming);
        assert.deepEqual($gameParty._actors, [5, 2, 3, 4, 1]);
        assert.equal(calls.mapRefresh, 1);
        for (const [index, actor] of [outgoing, incoming].entries()) {
            assert.equal(actor.numActions(), 0);
            assert.equal(actor._tpbChargeTime, 0);
            assert.equal(actor._tpbState, 'charging');
            assert.equal(actor._tpbCastTime, 0);
            assert.equal(actor._tpbIdleTime, 0);
            assert.equal(actor._tpbTurnEnd, false);
            assert.equal(actor._actionState, 'undecided');
            assert.equal(actor.isSelected(), false);
            assert.deepEqual(resources(actor), snapshots[index]);
        }
        assert.deepEqual(BattleManager._actionBattlers, [other, enemy]);
        assert.equal(other.inputtingAction(), otherAction);
        assert.equal(other._tpbChargeTime, 1);
        assert.equal(BattleManager.actor(), null);
        assert.equal(BattleManager.isInputting(), false);
        assert.equal(BattleManager._phase, 'turn');
        assert.equal(scene._battleReserveWindow.active, false);
        assert.equal(scene._battleReserveWindow.visible, false);
        assertPartyHidden(scene);
        BattleManager.checkTpbInputOpen();
        scene.changeInputWindow();
        assert.equal(BattleManager.actor(), other, 'new member must charge before input');
        assertLayer(scene, 'root');
    `);
});

test('turn-based swap consumes replacement action and advances to next uncommitted actor', () => {
    setup({ tpb: false }).run(`
        const scene = battleScene();
        const first = $gameActors.actor(1), outgoing = $gameActors.actor(2), incoming = $gameActors.actor(5);
        first.inputtingAction().setAttack();
        BattleManager.selectNextCommand();
        scene.changeInputWindow();
        assert.equal(BattleManager.actor(), outgoing);
        const committed = first.action(0);
        choose(scene._actorCommandWindow, 'swap');
        choose(scene._battleReserveWindow, 'reserve', incoming);
        assert.equal(outgoing.numActions(), 0);
        assert.equal(incoming.numActions(), 0);
        assert.equal(first.action(0), committed);
        assert.equal(BattleManager._phase, 'input');
        assert.equal(BattleManager.actor(), $gameActors.actor(3), 'must not reopen already committed actor 1');
        assertLayer(scene, 'root');
    `);
});

test('turn-based swap of the only battle member ends input rather than offering an actionless replacement', () => {
    setup({ tpb: false }).run(`
        $gameParty._actors = [1, 5];
        $gameParty.maxBattleMembers = () => 1;
        const scene = battleScene(), incoming = $gameActors.actor(5);
        choose(scene._actorCommandWindow, 'swap');
        choose(scene._battleReserveWindow, 'reserve', incoming);
        assert.equal(incoming.numActions(), 0);
        assert.equal(BattleManager._phase, 'turn', 'consumed action must progress battle phase');
        assert.equal(BattleManager.isInputting(), false);
        assert.equal(scene._actorCommandWindow.active, false);
        assertPartyHidden(scene);
    `);
});

test('hideSubInputWindows hides/deactivates reserve selection and releases its time pause', () => {
    setup().run(`
        const scene = battleScene();
        choose(scene._actorCommandWindow, 'swap');
        scene.hideSubInputWindows();
        assert.equal(scene._battleReserveWindow.active, false);
        assert.equal(scene._battleReserveWindow.visible, false);
        assert.equal(scene.isTimeActive(), true);
        assertPartyHidden(scene);
    `);
});

for (const [width, height, cols, rows] of [[360, 800, 3, 2], [639, 900, 3, 2],
    [640, 624, 6, 1], [1280, 720, 6, 1]]) {
    test(`actual FlexibleTopDownUI geometry fits all command cells at ${width}x${height}`, () => {
        setup({ width, height }).run(`
            const scene = battleScene(), win = scene._actorCommandWindow;
            assert.equal(scene.battleCommandHeight(), scene.calcCommandWindowHeight(${rows}));
            assert.equal(win.x, 0);
            assert.equal(win.y, 0);
            assert.equal(win.width, Graphics.boxWidth);
            assert.equal(win.height, scene.battleCommandHeight());
            for (const layer of ['root', 'fight', 'situation', 'formation']) {
                win.setBattleCommandLayer(layer);
                const layerRows = layer === 'formation'
                    ? Math.ceil(win.maxItems() / Math.min(${cols}, win.maxItems()))
                    : ${rows};
                assert.equal(win.maxCols(), Math.min(${cols}, win.maxItems()));
                assert.equal(win.maxRows(), layerRows);
                assert.equal(win.maxPageRows(), ${rows});
                assert.equal(win.scrollY(), 0);
                for (let index = 0; index < win.maxItems(); index++) {
                    const rect = win.itemRect(index);
                    assert.ok(rect.width > 0 && rect.height > 0);
                    assert.ok(rect.x >= 0 && rect.y >= 0);
                    assert.ok(rect.x + rect.width <= win.innerWidth);
                    assert.ok(rect.y + rect.height <= win.innerHeight);
                }
                assert.equal(win.contents.text.length, win.maxItems());
            }
            const skill = scene.skillWindowRect(), reserve = scene._battleReserveWindow;
            assert.equal(skill.y, scene.battleCommandHeight());
            assert.ok(skill.height > 0);
            assert.ok(skill.y + skill.height <= scene._helpWindow.y);
            assert.deepEqual([reserve.x, reserve.y, reserve.width, reserve.height],
                [skill.x, skill.y, skill.width, skill.height]);
            const info = scene.battleStateInfoWindowRect();
            assert.equal(info.y, scene.battleCommandHeight());
            assert.equal(info.x, Math.floor((Graphics.boxWidth - info.width) / 2));
            assert.ok(info.width <= Graphics.boxWidth);
            assert.ok(info.height > 0 && info.y + info.height <= Graphics.boxHeight);
            assertPartyHidden(scene);
        `);
    });
}

test('battleCommandHeight falls back to installed engine row sizing without FlexibleTopDownUI', () => {
    setup({ layout: false, width: 360, height: 800 }).run(`
        const scene = battleScene();
        assert.equal(scene.battleCommandHeight(), scene.calcWindowHeight(2, true));
        assert.equal(scene._actorCommandWindow.maxCols(), 3);
        Graphics.boxWidth = 816;
        assert.equal(scene.battleCommandHeight(), scene.calcWindowHeight(1, true));
    `);
});

test('info and past-log rectangles reserve the installed timeline/list offset', () => {
    setup().run(`
        const scene = battleScene();
        const top = scene.battleCommandHeight() + 76;
        scene.skillWindowRect = () => new Rectangle(0, top, Graphics.boxWidth, 100);
        const info = scene.battleStateInfoWindowRect();
        const log = scene.pastLogWindowRect();
        assert.equal(info.y, top);
        assert.equal(log.y, top);
        assert.ok(info.y + info.height <= Graphics.boxHeight);
        assert.equal(log.y + log.height, scene.statusWindowRect().y);
    `);
});

test('disabled hierarchy labels stay readable despite the vendor seal overlay setting', () => {
    setup({ seal: true, sealDisable: true, sealSign: '禁止' }).run(`
        const scene = battleScene(), win = scene._actorCommandWindow;
        BattleManager.actor().addState(sealedState);
        win.setBattleCommandLayer('fight');
        assert.equal(win._list.find(c => c.ext === 2).enabled, false);
        const drawn = win.contents.text.map(args => args[0]);
        assert.ok(drawn.includes('必殺技'));
        assert.equal(drawn.some(text => String(text).includes('禁止')), false);
    `);
});

test('hierarchy is registered once and after all command providers', () => {
    const context = {};
    vm.runInNewContext(read('js/plugins.js'), context);
    const enabled = context.$plugins.filter(p => p.status).map(p => p.name);
    assert.equal(enabled.filter(name => name === 'BattleCommandHierarchy').length, 1);
    const hierarchy = enabled.indexOf('BattleCommandHierarchy');
    for (const dependency of ['FlexibleTopDownUI', 'LinearTimeBattle', 'BattleEquipCommand',
        'Battle/CMenu/NRP_AutoBattle', 'Battle/CMenu/SealActorCommand',
        'Battle/CMenu/KEN_BattleStateInformation', 'Battle/Log/MPP_SmoothBattleLog']) {
        assert.ok(enabled.indexOf(dependency) >= 0 && enabled.indexOf(dependency) < hierarchy, dependency);
    }
});