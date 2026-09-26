const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pluginPath = path.join(root, 'js/plugins/MapRockBreaking.js');

function createContext({ hasHammer = true, hasWeapons = [], trigger = 0, meta,
    direction = 6, playerX = 2, playerY = 2, eventX = 3, eventY = 2 } = {}) {
    const eventMeta = meta || { '岩破壊': true };
    const messages = [];
    const animations = [];
    const switchValues = new Map();
    const addedSprites = [];
    const pluginCommands = {};
    const gainedItems = [];
    const reservedCommonEvents = [];
    const playerSprite = { _character: null, visible: true };
    const player = {
        x: playerX,
        y: playerY,
        _fieldRockBreaking: false,
        direction: () => direction,
        screenX: () => 200,
        screenY: () => 240,
        screenZ: () => 3,
        canMove: () => true
    };
    playerSprite._character = player;

    class SpriteActor {
        constructor(actor) {
            this._actor = actor;
            this._mainSprite = { bitmap: { isReady: () => true }, visible: true };
            this._shadowSprite = { visible: true };
            this._weaponSprite = { animationWait: () => 12 };
            this.scale = { x: 1 };
            this.parent = null;
            this.destroyed = false;
            this.updatePosition();
        }
        setHome() { this.updatePosition(); }
        startMove() {}
        startMotion(motion) { this.motion = motion; }
        update() {}
        destroy() { this.destroyed = true; }
    }

    class GameEvent {
        constructor() {
            this._mapId = 7;
            this._eventId = 3;
            this.x = eventX;
            this.y = eventY;
            this._trigger = trigger;
            this._erased = false;
            this._starting = false;
            this.originalStartCount = 0;
            this.locked = false;
        }
        initialize(mapId, eventId) {
            this._mapId = mapId;
            this._eventId = eventId;
        }
        event() {
            return { meta: eventMeta };
        }
        eventId() { return this._eventId; }
        start() { this.originalStartCount++; }
        lock() { this.locked = true; }
        unlock() { this.locked = false; }
    }

    class GamePlayer {
        canMove() { return true; }
    }
    Object.setPrototypeOf(player, GamePlayer.prototype);
    delete player.canMove;
    class GameMap {
        constructor() {
            this._events = [];
        }
        mapId() { return 7; }
        deltaX(x1, x2) { return x1 - x2; }
        deltaY(y1, y2) { return y1 - y2; }
        events() { return this._events; }
        isEventRunning() { return false; }
    }
    class GameSelfSwitches {
        value(key) { return switchValues.get(key.join(',')) || false; }
        setValue(key, value) { switchValues.set(key.join(','), value); }
    }

    const actor = {
        weaponImage: 0,
        startWeaponAnimation(id) { this.weaponImage = id; }
    };
    const tilemap = {
        addChild(sprite) {
            sprite.parent = this;
            addedSprites.push(sprite);
        },
        removeChild(sprite) { sprite.parent = null; }
    };
    const spriteset = { _tilemap: tilemap, _characterSprites: [playerSprite] };
    playerSprite._character = player;
    const gameMap = new GameMap();
    const activeEvent = new GameEvent();
    gameMap._events = [activeEvent];
    const gameSystem = { _mapTypeDayNight: { night: true } };
    const dataMap = { events: [null, null, null, { meta: eventMeta }] };
    const weapons = [null, ...Array.from({ length: 154 }, (_, index) => ({ id: index + 1 }))];
    weapons[148].name = 'カマ';
    weapons[148].wtypeId = 1;
    weapons[154].name = '鍛冶術師のハンマー';
    weapons[154].wtypeId = 18;
    const commonEvents = [null, ...Array.from({ length: 20 }, (_, index) => ({ id: index + 1 }))];
    const attackMotions = JSON.parse(fs.readFileSync(path.join(root, 'data/System.json'), 'utf8'))
        .attackMotions;

    const context = vm.createContext({
        PluginManager: {
            parameters: () => ({}),
            registerCommand(plugin, command, callback) {
                pluginCommands[`${plugin}:${command}`] = callback;
            },
            callCommand(interpreter, plugin, command, args) {
                const callback = pluginCommands[`${plugin}:${command}`];
                return callback && callback.call(interpreter, args);
            }
        },
        Game_Event: GameEvent,
        Game_Player: GamePlayer,
        Game_Map: GameMap,
        Game_SelfSwitches: GameSelfSwitches,
        Sprite_Actor: SpriteActor,
        SceneManager: { _scene: { _spriteset: spriteset } },
        $gamePlayer: player,
        $gameMap: gameMap,
        $gameSystem: gameSystem,
        $dataMap: dataMap,
        $gameParty: {
            hasItem: weapon => weapon && (weapon.id === 154 ? hasHammer : hasWeapons.includes(weapon.id)),
            leader: () => actor,
            gainItem: (item, amount) => gainedItems.push({ item, amount })
        },
        $dataWeapons: weapons,
        $dataSystem: { attackMotions },
        $dataCommonEvents: commonEvents,
        $gameSelfSwitches: new GameSelfSwitches(),
        $gameTemp: {
            requestAnimation: (events, id) => animations.push({ events, id }),
            reserveCommonEvent: id => reservedCommonEvents.push(id)
        },
        $gameMessage: { isBusy: () => false, add: message => messages.push(message) },
        SoundManager: { playBuzzer() {} }
    });
    pluginCommands['MapTypeCommonEvent:Morning'] = () => {
        gameSystem._mapTypeDayNight.night = false;
    };
    vm.runInContext(fs.readFileSync(pluginPath, 'utf8'), context, { filename: pluginPath });
    return { context, messages, animations, switchValues, addedSprites, playerSprite, player, actor,
        GameEvent, gameMap, gameSystem, dataMap, pluginCommands, gainedItems, reservedCommonEvents };
}

