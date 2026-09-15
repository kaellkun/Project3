const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function setup(parameterOverrides = {}) {
    const testParameters = { KanjiSpacing: '-8', ...parameterOverrides };
    const context = vm.createContext({ assert });
    const run = code => vm.runInContext(code, context);
    const core = read('js/rmmz_core.js');
    // Use the installed Bitmap and window implementations; only canvas I/O,
    // geometry and scene services are stubbed for headless rendering checks.
    run(core.slice(core.indexOf('function Bitmap('), core.indexOf('function Sprite(')));
    run(`
        function Window() {}
        function Scene_MenuBase() {}
        function Scene_Menu() {}
        function Scene_Item() {}
        function Scene_Skill() {}
        function Scene_Shop() {}
        function Scene_Battle() {}
        function Scene_Message() {}
        Scene_Message.prototype.messageWindowRect = function() {
            return { height: this.calcWindowHeight(4, false) + 8 };
        };
        const ColorManager = {
            normalColor: () => '#ffffff',
            outlineColor: () => 'rgba(0, 0, 0, 0.6)'
        };
    `);
    run(read('js/rmmz_windows.js'));
    run(read('js/plugins.js'));
    run(`
        const PluginManager = {
            parameters: name => ({
                ...$plugins.find(plugin => plugin.name === name).parameters,
                ...${JSON.stringify(testParameters)}
            })
        };
        const $gameSystem = { mainFontSize: () => 28 };
    `);
    run(read('js/plugins/MainFontLetterSpacing.js'));
    run(read('js/plugins/FlexibleTopDownUI.js'));
    run(`
        const draws = [];
        const stack = [];
        const canvasContext = {
            globalAlpha: 1,
            font: 'original',
            save() {
                stack.push(Object.fromEntries(Object.entries(this)
                    .filter(([, value]) => typeof value !== 'function')));
            },
            restore() { Object.assign(this, stack.pop()); },
            measureText(text) {
                const fontSize = Number.parseFloat(this.font) || 28;
                return { width: Array.from(text).length * fontSize };
            },
            strokeText(text, x, y) { draws.push({ kind: 'outline', text, x, y, alpha: this.globalAlpha }); },
            fillText(text, x, y) { draws.push({ kind: 'body', text, x, y, alpha: this.globalAlpha }); }
        };
        const bitmap = Object.create(Bitmap.prototype);
        Object.assign(bitmap, {
            _canvas: {}, _context: canvasContext, _paintOpacity: 255,
            _baseTexture: { update() {} },
            fontFace: 'rmmz-mainfont', fontSize: 28,
            textColor: '#ffffff', outlineColor: 'rgba(0, 0, 0, 0.6)', outlineWidth: 3
        });
        function commandWindow(type = Window_Command) {
            const win = Object.create(type.prototype);
            win.contents = bitmap;
            win._list = [];
            win.itemLineRect = () => ({ x: 0, y: 0, width: 240, height: 36 });
            win.addCommand('攻撃', 'attack', true);
            win.addCommand('防御', 'guard', false);
            return win;
        }
    `);
    return run;
}

for (const type of ['Window_Command', 'Window_MenuCommand', 'Window_PartyCommand',
    'Window_ActorCommand', 'Window_ShopCommand', 'Window_TitleCommand']) {
    test(`${type}: disabled text and outline respect opacity, enabled text recovers`, () => {
        setup()(`
            const win = commandWindow(${type});
            for (const index of [0, 1, 0]) {
                draws.length = 0;
                win.drawItem(index);
                const expected = index === 1 ? win.translucentOpacity() / 255 : 1;
                assert.equal(draws.length, 4);
                assert.ok(draws.every(draw => draw.alpha === expected));
                assert.equal(canvasContext.globalAlpha, expected);
                assert.equal(canvasContext.font, 'original');
                assert.equal(stack.length, 0);
            }
            assert.equal(win.isCommandEnabled(1), false);
            assert.equal(win.isCommandEnabled(0), true);
        `);
    });
}

