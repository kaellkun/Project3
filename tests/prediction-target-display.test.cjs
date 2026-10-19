const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(
    path.join(root, 'js/plugins/Battle/Enemy/Keke_PredictionSystem.js'), 'utf8'
);
const functionStart = source.indexOf('    function getSkillName(action, battler) {');
const functionEnd = source.indexOf('\n    function makeActText', functionStart);
assert.ok(functionStart >= 0 && functionEnd > functionStart, 'target display functions must exist');
const helperSource = source.slice(functionStart, functionEnd);

function loadGetSkillName(targets) {
    const context = vm.createContext({
        dataToBattler: data => targets[data.index],
        getPredictionCfg: (_battler, _key, _defaultValue, action) => action.displayName || ''
    });
    vm.runInContext(helperSource, context);
    return context.getSkillName;
}

function makeAction() {
    return {
        item: () => ({ name: '攻撃' }),
        itemHit: () => 0.9,
        itemEva: target => target.eva
    };
}

function makeBattler(action, targetIndexes) {
    return {
        _actions: [action],
        _targetsFastKe: {
            lists: [targetIndexes.map(index => ({ index }))]
        }
    };
}

test('predicted target names and target-specific hit-rate range are appended to skill name', () => {
    const targets = [
        { name: () => 'アクターA', eva: 0.1, isAlive: () => true },
        { name: () => 'アクターB', eva: 0.4, isAlive: () => true }
    ];
    const action = makeAction();
    const getSkillName = loadGetSkillName(targets);

    assert.equal(
        getSkillName(action, makeBattler(action, [0, 1])),
        '攻撃（対象: アクターA、アクターB 命中率: 54〜81%）'
    );
});

test('same hit rates use a single value and duplicate targets are listed once', () => {
    const targets = [
        { name: () => 'アクターA', eva: 0, isAlive: () => true }
    ];
    const action = makeAction();
    const getSkillName = loadGetSkillName(targets);

    assert.equal(
        getSkillName(action, makeBattler(action, [0, 0])),
        '攻撃（対象: アクターA 命中率: 90%）'
    );
});

test('custom skill label and RIT hit-rate result are preserved', () => {
    const targets = [
        { name: () => 'アクターA', eva: 0.5, isAlive: () => true }
    ];
    const action = makeAction();
    action.displayName = '特殊攻撃';
    action.getHitRateInfo = () => ({ finalRate: 37 });

    assert.equal(
        loadGetSkillName(targets)(action, makeBattler(action, [0])),
        '特殊攻撃（対象: アクターA 命中率: 37%）'
    );
});

test('missing predicted targets leave the skill name unchanged', () => {
    const action = makeAction();
    const getSkillName = loadGetSkillName([]);

    assert.equal(getSkillName(action, makeBattler(action, [])), '攻撃');
});
