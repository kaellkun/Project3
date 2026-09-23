const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
