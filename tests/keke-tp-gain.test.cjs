const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../js/plugins/Battle/TP/Keke_TpCustom.js'), 'utf8');
const start = source.indexOf('    //- ゲームアクション/行動使用者効果の適用(処理追加)');
const end = source.indexOf('    //- ゲームバトラー/全アクション終了時の処理(処理追加)', start);
assert.ok(start >= 0 && end > start);

function setup(tpGain, effects = [], throwOnZero = false) {
    const calls = [];
    const user = {
        tp: 10,
        tcr: 1,
        gainSilentTp(value) {
            if (throwOnZero && value === 0) throw new Error('TP hook failed');
            calls.push(value);
            this.tp += value;
        },
        gainTp(value) { this.tp += value; },
    };
    const item = { tpGain, effects };
    class Game_Action {
        subject() { return user; }
        item() { return item; }
        apply(target) {
            for (const value of item.effects) target.gainTp(value);
            this.applyItemUserEffect(target);
        }
        applyItemUserEffect() {
            user.gainSilentTp(Math.floor(item.tpGain * user.tcr));
        }
    }
    vm.runInNewContext(`(() => { const keke_tpChargeOnlyOnce = true; ${source.slice(start, end)} })()`, { Game_Action });
    return { action: new Game_Action(), user, item, calls };
}

test('得TP0の必殺技は使用者のTPを加算しない', () => {
    const { action, user, item, calls } = setup(0);
    action.apply({ gainTp() {} });
    assert.equal(user.tp, 10);
    assert.deepEqual(calls, []);
    assert.equal(item.tpGain, 0);
});

test('得TPが正のスキルは複数回適用されても1回だけ加算する', () => {
    const { action, user, item, calls } = setup(20);
    action.apply({ gainTp() {} });
    action.apply({ gainTp() {} });
    assert.equal(user.tp, 30);
    assert.deepEqual(calls, [20, 0]);
    assert.equal(item.tpGain, 20);
});

test('得TP0でも使用効果による明示的なTP回復は維持する', () => {
    const { action, user, calls } = setup(0, [40]);
    action.apply(user);
    assert.equal(user.tp, 50);
    assert.deepEqual(calls, []);
});

test('使用者効果で例外が発生しても得TPの設定を復元する', () => {
    const { action, item } = setup(5, [], true);
    assert.throws(() => action.applyItemUserEffect({}), /TP hook failed/);
    assert.equal(item.tpGain, 5);
});