test('custom and fully transparent opacity apply to every main-font glyph', () => {
    setup()(`
        for (const opacity of [0, 64, 128, 160, 255]) {
            bitmap.paintOpacity = opacity;
            draws.length = 0;
            bitmap.drawText('攻撃ABC「魔法」', 0, 0, 240, 36, 'left');
            assert.ok(draws.length > 0);
            assert.ok(draws.every(draw => draw.alpha === opacity / 255));
            assert.equal(bitmap.paintOpacity, opacity);
            assert.equal(canvasContext.globalAlpha, opacity / 255);
        }
    `);
});

test('opacity does not change configured letter spacing or alignment', () => {
    setup()(`
        for (const align of ['left', 'center', 'right']) {
            bitmap.paintOpacity = 255;
            draws.length = 0;
            const width = bitmap.measureTextWidth('攻撃');
            assert.equal(width, 48); // Two 28px glyphs, configured kanji spacing -8px.
            bitmap.drawText('攻撃', 10, 0, 240, 36, align);
            const positions = draws.map(({ text, x, y }) => ({ text, x, y }));
            const start = align === 'center' ? 106 : align === 'right' ? 202 : 10;
            assert.equal(draws[0].x, start);
            assert.equal(draws[2].x, start + 20);
            bitmap.paintOpacity = 160;
            draws.length = 0;
            assert.equal(bitmap.measureTextWidth('攻撃'), width);
            bitmap.drawText('攻撃', 10, 0, 240, 36, align);
            assert.deepEqual(draws.map(({ text, x, y }) => ({ text, x, y })), positions);
        }
    `);
});

test('message text keeps letter spacing between incremental flushes', () => {
    setup()(`
        const message = Object.create(Window_Message.prototype);
        message.contents = bitmap;
        const textState = {
            text: '攻撃',
            index: 0,
            x: 0,
            y: 0,
            startX: 0,
            startY: 0,
            width: 240,
            height: 36,
            rtl: false,
            buffer: '',
            drawing: true,
            outputWidth: 0,
            outputHeight: 0
        };

        message.processCharacter(textState);
        message.flushTextState(textState);
        assert.equal(textState.x, 20); // 28px glyph width - 8px kanji spacing.

        message.processCharacter(textState);
        message.flushTextState(textState);
        assert.equal(textState.x, 48);
    `);
});

test('message line spacing multiplies each message line height', () => {
    setup({ MessageLineSpacing: '1.4' })(`
        const message = Object.create(Window_Message.prototype);
        message.contents = bitmap;
        message.lineHeight = () => 36;
        const textState = { text: '一行目\\n二行目', index: 0 };
        assert.equal(message.calcTextHeight(textState), 50.4);
    `);
});

test('message window defaults to three lines including configured spacing', () => {
    setup({ MessageLineSpacing: '1.4' })(`
        const scene = Object.create(Scene_Message.prototype);
        scene.calcWindowHeight = lines => lines * 36 + 24;
        const rect = scene.messageWindowRect();
        assert.equal(rect.height, 183.2);
    `);
});

test('punctuation uses the closing quote trim rule', () => {
    setup()(`
        assert.equal(bitmap.measureTextWidth('」'), bitmap.measureTextWidth('、'));
        assert.equal(bitmap.measureTextWidth('」'), bitmap.measureTextWidth('。'));
    `);
});

test('letter spacing scales with the active font size', () => {
    setup()(`
        const standardWidth = bitmap.measureTextWidth('攻撃');
        bitmap.fontSize = 16;
        const labelWidth = bitmap.measureTextWidth('攻撃');
        assert.equal(standardWidth, 48);
        assert.ok(Math.abs(labelWidth - 27.42857142857143) < 1e-10);
    `);
});

test('other fonts retain native body opacity and outline rendering', () => {
    setup()(`
        for (const font of ['rmmz-numberfont', 'sans-serif']) {
            bitmap.fontFace = font;
            bitmap.paintOpacity = 160;
            draws.length = 0;
            bitmap.drawText('123', 0, 0, 240, 36, 'left');
            assert.equal(draws.length, 2);
            assert.equal(draws[0].alpha, 1);
            assert.equal(draws[1].alpha, 160 / 255);
            assert.equal(draws[1].text, '123');
            assert.equal(bitmap.measureTextWidth('123'), 84);
            assert.equal(canvasContext.globalAlpha, 160 / 255);
        }
    `);
});