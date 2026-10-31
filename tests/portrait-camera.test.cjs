const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function setup({ mobile = true, width = 390, height = 844, parameters = {} } = {}) {
    const context = vm.createContext({ assert });
    const run = code => vm.runInContext(code, context);
    const core = read('js/rmmz_core.js');
    run(core.slice(0, core.indexOf('function Graphics()')));
    const managers = read('js/rmmz_managers.js');
    run(managers.slice(managers.indexOf('function PluginManager()')));
    run(read('js/rmmz_objects.js'));
    run(`
        const document = {
            currentScript: { src: '/js/plugins/HUG/Map/Keke_FreeCamera.js' },
            querySelector: () => ({ content: '' })
        };
        const window = { innerWidth: ${width}, innerHeight: ${height} };
        Utils.isMobileDevice = () => ${mobile};
        const Graphics = {
            width: 816, height: 624, boxWidth: 816, boxHeight: 624,
            _stretchWidth: () => 816, _stretchHeight: () => 624,
            resize(width, height) { this.width = width; this.height = height; }
        };
        class Scene_Boot {
            resizeScreen() { Graphics.resize(816, 624); }
            adjustBoxSize() { Graphics.boxWidth = 816; Graphics.boxHeight = 624; }
        }
        class Scene_Map {}
        class Spriteset_Map {
            createTilemap() { this._tilemap = {}; }
            update() {}
        }
        class Window_Base {}
        class Window_Message { updatePlacement() {} }
        class Weather {}
        class Sprite_Picture {}
        class Sprite_Timer {}
        class Sprite_Character {}
        class Bitmap {}
        const TouchInput = {};
        const $dataSystem = {
            tileSize: 48,
            advanced: { screenWidth: 816, screenHeight: 624, uiAreaWidth: 816 }
        };
        const $dataMap = { width: 100, height: 100, scrollType: 0 };
        const $gameTemp = {};
        const $gameMap = Object.assign(Object.create(Game_Map.prototype), {
            _displayX: 0, _displayY: 0, _parallaxX: 0, _parallaxY: 0,
            _parallaxSx: 0, _parallaxSy: 0, _events: []
        });
        const $gamePlayer = Object.assign(Object.create(Game_Player.prototype), {
            _realX: 40, _realY: 40, _followers: { _data: [] }
        });
        const $gameScreen = new Game_Screen();
        const SceneManager = { _scene: new Scene_Map() };
        PluginManager._parameters.keke_freecamera = {
            '基本ズーム倍率': '1', '場所移動でカメラ初期化': 'true'
        };
        PluginManager._parameters.verticaldisplayfullscreen = ${JSON.stringify(parameters)};
        function close(actual, expected) {
            assert.ok(Math.abs(actual - expected) < 1e-9, actual + ' != ' + expected);
        }
    `);
    run(read('js/plugins/HUG/Map/Keke_FreeCamera.js'));
    run(read('js/plugins/VerticalDisplayFullscreen.js'));
    run(`
        new Scene_Boot().resizeScreen();
        const spriteset = new Spriteset_Map();
        spriteset._baseSprite = { scale: { x: 1, y: 1 } };
        spriteset.update();
        function camera(zoom, x = '0', y = '0', time = '0', id = '-1') {
            PluginManager.callCommand(null, 'Keke_FreeCamera', 'カメラ操作', {
                '注視キャラ-ID': id, 'ズーム倍率': String(zoom),
                'ずらしX': x, 'ずらしY': y, '動作時間': time
            });
        }
        function checkFocus(chara, offsetX = 0, offsetY = 0) {
            const scaleX = spriteset._baseSprite.scale.x * $gameScreen.zoomScale();
            const scaleY = spriteset._baseSprite.scale.y * $gameScreen.zoomScale();
            close((chara._realX + 0.5 - $gameMap.displayX()) * 48 * scaleX,
                Graphics.width / 2 - offsetX * scaleX);
            close((chara._realY + 0.5 - $gameMap.displayY()) * 48 * scaleY,
                Graphics.height / 2 - offsetY * scaleY);
            close($gameMap.screenTileX(), Graphics.width / (48 * scaleX));
            close($gameMap.screenTileY(), Graphics.height / (48 * scaleY));
        }
    `);
    return run;
}

test('portrait adapter is enabled below the free camera plugin', () => {
    const context = {};
    vm.runInNewContext(read('js/plugins.js'), context);
    const enabled = context.$plugins.filter(plugin => plugin.status).map(plugin => plugin.name);
    assert.ok(enabled.indexOf('HUG/Map/Keke_FreeCamera') >= 0);
    assert.ok(enabled.indexOf('VerticalDisplayFullscreen') > enabled.indexOf('HUG/Map/Keke_FreeCamera'));
});

