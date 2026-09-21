const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

function setup(width = 816, height = 624) {
    const context = vm.createContext({ assert, console });
    const run = source => vm.runInContext(source, context);
    run(read('js/rmmz_core.js').split('function Utils()')[0]);
    run(read('js/rmmz_managers.js').split('function ConfigManager()')[0]);
    run(read('js/rmmz_objects.js'));
    for (const name of ['System', 'Actors', 'Classes', 'Weapons', 'Armors', 'States', 'Skills', 'Items']) {
        run(`$data${name} = ${read(`data/${name}.json`)};`);
    }
    run(`
        function Stage() {}
        function Window() {}
        class Rectangle {
            constructor(x,y,width,height) { Object.assign(this, {x,y,width,height}); }
            pad(x,y) { this.x-=x; this.y-=y; this.width+=x*2; this.height+=y*2; }
            contains(x,y) { return x>=this.x && y>=this.y && x<this.x+this.width && y<this.y+this.height; }
        }
        Window.prototype.initialize = function() { this.origin={x:0,y:0}; this.openness=255; this.visible=true; };
        Window.prototype.move = function(x,y,width,height) { Object.assign(this, {x,y,width,height}); };
        Window.prototype.setTone = function() {};
        Window.prototype.setCursorRect = function() {};
        Window.prototype.moveCursorBy = function() {};
        Window.prototype.moveInnerChildrenBy = function() {};
        Window.prototype.isOpen = function() { return true; };
        Window.prototype.update = function() {};
        Object.defineProperties(Window.prototype, {
            innerWidth: {get() {return this.width-this.padding*2;}},
            innerHeight: {get() {return this.height-this.padding*2;}}
        });
        class Bitmap {
            constructor(width,height) { Object.assign(this, {width,height,draws:[]}); }
            clear() {this.draws=[];}
            destroy() {}
            drawText(text,x,y,width,height) { this.draws.push({text,x,y,width,height,size:this.fontSize}); }
            measureTextWidth(text) {return String(text).length*this.fontSize;}
            gradientFillRect() {} strokeRect() {} blt() {}
        }
        const Graphics={width:${width},height:${height},boxWidth:${width},boxHeight:${height}};
        const Utils={isMobileDevice:()=>false,isOptionValid:()=>false};
        const ConfigManager={touchUI:false};
        const ImageManager={loadSystem:()=>({}),iconWidth:32,iconHeight:32};
        const ColorManager={normalColor:()=> '#fff',outlineColor:()=> '#000',systemColor:()=> '#ff0',
            textColor:n=>String(n),itemBackColor1:()=> '#111',itemBackColor2:()=> '#222'};
        const Input={update(){this.updates++;},updates:0,isRepeated:()=>false,isTriggered:()=>false};
        const TouchInput={update(){},isTriggered:()=>false};
        const SoundManager={playOk(){},playCancel(){},playCursor(){}};
        const SceneManager={pop(){this.popped=true;}};
        const TextManager={hpA:'HP',mpA:'MP',tpA:'TP',levelA:'Lv',param:id=>$dataSystem.terms.params[id]};
        $gameTemp=new Game_Temp();
        $gameSystem=new Game_System();
        $gameActors=new Game_Actors();
        $gameParty=new Game_Party();
        $gameParty._actors=[1,2];
    `);
    run(read('js/rmmz_windows.js'));
    run(read('js/rmmz_scenes.js'));
    run(read('js/plugins.js'));
    run(`const PluginManager={_scripts:$plugins.filter(p=>p.status).map(p=>p.name),
        parameters:name=>$plugins.find(p=>p.name===name)?.parameters||{}};`);
    run(read('js/plugins/Status/HideUnusedParameters.js'));
    run(read('js/plugins/FlexibleTopDownUI.js'));
    run(read('js/plugins/HelpWindowThreeLines.js'));
    run(`
        // Keep actual windows, drawing, input handlers, actors and trait math.
        // Only non-UI scene services (background/layer/OS buttons) are omitted.
        Scene_MenuBase.prototype.create=function(){this.updateActor();};
        const scene=Object.create(Scene_Status.prototype);
        scene._windows=[];
        scene.addWindow=function(win){this._windows.push(win);};
        scene.create();
        scene.refreshActor();
        const command=scene._statusCommandWindow;
        const basic=scene._statusWindow;
        const detail=scene._statusDetailWindow;
        const actor=scene.actor();
    `);
    return run;
}