test('registered and enabled with the project hammer and SV defaults', () => {
    const context = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(root, 'js/plugins.js'), 'utf8'), context);
    const plugin = context.$plugins.find(entry => entry.name === 'MapRockBreaking');
    assert.ok(plugin);
    assert.equal(plugin.status, true);
    assert.equal(plugin.parameters.HammerWeaponId, '154');
    assert.equal(plugin.parameters.MaxRockLevel, undefined);
    assert.equal(plugin.parameters.RockAnimationId, undefined);
    assert.equal(plugin.parameters.PlantAnimationId, undefined);
});

test('legacy AdvanceDay command delegates to the day/night plugin', () => {
    const state = createContext();
    let delegated = false;
    state.pluginCommands['MapTypeCommonEvent:AdvanceDay'] = () => { delegated = true; };
    state.context.PluginManager.callCommand({}, 'MapRockBreaking', 'AdvanceDay', {});
    assert.equal(delegated, true);
});

test('tagged action-button rock uses the configured hammer SV motion and self switch A', () => {
    const state = createContext();
    const event = new state.GameEvent();
    event.start();

    assert.equal(event.originalStartCount, 0);
    assert.equal(event.locked, true);
    assert.equal(state.actor.weaponImage, 13);
    assert.equal(state.animations.length, 0);
    assert.equal(state.addedSprites.length, 1);
    const sprite = state.addedSprites[0];
    assert.equal(sprite.motion, 'swing');
    assert.equal(sprite.motionSpeed(), 3);
    assert.equal(sprite._weaponSprite.animationWait(), 3);
    assert.equal(state.player.canMove(), false);
    assert.equal(state.context.$gameMap.isEventRunning(), true);
    assert.equal(state.switchValues.get('7,3,A'), true);

    for (let i = 0; i < 11; i++) sprite.update();
    assert.equal(state.switchValues.get('7,3,A'), true);
    sprite.update();
    assert.equal(state.switchValues.get('7,3,A'), true);
    assert.equal(event.locked, false);
    assert.equal(state.player.canMove(), true);
    assert.equal(state.context.$gameMap.isEventRunning(), false);
    assert.equal(state.playerSprite.visible, true);
    assert.equal(sprite.destroyed, true);
});

