const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plugin = read('js/plugins/MapTypeCommonEvent.js');
// Optional real-plugin integration: no dependency on the developer's Desktop.
const timingFile = process.env.KEKE_TIMING_COMMON_PATH || path.join(root, 'js/plugins/Keke_TimingCommon.js');
const timingSource = fs.existsSync(timingFile) ? fs.readFileSync(timingFile, 'utf8') : null;

// Execute the installed LN control, file loader, map/screen hooks and command,
// not a reimplementation. Explicit webpack boundaries exclude PIXI and DOM GUI.
function installFilmicRuntime(run) {
    const source = read('js/plugins/HUG/LN_FilmicFilter.js');
    const modules = [[455, 297], [297, 987], [174, 974], [974, 957], [994, 749], [749, 644]]
        .map(([id, next]) => {
            const begin = source.indexOf(`,${id}:`);
            const end = source.indexOf(`,${next}:`, begin + 1);
            assert.ok(begin >= 0 && end > begin, `LN webpack module ${id} boundary changed`);
            return source.slice(begin + 1, end);
        }).join(',');
    const files = { 'data/filters/index.json': read('data/filters/index.json') };
    for (const file of JSON.parse(files['data/filters/index.json']).filter(Boolean)) {
        files[`data/filters/${file}`] = read(`data/filters/${file}`);
    }
    run(`
        const filterFiles = ${JSON.stringify(files)};
        const filterRequests = [];
        class XMLHttpRequest {
            open(method, url) { assert.equal(method, 'GET'); this.url = url; }
            overrideMimeType(type) { assert.equal(type, 'application/json'); }
            send() {
                filterRequests.push(this.url);
                assert.ok(Object.hasOwn(filterFiles, this.url), this.url);
                this.status = 200; this.responseText = filterFiles[this.url]; this.onload();
            }
        }
        const lnModules = { ${modules} };
        const lnCache = {};
        function lnRequire(id) {
            if (lnCache[id]) return lnCache[id].exports;
            assert.ok(lnModules[id], 'Unexpected LN dependency ' + id);
            const module = lnCache[id] = { exports: {} };
            lnModules[id](module, module.exports, lnRequire);
            return module.exports;
        }
        const FilmicFilterControl = lnRequire(455).FilmicFilterControl;
        const FilterFileManager = lnRequire(297).FilterFileManager;
        lnRequire(974); lnRequire(174); lnRequire(994);
        FilterFileManager.loadIndex();
        assert.equal(FilterFileManager.isLoaded(), true);
        function expectFilter(id) {
            const control = $gameScreen._lnFilmicFilter;
            assert.equal(control.enabled, id >= 0);
            if (id >= 0) {
                const expected = FilmicFilterControl.resolveUndefiedParams(
                    JSON.parse(filterFiles['data/filters/' + FilterFileManager.fileIndex[id]]));
                assert.deepEqual(control.params, expected);
                assert.deepEqual(control.targetParams, expected);
                assert.equal(control.paramsDuration, 0);
            }
        }
    `);
}

function setup(options = {}) {
    const parameters = {
        Rules: JSON.stringify((options.rules || [
            { MapType: '街', CommonEventId: '1' },
            { MapType: 'ワールドマップ', CommonEventId: '2' },
            { MapType: 'ダンジョン', CommonEventId: '3' }
        ]).map(rule => JSON.stringify(rule))),
        OnlyTypeChange: 'false', RunOnNewGame: 'false', ...options.parameters
    };
    const context = vm.createContext({ assert, parameters, timingParameters: options.timing || {},
        console, performance, setTimeout });
    const run = code => vm.runInContext(code, context);
    const core = read('js/rmmz_core.js');
    run(core.slice(0, core.indexOf('function Utils()')));
    run(core.slice(core.indexOf('function JsonEx()')));
    const managers = read('js/rmmz_managers.js');
    run(managers.slice(0, managers.indexOf('function ConfigManager()')));
    run(managers.slice(managers.indexOf('function PluginManager()')));
    run(read('js/rmmz_objects.js'));
    run(`
        const window = globalThis;
        const Utils = { isOptionValid: () => false, cacheBustedUrl: url => url };
        const Graphics = { frameCount: 0, width: 816, height: 624 };
        const ImageManager = { isZeroParallax: () => false, isObjectCharacter: () => false,
            isReady: () => true, loadFace() {}, loadPicture() {} };
        const BattleManager = { processAbort() {} };
        const document = { currentScript: { src: ${JSON.stringify(options.timingUrl || 'file:///js/plugins/Keke_TimingCommon.js')} } };
        function Scene_Base() {}
        Scene_Base.prototype.update = function() { this.baseUpdates = (this.baseUpdates || 0) + 1; };
        function Scene_Map() {}
        Scene_Map.prototype = Object.create(Scene_Base.prototype);
        Scene_Map.prototype.constructor = Scene_Map;
        Scene_Map.prototype.start = function() {};
        Scene_Map.prototype.callMenu = function() {};
        function Scene_Battle() {}
        Scene_Battle.prototype.start = function() {};
        Scene_Battle.prototype.terminate = function() {};
        function Scene_Menu() {}
        function Scene_Load() {}
        Scene_Load.prototype.onLoadSuccess = function() {};
        function Scene_Gameover() {}
        function Scene_Boot() {}
        function Spriteset_Map() {}
        Spriteset_Map.prototype.initialize = function() {};
        function Spriteset_Battle() {}
        Spriteset_Battle.prototype.initialize = function() {};
        const SceneManager = {
            _scene: new Scene_Map(), changing: false, previous: Scene_Map,
            isSceneChanging() { return this.changing; },
            isPreviousScene(scene) { return this.previous === scene; }, goto() {}
        };
        PluginManager.parameters = name => name === 'MapTypeCommonEvent' ? parameters :
            name === 'Keke_TimingCommon' ? timingParameters : {};
        const filterCalls = [];
        const interpreterWaits = [];
        const originalCallCommand = PluginManager.callCommand;
        PluginManager.callCommand = function(self, name, command, args) {
            if (name === 'LN_FilmicFilter') filterCalls.push({ self, name, command, args });
            return originalCallCommand.apply(this, arguments);
        };
        const originalWait = Game_Interpreter.prototype.wait;
        Game_Interpreter.prototype.wait = function(duration) {
            interpreterWaits.push(duration);
            return originalWait.apply(this, arguments);
        };
        $dataSystem = ${read('data/System.json')};
        // Project database currently has IDs 1..20; reserve actual engine slots
        // for GetState outputs instead of mocking Game_Variables.setValue.
        while ($dataSystem.variables.length <= 25) $dataSystem.variables.push('Regression output');
        $dataTilesets = ${read('data/Tilesets.json')};
        $dataCommonEvents = [null];
        $dataActors = [null];
        const log = [];
        const warnings = [];
        console = { warn: message => warnings.push(message) };
        const end = { code: 0, indent: 0, parameters: [] };
        const script = text => ({ code: 355, indent: 0, parameters: [text] });
        const wait = n => ({ code: 230, indent: 0, parameters: [n] });
        const move = id => ({ code: 201, indent: 0, parameters: [0, id, 1, 1, 2, 0] });
        function common(id, name, commands = []) {
            $dataCommonEvents[id] = { id, name, trigger: 0, switchId: 0,
                list: [script('log.push(' + JSON.stringify(name) + ')'), ...commands, end] };
        }
        common(1, '街'); common(2, 'ワールドマップ'); common(3, 'ダンジョン');
        common(4, '予約'); common(5, '移動前', [wait(2)]);
        common(6, '移動後', [wait(3), script('log.push("移動後完了")')]);
        common(7, '開始', [wait(2)]); common(8, 'メニュー'); common(9, '戦闘');
        function mapData(note) {
            $dataMap = { note, tilesetId: 1, width: 30, height: 30, scrollType: 0,
                events: [null], data: Array(30 * 30 * 6).fill(0), encounterStep: 30,
                parallaxName: '', parallaxLoopX: false, parallaxLoopY: false,
                parallaxSx: 0, parallaxSy: 0, specifyBattleback: false };
            DataManager.extractMetadata($dataMap);
        }
    `);
    if (options.filters) installFilmicRuntime(run);
    if (options.keke && !options.reverse) run(timingSource);
    run(plugin);
    if (options.keke && options.reverse) run(timingSource);
    if (options.beforeCreate) run(options.beforeCreate);
    run(`
        DataManager.createGameObjects();
        function command(name, args = {}) {
            assert.equal(typeof PluginManager._commands['MapTypeCommonEvent:' + name], 'function');
            PluginManager.callCommand(new Game_Interpreter(), 'MapTypeCommonEvent', name, args);
        }
        function expectState(night, total, progress, nights) {
            assert.deepEqual($gameSystem._mapTypeDayNight, { night, total, progress, nights });
        }
        function getState() {
            command('GetState', { TotalVariable: '21', ProgressVariable: '22', NightsVariable: '23',
                RequiredVariable: '24', RemainingVariable: '25' });
            return [21, 22, 23, 24, 25].map(id => $gameVariables.value(id));
        }
        function start(previous = Scene_Map) {
            SceneManager.previous = previous;
            SceneManager.changing = false;
            SceneManager._scene = new Scene_Map();
            new Spriteset_Map().initialize();
            SceneManager._scene.start();
        }
        function initial(note = '<マップ種別:ワールドマップ>', mapId = 10) {
            mapData(note); $gameMap.setup(mapId); start(Scene_Boot);
        }
        function transfer(mapId, note, reload = false) {
            $gamePlayer.reserveTransfer(mapId, 1, 1, 2, 0);
            if (reload) $gamePlayer.requestMapReload();
            // Same order as Scene_Map: destination data loads BEFORE performTransfer.
            mapData(note);
            $gamePlayer.performTransfer();
            start();
        }
        function tick(count = 15) {
            for (let i = 0; i < count; i++) {
                Graphics.frameCount++;
                SceneManager._scene.update();
                $gameMap.updateInterpreter();
            }
        }
    `);
    return run;
}

