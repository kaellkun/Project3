const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { setup } = require('./preparation-effects.test.cjs');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('SE random count retargets when a queued enemy dies mid-action', () => {
    const { run } = setup({ speed: false, critical: false });
    run(`
        function Window_BattleEnemy() {}
        Window_BattleEnemy.prototype.select = function(index) { this._index = index; };
        Window_BattleEnemy.prototype.enemy = function() { return $gameTroop.members()[this._index]; };
    `);
    run(read('js/plugins/Extend/ScopeExtend.js'), 'ScopeExtend.js');
    run(`
        Math.random = () => 0;
        b.setHp(50);
        d.setHp(50);
        skill(910, { scope: 3, note: '<SEランダム回数:2>', damage: { formula: '100' } });

        const x = action(910);
        start(x);

        assert.equal(BattleManager._targets.length, 2);
        assert.equal(BattleManager._targets[0], b);
        assert.equal(BattleManager._targets[1], b);

        BattleManager.updateAction();
        assert.equal(b.isDead(), true);
        assert.equal(d.isAlive(), true);

        BattleManager.updateAction();
        assert.equal(d.isDead(), true);
    `);
});