for (const [width, height] of [[816,624],[480,816],[1280,720],[816,400]]) {
    test(`status keeps two non-overlapping scrollable panels at ${width}x${height}`, () => {
        setup(width,height)(`
            assert.deepEqual(command._list.map(c=>c.name),['ステート状況','弱点･耐性','威力増加','戻る']);
            assert.equal(command.innerHeight,command.itemHeight());
            assert.equal(command.maxCols(),4);
            assert.equal(command.isTouchOkEnabled(),true, 'commands confirm with one tap, not a double tap');
            assert.equal(basic.x,0);
            assert.equal(basic.x+basic.width,detail.x);
            assert.equal(detail.x+detail.width,Graphics.boxWidth);
            assert.equal(basic.y,command.y+command.height);
            assert.equal(detail.y,basic.y);
            assert.equal(detail.y+detail.height,Graphics.boxHeight);
            assert.equal(basic.y+basic.height,Graphics.boxHeight);
            assert.equal(detail._mode,'states');
            command.selectSymbol('resistance');
            assert.equal(detail.maxScrollY(),Math.max(0,detail.overallHeight()-detail.innerHeight));
            // Without the equipment list the basic panel only scrolls when its rows overflow.
            assert.equal(basic.maxScrollY(),Math.max(0,basic.overallHeight()-basic.innerHeight));
            if (basic.maxScrollY()>0) {
                basic.scrollTo(0,basic.maxScrollY());
                assert.ok(basic.scrollY()>0);
            }
            assert.equal(command.y,0);
            assert.equal(command.active,true);
            assert.equal(basic.active,false);
            assert.equal(detail.active,false);
            assert.ok(basic._rows.some(row=>row.label===actor.name()));
            assert.ok(!basic._rows.some(row=>row.label==='装備'), 'equipment list is not part of the status screen');
            assert.ok(!basic._rows.some(row=>row.label===$dataSystem.equipTypes[1]));
            // Element tables pair two entries per line; headings keep their own line.
            const elementCount=$dataSystem.elements.filter((name,id)=>id&&name).length;
            const firstHeading=detail._lines[0];
            assert.equal(firstHeading.length,1);
            assert.equal(firstHeading[0].heading,true);
            const elementLines=detail._lines.slice(1,1+Math.ceil(elementCount/2));
            assert.ok(elementLines.every(line=>line.length===2||line===elementLines[elementLines.length-1]));
            assert.equal(elementLines.flat().length,elementCount);
            assert.equal(detail._lines[1+Math.ceil(elementCount/2)][0].heading,true);
            assert.equal(detail.itemHeight(),40);
            for (const win of [basic,detail,command]) {
                for (const draw of win.contents.draws) {
                    assert.ok(draw.x>=0 && draw.x+draw.width<=win.innerWidth+0.01);
                    assert.ok(String(draw.text).length*draw.size<=draw.width+0.01, 'text fits even without canvas maxWidth');
                }
            }
        `);
    });
}

test('command selection previews right panel; confirm focuses it and cancel restores commands', () => {
    setup()(`
        const basicRows=JSON.stringify(basic._rows);
        command.selectSymbol('states');
        assert.equal(detail._mode,'states');
        assert.equal(JSON.stringify(basic._rows),basicRows);
        command.processOk();
        assert.equal(detail.active,true);
        assert.equal(command.active,false);
        detail.processCancel();
        assert.equal(command.active,true);
        command.selectSymbol('resistance');
        assert.equal(detail._mode,'resistance');
        command.selectSymbol('power');
        assert.equal(detail._mode,'power');
        assert.equal(detail.columns(),2);
        command.selectSymbol('states');
        assert.equal(detail.columns(),1);
        assert.equal(detail.itemHeight(),76);
        assert.ok(detail._lines.every(line=>line.length===1));
        command.selectSymbol('back');
        assert.equal(detail._mode,'states');
        command.processOk();
        assert.equal(SceneManager.popped,true);
    `);
});

