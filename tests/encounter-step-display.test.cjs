const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
    path.join(__dirname, '../js/plugins/EncounterStepDisplay.js'),
    'utf8'
);

function createHarness() {
    const context = vm.createContext({
        Graphics: { width: 816 },
        Rectangle: class Rectangle {
            constructor(x, y, width, height) {
                Object.assign(this, { x, y, width, height });
            }
        },
        $gameMap: {
            steps: 30,
            encounters: [{}],
            encounterStep() { return this.steps; },
            encounterList() { return this.encounters; }
        },
        $gamePlayer: { _encounterCount: 20 },
        Scene_Map: function Scene_Map() {},
        Window_Base: class Window_Base {
            constructor(rect) {
                this.initialize(rect);
            }
            initialize(rect) {
                Object.assign(this, rect);
                this.width = rect.width;
                this.height = rect.height;
                this.innerWidth = rect.width - 24;
                this.innerHeight = rect.height - 24;
                this.drawnText = [];
                this.contents = { clear: () => { this.drawnText = []; } };
            }
            setBackgroundType(type) { this.backgroundType = type; }
            resetFontSettings() {}
            drawText(...args) { this.drawnText.push(args); }
            update() {}
        }
    });
    context.Scene_Map.prototype.createAllWindows = function() {
        this.originalCreateAllWindows = true;
    };
    context.Scene_Map.prototype.addChild = function(window) {
        this.addedWindow = window;
    };
    vm.runInContext(source, context);
    return context;
}

test('shows and updates the remaining encounter steps on the map', () => {
    const context = createHarness();
    const scene = new context.Scene_Map();
    scene.createAllWindows();

    const window = scene.addedWindow;
    assert.equal(scene.originalCreateAllWindows, true);
    assert.equal(window.x, 532);
    assert.equal(window.y, 8);
    assert.equal(window.backgroundType, 1);
    assert.deepEqual(window.drawnText.map(row => row[0]), [
        '現在のエンカウント歩数',
        'あと 20 歩'
    ]);

    context.$gamePlayer._encounterCount = 8.5;
    context.Graphics.width = 1000;
    window.update();
    assert.equal(window.x, 716);
    assert.equal(window.drawnText[1][0], 'あと 9 歩');
    assert.equal(window.drawnText.length, 2);
});

test('shows that encounters do not apply on maps without random encounters', () => {
    const context = createHarness();
    context.$gameMap.encounters = [];
    const scene = new context.Scene_Map();
    scene.createAllWindows();

    assert.equal(scene.addedWindow.drawnText[1][0], '対象外');
});
