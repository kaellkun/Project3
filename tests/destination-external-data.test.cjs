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

test('専用のメニューコマンドとスクロール操作を追加しない', () => {
    assert.doesNotMatch(plugin, /addCommand\(['"]行動目標/);
    assert.doesNotMatch(plugin, /setHandler\(['"]destination|processCursorMove|processTouch/);
    assert.match(plugin, /const desired = panel\.lineHeight\(\) \* 2/);
    assert.match(docs, /本文1行/);
    assert.match(docs, /専用のメニューコマンドを追加しません/);
});

test('外部JSON用の設定と操作説明をドキュメントから削除している', () => {
    assert.doesNotMatch(docs, /VisibleLines|Destinations\.json|独立ロード|外部JSON/);
    assert.match(docs, /NUUN_Destination/);
});
