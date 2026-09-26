const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function section(file, from, to) {
    const text = read(file), start = from ? text.indexOf(from) : 0;
    const end = text.indexOf(to, start + 1);
    assert.ok(start >= 0 && end > start);
    return text.slice(start, end);
}

// Real engine objects/managers, entire installed Keke/Chain/StateAdd/CC plugins.
// Only graphics, log rendering, input, parameter parsing and timer delivery are seams.
function setup({ speed = true, critical = true, formula = 'normalDamage * 2' } = {}) {
    const c = vm.createContext({ console, assert });
    const run = (s, filename = 'preparation-fixture') => vm.runInContext(s, c, { filename, timeout: 10000 });
    run(section('js/rmmz_core.js', null, 'function Utils()'));
    run(section('js/rmmz_managers.js', null, 'function ConfigManager()'));
    run(section('js/rmmz_managers.js', 'function BattleManager()', 'function PluginManager()'));
    run(read('js/rmmz_objects.js'));
    run(read('js/plugins.js'));
    for (const name of ['System', 'Actors', 'Classes', 'Weapons', 'Armors', 'States',
        'Skills', 'Items', 'Enemies', 'Troops', 'CommonEvents', 'Animations']) {
        run(`globalThis.$data${name} = ${read(`data/${name}.json`)};`);
    }
    run(`
        const document = { currentScript: { src: '' } };
        const Utils = { RPGMAKER_NAME: 'MZ', isOptionValid: () => false };
        const PluginManager = {
            _scripts: ['Keke_SpeedStarBattle', 'NRP_ChainSkill'],
            registerCommand() {},
            parameters(name) { return $plugins.find(p => p.status && p.name.split('/').pop() === name)?.parameters || {}; }
        };
        const PluginManagerEx = {
            createParameter(script) { return script.src.includes('StateAddMZ') ? {outOfTargets: []} :
                {commonFormula: ${JSON.stringify(formula)}, commonMessage: '', commonAnimation: 0}; },
            findMetaValue(item, keys) { for (const key of keys) if (item.meta[key] !== undefined) return item.meta[key]; return null; }
        };
        const ConfigManager = { makeData() {return {};}, applyData() {} };
        const ColorManager = {};
        const Input = { isPressed: () => false, isLongPressed: () => false };
        const TouchInput = { isLongPressed: () => false };
        const ImageManager = { isObjectCharacter: () => false };
        const TextManager = { partyName: '%1 party' };
        const timers = [];
        function setTimeout(fn, ms, ...args) { timers.push(() => fn(...args)); }
        function flushTimers() { while(timers.length) timers.shift()(); }
        const SceneManager = { _scene: null };
        const AudioManager = { playSe() {} };
        const Graphics = { width: 816, height: 624 };
        for (const name of ['Scene_Battle', 'Scene_Options', 'Window_BattleLog', 'Window_Options',
            'Spriteset_Battle', 'Spriteset_Base', 'Sprite_Actor', 'Sprite_Enemy', 'Sprite_Animation',
            'Sprite_AnimationMV', 'Sprite_Battler']) {
            globalThis[name] = function() {};
            globalThis[name].prototype = new Proxy({}, {get(o, key) { return o[key] || function() {}; }});
        }
        Window_BattleLog.prototype.startAction = function() {};
        Window_BattleLog.prototype.endAction = function() {};
        Window_BattleLog.prototype.push = function() {};
        Window_BattleLog.prototype.clear = function() { this._methods = []; };
        for (const key of Object.keys(globalThis).filter(k => k.startsWith('$data'))) {
            if (Array.isArray(globalThis[key])) for (const d of globalThis[key]) if (d?.note !== undefined) DataManager.extractMetadata(d);
        }
    `);
    const plugins = ['js/plugins/Skill/NRP_ChainSkill.js',
        'js/plugins/State/StateAddMZ.js', ...(critical ? ['js/plugins/Extend/CustomizeCritical.js'] : []),
        'js/plugins/Keke_SpeedStarBattle.js',
        'js/plugins/Battle/Logic/RIT_SucHitEva.js', 'js/plugins/Battle/Slip/Keke_SlipCustom.js',
        'js/plugins/Battle/Logic/PreparationEffects.js'];
    for (const file of plugins) {
        run(`document.currentScript.src = ${JSON.stringify(file)};`);
        run(read(file), file);
    }
    run(`
        Math.random = () => 0.5;
        $dataClasses[1].traits = [{code:22,dataId:0,value:1}];
        $dataClasses[1].params = [9999,999,100,10,100,10,100,10].map(v => Array(100).fill(v));
        $dataActors[1] = {...$dataActors[1], classId:1, equips:[], traits:[], initialLevel:1};
        $dataEnemies[1] = {...$dataEnemies[1], traits:[], params:[9999,999,100,10,100,10,100,10]};
        $gameTemp = new Game_Temp(); $gameSystem = new Game_System();
        $gameActors = new Game_Actors(); $gameParty = new Game_Party(); $gameTroop = new Game_Troop();
        $gameVariables = new Game_Variables(); $gameSwitches = new Game_Switches();
        $gameMessage = new Game_Message(); $gameMap = { requestRefresh() {} };
        $gameParty._actors = [1]; $gameParty._inBattle = true;
        $gameSystem._noSpeedStarKe = ${!speed};
        $gameTroop._enemies = [new Game_Enemy(1,0,0), new Game_Enemy(1,0,0)];
        const a = $gameActors.actor(1), b = $gameTroop.members()[0], d = $gameTroop.members()[1];
        BattleManager.initMembers(); BattleManager._phase = 'turn';
        BattleManager._logWindow = new Window_BattleLog(); BattleManager._logWindow._methods = [];
        SceneManager._scene = new Scene_Battle();
        SceneManager._scene._logWindow = BattleManager._logWindow;
        SceneManager._scene._partyCommandWindow = {active:false};
        SceneManager._scene._spriteset = {_actorSprites:[], _enemySprites:[]};
        function state(id, note, turns=3) {
            $dataStates[id] = {...$dataStates[38],id,note,traits:[],autoRemovalTiming:0,minTurns:turns,maxTurns:turns};
            DataManager.extractMetadata($dataStates[id]);
        }
        function skill(id=900, options={}) {
            const {damage={}, ...rest} = options;
            $dataSkills[id] = {...$dataSkills[1], id, name:'Probe', hitType:1, successRate:100,
                scope:1, stypeId:1, repeats:1, effects:[], note:'', mpCost:0, tpCost:0, animationId:0,
                ...rest, damage:{type:1,elementId:1,formula:'100',variance:0,critical:false,...damage}};
            DataManager.extractMetadata($dataSkills[id]);
            return id;
        }
        function action(id=900, subject=a) { const result = new Game_Action(subject); result.setSkill(id); result.setTarget(0); return result; }
        function start(x) { a._actions=[x]; BattleManager._subject=a; BattleManager.startAction(); }
        function invoke(x, target=b) { BattleManager._action=x; BattleManager._subject=x.subject(); BattleManager.invokeAction(x.subject(),target); flushTimers(); }
        function tick(n=100) { for(let i=0;i<n;i++) SceneManager._scene.update(); }
        function near(actual, expected) { assert.ok(Math.abs(actual-expected)<1e-8, actual+' != '+expected); }
        skill(); skill(1); a.recoverAll();
    `);
    return { run, c };
}
module.exports = { setup };