test('unused parameters are excluded from status and equipment displays', () => {
    setup()(`
        detail.setMode('basic');
        const labels = detail._rows.map(row => row.label);
        assert.deepEqual(globalThis.StatusVisibleParamIds, [2, 4, 6]);
        assert.ok(labels.includes($dataSystem.terms.params[2]));
        assert.ok(labels.includes($dataSystem.terms.params[4]));
        assert.ok(labels.includes($dataSystem.terms.params[6]));
        assert.ok(!labels.includes($dataSystem.terms.params[3]));
        assert.ok(!labels.includes($dataSystem.terms.params[5]));
        assert.ok(!labels.includes($dataSystem.terms.params[7]));
        assert.equal(Window_StatusParams.prototype.maxItems(), 3);
        const drawnParamIds = [];
        Window_EquipStatus.prototype.drawAllParams.call({
            itemPadding: () => 0,
            paramY: index => index,
            drawItem: (x, y, paramId) => drawnParamIds.push(paramId)
        });
        assert.deepEqual(drawnParamIds, [2, 4, 6]);
    `);
});

test('panel arrows consume the key and focus exactly one panel', () => {
    setup()(`
        scene.openStatusDetail('states');
        detail.cursorLeft();
        assert.equal(Input.updates,1);
        assert.equal(basic.active,true);
        assert.equal(detail.active,false);
        basic.cursorRight();
        assert.equal(Input.updates,2);
        assert.equal(detail.active,true);
        assert.equal(basic.active,false);
        assert.equal(command.active,false);
    `);
});

test('effective element and state rates include actor equipment, states and immunity', () => {
    setup()(`
        const fixture={id:$dataStates.length,name:'検証耐性',iconIndex:0,priority:50,
            traits:[{code:11,dataId:2,value:1.5},{code:11,dataId:3,value:0},
                    {code:11,dataId:4,value:0.5},{code:13,dataId:4,value:0.5},{code:14,dataId:5,value:1}]};
        $dataStates.push(fixture);
        actor._states=[fixture.id];
        $dataStates[5].note += '<StatusState:10>';
        command.selectSymbol('resistance');
        scene.refreshActor();
        for (const id of [2,3,4]) {
            const row=detail._rows.find(row=>row.label===$dataSystem.elements[id]);
            assert.ok(row.value.endsWith(detail.percent(actor.elementRate(id))));
        }
        assert.ok(detail._rows.find(row=>row.label===$dataSystem.elements[2]).value.startsWith('弱点'));
        assert.ok(detail._rows.find(row=>row.label===$dataSystem.elements[3]).value.startsWith('無効'));
        assert.ok(detail._rows.find(row=>row.label===$dataSystem.elements[4]).value.startsWith('耐性'));
        assert.equal(detail._rows.find(row=>row.label===$dataStates[5].name).value,'無効 0%');
        const weapon=$dataWeapons.find(Boolean);
        actor._equips[0].setObject(weapon);
        weapon.traits.push({code:11,dataId:2,value:0.5});
        scene.refreshActor();
        assert.equal(detail._rows.find(row=>row.label===$dataSystem.elements[2]).value,'耐性 75%');
    `);
});

test('element power panel reads Keke 属性威力 tags from equipment, states and passive objects', () => {
    setup()(`
        const fire=$dataSystem.elements.indexOf('炎');
        const ice=$dataSystem.elements.indexOf('氷');
        const slash=$dataSystem.elements.indexOf('斬');
        const weapon=$dataWeapons.find(Boolean);
        const originalNote=weapon.note;
        weapon.note=originalNote+'\\n<属性威力: *1.5, 炎>\\n<elementAtk: +*0.5, 炎, 氷>\\n<属性威力: /2, !炎>';
        actor._equips[0].setObject(weapon);
        const stateId=$dataStates.length;
        $dataStates.push({id:stateId,name:'威力検証',iconIndex:0,priority:50,traits:[{code:31,dataId:slash,value:1}],
            note:'<属性威力: +100, 全>'});
        actor._states=[stateId];
        actor.passiveSkillObject=()=>[{note:'<属性威力: *1.1, 炎>'}, null];
        scene.refreshActor();
        command.selectSymbol('power');
        const rows=()=>detail._rows;
        const value=name=>rows().find(row=>row.label===name).value;
        // (1 + 0.5) * 1.5 * 1.1 = 247.5%, flat +100 scaled by the multiplier.
        assert.equal(value('炎'),'増加 247.5% +165');
        assert.equal(value('氷'),'減少 75% +50');
        assert.equal(value('雷'),'減少 50% +50');
        assert.equal(rows().find(row=>row.label==='炎').tone,3);
        assert.equal(value('通常攻撃の属性'),'近接物理・斬');
        assert.equal(detail._lines[0][0].heading,true);
        assert.equal(detail._lines[1].length,2);
        weapon.note=originalNote;
        actor._states=[];
        delete actor.passiveSkillObject;
        scene.refreshActor();
        assert.equal(value('炎'),'通常 100%');
        assert.equal(value('通常攻撃の属性'),'近接物理');
    `);
});

