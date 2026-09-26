const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plugin = read('js/plugins/Menu/DestinationExternalData.js');
const docs = read('docs/destination-external-data.md');

test('行動目標はNUUN設定を使い、外部JSONを読み込まない', () => {
    assert.match(plugin, /NUUN_Destinationの設定を使用します/);
    assert.doesNotMatch(plugin, /loadDataFile|onXhrLoad|\$dataDestinationExternal|Destinations\.json/);
    assert.doesNotMatch(plugin, /DataManager\.loadDatabase|DataManager\.isDatabaseLoaded/);
});

test('アドオンのコマンドはNUUNの保存先を更新する', () => {
    assert.match(plugin, /PluginManager\.registerCommand\(pluginName, 'SetDestination', setDestination\)/);
    assert.match(plugin, /PluginManager\.registerCommand\(fullName, 'SetDestination', setDestination\)/);
    assert.match(plugin, /PluginManager\.registerCommand\(pluginName, 'ClearDestination', clearDestination\)/);
    assert.match(plugin, /\$gameSystem\.setDestinationId\(Number\(args\.id \|\| 0\)\)/);
    assert.match(plugin, /\$gameSystem\.setDestinationId\(0\)/);
});

test('専用のメニューコマンドとスクロール操作を追加しない', () => {
    assert.doesNotMatch(plugin, /addCommand\(['"]行動目標/);
    assert.doesNotMatch(plugin, /setHandler\(['"]destination|processCursorMove|processTouch/);
    assert.match(plugin, /const desired = panel\.lineHeight\(\) \* 2/);
    assert.match(docs, /本文1行/);
    assert.match(docs, /専用のメニューコマンドを追加しません/);
});

test('行動目標のタイトルと本文の先頭を同じ行に表示する', () => {
    assert.match(plugin, /行動目標\\x1bC\[0\] \$\{this\._resolvedText\}/);
});

test('外部JSON用の設定と操作説明をドキュメントから削除している', () => {
    assert.doesNotMatch(docs, /VisibleLines|Destinations\.json|独立ロード|外部JSON/);
    assert.match(docs, /NUUN_Destination/);
    assert.match(docs, /DestinationExternalData:SetDestination/);
    assert.match(docs, /DestinationExternalData:ClearDestination/);
});

function loadDestinationPlugins(variableId) {
    const commands = new Map();
    const values = new Map();
    const changes = [];
    class Game_System {
        onAfterLoad() { this.loaded = true; }
    }
    class Window_Base {}
    class Scene_Menu {}
    const context = {
        Game_System, Window_Base, Scene_Menu, NUUN_Base_Ver: 140,
        $gameVariables: {
            value: id => values.get(id) || 0,
            setValue(id, value) { values.set(id, value); changes.push([id, value]); },
        },
        PluginManager: {
            parameters(name) {
                return name === 'Menu/DestinationExternalData'
                    ? { DestinationIdVariableId: String(variableId) } : {};
            },
            registerCommand(name, command, handler) { commands.set(`${name}:${command}`, handler); },
        },
        DataManager: { nuun_structureData: () => [] },
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(read('js/plugins/Menu/NUUN_Destination.js'), context);
    vm.runInContext(plugin, context);
    context.$gameSystem = new Game_System();
    return { context, commands, values, changes };
}

test('設定した変数にNUUN・アドオンの変更と解除を反映する', () => {
    const { context, commands, values, changes } = loadDestinationPlugins(12);
    commands.get('Menu/NUUN_Destination:SetDestination')({ id: '2' });
    assert.equal(context.$gameSystem.getDestinationId(), 2);
    assert.equal(values.get(12), 2);
    commands.get('Menu/DestinationExternalData:SetDestination')({ id: '1' });
    assert.equal(values.get(12), 1);
    context.$gameSystem.setDestinationId(3);
    assert.equal(values.get(12), 3);
    commands.get('Menu/DestinationExternalData:ClearDestination')();
    assert.equal(values.get(12), 0);
    context.$gameSystem.setDestinationId(0);
    assert.deepEqual(changes, [[12, 2], [12, 1], [12, 3], [12, 0]]);
});

test('既存セーブのロード後は保存されたIDで変数を同期する', () => {
    const { context, values } = loadDestinationPlugins(8);
    context.$gameSystem._destinationId = 2;
    values.set(8, 99);
    context.$gameSystem.onAfterLoad();
    assert.equal(context.$gameSystem.loaded, true);
    assert.equal(values.get(8), 2);
    context.$gameSystem._destinationId = 0;
    context.$gameSystem.onAfterLoad();
    assert.equal(values.get(8), 0);
});

test('変数番号0では同期せず、未設定時の既存動作を維持する', () => {
    const { context, changes } = loadDestinationPlugins(0);
    context.$gameSystem.setDestinationId(1);
    context.$gameSystem.onAfterLoad();
    assert.equal(context.$gameSystem.getDestinationId(), 1);
    assert.deepEqual(changes, []);
});