test('registered safely with four unassigned types and installed dependency order', () => {
    const context = vm.createContext({});
    vm.runInContext(read('js/plugins.js'), context);
    const entry = context.$plugins.find(p => p.name === 'MapTypeCommonEvent');
    assert.equal(entry.status, true);
    const rules = JSON.parse(entry.parameters.Rules).map(JSON.parse);
    assert.deepEqual(rules.map(r => r.MapType), ['街', 'ワールドマップ', 'ダンジョン', '屋内']);
    assert.ok(rules.every(r => r.CommonEventId === '0'));
    assert.equal(rules[0].DayFilter, '1');
    assert.equal(rules[3].DayFilter, '4');
    assert.equal(rules[3].ExcludeNight, 'true');
    assert.equal(entry.parameters.DefaultNightFilter, '5');
    assert.equal(entry.parameters.InitialTime, 'day');
    const enabled = context.$plugins.filter(p => p.status).map(p => p.name);
    const ln = enabled.indexOf('HUG/LN_FilmicFilter');
    const keke = enabled.indexOf('Keke_TimingCommon');
    assert.ok(ln >= 0 && keke > ln && enabled.indexOf('MapTypeCommonEvent') > keke);
});

for (const time of ['day', 'night']) {
    test(`initial time ${time}: real new game sets filter/switch without arrivals or common reservations`, () => {
        setup({ keke: true, filters: true, parameters: { InitialTime: time, DefaultNightFilter: '5',
            NightSwitch: '1', NightCommonEvent: '7' } })(`
            DataManager.selectSavefileForNewGame = function() {};
            $dataSystem.partyMembers = [];
            DataManager.setupNewGame();
            transfer(11, '<マップ種別:街>');
            expectState(${time === 'night'}, 0, 0, 0);
            assert.equal($gameSwitches.value(1), ${time === 'night'});
            expectFilter(${time === 'night' ? 5 : 0});
            assert.equal($gameTemp.isCommonEventReserved(), false);
            command('Morning'); command('RecordDefeat', { Amount: '3' });
            expectState(true, 3, 0, 1);
            assert.equal($gameTemp.retrieveCommonEvent().id, 7);
        `);
    });
    test(`saved opposite time overrides initial setting ${time}`, () => {
        setup({ filters: true, parameters: { InitialTime: time, DefaultNightFilter: '5', NightSwitch: '1' } })(`
            initial();
            command('${time === 'night' ? 'Morning' : 'StartNight'}');
            const expected = JSON.stringify($gameSystem._mapTypeDayNight);
            const saved = JsonEx.stringify(DataManager.makeSaveContents());
            DataManager.createGameObjects();
            DataManager.extractSaveContents(JsonEx.parse(saved));
            start(Scene_Load);
            assert.equal(JSON.stringify($gameSystem._mapTypeDayNight), expected);
            assert.equal($gameSwitches.value(1), ${time === 'day'});
            expectFilter(${time === 'day' ? 5 : 0});
        `);
    });
}

test('night start indoors remains visually daytime; outside is night; first threshold remains base', () => {
    setup({ filters: true, rules: [{ MapType: '屋内', CommonEventId: '0', DayFilter: '4', ExcludeNight: 'true' }],
        parameters: { InitialTime: 'night', DefaultNightFilter: '5', NightStep: '2' } })(`
        initial('<マップ種別:屋内>'); expectFilter(4); expectState(true, 0, 0, 0);
        command('RecordDefeat', { Amount: '2' }); expectState(true, 2, 0, 0);
        transfer(11, '<マップ種別:ワールドマップ>'); expectFilter(5);
        command('Morning'); assert.equal(getState()[3], 3);
        command('RecordDefeat', { Amount: '3' }); expectState(true, 5, 0, 1);
        assert.equal(getState()[3], 5);
    `);
});