if (require.main === module) {
test('DB migrations: no duplicate slip tags, no ATK prep traits, correct bonuses and immunity IDs', () => {
    const s = JSON.parse(read('data/States.json'));
    for (const [id, bonus] of [[32,1],[38,1.5],[41,2],[52,3],[77,1],[104,.8]]) {
        assert.match(s[id].note, new RegExp(`<PrepBonus:${bonus}>`));
        assert.equal(s[id].autoRemovalTiming, 0);
        assert.deepEqual(s[id].traits, []);
    }
    assert.ok(s.every(x => !x || !/SlipDamage/.test(x.note)));
    for (const id of [5,8,10,19,71,73,111]) assert.equal((s[id].note.match(/<HPスリップ値:/g)||[]).length, 1);
    const harmful = s[37].traits.map(t=>t.dataId);
    assert.ok(harmful.includes(5) && harmful.includes(107));
    assert.ok(!harmful.includes(0) && !harmful.includes(1) && !harmful.includes(38) && !harmful.includes(94));
});

test('real engine additive pool and normal persistent ATK buff stay separate', () => {
    setup({speed:false}).run(`
        a.addState(38); a.addState(41); a.addState(32);
        state(115,'<TakenBonus:1>'); b.addState(115);
        const x=action(); near(x.preparationRate(b),6.5); near(x.makeDamageValue(b,false),650);
        a.addState(55); near(a.atk,130); near(x.makeDamageValue(b,false),650);
        assert.ok(a.isStateAffected(38)); assert.ok(b.isStateAffected(115));
        x.apply(b); assert.equal(b.result().hpDamage,650);
        assert.ok(!a.isStateAffected(38)); assert.ok(a.isStateAffected(55)); assert.ok(!b.isStateAffected(115));
    `);
});

test('installed Keke: early endAction, all targets/repeats and two overlapping actions', () => {
    setup().run(`
        skill(900,{scope:2,repeats:3,note:'<popWait:10>'});
        a.addState(38); const x=action(); start(x);
        while(BattleManager._targets.length) BattleManager.updateAction();
        BattleManager.updateAction(); flushTimers();
        assert.equal(b._popWaitsKe.length,3); assert.equal(d._popWaitsKe.length,3);
        assert.ok(!a.isStateAffected(38)); assert.equal(b.hp,9999);
        const y=action(); invoke(y); tick();
        assert.equal(b.hp,9999-750-100); assert.equal(d.hp,9999-750);
        assert.equal(x.preparationRate(b),2.5); assert.equal(y.preparationRate(b),1);
    `);
});

test('reapply during Keke delay belongs to the next action, not old cleanup or repeats', () => {
    setup().run(`
        skill(900,{note:'<popWait:10>'}); a.addState(38); const x=action(); invoke(x);
        a.addState(38); a.addState(38); assert.equal(a._stateTurns[38],1);
        invoke(x); tick(); assert.equal(b.hp,9499); assert.ok(a.isStateAffected(38));
        const y=action(); invoke(y); tick(); assert.equal(b.hp,9249); assert.ok(!a.isStateAffected(38));
    `);
});

test('cancel before attempt / no targets / support preserve; canceled queued attack stays spent', () => {
    setup().run(`
        a.addState(38); const x=action(); start(x); a.clearActions(); BattleManager._targets=[];
        BattleManager.endAction(); assert.ok(a.isStateAffected(38));
        skill(901,{scope:0,damage:{type:0}}); start(action(901)); BattleManager.updateAction();
        assert.ok(a.isStateAffected(38));
        skill(900,{note:'<popWait:10>'}); invoke(action()); BattleManager._escaped=true; tick();
        assert.ok(!a.isStateAffected(38)); assert.equal(b.hp,9999);
    `);
});

test('miss and zero damage consume, whole action retains snapshot', () => {
    setup({speed:false}).run(`
        a.addState(38); skill(900,{successRate:0}); const x=action(); invoke(x);
        assert.ok(b.result().evaded); assert.ok(!a.isStateAffected(38)); near(x.preparationRate(b),2.5);
        a.addState(38); skill(901,{damage:{formula:'0'}}); invoke(action(901));
        assert.equal(b.result().hpDamage,0); assert.ok(!a.isStateAffected(38));
    `);
});

test('filters AND across skill/element/hit, OR within lists, normal attack elements', () => {
    setup({speed:false}).run(`
        state(115,'<PrepBonus:2><PrepSkillIds:901,902><PrepElements:2,3><PrepHitTypes:2>'); a.addState(115);
        invoke(action()); assert.ok(a.isStateAffected(115));
        skill(901,{hitType:2,damage:{elementId:3}}); const x=action(901); near(x.preparationRate(b),3);
        invoke(x); assert.ok(!a.isStateAffected(115)); assert.equal(b.result().hpDamage,300);
        state(116,'<PrepBonus:1><PrepElements:2>'); a.addState(116);
        $dataClasses[1].traits.push({code:31,dataId:2,value:0});
        skill(903,{damage:{elementId:-1}}); near(action(903).preparationRate(b),2);
    `);
});

test('TakenBonus is per action and target; conditional and persistent zero flags', () => {
    setup().run(`
        state(115,'<TakenBonus:1><TakenElements:2>'); b.addState(115); invoke(action()); tick();
        assert.ok(b.isStateAffected(115));
        skill(901,{damage:{elementId:2},note:'<popWait:10>'}); const x=action(901);
        invoke(x); invoke(x); const y=action(901); invoke(y); tick();
        assert.equal(b.hp,9999-100-400-100); assert.ok(!b.isStateAffected(115));
        state(116,'<PrepBonus:0>'); a.addState(116); invoke(action()); assert.ok(!a.isStateAffected(116));
        state(117,'<PrepBonus:0.5><PrepConsume:false>'); a.addState(117);
        invoke(action()); invoke(action()); tick(); assert.ok(a.isStateAffected(117));
    `);
});

test('HP/MP recovery and item recovery do not scale or consume', () => {
    setup({speed:false}).run(`
        a.addState(38); a.addState(31); state(115,'<TakenBonus:1>'); b.addState(115);
        for(const type of [3,4]) {
            skill(901,{scope:7,damage:{type}}); b.setHp(5000); b.setMp(500);
            const x=action(901); near(x.preparationRate(b),1); x.apply(b);
            assert.equal(type===3?b.result().hpDamage:b.result().mpDamage,-100);
        }
        $dataItems[999]={...$dataSkills[901],id:999,itypeId:1};
        const x=new Game_Action(a); x.setItem(999); near(x.preparationRate(b),1); x.apply(b);
        assert.ok(a.isStateAffected(38)); assert.ok(a.isStateAffected(31)); assert.ok(b.isStateAffected(115));
    `);
});

test('preview helpers/calcElementRate/Chain resistance probe and Keke temporary apply never consume', () => {
    setup().run(`
        a.addState(38); a.addState(39); state(115,'<TakenBonus:1>'); b.addState(115);
        const x=action(); const before=JSON.stringify([a._states,b._states,a._stateTurns,b._stateTurns]);
        for(let i=0;i<5;i++){ x.preparationRate(b); x.preparationCriticalChance(b); x.preparationCertainHit(); x.calcElementRate(b); x.makeDamageValue(b,false); }
        assert.equal(JSON.stringify([a._states,b._states,a._stateTurns,b._stateTurns]),before);
        const temp=new Game_Enemy(1,0,0); temp._isTempKe=true; x._isTempApplyKe=true; x.apply(temp); x._isTempApplyKe=false;
        assert.ok(a.isStateAffected(38)); invoke(x); tick(); assert.ok(!a.isStateAffected(38));
    `);
});

test('installed Keke counter consumes both attackers independently', () => {
    setup().run(`
        $dataEnemies[1].traits.push({code:22,dataId:0,value:1},{code:22,dataId:6,value:1});
        a.addState(38); b.addState(41); invoke(action()); tick();
        assert.equal(b.hp,9999); assert.equal(a.result().hpDamage,300);
        assert.ok(!a.isStateAffected(38)); assert.ok(!b.isStateAffected(41));
    `);
});

test('installed Keke reflection retains original prep across reflected repeats', () => {
    setup().run(`
        $dataEnemies[1].traits.push({code:22,dataId:5,value:1});
        skill(900,{hitType:2}); a.addState(38); const x=action(); invoke(x); invoke(x); tick();
        assert.equal(b.hp,9999); assert.equal(a.hp,9499); assert.ok(!a.isStateAffected(38));
    `);
});

test('installed NRP chain receives a new action while original Keke queue keeps its bonus', () => {
    setup().run(`
        skill(900,{note:'<ChainSkill:901><popWait:10>'}); skill(901);
        a.addState(38); const x=action(); start(x); BattleManager.updateAction();
        BattleManager.updateAction(); const chained=BattleManager._action;
        assert.notEqual(chained,x); assert.equal(chained.item().id,901);
        BattleManager.updateAction(); BattleManager.updateAction(); flushTimers(); tick();
        assert.equal(b.hp,9999-250-100);
    `);
});

test('StateAddMZ turns overwrite for tagged states, normal states still accumulate', () => {
    setup({speed:false}).run(`
        state(115,'<PrepBonus:1>'); a.addState(115); a.addState(115); assert.equal(a._stateTurns[115],3);
        a.addState(55); a.addState(55); assert.equal(a._stateTurns[55],6);
        skill(901,{scope:11,note:'<addStateTurn 115:2>',effects:[{code:21,dataId:115,value1:1,value2:0}],damage:{type:0}});
        action(901).apply(a); assert.equal(a._stateTurns[115],5);
    `);
});

for (const critical of [false,true]) {
test(`certain hit and guaranteed critical work with CustomizeCritical=${critical}`, () => {
    setup({critical}).run(`
        skill(900,{successRate:0,scope:2,repeats:2,damage:{critical:true}});
        a.addState(31); a.addState(39); a.addState(38); const x=action(); start(x);
        while(BattleManager._targets.length) BattleManager.updateAction();
        BattleManager.updateAction(); flushTimers(); tick();
        assert.equal(b.hp,9999-2*250*${critical?2:3}); assert.equal(d.hp,b.hp);
        assert.ok(!a.isStateAffected(31)); assert.ok(!a.isStateAffected(39));
    `);
});
}

test('critical-disabled magic neither receives nor consumes standalone guarantee; 104 still boosts damage', () => {
    setup().run(`
        skill(900,{hitType:2,successRate:0}); a.addState(39); a.addState(104);
        const x=action(); start(x); invoke(x); tick();
        assert.equal(b.result().hpDamage,180); assert.equal(b.result().critical,false);
        assert.ok(a.isStateAffected(39)); assert.ok(!a.isStateAffected(104));
    `);
});

test('特攻属性 attacks are guaranteed critical, including added elements', () => {
    setup({speed:false}).run(`
        const specialId=$dataSystem.elements.indexOf('鉱石特攻');
        skill(900,{damage:{critical:false,elementId:specialId}});
        const direct=action(); direct.apply(b); assert.equal(b.result().critical,true);
        b.recoverAll();
        $gameTemp.getAllElementsKe=()=>[specialId];
        skill(901,{damage:{critical:false,elementId:0}});
        const added=action(901); added.apply(b); assert.equal(b.result().critical,true);
    `);
});

test('104 critical bonus is added once, respects CEV and installed critical formula', () => {
    setup().run(`
        $dataClasses[1].traits.push({code:22,dataId:2,value:.25});
        $dataEnemies[1].traits.push({code:22,dataId:3,value:.2});
        skill(900,{damage:{critical:true}}); a.addState(104); const x=action();
        near(x.preparationCriticalChance(b),.44); start(x);
        near(x.preparationCriticalChance(b),.44); assert.equal(x._criticalQueue.length,1);
        invoke(x); tick(); assert.equal(b.result().critical,false); assert.equal(b.result().hpDamage,180);
    `);
});

test('custom critical formula is not overwritten by PreparationEffects', () => {
    setup({formula:'normalDamage * 1.25'}).run(`
        skill(900,{damage:{critical:true}}); a.addState(39); a.addState(52);
        const x=action(); start(x); invoke(x); tick(); assert.equal(b.result().hpDamage,500);
    `);
});

test('CustomizeCritical queued results stay aligned after a miss or counter', () => {
    for (const counter of [false,true]) setup().run(`
        skill(900,{scope:2,damage:{critical:true}});
        $dataClasses[1].traits.push({code:22,dataId:2,value:.3});
        state(115,''); $dataStates[115].traits=[{code:22,dataId:${counter?6:1},value:1}]; b.addState(115);
        state(116,''); $dataStates[116].traits=[{code:22,dataId:3,value:1}]; d.addState(116);
        state(117,'<PrepCriticalBonus:0.3>'); a.addState(117);
        const x=action(); start(x); assert.deepEqual(Array.from(x._criticalQueue),[true,false]);
        while(BattleManager._targets.length) BattleManager.updateAction();
        flushTimers(); tick(); assert.equal(d.result().critical,false); assert.equal(d.result().hpDamage,100);
        assert.equal(x._criticalQueue.length,0);
    `);
});

test('Keke restores cleared items and retains the same action snapshot after endAction', () => {
    setup().run(`
        skill(900,{note:'<popWait:10>'}); a.addState(38); const x=action(); invoke(x);
        x.clear(); assert.equal(x.item(),null); tick(); assert.equal(b.hp,9749); assert.equal(x.item(),null);
    `);
});

test('unmatched prepare survives support action completion and turn end', () => {
    setup({speed:false}).run(`
        a.addState(31); a.addState(38); a.addState(39);
        skill(901,{scope:11,damage:{type:0}}); start(action(901));
        BattleManager.updateAction(); BattleManager.updateAction(); a.onAllActionsEnd(); a.onTurnEnd();
        for(const id of [31,38,39]) assert.ok(a.isStateAffected(id));
    `);
});

test('MP damage/drain scale, zero element resistance consumes without damage', () => {
    setup({speed:false}).run(`
        for(const type of [2,5,6]) {
            b.recoverAll(); a.addState(38); skill(901,{damage:{type}});
            const x=action(901); x.apply(b); assert.equal(type===5?b.result().hpDamage:b.result().mpDamage,250);
            assert.ok(!a.isStateAffected(38));
        }
        $dataEnemies[1].traits.push({code:11,dataId:1,value:0});
        a.addState(38); const x=action(); assert.equal(x.calcElementRate(b),0); assert.ok(a.isStateAffected(38));
        x.apply(b); assert.equal(b.result().hpDamage,0); assert.ok(!a.isStateAffected(38));
    `);
});

test('substitution receives its own TakenBonus, original attempted recipient is consumed too', () => {
    setup({speed:false}).run(`
        b.setHp(100); $dataEnemies[1].traits.push({code:62,dataId:2,value:1});
        state(115,'<TakenBonus:1>'); state(116,'<TakenBonus:2>'); b.addState(115); d.addState(116);
        a.addState(38); invoke(action());
        assert.equal(b.hp,100); assert.equal(d.result().hpDamage,450);
        assert.ok(!b.isStateAffected(115)); assert.ok(!d.isStateAffected(116));
    `);
});

test('self-targeted damage captures both sides of a shared state before consuming', () => {
    setup({speed:false}).run(`
        state(115,'<PrepBonus:1><TakenBonus:2>'); a.addState(115);
        skill(901,{scope:11}); const x=action(901); near(x.preparationRate(a),4);
        x.apply(a); assert.equal(a.result().hpDamage,400); assert.ok(!a.isStateAffected(115));
    `);
});

test('Keke temporary application preserves the actual CustomizeCritical queue', () => {
    setup().run(`
        skill(900,{damage:{critical:true}}); a.addState(39); const x=action(); start(x);
        const before=Array.from(x._criticalQueue), temp=new Game_Enemy(1,0,0);
        temp._isTempKe=true; x._isTempApplyKe=true; x.apply(temp); x._isTempApplyKe=false;
        assert.deepEqual(Array.from(x._criticalQueue),before); assert.ok(a.isStateAffected(39));
        invoke(x); tick(); assert.equal(b.result().critical,true); assert.equal(b.result().hpDamage,200);
    `);
});

test('installed Keke slip: fixed signs, individual queues, 93 multiplier, healing unaffected', () => {
    setup({speed:false}).run(`
        for(const [id,hp,mp] of [[5,600,0],[8,100,30],[10,100,0],[19,600,0],[71,600,0],[73,600,0],[111,-500,0]]) {
            b.clearStates(); b.setHp(5000); b.setMp(500); b.addState(id); b.addState(93);
            b.initSlipDamageQueue(); b.regenerateHp(); b.regenerateMp();
            const queue=b.getSlipDamageQueue();
            assert.equal(queue.filter(q=>q.type==='hp').length,1);
            for(const q of queue) BattleManager.applyIndividualSlipDamage({...q,battler:b});
            assert.equal(b.hp,5000-(hp>0?hp*2:hp)); assert.equal(b.mp,500-mp*2);
        }
        b.clearStates(); b.setHp(5000); b.addState(93); b.initSlipDamageQueue(); b.regenerateHp();
        assert.equal(b.hp,5000); assert.equal(b.getSlipDamageQueue().length,0);
        b.addState(33); b.regenerateHp(); assert.equal(b.hp,5299);
        b.clearStates(); b.addState(93); const x=action(); assert.equal(x.makeDamageValue(b,false),100);
    `);
});
}