const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const plugin = fs.readFileSync(path.join(root, 'js/plugins/EnemySelectHitRate.js'), 'utf8');

function setup({ action, parameters = {}, withKen = false } = {}) {
    const draws = [];
    function Window_BattleEnemy() {}
    Window_BattleEnemy.prototype.itemLineRect = () => ({ x: 10, y: 20, width: 300, height: 36 });
    Window_BattleEnemy.prototype.itemPadding = () => 4;
    Window_BattleEnemy.prototype.textWidth = text => text.length * 10;
    Window_BattleEnemy.prototype.resetFontSettings = function() {};
    Window_BattleEnemy.prototype.resetTextColor = function() { this.color = 'reset'; };
    Window_BattleEnemy.prototype.changeTextColor = function(color) { this.color = color; };
    Window_BattleEnemy.prototype.drawText = function(text, x, y, width, align) {
        draws.push({ text, x, y, width, align: align || 'left', color: this.color });
    };
    Window_BattleEnemy.prototype.drawItem = function(index) {
        this.resetTextColor();
        const rect = this.itemLineRect(index);
        this.drawText(this._enemies[index].name(), rect.x, rect.y, rect.width);
    };
    if (withKen) {
        Window_BattleEnemy.prototype.drawItem = function(index) {
            const rect = this.itemLineRect(index);
            this.changeTextColor('grey');
            this.drawText(this._enemies[index].name(), rect.x, rect.y, rect.width);
        };
    }
    const context = vm.createContext({
        Window_BattleEnemy,
        Game_Action: { HITTYPE_CERTAIN: 0 },
        ColorManager: { textColor: n => `color${n}` },
        PluginManager: { parameters: () => parameters },
        BattleManager: { inputtingAction: () => action }
    });
    vm.runInContext(plugin, context, { filename: 'EnemySelectHitRate.js' });
    const win = new context.Window_BattleEnemy();
    win._enemies = [{ name: () => 'スライム', eva: 0.2 }, { name: () => 'ゴブリン', eva: 0 }];
    return { win, draws, context };
}

const physicalAction = (hitType = 1) => ({
    item: () => ({ hitType }),
    itemHit: () => 0.95,
    itemEva: enemy => enemy.eva
});

test('draws the hit rate right-aligned next to the enemy name', () => {
    const { win, draws } = setup({ action: physicalAction() });
    win.drawItem(0);
    assert.equal(draws.length, 2);
    // 0.95 * (1 - 0.2) = 0.76 -> 76%
    assert.deepEqual(draws[1], { text: '76%', x: 280, y: 20, width: 30, align: 'right', color: 'color0' });
    assert.equal(draws[0].text, 'スライム');
    assert.equal(draws[0].width, 300 - 30 - 4, 'name width is reduced by the rate width and padding');
    assert.equal(win._hitRateReserve, 0);
    assert.equal(win.color, 'reset');
});

test('rate differs per enemy based on evasion', () => {
    const { win, draws } = setup({ action: physicalAction() });
    win.drawItem(1);
    assert.equal(draws[1].text, '95%');
});

test('prefers RIT_HitRateDisplay getHitRateInfo when present', () => {
    const action = physicalAction();
    action.getHitRateInfo = () => ({ type: 'physical', finalRate: 42 });
    const { draws, win } = setup({ action });
    win.drawItem(0);
    assert.equal(draws[1].text, '42%');
});

test('falls back to the normal drawing when no action is being input', () => {
    const { win, draws } = setup({ action: null });
    win.drawItem(0);
    assert.equal(draws.length, 1);
    assert.equal(draws[0].width, 300);
});

test('ShowCertainHit=false hides the rate for certain-hit items', () => {
    const { win, draws } = setup({ action: physicalAction(0), parameters: { ShowCertainHit: 'false' } });
    win.drawItem(0);
    assert.equal(draws.length, 1);
});

test('custom format and color parameters are applied', () => {
    const { win, draws } = setup({ action: physicalAction(), parameters: { Format: '命中%1%', TextColor: '6' } });
    win.drawItem(1);
    assert.equal(draws[1].text, '命中95%');
    assert.equal(draws[1].color, 'color6');
});

test('keeps KEN_ForcedTargetState greyed names while appending the rate', () => {
    const { win, draws } = setup({ action: physicalAction(), withKen: true });
    win.drawItem(0);
    assert.equal(draws[0].color, 'grey');
    assert.equal(draws[0].width, 266);
    assert.equal(draws[1].text, '76%');
});
