const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const plugin = fs.readFileSync(path.join(root, 'js/plugins/EnemyNightPower.js'), 'utf8');

function setup(parameters = {}) {
    function Game_Enemy() {}
    Game_Enemy.prototype.paramBase = function(paramId) {
        return [100, 200, 30][paramId] ?? 0;
    };
    const context = vm.createContext({
        Game_Enemy,
        PluginManager: { parameters: () => parameters },
        $gameSystem: { _mapTypeDayNight: { night: false } },
        $gameSwitches: { value: () => false }
    });
    vm.runInContext(plugin, context);
    return { Enemy: context.Game_Enemy, context };
}

test('昼は元の敵ステータス、夜は設定倍率になる', () => {
    const { Enemy, context } = setup({ Multiplier: '10', NightSwitch: '0' });
    const enemy = new Enemy();
    assert.equal(enemy.paramBase(0), 100);
    context.$gameSystem._mapTypeDayNight.night = true;
    assert.equal(enemy.paramBase(0), 1000);
    assert.equal(enemy.paramBase(1), 2000);
});

test('倍率を設定値に変更できる', () => {
    const { Enemy, context } = setup({ Multiplier: '1.5', NightSwitch: '0' });
    context.$gameSystem._mapTypeDayNight.night = true;
    assert.equal(new Enemy().paramBase(0), 150);
});

test('内部の昼夜状態がない場合は設定スイッチを使う', () => {
    const { Enemy, context } = setup({ Multiplier: '3', NightSwitch: '4' });
    context.$gameSystem._mapTypeDayNight = null;
    context.$gameSwitches.value = id => id === 4;
    assert.equal(new Enemy().paramBase(2), 90);
});