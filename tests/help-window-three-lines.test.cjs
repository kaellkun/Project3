const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function setup(parameters = {}, flexible = true) {
    const context = vm.createContext({ assert });
    const run = code => vm.runInContext(code, context);
    run(`
        function Stage() {}
        class Rectangle {
            constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); }
            pad(x, y) { this.x -= x; this.y -= y; this.width += 2*x; this.height += 2*y; }
        }
        function Window() {}
        Window.prototype.initialize = function() {};
        Window.prototype.move = function(x, y, width, height) {
            Object.assign(this, { x, y, width, height });
        };
        Window.prototype.setTone = function() {};
        Object.defineProperties(Window.prototype, {
            innerWidth: { get() { return this.width - this.padding * 2; } },
            innerHeight: { get() { return this.height - this.padding * 2; } }
        });
        class Bitmap {
            constructor(width, height) { Object.assign(this, { width, height, draws: [] }); }
            clear() { this.draws = []; }
            destroy() {}
            measureTextWidth(text) { return text.length * this.fontSize; }
            drawText(text, x, y, width, height) {
                if (text) this.draws.push({ text, x, y, height, size: this.fontSize });
            }
            blt() {}
        }
        const Graphics = { width: 816, height: 624, boxWidth: 816, boxHeight: 624 };
        const Utils = { isMobileDevice: () => false, containsArabic: () => false };
        const ImageManager = { loadSystem: () => ({}), standardIconWidth: 32,
            standardIconHeight: 32, iconWidth: 32, iconHeight: 32 };
        const ColorManager = { normalColor: () => 'white', outlineColor: () => 'black',
            textColor: () => 'red' };
        const TextManager = { currencyUnit: 'G' };
        let mainFontSize = 28;
        const $gameSystem = { mainFontFace: () => 'rmmz-mainfont', mainFontSize: () => mainFontSize,
            windowPadding: () => 12, windowOpacity: () => 192, windowTone: () => [0,0,0,0] };
        const $dataSystem = { advanced: { uiAreaWidth: 816, uiAreaHeight: 624 } };
    `);
    run(read('js/rmmz_windows.js'));
    run(read('js/rmmz_scenes.js'));
    run(read('js/plugins.js'));
    run(`
        const PluginManager = { parameters: name => name === 'HelpWindowThreeLines'
            ? ${JSON.stringify(parameters)}
            : ($plugins.find(p => p.name === name)?.parameters || {}) };
    `);
    if (flexible) run(read('js/plugins/FlexibleTopDownUI.js'));
    // Evaluate the actual optional plugin methods without booting unrelated skill services.
    run(`
        function Scene_LearnSkillList() {}
        Scene_LearnSkillList.prototype = Object.create(Scene_MenuBase.prototype);
        const pHelpLines = 5;
        function Scene_LearnSkillSelectActorCustom() {}
        Scene_LearnSkillSelectActorCustom.prototype = Object.create(Scene_MenuBase.prototype);
    `);
    const learn = read('js/plugins/Skill/NRP_LearnSkillList.js');
    const nonParty = read('js/plugins/Skill/NRP_LearnSkillList_NonParty.js');
    function method(source, name) {
        const start = source.indexOf(name + ' = function(');
        assert.ok(start >= 0);
        run(source.slice(start, source.indexOf('\n};', start) + 3));
    }
    method(learn, 'Scene_LearnSkillList.prototype.helpAreaHeight');
    method(nonParty, 'Scene_LearnSkillSelectActorCustom.prototype.titleWindowRect');
    method(nonParty, 'Scene_LearnSkillSelectActorCustom.prototype.actorListWindowRect');
    run(read('js/plugins/HelpWindowThreeLines.js'));
    return run;
}

test('help is three rows before contents creation without changing the supplied rectangle', () => {
    setup()(`
        const rect = new Rectangle(6, 20, 500, 60);
        const help = new Window_Help(rect);
        assert.equal(rect.height, 60);
        assert.equal(help.height, 132);
        assert.equal(help.contents.height, 108);
        assert.equal(help.x, 6);
        assert.equal(help.y, 20);
        assert.equal(help.contents.fontSize, 24);
    `);
});

for (const [value, expected] of [[undefined, 24], ['', 24], ['invalid', 24],
    ['Infinity', 24], ['85', 24], ['100', 28], ['50', 14], ['0', 3], ['200', 28]]) {
    test(`font rate ${String(value)} is validated and does not accumulate on refresh`, () => {
        setup(value === undefined ? {} : { FontSizeRate: value })(`
            const help = new Window_Help(new Rectangle(0, 0, 600, 1));
            for (let i = 0; i < 3; i++) {
                help.resetFontSettings();
                assert.equal(help.contents.fontSize, ${expected});
            }
            const ordinary = new Window_Base(new Rectangle(0, 0, 600, 132));
            assert.equal(ordinary.contents.fontSize, 28);
        `);
    });
}

