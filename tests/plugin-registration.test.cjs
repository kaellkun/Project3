const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pluginDirectory = path.join(root, 'js/plugins');
const registrationFile = path.join(root, 'js/plugins.js');
const basename = name => path.posix.basename(name);

// Read only this project's installed files: no reference project, Git, or engine stubs.
function loadPlugins() {
    const context = {};
    const script = new vm.Script(fs.readFileSync(registrationFile, 'utf8'), {
        filename: registrationFile
    });
    script.runInNewContext(context, { timeout: 1000 });
    assert.ok(Array.isArray(context.$plugins), '$plugins must be an array');
    assert.ok(context.$plugins.length > 0, '$plugins must not be empty');
    return context.$plugins;
}

function registered(plugins, name) {
    const matches = plugins.filter(plugin => plugin.name === name);
    assert.equal(matches.length, 1, `${name}: must be registered exactly once`);
    return matches[0];
}

function assertBefore(plugins, before, after) {
    const first = registered(plugins, before);
    const second = registered(plugins, after);
    assert.ok(plugins.indexOf(first) < plugins.indexOf(second),
        `${before} must precede ${after}`);
}

function headerDependencies(name, tag) {
    const source = fs.readFileSync(path.join(pluginDirectory, `${name}.js`), 'utf8');
    // Restrict metadata matching to /*: (including localized) plugin headers,
    // not help examples in code, ordinary comments, or struct declarations.
    const headers = source.match(/\/\*:[\s\S]*?\*\//g) || [];
    const pattern = new RegExp(`^[ \\t]*\\*[ \\t]*@${tag}[ \\t]+([^\\s*]+)`, 'gm');
    return new Set(headers.flatMap(header =>
        Array.from(header.matchAll(pattern), match => match[1])));
}

function enabledDependency(plugins, name) {
    return plugins.find(plugin => plugin.status && (
        name.includes('/') ? plugin.name === name : basename(plugin.name) === name
    ));
}

test('plugins.js compiles and loads registration data in an isolated VM', () => {
    for (const plugin of loadPlugins()) {
        assert.equal(typeof plugin.name, 'string');
        assert.ok(plugin.name.length > 0);
        assert.equal(typeof plugin.status, 'boolean', plugin.name);
        assert.ok(plugin.parameters && typeof plugin.parameters === 'object', plugin.name);
        assert.equal(Array.isArray(plugin.parameters), false, plugin.name);
    }
});

test('every registered path exists, including disabled plugins', () => {
    for (const { name } of loadPlugins()) {
        assert.ok(!path.posix.isAbsolute(name) && !name.includes('\\') &&
            name.split('/').every(part => part && part !== '.' && part !== '..'), name);
        const file = path.join(pluginDirectory, `${name}.js`);
        assert.ok(fs.existsSync(file), `Missing plugin: ${name}`);
        assert.ok(fs.statSync(file).isFile(), `Not a file: ${name}`);
    }
});

test('registration names are unique', () => {
    const names = loadPlugins().map(plugin => plugin.name);
    assert.equal(new Set(names).size, names.length, 'Duplicate registration name');
});

test('enabled plugin basenames are unique across directories', () => {
    const seen = new Map();
    for (const plugin of loadPlugins().filter(plugin => plugin.status)) {
        const name = basename(plugin.name);
        assert.ok(!seen.has(name), `${plugin.name} conflicts with ${seen.get(name)}`);
        seen.set(name, plugin.name);
    }
});

test('all non-Archive plugin JavaScript files are registered recursively', () => {
    const names = new Set(loadPlugins().map(plugin => plugin.name));
    const missing = fs.readdirSync(pluginDirectory, { recursive: true })
        .map(file => file.split(path.sep).join('/'))
        .filter(file => file.endsWith('.js') && !file.split('/').includes('Archive'))
        .filter(file => fs.statSync(path.join(pluginDirectory, file)).isFile())
        .map(file => file.slice(0, -3))
        .filter(name => !names.has(name));
    assert.deepEqual(missing.sort(), [], 'Unregistered non-Archive plugins');
});

test('every enabled plugin @base is enabled and registered earlier', () => {
    const plugins = loadPlugins();
    for (const plugin of plugins.filter(plugin => plugin.status)) {
        for (const name of headerDependencies(plugin.name, 'base')) {
            const dependency = enabledDependency(plugins, name);
            assert.ok(dependency, `${plugin.name}: missing or disabled @base ${name}`);
            assertBefore(plugins, dependency.name, plugin.name);
        }
    }
});

test('optional @orderAfter is respected when both plugins are enabled', () => {
    const plugins = loadPlugins();
    for (const plugin of plugins.filter(plugin => plugin.status)) {
        for (const name of headerDependencies(plugin.name, 'orderAfter')) {
            const dependency = enabledDependency(plugins, name);
            // Optional dependencies may be absent or disabled; @base is tested separately.
            if (dependency) assertBefore(plugins, dependency.name, plugin.name);
        }
    }
});

// The 31 additions are a required subset, not a fixed total registration count.
// Pin representative settings locally without depending on the import source.
const additions = [
    ['State/NUUN_StateTurnCount', true, { StateTurnReset: 'false' }],
    ['HUG/DarkPlasma_AutoLineBreak', false],
    ['Menu/NUUN_Destination', true],
    ['Skill/NRP_ChainSkill', true, { NoMpTpCost: 'true', ImmortalState: '3' }],
    ['Skill/NUUN_PassiveSkill', true, { PassiveSkillType: '3', EquipScreenCacheEnabled: 'true' }],
    ['Extend/DarkPlasma_CertainHitAction', false],
    ['Equip/DarkPlasma_ClearEquip', true, { clearEquipWhenMemberIsOut: 'true' }],
    ['Equip/NRP_EquipSlot', true, { AdjustInitEquip: 'true', DualWieldPosition: '2' }],
    ['State/NUUN_AddStateDeviation', true, { AddNormalStateMode: '1' }],
    ['State/NUUN_StateBuffTurnPlus', false],
    ['State/StateAddMZ', true, { outOfTargets: '[]' }],
    ['Skill/NUUN_SkillCostEX', true],
    ['Skill/NUUN_SkillCostShowEX', true, { CostWidth: '000', Connection: '/', CostFontSize: '20' }],
    ['NRP_BattleEventEXMZ', false],
    ['Extend/Keke_ElementFullCustom', true, { '属性計算順': '加算先', '複数属性計算法': '合算' }],
    ['Extend/ScopeExtend', true],
    ['Item/MNKR_ItemLimitActor', true],
    ['Skill/NRP_Substitute', true, { CoverDefaultSubstitute: 'true', SubstituteHpRate: '100' }],
    ['Encount/LL_EncounterAdjust', true, { encountRate: '0' }],
    ['Extend/DrainExtend', true, { recoverSe: 'false' }],
    ['HUG/Map/Sakura_FreeKeyboardGuide', true, { GlobalHideSwitch: '0', FontSize: '14' }],
    ['HUG/Map/MapNameExtend', true, { positionY: '260', width: '816', showWindow: 'true' }],
    ['HUG/Map/CenteredMapName', false],
    ['Menu/DescriptionExtend', true, {
        swapDescription: 'false', helpLines: '3', helpLinesByScene: '[]', validSwitch: '0'
    }],
    ['HUG/NRP_MessageShadow', true, { DrawDefaultOutline: 'true', AllWindows: 'true' }],
    ['Menu/Keke_MenuComfortable', false],
    ['Extend/CustomizeCritical', true, { commonFormula: 'normalDamage * 1.25', suppressDefault: 'false' }],
    ['State/KeepHp1ByGuts', true, { validAtHp1: 'true', gutsLimit: '1', gutsRateFormula: '0' }],
    ['State/NUUN_SlipDamageEX', false, { ShowBattleLog: 'true', PopupDelay: '8' }],
    ['State/SlipDamageEX', false],
    ['State/Keke_SlipCustom', false]
];

for (const [name, enabled, parameters = {}] of additions) {
    test(`import registration and representative parameters: ${name}`, () => {
        const plugin = registered(loadPlugins(), name);
        assert.equal(plugin.status, enabled, `${name}: enabled status`);
        for (const [key, value] of Object.entries(parameters)) {
            assert.equal(plugin.parameters[key], value, `${name}: ${key}`);
        }
    });
}

test('NRP_EquipSlot retains the eleven reference equipment slots', () => {
    const { parameters } = registered(loadPlugins(), 'Equip/NRP_EquipSlot');
    assert.deepEqual(JSON.parse(parameters.DefaultEquipSlots),
        ['1', '1', '4', '3', '2', '5', '5', '5', '5', '5', '5']);
    assert.deepEqual(JSON.parse(parameters.StatusShowSlots), ['0']);
});

test('only the Battle slip implementation is enabled', () => {
    const plugins = loadPlugins();
    assert.equal(registered(plugins, 'Battle/Slip/Keke_SlipCustom').status, true);
    for (const name of ['State/Keke_SlipCustom', 'State/SlipDamageEX', 'State/NUUN_SlipDamageEX']) {
        assert.equal(registered(plugins, name).status, false, name);
    }
});

test('Keke_TpCustom charges damage TP only once per action', () => {
    const { parameters } = registered(loadPlugins(), 'Battle/TP/Keke_TpCustom');
    assert.equal(parameters['TPチャージ1回だけ'], 'true');
});

test('MobileTouchControls disables diagonal movement in the project configuration', () => {
    const plugin = registered(loadPlugins(), 'MobileTouchControls');
    assert.equal(plugin.status, true);
    assert.equal(plugin.parameters.EnableDiagonalMovement, 'false');
});

test('BattleEquipCommand is enabled and ChangeEquipOnBattleMZ is not registered', () => {
    const plugins = loadPlugins();
    assert.equal(registered(plugins, 'BattleEquipCommand').status, true);
    assert.ok(!plugins.some(plugin => basename(plugin.name) === 'ChangeEquipOnBattleMZ'),
        'ChangeEquipOnBattleMZ must remain unregistered, not merely disabled');
});

for (const [before, after] of [
    ['State/NUUN_StateTurnCount', 'State/NUUN_SlipDamageEX'],
    ['Skill/NUUN_SkillCostEX', 'Skill/NUUN_SkillCostShowEX'],
    ['Menu/DescriptionExtend', 'HelpWindowThreeLines'],
    ['Skill/NUUN_PassiveSkill', 'Battle/TP/Keke_TpCustom']
]) {
    test(`integration load order: ${before} before ${after}`, () => {
        const plugins = loadPlugins();
        assert.equal(registered(plugins, before).status, true, before);
        // NUUN_SlipDamageEX intentionally stays OFF, but retains its dependency order.
        if (after !== 'State/NUUN_SlipDamageEX') {
            assert.equal(registered(plugins, after).status, true, after);
        }
        assertBefore(plugins, before, after);
    });
}

const urlCompatiblePlugins = [
    'Equip/DarkPlasma_ClearEquip',
    'HUG/DarkPlasma_AutoLineBreak',
    'Extend/Keke_ElementFullCustom',
    'Menu/Keke_MenuComfortable',
    'State/Keke_SlipCustom'
];

function pluginNameDeclaration(name) {
    const source = fs.readFileSync(path.join(pluginDirectory, `${name}.js`), 'utf8');
    // Extract only the actual name declaration. DarkPlasma's replace callback
    // has its own return semicolon, so stopping at the first ';' is incorrect.
    const declarations = source.match(
        /^[ \t]*const[ \t]+pluginName[ \t]*=[ \t]*document\.currentScript[^\r\n]*(?:\r?\n[ \t]*return[^\r\n]*\r?\n[ \t]*\}\);)?/gm
    ) || [];
    assert.equal(declarations.length, 1, `${name}: expected one currentScript name declaration`);
    const declaration = declarations[0].trim();
    assert.ok(declaration.endsWith(';'), `${name}: incomplete name declaration`);
    return new vm.Script(`${declaration}\npluginName;`, { filename: `${name}.js (name only)` });
}

for (const name of urlCompatiblePlugins) {
    for (const prefix of ['http://localhost:8765/game/', 'file:///tmp/game%20project/']) {
        for (const suffix of ['', '?v=boot-123', '#fragment', '?v=boot-123#fragment']) {
            const src = `${prefix}js/plugins/${name}.js${suffix}`;
            test(`currentScript basename: ${src}`, () => {
                const script = pluginNameDeclaration(name);
                // No plugin body or fake RPG Maker classes are evaluated.
                const actual = script.runInNewContext({
                    document: { currentScript: { src } }
                }, { timeout: 1000 });
                assert.equal(actual, basename(name));
            });
        }
    }
}