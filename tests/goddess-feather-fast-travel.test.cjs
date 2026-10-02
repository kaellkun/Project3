const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createContext() {
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