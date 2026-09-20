const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const plugin = 'js/plugins/Battle/Info/ResistRateDisplay.js';
const db = {};
for (const name of ['System', 'Actors', 'Classes', 'Weapons', 'Armors', 'States', 'Enemies', 'Troops']) {
    db[`$data${name}`] = JSON.parse(read(`data/${name}.json`));
}
// Skill/item definitions are intentionally synthetic: content agents can edit
// their JSON concurrently without changing preview expectations or boot fixtures.
const usable = { id: 1, name: 'Fixture', description: '', iconIndex: 0,
    scope: 1, hitType: 1, occasion: 0, successRate: 100, repeats: 1, speed: 0, tpGain: 0,
    note: '', meta: {}, effects: [], damage: { type: 1, elementId: 1, formula: '0', variance: 0, critical: false } };
db.$dataSkills = [null, { ...usable, stypeId: 1, mpCost: 0, tpCost: 0, requiredWtypeId1: 0, requiredWtypeId2: 0 }];
db.$dataItems = [null, { ...usable, itypeId: 1, consumable: true, price: 0 }];
function section(file, from, to) {
    const source = read(file), start = from ? source.indexOf(from) : 0, end = source.indexOf(to, start + 1);
    assert.ok(start >= 0 && end > start);
    return source.slice(start, end);
}

