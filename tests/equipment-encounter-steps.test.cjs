const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const data = name => JSON.parse(read(`data/${name}.json`));

function setup({ equipped = false, dispersion = '0' } = {}) {
    const context = vm.createContext({ console });
    const run = source => vm.runInContext(source, context);
    run(read('js/rmmz_core.js').split('function Utils()')[0]);
    run(read('js/rmmz_managers.js').split('function ConfigManager()')[0]);
    run(read('js/rmmz_objects.js'));
    for (const name of ['Actors', 'Classes', 'Items', 'Weapons', 'Armors', 'Skills', 'System', 'Tilesets']) {
        context[`$data${name}`] = data(name);
    }
    for (const group of [context.$dataWeapons, context.$dataArmors, context.$dataSkills]) {
        for (const item of group.filter(Boolean)) context.DataManager.extractMetadata(item);
    }
    context.$dataMap = data('Map001');
    context.PluginManager = { parameters: () => ({ encountRate: dispersion }) };
    context.$gameVariables = { _data: [] };
    context.$gameTemp = { isPlaytest: () => false };
    context.Input = { isPressed: () => false };
    context.$gameSystem = { isEncounterEnabled: () => true };
    context.$gameMap = {
        encounterStep: () => context.$dataMap.encounterStep,
        isBush: () => false,
        mapId: () => 1,
        requestRefresh() {}
    };
    context.$gameParty = new context.Game_Party();
    const actors = [1, 2].map(() => {
        const actor = Object.create(context.Game_Actor.prototype);
        actor._skills = [];
        actor._paramPlus = Array(8).fill(0);
        actor._equips = [];
        actor.traitObjects = () => actor.equips().filter(Boolean);
        return actor;
    });
    context.$gameParty.allMembers = () => actors;
    const boots = context.$dataArmors[208];
    const equip = (index, item) => {
        actors[index]._equips = item ? [{ object: () => item }] : [];
    };
    if (equipped) equip(1, boots);
    run('Math.randomInt = () => 0;');
    run(read('js/plugins/Encount/LL_EncounterAdjust.js'));
    run(read('js/plugins/EquipmentEncounterSteps.js'));
    const player = Object.create(context.Game_Player.prototype);
    player._vehicleType = 'walk';
    context.$gamePlayer = player;
    player.makeEncounterCount();
    return { context, run, player, actors, boots, equip };
}

test('boots add exactly two to the existing countdown, regardless of wearer', () => {
    const { player, equip, boots } = setup();
    assert.equal(player._encounterCount, 2);
    for (const member of [0, 1]) {
        equip(0, null);
        equip(1, null);
        equip(member, boots);
        player.makeEncounterCount();
        assert.equal(player._encounterCount, 4);
    }
    equip(0, boots);
    player.makeEncounterCount();
    assert.equal(player._encounterCount, 4, 'multiple wearers must not stack');
    for (let i = 0; i < 4; i++) {
        player.updateEncounterCount();
        assert.equal(player._encounterCount, 3 - i);
    }
});

test('inventory alone has no effect; reserves also provide the equipment bonus', () => {
    const { context, player, boots, equip } = setup();
    context.$gameParty.gainItem(boots, 1);
    player.makeEncounterCount();
    assert.equal(player._encounterCount, 2);
    context.$gameParty.battleMembers = () => [];
    equip(1, boots);
    player.makeEncounterCount();
    assert.equal(player._encounterCount, 4);
});

test('equipment changes adjust remaining steps without a reset or cumulative extension', () => {
    const { player, equip, boots } = setup();
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 1);
    equip(1, boots);
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 2);
    equip(1, null);
    equip(0, boots);
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 1, 'moving boots to another member adds nothing');
    equip(0, null);
    player.updateEncounterCount();
    assert.equal(player._encounterCount, -2, 'removing boots withdraws the bonus');
});

test('old saves apply the bonus once and saved countdowns keep their applied bonus', () => {
    const { player } = setup({ equipped: true });
    delete player._equipmentEncounterStepBonus;
    player._encounterCount = 8;
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 9);
    const saved = JSON.parse(JSON.stringify(player));
    Object.assign(player, saved);
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 8);
});

test('removing boots while encounters are disabled does not trigger an encounter', () => {
    const { context, player, equip } = setup({ equipped: true });
    player._encounterCount = 1;
    context.$gameSystem.isEncounterEnabled = () => false;
    equip(1, null);
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 1);
    assert.equal(player._equipmentEncounterStepBonus, 2);
    context.$gameSystem.isEncounterEnabled = () => true;
    player.updateEncounterCount();
    assert.equal(player._encounterCount, -2);
    assert.equal(player._equipmentEncounterStepBonus, 0);
});

