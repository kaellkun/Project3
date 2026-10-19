const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const pluginSource = fs.readFileSync("js/plugins/CampRest.js", "utf8");

test("CampRest is valid JavaScript and documents its plugin command", () => {
    assert.match(pluginSource, /@command StartRest/);
    assert.match(pluginSource, /PluginManager\.registerCommand\(pluginName, "StartRest"/);
    assert.match(pluginSource, /setText\("焚き火休憩では/);
});

test("CampRest records a resume checkpoint for tagged events and plugin command", () => {
    assert.match(pluginSource, /@command SetCheckpoint/);
    assert.match(pluginSource, /PluginManager\.registerCommand\(pluginName, "SetCheckpoint"/);
    assert.match(pluginSource, /<CampRestPoint>/);
    assert.match(pluginSource, /Game_Event\.prototype\.start/);
    assert.match(pluginSource, /window\.CampRestCheckpoint/);
});

test("CampRest checkpoint records on tagged event start and resumes after game over", () => {
    const recorded = [];
    const context = {
        PluginManager: { parameters: () => ({}), registerCommand() {} },
        JsonEx: { stringify: JSON.stringify, parse: JSON.parse },
        DataManager: {
            makeSaveContents: () => ({ party: { hp: 50 } }),
            extractSaveContents(contents) { recorded.push(contents); },
            setupNewGame() {},
            loadGame: () => Promise.resolve(0)
        },
        $gameSystem: { onBeforeSave() { this.prepared = true; }, onAfterLoad() { this.replayed = true; } },
        $gameMap: { mapId: () => 7 },
        $gamePlayer: {
            x: 10, y: 20,
            direction: () => 2,
            reserveTransfer(mapId, x, y, d, fade) { this.transfer = { mapId, x, y, d, fade }; },
            requestMapReload() { this.reloaded = true; }
        },
        SceneManager: { push() {}, goto(scene) { this.current = scene; } },
        Scene_Map: function Scene_Map() {},
        Scene_MenuBase: class { create() {} },
        Window_Command: class { initialize() {} },
        Rectangle: function Rectangle() {},
        Graphics: { boxWidth: 816, boxHeight: 624 },
        $gameSystemWindowPadding: null
    };
    context.Scene_Map.prototype = { start() {} };
    context.$gameSystem.windowPadding = () => 12;
    context.window = context;
    context.globalThis = context;
    context.Game_Event = function Game_Event() {};
    context.Game_Event.prototype.start = function() { this._starting = true; };
    vm.runInNewContext(pluginSource, context, { filename: "CampRest.js" });

    const checkpoint = context.CampRestCheckpoint;
    assert.equal(checkpoint.isValid(), false);

    // メモ欄タグ付きイベントは起動しただけで(選択内容に関係なく)記録される
    const tagged = new context.Game_Event();
    tagged.event = () => ({ note: "<CampRestPoint>" });
    tagged.start();
    assert.equal(checkpoint.isValid(), true);

    // タグ無しイベントでは記録されない
    checkpoint.clear();
    const untagged = new context.Game_Event();
    untagged.event = () => ({ note: "" });
    untagged.start();
    assert.equal(checkpoint.isValid(), false);

    // 再開で状態復元・記録地点への場所移動・マップ再構築が行われる
    checkpoint.save();
    assert.equal(checkpoint.resume(), true);
    assert.deepEqual(recorded, [{ party: { hp: 50 } }]);
    assert.deepEqual(context.$gamePlayer.transfer, { mapId: 7, x: 10, y: 20, d: 2, fade: 0 });
    assert.equal(context.$gamePlayer.reloaded, true);
    assert.equal(context.SceneManager.current, context.Scene_Map);

    // BGM等の復帰はマップシーン開始時まで遅延される
    assert.notEqual(context.$gameSystem.replayed, true);
    context.Scene_Map.prototype.start.call({});
    assert.equal(context.$gameSystem.replayed, true);

    // ニューゲームで記録はクリアされる
    checkpoint.save();
    context.DataManager.setupNewGame();
    assert.equal(checkpoint.isValid(), false);
});

test("CampRest registration is enabled with the project meat defaults", () => {
    const context = {};
    vm.runInNewContext(fs.readFileSync("js/plugins.js", "utf8"), context);
    const plugin = context.$plugins.find(entry => entry.name === "CampRest");
    assert.ok(plugin);
    assert.equal(plugin.status, true);
    assert.equal(plugin.parameters.MeatItemIds, "2,65,89");
    assert.equal(plugin.parameters.HpRecoveryRate, "25");
});

test("CampRest contains tagged meat support, quantity confirmation, and MP recovery", () => {
    assert.match(pluginSource, /<CampRestMeat>/);
    assert.match(pluginSource, /この数量で使う/);
    assert.match(pluginSource, /actor\.gainHp\(Math\.floor\(actor\.mhp \* hpRecoveryRate \* count\)\)/);
    assert.match(pluginSource, /actor\.setMp\(actor\.mmp\)/);
    assert.doesNotMatch(pluginSource, /\.mmp\(\)/);
});

test("CampRest finishRest restores MP through the mmp getter without throwing", () => {
    const source = pluginSource.match(/finishRest\(message\) \{([\s\S]*?)\n        \}/)[1];
    const actor = {
        _mp: 0,
        get mmp() { return 42; },
        setMp(value) { this._mp = value; },
        refresh() {},
    };
    const context = {
        $gameParty: { members: () => [actor] },
        $gameMessage: { add() {} },
        SceneManager: { pop() {} },
        message: "",
    };
    vm.runInNewContext(source, context);
    assert.equal(actor._mp, 42);
});