test('three text rows retain line spacing, escape codes, icons and reset behavior', () => {
    setup()(`
        const help = new Window_Help(new Rectangle(0, 0, 600, 1));
        help.setText('一行目\\n二行目\\n三行目'.replace(/\\\\n/g, '\\n'));
        assert.deepEqual(help.contents.draws.map(d => d.y), [0, 36, 72]);
        assert.ok(help.contents.draws.every(d => d.size === 24 && d.height === 36));
        assert.equal(help.textSizeEx('一\\n二\\n三').height, 108);
        help.setText('\\\\C[2]赤\\\\I[1]アイコン\\n二\\n三');
        assert.equal(help.contents.draws.at(-1).y, 72);
        help.setText('\\\\FS[40]大');
        assert.equal(help.contents.draws.at(-1).size, 40);
        help.setText('通常');
        assert.equal(help.contents.draws.at(-1).size, 24);
        mainFontSize = 40;
        help.refresh();
        assert.equal(help.contents.fontSize, 34);
        assert.equal(help.contents.draws.at(-1).height, 36);
    `);
});

for (const flexible of [false, true]) {
    test(`menu, battle, save, profile and skill-learning heights agree (flexible=${flexible})`, () => {
        setup({}, flexible)(`
            for (const type of [Scene_Item, Scene_Skill, Scene_Equip, Scene_Shop,
                Scene_Battle, Scene_LearnSkillList]) {
                const scene = Object.create(type.prototype);
                assert.equal(scene.helpAreaHeight(), 132, type.name);
                assert.equal(scene.helpWindowRect().height, 132, type.name);
            }
            for (const type of [Scene_Save, Scene_Load]) {
                const scene = Object.create(type.prototype);
                const rect = scene.helpWindowRect();
                scene._helpWindow = new Window_Help(rect);
                const list = scene.listWindowRect();
                assert.equal(scene.helpAreaHeight(), 0);
                assert.equal(rect.height, 132);
                assert.equal(list.y, rect.y + rect.height);
                assert.equal(list.y + list.height, scene.mainAreaBottom());
            }
            const status = Object.create(Scene_Status.prototype);
            assert.equal(status.helpAreaHeight(), 0);
            assert.equal(status.profileWindowRect().height, 132);
            assert.equal(Object.create(Scene_Menu.prototype).helpAreaHeight(), 0);
            const custom = Object.create(Scene_LearnSkillSelectActorCustom.prototype);
            const title = custom.titleWindowRect();
            assert.equal(title.height, 132);
            assert.equal(custom.actorListWindowRect().y, title.y + title.height);
        `);
    });
}

for (const [width, height] of [[816, 624], [480, 816], [1280, 720]]) {
    test(`battle relayout keeps three rows and avoids list overlap at ${width}x${height}`, () => {
        setup()(`
            Object.assign(Graphics, { width: ${width}, boxWidth: ${width},
                height: ${height}, boxHeight: ${height} });
            const scene = Object.create(Scene_Battle.prototype);
            const rect = scene.helpWindowRect();
            scene._helpWindow = new Window_Help(rect);
            scene.relayoutBattleWindows();
            assert.equal(scene._helpWindow.height, 132);
            assert.equal(scene._helpWindow.y, rect.y);
            assert.equal(scene._helpWindow.contents.height, 108);
            const list = scene.skillWindowRect();
            assert.ok(list.y + list.height <= rect.y);
            assert.ok(rect.y + rect.height <= scene.statusWindowRect().y);
            assert.ok(list.height > 0);
        `);
    });
}

test('plugin is enabled below the UI and skill plugins', () => {
    const context = {};
    vm.runInNewContext(read('js/plugins.js'), context);
    const plugins = context.$plugins;
    const index = plugins.findIndex(p => p.name === 'HelpWindowThreeLines');
    assert.ok(index >= 0 && plugins[index].status);
    assert.equal(plugins[index].parameters.FontSizeRate, '85');
    for (const name of ['FlexibleTopDownUI', 'Skill/NRP_LearnSkillList', 'Skill/NRP_LearnSkillList_NonParty']) {
        assert.ok(index > plugins.findIndex(p => p.name === name));
    }
});