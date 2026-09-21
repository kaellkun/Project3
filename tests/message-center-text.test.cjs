const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const plugin = fs.readFileSync(
    path.join(root, 'js/plugins/Message/CenterText.js'),
    'utf8'
);

function createWindow({ faceName = '' } = {}) {
    const context = vm.createContext({});
    vm.runInContext(`
        const PluginManager = { parameters: () => ({ DefaultAlignment: 'center' }) };
        const Window_Base = function() {};
        Window_Base.prototype.processEscapeCharacter = function() {};
        Window_Base.prototype.textSizeEx = function() { return { width: 100 }; };
        Window_Base.prototype.resetFontSettings = function() {};
        const Window_Message = function() {};
        Window_Message.prototype = Object.create(Window_Base.prototype);
        Window_Message.prototype.constructor = Window_Message;
        Window_Message.prototype.startMessage = function() {};
        Window_Message.prototype.newPage = function(textState) {
            textState.startX = textState.x;
        };
        Window_Message.prototype.processNewLine = function(textState) {
            textState.x = textState.startX;
            textState.y += textState.height;
        };
        Window_Message.prototype.processEscapeCharacter = function() {};
        const ImageManager = { standardFaceWidth: 144 };
        const $gameMessage = { faceName: () => ${JSON.stringify(faceName)} };
    `, context);
    vm.runInContext(plugin, context);
    return {
        context,
        window: vm.runInContext('new Window_Message()', context)
    };
}

test('centers a line in the message text area', () => {
    const { window } = createWindow();
    window.innerWidth = 400;
    const textState = {
        rtl: false,
        text: 'Hello',
        centerTextLineStart: 0,
        startX: 4,
        x: 4
    };

    window.updateCenterTextLinePosition(textState);

    assert.equal(textState.x, 150);
    assert.equal(textState.startX, 150);
});

test('reserves the face area when centering', () => {
    const { window } = createWindow({ faceName: 'Actor1' });
    window.innerWidth = 400;
    const textState = {
        rtl: false,
        text: 'Hello',
        centerTextLineStart: 0,
        startX: 164,
        x: 164
    };

    window.updateCenterTextLinePosition(textState);

    assert.equal(textState.x, 230);
});

test('supports left alignment and the CENTER escape code', () => {
    const { window } = createWindow();
    window.innerWidth = 400;
    const textState = {
        rtl: false,
        text: 'Hello',
        centerTextLineStart: 0,
        startX: 4,
        x: 4
    };

    window._centerTextAlignment = 'left';
    window.updateCenterTextLinePosition(textState);
    assert.equal(textState.x, 4);

    window.processEscapeCharacter('CENTER', textState);
    assert.equal(window._centerTextAlignment, 'center');
    assert.equal(textState.x, 150);
});
