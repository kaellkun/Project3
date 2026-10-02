const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const plugin = fs.readFileSync(path.join(root, 'js/plugins/EnemySelectHitRate.js'), 'utf8');

function setup({ action, parameters = {}, withKen = false } = {}) {
    const draws = [];
    const fills = [];
    function Window_BattleEnemy() {}
    Window_BattleEnemy.prototype.itemLineRect = () => ({ x: 10, y: 20, width: 300, height: 36 });
    Window_BattleEnemy.prototype.itemRect = index => ({ x: 10, y: index * 36, width: 300, height: 36 });
    Window_BattleEnemy.prototype.itemPadding = () => 4;
    Window_BattleEnemy.prototype.refresh = function() {};
    Window_BattleEnemy.prototype.refreshCursor = function() { this.cursorRefreshed = true; };
    Window_BattleEnemy.prototype.update = function() {};
    Window_BattleEnemy.prototype.setCursorRect = function(x, y, width, height) {
        this.cursorRect = { x, y, width, height };
    };
    Window_BattleEnemy.prototype.innerWidth = 300;
    Window_BattleEnemy.prototype.innerHeight = 500;
    Window_BattleEnemy.prototype.contents = {
        fontSize: 28,
        fillRect(...args) { fills.push(args); }
    };
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
    function Scene_Battle() {}
    Scene_Battle.prototype.onSelectAction = function() { this.baseSelectActionCalled = true; };
    Scene_Battle.prototype.startEnemySelection = function() { this.enemySelectionStarted = true; };
    Scene_Battle.prototype.onEnemyOk = function() { this.baseEnemyOkCalled = true; };
    Scene_Battle.prototype.onEnemyCancel = function() { this.baseEnemyCancelCalled = true; };
    Scene_Battle.prototype.hideSubInputWindows = function() { this.subWindowsHidden = true; };
    Scene_Battle.prototype.selectNextCommand = function() { this.nextCommandSelected = true; };
    const enemies = [{ name: () => 'スライム', eva: 0.2, select() { this.selected = true; } },
        { name: () => 'ゴブリン', eva: 0, select() { this.selected = true; } }];
    Window_BattleEnemy.prototype.select = function(index) {
        this._index = index;
        context.$gameTroop.select(this._enemies[index]);
        this.refreshCursor();
    };
    const context = vm.createContext({
        Window_BattleEnemy,
        Scene_Battle,
        Game_Action: { HITTYPE_CERTAIN: 0 },
        ColorManager: { textColor: n => `color${n}`, normalColor: () => 'normal' },
        PluginManager: { parameters: () => parameters },
        BattleManager: { inputtingAction: () => action },
        Graphics: { frameCount: 22 },
        $gameTroop: {
            aliveMembers: () => enemies,
            select(enemy) { for (const member of enemies) member.selected = member === enemy; }
        }
    });
    vm.runInContext(plugin, context, { filename: 'EnemySelectHitRate.js' });
    const win = new context.Window_BattleEnemy();
    win._enemies = enemies;
    win._cursorSprite = {};
    return { win, draws, fills, context, enemies };
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

test('shows the all-enemy scope chip and shifts enemy rows below it', () => {
    const action = {
        isForOpponent: () => true,
        isForAll: () => true,
        isForRandom: () => false,
        numTargets: () => 0
    };
    const { win, draws, fills } = setup({ action });
    win.setScopePreviewMode('all');
    assert.equal(win.scopePreviewText(), '敵全体');
    assert.equal(win.itemRect(0).y, 38);
    assert.equal(fills[0][4], 'rgba(34, 104, 112, 0.88)');
    assert.ok(draws.some(draw => draw.text === '敵全体'));
});

test('shows the random target count in the scope chip', () => {
    const action = {
        isForOpponent: () => true,
        isForAll: () => false,
        isForRandom: () => true,
        numTargets: () => 3
    };
    const { win, draws } = setup({ action });
    win.setScopePreviewMode('random');
    assert.equal(win.scopePreviewText(), '敵ランダム3回');
    assert.ok(draws.some(draw => draw.text === '敵ランダム3回'));
});

test('all-target preview selects every living enemy and softly pulses the full-window cursor', () => {
    const action = {
        isForOpponent: () => true,
        isForAll: () => true,
        isForRandom: () => false,
        numTargets: () => 0
    };
    const { win, enemies, context } = setup({ action });
    win.setScopePreviewMode('all');
    win.select(0);
    win.update();
    const firstAlpha = win._cursorSprite.alpha;
    context.Graphics.frameCount += 23;
    win.update();
    assert.ok(enemies.every(enemy => enemy.selected));
    assert.deepEqual(win.cursorRect, { x: 0, y: 0, width: 300, height: 500 });
    assert.ok(win._cursorSprite.alpha >= 0.42 && win._cursorSprite.alpha <= 0.58);
    assert.notEqual(win._cursorSprite.alpha, firstAlpha, 'cursor frame opacity animates over time');
});

test('opens enemy inspection for all/random scopes and confirms without changing the target index', () => {
    for (const mode of ['all', 'random']) {
        const action = {
            isForOpponent: () => true,
            isForAll: () => mode === 'all',
            isForRandom: () => mode === 'random',
            numTargets: () => 2
        };
        const { context } = setup({ action });
        const scene = new context.Scene_Battle();
        scene._enemyWindow = new context.Window_BattleEnemy();
        scene._enemyWindow._enemies = [];
        scene.onSelectAction();
        assert.equal(scene.enemySelectionStarted, true);
        assert.equal(scene._enemyScopePreview, mode);
        assert.equal(scene.baseSelectActionCalled, undefined);
        scene.onEnemyOk();
        assert.equal(scene.baseEnemyOkCalled, undefined);
        assert.equal(scene.subWindowsHidden, true);
        assert.equal(scene.nextCommandSelected, true);
        assert.equal(scene._enemyScopePreview, null);
        assert.equal(scene._enemyWindow._scopePreviewMode, null);
    }
});

test('keeps single-opponent target selection on the standard scene flow', () => {
    const action = {
        isForOpponent: () => true,
        isForAll: () => false,
        isForRandom: () => false,
        numTargets: () => 1
    };
    const { context } = setup({ action });
    const scene = new context.Scene_Battle();
    scene._enemyWindow = new context.Window_BattleEnemy();
    scene.onSelectAction();
    assert.equal(scene.baseSelectActionCalled, true);
    assert.equal(scene.enemySelectionStarted, undefined);
    scene.onEnemyOk();
    assert.equal(scene.baseEnemyOkCalled, true);
});
