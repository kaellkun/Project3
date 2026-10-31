const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createContext(beforePlugin = () => {}, pluginParameters = {}) {
    class Game_System {
        initMembers() {}
    }

    class Game_Temp {
        constructor() {
            this._commonEventQueue = [];
        }

        reserveCommonEvent(commonEventId) {
            this._commonEventQueue.push(commonEventId);
        }
    }

    class Game_Interpreter {
        setupReservedCommonEvent() {}

        command117() {}

        command201() {}
    }

    class Game_Event {
        constructor(eventId, note = "", list = [{ code: 117 }, { code: 0 }], trigger = 0) {
            this._eventId = eventId;
            this._data = { note };
            this._list = list;
            this._page = { trigger, list };
            events[eventId] = this;
        }

        event() { return this._data; }
        eventId() { return this._eventId; }
        list() { return this._list; }
        page() { return this._page; }
        start() {
            if (this.list() && this.list().length > 1) this._starting = true;
        }
    }

    class Window_Command {
        constructor(...args) {
            this.initialize(...args);
        }

        initialize(rect) {
            this.rect = rect;
            this.refresh();
        }

        refresh() {
            this._list = [];
            this.makeCommandList();
        }

        addCommand(name, symbol, enabled = true, ext = null) {
            this._list.push({ name, symbol, enabled, ext });
        }

        setHandler(symbol, handler) {
            this._handlers = this._handlers || {};
            this._handlers[symbol] = handler;
        }

        activate() { this.active = true; }
        deactivate() { this.active = false; }
        show() { this.visible = true; }
        hide() { this.visible = false; }
        select(index) { this._index = index; }
        currentExt() { return this._list[this._index].ext; }
    }
    class Scene_MenuBase {
        create() {}

        createHelpWindow() {
            this._helpWindow = { setText() {} };
        }

        mainAreaTop() {
            return 72;
        }

        mainAreaHeight() {
            return 432;
        }

        addWindow(window) {
            this.addedWindow = window;
        }

        popScene() {}
    }
    class Scene_Item {
        useItem() {}

        item() {
            return { id: 6, note: "" };
        }
    }

    class Rectangle {
        constructor(x, y, width, height) {
            Object.assign(this, { x, y, width, height });
        }
    }

    const events = {};
    const context = {
        Game_System,
        Game_Temp,
        Game_Interpreter,
        Game_Event,
        Window_Command,
        Scene_MenuBase,
        Scene_Item,
        Rectangle,
        Graphics: { boxWidth: 816 },
        PluginManager: {
            parameters() {
                return {
                    FastTravelItemIds: "6,56",
                    CampfireCommonEventId: "4",
                    InnCommonEventId: "3",
                    Categories: "[]",
                    ...pluginParameters
                };
            }
        },
        $gameMap: { mapId: () => 12, event: id => events[id] },
        $gamePlayer: { x: 7, y: 9 },
        $dataMapInfos: { 12: { name: "森" } },
        $gameVariables: { value: id => ({ 4: 31, 5: 8, 6: 14 })[id] || 0 },
        $gameParty: {},
        SceneManager: {
            push(sceneClass) {
                this.pushedScene = sceneClass;
            }
        },
        Scene_Map: function() {}
    };
    context.$gameSystem = new Game_System();
    context.$gameTemp = new Game_Temp();
    beforePlugin(context);
    vm.runInNewContext(
        fs.readFileSync("js/plugins/GoddessFeatherFastTravel.js", "utf8"),
        context
    );
    return context;
}

test("campfire and inn common events record the current location without consuming their reservation", () => {
    const context = createContext();

    context.$gameTemp.reserveCommonEvent(4);
    context.$gameTemp.reserveCommonEvent(3);

    assert.deepEqual(context.$gameTemp._commonEventQueue, [4, 3]);
    assert.deepEqual(
        JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations())),
        [
            { type: "campfire", mapId: 12, x: 7, y: 9, mapName: "森" },
            { type: "inn", mapId: 12, x: 7, y: 9, mapName: "森" }
        ]
    );
});