// Installed engine objects/actions, complete windows/scenes, complete Keke,
// NUUN, FlexibleTopDownUI, Help, LinearTimeBattle and hierarchy. Only platform,
// bitmap/sprite rendering and message/log services are headless boundaries.
// Fixtures are private DB copies, not assumptions about live skills/equipment.
function setup({ width = 816, height = 624, keke = true, nuun = true, method = '合算', mode = 1 } = {}) {
    const context = vm.createContext({ assert, console });
    const run = (source, filename = 'resistance-test-fixture.js') => vm.runInContext(source, context, { filename });
    const load = file => run(read(file), file);
    run(section('js/rmmz_core.js', null, 'function Utils()'));
    run(section('js/rmmz_managers.js', null, 'function ConfigManager()'));
    run(section('js/rmmz_managers.js', 'function BattleManager()', 'function PluginManager()'));
    load('js/rmmz_objects.js');
    run(`
        Object.assign(globalThis, ${JSON.stringify(db)});
        const document = { currentScript: { src: 'js/plugins/Extend/Keke_ElementFullCustom.js?v=test' } };
        const window = globalThis;
        const PluginManager = { _scripts: ['FlexibleTopDownUI'], parameters(name) {
            if (name === 'Keke_ElementFullCustom') return { '属性計算順': '加算先',
                '複数属性計算法': ${JSON.stringify(method)}, '…特徴にも適用': 'true' };
            if (name === 'NUUN_AddStateDeviation') return { AddNormalStateMode: '${mode}' };
            return {};
        } };
        const Nuun_PluginParams = { getPluginParams: () => ({ AddNormalStateMode: ${mode} }) };
        const Utils = { isOptionValid: () => false, isMobileDevice: () => false, containsArabic: () => false, RPGMAKER_NAME: 'MZ' };
        const Graphics = { width: ${width}, boxWidth: ${width}, height: ${height}, boxHeight: ${height} };
        const ConfigManager = { touchUI: false };
        const Input = { isRepeated: () => false, isTriggered: () => false, isPressed: () => false, update() {} };
        const TouchInput = { x: 0, y: 0, isTriggered: () => false, isCancelled: () => false,
            isHovered: () => false, isClicked: () => false, isPressed: () => false, isReleased: () => false, update() {} };
        const SoundManager = { playOk() {}, playCancel() {}, playCursor() {}, playBuzzer() {} };
        const AudioManager = { stopMe() {}, stopBgm() {}, checkErrors() {} };
        const SceneManager = { isNextScene: () => false, isPreviousScene: () => false, isSceneChanging: () => false };
        const TextManager = { param: id => ['HP','MP','攻撃','防御','魔攻','魔防','敏捷','運'][id],
            item: 'アイテム', fight: '戦う', escape: '逃げる', attack: '攻撃', guard: '防御' };
        const ColorManager = { normalColor: () => '#fff', outlineColor: () => '#000', textColor: () => '#fff',
            itemBackColor1: () => '#111', itemBackColor2: () => '#222', systemColor: () => '#fff',
            mpCostColor: () => '#fff', tpCostColor: () => '#fff' };
        class Rectangle {
            constructor(x,y,width,height) { Object.assign(this,{x,y,width,height}); }
            pad(n) { this.x -= n; this.y -= n; this.width += n*2; this.height += n*2; }
            contains(x,y) { return x >= this.x && y >= this.y && x < this.x+this.width && y < this.y+this.height; }
        }
        class Point { constructor(x,y) { Object.assign(this,{x,y}); } }
        class Bitmap {
            constructor(width,height) { Object.assign(this,{width,height,text:[],fontSize:26}); }
            clear() { this.text=[]; } destroy() {} blt() {} fillRect() {} gradientFillRect() {} strokeRect() {}
            drawText(...args) { this.text.push(args); }
            measureTextWidth(text) { return Array.from(String(text)).length * this.fontSize; }
            addLoadListener(fn) { fn(this); } isReady() { return true; }
        }
        class Sprite { constructor() { this.children=[]; this.anchor={x:0,y:0}; } }
        class ColorFilter { setBlendColor() {} setBrightness() {} }
        function Stage() {} Stage.prototype.initialize = function() { this.children=[]; };
        function Window() {}
        Window.prototype.initialize = function() { Object.assign(this,{openness:255,visible:true,
            origin:{x:0,y:0},_contentsSprite:{},_clientArea:{children:[]},children:[],
            worldTransform:{applyInverse: p => new Point(p.x-this.x,p.y-this.y)}}); };
        Window.prototype.move = function(x,y,width,height) { Object.assign(this,{x,y,width,height}); };
        Window.prototype.setTone = function() {};
        Window.prototype.setCursorRect = function(x,y,width,height) { this.cursorRect=new Rectangle(x,y,width,height); };
        Window.prototype.update = function() {};
        Window.prototype.isOpen = function() { return this.openness >= 255; };
        Window.prototype.isClosed = function() { return this.openness <= 0; };
        Window.prototype.addChild = function(child) { this.children.push(child); return child; };
        Window.prototype.addChildToBack = Window.prototype.addChild;
        Object.defineProperties(Window.prototype, {
            innerWidth: { get() { return Math.max(0,this.width-this.padding*2); } },
            innerHeight: { get() { return Math.max(0,this.height-this.padding*2); } },
            innerRect: { get() { return new Rectangle(this.padding,this.padding,this.innerWidth,this.innerHeight); } }
        });
        const ImageManager = { loadSystem: () => new Bitmap(192,192), loadFace: () => new Bitmap(576,288),
            faceWidth:144,faceHeight:144,iconWidth:32,iconHeight:32,standardIconWidth:32,standardIconHeight:32,
            isObjectCharacter: () => false };
    `);
    load('js/rmmz_windows.js');
    load('js/rmmz_scenes.js');
    if (keke) load('js/plugins/Extend/Keke_ElementFullCustom.js');
    if (nuun) load('js/plugins/State/NUUN_AddStateDeviation.js');
    load('js/plugins/FlexibleTopDownUI.js');
    load('js/plugins/HelpWindowThreeLines.js');
    load('js/plugins/LinearTimeBattle.js');
    load('js/plugins/BattleCommandHierarchy.js');
    run(`
        // Sprite placements only; retain real actor faces, status rectangles,
        // target list refresh/select/hitTest/processTouch/cancel/drawItem.
        for (const name of ['placeTimeGauge','placeActorName','placeStateIcon','placeBasicGauges'])
            Window_BattleStatus.prototype[name] = function() {};
        Scene_Message.prototype.createAllWindows = function() {
            this._messageWindow = new Window_Base(new Rectangle(0,0,100,100)); this._messageWindow.openness=0;
        };
        Scene_Battle.prototype.createLogWindow = function() {
            this._logWindow = new Window_Base(this.logWindowRect());
            Object.assign(this._logWindow,{startTurn(){},clear(){},isBusy:()=>false}); this.addWindow(this._logWindow);
        };
        const originalTouch = [Window_BattleEnemy.prototype.processTouch, Window_BattleActor.prototype.processTouch,
            Window_Selectable.prototype.processCancel, Window_Selectable.prototype.itemRect];
        const originalEnemyRect = Scene_Battle.prototype.enemyWindowRect;
        const originalActorRect = Scene_Battle.prototype.actorWindowRect;
    `);
    load(plugin);
    run(`
        $dataSystem.battleSystem = 1;
        $dataSystem.elements = ['', '通常', '試験炎', '試験氷'];
        const classId = $dataActors[1].classId;
        $dataClasses[classId] = {...$dataClasses[classId], traits:[],learnings:[],note:'',meta:{}};
        for (let id=1;id<=4;id++) $dataActors[id] = {...$dataActors[1], id, name:'味方'+id,
            classId, equips:[], traits:[{code:41,dataId:1,value:1}], initialLevel:1,note:'',meta:{}};
        $dataEnemies[1] = {...$dataEnemies[1], traits:[],name:'対象',note:'',meta:{}};
        const stateId = $dataStates.length;
        $dataStates.push({...$dataStates[1],id:stateId,name:'試験毒',restriction:0,traits:[],note:'',meta:{},autoRemovalTiming:0});
        const skillId = $dataSkills.length;
        $dataSkills.push({...$dataSkills[1],id:skillId,name:'試験技',stypeId:1,scope:1,hitType:1,
            note:'<属性追加: 試験氷, 試験氷>',meta:{},effects:[],mpCost:0,tpCost:0,
            damage:{type:1,elementId:2,formula:'throw new Error("NEVER EVALUATE")',variance:0,critical:false}});
        const itemId = $dataItems.length;
        $dataItems.push({...$dataItems[1],id:itemId,name:'試験道具',scope:7,hitType:0,note:'',meta:{},effects:[],
            damage:{type:3,elementId:2,formula:'throw new Error("NEVER EVALUATE")',variance:0,critical:false}});
        $gameTemp=new Game_Temp(); $gameSystem=new Game_System(); $gameActors=new Game_Actors();
        $gameVariables=new Game_Variables(); $gameSwitches=new Game_Switches(); $gameMessage=new Game_Message();
        $gameScreen=new Game_Screen(); $gameTimer=new Game_Timer(); $gameMap=new Game_Map();
        $gamePlayer={refresh(){}}; $gameParty=new Game_Party(); $gameTroop=new Game_Troop();
        $gameParty._actors=[1,2,3,4]; $gameParty._inBattle=true;
        $gameTroop._enemies=[new Game_Enemy(1,0,0),new Game_Enemy(1,0,0),new Game_Enemy(1,0,0)];
        BattleManager.initMembers(); BattleManager._phase='input'; BattleManager._inputting=true;
        const subject=$gameActors.actor(1), target=$gameTroop.members()[0];
        BattleManager._currentActor=subject;
        const action=new Game_Action(subject); action.setSkill(skillId); subject._actions=[action]; subject._actionInputIndex=0;
        const skill=$dataSkills[skillId];
        const traits=(object, entries) => { object.traits=entries.map(([code,dataId,value])=>({code,dataId,value})); };
        traits($dataEnemies[1],[[11,2,1.5],[11,3,0.5]]);
        const describe=()=>Project3ResistRateDisplay.describe(action,target);
        const snapshots=()=>JSON.stringify([action,subject,target,$gameTemp,$gameSystem,$gameVariables,$gameSwitches,
            $dataActors,$dataClasses,$dataSkills,$dataItems,$dataStates,$dataEnemies]);
        function sceneFixture() {
            const scene=new Scene_Battle();
            scene._windowLayer={children:[],addChild(w){this.children.push(w);}};
            scene.createAllWindows(); scene.relayoutBattleWindows();
            scene._actorCommandWindow.setup(subject);
            scene._actorCommandWindow.setBattleCommandLayer('fight','skill');
            scene._skillWindow.setActor(subject); scene._skillWindow.setStypeId(1);
            scene._actorCommandWindow.deactivate();
            return scene;
        }
    `);
    return run;
}

