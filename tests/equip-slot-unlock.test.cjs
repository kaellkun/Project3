const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pluginSource = fs.readFileSync(path.join(root, 'js/plugins/Equip/NRP_EquipSlot.js'), 'utf8');

function setup() {
    const item = { id: 10, kind: 'item', damage: { type: 0 }, effects: [], meta: {} };
    const itemConfig = JSON.stringify({ ItemId: '10', EquipType: '5', Count: '2', MaxUses: '2' });
    const parameters = {
        DefaultEquipSlots: '["1","2"]',
        EquipSlotUnlockItems: JSON.stringify([itemConfig]),
        PagingEquipmentType: ''
    };
    const context = vm.createContext({
        PluginManager: { parameters: () => parameters },
        DataManager: {
            isItem: value => value && value.kind === 'item',
            isArmor: value => value && value.kind === 'armor'
        },
        $dataSystem: { equipTypes: ['', '武器', '盾', '頭', '身体', '装飾品'] },
        $dataWeapons: [],
        $dataArmors: [],
        $dataSkills: [],
        Utils: { RPGMAKER_NAME: 'MZ' }
    });
    vm.runInContext(`
        class Game_Item {
            constructor(object = null) { this._object = object; }
            object() { return this._object; }
            setEquip() {}
        }
        class Game_Actor {
            constructor() {
                this._equips = [new Game_Item(), new Game_Item()];
                this._baseSlots = [1, 2];
                this._result = { used: false, missed: false, evaded: false,
                    isHit() { return this.used && !this.missed && !this.evaded; } };
            }
            isDualWield() { return false; }
            equipSlots() { return this._baseSlots.slice(); }
            traitObjects() { return []; }
            skills() { return []; }
            equips() { return this._equips.map(equip => equip.object()); }
            result() { return this._result; }
            isActor() { return true; }
            refresh() { this.releaseUnequippableItems(false); }
            releaseUnequippableItems() { this.equipSlots(); }
            tradeItemWithParty() {}
            changeEquip() {}
            forceChangeEquip() {}
            bestEquipItem() {}
            learnSkill() {}
            forgetSkill() {}
        }
        class Game_BattlerBase { canEquip() { return true; } }
        class Game_Action {
            constructor(item) { this._item = item; }
            item() { return this._item; }
            testApply() { return false; }
            apply(target) {
                target._result.used = this.testApply(target);
                target._result.missed = !!this._item.miss;
                target._result.evaded = false;
            }
        }
        class Window_EquipItem { isEnabled() { return true; } }
        globalThis.Game_Item = Game_Item;
        globalThis.Game_Actor = Game_Actor;
        globalThis.Game_BattlerBase = Game_BattlerBase;
        globalThis.Game_Action = Game_Action;
        globalThis.Window_EquipItem = Window_EquipItem;
    `, context);
    vm.runInContext(pluginSource, context, { filename: 'NRP_EquipSlot.js' });
    context.item = item;
    return {
        actor: () => vm.runInContext('new Game_Actor()', context),
        action: () => vm.runInContext('new Game_Action(item)', context),
        setMiss: () => { item.miss = true; },
        run: source => vm.runInContext(source, context)
    };
}

test('configured item unlocks the configured number of slots for its target actor', () => {
    const env = setup();
    const actor = env.actor();
    assert.deepEqual(Array.from(actor.equipSlots()), [1, 2]);

    const action = env.action();
    assert.equal(action.testApply(actor), true, 'empty-effect unlock item is usable on an actor');
    action.apply(actor);

    assert.deepEqual(Array.from(actor.equipSlots()), [1, 2, 5, 5]);
    assert.equal(actor.isEquipSlotUnlockItemUsed(10), true);
    assert.equal(actor.equipSlotUnlockItemUseCount(10), 1);
    assert.equal(action.testApply(actor), true, 'item remains usable below the configured limit');

    action.apply(actor);
    assert.deepEqual(Array.from(actor.equipSlots()), [1, 2, 5, 5, 5, 5]);
    assert.equal(actor.equipSlotUnlockItemUseCount(10), 2);
    assert.equal(action.testApply(actor), false, 'item is unavailable at its configured limit');
});

test('use limits are tracked independently for each actor', () => {
    const env = setup();
    const firstActor = env.actor();
    const secondActor = env.actor();
    const action = env.action();

    action.apply(firstActor);
    assert.equal(action.testApply(firstActor), true);
    assert.deepEqual(Array.from(firstActor.equipSlots()), [1, 2, 5, 5]);

    assert.equal(action.testApply(secondActor), true);
    action.apply(secondActor);
    assert.deepEqual(Array.from(secondActor.equipSlots()), [1, 2, 5, 5]);
    assert.equal(secondActor.equipSlotUnlockItemUseCount(10), 1);
    assert.equal(firstActor.equipSlotUnlockItemUseCount(10), 1);
});

test('legacy saves migrate an already-unlocked item to one prior use', () => {
    const env = setup();
    const actor = env.actor();
    actor._unlockedEquipSlotItemIds = [10];

    assert.deepEqual(Array.from(actor.equipSlots()), [1, 2, 5, 5]);
    assert.equal(actor.equipSlotUnlockItemUseCount(10), 1);
    assert.equal(env.action().testApply(actor), true);

    actor.useEquipSlotUnlockItem(10);
    assert.deepEqual(Array.from(actor.equipSlots()), [1, 2, 5, 5, 5, 5]);
    assert.equal(actor.equipSlotUnlockItemUseCount(10), 2);
});

test('missed unlock item does not unlock slots', () => {
    const env = setup();
    const actor = env.actor();
    const action = env.action();
    env.setMiss();
    action.apply(actor);

    assert.deepEqual(Array.from(actor.equipSlots()), [1, 2]);
    assert.equal(actor.isEquipSlotUnlockItemUsed(10), false);
});
