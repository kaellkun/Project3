const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const addon = 'js/plugins/Menu/DestinationExternalData.js';
const sample = read('data/Destinations.json');

function setup({ mode = '', base = true, flexible = true, spacing = false, width = 816, height = 624,
    params = {}, achievement = false } = {}) {
    const context = vm.createContext({ assert, console });
    const run = code => vm.runInContext(code, context);
    run(read('js/rmmz_core.js').split('function Utils()')[0]);
    const managers = read('js/rmmz_managers.js');
    run(managers.split('function ConfigManager()')[0]);
    run(managers.slice(managers.indexOf('function PluginManager()')));
    run(read('js/rmmz_objects.js'));
    run(`
        const window = globalThis;
        const document = {currentScript:null};
        const requests = [];
        const Utils = {isMobileDevice:()=>false, isOptionValid:name=>name===${JSON.stringify(mode)},
            cacheBustedUrl:url=>url+'?v=test'};
        class XMLHttpRequest {
            open(method,url) {this.method=method;this.url=url;}
            overrideMimeType(mime) {this.mime=mime;}
            send() {requests.push(this);}
            respond(text,status=200) {this.responseText=text;this.status=status;this.onload();}
        }
        function Stage() {}
        function Window() {}
        class Point {constructor(x,y){Object.assign(this,{x,y});}}
        class Rectangle {
            constructor(x,y,width,height) {Object.assign(this,{x,y,width,height});}
            pad(x,y) {this.x-=x;this.y-=y;this.width+=x*2;this.height+=y*2;}
            contains(x,y) {return x>=this.x && y>=this.y && x<this.x+this.width && y<this.y+this.height;}
        }
        Window.prototype.initialize=function(){
            this.origin={x:0,y:0};this.openness=255;this.visible=true;
            this.worldTransform={applyInverse:p=>new Point(p.x-this.x,p.y-this.y)};
        };
        Window.prototype.move=function(x,y,width,height){Object.assign(this,{x,y,width,height});};
        for(const name of ['setTone','setCursorRect','moveCursorBy','moveInnerChildrenBy','update']) Window.prototype[name]=function(){};
        Window.prototype.isOpen=function(){return this.openness===255;};
        Object.defineProperties(Window.prototype,{
            innerWidth:{get(){return Math.max(0,this.width-this.padding*2);}},
            innerHeight:{get(){return Math.max(0,this.height-this.padding*2);}},
            innerRect:{get(){return new Rectangle(this.padding,this.padding,this.innerWidth,this.innerHeight);}}
        });
        let allocations=0;
        class Bitmap {
            constructor(width,height){
                assert.ok(width>=0 && height>=0); allocations++;
                Object.assign(this,{width,height,draws:[],_baseTexture:{update(){}}});
                const bitmap=this, stack=[];
                this.context={font:'24px test',save(){stack.push(this.font);},restore(){this.font=stack.pop();},
                    measureText(text){return {width:Array.from(String(text)).length*(parseFloat(this.font.match(/[\\d.]+px/)?.[0])||24)};},
                    strokeText(){},fillText(text,x,y){bitmap.draws.push({text,x,y,size:bitmap.fontSize,color:bitmap.textColor});}};
            }
            _makeFontNameText(){return this.fontSize+'px '+this.fontFace;}
            _drawTextOutline(text,x,y,width){this.context.strokeText(text,x,y,width);}
            _drawTextBody(text,x,y,width){this.context.fillText(text,x,y,width);}
            clear(){this.draws=[];} destroy(){}
            drawText(text,x,y,width,height){this.draws.push({text,x,y,width,height,size:this.fontSize,color:this.textColor});}
            measureTextWidth(text){return Array.from(String(text)).length*this.fontSize;}
            blt(...args){this.draws.push({icon:true,args});} gradientFillRect(){} strokeRect(){}
        }
        const Graphics={width:${width},height:${height},boxWidth:${width},boxHeight:${height}};
        const ConfigManager={touchUI:false};
        const ImageManager={loadSystem:()=>({}),iconWidth:32,iconHeight:32};
        const ColorManager={normalColor:()=> '#fff',outlineColor:()=> '#000',systemColor:()=> '#ff0',
            textColor:n=>'color'+n,itemBackColor1:()=> '#111',itemBackColor2:()=> '#222'};
        const Input={keyRepeatInterval:6,key:'',update(){this.key='';},isRepeated(k){return k===this.key;},isTriggered(k){return k===this.key;}};
        const TouchInput={x:-100,y:-100,wheelY:0,trigger:false,moved:false,released:false,
            update(){this.trigger=false;this.released=false;},isTriggered(){return this.trigger;},isHovered:()=>false,
            isMoved(){return this.moved;},isReleased(){return this.released;},isClicked:()=>false,isCancelled:()=>false};
        const SoundManager={playOk(){},playCancel(){},playCursor(){},playBuzzer(){}};
        const SceneManager={pop(){this.popped=true;},onSceneTerminate(){}};
        const TextManager=new Proxy({currencyUnit:'G'},{get:(o,k)=>o[k]||String(k)});
        const StorageManager={loadObject:()=>Promise.resolve({unlockInfo:[]}),saveObject:()=>Promise.resolve()};
        const NUUN_Base_Ver=113;
        DataManager.nuun_structureData=value=>JSON.parse(value).map(JSON.parse);
        const originalExtract=DataManager.extractSaveContents;
    `);
    run(read('js/rmmz_windows.js'));
    run(read('js/rmmz_scenes.js'));
    // Install before the addon captures Menu.update (which is inherited).
    run(`Scene_MenuBase.prototype.update=function(){for(const w of this._windows) w.update();};`);
    run(read('js/plugins.js'));
    run(`for(const p of $plugins) PluginManager.setParameters(p.name.split('/').pop(),p.parameters);
        PluginManager._scripts=$plugins.filter(p=>p.status).map(p=>p.name);
        PluginManager.setParameters('DestinationExternalData',{DataFile:'Destinations.json',FontSize:'24',VisibleLines:'2',...${JSON.stringify(params)}});`);
    if (base) run(read('js/plugins/Menu/NUUN_Destination.js'));
    if (spacing) run(read('js/plugins/MainFontLetterSpacing.js'));
    if (flexible) run(read('js/plugins/FlexibleTopDownUI.js'));
    if (achievement) {
        run(read('js/plugins/Scene/TorigoyaMZ_Achievement2.js'));
        run(read('js/plugins/Scene/addon/AchievementExternalData.js'));
    }
    run(read(addon));
    run(`
        function externalRequest(){return requests.filter(r=>r.url.includes('Destinations.json')).at(-1);}
        function completeBase(){for(const r of requests.filter(r=>!r.url.includes('Destinations.json'))) r.respond('{}');}
        function prepareGame(){
            $dataSystem=${read('data/System.json')};
            $gameSystem=new Game_System();$gameTemp=new Game_Temp();$gameParty=new Game_Party();
            $gameMap={requestRefresh(){}};
            $gameVariables=new Game_Variables();$gameActors={actor:id=>({name:()=> 'Actor'+id})};
        }
        function makePanel(width=400,height=120){return new Window_MenuDestination(new Rectangle(0,0,width,height));}
        // Only scene services (PIXI layers/background) are replaced, not Menu.create/rects.
        Scene_MenuBase.prototype.create=function(){};
        Scene_MenuBase.prototype.update=function(){for(const w of this._windows) w.update();};
        function makeScene(){
            const scene=Object.create(Scene_Menu.prototype);scene._windows=[];
            scene.addWindow=function(w){this._windows.push(w);};
            scene.create();return scene;
        }
    `);
    const respond = (data = sample, status = 200) => run(`externalRequest().respond(${JSON.stringify(data)},${status});`);
    const ready = (data = sample) => { run('DataManager.loadDatabase();completeBase();'); respond(data); run('assert.equal(DataManager.isDatabaseLoaded(),true);prepareGame();'); };
    return { run, respond, ready };
}

