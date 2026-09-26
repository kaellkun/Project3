const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const pluginSource = fs.readFileSync("js/plugins/BattleRetryOnPartyDeath.js", "utf8");

function Rectangle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

function makeWindowCommandClass() {
    function Window_Command(rect) {
        this.rect = rect;
        this._commands = [];
        this._handlers = {};
        this.makeCommandList();
    }
    Window_Command.prototype.addCommand = function(name, symbol) {
        this._commands.push({ name, symbol });
    };
    Window_Command.prototype.setHandler = function(symbol, handler) {
        this._handlers[symbol] = handler;
    };
    Window_Command.prototype.deactivate = function() {};
    Window_Command.prototype.close = function() {};
    return Window_Command;
}

function makeWindowHelpClass() {
    function Window_Help(rect) {
        this.rect = rect;
    }
    Window_Help.prototype.setText = function(text) {
        this.text = text;
    };
    Window_Help.prototype.close = function() {};
    return Window_Help;
}

function makeSceneClasses() {
    function Scene_Base() {}
    Scene_Base.prototype.calcWindowHeight = function(numLines, selectable) {
        return numLines * 36 + (selectable ? 8 : 0);
    };
    Scene_Base.prototype.createWindowLayer = function() {};
    Scene_Base.prototype.addWindow = function(w) {
        (this._windows = this._windows || []).push(w);
    };
    Scene_Base.prototype.update = function() {
        this._baseUpdateCalled = true;
    };

    function Scene_Gameover() {}
    Scene_Gameover.prototype = Object.create(Scene_Base.prototype);
    Scene_Gameover.prototype.constructor = Scene_Gameover;
    Scene_Gameover.prototype.create = function() {};
    Scene_Gameover.prototype.update = function() {
        this._defaultUpdateCalled = true;
    };
    Scene_Gameover.prototype.gotoTitle = function() {
        this._wentToTitle = true;
    };

    function Scene_Message() {}
    Scene_Message.prototype.createAllWindows = function() {
        this._messageWindowsCreated = true;
    };

    return { Scene_Base, Scene_Gameover, Scene_Message };
}

function makeGameInterpreterClass() {
    function Game_Interpreter() {
        this._running = true;
    }
    Game_Interpreter.prototype.setup = function(list, eventId) {
        this.setupArgs = [list, eventId];
    };
    Game_Interpreter.prototype.update = function() {
        this._updated = true;
    };
    Game_Interpreter.prototype.isRunning = function() {
        return this._running;
    };
    return Game_Interpreter;
}

function buildContext(parameterOverrides) {
    const { Scene_Base, Scene_Gameover, Scene_Message } = makeSceneClasses();
    function Scene_Map() {}
    function Game_Player() {}
    Game_Player.prototype.moveStraight = function() {};
    Game_Player.prototype.moveDiagonally = function() {};
    Game_Player.prototype.executeEncounter = function() {
        return false;
    };
    const context = {
        Rectangle,
        Window_Command: makeWindowCommandClass(),
        Window_Help: makeWindowHelpClass(),
        Scene_Base,
        Scene_Gameover,
        Scene_Message,
        Scene_Map,
        Game_Player,
        $gameMap: { mapId() { return 1; } },
        Game_Interpreter: makeGameInterpreterClass(),
        Graphics: { boxWidth: 816, boxHeight: 624 },
        PluginManager: {
            parameters: () => Object.assign({
                askCommonEventId: "0",
                troopVariableId: "0",
                innCommonEventId: "0",
                askStrategyText: "攻略法を聞きますか？",
                askYesText: "聞く",
                askNoText: "聞かない"
            }, parameterOverrides)
        },
        BattleManager: {
            setup() {},
            processVictory() {},
            processEscape() {},
            saveBgmAndBgs() {}
        },
        JsonEx: {
            stringify: value => JSON.stringify(value),
            parse: value => JSON.parse(value)
        },
        DataManager: {
            makeSaveContents: () => ({ dummy: true }),
            extractSaveContents() {}
        },
        SoundManager: { playBattleStart() {} },
        SceneManager: {
            goto(sceneClass) {
                this.lastScene = sceneClass;
            }
        },
        $dataCommonEvents: { 5: { list: ["dummyCommand"] } },
        $gameTemp: {
            reservedCommonEventId: 0,
            reserveCommonEvent(id) {
                this.reservedCommonEventId = id;
            }
        },
        $gameVariables: {
            values: {},
            setValue(id, value) {
                this.values[id] = value;
            }
        }
    };
    vm.runInNewContext(pluginSource, context);
    return context;
}


