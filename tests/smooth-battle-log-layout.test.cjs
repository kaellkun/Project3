const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const database = {};
for (const name of ['System', 'Actors', 'Classes', 'Weapons', 'Armors', 'States',
    'Skills', 'Items', 'Enemies', 'Troops', 'CommonEvents']) {
    database[`$data${name}`] = JSON.parse(read(`data/${name}.json`));
}
function slice(file, from, to) {
    const source = read(file);
    const start = from ? source.indexOf(from) : 0;
    const end = source.indexOf(to, start + 1);
    assert.ok(start >= 0 && end > start, `Installed source boundaries: ${file}: ${from} / ${to}`);
    return source.slice(start, end);
}

// Installed engine windows/scenes with the complete MPP_SmoothBattleLog and
// FlexibleTopDownUI plugins. Bitmaps record drawText calls and sprites record
// their bitmap/frame, so "text drawn where the line sprites look" is testable.
function setup({ layout = true, width = 816, height = 624 } = {}) {
    const context = vm.createContext({ console, assert });
    const run = (source, filename = 'smooth-battle-log-harness.js') =>
        vm.runInContext(source, context, { filename, timeout: 10000 });
    const load = file => run(read(file), file);
    run(slice('js/rmmz_core.js', null, 'function Utils()'), 'installed-JsExtensions.js');
    run(slice('js/rmmz_managers.js', null, 'function ConfigManager()'), 'installed-DataManager.js');
    run(slice('js/rmmz_managers.js', 'function BattleManager()', 'function PluginManager()'),
        'installed-BattleManager.js');
    load('js/rmmz_objects.js');
    run(`
        Object.assign(globalThis, ${JSON.stringify(database)});
        const window = globalThis;
        const PluginManager = { _scripts: ['FlexibleTopDownUI', 'MPP_SmoothBattleLog'],
            parameters(name) {
                return name === 'MPP_SmoothBattleLog' ? {
                    'Log Type': '1-line',
                    'Battle Log Window Params': JSON.stringify({ X: 0, Y: 0, Width: 816, Lines: 2, 'Font Size': 23, 'Indent Width': 16 }),
                    'Message Speed': '8', 'View Duration': '150', 'Log Command': '戦闘ログ',
                    'Past Log Window Params': JSON.stringify({ X: 0, Y: 0, Width: 0, Height: 0, 'Font Size': 23 })
                } : {};
            } };
        const document = { currentScript: { src: '' } };
        const Utils = { isOptionValid: () => false, isMobileDevice: () => false,
            RPGMAKER_NAME: 'MZ', containsArabic: () => false };
        const Graphics = { width: ${width}, height: ${height}, boxWidth: ${width}, boxHeight: ${height} };
        const ConfigManager = { touchUI: false, commandRemember: false };
        const ColorManager = {
            normalColor: () => '#fff', outlineColor: () => '#000', textColor: () => '#fff',
            itemBackColor1: () => '#111', itemBackColor2: () => '#222',
            systemColor: () => '#fff', mpCostColor: () => '#fff', tpCostColor: () => '#fff'
        };
        const TextManager = { attack: '攻撃', guard: '防御', item: 'アイテム', skill: 'スキル',
            fight: '戦う', escape: '逃げる', partyName: '%1 party', emerge: '%1 appeared' };
        const Input = { update() {}, isTriggered: () => false, isRepeated: () => false, isPressed: () => false };
        const TouchInput = { update() {}, isTriggered: () => false, isCancelled: () => false,
            isHovered: () => false, isLongPressed: () => false };
        const SoundManager = { playOk() {}, playCursor() {}, playBuzzer() {}, playCancel() {} };
        const SceneManager = { isSceneChanging: () => false };
        class Rectangle {
            constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); }
            pad(n) { this.x -= n; this.y -= n; this.width += n * 2; this.height += n * 2; }
        }
        let bitmapSerial = 0;
        class Bitmap {
            constructor(width, height) {
                Object.assign(this, { id: ++bitmapSerial, width, height, text: [], fontSize: 26, destroyed: false });
            }
            clear() { this.text = []; }
            clearRect() {}
            drawText(text, x, y, maxWidth, lineHeight, align) { this.text.push({ text, x, y }); }
            measureTextWidth(text) { return String(text).length * this.fontSize / 2; }
            addLoadListener(fn) { fn(this); }
            isReady() { return true; }
            fillRect() {} gradientFillRect() {} strokeRect() {} blt() {} destroy() { this.destroyed = true; }
        }
        class Sprite {
            constructor(bitmap) { this.bitmap = bitmap; this.children = []; this.anchor = { x: 0, y: 0 }; this.x = 0; this.y = 0; }
            move(x, y) { this.x = x; this.y = y; }
            setFrame(x, y, width, height) { this.frame = { x, y, width, height }; }
        }
        function Stage() {}
        Stage.prototype.initialize = function() { this.children = []; };
        class ColorFilter { setBlendColor() {} setBrightness() {} }
        function Window() {}
        Window.prototype.initialize = function() {
            Object.assign(this, { openness: 255, visible: true, origin: { x: 0, y: 0 },
                _contentsSprite: {}, _clientArea: { children: [], opacity: 255 }, children: [] });
        };
        Window.prototype.move = function(x, y, width, height) { Object.assign(this, { x, y, width, height }); };
        Window.prototype.setTone = function() {};
        Window.prototype.setCursorRect = function() {};
        Window.prototype.update = function() {};
        Window.prototype.isOpen = function() { return this.openness >= 255; };
        Window.prototype.isClosed = function() { return this.openness <= 0; };
        Window.prototype.addChild = function(child) { this.children.push(child); return child; };
        Window.prototype.addChildToBack = Window.prototype.addChild;
        Window.prototype.addInnerChild = function(child) { this._clientArea.children.push(child); return child; };
        Object.defineProperties(Window.prototype, {
            innerWidth: { get() { return Math.max(0, this.width - 2 * this.padding); } },
            innerHeight: { get() { return Math.max(0, this.height - 2 * this.padding); } }
        });
        const ImageManager = { loadSystem: () => new Bitmap(192, 192),
            loadFace: () => new Bitmap(576, 288), faceWidth: 144, faceHeight: 144,
            iconWidth: 32, iconHeight: 32, isObjectCharacter: () => false };
    `);
    load('js/rmmz_windows.js');
    load('js/rmmz_scenes.js');
    run(`
        Window_BattleStatus.prototype.drawItem = function() {};
        Scene_Message.prototype.createAllWindows = function() {
            this._messageWindow = new Window_Base(new Rectangle(0, 0, 100, 100));
            this._messageWindow.openness = 0;
        };
    `);
    if (layout) load('js/plugins/FlexibleTopDownUI.js');
    load('js/plugins/Battle/Log/MPP_SmoothBattleLog.js');
    run(`
        for (const data of Object.values(globalThis).filter(x => Array.isArray(x))) {
            for (const object of data) if (object && typeof object.note === 'string') DataManager.extractMetadata(object);
        }
        $dataSystem.battleSystem = 1;
        $gameTemp = new Game_Temp(); $gameSystem = new Game_System(); $gameActors = new Game_Actors();
        $gameVariables = new Game_Variables(); $gameSwitches = new Game_Switches(); $gameMessage = new Game_Message();
        $gameScreen = new Game_Screen(); $gameTimer = new Game_Timer(); $gameMap = new Game_Map();
        $gameParty = new Game_Party(); $gameTroop = new Game_Troop();
        $gameParty._actors = [1, 2]; $gameParty._inBattle = true;
        $gameTroop.setup(1);
        BattleManager.initMembers(); BattleManager._phase = 'turn';
        function battleScene() {
            const scene = new Scene_Battle();
            scene._windowLayer = { children: [], addChild(child) { this.children.push(child); } };
            scene.createAllWindows();
            if (scene.relayoutBattleWindows) scene.relayoutBattleWindows();
            BattleManager.setLogWindow(scene._logWindow);
            return scene;
        }
        // Text visible through the line sprites: drawn on the bitmap they display, inside their frame rows.
        function visibleTexts(log) {
            return log._logSprites.flatMap(sprite => (sprite.bitmap.text || [])
                .filter(t => !sprite.bitmap.destroyed && t.y >= sprite.frame.y && t.y < sprite.frame.y + sprite.frame.height)
                .map(t => t.text));
        }
    `);
    return { run };
}