for (const [method, expected] of [['合算', 0.75], ['平均', 1], ['最大値', 1.5]]) {
    test(`real Keke ${method}, duplicate additional elements and installed rate (not vanilla max)`, () => {
        setup({ method })(`
            const before=snapshots();
            const info=describe(); assert.equal(info.valid,true); assert.equal(info.element.rate,${expected});
            assert.deepEqual(Array.from(info.element.ids),[2,3]);
            assert.equal(info.element.rate,action.calcElementRate(target));
            assert.equal(snapshots(),before);
        `);
    });
}

test('all seven damage types, negative/zero/equal/weak/resistant rates and recovery semantics', () => {
    setup()(`
        skill.note='';
        for (let type=0;type<=6;type++) for (const rate of [-0.5,0,0.5,1,1.5]) {
            skill.damage.type=type; traits($dataEnemies[1],[[11,2,rate]]);
            const info=describe(); assert.equal(info.valid,true);
            if (!type) { assert.equal(info.element,null); continue; }
            assert.equal(info.element.rate,rate);
            if ([3,4].includes(type)) {
                assert.match(info.element.label,/回復/); assert.doesNotMatch(info.element.label,/弱点|吸収/);
            } else assert.equal(info.element.label,rate<0?'吸収':rate===0?'無効':rate<1?'耐性':rate>1?'弱点':'等倍');
        }
    `);
});