for (const mode of ['', 'btest', 'etest']) {
    test(`real DataManager load (${mode || 'normal'}): independent cache-aware external request`, () => {
        const { run, respond } = setup({ mode });
        run(`DataManager.loadDatabase();
            assert.equal(DataManager._databaseFiles.some(f=>f.name==='$dataDestinationExternal'),false);
            assert.equal(externalRequest().url,'data/Destinations.json?v=test');
            assert.equal(externalRequest().method,'GET');assert.equal(externalRequest().mime,'application/json');
            assert.equal(requests[0].url.includes('Test_'),${!!mode});
            assert.equal(DataManager.isDatabaseLoaded(),false);`);
        respond();
        run('assert.equal(DataManager.isDatabaseLoaded(),false);completeBase();assert.equal(DataManager.isDatabaseLoaded(),true);');
    });
}
test('registration is unique and after its dependencies; real JSON preserves all five legacy strings', () => {
    const { run, ready } = setup(); ready();
    run(`const addonIndex=$plugins.findIndex(p=>p.name==='Menu/DestinationExternalData');
        for(const name of ['Menu/NUUN_Destination','FlexibleTopDownUI','BattleEquipCommand']) {
            assert.ok(addonIndex>$plugins.findIndex(p=>p.name===name));
        }
        assert.equal($plugins.filter(p=>p.name==='Menu/DestinationExternalData').length,1);
        assert.equal($plugins[addonIndex].status,true);
        assert.equal($dataDestinationExternal.initialId,0);
        const legacy=DataManager.nuun_structureData(PluginManager.parameters('NUUN_Destination').DestinationList);
        assert.equal(legacy.length,5);
        legacy.forEach((v,i)=>assert.equal($dataDestinationExternal.byId[i+1].text,v.DestinationText));`);
});
test('BOM and array text normalize; arbitrary $comment is ignored', () => {
    const { run, ready } = setup();
    ready('\uFEFF'+JSON.stringify({ $comment: { note: true }, initialId: 1, destinations: [{ id: 1, text: ['一行', '二行'], $comment: 4 }] }));
    run(`assert.equal($gameSystem.getDestinationId(),1);assert.equal($gameSystem.getDestinationList(),'一行\\n二行');`);
});
for (const failure of ['404', 'network']) {
    test(`${failure}: installed retry reloads same logical filename`, () => {
        const { run, respond } = setup();
        run('DataManager.loadDatabase();completeBase();');
        if (failure === '404') respond('not json', 404);
        else run('externalRequest().onerror();');
        run(`let failure;try{DataManager.isDatabaseLoaded();}catch(e){failure=e;}
            assert.equal(failure[0],'LoadError');assert.equal(failure[1],'data/Destinations.json');
            failure[2]();assert.equal(externalRequest().url,'data/Destinations.json?v=test');`);
        respond(); run('assert.equal(DataManager.isDatabaseLoaded(),true);');
    });
}
const invalidCases = [
    ['null', null, 'ルート'], ['root array', [], 'ルート'], ['missing array', { initialId: 0 }, 'destinations'],
    ['missing initial', { destinations: [] }, 'initialId'],
    ['root unknown', { initialId: 0, destinations: [], extra: true }, 'extra'],
    ['negative initial', { initialId: -1, destinations: [] }, 'initialId'],
    ['unknown initial', { initialId: 1, destinations: [] }, 'initialId'],
    ['entry null', { initialId: 0, destinations: [null] }, 'destinations[0]'],
    ['zero id', { id: 0, text: '' }, '.id'], ['negative id', { id: -1, text: '' }, '.id'],
    ['fraction id', { id: 1.5, text: '' }, '.id'], ['string id', { id: '1', text: '' }, '.id'],
    ['unsafe id', { id: 9007199254740992, text: '' }, '.id'], ['missing id', { text: '' }, '.id'],
    ['missing text', { id: 1 }, '.text'], ['number text', { id: 1, text: 5 }, '.text'],
    ['mixed lines', { id: 1, text: ['ok', null] }, '.text[1]'],
    ['entry unknown', { id: 1, text: '', note: '' }, '.note'],
    ['duplicate', { initialId: 0, destinations: [{ id: 1, text: 'a' }, { id: 1, text: 'b' }] }, 'destinations[1].id']
];
for (const [name, input, field] of invalidCases) {
    test(`schema ${name}: delayed startup error names file and field`, () => {
        const { run, respond } = setup();
        run('DataManager.loadDatabase();completeBase();');
        const data = input && !Array.isArray(input) && ('id' in input || 'text' in input)
            ? { initialId: 0, destinations: [input] } : input;
        respond(JSON.stringify(data));
        run(`assert.equal($dataDestinationExternal,null);
            assert.throws(()=>DataManager.isDatabaseLoaded(),e=>e.message.includes('data/Destinations.json')&&e.message.includes(${JSON.stringify(field)}));
            assert.equal(DataManager._errors.length,0);`);
    });
}
test('malformed JSON errors on boot loop, fresh load recovers', () => {
    const { run, respond } = setup(); run('DataManager.loadDatabase();'); respond('{');
    run(`assert.throws(()=>DataManager.isDatabaseLoaded(),e=>e.message.includes('data/Destinations.json'));DataManager.loadDatabase();completeBase();`);
    respond(); run('assert.equal(DataManager.isDatabaseLoaded(),true);');
});
test('missing NUUN dependency has actionable error', () => assert.throws(() => setup({ base: false }), /NUUN_Destination/));
for (const file of ['../Destinations.json', '/Destinations.json', 'Destinations.json?x', 'wrong.txt']) {
    test(`invalid DataFile ${file}`, () => assert.throws(() => setup({ params: { DataFile: file } }), /DataFile/));
}
test('other data XHR and AchievementExternalData hooks are preserved', () => {
    const { run, respond } = setup({ achievement: true });
    run(`DataManager.loadDatabase();for(const r of requests.filter(r=>!r.url.includes('Destinations.json')&&!r.url.includes('Achievements.json')))r.respond('{}');
        DataManager.onXhrLoad({status:200,responseText:'[{"note":"<Flag>"}]'},'$dataItems','Items.json','data/Items.json');
        assert.equal($dataItems[0].meta.Flag,true);`);
    respond(); run('assert.equal(DataManager.isDatabaseLoaded(),false);');
    run(`requests.find(r=>r.url.includes('Achievements.json')).respond(JSON.stringify({achievements:[]}));`);
    run('assert.equal(DataManager.isDatabaseLoaded(),true);assert.equal(Torigoya.Achievement2.parameter.baseAchievementData.length,0);');
});
for (const name of ['DestinationExternalData', 'Menu/DestinationExternalData', 'NUUN_Destination', 'Menu/NUUN_Destination']) {
    test(`real command dispatch ${name} and rejects bad IDs without changing saved value`, () => {
        const { run, ready } = setup(); ready();
        run(`const name=${JSON.stringify(name)};
            PluginManager.callCommand({},name,'SetDestination',{id:'2'});
            assert.equal($gameSystem.getDestinationId(),2);
            assert.equal(Window_Base.prototype.getDestinationList.call({}),$dataDestinationExternal.byId[2].text);
            for(const id of ['', ' ', 'NaN', '1.2', '-1', '1e2', '9007199254740992', null, undefined, {}, NaN, Infinity]){
                assert.throws(()=>PluginManager.callCommand({},name,'SetDestination',{id}));
                assert.equal($gameSystem.getDestinationId(),2);
            }
            PluginManager.callCommand({},name,'SetDestination',{id:'0'});assert.equal($gameSystem.getDestinationList(),null);`);
    });
}
test('clear aliases, empty data/text, safe maximum and unknown IDs', () => {
    const { run, ready } = setup(); ready(JSON.stringify({ initialId: 0, destinations: [] }));
    run(`assert.equal(makePanel()._resolvedText,'未設定');
        $gameSystem.setDestinationId(Number.MAX_SAFE_INTEGER);
        assert.equal($gameSystem.getDestinationList(),'未登録の行動目標（ID:9007199254740991）');
        for(const name of ['DestinationExternalData','Menu/DestinationExternalData']){
            PluginManager.callCommand({},name,'ClearDestination',{});assert.equal($gameSystem.getDestinationId(),0);
        }`);
    ready(JSON.stringify({ initialId: 1, destinations: [{ id: 1, text: [] }] }));
    run(`assert.equal($gameSystem.getDestinationList(),'');assert.equal(makePanel()._resolvedText,'未設定');`);
});
test('reorder/delete preserve saved ID; real extractSaveContents is untouched; initial ID only on new system', () => {
    const { run, ready, respond } = setup();
    ready(JSON.stringify({ initialId: 2, destinations: [{ id: 1, text: 'one' }, { id: 2, text: 'two' }] }));
    run(`assert.equal($gameSystem.getDestinationId(),2);
        $gameSystem.setDestinationId(1);const saved=DataManager.makeSaveContents();
        $gameSystem=new Game_System();assert.equal($gameSystem.getDestinationId(),2);
        DataManager.extractSaveContents(saved);assert.equal($gameSystem.getDestinationId(),1);
        assert.equal(DataManager.extractSaveContents,originalExtract);`);
    respond(JSON.stringify({ initialId: 2, destinations: [{ id: 2, text: 'two' }, { id: 1, text: 'one' }] }));
    run(`assert.equal($gameSystem.getDestinationList(),'one');`);
    respond(JSON.stringify({ initialId: 2, destinations: [{ id: 2, text: 'two' }] }));
    run(`assert.equal($gameSystem.getDestinationId(),1);assert.equal($gameSystem.getDestinationList(),'未登録の行動目標（ID:1）');
        assert.equal(DataManager.makeSaveContents().system._destinationId,1);
        delete saved.system._destinationId;DataManager.extractSaveContents(saved);assert.equal($gameSystem.getDestinationId(),0);
        assert.equal(new Game_System().getDestinationId(),2);`);
});
for (const [width, height] of [[816, 624], [480, 816], [1280, 720], [816, 400]]) {
    test(`real menu geometry ${width}x${height}: panel above gold, no cumulative shrinking or bitmap churn`, () => {
        const { run, ready } = setup({ width, height }); ready();
        run(`const scene=makeScene(), panel=scene._destinationWindow, status=scene._statusWindow;
            assert.equal(panel.x,0);assert.equal(panel.width,Graphics.boxWidth);
            assert.equal(panel.y+panel.height,scene._goldWindow.y);
            assert.equal(status.y+status.height,panel.y);assert.ok(status.height>=96);
            assert.ok(status.itemHeight()>=144+status.rowSpacing()*2);
            assert.ok(status.itemRect(0).height>=status.lineHeight()*3);
            const ordinary=Object.create(Window_MenuStatus.prototype);
            Object.assign(ordinary,{height:status.height,padding:status.padding});
            assert.equal(ordinary.itemHeight(),Math.floor(ordinary.innerHeight/4),
                'minimum row height is isolated to the menu instance');
            assert.ok(panel.height<=120);assert.ok(panel.height>=60);
            const geometry=()=>[panel.x,panel.y,panel.width,panel.height,status.height];
            const before=geometry();for(let i=0;i<4;i++)scene.relayoutMenuWindows();assert.deepEqual(geometry(),before);
            const count=allocations;for(let i=0;i<20;i++)scene.update();assert.equal(allocations,count);
            Graphics.boxHeight+=80;scene.update();assert.equal(panel.y+panel.height,scene._goldWindow.y);
            assert.equal(status.y+status.height,panel.y);
            scene.relayoutMenuWindows();assert.equal(status.y+status.height,panel.y);`);
    });
}
test('no FlexibleTopDownUI: standard rect fallback does not overlap commands and stays stable', () => {
    const { run, ready } = setup({ flexible: false }); ready();
    run(`const scene=makeScene(),p=scene._destinationWindow;
        assert.equal(p.width,Graphics.boxWidth);assert.equal(p.y+p.height,scene._goldWindow.y);
        assert.ok(scene._commandWindow.y+scene._commandWindow.height<=p.y);
        assert.equal(scene._statusWindow.y+scene._statusWindow.height,p.y);
        const y=p.y;scene.relayoutMenuWindows();assert.equal(p.y,y);`);
});
test('long Japanese and unbroken Latin wrap without losing text; visible bitmap only; final line reachable', () => {
    const { run, ready } = setup(); ready(JSON.stringify({ initialId: 1, destinations: [{ id: 1, text: '日本語'.repeat(300) + 'ABC'.repeat(300) }] }));
    run(`const p=makePanel(320,120);assert.ok(p._lines.length>100);assert.ok(p.maxScrollY()>0);
        const body=p._lines.slice(1).flat().map(r=>r.text||'').join('');assert.equal(body,$gameSystem.getDestinationList());
        assert.equal(p.contents.height,p.innerHeight+p.lineHeight());const count=allocations;
        p.scrollTo(0,p.maxScrollY());assert.equal(p.scrollY(),p.maxScrollY());
        assert.ok(p.contents.draws.some(d=>String(d.text).includes('C')));assert.equal(allocations,count);
        assert.ok(p._lines.flat().every(r=>r.x+r.width<=p.innerWidth-p.contents.fontSize*2-4));`);
});
test('MainFontLetterSpacing actual hooks measure whole runs including negative spacing and bracket ink margins', () => {
    const { run, ready } = setup({ spacing: true });
    ready(JSON.stringify({ initialId: 1, destinations: [{ id: 1, text: '「かな漢字ABC」'.repeat(50) }] }));
    run(`const p=makePanel(320,120);
        assert.ok(p.textWidth('漢字')<p.textWidth('漢')+p.textWidth('字'));
        assert.equal(p._lines.slice(1).flat().map(r=>r.text||'').join(''),$gameSystem.getDestinationList());
        assert.ok(p.contents.draws.length>0);
        for(const d of p.contents.draws){assert.ok(d.x>=0);assert.ok(d.x+d.size<=p.innerWidth);}`);
});
test('control V N P G C I, line arrays, live variable refresh without allocating bitmaps', () => {
    const { run, ready } = setup();
    ready(JSON.stringify({ initialId: 1, destinations: [{ id: 1, text: ['\\V[1] \\N[2] \\P[1] \\G', '\\C[3]色\\I[7]文'] }] }));
    run(`$gameParty.members=()=>[{name:()=> 'Party'}];$gameVariables.setValue(1,42);
        const p=makePanel(600);assert.ok(p._resolvedText.includes('42 Actor2 Party G'));
        assert.ok(p._lines.flat().some(r=>r.icon===7));assert.ok(p._lines.flat().some(r=>r.text==='色'&&r.color==='color3'));
        const count=allocations;$gameVariables.setValue(1,99);p.update();
        assert.ok(p._resolvedText.includes('99'));assert.equal(allocations,count);`);
});
test('inactive wheel and touch drag scrolling; dragging into commands does not activate them', () => {
    const { run, ready } = setup(); ready(JSON.stringify({ initialId: 1, destinations: [{ id: 1, text: '長文'.repeat(500) }] }));
    run(`const scene=makeScene(),p=scene._destinationWindow,cmd=scene._commandWindow;
        assert.equal(p.active,false);TouchInput.x=p.x+50;TouchInput.y=p.y+40;TouchInput.wheelY=40;
        scene.update();assert.ok(p.scrollY()>0);assert.equal(cmd.active,true);TouchInput.wheelY=0;
        TouchInput.trigger=true;scene.update();assert.equal(p._scrollTouching,true);TouchInput.trigger=false;
        let leaked=false;const prior=cmd.update;cmd.update=function(){if(this.active)leaked=true;prior.call(this);};
        TouchInput.y=20;TouchInput.moved=true;scene.update();assert.equal(leaked,false);assert.ok(p.scrollY()>10);
        TouchInput.released=true;scene.update();assert.equal(p._scrollTouching,false);assert.equal(cmd.active,true);`);
});
test('menu command keyboard focus, page scroll and cancel return without parent input', () => {
    const { run, ready } = setup(); ready(JSON.stringify({ initialId: 1, destinations: [{ id: 1, text: '長文'.repeat(500) }] }));
    run(`const scene=makeScene(),p=scene._destinationWindow,cmd=scene._commandWindow;
        cmd.selectSymbol('destination');cmd.processOk();assert.equal(cmd.active,false);assert.equal(p.active,true);
        Input.key='pagedown';scene.update();Input.key='';for(let i=0;i<8;i++)scene.update();assert.ok(p.scrollY()>0);
        p.processCancel();assert.equal(cmd.active,true);assert.equal(p.active,false);assert.equal(SceneManager.popped,undefined);`);
});