test('MPP log sprites display the recreated contents after FlexibleTopDownUI relayout', () => {
    setup().run(`
        const scene = battleScene();
        const log = scene._logWindow;
        assert.ok(log._logSprites.length >= 3, 'MPP line sprites exist');
        assert.notEqual(log.height, Window_BattleLog.prototype.windowHeight.call(log),
            'layout plugin changed the log height, so contents were recreated');
        for (const sprite of log._logSprites) {
            assert.equal(sprite.bitmap, log.contents, 'line sprite shows the current contents bitmap');
            assert.equal(sprite.bitmap.destroyed, false);
        }
        log.addText('Goblin attacks!');
        assert.ok(visibleTexts(log).join('').includes('Goblin attacks!'), 'new line is visible: ' + JSON.stringify(visibleTexts(log)));
    `);
});

test('line sprite frames follow the new line rectangles and the y-position of the layout', () => {
    setup().run(`
        const scene = battleScene();
        const log = scene._logWindow;
        assert.equal(log.y, scene.battleCommandHeight(), 'log sits below the command row');
        log._logSprites.forEach((sprite, i) => {
            const rect = log.lineRect(i);
            assert.deepEqual(sprite.frame, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
            assert.equal(sprite._homeY, rect.y);
        });
    `);
});

test('without the layout plugin the log keeps MPP geometry and stays visible', () => {
    setup({ layout: false }).run(`
        const scene = battleScene();
        const log = scene._logWindow;
        assert.equal(log.height, Window_BattleLog.prototype.windowHeight.call(log));
        log.addText('Slime appears');
        assert.ok(visibleTexts(log).join('').includes('Slime appears'));
    `);
});

test('shifted lines after the maximum keep drawing onto the displayed bitmap', () => {
    setup().run(`
        const scene = battleScene();
        const log = scene._logWindow;
        for (let i = 0; i < 5; i++) log.addText('Line ' + i);
        assert.equal(log.numLines(), log.maxLines(), 'MPP shifts out the oldest line');
        const shown = visibleTexts(log).join(' ');
        assert.ok(shown.includes('Line 4') && shown.includes('Line 3'), shown);
        for (const sprite of log._logSprites) assert.equal(sprite.bitmap, log.contents);
    `);
});
