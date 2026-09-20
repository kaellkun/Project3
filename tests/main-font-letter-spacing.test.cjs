const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function setup(parameterOverrides = {}, {
    shadowOrder = null, shadowParameters = {}, registerShadow = !!shadowOrder
} = {}) {
    const testParameters = { KanjiSpacing: '-8', ...parameterOverrides };
    const context = vm.createContext({ assert });
    const run = code => vm.runInContext(code, context);
    const core = read('js/rmmz_core.js');
    // Use the installed Bitmap and window implementations; only canvas I/O,
    // geometry and scene services are stubbed for headless rendering checks.
    run(core.slice(core.indexOf('function Bitmap('), core.indexOf('function Sprite(')));
    run(`
        function Window() {}
        function Sprite() {}
        function Stage() {}
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
    const sprites = read('js/rmmz_sprites.js');
    run(sprites.slice(sprites.indexOf('function Sprite_Gauge('),
        sprites.indexOf('function Sprite_StateIcon(')));
    run(read('js/rmmz_scenes.js'));
    run(`Scene_Message.prototype.messageWindowRect = function() {
        return { height: this.calcWindowHeight(4, false) + 8 };
    };`);
    run(read('js/plugins.js'));
    run(`
        const PluginManager = {
            parameters(name) {
                if (name === 'NRP_MessageShadow' && !${registerShadow}) return {};
                return {
                    ...$plugins.find(plugin => plugin.name.split('/').pop() === name)?.parameters,
                    ...(name === 'MainFontLetterSpacing' ? ${JSON.stringify(testParameters)} : {}),
                    ...(name === 'NRP_MessageShadow' ? ${JSON.stringify(shadowParameters)} : {})
                };
            }
        };
        const $gameSystem = {
            mainFontSize: () => 28, mainFontFace: () => 'rmmz-mainfont',
            windowPadding: () => 12
        };
    `);
    if (shadowOrder === 'before') run(read('js/plugins/HUG/NRP_MessageShadow.js'));
    run(read('js/plugins/MainFontLetterSpacing.js'));
    if (shadowOrder === 'after') run(read('js/plugins/HUG/NRP_MessageShadow.js'));
    run(read('js/plugins/FlexibleTopDownUI.js'));
    run(`
        const canvasState = ctx => Object.fromEntries(Object.entries(ctx)
            .filter(([, value]) => typeof value !== 'function'));
        function makeCanvasContext() {
            const draws = [];
            const stack = [];
            const ctx = {
                globalAlpha: 1,
                font: 'original',
                textAlign: 'start', textBaseline: 'top',
                strokeStyle: '#abcdef', fillStyle: '#fedcba', lineWidth: 2, lineJoin: 'miter',
                save() {
                    stack.push(canvasState(this));
                },
                restore() {
                    assert.ok(stack.length > 0, 'balanced canvas restore');
                    Object.assign(this, stack.pop());
                },
                measureText(text) {
                    const fontSize = Number.parseFloat(this.font) || 28;
                    return { width: Array.from(text).length * fontSize };
                },
                strokeText(text, x, y, maxWidth) {
                    draws.push({ kind: 'outline', text, x, y, maxWidth, alpha: this.globalAlpha,
                        color: this.strokeStyle, lineWidth: this.lineWidth, align: this.textAlign });
                },
                fillText(text, x, y, maxWidth) {
                    draws.push({ kind: 'body', text, x, y, maxWidth, alpha: this.globalAlpha,
                        color: this.fillStyle, align: this.textAlign });
                }
            };
            Object.defineProperties(ctx, { draws: { value: draws }, stack: { value: stack } });
            return ctx;
        }
        const document = {
            createElement(type) {
                assert.equal(type, 'canvas');
                const ctx = makeCanvasContext();
                return { getContext: () => ctx };
            }
        };
        const PIXI = {
            BaseTexture: class {
                updates = 0;
                update() { this.updates++; }
                destroy() {}
            },
            SCALE_MODES: { LINEAR: 1, NEAREST: 0 }
        };
        const bitmap = new Bitmap(240, 72);
        Object.assign(bitmap, {
            fontFace: 'rmmz-mainfont', fontSize: 28,
            textColor: '#ffffff', outlineColor: 'rgba(0, 0, 0, 0.6)', outlineWidth: 3
        });
        const canvasContext = bitmap.context;
        const { draws, stack } = canvasContext;
        function checkShadowGlyphs(target, {
            enabled, defaultOutline, opacity = 160, align = 'left',
            text = '攻撃', width = 48, offsets = [0, 20]
        }) {
            const ctx = target.context;
            target.paintOpacity = opacity;
            ctx.draws.length = 0;
            const state = canvasState(ctx);
            const depth = ctx.stack.length;
            const outlineColor = target.outlineColor;
            const outlineWidth = target.outlineWidth;
            const updates = target._baseTexture.updates;
            assert.equal(target.measureTextWidth(text), width);
            assert.equal(target.drawText(text, 10, 0, 240, 36, align), undefined);
            const start = 10 + (align === 'center' ? (240 - width) / 2 :
                align === 'right' ? 240 - width : 0);
            const params = PluginManager.parameters('NRP_MessageShadow');
            const expected = [];
            Array.from(text).forEach((character, index) => {
                const base = { text: character, x: start + offsets[index], y: 28,
                    maxWidth: 0xffffffff, alpha: opacity / 255, align: 'left' };
                if (!enabled || defaultOutline) {
                    expected.push({ ...base, kind: 'outline',
                        color: outlineColor, lineWidth: outlineWidth });
                }
                if (enabled) {
                    expected.push({ ...base, kind: 'outline',
                        x: base.x + Number(params.ShadowAdjustX),
                        y: base.y + Number(params.ShadowAdjustY),
                        color: params.ShadowColor, lineWidth: Number(params.ShadowAdjustSize) });
                }
                expected.push({ ...base, kind: 'body', color: target.textColor });
            });
            assert.deepEqual(ctx.draws, expected);
            assert.equal(target.outlineColor, outlineColor);
            assert.equal(target.outlineWidth, outlineWidth);
            assert.equal(target.paintOpacity, opacity);
            assert.deepEqual(canvasState(ctx), state);
            assert.equal(ctx.stack.length, depth);
            assert.equal(target._baseTexture.updates, updates + 1);
        }
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

test('command windows reserve vertical padding without changing ordinary list rows', () => {
    setup()(`
        for (const type of [Window_Command, Window_MenuCommand, Window_PartyCommand,
            Window_ActorCommand, Window_ShopCommand, Window_TitleCommand]) {
            const win = Object.create(type.prototype);
            assert.equal(win.itemHeight(), 64);
            win.itemRectWithPadding = () => ({ x: 0, y: 0, width: 240, height: 60 });
            assert.deepEqual(win.itemLineRect(0), { x: 0, y: 12, width: 240, height: 36 });
            assert.equal(Window_Selectable.prototype.fittingHeight.call(win, 1), 88);
        }
        const ordinary = Object.create(Window_Selectable.prototype);
        assert.equal(ordinary.itemHeight(), 44);
        assert.equal(Window_Selectable.prototype.fittingHeight.call(ordinary, 1), 68);
    `);
});

test('long command labels fit the padded width and restore font size and opacity', () => {
    setup()(`
        const win = commandWindow();
        bitmap.paintOpacity = 160;
        const original = bitmap.drawText;
        bitmap.drawText = function(text, x, y, width, height, align) {
            assert.ok(this.measureTextWidth(text) <= width);
            assert.equal(this.fontSize, 14);
            return original.call(this, text, x, y, width, height, align);
        };
        win.drawText('攻撃', 0, 0, 24, 'center');
        assert.equal(bitmap.fontSize, 28);
        assert.equal(bitmap.paintOpacity, 160);
        assert.ok(draws.every(draw => draw.alpha === 160 / 255));
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

test('each glyph uses the standard Bitmap outline/body hooks without width compression', () => {
    setup()(`
        const calls = [];
        for (const method of ['_drawTextOutline', '_drawTextBody']) {
            const original = bitmap[method];
            bitmap[method] = function(...args) {
                assert.equal(this, bitmap);
                calls.push({ method, args });
                return original.apply(this, args);
            };
        }
        bitmap.paintOpacity = 64;
        assert.equal(bitmap.drawText('攻撃', 10, 0, 1, 36, 'left'), undefined);
        assert.deepEqual(calls, [
            { method: '_drawTextOutline', args: ['攻', 10, 28, 0xffffffff] },
            { method: '_drawTextBody', args: ['攻', 10, 28, 0xffffffff] },
            { method: '_drawTextOutline', args: ['撃', 30, 28, 0xffffffff] },
            { method: '_drawTextBody', args: ['撃', 30, 28, 0xffffffff] }
        ]);
        assert.ok(draws.every(draw => draw.alpha === 64 / 255));
        assert.equal(stack.length, 0);
    `);
});

for (const all of ['true', true]) {
    test(`unloaded NRP with registered All=${JSON.stringify(all)} does not enable shadows`, () => {
        setup({}, { registerShadow: true, shadowParameters: { All: all } })(`
            assert.equal(typeof bitmap.setMessageShadow, 'undefined');
            checkShadowGlyphs(bitmap, { enabled: false, opacity: 64 });
            assert.equal(bitmap._isMessageShadow, undefined);
        `);
    });
}

const shadowStyle = {
    ShadowColor: '#12345680', ShadowAdjustSize: '5', ShadowAdjustX: '-3', ShadowAdjustY: '6'
};
const noTargets = {
    All: 'false', AllWindows: 'false', MessageWindow: 'false', NameWindow: 'false',
    StatusName: 'false', StatusGauges: 'false'
};

for (const shadowOrder of ['before', 'after']) {
    for (const defaultOutline of [true, false]) {
        for (const all of ['true', true]) {
            test(`NRP ${shadowOrder}, All=${JSON.stringify(all)}, outline=${defaultOutline}: bare Bitmap, opacity, trim and alignment`, () => {
                setup({}, { shadowOrder, shadowParameters: {
                    ...noTargets, ...shadowStyle, All: all,
                    DrawDefaultOutline: String(defaultOutline)
                } })(`
                    assert.equal(bitmap._isMessageShadow, undefined);
                    for (const opacity of [0, 64, 160, 255]) {
                        for (const align of ['left', 'center', 'right']) {
                            // No Window/createContents/manual flag activation: All must do it.
                            delete bitmap._isMessageShadow;
                            // Set opacity before saving so restore cannot desync Bitmap's cache.
                            bitmap.paintOpacity = opacity;
                            canvasContext.save();
                            checkShadowGlyphs(bitmap, {
                                enabled: true, defaultOutline: ${defaultOutline}, opacity, align,
                                text: '「攻撃」、', width: 79, offsets: [-14, 14, 34, 54, 65]
                            });
                            assert.equal(bitmap._isMessageShadow, true);
                            canvasContext.restore();
                            assert.equal(stack.length, 0);
                        }
                    }
                    bitmap.setMessageShadow(false);
                    checkShadowGlyphs(bitmap, { enabled: true, defaultOutline: ${defaultOutline} });
                    assert.equal(bitmap._isMessageShadow, true);
                `);
            });
        }

        test(`NRP ${shadowOrder}, All=false, outline=${defaultOutline}: preserve individual target flags`, () => {
            setup({}, { shadowOrder, shadowParameters: {
                ...noTargets, ...shadowStyle, DrawDefaultOutline: String(defaultOutline)
            } })(`
                for (const flag of [undefined, true, false, true]) {
                    if (flag === undefined) delete bitmap._isMessageShadow;
                    else bitmap.setMessageShadow(flag);
                    for (const opacity of [0, 64, 160, 255]) {
                        checkShadowGlyphs(bitmap, {
                            enabled: !!flag, defaultOutline: ${defaultOutline}, opacity
                        });
                        assert.equal(bitmap._isMessageShadow, flag);
                    }
                }
            `);
        });

        test(`NRP ${shadowOrder}, outline=${defaultOutline}: disabled commands dim shadow and recover`, () => {
            setup({}, { shadowOrder, shadowParameters: {
                ...noTargets, ...shadowStyle, All: 'true',
                DrawDefaultOutline: String(defaultOutline)
            } })(`
                for (const type of [Window_Command, Window_MenuCommand, Window_PartyCommand,
                    Window_ActorCommand, Window_ShopCommand, Window_TitleCommand]) {
                    const win = commandWindow(type);
                    for (const index of [0, 1, 0]) {
                        draws.length = 0;
                        const state = canvasState(canvasContext);
                        win.drawItem(index);
                        const alpha = index === 1 ? win.translucentOpacity() / 255 : 1;
                        assert.equal(draws.length, ${defaultOutline ? 6 : 4});
                        assert.ok(draws.every(draw => draw.alpha === alpha));
                        assert.equal(draws.filter(draw => draw.color === '#12345680').length, 2);
                        assert.deepEqual(canvasState(canvasContext), { ...state, globalAlpha: alpha });
                        assert.equal(bitmap.outlineColor, ColorManager.outlineColor());
                        assert.equal(bitmap.outlineWidth, 3);
                        assert.equal(stack.length, 0);
                    }
                }
            `);
        });

        for (const all of [true, false]) {
            test(`NRP ${shadowOrder}, All=${all}, outline=${defaultOutline}: other fonts retain native rendering`, () => {
                setup({}, { shadowOrder, shadowParameters: {
                    ...noTargets, ...shadowStyle, All: String(all),
                    DrawDefaultOutline: String(defaultOutline)
                } })(`
                    for (const font of ['rmmz-numberfont', 'sans-serif']) {
                        bitmap.fontFace = font;
                        for (const flag of [false, true]) {
                            for (const opacity of [0, 64, 160, 255]) {
                                for (const align of ['left', 'center', 'right']) {
                                    bitmap.setMessageShadow(flag);
                                    bitmap.paintOpacity = opacity;
                                    draws.length = 0;
                                    const state = canvasState(canvasContext);
                                    const enabled = ${all} || flag;
                                    assert.equal(bitmap.measureTextWidth('123'), 84);
                                    assert.equal(bitmap.drawText('123', 10, 0, 40, 36, align), undefined);
                                    const x = align === 'right' ? 50 : align === 'center' ? 30 : 10;
                                    const base = { text: '123', x, y: 28, maxWidth: 40, align };
                                    const expected = [];
                                    if (!enabled || ${defaultOutline}) {
                                        expected.push({ ...base, kind: 'outline', alpha: 1,
                                            color: bitmap.outlineColor, lineWidth: 3 });
                                    }
                                    if (enabled) {
                                        expected.push({ ...base, kind: 'outline', alpha: 1,
                                            x: x - 3, y: 34, color: '#12345680', lineWidth: 5 });
                                    }
                                    expected.push({ ...base, kind: 'body', alpha: opacity / 255,
                                        color: bitmap.textColor });
                                    assert.deepEqual(draws, expected);
                                    assert.equal(bitmap._isMessageShadow, enabled);
                                    assert.equal(bitmap.outlineColor, ColorManager.outlineColor());
                                    assert.equal(bitmap.outlineWidth, 3);
                                    assert.deepEqual(canvasState(canvasContext), state);
                                    assert.equal(stack.length, 0);
                                }
                            }
                        }
                    }
                `);
            });
        }
    }

    for (const target of [null, 'AllWindows', 'MessageWindow', 'NameWindow', 'StatusName', 'StatusGauges']) {
        test(`NRP ${shadowOrder}, All=false, target=${target}: real window/sprite bitmap creation`, () => {
            setup({}, { shadowOrder, shadowParameters: {
                ...noTargets, ...shadowStyle, DrawDefaultOutline: 'false',
                ...(target ? { [target]: 'true' } : {})
            } })(`
                const target = ${JSON.stringify(target)};
                for (const type of [Window_Base, Window_Message, Window_NameBox, Window_Command]) {
                    const win = Object.create(type.prototype);
                    win.innerWidth = 240;
                    win.innerHeight = 72;
                    const enabled = target === 'AllWindows' ||
                        (target === 'MessageWindow' && type === Window_Message) ||
                        (target === 'NameWindow' && type === Window_NameBox);
                    // Exercise the actual createContents and recreate/destroy paths.
                    for (let i = 0; i < 2; i++) {
                        win.createContents();
                        assert.equal(win.contents._isMessageShadow, enabled ? true : undefined);
                        assert.equal(win.contentsBack._isMessageShadow, undefined);
                        checkShadowGlyphs(win.contents, { enabled, defaultOutline: false });
                        assert.equal(win.contents._isMessageShadow, enabled ? true : undefined);
                    }
                }
                for (const [type, flag] of [[Sprite_Name, 'StatusName'], [Sprite_Gauge, 'StatusGauges']]) {
                    const sprite = Object.create(type.prototype);
                    sprite.createBitmap();
                    const enabled = target === flag;
                    assert.equal(sprite.bitmap._isMessageShadow, enabled ? true : undefined);
                    sprite.bitmap.fontFace = $gameSystem.mainFontFace();
                    sprite.bitmap.fontSize = $gameSystem.mainFontSize();
                    checkShadowGlyphs(sprite.bitmap, { enabled, defaultOutline: false });
                    assert.equal(sprite.bitmap._isMessageShadow, enabled ? true : undefined);
                }
            `);
        });
    }
}