test('plant harvesting can require no weapon and then runs the event command list', () => {
    const state = createContext({ hasHammer: false, meta: { '草木採取': true } });
    const event = new state.GameEvent();
    event.start();

    assert.equal(event.originalStartCount, 1);
    assert.equal(state.messages.length, 0);
    assert.equal(state.actor.weaponImage, 1);
    assert.equal(state.animations.length, 0);
    assert.equal(state.gainedItems.length, 0);
    const sprite = state.addedSprites[0];
    assert.equal(sprite.motion, 'swing');
    assert.equal(sprite.motionSpeed(), 3);
    for (let i = 0; i < 11; i++) sprite.update();
    assert.equal(event.originalStartCount, 1);
    sprite.update();

    assert.equal(event.originalStartCount, 1);
    assert.equal(state.gainedItems.length, 0);
    assert.equal(state.switchValues.get('7,3,A'), undefined);
});

test('harvest label tuple configures required weapon and missing-weapon common event', () => {
    const state = createContext({ hasHammer: false, meta: { '草木採取': '148,12' } });
    const event = new state.GameEvent();
    event.start();
    assert.equal(state.reservedCommonEvents[0], 12);
    assert.equal(state.messages.length, 0);
    assert.equal(state.addedSprites.length, 0);
    assert.equal(event.originalStartCount, 0);

    const hasKama = createContext({ hasHammer: false, hasWeapons: [148],
        meta: { '草木採取': '148' } });
    const harvestEvent = new hasKama.GameEvent();
    harvestEvent.start();
    assert.equal(hasKama.actor.weaponImage, 1);
    for (let i = 0; i < 12; i++) hasKama.addedSprites[0].update();
    assert.equal(harvestEvent.originalStartCount, 1);
    assert.equal(hasKama.gainedItems.length, 0);
});

test('SV pose and placement follow the relative target direction on all four axes', () => {
    const cases = [
        { direction: 4, eventX: 3, eventY: 2, expectedDirection: 6, expectedScale: -1, expectedX: 206, expectedY: 240 },
        { direction: 4, eventX: 1, eventY: 2, expectedDirection: 4, expectedScale: 1, expectedX: 194, expectedY: 240 },
        { direction: 8, eventX: 2, eventY: 1, expectedDirection: 8, expectedScale: 1, expectedX: 200, expectedY: 236 },
        { direction: 2, eventX: 2, eventY: 3, expectedDirection: 2, expectedScale: -1, expectedX: 200, expectedY: 244 }
    ];
    for (const options of cases) {
        const state = createContext(options);
        new state.GameEvent().start();
        const sprite = state.addedSprites[0];
        assert.equal(sprite._fieldDirection, options.expectedDirection);
        assert.equal(sprite.scale.x, options.expectedScale);
        sprite.updatePosition();
        assert.equal(sprite.x, options.expectedX);
        assert.equal(sprite.y, options.expectedY);
        assert.equal(sprite.motion, 'swing');
    }
});

test('rock label tuple specifies only required weapon and missing-weapon common event IDs', () => {
    const state = createContext({ hasHammer: false, meta: { '岩破壊': '148,12' } });
    const event = new state.GameEvent();
    event.start();
    assert.deepEqual(state.reservedCommonEvents, [12]);
    assert.equal(state.messages.length, 0);
    assert.equal(state.addedSprites.length, 0);
});

test('requires the configured weapon but does not apply rock-level gating', () => {
    const noHammer = createContext({ hasHammer: false });
    new noHammer.GameEvent().start();
    assert.match(noHammer.messages[0], /ハンマーが必要/);
    assert.equal(noHammer.addedSprites.length, 0);

    const anyRockLevel = createContext({ hasHammer: false, hasWeapons: [148],
        meta: { '岩破壊': '148' } });
    new anyRockLevel.GameEvent().start();
    assert.equal(anyRockLevel.messages.length, 0);
    assert.equal(anyRockLevel.addedSprites.length, 1);
});

test('only action-button events tagged as rocks are intercepted', () => {
    const touchEvent = createContext({ trigger: 1 });
    const touch = new touchEvent.GameEvent();
    touch.start();
    assert.equal(touch.originalStartCount, 1);
    assert.equal(touchEvent.addedSprites.length, 0);

    const ordinary = createContext();
    const event = new ordinary.GameEvent();
    event.event = () => ({ meta: {} });
    event.start();
    assert.equal(event.originalStartCount, 1);
});