test('element 0/-1, attack traits, skill-type-filtered Keke addition, no manual ID list', () => {
    setup()(`
        skill.damage.elementId=0; skill.note=''; assert.equal(describe().element.rate,1);
        assert.equal(describe().element.ids.length,0);
        skill.note='<属性追加: 試験炎, 試験氷>'; assert.equal(describe().element.rate,0.75);
        skill.damage.elementId=-1; skill.note='';
        traits($dataActors[1],[[31,2,1],[31,3,1],[31,2,1]]);
        assert.equal(describe().element.rate,1.5,'installed Keke without add tag delegates normal attack to vanilla');
        skill.note='<通常属性追加: 試験氷, 試験氷>'; assert.equal(describe().element.rate,0.75);
        skill.damage.elementId=2; skill.note='<属性追加: 試験氷/2>'; assert.equal(describe().element.rate,1.5);
        skill.stypeId=2; assert.equal(describe().element.rate,0.75);
        assert.deepEqual(Array.from(Project3ResistRateDisplay.elementIds(),x=>x.id),[1,2,3]);
        assert.deepEqual(Array.from(describe().element.ids),[2,3]);
    `);
});

test('works without Keke/NUUN; selected skill only, not unrelated unknown weaknesses', () => {
    setup({ keke: false, nuun: false })(`
        assert.equal(describe().element.rate,1.5);
        assert.deepEqual(Array.from(describe().element.ids),[2]);
        assert.doesNotMatch(JSON.stringify(describe()),/試験氷/);
        skill.damage.elementId=-1; traits($dataActors[1],[]);
        assert.equal(describe().element.rate,1);
    `);
});

