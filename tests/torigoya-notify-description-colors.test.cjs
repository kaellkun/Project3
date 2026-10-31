const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(
    path.join(root, 'js/plugins/HUG/Map/TorigoyaMZ_NotifyMessage.js'),
    'utf8'
);

function createNotifyWindowPrototype() {
    const context = vm.createContext({
        ColorManager: { textColor: index => `color-${index}` },
        Graphics: { width: 816, height: 624 },
        PluginManager: {
            parameters: () => ({}),
            registerCommand() {}
        },
        SceneManager: { onSceneTerminate() {} },
        Scene_Map: class {
            createAllWindows() {}
            update() {}
        },
        Torigoya: {
            FrameTween: {
                parameter: { version: '2.1.0' },
                Group: class {
                    clear() {}
                }
            }
        },
        Window_Base: class {
            drawTextEx(text, x, y, width) {
                this.drawCalls.push({ text, x, y, width });
            }
        },
        document: { currentScript: null }
    });
    vm.runInContext('window = globalThis;', context);
    vm.runInContext(source, context);
    return context.Torigoya.NotifyMessage.Window.prototype;
}

function createWindow(prototype, description, maxWidth) {
    const window = Object.create(prototype);
    window._notifyItem = { description };
    window.contents = {
        fontSize: 24,
        textColor: 'original-color',
        fontBold: true,
        fontItalic: true
    };
    window.drawCalls = [];
    window.textWidth = text => Array.from(text).length;
    window.messageMaxWidth = () => maxWidth;
    window.descriptionFontSize = () => 14;
    return window;
}

test('description color codes are drawn as controls and excluded from wrapping width', () => {
    const prototype = createNotifyWindowPrototype();
    const window = createWindow(prototype, '\\c[24]ABCDE\\c[0]FGHI', 5);

    const layout = window.descriptionLayout();
    assert.deepEqual(Array.from(layout.lines), ['\\c[24]ABCDE\\c[0]', 'FGHI']);
    assert.equal(layout.width, 5);

    window.drawDescription({ x: 8, y: 3, height: 10 });
    assert.deepEqual(
        window.drawCalls.map(call => call.text),
        ['\\c[24]ABCDE\\c[0]', 'FGHI']
    );
    assert.equal(window.drawCalls[0].x, 8);
    assert.equal(window.drawCalls[1].y, 3 + 10 + 2 + 17.5);
    assert.equal(window.contents.fontSize, 24);
    assert.equal(window.contents.textColor, 'original-color');
    assert.equal(window.contents.fontBold, true);
    assert.equal(window.contents.fontItalic, true);
});

test('description truncation preserves color tags and adds an ellipsis', () => {
    const prototype = createNotifyWindowPrototype();
    const window = createWindow(prototype, 'ABCDEFGHIJKLM\\c[7]NOPQRST', 5);

    const layout = window.descriptionLayout();
    assert.equal(layout.lines.length, 3);
    assert.equal(layout.lines[2], 'KLM\\c[7]N…');
});
