const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const plugin = fs.readFileSync(
    path.join(root, 'js/plugins/BattleRetryOnPartyDeath.js'),
    'utf8'
);

function setup(includePlayer = false) {
    const commands = [];
    const extracted = [];
    function Game_Player() {
        this._mapId = 1;
        this.x = 2;
        this.y = 4;
        this._direction = 6;
    }
    Game_Player.prototype.moveStraight = function() {};
    Game_Player.prototype.moveDiagonally = function() {};
    Game_Player.prototype.executeEncounter = function() {
        if (this._triggerBattle) {
            this._triggerBattle();
        }
        return true;
    };
    Game_Player.prototype.direction = function() {
        return this._direction;
    };
    Game_Player.prototype.update = function() {};
    const player = new Game_Player();
    function Window_Command(rect) {
        this.rect = rect;
        this.list = [];
        this.makeCommandList();
    }
    Window_Command.prototype.setHandler = function(symbol, handler) {
        this.handlers = this.handlers || {};
        this.handlers[symbol] = handler;
    };
    Window_Command.prototype.deactivate = function() {};
    Window_Command.prototype.addCommand = function(name, symbol) {
        this.list.push({ name, symbol });
    };
    function Scene_Gameover() {}
    Scene_Gameover.prototype.create = function() {};
    Scene_Gameover.prototype.gotoTitle = function() {
        this.titled = true;
    };
    function Scene_Map() {}
    const context = vm.createContext({
        BattleManager: {
            setup(troopId, canEscape, canLose) {
                this.setupArgs = [troopId, canEscape, canLose];
            },
            saveBgmAndBgs() {
                this.savedBgm = true;
            }
        },
        PluginManager: {
            parameters() {
                return {};
            }
        },
        DataManager: {
            makeSaveContents: () => ({
                party: { hp: 100 },
                ...(includePlayer ? {
                    player: {
                        _mapId: player._mapId,
                        _x: player.x,
                        _y: player.y,
                        _direction: player._direction
                    }
                } : {})
            }),
            extractSaveContents(contents) {
                extracted.push(contents);
            }
        },
        JsonEx: {
            stringify: JSON.stringify,
            parse: JSON.parse
        },
        Window_Command,
        Game_Player,
        $gamePlayer: player,
        $gameVariables: { value(id) { return id === 21 ? 11 : 0; } },
        $gameMap: { mapId() { return 1; } },
        Rectangle: function Rectangle(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        },
        Graphics: { boxWidth: 816, boxHeight: 624 },
        SoundManager: { playBattleStart() { commands.push('sound'); } },
        SceneManager: { goto(scene) { commands.push(scene); } },
        $gameTemp: { reserveCommonEvent(id) { this.reservedCommonEventId = id; } },
        Scene_Battle: function Scene_Battle() {},
        Scene_Map,
        Scene_Gameover
    });
    context.Window_Command.prototype = {
        initialize() {},
        setHandler(symbol, handler) {
            this.handlers = this.handlers || {};
            this.handlers[symbol] = handler;
        },
        deactivate() {},
        addCommand(name, symbol) {
            this.list = this.list || [];
            this.list.push({ name, symbol });
        }
    };
    context.Window_Command.prototype.constructor = Window_Command;
    context.Scene_Gameover.prototype.calcWindowHeight = lines => lines * 48;
    context.Scene_Gameover.prototype.createWindowLayer = function() {};
    context.Scene_Gameover.prototype.addWindow = function(window) {
        this.window = window;
    };
    vm.runInContext(plugin, context, { filename: 'BattleRetryOnPartyDeath.js' });
    return { context, commands, extracted };
}

test('captures the pre-battle state and restores it for retry', () => {
    const { context, commands, extracted } = setup();
    context.BattleManager.setup(7, true, false);

    const scene = new context.Scene_Gameover();
    scene.create();
    scene.window.handlers.retry();

    assert.deepEqual(extracted, [{ party: { hp: 100 } }]);
    assert.deepEqual(context.BattleManager.setupArgs, [7, true, false]);
    assert.equal(context.BattleManager.savedBgm, true);
    assert.equal(commands.at(-1), context.Scene_Battle);
});

test('game over clears the retry state and goes to the title', () => {
    const { context } = setup();
    context.BattleManager.setup(3, false, false);
    const scene = new context.Scene_Gameover();
    scene.create();
    scene.window.handlers.title();

    assert.equal(scene.titled, true);
    const nextScene = new context.Scene_Gameover();
    nextScene.create();
    assert.equal(nextScene.window, undefined);
});

test('game over shows exactly three direct choices', () => {
    const { context } = setup();
    context.BattleManager.setup(3, false, false);
    const scene = new context.Scene_Gameover();
    scene.create();

    assert.deepEqual(scene.window.list.map(command => command.name), [
        'リトライ', '宿屋に戻る', 'タイトルに戻る'
    ]);
    assert.equal(scene.window.maxCols(), 3);
    assert.equal(scene.window.list.length, scene.window.maxCols());
    assert.equal(scene.window.rect.width, 768);
    assert.equal(scene.window.rect.x, 24);
    assert.equal(scene.window.rect.height, 48);
});

test('returning to the inn restores the pre-battle state and starts the inn event', () => {
    const { context, commands, extracted } = setup();
    context.BattleManager.setup(3, false, false);
    const scene = new context.Scene_Gameover();
    scene.create();
    scene.window.handlers.inn();

    assert.deepEqual(extracted, [{ party: { hp: 100 } }]);
    assert.equal(context.$gameTemp.reservedCommonEventId, 5);
    assert.equal(commands.at(-1), context.Scene_Map);
});

test('hides the inn choice when only an unrelated variable has a value', () => {
    const { context } = setup();
    context.$gameVariables.value = id => id === 20 ? 11 : 0;
    context.BattleManager.setup(3, false, false);
    const scene = new context.Scene_Gameover();
    scene.create();

    assert.deepEqual(scene.window.list.map(command => command.name), [
        'リトライ', 'タイトルに戻る'
    ]);
    assert.equal(scene.window.maxCols(), 2);
    assert.equal(scene.window.list.length, scene.window.maxCols());
    assert.equal(scene.window.rect.height, 48);
});