test('preview isolates nested action flags, subject/target caches, leaves all live objects and RNG untouched', () => {
    setup()(`
        const realCalc=Game_Action.prototype.calcElementRate;
        action._elementFlags={list:[1],nested:{rate:3}};
        target._elementResultKeElfc={nested:[4]}; subject._previewCache={list:[5]};
        Game_Action.prototype.calcElementRate=function(victim) {
            assert.notEqual(this,action); assert.notEqual(victim,target); assert.notEqual(this.subject(),subject);
            this._elementFlags.list.push(99); this._elementFlags.nested.rate=0;
            victim._elementResultKeElfc.nested.push(99); this.subject()._previewCache.list.push(99);
            this.item().meta.previewOnly=true;
            return realCalc.call(this,victim);
        };
        for (const key of ['evalDamageFormula','makeDamageValue','apply','itemEffectAddState','itemEffectAddDebuff'])
            Game_Action.prototype[key]=()=>{throw new Error('Forbidden '+key);};
        Math.random=()=>{throw new Error('RNG forbidden');};
        const before=snapshots();
        for(let i=0;i<10;i++) assert.equal(describe().element.rate,0.75);
        assert.equal(snapshots(),before);
    `);
});

test('Keke formula modifiers/reversal are explicitly excluded, never evaluated', () => {
    setup()(`
        $dataEnemies[1].note='<属性耐性: r, 試験炎><属性耐性: +50, 試験氷>';
        const before=snapshots();
        const info=describe(); assert.equal(info.element.rate,0.75);
        assert.equal(info.element.formulaModifiersExcluded,true); assert.match(info.lines[0],/式補正別/);
        assert.equal(snapshots(),before); assert.equal(target._elementResultKeElfc,undefined);
    `);
});

for (const nuun of [false,true]) {
    test(`state/debuff actual effects and no-hit conditional chance (${nuun?'NUUN':'MZ'})`, () => {
        setup({nuun})(`
            skill.damage.type=0;
            skill.effects=[{code:21,dataId:stateId,value1:0.4},{code:32,dataId:2,value1:3}];
            traits($dataEnemies[1],[[13,stateId,0.5],[12,2,0.25]]);
            Game_Action.prototype.lukEffectRate=()=>0.8;
            let info=describe(); assert.equal(info.element,null); assert.equal(info.effects.length,2);
            assert.ok(Math.abs(info.effects[0].chance-0.16)<1e-9);
            assert.equal(info.effects[0].rate,0.5); assert.equal(info.effects[1].chance,0.2);
            assert.match(info.lines[1],/命中後/); assert.match(info.effects[0].text,/耐性倍率50%/);
            traits($dataEnemies[1],[[14,stateId,1],[12,2,0]]);
            info=describe(); assert.equal(info.effects[0].chance,0); assert.equal(info.effects[0].immune,true);
            assert.equal(info.effects[1].chance,0);
            target._buffs[2]=-2; assert.equal(describe().effects[1].blocked,true);
        `);
    });
}

test('attack state id0 expands subject.attackStates, combines rates once, honors state immunity', () => {
    setup()(`
        skill.effects=[{code:21,dataId:0,value1:0.8}];
        traits($dataActors[1],[[32,stateId,0.5]]); traits($dataEnemies[1],[[13,stateId,0.25]]);
        Game_Action.prototype.lukEffectRate=()=>0.5;
        let effect=describe().effects[0]; assert.equal(effect.id,stateId); assert.equal(effect.attack,true);
        assert.equal(effect.chance,0.05);
        skill.meta.NoLukStateSkill=true; assert.equal(describe().effects[0].chance,0.1);
        skill.meta.CertainStateSkill=true; assert.equal(describe().effects[0].chance,0.4);
        $dataEnemies[1].traits.push({code:14,dataId:stateId,value:1}); assert.equal(describe().effects[0].chance,0);
        traits($dataActors[1],[]); assert.equal(describe().effects.length,0);
    `);
});

