const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

const context = vm.createContext({ console, assert });
vm.runInContext(read('js/rmmz_core.js').split('function Utils()')[0], context);
vm.runInContext(read('js/rmmz_managers.js').split('function ConfigManager()')[0], context);
vm.runInContext(read('js/rmmz_objects.js'), context);

context.$dataItems = [null, { id: 1, name: 'テストアイテム', iconIndex: 0 }];
context.$dataWeapons = [];
context.$dataArmors = [];
context.$gameMap = { requestRefresh() {} };

const item = context.$dataItems[1];

test('party inventory supports up to 9999 items', () => {
    const party = new context.Game_Party();
    party.gainItem(item, 9999);

    assert.equal(party.maxItems(item), 9999);
    assert.equal(party.numItems(item), 9999);
    assert.equal(party.hasMaxItems(item), true);

    party.gainItem(item, 1);
    assert.equal(party.numItems(item), 9999);

    party.gainItem(item, -1);
    assert.equal(party.numItems(item), 9998);
});