test('pre-feature save uses selected night start without firing transition events', () => {
    setup({ filters: true, parameters: { InitialTime: 'night', DefaultNightFilter: '5',
        NightSwitch: '1', NightCommonEvent: '7' } })(`
        initial(); delete $gameSystem._mapTypeDayNight;
        $gameSwitches.setValue(1, false); start(Scene_Load);
        expectState(true, 0, 0, 0); expectFilter(5);
        assert.equal($gameSwitches.value(1), true);
        assert.equal($gameTemp.isCommonEventReserved(), false);
    `);
});

test('invalid initial time fails clearly', () => {
    assert.throws(() => setup({ parameters: { InitialTime: 'evening' } }), /ゲーム開始時の時間帯/);
});

for (const [note, expected] of [
    ['<マップ種別:街>', '街'], ['<MapType:ダンジョン>', 'ダンジョン'],
    ['<マップ種別: ワールドマップ >', 'ワールドマップ'],
    ['<MapType:ダンジョン><マップ種別:街>', '街'],
    ['', null], ['街', null], ['<マップ種別>', null], ['<マップ種別:未知>', null]
]) {
    test(`destination note ${JSON.stringify(note)}`, () => {
        setup()(`initial(); transfer(11, ${JSON.stringify(note)}); tick();
            assert.deepEqual(log, ${JSON.stringify(expected ? [expected] : [])});
            assert.equal($gameMap.isEventRunning(), false);`);
    });
}

test('town-only rule never runs on the world map or dungeon', () => {
    setup({ rules: [{ MapType: '街', CommonEventId: '1' }] })(`
        initial(); transfer(11, '<マップ種別:ダンジョン>'); tick();
        transfer(12, '<マップ種別:街>'); tick();
        transfer(13, '<マップ種別:ワールドマップ>'); tick();
        assert.deepEqual(log, ['街']);
    `);
});

test('separate maps of the same type run by default; same map and reload do not', () => {
    setup()(`initial('<マップ種別:街>');
        transfer(11, '<マップ種別:街>'); tick();
        transfer(11, '<マップ種別:街>'); tick();
        transfer(11, '<マップ種別:街>', true); tick();
        $gamePlayer.performTransfer(); tick();
        assert.deepEqual(log, ['街']);`);
});

test('type-change mode uses saved source type, not already-loaded destination data', () => {
    setup({ parameters: { OnlyTypeChange: 'true' } })(`
        initial(); transfer(11, '<マップ種別:街>'); tick();
        transfer(12, '<マップ種別:街>'); tick();
        transfer(13, ''); tick(); transfer(14, '<マップ種別:街>'); tick();
        assert.deepEqual(log, ['街', '街']);
    `);
});

test('old save without a stored type is initialized on map start', () => {
    setup({ parameters: { OnlyTypeChange: 'true' } })(`
        initial('<マップ種別:街>'); delete $gameMap._mapTypeCommonEventType;
        start(Scene_Load); transfer(11, '<マップ種別:街>'); tick();
        assert.deepEqual(log, []);
    `);
});

test('menu, battle, load and repeated scene starts do not create entries', () => {
    setup()(`initial(); transfer(11, '<マップ種別:街>'); tick();
        start(Scene_Menu); tick(); start(Scene_Battle); tick(); start(Scene_Load); tick();
        start(); tick(); assert.deepEqual(log, ['街']);`);
});

for (const enabled of [false, true]) {
    test(`new game entry option ${enabled}`, () => {
        setup({ parameters: { RunOnNewGame: String(enabled) } })(`
            transfer(11, '<マップ種別:街>'); tick();
            assert.deepEqual(log, ${enabled ? "['街']" : '[]'});
        `);
    });
}

test('custom types and ordered multiple rules work', () => {
    setup({ rules: [{ MapType: ' 城 ', CommonEventId: '1' }, { MapType: '城', CommonEventId: '3' }] })(`
        initial(); transfer(11, '<マップ種別:城>'); tick();
        assert.deepEqual(log, ['街', 'ダンジョン']);
    `);
});

test('running event completes, existing reservations run, then entry precedes autorun', () => {
    setup()(`initial();
        $gameMap._interpreter.setup([wait(2), script('log.push("通常完了")'), end]);
        $gameTemp.reserveCommonEvent(4);
        common(10, '自動', [script('$gameSwitches.setValue(1, false)')]);
        $dataCommonEvents[10].trigger = 1; $dataCommonEvents[10].switchId = 1;
        $gameSwitches.setValue(1, true);
        transfer(11, '<マップ種別:街>'); tick();
        assert.deepEqual(log, ['通常完了', '予約', '街', '自動']);
    `);
});

for (const blocker of ['message', 'transfer', 'scene', 'timingApi', 'handler', 'timingList', 'stopFlag']) {
    test(`entry waits for ${blocker} without losing its reservation`, () => {
        setup()(`initial(); transfer(11, '<マップ種別:街>');
            const blocker = ${JSON.stringify(blocker)};
            if (blocker === 'message') $gameMessage.add('待機中');
            if (blocker === 'transfer') $gamePlayer.reserveTransfer(11, 1, 1, 2, 0);
            if (blocker === 'scene') SceneManager.changing = true;
            if (blocker === 'timingApi') $gameTemp.inTimingCommonKe = () => true;
            if (blocker === 'handler') $gameMap._tCommonHandlerKe = () => {};
            if (blocker === 'timingList') $gameMap._tCommonPretersKe = [{}];
            if (blocker === 'stopFlag') $gameMap._interpreter._stopByTimingCommonKe = true;
            tick(2); assert.deepEqual(log, []); assert.equal($gameMap.isEventRunning(), true);
            $gameMessage.clear(); $gamePlayer.clearTransferInfo(); SceneManager.changing = false;
            $gameTemp.inTimingCommonKe = () => false; $gameMap._tCommonHandlerKe = null;
            $gameMap._tCommonPretersKe = []; $gameMap._interpreter._stopByTimingCommonKe = false;
            tick(); assert.deepEqual(log, ['街']);
        `);
    });
}

test('obsolete entry is discarded if another transfer happens first', () => {
    setup()(`initial(); transfer(11, '<マップ種別:街>');
        transfer(12, '<マップ種別:ダンジョン>'); tick();
        assert.deepEqual(log, ['ダンジョン']);
        transfer(13, '<マップ種別:街>'); transfer(14, ''); tick();
        assert.deepEqual(log, ['ダンジョン']);`);
});

test('entry events can wait, call child events, and transfer to another type', () => {
    setup()(`initial(); common(1, '街', [wait(2),
        { code: 117, indent: 0, parameters: [4] }, move(12)]);
        transfer(11, '<マップ種別:街>'); tick(1);
        assert.equal($gameMap.isEventRunning(), true);
        tick(); assert.equal($gamePlayer.isTransferring(), true);
        transfer(12, '<マップ種別:ダンジョン>'); tick();
        assert.deepEqual(log, ['街', '予約', 'ダンジョン']);`);
});