test("unrelated common events are reserved without adding travel locations", () => {
    const context = createContext();

    context.$gameTemp.reserveCommonEvent(8);

    assert.deepEqual(context.$gameTemp._commonEventQueue, [8]);
    assert.deepEqual(JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations())), []);
});

test("direct common event calls from map events record campfire locations", () => {
    const context = createContext();

    const interpreter = new context.Game_Interpreter();
    interpreter.command117([4]);

    assert.deepEqual(
        JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations())),
        [
            { type: "campfire", mapId: 12, x: 7, y: 9, mapName: "森" }
        ]
    );
});

test("touching a transfer door records the transfer destination outside the facility", () => {
    const context = createContext();
    context.$dataMap = { events: { 5: { name: "EV005" } } };
    new context.Game_Event(5, "", [
        { code: 201, parameters: [0, 31, 8, 14, 0, 0] },
        { code: 0 }
    ], 1);
    const interpreter = new context.Game_Interpreter();
    interpreter._eventId = 5;

    interpreter.command201([0, 31, 8, 14, 0, 0]);

    assert.deepEqual(
        JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations())),
        [{ type: "door", mapId: 31, x: 8, y: 14, mapName: "マップ31" }]
    );
});

test("touch transfer destinations resolve variables and preserve named door events", () => {
    const context = createContext();
    context.$dataMap = { events: { 6: { name: "移動（村３）" } } };
    context.$dataMapInfos[31] = { name: "第三村" };
    new context.Game_Event(6, "", [
        { code: 201, parameters: [1, 4, 5, 6, 0, 0] },
        { code: 0 }
    ], 0);
    const interpreter = new context.Game_Interpreter();
    interpreter._eventId = 6;

    interpreter.command201([1, 4, 5, 6, 0, 0]);

    assert.deepEqual(
        JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations())),
        [{ type: "door", mapId: 31, x: 8, y: 14, mapName: "第三村", eventName: "移動（村３）" }]
    );
});

test("autorun transfer events do not create door destinations", () => {
    const context = createContext();
    new context.Game_Event(7, "", [
        { code: 201, parameters: [0, 31, 8, 14, 0, 0] },
        { code: 0 }
    ], 3);
    const interpreter = new context.Game_Interpreter();
    interpreter._eventId = 7;

    interpreter.command201([0, 31, 8, 14, 0, 0]);

    assert.deepEqual(
        JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations())),
        []
    );
});

test("tagged event activation records a named campfire before any save or rest choice", () => {
    const context = createContext();
    context.$dataMap = {
        events: { 5: { name: "森の焚き火", note: "<FastTravelCategory: town, forest>" } }
    };
    const event = new context.Game_Event(5, "<CampRestPoint>");

    event.start();

    assert.equal(event._starting, true);
    assert.deepEqual(
        JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations())),
        [{
            type: "campfire",
            mapId: 12,
            x: 7,
            y: 9,
            mapName: "森",
            categories: ["town", "forest"],
            eventName: "森の焚き火"
        }]
    );
    assert.deepEqual(context.$gameTemp._commonEventQueue, []);
});

test("repeated tagged activation and legacy common event calls do not duplicate a location", () => {
    const context = createContext();
    const event = new context.Game_Event(5, "<camprestpoint>");
    event.start();
    event.start();
    const interpreter = new context.Game_Interpreter();
    interpreter._eventId = 5;
    interpreter.command117([4]);

    assert.equal(context.$gameSystem.goddessFeatherLocations().length, 1);
});

test("untagged events and tagged events without executable commands are not registered", () => {
    const context = createContext();
    new context.Game_Event(1).start();
    new context.Game_Event(2, "<CampRestPoint>", [{ code: 0 }]).start();
    new context.Game_Event(3, "<CampRestPoint>", null).start();

    assert.equal(context.$gameSystem.goddessFeatherLocations().length, 0);
});

