const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const pluginSource = fs.readFileSync("js/plugins/BattleRetryOnPartyDeath.js", "utf8");

function buildContext(parameters = {}) {
    const destinations = [];
    const extracted = [];

    function Rectangle(x, y, width, height) {
        Object.assign(this, { x, y, width, height });
    }
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
    function Scene_Base() {}
    Scene_Base.prototype.calcWindowHeight = function(lines) { return lines * 36; };
    Scene_Base.prototype.createWindowLayer = function() {};
    Scene_Base.prototype.addWindow = function(window) { this._window = window; };
    Scene_Base.prototype.update = function() { this._baseUpdateCalled = true; };
    function Scene_Gameover() {}
    Scene_Gameover.prototype = Object.create(Scene_Base.prototype);
    Scene_Gameover.prototype.constructor = Scene_Gameover;
    Scene_Gameover.prototype.create = function() {};
    Scene_Gameover.prototype.update = function() { this._defaultUpdateCalled = true; };
    Scene_Gameover.prototype.gotoTitle = function() { destinations.push("title"); };
    function Scene_Map() {}
    function Scene_Battle() {}

    const context = {
        Rectangle,
        Window_Command,
        Scene_Base,
        Scene_Gameover,
        Scene_Map,
        Scene_Battle,
        Graphics: { boxWidth: 816, boxHeight: 624 },
        PluginManager: { parameters: () => ({ innCommonEventId: "5", ...parameters }) },
        BattleManager: {
            setup(...args) { this.setupArgs = args; },
            processVictory() {},
            processEscape() { this._escaped = false; },
            saveBgmAndBgs() { this.savedBgm = true; }
        },
        JsonEx: { stringify: JSON.stringify, parse: JSON.parse },
        DataManager: {
            makeSaveContents: () => ({ dummy: true }),
            extractSaveContents(contents) { extracted.push(contents); }
        },
        SoundManager: { playBattleStart() {} },
        SceneManager: { goto(sceneClass) { destinations.push(sceneClass); } },
        $gameTemp: { reserveCommonEvent(id) { this.reservedCommonEventId = id; } }
        ,$gameVariables: { value(id) { return id === 21 ? 11 : 0; } }
    };
    vm.runInNewContext(pluginSource, context);
    return { context, destinations, extracted };
}

test("plugin metadata and registration expose the inn common event", () => {
    assert.match(pluginSource, /@param innCommonEventId/);
    const registration = {};
    vm.runInNewContext(fs.readFileSync("js/plugins.js", "utf8"), registration);
    const plugin = registration.$plugins.find(entry => entry.name === "BattleRetryOnPartyDeath");
    assert.ok(plugin);
    assert.equal(plugin.status, true);
    assert.deepEqual({ ...plugin.parameters }, { innCommonEventId: "5" });
});

test("game over shows exactly the three requested choices without intermediate menus", () => {
    const { context } = buildContext();
    context.BattleManager.setup(7, false, false);
    const scene = new context.Scene_Gameover();
    scene.create();

    assert.deepEqual(
        scene._window._commands.map(command => command.name),
        ["リトライ", "宿屋に戻る", "タイトルに戻る"]
    );
    assert.deepEqual(
        scene._window._commands.map(command => command.symbol),
        ["retry", "inn", "title"]
    );
    assert.equal(scene._window.maxCols(), 3);
    assert.equal(scene._window._commands.length, scene._window.maxCols());
    assert.equal(scene._window.rect.width, 768);
    assert.equal(scene._window.rect.x, 24);
    assert.equal(scene._window.rect.height, 36);
});

test("retry restores the pre-battle save and restarts the same troop", () => {
    const { context, destinations, extracted } = buildContext();
    context.BattleManager.setup(12, true, false);
    const scene = new context.Scene_Gameover();
    scene.create();
    scene._window._handlers.retry();

    assert.deepEqual(extracted, [{ dummy: true }]);
    assert.deepEqual(context.BattleManager.setupArgs, [12, true, false]);
    assert.equal(context.BattleManager.savedBgm, true);
    assert.equal(destinations.at(-1), context.Scene_Battle);
});

test("inn choice restores state and reserves the configured common event", () => {
    const { context, destinations, extracted } = buildContext({ innCommonEventId: "8" });
    context.BattleManager.setup(4, false, false);
    const scene = new context.Scene_Gameover();
    scene.create();
    scene._window._handlers.inn();

    assert.deepEqual(extracted, [{ dummy: true }]);
    assert.equal(context.$gameTemp.reservedCommonEventId, 8);
    assert.equal(destinations.at(-1), context.Scene_Map);
});

test("inn choice is hidden when only an unrelated variable has a value", () => {
    const { context } = buildContext();
    context.$gameVariables.value = id => id === 20 ? 11 : 0;
    context.BattleManager.setup(4, false, false);
    const scene = new context.Scene_Gameover();
    scene.create();

    assert.deepEqual(
        scene._window._commands.map(command => command.symbol),
        ["retry", "title"]
    );
    assert.equal(scene._window.maxCols(), 2);
    assert.equal(scene._window._commands.length, scene._window.maxCols());
    assert.equal(scene._window.rect.height, 36);
});

test("title choice clears retry state and returns to the title", () => {
    const { context, destinations } = buildContext();
    context.BattleManager.setup(3, false, false);
    const scene = new context.Scene_Gameover();
    scene.create();
    scene._window._handlers.title();

    assert.equal(destinations.at(-1), "title");
    const laterScene = new context.Scene_Gameover();
    laterScene.create();
    assert.equal(laterScene._window, undefined);
});

test("a failed escape preserves the retry choice", () => {
    const { context } = buildContext();
    context.BattleManager.setup(6, true, false);
    context.BattleManager.processEscape();

    const scene = new context.Scene_Gameover();
    scene.create();
    assert.ok(scene._window);
    assert.deepEqual(
        scene._window._commands.map(command => command.symbol),
        ["retry", "inn", "title"]
    );
});