for (const keke of [false, true]) {
    for (const state of ['pending', 'running', 'completed']) {
        test(`real save/load restores ${state} entry without duplication (Keke=${keke})`,
            { skip: keke && !timingSource }, () => {
                setup({ keke })(`initial();
                    common(1, '街', [wait(3), script('log.push("完了")')]);
                    transfer(11, '<マップ種別:街>');
                    if ('${state}' === 'running') tick(1);
                    if ('${state}' === 'completed') tick();
                    const saved = JsonEx.stringify(DataManager.makeSaveContents());
                    DataManager.createGameObjects();
                    DataManager.extractSaveContents(JsonEx.parse(saved));
                    assert.ok($gameMap instanceof Game_Map);
                    assert.ok($gameMap._interpreter instanceof Game_Interpreter);
                    start(Scene_Load); tick(); start(Scene_Load); tick();
                    assert.deepEqual(log, ['街', '完了']);
                    assert.equal($gameMap.isEventRunning(), false);
                `);
            });
    }
}

test('zero, deleted and empty common events are safely skipped', () => {
    setup({ rules: [0, 999, 10, 11, 1].map(id => ({ MapType: '街', CommonEventId: String(id) })) })(`
        $dataCommonEvents[10] = { list: [end], trigger: 0 };
        $dataCommonEvents[11] = { list: [], trigger: 0 };
        initial(); transfer(11, '<マップ種別:街>'); tick();
        assert.deepEqual(log, ['街']); assert.equal(warnings.length, 1);
        assert.equal($gameMap.isEventRunning(), false);
    `);
});

test('bad parameters fail with an actionable plugin-specific message', () => {
    for (const Rules of ['{', '{}', '[null]', '[{"MapType":""}]',
        '[{"MapType":"街","CommonEventId":"NaN"}]']) {
        assert.throws(() => setup({ parameters: { Rules } }), /MapTypeCommonEvent:.*設定/);
    }
});

for (const reverse of [false, true]) {
    test(`real Keke v1.3.8: transfer pre/post finish before entry (reverse order=${reverse})`,
        { skip: !timingSource }, () => {
            setup({ keke: true, reverse, timing: {
                'コモン-場所移動-前': '5', 'コモン-場所移動-後': '6'
            } })(`
                initial(); $gameMap._interpreter.setup([move(11), end]);
                tick(); assert.equal($gamePlayer.isTransferring(), true);
                assert.deepEqual(log, ['移動前']);
                transfer(11, '<マップ種別:街>');
                assert.deepEqual(log, ['移動前', '移動後']);
                tick(1); assert.equal(log.includes('街'), false);
                tick(); assert.deepEqual(log, ['移動前', '移動後', '移動後完了', '街']);
                assert.equal($gameMap.isEventRunning(), false);
            `);
        });
}

test('real Keke: menu/battle return commons do not create entry commons', { skip: !timingSource }, () => {
    setup({ keke: true, timing: { 'コモン-メニュー閉じ': '8', 'コモン-バトル逃走-後': '9' } })(`
        initial(); transfer(11, '<マップ種別:街>'); tick();
        start(Scene_Menu); tick();
        assert.deepEqual(log, ['街', 'メニュー']);
        BattleManager.processAbort(); start(Scene_Battle); tick();
        assert.deepEqual(log, ['街', 'メニュー', '戦闘']);
    `);
});

test('real Keke: new-game common finishes before optional initial entry', { skip: !timingSource }, () => {
    setup({ keke: true, parameters: { RunOnNewGame: 'true' }, timing: { 'コモン-ニューゲーム': '7' } })(`
        // setupNewGame performs unrelated party/graphics setup; invoke with lightweight services.
        $gameParty.setupStartingMembers = function() {};
        DataManager.selectSavefileForNewGame = function() {};
        $dataSystem.partyMembers = [];
        DataManager.setupNewGame();
        transfer(11, '<マップ種別:街>'); tick();
        assert.deepEqual(log, ['開始', '街']);
    `);
});

test('real Keke: global timing disable does not disable independent entry rules', { skip: !timingSource }, () => {
    setup({ keke: true, timing: { 'コモン-場所移動-後': '6' } })(`
        initial(); $gameMap._noTimingCommonKe = true;
        transfer(11, '<マップ種別:街>'); tick(); assert.deepEqual(log, ['街']);
    `);
});

// v2 regressions remain in this file: requiring a node:test file as a helper
// would register the original 40 cases a second time.
test('v2 defaults: third recorded victory starts exactly one night, with no automatic battle counting', () => {
    setup()(`
        initial(); command('GetState'); expectState(false, 0, 0, 0);
        assert.deepEqual(getState(), [0, 0, 0, 3, 3]);
        start(Scene_Battle); tick(); expectState(false, 0, 0, 0);
        command('RecordDefeat'); command('RecordDefeat', { Amount: '' });
        expectState(false, 2, 2, 0);
        assert.deepEqual(getState(), [2, 2, 0, 3, 1]);
        command('RecordDefeat'); expectState(true, 3, 0, 1);
        assert.deepEqual(getState(), [3, 0, 1, 3, 0]);
        command('RecordDefeat', { Amount: '10' }); expectState(true, 13, 0, 1);
        tick(50); expectState(true, 13, 0, 1);
        assert.deepEqual($gameTemp._commonEventQueue, []);
    `);
});

test('v2 two cycles consume all excess progress, retain total and never carry night victories', () => {
    setup()(`
        initial(); command('RecordDefeat', { Amount: '10' }); expectState(true, 10, 0, 1);
        command('RecordDefeat', { Amount: '20' }); expectState(true, 30, 0, 1);
        command('Morning'); expectState(false, 30, 0, 1);
        command('RecordDefeat', { Amount: '2' }); expectState(false, 32, 2, 1);
        command('RecordDefeat', { Amount: '8' }); expectState(true, 40, 0, 2);
        command('Morning'); expectState(false, 40, 0, 2);
        assert.deepEqual(getState(), [40, 0, 2, 3, 3]);
    `);
});

test('v2 Morning resets daytime progress; StartNight and transition commons are idempotent', () => {
    setup({ parameters: { NightCommonEvent: '4', MorningCommonEvent: '8', NightSwitch: '20' } })(`
        initial(); command('RecordDefeat'); command('Morning');
        expectState(false, 1, 0, 0); assert.equal($gameSwitches.value(20), false);
        assert.deepEqual($gameTemp._commonEventQueue, []);
        command('SetProgress', { Value: '2' });
        command('StartNight'); command('StartNight');
        expectState(true, 1, 0, 1); assert.equal($gameSwitches.value(20), true);
        assert.deepEqual($gameTemp._commonEventQueue, [4]);
        command('RecordDefeat', { Amount: '30' }); command('StartNight');
        expectState(true, 31, 0, 1); assert.deepEqual($gameTemp._commonEventQueue, [4]);
        command('Morning'); command('Morning');
        expectState(false, 31, 0, 1); assert.equal($gameSwitches.value(20), false);
        assert.deepEqual($gameTemp._commonEventQueue, [4, 8]);
        tick(); assert.deepEqual(log, ['予約', 'メニュー']);
    `);
});