for (const campFirst of [false, true]) {
    test(`tagged registration is included in the CampRest snapshot (CampRest first: ${campFirst})`, () => {
        const snapshots = [];
        const loadCampRest = context => {
            context.window = context;
            context.PluginManager.registerCommand = () => {};
            context.DataManager = {
                makeSaveContents: () => ({ system: context.$gameSystem }),
                setupNewGame() {},
                loadGame: () => Promise.resolve(0)
            };
            context.JsonEx = {
                stringify(contents) {
                    snapshots.push(JSON.parse(JSON.stringify(contents)));
                    return JSON.stringify(contents);
                }
            };
            context.$gameSystem.onBeforeSave = () => {};
            context.$gamePlayer.direction = () => 2;
            context.Scene_Map.prototype.start = () => {};
            vm.runInNewContext(fs.readFileSync("js/plugins/CampRest.js", "utf8"), context);
        };
        const context = campFirst ? createContext(loadCampRest) : createContext();
        if (!campFirst) loadCampRest(context);

        new context.Game_Event(5, "<CampRestPoint>").start();

        assert.equal(snapshots.length, 1);
        assert.equal(snapshots[0].system._goddessFeatherLocations.length, 1);
        assert.equal(snapshots[0].system._goddessFeatherLocations[0].type, "campfire");
    });
}

test("fast travel scene creates its window from the menu main-area bounds", () => {
    const context = createContext();
    const sceneItem = new context.Scene_Item();

    sceneItem.useItem();
    const scene = new context.SceneManager.pushedScene();
    scene.create();

    assert.deepEqual(
        JSON.parse(JSON.stringify(scene._travelWindow.rect)),
        { x: 0, y: 72, width: 816, height: 432 }
    );
    assert.equal(scene.addedWindow, scene._travelWindow);
});

test("travel destination categories are read from transfer-event notes", () => {
    const context = createContext();
    context.$dataMap = {
        events: { 5: { name: "町の入口", note: "<FastTravelCategory: town, town>" } }
    };
    new context.Game_Event(5, "", [
        { code: 201, parameters: [0, 31, 8, 14, 0, 0] },
        { code: 0 }
    ], 1);
    const interpreter = new context.Game_Interpreter();
    interpreter._eventId = 5;

    interpreter.command201([0, 31, 8, 14, 0, 0]);

    assert.deepEqual(
        JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations()[0].categories)),
        ["town"]
    );
});

test("category selection filters destinations and all retains uncategorized locations", () => {
    const serializedCategories = JSON.stringify([
        JSON.stringify({ Id: "town", Name: "町" }),
        JSON.stringify({ Id: "forest", Name: "森" })
    ]);
    const context = createContext(() => {}, { Categories: serializedCategories });
    context.$gameSystem.addGoddessFeatherLocation({
        type: "campfire", mapId: 1, x: 1, y: 1, categories: ["forest"]
    });
    context.$gameSystem.addGoddessFeatherLocation({
        type: "door", mapId: 2, x: 2, y: 2, categories: ["town", "forest"]
    });
    context.$gameSystem.addGoddessFeatherLocation({
        type: "inn", mapId: 3, x: 3, y: 3
    });

    const sceneItem = new context.Scene_Item();
    sceneItem.useItem();
    const scene = new context.SceneManager.pushedScene();
    scene.create();

    assert.deepEqual(
        JSON.parse(JSON.stringify(scene._categoryWindow._list.map(command => command.name))),
        ["すべて", "町", "森", "戻る"]
    );
    scene._categoryWindow.select(1);
    scene.onCategory();
    assert.deepEqual(
        JSON.parse(JSON.stringify(scene._travelWindow._locations.map(location => location.mapId))),
        [2]
    );

    scene._categoryWindow.select(0);
    scene.onCategory();
    assert.deepEqual(
        JSON.parse(JSON.stringify(scene._travelWindow._locations.map(location => location.mapId))),
        [1, 2, 3]
    );
});

test("revisiting a destination adds categories without duplicating it", () => {
    const context = createContext();
    const location = { type: "campfire", mapId: 12, x: 7, y: 9 };

    context.$gameSystem.addGoddessFeatherLocation({ ...location, categories: ["town"] });
    context.$gameSystem.addGoddessFeatherLocation({ ...location, categories: ["forest", "town"] });

    const savedLocations = context.$gameSystem.goddessFeatherLocations();
    assert.equal(savedLocations.length, 1);
    assert.deepEqual(
        JSON.parse(JSON.stringify(savedLocations[0].categories)),
        ["town", "forest"]
    );
});