test('states include iconless effects, turn/walking durations, permanent effects and buffs', () => {
    setup()(`
        const start=$dataStates.length;
        $dataStates.push(
            {id:start,name:'期限付き',iconIndex:0,traits:[],autoRemovalTiming:2,removeByWalking:true,stepsToRemove:50},
            {id:start+1,name:'永続',iconIndex:0,traits:[],autoRemovalTiming:0},
            {id:start+2,name:'戦闘限定',iconIndex:1,traits:[],autoRemovalTiming:0,removeAtBattleEnd:true});
        actor._states=[start,start+1,start+2];
        actor._stateTurns[start]=3;
        actor._stateSteps[start]=12;
        actor._buffs[2]=2; actor._buffTurns[2]=4;
        actor._buffs[3]=-1; actor._buffTurns[3]=2;
        scene.refreshActor();
        command.selectSymbol('states');
        const rows=detail._rows;
        assert.equal(rows.find(r=>r.label==='期限付き').value,'残り 3 ターン／ターン終了時');
        assert.equal(rows.find(r=>r.label==='歩行で解除').value,'残り 12 歩');
        assert.equal(rows.find(r=>r.label==='永続').value,'自動解除なし');
        assert.equal(rows.find(r=>r.label==='戦闘限定').value,'戦闘終了時に解除');
        assert.ok(rows.some(r=>r.value==='150%／残り 4 ターン'));
        assert.ok(!rows.some(r=>r.value==='75%／残り 2 ターン'));
    `);
});

test('state details use DescriptionExtend text from either supported note tag', () => {
    setup()(`
        const start=$dataStates.length;
        $dataStates.push(
            {id:start,name:'拡張説明',iconIndex:0,traits:[],note:'<拡張説明:戦闘中に効果が続く。>'},
            {id:start+1,name:'ExtendDesc',iconIndex:0,traits:[],note:'<ExtendDesc:特別な状態の説明。>'});
        actor._states=[start,start+1];
        scene.refreshActor();
        command.selectSymbol('states');
        assert.equal(detail._rows.find(r=>r.label==='詳細説明' && r.value==='戦闘中に効果が続く。').value,
            '戦闘中に効果が続く。');
        assert.equal(detail._rows.find(r=>r.label==='詳細説明' && r.value==='特別な状態の説明。').value,
            '特別な状態の説明。');
    `);
});

test('state resistance list includes only scored StatusState tags in ascending priority', () => {
    setup()(`
        const start=$dataStates.length;
        $dataStates.push(
            {id:start,name:'表示優先20',iconIndex:0,note:'<StatusState:20>',traits:[]},
            {id:start+1,name:'表示優先5',iconIndex:0,note:'<StatusState:5>',traits:[]},
            {id:start+2,name:'表示対象外',iconIndex:0,note:'<NoLukState>',traits:[]});
        command.selectSymbol('resistance');
        const names=detail._rows.map(row=>row.label);
        assert.ok(names.includes('表示優先5'));
        assert.ok(names.includes('表示優先20'));
        assert.ok(!names.includes('表示対象外'));
        assert.ok(names.indexOf('表示優先5') < names.indexOf('表示優先20'));
    `);
});

test('actor switching refreshes both panels without changing mode or focus; empty states are explicit', () => {
    setup()(`
        scene.openStatusDetail('states');
        detail.processPagedown();
        assert.notEqual(scene.actor(),actor);
        assert.equal(basic._actor,scene.actor());
        assert.equal(detail._actor,scene.actor());
        assert.equal(detail._mode,'states');
        assert.equal(detail.active,true);
        assert.equal(command.active,false);
        assert.ok(detail._rows.some(r=>r.label==='ステートなし'));
        assert.ok(detail._rows.some(r=>r.label==='強化・弱体なし'));
        detail.processPageup();
        assert.equal(scene.actor(),actor);
    `);
});