test('day-night plugin respawns daily, rock, and plant event switches on night-to-morning only', () => {
    setup()(`
        initial();
        const makeEvent = (id, meta) => ({ id, name: '採取物', note: '', meta, x: id, y: 1, pages: [] });
        $dataMap.events = [null,
            makeEvent(1, { '日次リポップ': true }),
            makeEvent(2, { '岩破壊': '2' }),
            makeEvent(3, { '草木採取': true }),
            makeEvent(4, { '採取アクション': '148,12' }),
            makeEvent(5, {})];
        $gameMap.setup(10);
        for (let id = 1; id <= 5; id++) $gameSelfSwitches.setValue([10, id, 'A'], true);
        $gameSelfSwitches.setValue([10, 1, 'B'], true);

        command('StartNight');
        assert.equal($gameSystem._mapTypeCommonEventRespawnDay, 0);
        command('Morning');

        assert.equal($gameSystem._mapTypeCommonEventRespawnDay, 1);
        for (let id = 1; id <= 4; id++) assert.equal($gameSelfSwitches.value([10, id, 'A']), false);
        assert.equal($gameSelfSwitches.value([10, 5, 'A']), true);
        assert.equal($gameSelfSwitches.value([10, 1, 'B']), true);
        command('Morning');
        assert.equal($gameSystem._mapTypeCommonEventRespawnDay, 1);
    `);
});

test('day-night plugin AdvanceDay resets tagged events on map re-entry', () => {
    setup()(`
        initial();
        const eventData = { id: 1, name: '草木', note: '', meta: { '日次リポップ': true },
            x: 1, y: 1, pages: [] };
        $dataMap.events = [null, eventData]; $gameMap.setup(10);
        $gameSelfSwitches.setValue([10, 1, 'A'], true);
        transfer(11, '');
        command('AdvanceDay');
        assert.equal($gameSystem._mapTypeCommonEventRespawnDay, 1);
        assert.equal($gameSelfSwitches.value([10, 1, 'A']), true);
        transfer(10, '');
        $dataMap.events = [null, eventData]; $gameMap.setup(10);
        assert.equal($gameSelfSwitches.value([10, 1, 'A']), false);
    `);
});

test('v2 SetProgress only changes daytime progress and defers threshold evaluation until defeat', () => {
    setup()(`
        initial(); command('SetProgress', { Value: '100' }); expectState(false, 0, 100, 0);
        assert.deepEqual(getState(), [0, 100, 0, 3, 0]);
        tick(); command('RefreshFilter'); expectState(false, 0, 100, 0);
        command('RecordDefeat'); expectState(true, 1, 0, 1);
        command('SetProgress', { Value: '100' }); expectState(true, 1, 0, 1);
        command('Morning'); command('SetProgress', { Value: '2' }); command('SetProgress');
        expectState(false, 1, 0, 1);
    `);
});

for (const [label, parameters, required] of [
    ['increasing formula', { KillsPerNight: '3', NightStep: '2' }, [3, 5, 7, 9]],
    ['decreasing formula floors at one', { KillsPerNight: '3', NightStep: '-2' }, [3, 1, 1, 1]],
    ['list overrides formula and repeats last', { NightThresholds: '2,4,6', NightStep: '99' }, [2, 4, 6, 6]],
    ['single list entry repeats', { NightThresholds: '5' }, [5, 5, 5, 5]],
    ['CSV trims whitespace', { NightThresholds: ' 2 , 5 , 3 ' }, [2, 5, 3, 3]],
    ['formula cap', { KillsPerNight: '3', NightStep: '3', MaxThreshold: '4' }, [3, 4, 4, 4]],
    ['list cap', { NightThresholds: '2,7,9', MaxThreshold: '5' }, [2, 5, 5, 5]]
]) {
    test(`v2 required kills: ${label}`, () => {
        setup({ parameters })(`
            initial(); let total = 0;
            for (const [cycle, required] of ${JSON.stringify(required)}.entries()) {
                assert.deepEqual(getState(), [total, 0, cycle, required, required]);
                if (required > 1) {
                    command('RecordDefeat', { Amount: String(required - 1) });
                    expectState(false, total + required - 1, required - 1, cycle);
                }
                command('RecordDefeat'); total += required;
                expectState(true, total, 0, cycle + 1);
                assert.equal(getState()[4], 0);
                command('Morning'); expectState(false, total, 0, cycle + 1);
            }
        `);
    });
}

test('v2 positive safe-integer variable overrides list/formula and is clamped last', () => {
    setup({ parameters: { ThresholdVariable: '10', NightThresholds: '3,6', NightStep: '100', MaxThreshold: '7' } })(`
        initial(); $gameVariables.setValue(10, 20);
        assert.deepEqual(getState(), [0, 0, 0, 7, 7]);
        command('RecordDefeat', { Amount: '5' }); expectState(false, 5, 5, 0);
        $gameVariables.setValue(10, 2); tick(); expectState(false, 5, 5, 0);
        assert.deepEqual(getState(), [5, 5, 0, 2, 0]);
        command('RecordDefeat'); expectState(true, 6, 0, 1);
        command('Morning'); $gameVariables.setValue(10, 0);
        assert.deepEqual(getState(), [6, 0, 1, 6, 6]);
        $gameVariables.setValue(10, 1); command('RecordDefeat'); expectState(true, 7, 0, 2);
    `);
});

for (const value of ['0', '-1', '1.5', 'NaN', 'Infinity', 'Number.MAX_SAFE_INTEGER + 1', '"4"', 'true']) {
    test(`v2 invalid threshold variable ${value} falls back without poisoning counters`, () => {
        setup({ parameters: { ThresholdVariable: '10', NightThresholds: '4' } })(`
            initial();
            // Direct assignment also covers other plugins/old saves; MZ setValue floors floats.
            $gameVariables._data[10] = ${value};
            assert.deepEqual(getState(), [0, 0, 0, 4, 4]);
            command('RecordDefeat', { Amount: '3' }); expectState(false, 3, 3, 0);
            command('RecordDefeat'); expectState(true, 4, 0, 1);
        `);
    });
}

