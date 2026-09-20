const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function setup(width = 816, height = 624) {
    const context = vm.createContext({ assert });
    const run = code => vm.runInContext(code, context);
    run(`
        function Stage() {}
        class Rectangle {
            constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); }
            pad(x, y) { this.x -= x; this.y -= y; this.width += 2*x; this.height += 2*y; }
            contains(x, y) { return x >= this.x && y >= this.y && x < this.x + this.width && y < this.y + this.height; }
        }
        function Window() {}
        Window.prototype.initialize = function() { this.origin = { x: 0, y: 0 }; };
        Window.prototype.move = function(x, y, width, height) { Object.assign(this, { x, y, width, height }); };
        Window.prototype.setTone = function() {};
        Window.prototype.setCursorRect = function(x, y, width, height) { this.cursorRect = new Rectangle(x, y, width, height); };
        Object.defineProperties(Window.prototype, {
            innerRect: { get() { return new Rectangle(this.padding, this.padding, this.innerWidth, this.innerHeight); } },
            innerWidth: { get() { return this.width - this.padding * 2; } },
            innerHeight: { get() { return this.height - this.padding * 2; } }
        });
        class Bitmap {
            constructor(width, height) { Object.assign(this, { width, height, draws: [] }); }
            clear() { this.draws = []; }
            destroy() { this.destroyed = true; }
            drawText(text, x, y, width, height) { this.draws.push({ text, x, y, width, height }); }
            gradientFillRect() {}
            strokeRect() {}
            measureTextWidth(text) { return String(text).length * this.fontSize; }
        }
        const Graphics = { width: ${width}, boxWidth: ${width}, height: ${height}, boxHeight: ${height} };
        const Utils = { isMobileDevice: () => false };
        const ConfigManager = {};
        const ImageManager = { loadSystem: () => ({}) };
        const ColorManager = { normalColor: () => '#fff', outlineColor: () => '#000',
            itemBackColor1: () => '#222', itemBackColor2: () => '#111' };
        const $gameSystem = { mainFontSize: () => 36, mainFontFace: () => 'rmmz-mainfont',
            windowPadding: () => 12, windowOpacity: () => 192, windowTone: () => [0,0,0,0] };
        const $dataSystem = { titleCommandWindow: { offsetX: 0, offsetY: 0 } };
    `);
    run(read('js/rmmz_windows.js'));
    run(read('js/rmmz_scenes.js'));
    run(read('js/plugins.js'));
    run(`const PluginManager = {
        _scripts: $plugins.filter(p => p.status).map(p => p.name),
        parameters: name => $plugins.find(p => p.name === name)?.parameters || {}
    };`);
    run(read('js/plugins/LicenseNotice.js'));
    run(read('js/plugins/FlexibleTopDownUI.js'));
    run(read('js/plugins/HelpWindowThreeLines.js'));
    run(`
        // Real engine layout/drawing/scroll/cursor methods. Only low-level rendering
        // and command data services are substituted, not the geometry under test.
        function windowFor(Type, rect, count = 1) {
            const win = Object.create(Type.prototype);
            Object.assign(win, { _scrollX: 0, _scrollY: 0, _scrollBaseX: 0, _scrollBaseY: 0,
                _index: 0, _cursorAll: false, _cursorFixed: false });
            Window_Base.prototype.initialize.call(win, rect);
            if (win instanceof Window_Command) {
                win.makeCommandList = function() {
                    for (let i = 0; i < count; i++) this.addCommand('項目' + i, 'item' + i, i !== 1);
                };
                win.refresh();
            } else win.refresh = function() {};
            win.visible = true;
            return win;
        }
        const sceneFor = Type => Object.create(Type.prototype);
        const panel = () => windowFor(Window_Base, new Rectangle(0, 0, 100, 100));
        function assertRowFits(win, rows = 1) {
            assert.equal(win.innerHeight, rows * win.itemHeight());
            assert.equal(win.maxPageRows(), rows);
            for (const index of [0, (rows - 1) * win.maxCols()]) {
                const line = win.itemLineRect(index);
                const item = win.itemRect(index);
                assert.equal(line.y - item.y, 12);
                assert.equal(item.y + item.height - line.y - line.height, 12);
                assert.ok(line.y >= 0 && line.y + line.height <= win.innerHeight);
                assert.equal(win.hitTest(item.x + win.padding + 1, item.y + win.padding + 1), index);
            }
        }
    `);
    return run;
}

