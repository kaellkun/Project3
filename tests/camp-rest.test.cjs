const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const pluginSource = fs.readFileSync("js/plugins/CampRest.js", "utf8");

test("CampRest is valid JavaScript and documents its plugin command", () => {
    assert.match(pluginSource, /@command StartRest/);
    assert.match(pluginSource, /PluginManager\.registerCommand\(pluginName, "StartRest"/);
    assert.match(pluginSource, /setText\(`焚き火休憩では/);
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

test("Goblin drops hard monster meat with a lower campfire recovery rate", () => {
    const items = JSON.parse(fs.readFileSync("data/Items.json", "utf8"));
    const enemies = JSON.parse(fs.readFileSync("data/Enemies.json", "utf8"));

    assert.equal(items[2].name, "良質な魔物の肉");
    assert.match(items[2].note, /<CampRestHpRate:25>/);
    assert.equal(items[89].name, "硬めの魔物の肉");
    assert.match(items[89].note, /<CampRestHpRate:10>/);
    assert.ok(enemies[2].dropItems.some(drop => drop.kind === 1 && drop.dataId === 89));
    assert.ok(!enemies[2].dropItems.some(drop => drop.kind === 1 && drop.dataId === 2));
});

test("CampRest contains tagged meat support, quantity confirmation, and MP recovery", () => {
    assert.match(pluginSource, /<CampRestMeat>/);
    assert.match(pluginSource, /この内容で休憩する/);
    assert.match(pluginSource, /actor\.gainHp\(Math\.floor\(actor\.mhp \* rate \/ 100\)\)/);
    assert.match(pluginSource, /actor\.setMp\(actor\.mmp\)/);
    assert.doesNotMatch(pluginSource, /\.mmp\(\)/);
});

test("CampRest finishRest restores MP through the mmp getter without throwing", () => {
    const source = pluginSource.match(/finishRest\(\) \{([\s\S]*?)\n        \}/)[1];
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

function createRestScene(parameters = {}) {
    class WindowCommand {
        constructor(...args) { this.initialize(...args); }
        initialize(rect) {
            this.handlers = {};
            this._index = 0;
            this.move(rect.x, rect.y, rect.width, rect.height);
            this.refresh();
        }
        move(x, y, width, height) {
            assert.ok([x, y, width, height].every(Number.isFinite));
            Object.assign(this, { x, y, width, height });
        }
        itemHeight() { return 36; }
        fittingHeight(rows) { return rows * this.itemHeight() + 24; }
        refresh() { this._list = []; this.makeCommandList(); }
        addCommand(name, symbol, enabled = true, ext = null) {
            this._list.push({ name, symbol, enabled, ext });
        }
        setHandler(symbol, handler) { this.handlers[symbol] = handler; }
        select(index) { this._index = index; }
        selectExt(ext) { this.select(this._list.findIndex(entry => entry.ext === ext)); }
        currentExt() { return this._list[this._index]?.ext; }
        show() { this.visible = true; }
        hide() { this.visible = false; }
        activate() { this.active = true; }
        deactivate() { this.active = false; }
        choose(symbol, ext) {
            const index = this._list.findIndex(entry =>
                entry.symbol === symbol && (ext === undefined || entry.ext === ext));
            assert.ok(index >= 0);
            assert.equal(this._list[index].enabled, true);
            this.select(index);
            this.deactivate();
            this.handlers[symbol]();
        }
    }
    const items = [
        { id: 2, name: "魔物の肉", note: "" },
        { id: 65, name: "上質な魔物肉", note: "" },
        { id: 89, name: "魔物の肉", note: "" },
        { id: 100, name: "追加食材", note: "<CampRestMeat>" },
        { id: 101, name: "対象外", note: "" }
    ];
    for (const item of items) item.effects = [];
    const inventory = new Map(items.map(item => [item, 3]));
    const actors = [true, true, false].map(alive => ({
        hp: alive ? 10 : 0, mhp: 101, mp: 0, mmp: 42,
        states: new Set(alive ? [5, 11] : [1, 5, 11]),
        isAlive: () => alive,
        gainHp(value) { this.hp = Math.min(this.mhp, this.hp + value); },
        setMp(value) { this.mp = value; },
        removeState(id) { this.states.delete(id); },
        refresh() {}
    }));
    let popped = 0;
    let buzzers = 0;
    const context = {
        PluginManager: { parameters: () => parameters, registerCommand() {} },
        Scene_Map: function() {},
        Game_Event: function() {},
        DataManager: { setupNewGame() {}, loadGame: () => Promise.resolve(0) },
        Window_Command: WindowCommand,
        Scene_MenuBase: class {
            create() {}
            createHelpWindow() {
                this._helpWindow = { height: 144, setText(text) { this.text = text; } };
            }
            addWindow() {}
            popScene() { context.SceneManager.pop(); }
        },
        SceneManager: { pop() { popped++; } },
        SoundManager: { playBuzzer() { buzzers++; } },
        Game_Action: class {
            static EFFECT_REMOVE_STATE = 22;
            makeSuccess() {}
        },
        $dataStates: Array.from({ length: 12 }, (_, id) => ({ name: `状態${id}` })),
        $gameSystem: { windowPadding: () => 12 },
        $gameParty: {
            allItems: () => items.filter(item => inventory.get(item) > 0),
            numItems: item => inventory.get(item) || 0,
            loseItem(item, count) { inventory.set(item, inventory.get(item) - count); },
            members: () => actors,
            leader: () => actors[0]
        },
        $dataItems: [null, items[0]],
        Graphics: { boxWidth: 816, boxHeight: 624 },
        Rectangle: class {
            constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); }
        }
    };
    context.Scene_Map.prototype.start = function() {};
    context.Game_Event.prototype.start = function() {};
    context.window = context;
    const engine = fs.readFileSync("js/rmmz_objects.js", "utf8");
    const removeState = engine.match(/Game_Action\.prototype\.itemEffectRemoveState = function\(target, effect\) \{[\s\S]*?\n\};/)[0];
    vm.runInNewContext(removeState, context);
    vm.runInNewContext(pluginSource, context);
    const scene = new context.Scene_CampRest();
    scene.create();
    function selectQuantity(item, count) {
        scene._itemWindow.choose("item", item);
        scene._quantityWindow.choose("quantity", count);
    }
    return {
        scene, items, inventory, actors, selectQuantity,
        get popped() { return popped; },
        get buzzers() { return buzzers; }
    };
}

test("CampRest selects multiple foods, reviews them, and applies one combined recovery immediately", () => {
    const h = createRestScene();
    const { scene, items, inventory, actors, selectQuantity } = h;
    scene._mainWindow.choose("meat");
    assert.equal(scene._itemWindow._list.length, 5);
    assert.equal(scene._itemWindow._list.at(-1).enabled, false);
    selectQuantity(items[0], 1);
    selectQuantity(items[1], 2);
    assert.match(scene._helpWindow.text, /合計3個.*75%/);
    assert.equal(inventory.get(items[0]), 3);
    scene._itemWindow.choose("finish");
    scene._confirmWindow.choose("no");
    assert.match(scene._itemWindow._list[1].name, /2\/3個/);
    scene._itemWindow.choose("finish");
    scene._confirmWindow.choose("yes");
    assert.equal(inventory.get(items[0]), 2);
    assert.equal(inventory.get(items[1]), 1);
    assert.equal(actors[0].hp, 85);
    assert.equal(actors[1].hp, 85);
    assert.equal(actors[2].hp, 0);
    assert.ok(actors.every(actor => actor.mp === 42));
    assert.equal(h.popped, 1);
});

test("CampRest can edit quantities, remove foods, cancel, or rest without consuming selections", () => {
    const h = createRestScene();
    const { scene, items, inventory, actors, selectQuantity } = h;
    scene._mainWindow.choose("meat");
    selectQuantity(items[0], 2);
    scene._itemWindow.choose("item", items[0]);
    assert.equal(scene._quantityWindow.currentExt(), 2);
    scene._quantityWindow.choose("quantity", 0);
    assert.equal(scene._itemWindow._list.at(-1).enabled, false);
    selectQuantity(items[3], 1);
    scene._itemWindow.handlers.cancel();
    scene._mainWindow.choose("cancel");
    assert.ok(actors.every(actor => actor.mp === 0));
    assert.ok([...inventory.values()].every(count => count === 3));
    scene.onRest();
    assert.ok(actors.every(actor => actor.mp === 42));
    assert.equal(actors[0].hp, 10);
    assert.ok([...inventory.values()].every(count => count === 3));
});

test("CampRest validates all stock before consumption and allows correcting shortages", () => {
    const h = createRestScene();
    const { scene, items, inventory, actors, selectQuantity } = h;
    scene._mainWindow.choose("meat");
    selectQuantity(items[0], 2);
    selectQuantity(items[1], 3);
    scene._itemWindow.choose("finish");
    inventory.set(items[1], 1);
    scene._confirmWindow.choose("yes");
    assert.equal(inventory.get(items[0]), 3);
    assert.equal(h.popped, 0);
    assert.equal(h.buzzers, 1);
    assert.match(scene._helpWindow.text, /所持数が足りません/);
    assert.ok(actors.every(actor => actor.mp === 0));
    scene._confirmWindow.choose("no");
    selectQuantity(items[1], 1);
    scene._itemWindow.choose("finish");
    scene._confirmWindow.choose("yes");
    assert.equal(h.popped, 1);
});

test("CampRest uses configured rates, caps HP, and supports empty inventory", () => {
    const h = createRestScene({ HpRecoveryRate: "40" });
    h.scene._mainWindow.choose("meat");
    h.selectQuantity(h.items[2], 3);
    assert.match(h.scene._helpWindow.text, /100%/);
    h.scene._itemWindow.choose("finish");
    h.scene._confirmWindow.choose("yes");
    assert.equal(h.actors[0].hp, 101);
    const empty = createRestScene();
    empty.inventory.clear();
    empty.scene.showMainWindow();
    assert.equal(empty.scene._mainWindow._list[0].enabled, false);
    empty.scene._mainWindow.choose("rest");
    assert.equal(empty.popped, 1);
});

test("CampRest completion has no message, wait, or additional audio playback", () => {
    assert.doesNotMatch(pluginSource, /\$gameMessage|AudioManager|\.wait\(|setTimeout|startFade/);
});

test("CampRest combines item-specific HP tags and displays the same recovery", () => {
    const h = createRestScene({ HpRecoveryRate: "90" });
    h.items[0].note = "<CampRestHpRate:10>";
    h.items[1].note = "<CampRestHpRate:25>";
    h.scene._mainWindow.choose("meat");
    h.selectQuantity(h.items[0], 2);
    assert.match(h.scene._quantityWindow._list[2].name, /HP回復 20%/);
    h.selectQuantity(h.items[1], 1);
    assert.match(h.scene._helpWindow.text, /合計3個.*45%/);
    h.scene._itemWindow.choose("finish");
    h.scene._confirmWindow.choose("yes");
    assert.equal(h.actors[0].hp, 55);
    assert.equal(h.actors[1].hp, 55);
    assert.equal(h.inventory.get(h.items[0]), 1);
});

test("CampRest HP tags register foods and support decimal and zero rates", () => {
    const h = createRestScene();
    h.items[4].note = "<campresthprate: 12.5>";
    h.items[0].note = "<CampRestHpRate:0>";
    h.scene._mainWindow.choose("meat");
    assert.equal(h.scene._itemWindow._list.length, 6);
    h.selectQuantity(h.items[4], 1);
    h.selectQuantity(h.items[0], 3);
    assert.match(h.scene._helpWindow.text, /12\.5%/);
    h.scene._itemWindow.choose("finish");
    h.scene._confirmWindow.choose("yes");
    assert.equal(h.actors[0].hp, 22);
});

test("CampRest does not lose one HP to fractional rate summation", () => {
    const h = createRestScene();
    h.items[0].note = "<CampRestHpRate:10>";
    h.items[1].note = "<CampRestHpRate:70>";
    h.actors[0].mhp = 100;
    h.scene._mainWindow.choose("meat");
    h.selectQuantity(h.items[0], 1);
    h.selectQuantity(h.items[1], 1);
    h.scene._itemWindow.choose("finish");
    h.scene._confirmWindow.choose("yes");
    assert.equal(h.actors[0].hp, 90);
});

test("CampRest food removes configured states party-wide without applying other item effects or reviving", () => {
    const h = createRestScene();
    const food = h.items[4];
    food.note = "<CampRestHpRate:0>";
    food.scope = 7;
    food.effects = [
        { code: 22, dataId: 5, value1: 1 },
        { code: 22, dataId: 11, value1: 1 },
        { code: 22, dataId: 1, value1: 1 },
        { code: 21, dataId: 8, value1: 1 },
        { code: 44, dataId: 51 }
    ];
    const original = JSON.stringify(food);
    h.scene._mainWindow.choose("meat");
    h.selectQuantity(food, 1);
    assert.match(h.scene._helpWindow.text, /HP回復 0%.*解除: 状態5・状態11/);
    assert.ok(h.actors[0].states.has(5));
    h.scene._itemWindow.choose("finish");
    h.scene._confirmWindow.choose("yes");
    assert.equal(h.actors[0].states.size, 0);
    assert.equal(h.actors[1].states.size, 0);
    assert.ok(h.actors[2].states.has(1));
    assert.ok(h.actors[2].states.has(5));
    assert.equal(h.actors[0].hp, 10);
    assert.equal(h.actors[2].hp, 0);
    assert.equal(h.inventory.get(food), 2);
    assert.equal(JSON.stringify(food), original);
});

test("CampRest preserves removal probability and repeats each effect for every consumed food", () => {
    const h = createRestScene();
    const food = h.items[0];
    food.note = "<CampRestHpRate:10>";
    let attempts = 0;
    food.effects = [
        { code: 22, dataId: 5, get value1() { attempts++; return 0; } },
        { code: 22, dataId: 11, value1: 1 }
    ];
    h.scene._mainWindow.choose("meat");
    h.selectQuantity(food, 2);
    h.scene._itemWindow.choose("finish");
    h.scene._confirmWindow.choose("yes");
    assert.equal(attempts, 4);
    assert.ok(h.actors[0].states.has(5));
    assert.ok(!h.actors[0].states.has(11));
    assert.equal(h.actors[0].hp, 30);
});

test("CampRest rejects invalid HP tags before consuming inventory", () => {
    for (const value of ["", "abc", "-1", "101", "Infinity"]) {
        const h = createRestScene();
        h.items[0].note = `<CampRestHpRate:${value}>`;
        h.scene._mainWindow.choose("meat");
        assert.throws(() => h.scene._itemWindow.choose("item", h.items[0]), /0～100/);
        assert.equal(h.inventory.get(h.items[0]), 3);
        assert.equal(h.popped, 0);
    }
});

test("project foods have explicit HP tags and antidotes retain their single-target effects", () => {
    const items = JSON.parse(fs.readFileSync("data/Items.json", "utf8"));
    for (const id of [2, 65]) assert.match(items[id].note, /<CampRestHpRate:25>/);
    assert.match(items[89].note, /<CampRestHpRate:10>/);
    for (const [id, stateId] of [[9, 11], [78, 5]]) {
        assert.match(items[id].note, /<CampRestHpRate:0>/);
        assert.equal(items[id].scope, 7);
        assert.deepEqual(items[id].effects, [{ code: 22, dataId: stateId, value1: 1, value2: 0 }]);
    }
    assert.doesNotMatch(items[104].note, /CampRest/);
});
