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

function setup() {
    const commands = [];
    const extracted = [];
    function Window_Command() {}
    Window_Command.prototype.setHandler = function(symbol, handler) {
        this.handlers = this.handlers || {};
        this.handlers[symbol] = handler;
    };
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
        DataManager: {
            makeSaveContents: () => ({ party: { hp: 100 } }),
            extractSaveContents(contents) {
                extracted.push(contents);
            }
        },
        JsonEx: {
            stringify: JSON.stringify,
            parse: JSON.parse
        },
        Window_Command,
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
        addCommand(name, symbol) {
            this.list = this.list || [];
            this.list.push({ name, symbol });
        }
    };
    context.Window_Command.prototype.constructor = Window_Command;
    context.Scene_Gameover.prototype.calcWindowHeight = () => 120;
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
    scene.window.handlers.gameover();

    assert.equal(scene.titled, true);
    const nextScene = new context.Scene_Gameover();
    nextScene.create();
    assert.equal(nextScene.window, undefined);
});