test('scene command sizing uses 64px rows while ordinary selectable sizing stays 44px', () => {
    setup()(`
        const scene = sceneFor(Scene_Menu);
        assert.equal(scene.calcWindowHeight(1, true), 68);
        assert.equal(scene.calcCommandWindowHeight(1), 88);
        assert.equal(scene.calcCommandWindowHeight(2), 152);
        assert.equal(scene.calcWindowHeight(1, false), 60);
        const win = windowFor(Window_MenuCommand, scene.commandWindowRect(), 5);
        assertRowFits(win);
        assert.equal(win.contents.fontSize, 36);
        const gold = windowFor(Window_Gold, new Rectangle(0, 0, 200, 88));
        assert.equal(gold.baseTextRect().y, 14);
        assert.equal(scene.buttonAreaHeight(), 0);
        PluginManager._scripts = [];
        assert.equal(scene.buttonAreaHeight(), 52);
    `);
});

for (const [width, height] of [[816, 624], [480, 816], [1280, 720]]) {
    test(`multi-row menu has symmetric padding, no outer gaps, and rebuilt contents at ${width}x${height}`, () => {
        setup(width, height)(`
            const scene = sceneFor(Scene_Menu);
            scene._commandWindow = windowFor(Window_MenuCommand, scene.commandWindowRect(), 10);
            scene._statusWindow = panel();
            scene._goldWindow = windowFor(Window_Gold, scene.goldWindowRect());
            const old = scene._commandWindow.contents;
            scene.relayoutMenuWindows();
            const rows = scene._commandWindow.maxRows();
            assertRowFits(scene._commandWindow, rows);
            assert.equal(rows, ${width === 480 ? 4 : 2});
            assert.equal(scene._commandWindow.height, rows * 64 + 24);
            assert.equal(scene._commandWindow.width, Graphics.boxWidth);
            assert.equal(scene._commandWindow.y, 0);
            assert.equal(old.destroyed, true);
            assert.equal(scene._commandWindow.contents.height, scene._commandWindow.contentsHeight());
            assert.equal(scene._commandWindow.contents.width, scene._commandWindow.innerWidth);
            assert.equal(scene._statusWindow.y, scene._commandWindow.height);
            assert.equal(scene._statusWindow.x + scene._statusWindow.width, Graphics.boxWidth);
            assert.equal(scene._statusWindow.x, 0);
            assert.equal(scene._statusWindow.y + scene._statusWindow.height, scene._goldWindow.y);
            assert.equal(scene._goldWindow.y + scene._goldWindow.height, Graphics.boxHeight);
            const contents = scene._commandWindow.contents;
            scene.relayoutMenuWindows();
            assert.equal(scene._commandWindow.contents, contents, 'no repeated allocation');
        `);
    });

    test(`item and skill panels meet at boundaries at ${width}x${height}`, () => {
        setup(width, height)(`
            const item = sceneFor(Scene_Item);
            item._categoryWindow = windowFor(Window_ItemCategory, item.categoryWindowRect(), 4);
            item._categoryWindow.needsSelection = () => true;
            item._helpWindow = windowFor(Window_Base, item.helpWindowRect());
            item._itemWindow = panel();
            item.relayoutItemWindows();
            assertRowFits(item._categoryWindow);
            assert.equal(item._categoryWindow.y, 0);
            assert.equal(item._itemWindow.y, item._categoryWindow.height);
            assert.equal(item._itemWindow.width, Graphics.boxWidth);
            assert.equal(item._itemWindow.y + item._itemWindow.height, item._helpWindow.y);
            item._categoryWindow.needsSelection = () => false;
            item.relayoutItemWindows();
            assert.equal(item._itemWindow.y, 0, 'hidden categories leave no blank row');
            const skill = sceneFor(Scene_Skill);
            skill._skillTypeWindow = windowFor(Window_SkillType, skill.skillTypeWindowRect(), 3);
            skill._helpWindow = windowFor(Window_Base, skill.helpWindowRect());
            skill._statusWindow = panel();
            skill._itemWindow = panel();
            skill.relayoutSkillWindows();
            assertRowFits(skill._skillTypeWindow);
            assert.equal(skill._statusWindow.y, skill._skillTypeWindow.height);
            assert.equal(skill._itemWindow.y, skill._statusWindow.y + skill._statusWindow.height);
            assert.equal(skill._itemWindow.y + skill._itemWindow.height, skill._helpWindow.y);
            assert.equal(skill._helpWindow.y + skill._helpWindow.height, Graphics.boxHeight);
        `);
    });

    test(`shop commands and sell categories do not clip or overlap at ${width}x${height}`, () => {
        setup(width, height)(`
            const scene = sceneFor(Scene_Shop);
            scene._commandWindow = windowFor(Window_ShopCommand, scene.commandWindowRect(), 3);
            scene._goldWindow = windowFor(Window_Gold, scene.goldWindowRect());
            scene._categoryWindow = windowFor(Window_ItemCategory, scene.categoryWindowRect(), 4);
            scene._categoryWindow.needsSelection = () => true;
            scene._helpWindow = windowFor(Window_Base, scene.helpWindowRect());
            for (const key of ['_dummyWindow', '_buyWindow', '_sellWindow', '_statusWindow', '_numberWindow']) scene[key] = panel();
            scene.relayoutShopWindows();
            assertRowFits(scene._commandWindow);
            assertRowFits(scene._categoryWindow);
            assert.equal(scene._commandWindow.height, scene._goldWindow.height);
            assert.equal(scene._commandWindow.width, scene._goldWindow.x);
            assert.equal(scene._goldWindow.x + scene._goldWindow.width, Graphics.boxWidth);
            assert.equal(scene._dummyWindow.y, scene._commandWindow.height);
            assert.equal(scene._categoryWindow.y, scene._commandWindow.height);
            assert.equal(scene._sellWindow.y, scene._categoryWindow.y + scene._categoryWindow.height);
            assert.equal(scene._sellWindow.y + scene._sellWindow.height, scene._helpWindow.y);
            scene._categoryWindow.needsSelection = () => false;
            scene.relayoutShopWindows();
            assert.equal(scene._sellWindow.y, scene._commandWindow.height);
        `);
    });
}

