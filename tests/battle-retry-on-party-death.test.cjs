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
    function Window_Command() {}
    Window_Command.prototype.setHandler = function(symbol, handler) {
        this.handlers = this.handlers || {};
        this.handlers[symbol] = handler;
    };
    Window_Command.prototype.deactivate = function() {};
    function Scene_Gameover() {}
    Scene_Gameover.prototype.create = function() {};
    Scene_Gameover.prototype.gotoTitle = function() {
        this.titled = true;
    };
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
        Scene_Battle: function Scene_Battle() {},
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
    context.Scene_Gameover.prototype.calcWindowHeight = () => 120;
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
    scene.window.handlers.beforeBattle();
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
    scene.window.handlers.gameover();

    assert.equal(scene.titled, true);
    const nextScene = new context.Scene_Gameover();
    nextScene.create();
    assert.equal(nextScene.window, undefined);
});

test('random encounter retry restores the position from before the triggering move', () => {
    const { context, extracted } = setup(true);
    const player = context.$gamePlayer;

    player.update(false);
    player.x = 3;
    player._triggerBattle = () => context.BattleManager.setup(8, true, false);
    player.executeEncounter();

    const scene = new context.Scene_Gameover();
    scene.create();
    scene.window.handlers.beforeBattle();
    scene.window.handlers.retry();

    assert.equal(extracted[0].player._x, 2);
    assert.equal(extracted[0].player._y, 4);
    assert.equal(extracted[0].player._direction, 6);
});