test('NUUN NoLuk state/skill, certain-state tags, opposing/allied mode; stock certain-hit difference', () => {
    setup()(`
        skill.effects=[{code:21,dataId:stateId,value1:0.4}]; skill.hitType=0;
        traits($dataEnemies[1],[[13,stateId,0.5]]); Game_Action.prototype.lukEffectRate=()=>0.5;
        assert.equal(describe().effects[0].chance,0.1,'NUUN opposite mode applies even for certain-hit');
        $dataStates[stateId].meta.NoLukState=true; assert.equal(describe().effects[0].chance,0.2);
        $dataStates[stateId].meta={}; skill.meta.NoLukStateSkill=true; assert.equal(describe().effects[0].chance,0.2);
        skill.meta={CertainState:String(stateId)}; assert.equal(describe().effects[0].chance,0.4);
        skill.meta={AddCertainState:String(stateId)}; target._states.push(stateId);
        assert.equal(describe().effects[0].chance,0.4);
        skill.meta={}; assert.equal(Project3ResistRateDisplay.describe(action,subject).effects[0].chance,0.4);
    `);
    setup({nuun:false})(`
        skill.effects=[{code:21,dataId:stateId,value1:0.4}]; skill.hitType=0;
        traits($dataEnemies[1],[[13,stateId,0.5]]); Game_Action.prototype.lukEffectRate=()=>0.5;
        assert.equal(describe().effects[0].chance,0.4);
    `);
    setup({mode:0})(`
        skill.effects=[{code:21,dataId:stateId,value1:0.4}]; skill.hitType=0;
        traits($dataActors[1],[[13,stateId,0.5]]); Game_Action.prototype.lukEffectRate=()=>0.5;
        assert.equal(Project3ResistRateDisplay.describe(action,subject).effects[0].chance,0.1);
    `);
});

test('items, dead targets, unsupported effects and empty action', () => {
    setup()(`
        action.setItem(itemId);
        assert.equal(describe().element.label,'回復増幅');
        $dataItems[itemId].effects=[{code:22,dataId:stateId,value1:1},{code:21,dataId:stateId,value1:1}];
        target.setHp(0); const info=describe(); assert.equal(info.effects.length,1);
        assert.equal(info.effects[0].blocked,true); assert.equal(info.effects[0].chance,0);
        action.clear(); assert.equal(describe().valid,false);
        assert.equal(Project3ResistRateDisplay.describe(null,target).valid,false);
        assert.equal(Project3ResistRateDisplay.describe(action,null).valid,false);
    `);
});

for (const [width,height] of [[816,624],[480,816],[390,844],[808,1400],[1280,720],[816,480]]) {
    test(`real target windows, timeline/help exclusion and touch row geometry ${width}x${height}`, () => {
        setup({width,height})(`
            const scene=sceneFixture(), e=scene._enemyWindow, a=scene._actorWindow;
            const panel=scene._resistRateWindow, area=scene.skillWindowRect();
            assert.deepEqual(originalTouch,[Window_BattleEnemy.prototype.processTouch,Window_BattleActor.prototype.processTouch,
                Window_Selectable.prototype.processCancel,Window_Selectable.prototype.itemRect]);
            assert.deepEqual(scene.actorWindowRect(),originalActorRect.call(scene));
            scene.startEnemySelection(); scene.updateResistRateDisplay();
            const fits=Project3ResistRateDisplay.panelRect(scene).height>0;
            assert.equal(panel.visible,fits);
            if (fits) {
                assert.equal(panel.y,area.y); assert.ok(panel.y>=scene.battleCommandHeight()+76);
                assert.equal(e.y,panel.y+panel.height); assert.ok(e.maxPageRows()>=1);
                assert.equal(e.y+e.height,scene.helpWindowRect().y);
                assert.equal(panel._description.element.rate,0.75);
                for (const [text,x,y,w,h] of panel.contents.text) {
                    assert.ok(x>=0 && y>=0 && x+w<=panel.innerWidth && y+h<=panel.innerHeight);
                    assert.ok(panel.textWidth(text)<=panel.innerWidth);
                }
            } else assert.deepEqual(scene.enemyWindowRect(),originalEnemyRect.call(scene));
            for (const index of e.maxPageRows() > 0 ? [0,1] : []) {
                const r=e.itemRect(index), x=e.padding+r.x+r.width/2;
                // An already-too-short base viewport clips even an unmodified
                // row. Check its visible portion rather than changing base UI.
                const y=e.padding+Math.min(r.y+r.height/2,e.innerHeight-1);
                assert.equal(e.hitTest(x,y),index);
                TouchInput.x=e.x+x; TouchInput.y=e.y+y; e.onTouchSelect(false); assert.equal(e.index(),index);
            }
            e.hide(); e.deactivate(); scene.startActorSelection(); scene.updateResistRateDisplay();
            assert.equal(panel.visible,fits);
            for(let i=0;i<a.maxItems();i++) {
                const r=a.itemRect(i); assert.equal(a.hitTest(a.padding+r.x+r.width/2,a.padding+r.y+r.height/2),i);
            }
            assert.ok(a.y>=scene.helpWindowRect().y+scene.helpWindowRect().height);
        `);
    });
}