for (const options of [
    {},
    { mobile: false, width: 390, height: 844 },
    { width: 320, height: 900 },
    { parameters: { MapScale: '1.5' } }
]) {
    test(`portrait zoom keeps the player centered: ${JSON.stringify(options)}`, () => {
        setup(options)(`
            for (const zoom of [1, 2, 0.5, 1.3]) {
                camera(zoom);
                checkFocus($gamePlayer);
                camera(zoom, '100', '-50');
                checkFocus($gamePlayer, 100, -50);
            }
            assert.equal(Graphics.boxHeight, 624);
        `);
    });
}

test('event focus, simultaneous zoom and offsets stay aligned throughout the animation', () => {
    setup()(`
        const event = Object.assign(Object.create(Game_Character.prototype), {
            _eventId: 1, _realX: 60, _realY: 55
        });
        $gameMap._events[1] = event;
        camera(1, '0', '0', '0', '1');
        checkFocus(event);
        camera(2, '100', '-50', '30', '1');
        for (let frame = 0; frame < 30; frame++) {
            $gameScreen.updateZoom();
            const p = $gameScreen._cameraParamKe;
            checkFocus(event, p.x, p.y);
        }
        assert.equal($gameScreen._cameraParamKe.duration, 0);
        checkFocus(event, 100, -50);
    `);
});

test('portrait zoom clamps to the actual right and bottom map bounds', () => {
    setup()(`
        $gamePlayer._realX = 99;
        $gamePlayer._realY = 99;
        for (const zoom of [1, 2, 0.5]) {
            camera(zoom);
            const scale = 2 * zoom;
            close($gameMap.displayX(), 100 - Graphics.width / (48 * scale));
            close($gameMap.displayY(), 100 - Graphics.height / (48 * scale));
        }
    `);
});

test('switching focus from player to event finishes at the event center', () => {
    setup()(`
        const event = Object.assign(Object.create(Game_Character.prototype), {
            _eventId: 1, _realX: 60, _realY: 55
        });
        $gameMap._events[1] = event;
        camera(1);
        camera(2, '0', '0', '30', '1');
        let lastX = $gameMap.displayX();
        let lastY = $gameMap.displayY();
        for (let frame = 0; frame < 30; frame++) {
            $gameScreen.updateZoom();
            assert.ok($gameMap.displayX() >= lastX);
            assert.ok($gameMap.displayY() >= lastY);
            lastX = $gameMap.displayX();
            lastY = $gameMap.displayY();
        }
        checkFocus(event);
    `);
});

test('small maps remain centered and looping maps wrap at the correct zoomed position', () => {
    setup()(`
        $dataMap.width = 3;
        $dataMap.height = 3;
        camera(0.5);
        close($gameMap.displayX(), (3 - $gameMap.screenTileX()) / 2);
        close($gameMap.displayY(), (3 - $gameMap.screenTileY()) / 2);
        $dataMap.width = 100;
        $dataMap.height = 100;
        $dataMap.scrollType = 3;
        $gamePlayer._realX = 0;
        $gamePlayer._realY = 0;
        camera(2);
        close($gameMap.displayX(), (-$gamePlayer.centerX()).mod(100));
        close($gameMap.displayY(), (-$gamePlayer.centerY()).mod(100));
    `);
});

test('tap coordinates include both portrait scale and camera zoom', () => {
    setup()(`
        for (const zoom of [1, 2, 0.5]) {
            camera(zoom);
            const scale = 2 * zoom;
            for (const [x, y] of [[0, 0], [200, 400], [800, 1700]]) {
                assert.equal($gameMap.canvasToMapX(x),
                    Math.floor($gameMap.displayX() + x / (48 * scale)));
                assert.equal($gameMap.canvasToMapY(y),
                    Math.floor($gameMap.displayY() + y / (48 * scale)));
            }
        }
    `);
});

for (const options of [
    { mobile: false, width: 1280, height: 800 },
    { width: 844, height: 390 },
    { mobile: false, width: 390, height: 844, parameters: { DesktopPortraitPreview: 'false' } }
]) {
    test(`non-expanded displays preserve PC camera behavior: ${JSON.stringify(options)}`, () => {
        setup(options)(`
            assert.equal(Graphics.height, 624);
            assert.equal(spriteset._baseSprite.scale.x, 1);
            for (const zoom of [1, 2, 0.5]) {
                camera(zoom, '100', '-50');
                checkFocus($gamePlayer, 100, -50);
                assert.equal($gameMap.canvasToMapX(200),
                    Math.floor($gameMap.displayX() + 200 / (48 * zoom)));
                assert.equal($gameMap.canvasToMapY(400),
                    Math.floor($gameMap.displayY() + 400 / (48 * zoom)));
            }
        `);
    });
}