test('existing dispersion, bush progress, half encounters, ship and disabling are preserved', () => {
    const { context, run, player, boots } = setup({ equipped: true, dispersion: '50' });
    context.$gameMap.encounterStep = () => 30;
    run('Math.randomInt = n => n - 1;');
    player.makeEncounterCount();
    assert.equal(player._encounterCount, 32);
    context.$gameMap.isBush = () => true;
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 30);
    boots.traits.push({ code: 64, dataId: 0, value: 1 });
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 29);
    player._vehicleType = 'ship';
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 28.5);
    context.$gameSystem.isEncounterEnabled = () => false;
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 28.5);
    context.$gameSystem.isEncounterEnabled = () => true;
    boots.traits.push({ code: 64, dataId: 1, value: 1 });
    player.updateEncounterCount();
    assert.equal(player._encounterCount, 28.5);
});

test('staff adds a fixed MAT50 and grants only the equipped weak all-target magic skill', () => {
    const { context, actors, equip } = setup();
    const staff = context.$dataWeapons[205];
    const skill = context.$dataSkills[237];
    const actor = actors[0];
    assert.equal(actor.paramPlus(4), 0);
    equip(0, staff);
    assert.equal(actor.paramPlus(4), 50);
    assert.ok(actor.skills().includes(skill));
    assert.equal(skill.mpCost, 25);
    assert.equal(skill.requiredWtypeId1, staff.wtypeId);
    assert.equal(skill.repeats, 1);
    assert.equal(skill.occasion, 1);
    assert.equal(skill.damage.elementId, 12);
    const action = Object.create(context.Game_Action.prototype);
    action.item = () => skill;
    action.subject = () => ({ mat: 173 });
    assert.equal(action.isMagical(), true);
    assert.equal(action.isForAll(), true);
    assert.equal(action.isForOpponent(), true);
    assert.equal(action.evalDamageFormula({}), 173);
    equip(0, null);
    assert.equal(actor.paramPlus(4), 0);
    assert.ok(!actor.skills().includes(skill));
});

test('both eastern pickups grant one item and persist their collected page', () => {
    const { context } = setup();
    context.$gameSelfSwitches = new context.Game_SelfSwitches();
    for (const [id, code, item] of [
        [78, 127, context.$dataWeapons[205]],
        [79, 128, context.$dataArmors[208]]
    ]) {
        const event = context.$dataMap.events[id];
        assert.equal(event.id, id);
        assert.ok(event.x > 170);
        const [pickup, collected] = event.pages;
        assert.equal(pickup.trigger, 1);
        assert.equal(pickup.priorityType, 0);
        assert.equal(collected.conditions.selfSwitchValid, true);
        assert.equal(collected.image.characterName, '');
        assert.equal(collected.list.length, 1);
        const interpreter = new context.Game_Interpreter();
        interpreter._mapId = 1;
        interpreter._eventId = id;
        const gain = pickup.list.find(command => command.code === code);
        interpreter[`command${code}`](gain.parameters);
        interpreter.command123(pickup.list.find(command => command.code === 123).parameters);
        assert.equal(context.$gameParty.numItems(item), 1);
        assert.equal(context.$gameSelfSwitches.value([1, id, 'A']), true);
        assert.ok(fs.existsSync(path.join(root, 'img/characters', `${pickup.image.characterName}.png`)));
    }
});

test('pickups are reachable on foot east of the village with real tileset passage flags', () => {
    const { context } = setup();
    const map = Object.create(context.Game_Map.prototype);
    map._tilesetId = context.$dataMap.tilesetId;
    map._tileEvents = [];
    const queue = [[169, 122]];
    const visited = new Set(['169,122']);
    const directions = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
    for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i];
        for (const [d, dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const key = `${nx},${ny}`;
            if (nx < 168 || nx > 175 || ny < 119 || ny > 126 || visited.has(key)) continue;
            if (!map.isPassable(x, y, d) || !map.isPassable(nx, ny, 10 - d)) continue;
            visited.add(key);
            queue.push([nx, ny]);
        }
    }
    for (const id of [78, 79]) {
        const event = context.$dataMap.events[id];
        assert.ok(visited.has(`${event.x},${event.y}`), `event ${id} is reachable`);
        assert.equal(context.$dataMap.events.filter(e => e && e.x === event.x && e.y === event.y).length, 1);
    }
});