test('v2 safe-integer limits saturate counters and computed thresholds', () => {
    setup({ parameters: { KillsPerNight: String(Number.MAX_SAFE_INTEGER), NightStep: '2' } })(`
        initial(); command('RecordDefeat', { Amount: String(Number.MAX_SAFE_INTEGER) });
        expectState(true, Number.MAX_SAFE_INTEGER, 0, 1);
        command('RecordDefeat'); expectState(true, Number.MAX_SAFE_INTEGER, 0, 1);
        assert.equal(getState()[3], Number.MAX_SAFE_INTEGER);
        command('Morning'); command('SetProgress', { Value: String(Number.MAX_SAFE_INTEGER) });
        command('RecordDefeat'); expectState(true, Number.MAX_SAFE_INTEGER, 0, 2);
        command('Morning'); $gameSystem._mapTypeDayNight.nights = Number.MAX_SAFE_INTEGER;
        command('StartNight'); expectState(true, Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER);
    `);
});

test('v2 GetState writes only selected outputs; switches and variables are not the state source', () => {
    setup({ parameters: { NightSwitch: '20' } })(`
        initial(); command('RecordDefeat');
        $gameVariables.setValue(21, 99); $gameVariables.setValue(22, 88);
        command('GetState', { TotalVariable: '21' });
        assert.equal($gameVariables.value(21), 1); assert.equal($gameVariables.value(22), 88);
        const variables = JsonEx.stringify($gameVariables);
        command('GetState'); assert.equal(JsonEx.stringify($gameVariables), variables);
        $gameSwitches.setValue(20, true); start(Scene_Menu);
        expectState(false, 1, 1, 0); assert.equal($gameSwitches.value(20), false);
        command('StartNight'); $gameSwitches.setValue(20, false); start(Scene_Load);
        expectState(true, 1, 0, 1); assert.equal($gameSwitches.value(20), true);
    `);
});

for (const [name, value] of [
    ['KillsPerNight', '0'], ['KillsPerNight', '-1'], ['KillsPerNight', '1.5'],
    ['KillsPerNight', 'NaN'], ['KillsPerNight', 'Infinity'], ['KillsPerNight', '9007199254740992'],
    ['NightStep', '-1000000'], ['NightStep', '1.5'], ['NightStep', 'NaN'],
    ['MaxThreshold', '-1'], ['MaxThreshold', '1.5'], ['ThresholdVariable', '-1'],
    ['ThresholdVariable', 'Infinity'], ['NightSwitch', '1.2'], ['NightCommonEvent', '-1'],
    ['MorningCommonEvent', 'NaN'], ['DefaultDayFilter', '-3'], ['DefaultNightFilter', '1.5'],
    ['NightThresholds', '0'], ['NightThresholds', '3,,5'], ['NightThresholds', '3,'],
    ['NightThresholds', '3,-1'], ['NightThresholds', '2,1.5'], ['NightThresholds', '3,NaN'],
    ['NightThresholds', '3,9007199254740992']
]) {
    test(`v2 rejects malformed ${name}=${value} at setup`, () => {
        assert.throws(() => setup({ parameters: { [name]: value } }), /MapTypeCommonEvent:.*整数/);
    });
}

test('v2 blank optional numeric parameters retain documented defaults', () => {
    const parameters = Object.fromEntries(['DefaultDayFilter', 'DefaultNightFilter', 'KillsPerNight',
        'NightStep', 'NightThresholds', 'ThresholdVariable', 'MaxThreshold', 'NightCommonEvent',
        'MorningCommonEvent', 'NightSwitch'].map(name => [name, '']));
    setup({ parameters, filters: true })(`
        initial(''); expectState(false, 0, 0, 0); expectFilter(0);
        assert.deepEqual(getState(), [0, 0, 0, 3, 3]);
        command('RecordDefeat', { Amount: '3' }); expectFilter(0);
        assert.deepEqual($gameTemp._commonEventQueue, []);
    `);
});

for (const field of ['DayFilter', 'NightFilter']) {
    test(`v2 malformed rule ${field} is rejected`, () => {
        for (const value of ['-3', 'NaN', '1.5', '9007199254740992']) {
            assert.throws(() => setup({ rules: [{ MapType: '街', [field]: value }] }), /MapTypeCommonEvent:.*設定/);
        }
    });
}

test('v2 invalid command arguments fail before state or output variables are partially changed', () => {
    setup()(`
        initial(); command('RecordDefeat');
        for (const Amount of ['0', '-1', '1.5', 'NaN', 'Infinity', '9007199254740992']) {
            assert.throws(() => command('RecordDefeat', { Amount }), /MapTypeCommonEvent/);
            expectState(false, 1, 1, 0);
        }
        for (const Value of ['-1', '1.5', 'NaN', 'Infinity', '9007199254740992']) {
            assert.throws(() => command('SetProgress', { Value }), /MapTypeCommonEvent/);
            expectState(false, 1, 1, 0);
        }
        $gameVariables.setValue(21, 99);
        assert.throws(() => command('GetState', { TotalVariable: '21', RemainingVariable: '-1' }), /MapTypeCommonEvent/);
        assert.equal($gameVariables.value(21), 99);
    `);
});

test('v2 real LN receives numeric ID/duration and boolean false without calling interpreter.wait', () => {
    setup({ filters: true, parameters: { DefaultDayFilter: '1', DefaultNightFilter: '5' } })(`
        initial('<FilmicFilter:none>'); expectFilter(1);
        assert.equal(filterCalls.length, 2); // setup and map start
        command('StartNight'); expectFilter(5);
        command('Morning'); expectFilter(1);
        for (const call of filterCalls) {
            assert.ok(call.self instanceof Game_Interpreter);
            assert.notEqual(call.self, $gameMap._interpreter);
            assert.equal(call.name, 'LN_FilmicFilter'); assert.equal(call.command, 'SetFilmicFilter');
            assert.equal(typeof call.args.filterId, 'number');
            assert.equal(call.args.duration, 0); assert.equal(call.args.wait, false);
            assert.deepEqual(Object.keys(call.args).sort(), ['duration', 'filterId', 'wait']);
        }
        assert.deepEqual(interpreterWaits, []);
        assert.equal(filterRequests.length, 7); // index + six real project presets
    `);
});

for (const [label, parameters, rules, note, day, night] of [
    ['untagged fallback 0', {}, [], '', 0, 0],
    ['map fallback', {}, [], '<FilmicFilter:3>', 3, 3],
    ['map none fallback', {}, [], '<FilmicFilter:none>', -1, -1],
    ['map -1 fallback', {}, [], '<FilmicFilter:-1>', -1, -1],
    ['global day and night', { DefaultDayFilter: '1', DefaultNightFilter: '5' }, [], '<FilmicFilter:3>', 1, 5],
    ['rule overrides global', { DefaultDayFilter: '3', DefaultNightFilter: '6' },
        [{ MapType: '街', DayFilter: '1', NightFilter: '5' }], '<マップ種別:街><FilmicFilter:4>', 1, 5],
    ['rule sentinel inherits globals', { DefaultDayFilter: '1', DefaultNightFilter: '5' },
        [{ MapType: '街', DayFilter: '-2', NightFilter: '-2' }], '<MapType:街>', 1, 5],
    ['night sentinel inherits resolved rule day', {}, [{ MapType: '街', DayFilter: '4' }], '<MapType:街>', 4, 4],
    ['disabled day reenabled for night', { DefaultNightFilter: '5' },
        [{ MapType: '街', DayFilter: '-1' }], '<MapType:街>', -1, 5],
    ['night -1 disables', {}, [{ MapType: '街', DayFilter: '1', NightFilter: '-1' }], '<MapType:街>', 1, -1],
    ['zero means active preset not disabled', { DefaultDayFilter: '-1' },
        [{ MapType: '街', DayFilter: '0', NightFilter: '5' }], '<MapType:街>', 0, 5],
    ['duplicate rules use first filter', {},
        [{ MapType: '街', DayFilter: '1', NightFilter: '5' }, { MapType: '街', DayFilter: '4', NightFilter: '6' }],
        '<MapType:街>', 1, 5]
]) {
    test(`v2 real LN filter precedence: ${label}`, () => {
        setup({ filters: true, parameters, rules })(`
            initial(${JSON.stringify(note)}); expectFilter(${day});
            command('StartNight'); expectFilter(${night});
            command('Morning'); expectFilter(${day});
            assert.equal(filterCalls.at(-1).args.filterId, ${day});
        `);
    });
}

