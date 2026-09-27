const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(
    path.join(root, 'js/plugins/Battle/Enemy/Keke_PredictionSystem.js'), 'utf8'
);
const functionStart = source.indexOf('function searchSpriteBattler(battler) {');
const functionEnd = source.indexOf('\n    };', functionStart);
assert.ok(functionStart >= 0 && functionEnd > functionStart, 'searchSpriteBattler function must exist');
const helperSource = source.slice(functionStart, functionEnd + '\n    };'.length);

function loadHelper(scene) {
    const context = vm.createContext({ SceneManager: { _scene: scene } });
    vm.runInContext(helperSource, context);
    return context.searchSpriteBattler;
}

test('map scene without battle sprite arrays safely returns null', () => {
    const search = loadHelper({ _spriteset: { _characterSprites: [] } });
    assert.doesNotThrow(() => assert.equal(search({ _actorId: 1 }), null));
    assert.equal(search({ _enemyId: 1 }), null);
});

test('missing scene or spriteset safely returns null', () => {
    assert.equal(loadHelper(null)({ _actorId: 1 }), null);
    assert.equal(loadHelper({})({ _actorId: 1 }), null);
});

test('battle actor/enemy sprites are still found', () => {
    const actor = { _actorId: 2 };
    const enemy = { index: () => 1 };
    const actorSprite = { _battler: actor };
    const enemySprite = { _battler: { _enemyId: 3, index: () => 1 } };
    const search = loadHelper({ _spriteset: {
        _actorSprites: [actorSprite],
        _enemySprites: [enemySprite]
    } });
    assert.equal(search(actor), actorSprite);
    assert.equal(search({ _enemyId: 9, index: () => 1 }), enemySprite);
});
