const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createContext(beforePlugin = () => {}) {
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
    }

    class Game_Event {
        constructor(eventId, note = "", list = [{ code: 117 }, { code: 0 }]) {
            this._eventId = eventId;
            this._data = { note };
            this._list = list;
        }

        event() { return this._data; }
        eventId() { return this._eventId; }
        list() { return this._list; }
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
        }

        setHandler() {}
        activate() {}
        select() {}
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
                    InnCommonEventId: "3"
                };
            }
        },
        $gameMap: { mapId: () => 12 },
        $gamePlayer: { x: 7, y: 9 },
        $dataMapInfos: { 12: { name: "森" } },
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

test("tagged event activation records a named campfire before any save or rest choice", () => {
    const context = createContext();
    context.$dataMap = { events: { 5: { name: "森の焚き火" } } };
    const event = new context.Game_Event(5, "<CampRestPoint>");

    event.start();

    assert.equal(event._starting, true);
    assert.deepEqual(
        JSON.parse(JSON.stringify(context.$gameSystem.goddessFeatherLocations())),
        [{ type: "campfire", mapId: 12, x: 7, y: 9, mapName: "森", eventName: "森の焚き火" }]
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