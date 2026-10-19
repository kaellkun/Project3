const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pluginName = 'Message/MessageWindowPosition';

function setup() {
    const context = vm.createContext({ assert });
    const run = code => vm.runInContext(code, context);
    const core = read('js/rmmz_core.js');
    run(core.slice(0, core.indexOf('function Graphics()')));
    run(core.slice(core.indexOf('function JsonEx()')));
    const managers = read('js/rmmz_managers.js');
    run(managers.slice(managers.indexOf('function PluginManager()')));
    run(read('js/rmmz_objects.js'));
    run(read(`js/plugins/${pluginName}.js`));
    run(`
        const window = globalThis;
        const Graphics = { frameCount: 0 };
        const SceneManager = { isSceneChanging: () => false };
        const ImageManager = { loadFace() {}, loadPicture() {} };
        const $gameMap = { mapId: () => 1 };
        const $gameMessage = new Game_Message();
        const $dataCommonEvents = [null];
        const end = { code: 0, indent: 0, parameters: [] };
        function text(position) {
            return [
                { code: 101, indent: 0, parameters: ['Actor1', 2, 1, position, 'Speaker'] },
                { code: 401, indent: 0, parameters: ['Hello'] }
            ];
        }
        function setPosition(position) {
            return { code: 357, indent: 0, parameters: [
                '${pluginName}', 'SetPosition', 'メッセージ表示位置の一括指定',
                { Position: position }
            ] };
        }
        function common(id) {
            return { code: 117, indent: 0, parameters: [id] };
        }
        function event(commands = []) {
            const interpreter = new Game_Interpreter();
            interpreter.setup([...commands, end], 1);
            return interpreter;
        }
        function command(interpreter, position) {
            PluginManager.callCommand(interpreter, 'MessageWindowPosition', 'SetPosition',
                { Position: position });
        }
        function show(interpreter, position) {
            $gameMessage.clear();
            const list = text(position);
            interpreter._list = [...list, end];
            interpreter._index = 0;
            assert.equal(interpreter.command101(list[0].parameters), true);
            return $gameMessage.positionType();
        }
    `);
    return run;
}

test('plugin is enabled and exposes the three position options', () => {
    const context = {};
    vm.runInNewContext(read('js/plugins.js'), context);
    const entries = context.$plugins.filter(plugin => plugin.name === pluginName);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].status, true);
    const source = read(`js/plugins/${pluginName}.js`);
    assert.match(source, /@command SetPosition\b/);
    assert.match(source, /@arg Position\b/);
    for (const value of ['top', 'bottom', 'event']) {
        assert.match(source, new RegExp(`@value ${value}\\b`));
    }
});

test('default and released mode preserve all event positions', () => {
    setup()(`
        const interpreter = event();
        for (const position of [0, 1, 2]) {
            assert.equal(show(interpreter, position), position);
        }
        command(interpreter, 'top');
        command(interpreter, 'event');
        for (const position of [0, 1, 2]) {
            assert.equal(show(interpreter, position), position);
        }
    `);
});

for (const [mode, expected] of [['top', 0], ['bottom', 2]]) {
    test(`${mode} overrides every original position across multiple messages`, () => {
        setup()(`
            const interpreter = event();
            command(interpreter, '${mode}');
            for (const position of [0, 1, 2, 2, 0]) {
                assert.equal(show(interpreter, position), ${expected});
                assert.equal($gameMessage.faceName(), 'Actor1');
                assert.equal($gameMessage.faceIndex(), 2);
                assert.equal($gameMessage.background(), 1);
                assert.equal($gameMessage.speakerName(), 'Speaker');
                assert.equal($gameMessage.allText(), 'Hello');
                assert.equal(interpreter._list[0].parameters[3], position);
            }
        `);
    });
}

test('actual event commands switch modes and release them in sequence', () => {
    setup()(`
        const interpreter = event([
            setPosition('top'), ...text(2),
            setPosition('bottom'), ...text(0),
            setPosition('event'), ...text(1)
        ]);
        for (const expected of [0, 2, 1]) {
            $gameMessage.clear();
            interpreter.update();
            assert.equal($gameMessage.positionType(), expected);
        }
        $gameMessage.clear();
        interpreter.update();
        assert.equal(interpreter.isRunning(), false);
        assert.equal(interpreter._messageWindowPositionOverride, null);
    `);
});