test('selection/target refresh, action switch, cancel hierarchy return and live trait changes', () => {
    setup()(`
        const scene=sceneFixture(); scene.startEnemySelection(); scene.updateResistRateDisplay();
        const panel=scene._resistRateWindow;
        traits($dataEnemies[1],[[11,2,2],[11,3,1]]); scene.updateResistRateDisplay();
        assert.equal(panel._description.element.rate,2);
        $gameTroop._enemies[1].elementRate=()=>0.5;
        scene._enemyWindow.select(1); scene.updateResistRateDisplay(); assert.equal(panel._description.element.rate,0.25);
        $gameTroop._enemies[1].setHp(0); scene._enemyWindow.refresh(); scene.updateResistRateDisplay();
        assert.equal(panel._description.element.rate,2,'new occupant at selected index');
        action.setItem(itemId); scene.updateResistRateDisplay(); assert.equal(panel._description.damageType,3);
        scene._enemyWindow.processCancel(); scene.updateResistRateDisplay(); assert.equal(panel.visible,false);
        assert.equal(scene._skillWindow.active,true); assert.equal(scene._actorCommandWindow.currentSymbol(),'skill');
        scene._skillWindow.hide(); scene._skillWindow.deactivate();
        scene.startActorSelection(); scene._actorWindow.select(2); scene.updateResistRateDisplay();
        assert.equal(panel.visible,true); assert.equal(panel._description.element.label,'回復等倍');
        scene._actorWindow.processCancel(); scene.updateResistRateDisplay(); assert.equal(panel.visible,false);
        assert.equal(scene._skillWindow.active,true);
        scene._skillWindow.processCancel(); assert.equal(scene._actorCommandWindow._battleCommandLayer,'fight');
    `);
});

test('real battler-sprite touch forwarding and cancel handlers remain functional', () => {
    setup()(`
        const scene=sceneFixture(); scene.startEnemySelection();
        let confirmed=-1;
        scene._enemyWindow.setHandler('ok',()=>{confirmed=scene._enemyWindow.index();});
        $gameTemp.setTouchState($gameTroop.members()[1],'click'); scene._enemyWindow.processTouch();
        assert.equal(confirmed,1); assert.equal($gameTemp.touchTarget(),null);
        scene._enemyWindow.hide(); scene.startActorSelection();
        scene._actorWindow.setHandler('ok',()=>{confirmed=scene._actorWindow.index();});
        $gameTemp.setTouchState($gameParty.battleMembers()[2],'click'); scene._actorWindow.processTouch();
        assert.equal(confirmed,2); assert.equal($gameTemp.touchTarget(),null);
    `);
});

test('UI fails closed on calculation errors/NaN without stale text or disabling cancellation', () => {
    setup()(`
        const scene=sceneFixture(); scene.startEnemySelection(); scene.updateResistRateDisplay();
        Game_Action.prototype.calcElementRate=()=>{throw new Error('incompatible plugin');};
        const before=snapshots(); scene.updateResistRateDisplay();
        assert.equal(scene._resistRateWindow._description.valid,false);
        assert.match(scene._resistRateWindow._description.lines[0],/プレビュー不可/);
        assert.equal(snapshots(),before);
        Game_Action.prototype.calcElementRate=()=>NaN; assert.equal(describe().valid,false);
        scene._enemyWindow.processCancel(); scene.updateResistRateDisplay();
        assert.equal(scene._resistRateWindow.visible,false); assert.equal(scene._skillWindow.active,true);
    `);
});