test('equipment, title with licenses, options and game-end use complete command rows', () => {
    setup()(`
        const equip = sceneFor(Scene_Equip);
        assertRowFits(windowFor(Window_EquipCommand, equip.commandWindowRect(), 3));
        assert.equal(equip.slotWindowRect().y, equip.commandWindowRect().y + 88);
        const title = sceneFor(Scene_Title);
        const rect = title.commandWindowRect();
        assertRowFits(windowFor(Window_TitleCommand, rect, 4), 4);
        assert.equal(rect.y + rect.height, Graphics.boxHeight - 96);
        const options = sceneFor(Scene_Options).optionsWindowRect();
        assertRowFits(windowFor(Window_Options, options, 7), 7);
        assert.equal(options.y * 2 + options.height, Graphics.boxHeight);
        const end = sceneFor(Scene_GameEnd).commandWindowRect();
        assertRowFits(windowFor(Window_GameEnd, end, 2), 2);
        assert.equal(end.y * 2 + end.height, Graphics.boxHeight);
    `);
});

test('real battle scene and timeline use the same expanded command bottom', () => {
    const run = setup();
    run(`const BattleManager = {}; const $gameParty = {}; const SceneManager = {};`);
    // Isolate the installed layout adapters from unrelated battle services.
    const source = read('js/plugins/LinearTimeBattle.js');
    run(`(() => { const enabled = () => true; const showTimeline = true;
        ${source.slice(source.indexOf('    const cell = 48;'), source.indexOf('    const enemyLetter ='))}
    })();`);
    run(`
        const scene = sceneFor(Scene_Battle);
        assertRowFits(windowFor(Window_PartyCommand, scene.partyCommandWindowRect(), 2));
        assertRowFits(windowFor(Window_ActorCommand, scene.actorCommandWindowRect(), 4));
        assert.equal(scene.battleCommandHeight(), 88);
        assert.equal(scene.logWindowRect().y, 88 + 6 + 64 + 6);
        assert.equal(scene.skillWindowRect().y, scene.logWindowRect().y);
        assert.equal(scene.skillWindowRect().y + scene.skillWindowRect().height, scene.helpWindowRect().y);
    `);
});