test('a busy message remains unchanged and the pending text retries normally', () => {
    setup()(`
        const interpreter = event(text(1));
        command(interpreter, 'top');
        $gameMessage.setPositionType(2);
        $gameMessage.add('Previous message');
        const params = interpreter._list[0].parameters;
        assert.equal(interpreter.command101(params), false);
        assert.equal($gameMessage.positionType(), 2);
        assert.equal($gameMessage.allText(), 'Previous message');
        assert.equal(interpreter._index, 0);
        $gameMessage.clear();
        assert.equal(interpreter.command101(params), true);
        assert.equal($gameMessage.positionType(), 0);
        assert.equal(params[3], 1);
    `);
});

test('separate and parallel interpreters do not share overrides', () => {
    setup()(`
        const first = event();
        const second = event();
        const parallel = event();
        command(first, 'top');
        command(second, 'bottom');
        assert.equal(show(first, 2), 0);
        assert.equal(show(second, 0), 2);
        assert.equal(show(parallel, 1), 1);
        command(first, 'event');
        assert.equal(show(second, 0), 2);
        assert.equal(show(first, 2), 2);
    `);
});

test('common events inherit settings while child changes remain local', () => {
    setup()(`
        $dataCommonEvents[1] = { list: [...text(2), setPosition('bottom'),
            common(2), setPosition('event'), ...text(1), end] };
        $dataCommonEvents[2] = { list: [...text(0), end] };
        const parent = event([setPosition('top'), common(1), ...text(2)]);
        for (const expected of [0, 2, 1, 0]) {
            $gameMessage.clear();
            parent.update();
            assert.equal($gameMessage.positionType(), expected);
        }
        $gameMessage.clear();
        parent.update();
        assert.equal(parent.isRunning(), false);
    `);
});

test('event completion, exit processing and setup all reset the override', () => {
    setup()(`
        const interpreter = event([
            setPosition('top'), { code: 115, indent: 0, parameters: [] }, ...text(2)
        ]);
        interpreter.update();
        assert.equal(interpreter.isRunning(), false);
        assert.equal(interpreter._messageWindowPositionOverride, null);
        command(interpreter, 'bottom');
        interpreter.setup([...text(0), end], 1);
        interpreter.update();
        assert.equal($gameMessage.positionType(), 0);
        command(interpreter, 'top');
        interpreter.clear();
        assert.equal(interpreter._messageWindowPositionOverride, null);
    `);
});

test('choices retain their independent horizontal position and callback', () => {
    setup()(`
        const interpreter = event([
            ...text(2),
            { code: 102, indent: 0, parameters: [['Yes', 'No'], -2, 0, 1, 0] }
        ]);
        command(interpreter, 'top');
        interpreter.update();
        assert.equal($gameMessage.positionType(), 0);
        assert.equal($gameMessage.choicePositionType(), 1);
        assert.equal($gameMessage.choices().join(','), 'Yes,No');
        $gameMessage.onChoice(1);
        assert.equal(interpreter._branch[0], 1);
    `);
});

test('save serialization resumes a nested override and clears it on completion', () => {
    setup()(`
        $dataCommonEvents[1] = { list: [
            setPosition('bottom'), ...text(0), ...text(0), end
        ] };
        const parent = event([setPosition('top'), common(1), ...text(2)]);
        parent.update();
        assert.equal($gameMessage.positionType(), 2);
        const restored = JsonEx.parse(JsonEx.stringify(parent));
        for (const expected of [2, 0]) {
            $gameMessage.clear();
            restored.update();
            assert.equal($gameMessage.positionType(), expected);
        }
        $gameMessage.clear();
        restored.update();
        assert.equal(restored.isRunning(), false);
        assert.equal(restored._messageWindowPositionOverride, null);
    `);
});

test('an interpreter from an old save without the field uses event positions', () => {
    setup()(`
        const interpreter = event();
        delete interpreter._messageWindowPositionOverride;
        assert.equal(show(interpreter, 1), 1);
        interpreter.setupChild([...text(2), end], 1);
        assert.equal(show(interpreter._childInterpreter, 2), 2);
    `);
});

test('invalid position reports an error without replacing the current setting', () => {
    setup()(`
        const interpreter = event();
        command(interpreter, 'top');
        assert.throws(() => command(interpreter, 'invalid'), /Invalid Position: invalid/);
        assert.equal(show(interpreter, 2), 0);
    `);
});