for (const [label, rules, note] of [
    ['indoor marker retains town type', [{ MapType: '街', DayFilter: '4' }], '<MapType:街><屋内>'],
    ['explicit rule exclusion', [{ MapType: '洞窟', DayFilter: '4', ExcludeNight: 'true' }], '<MapType:洞窟>'],
    ['boolean rule exclusion', [{ MapType: '洞窟', DayFilter: '4', ExcludeNight: true }], '<MapType:洞窟>'],
    ['legacy indoor rule default', [{ MapType: '屋内', DayFilter: '4' }], '<MapType:屋内>'],
    ['indoor type without rule', [], '<MapType:屋内><FilmicFilter:4>']
]) {
    test(`v2 ${label} stays visually day without changing world night`, () => {
        setup({ filters: true, rules, parameters: { DefaultDayFilter: '4', DefaultNightFilter: '5', NightSwitch: '20' } })(`
            initial(${JSON.stringify(note)}); command('RecordDefeat', { Amount: '3' });
            expectFilter(4); expectState(true, 3, 0, 1); assert.equal($gameSwitches.value(20), true);
            transfer(11, '<MapType:ワールドマップ>'); expectFilter(5); expectState(true, 3, 0, 1);
            transfer(12, ${JSON.stringify(note)}); expectFilter(4); expectState(true, 3, 0, 1);
            command('Morning'); expectFilter(4); expectState(false, 3, 0, 1);
        `);
    });
}

test('v2 explicit false can opt indoor type into night effects', () => {
    setup({ filters: true, rules: [{ MapType: '屋内', DayFilter: '4', ExcludeNight: 'false' }],
        parameters: { DefaultNightFilter: '5' } })(`
        initial('<MapType:屋内>'); command('StartNight'); expectFilter(5);
    `);
});

for (const mode of ['disabled', 'opt-out tag', 'LN absent']) {
    test(`v2 ${mode}: no filter command and no manual-filter mutation`, () => {
        setup({ filters: mode !== 'LN absent', parameters: {
            FilterEnabled: mode === 'disabled' ? 'false' : 'true', DefaultDayFilter: '1', DefaultNightFilter: '5'
        } })(`
            initial(${JSON.stringify(mode === 'opt-out tag' ? '<FilmicFilter:4><昼夜フィルター無効>' : '<FilmicFilter:4>')});
            // LN's own map hook still applies its tag; MapType must not touch it.
            const before = JSON.stringify($gameScreen._lnFilmicFilter);
            assert.equal(filterCalls.length, 0);
            command('StartNight'); command('RefreshFilter'); start(Scene_Menu);
            command('Morning'); tick();
            assert.equal(filterCalls.length, 0);
            assert.equal(JSON.stringify($gameScreen._lnFilmicFilter), before);
            expectState(false, 0, 0, 1);
        `);
    });
}

test('v2 manual LN effects persist until RefreshFilter or map start, not every frame', () => {
    setup({ filters: true, parameters: { DefaultDayFilter: '1', DefaultNightFilter: '5' } })(`
        initial();
        PluginManager.callCommand(new Game_Interpreter(), 'LN_FilmicFilter', 'SetFilmicFilter',
            { filterId: 3, duration: 0, wait: false });
        expectFilter(3); const count = filterCalls.length;
        tick(60); assert.equal(filterCalls.length, count); expectFilter(3);
        command('RefreshFilter'); expectFilter(1);
        $gameScreen._lnFilmicFilter.enabled = false;
        start(Scene_Menu); expectFilter(1);
        expectState(false, 0, 0, 0);
    `);
});

for (const blocker of ['battle scene', 'party in battle', 'transfer', 'scene change']) {
    test(`v2 ${blocker} defers filters until map setup/start`, () => {
        setup({ filters: true, parameters: { DefaultDayFilter: '1', DefaultNightFilter: '5' } })(`
            initial(); const count = filterCalls.length;
            const blocker = ${JSON.stringify(blocker)};
            if (blocker === 'battle scene') SceneManager._scene = new Scene_Battle();
            if (blocker === 'party in battle') $gameParty._inBattle = true;
            if (blocker === 'scene change') SceneManager.changing = true;
            if (blocker === 'transfer') {
                $gamePlayer.reserveTransfer(11, 1, 1, 2, 0);
                mapData('<MapType:屋内><FilmicFilter:4>');
            }
            command('RecordDefeat', { Amount: '3' }); command('RefreshFilter');
            expectState(true, 3, 0, 1); expectFilter(1);
            assert.equal(filterCalls.length, count);
            $gameParty._inBattle = false; SceneManager.changing = false;
            if (blocker === 'transfer') {
                $gamePlayer.performTransfer(); expectFilter(1); // indoor inherits global daytime
                start(); expectFilter(1);
                transfer(12, '<MapType:ワールドマップ>');
            } else start(Scene_Battle);
            expectFilter(5); expectState(true, 3, 0, 1);
        `);
    });
}

