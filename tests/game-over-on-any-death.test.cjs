const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const plugin = fs.readFileSync(path.join(root, 'js/plugins/GameOverOnAnyDeath.js'), 'utf8');

function setup(memberStates) {
    const members = memberStates.map(isDead => ({ isDead: () => isDead }));
    const context = vm.createContext({
        $gameParty: {
            members: () => members,
            isAllDead: () => members.every(member => member.isDead())
        },
        BattleManager: {
            _phase: 'turn',
            baseChecks: 0,
            defeats: 0,
            checkBattleEnd() {
                this.baseChecks++;
                return false;
            },
            processDefeat() {
                this.defeats++;
            },
            updateBattleEnd() {
                this.baseUpdate = true;
            }
        },
        SceneManager: {
            destinations: [],
            goto(scene) {
                this.destinations.push(scene);
            }
        },
        Scene_Gameover: function Scene_Gameover() {},
        Scene_Base: function Scene_Base() {}
    });
    context.Scene_Base.prototype.checkGameover = function() {
        this.baseChecks = (this.baseChecks || 0) + 1;
    };
    vm.runInContext(plugin, context, { filename: 'GameOverOnAnyDeath.js' });
    return context;
}

test('a single fallen battle member starts the normal defeat flow', () => {
    const context = setup([false, true]);

    assert.equal(context.$gameParty.isAllDead(), false, 'the base all-dead rule remains unchanged');
    assert.equal(context.BattleManager.checkBattleEnd(), true);
    assert.equal(context.BattleManager.defeats, 1);
    assert.equal(context.BattleManager.baseChecks, 0);

    context.BattleManager.updateBattleEnd();
    assert.deepEqual(context.SceneManager.destinations, [context.Scene_Gameover]);
    assert.equal(context.BattleManager._phase, '');
});

test('living battle members preserve the original battle-end check', () => {
    const context = setup([false, false]);

    assert.equal(context.BattleManager.checkBattleEnd(), false);
    assert.equal(context.BattleManager.baseChecks, 1);
    assert.equal(context.BattleManager.defeats, 0);
});

test('a single fallen member on the map opens the game-over scene', () => {
    const context = setup([false, true]);
    const scene = new context.Scene_Base();

    scene.checkGameover();
    assert.deepEqual(context.SceneManager.destinations, [context.Scene_Gameover]);
    assert.equal(scene.baseChecks, undefined);
});