test("BattleRetryOnPartyDeath is valid JavaScript and documents the strategy prompt", () => {
    assert.match(pluginSource, /@param askCommonEventId/);
    assert.match(pluginSource, /@param troopVariableId/);
    assert.match(pluginSource, /@param innCommonEventId/);
    assert.match(pluginSource, /攻略法を聞きますか？/);
});

test("BattleRetryOnPartyDeath registration exposes the new parameters", () => {
    const context = {};
    vm.runInNewContext(fs.readFileSync("js/plugins.js", "utf8"), context);
    const plugin = context.$plugins.find(entry => entry.name === "BattleRetryOnPartyDeath");
    assert.ok(plugin);
    assert.equal(plugin.status, true);
    assert.equal(plugin.parameters.askCommonEventId, "0");
    assert.equal(plugin.parameters.troopVariableId, "0");
    assert.equal(plugin.parameters.innCommonEventId, "0");
});

test("Without configured strategy or inn events, defeat shows the two top-level choices", () => {
    const context = buildContext({});
    context.BattleManager.setup(7, false, false);

    const scene = Object.create(context.Scene_Gameover.prototype);
    scene.create();

    assert.ok(scene._battleRetryWindow);
    assert.ok(!scene._battleRetryAskWindow);
    assert.deepEqual(
        scene._battleRetryWindow._commands.map(c => c.symbol),
        ["beforeBattle", "gameover"]
    );
});

test("With a configured common event, defeat first asks whether to hear the strategy", () => {
    const context = buildContext({ askCommonEventId: "5", troopVariableId: "3" });
    context.BattleManager.setup(9, false, false);

    const scene = Object.create(context.Scene_Gameover.prototype);
    scene.create();

    assert.ok(scene._battleRetryAskWindow);
    assert.equal(scene._battleRetryAskHelpWindow.text, "攻略法を聞きますか？");
    assert.deepEqual(
        scene._battleRetryAskWindow._commands.map(c => c.symbol),
        ["yes", "no"]
    );

    scene._battleRetryAskWindow._handlers.yes();

    assert.equal(context.$gameVariables.values[3], 9);
    assert.ok(scene._messageWindowsCreated);
    assert.ok(scene._battleRetryInterpreter);
    assert.deepEqual(scene._battleRetryInterpreter.setupArgs, [["dummyCommand"], 0]);
    assert.ok(!scene._battleRetryWindow);

    scene.update();
    assert.ok(scene._battleRetryInterpreter._updated);
    assert.ok(scene._battleRetryWindow === undefined);

    scene._battleRetryInterpreter._running = false;
    scene.update();
    assert.equal(scene._battleRetryInterpreter, null);
    assert.ok(scene._battleRetryWindow);
});

test("Choosing not to hear the strategy skips the common event entirely", () => {
    const context = buildContext({ askCommonEventId: "5", troopVariableId: "3" });
    context.BattleManager.setup(2, false, false);

    const scene = Object.create(context.Scene_Gameover.prototype);
    scene.create();

    scene._battleRetryAskWindow._handlers.no();

    assert.ok(!scene._battleRetryInterpreter);
    assert.ok(scene._battleRetryWindow);
    assert.equal(context.$gameVariables.values[3], undefined);
});

test("The second level offers retry, inn, and return-before-battle", () => {
    const context = buildContext({ innCommonEventId: "5" });
    context.BattleManager.setup(12, false, false);

    const scene = Object.create(context.Scene_Gameover.prototype);
    scene.create();
    scene._battleRetryWindow._handlers.beforeBattle();

    assert.deepEqual(
        scene._battleRetrySubWindow._commands.map(command => command.symbol),
        ["retry", "inn", "beforeMap"]
    );
});

test("Choosing inn restores the pre-battle state, reserves the common event, and returns to the map", () => {
    const context = buildContext({ innCommonEventId: "5" });
    context.BattleManager.setup(13, false, false);

    const scene = Object.create(context.Scene_Gameover.prototype);
    scene.create();
    scene._battleRetryWindow._handlers.beforeBattle();
    scene._battleRetrySubWindow._handlers.inn();

    assert.equal(context.$gameTemp.reservedCommonEventId, 5);
    assert.equal(context.SceneManager.lastScene, context.Scene_Map);
});