for (const keke of [false, true]) {
    for (const night of [false, true]) {
        test(`v2 actual JsonEx/DataManager preserves ${night ? 'night' : 'day progress'} (Keke=${keke})`,
            { skip: keke && !timingSource }, () => {
                setup({ filters: true, keke, parameters: { DefaultDayFilter: '1', DefaultNightFilter: '5',
                    NightCommonEvent: '4', MorningCommonEvent: '8', NightSwitch: '20', NightStep: '2' } })(`
                    initial(); command('RecordDefeat', { Amount: '2' });
                    if (${night}) { command('RecordDefeat'); tick(); }
                    const expected = JsonEx.stringify($gameSystem._mapTypeDayNight);
                    const outputs = getState();
                    const saved = JsonEx.stringify(DataManager.makeSaveContents());
                    DataManager.createGameObjects();
                    DataManager.extractSaveContents(JsonEx.parse(saved));
                    assert.ok($gameSystem instanceof Game_System);
                    assert.ok($gameScreen instanceof Game_Screen);
                    assert.ok($gameMap instanceof Game_Map);
                    assert.ok($gameMap._interpreter instanceof Game_Interpreter);
                    assert.equal(JsonEx.stringify($gameSystem._mapTypeDayNight), expected);
                    assert.deepEqual($gameTemp._commonEventQueue, []);
                    const beforeLog = log.slice();
                    $gameScreen._lnFilmicFilter.enabled = false;
                    start(Scene_Load); tick(); start(Scene_Load); tick();
                    expectFilter(${night ? 5 : 1});
                    assert.equal($gameSwitches.value(20), ${night});
                    assert.equal(JsonEx.stringify($gameSystem._mapTypeDayNight), expected);
                    assert.deepEqual(getState(), outputs);
                    assert.deepEqual(log, beforeLog);
                    assert.deepEqual($gameTemp._commonEventQueue, []);
                    if (${night}) {
                        command('Morning'); command('RecordDefeat', { Amount: '5' });
                        expectState(true, 8, 0, 2);
                    } else { command('RecordDefeat'); expectState(true, 3, 0, 1); }
                `);
            });
    }
}

test('v2 old save without day/night state initializes at load without transition reservations', () => {
    setup({ filters: true, parameters: { DefaultDayFilter: '1', NightCommonEvent: '4', MorningCommonEvent: '8' } })(`
        initial(); delete $gameSystem._mapTypeDayNight;
        const saved = JsonEx.stringify(DataManager.makeSaveContents());
        DataManager.createGameObjects(); DataManager.extractSaveContents(JsonEx.parse(saved));
        start(Scene_Load); tick(); expectState(false, 0, 0, 0); expectFilter(1);
        assert.deepEqual($gameTemp._commonEventQueue, []); assert.deepEqual(log, []);
    `);
});

test('v2 night/morning commons append to real reservation queue without interrupting running events', () => {
    setup({ parameters: { NightCommonEvent: '8', MorningCommonEvent: '9' } })(`
        initial(); $gameMap._interpreter.setup([wait(2), script('log.push("通常完了")'), end]);
        $gameTemp.reserveCommonEvent(4);
        command('StartNight'); command('Morning');
        assert.deepEqual($gameTemp._commonEventQueue, [4, 8, 9]);
        transfer(11, '<MapType:街>'); tick(1); assert.deepEqual(log, []);
        tick(); assert.deepEqual(log, ['通常完了', '予約', 'メニュー', '戦闘', '街']);
    `);
});

test('v2 missing transition common warns without preventing state changes', () => {
    setup({ parameters: { NightCommonEvent: '999', MorningCommonEvent: '998' } })(`
        initial(); command('StartNight'); expectState(true, 0, 0, 1);
        command('Morning'); expectState(false, 0, 0, 1);
        assert.equal(warnings.length, 2);
        assert.match(warnings[0], /MapTypeCommonEvent.*999/);
        assert.match(warnings[1], /MapTypeCommonEvent.*998/);
        assert.deepEqual($gameTemp._commonEventQueue, []);
    `);
});

test('v2 real Keke busy transfer completes before reserved night/morning and entry commons',
    { skip: !timingSource }, () => {
        setup({ keke: true, filters: true, timing: { 'コモン-場所移動-後': '6' },
            parameters: { NightCommonEvent: '8', MorningCommonEvent: '9', DefaultNightFilter: '5' } })(`
            initial(); transfer(11, '<MapType:街>');
            assert.equal($gameTemp.inTimingCommonKe(), true);
            $gameTemp.reserveCommonEvent(4); command('RecordDefeat', { Amount: '3' });
            command('Morning');
            assert.deepEqual($gameTemp._commonEventQueue, [4, 8, 9]);
            tick(1); assert.deepEqual(log, ['移動後']);
            tick(); assert.deepEqual(log, ['移動後', '移動後完了', '予約', 'メニュー', '戦闘', '街']);
            expectState(false, 3, 0, 1); assert.equal($gameMap.isEventRunning(), false);
        `);
    });

for (const suffix of ['?v=regression', '#regression', '?v=regression#startup']) {
    test(`installed Keke handles cache-busted script URL ${suffix}`, { skip: !timingSource }, () => {
        setup({ keke: true, timingUrl: 'https://example.invalid/js/plugins/Keke_TimingCommon.js' + suffix,
            timing: { 'コモン-場所移動-後': '6' } })(`
            assert.equal(typeof PluginManager._commands['Keke_TimingCommon:タイミングコモン全無効'], 'function');
            initial(); transfer(11, '<MapType:街>'); tick();
            assert.deepEqual(log, ['移動後', '移動後完了', '街']);
            PluginManager.callCommand(new Game_Interpreter(), 'Keke_TimingCommon', 'タイミングコモン全無効', {});
            assert.equal($gameMap._noTimingCommonKe, true);
        `);
    });
}

test('installed Keke boot update and public queries tolerate missing game map', { skip: !timingSource }, () => {
    setup({ keke: true, beforeCreate: `
        assert.equal($gameMap, null);
        const bootScene = new Scene_Base(); bootScene.update();
        assert.equal(bootScene.baseUpdates, 1);
        const earlyTemp = new Game_Temp();
        assert.equal(earlyTemp.inTimingCommonKe(), false);
        assert.equal(earlyTemp.isBattlePreCommonKe(), false);
        new Spriteset_Map().initialize(); new Spriteset_Battle().initialize();
    ` })(`initial(); command('GetState'); expectState(false, 0, 0, 0);`);
});

test('installed Keke early lookup initializes missing dictionaries without replacing saved settings',
    { skip: !timingSource }, () => {
        setup({ keke: true, timing: { 'コモン-バトル開始-前': '9' } })(`
            assert.equal($gameMap._timingCommonChangesKe, undefined);
            assert.equal($gameMap._timingCommonInvalidsKe, undefined);
            assert.ok($gameTemp.isBattlePreCommonKe());
            assert.deepEqual($gameMap._timingCommonChangesKe, {});
            assert.deepEqual($gameMap._timingCommonInvalidsKe, {});
            const changes = $gameMap._timingCommonChangesKe = { BattleStartPre: 8 };
            delete $gameMap._timingCommonInvalidsKe;
            assert.ok($gameTemp.isBattlePreCommonKe());
            assert.equal($gameMap._timingCommonChangesKe, changes);
            const invalids = $gameMap._timingCommonInvalidsKe = { BattleStartPre: true };
            delete $gameMap._timingCommonChangesKe;
            assert.equal($gameTemp.isBattlePreCommonKe(), false);
            assert.equal($gameMap._timingCommonInvalidsKe, invalids);
            new Spriteset_Map().initialize(); new Spriteset_Battle().initialize();
            assert.equal($gameMap._timingCommonInvalidsKe, invalids);
        `);
    });