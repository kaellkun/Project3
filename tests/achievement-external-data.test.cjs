const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const extension = 'js/plugins/Scene/addon/AchievementExternalData.js';
const sample = read('data/Achievements.json');

function setup({ category = true, mode = '', file = 'Achievements.json', base = true } = {}) {
    const context = vm.createContext({ assert, console });
    const run = code => vm.runInContext(code, context);
    run(`
        const window = globalThis;
        const document = { currentScript: null };
        const requests = [];
        const saves = [];
        let stored = { unlockInfo: [] };
        let resolveStorage;
        const StorageManager = {
            loadObject: () => new Promise(resolve => { resolveStorage = () => resolve(stored); }),
            saveObject: (slot, data) => { saves.push({ slot, data }); return Promise.resolve(); }
        };
        const Utils = {
            isOptionValid: name => name === ${JSON.stringify(mode)},
            cacheBustedUrl: url => url + '?v=test'
        };
        class XMLHttpRequest {
            open(method, url) { this.url = url; this.method = method; }
            overrideMimeType(type) { this.mime = type; }
            send() { requests.push(this); }
            respond(text, status = 200) {
                this.status = status;
                this.responseText = text;
                this.onload();
            }
        }
        class Window_Base {}
        class Window_Selectable extends Window_Base {}
        class Window_Command extends Window_Selectable {}
        class Window_TitleCommand extends Window_Command { makeCommandList() {} }
        class Window_MenuCommand extends Window_Command { addOriginalCommands() {} }
        class Scene_MenuBase {}
        class Scene_Title { createCommandWindow() {} }
        class Scene_Menu { createCommandWindow() {} }
        class Scene_Boot {
            onDatabaseLoaded() {}
            start() {}
            isReady() { return true; }
        }
        const SceneManager = { onSceneTerminate() {} };
        const ImageManager = { loadSystem() {} };
    `);
    const managers = read('js/rmmz_managers.js');
    // Installed database loader, metadata parser, error/retry and command dispatch.
    run(managers.slice(managers.indexOf('function DataManager()'), managers.indexOf('function ConfigManager()')));
    run(managers.slice(managers.indexOf('function PluginManager()')));
    run(read('js/plugins.js'));
    run(`
        for (const plugin of $plugins) {
            PluginManager.setParameters(plugin.name.split('/').pop(), plugin.parameters);
        }
        PluginManager.setParameters('AchievementExternalData', { DataFile: ${JSON.stringify(file)} });
    `);
    if (base) run(read('js/plugins/Scene/TorigoyaMZ_Achievement2.js'));
    if (base && category) run(read('js/plugins/Scene/addon/TorigoyaMZ_Achievement2_AddonCategory.js'));
    run(read(extension));
    run(`
        const manager = Torigoya.Achievement2.Manager;
        function startLoading() { DataManager.loadDatabase(); }
        function completeBase() {
            for (const xhr of requests.filter(xhr => !xhr.url.includes(${JSON.stringify(file)}))) {
                xhr.respond('{}');
            }
        }
        function externalRequest() { return requests.filter(xhr => xhr.url.includes(${JSON.stringify(file)})).at(-1); }
    `);
    const respond = (data = sample, status = 200) => run(`externalRequest().respond(${JSON.stringify(data)}, ${status});`);
    return { run, respond };
}

test('registered after base/category and loads real sample through cache-aware XHR', () => {
    const { run, respond } = setup();
    run(`
        const names = $plugins.filter(p => p.status).map(p => p.name);
        assert.ok(names.indexOf('AchievementExternalData') > names.indexOf('Scene/addon/TorigoyaMZ_Achievement2_AddonCategory'));
        startLoading();
        completeBase();
        assert.equal(DataManager.isDatabaseLoaded(), false);
        assert.equal(manager.isReady(), false);
        assert.equal(externalRequest().url, 'data/Achievements.json?v=test');
        assert.equal(externalRequest().mime, 'application/json');
        assert.equal(externalRequest().method, 'GET');
    `);
    respond();
    run(`
        assert.equal(DataManager.isDatabaseLoaded(), true);
        const data = Torigoya.Achievement2.parameter.baseAchievementData;
        assert.equal(data.length, 5);
        assert.equal(data[0].description, '旅立ちの一歩を踏み出した。\\nここから、あなただけの冒険が始まる。');
        assert.deepEqual(Torigoya.Achievement2.Addons.Category.parameter.categories.map(c => c.name), ['物語', '戦闘', '探索']);
        assert.equal(data[4].isSecret, true);
        assert.equal(saves.length, 0);
    `);
});

test('base database must also finish; replacement is applied only once', () => {
    const { run, respond } = setup();
    run('startLoading();');
    respond();
    run(`
        assert.equal(DataManager.isDatabaseLoaded(), false);
        completeBase();
        assert.equal(DataManager.isDatabaseLoaded(), true);
        const categories = Torigoya.Achievement2.Addons.Category.parameter.categories;
        assert.equal(DataManager.isDatabaseLoaded(), true);
        assert.equal(Torigoya.Achievement2.Addons.Category.parameter.categories, categories);
    `);
});

test('real manager loads saved IDs after definitions, keeps popup/save settings and gains via existing command', async () => {
    const { run, respond } = setup();
    run(`
        stored = { unlockInfo: [['story_first_step', { date: 123 }]] };
        startLoading(); completeBase();
    `);
    respond();
    run(`
        assert.equal(DataManager.isDatabaseLoaded(), true);
        new Scene_Boot().onDatabaseLoaded();
        assert.equal(manager.isReady(), false);
        assert.equal(new Scene_Boot().isReady(), false);
        assert.equal(manager.achievements.length, 5);
        assert.equal(saves.length, 0);
        resolveStorage();
    `);
    await new Promise(resolve => setImmediate(resolve));
    run(`
        assert.equal(manager.isReady(), true);
        assert.equal(new Scene_Boot().isReady(), true);
        assert.equal(manager.getUnlockInfo('story_first_step').date, 123);
        assert.equal(manager.getUnlockedCount(), 1);
        assert.equal(Torigoya.Achievement2.parameter.popupEnable, true);
        assert.equal(Torigoya.Achievement2.parameter.baseSaveSlot, 'achievement');
        assert.equal(saves.length, 0);
        let notifications = 0;
        manager.on(() => notifications++);
        PluginManager.callCommand({}, 'TorigoyaMZ_Achievement2', 'gainAchievement', { key: ' battle_first_win ' });
        assert.equal(manager.isUnlocked('battle_first_win'), true);
        assert.equal(notifications, 1);
        assert.equal(saves[0].slot, 'achievement');
        assert.equal(saves[0].data.unlockInfo.length, 2);
        assert.equal(manager.unlock('battle_first_win'), false);
        assert.equal(manager.unlock('missing'), false);
        assert.equal(saves.length, 1);
    `);
});

test('minimal entry, category fallback, legacy tags and explicit override preserve other metadata', () => {
    const { run, respond } = setup();
    run('startLoading(); completeBase();');
    respond(JSON.stringify({ achievements: [
        { key: ' a ', title: ' A ' },
        { key: 'b', title: 'B', note: '<カテゴリ:探索>\n<Flag>' },
        { key: 'c', title: 'C', category: '戦闘', note: ['<カテゴリー:旧>', '<Value:2>'], hint: ['一行', '二行'] }
    ] }));
    run(`
        assert.equal(DataManager.isDatabaseLoaded(), true);
        manager.setAchievements(Torigoya.Achievement2.parameter.baseAchievementData);
        const a = manager.getAchievement('a');
        assert.equal(a.title, 'A');
        assert.equal(a.icon, 0);
        assert.equal(a.isSecret, false);
        assert.equal(a.description, '');
        assert.equal(a.revealSwitchId, 0);
        const category = Torigoya.Achievement2.Addons.Category;
        assert.equal(category.readCategoryName(a), 'その他');
        assert.equal(category.readCategoryName(manager.getAchievement('b')), '探索');
        assert.equal(manager.getAchievement('b').meta.Flag, true);
        assert.equal(category.readCategoryName(manager.getAchievement('c')), '戦闘');
        assert.equal(manager.getAchievement('c').meta.Value, '2');
        assert.equal(manager.getAchievement('c').hint, '一行\\n二行');
    `);
});

test('secret visibility uses installed strict threshold / switch logic and does not unlock', () => {
    const { run, respond } = setup();
    run('startLoading(); completeBase();');
    respond(JSON.stringify({ achievements: [{ key: 'secret', title: '秘密', isSecret: true,
        revealVariableId: 7, revealThreshold: 10, revealSwitchId: 8 }] }));
    run(`
        DataManager.isDatabaseLoaded();
        manager.setAchievements(Torigoya.Achievement2.parameter.baseAchievementData);
        const list = Object.create(Torigoya.Achievement2.Window_AchievementList.prototype);
        const item = manager.data()[0];
        assert.equal(list.isVisibleItem(item), false);
        $gameVariables = { value: () => 10 };
        $gameSwitches = { value: () => false };
        assert.equal(list.isVisibleItem(item), false);
        $gameVariables.value = () => 11;
        assert.equal(list.isVisibleItem(item), true);
        $gameVariables.value = () => 0;
        $gameSwitches.value = () => true;
        assert.equal(list.isVisibleItem(item), true);
        assert.equal(manager.isUnlocked('secret'), false);
        $gameSwitches.value = () => false;
        item.unlockInfo = { date: 123 };
        assert.equal(list.isVisibleItem(item), true);
        assert.equal(saves.length, 0);
    `);
});

for (const mode of ['btest', 'etest']) {
    test(`${mode}: external file is not prefixed with Test_`, () => {
        const { run, respond } = setup({ mode });
        run(`startLoading(); assert.ok(requests[0].url.includes('Test_Actors.json')); completeBase();`);
        respond();
        run(`assert.equal(externalRequest().url, 'data/Achievements.json?v=test'); assert.equal(DataManager.isDatabaseLoaded(), true);`);
    });
}

test('works without category addon and accepts UTF-8 BOM and custom nested path', () => {
    const { run, respond } = setup({ category: false, file: 'custom/achievements.json' });
    run('startLoading(); completeBase();');
    respond('\uFEFF' + sample, 0); // NW.js/file transport can return status 0.
    run(`assert.equal(DataManager.isDatabaseLoaded(), true); assert.equal(Torigoya.Achievement2.parameter.baseAchievementData.length, 5);`);
});

test('empty achievements retain one safe category', () => {
    const { run, respond } = setup();
    run('startLoading(); completeBase();');
    respond('{"achievements":[]}');
    run(`
        assert.equal(DataManager.isDatabaseLoaded(), true);
        assert.equal(Torigoya.Achievement2.parameter.baseAchievementData.length, 0);
        const category = Torigoya.Achievement2.Addons.Category;
        assert.equal(category.parameter.categories[0].name, 'その他');
        assert.equal(category.Window_AchievementCategory.prototype.maxCols(), 1);
    `);
});

for (const [name, data, expected] of [
    ['malformed JSON', '{broken', /AchievementExternalData: data\/Achievements.json/],
    ['null root', 'null', /ルート/],
    ['array root', '[]', /ルート/],
    ['missing array', '{}', /achievements/],
    ['null entry', '{"achievements":[null]}', /1件目/],
    ['missing key', '{"achievements":[{"title":"A"}]}', /\.key/],
    ['missing title', '{"achievements":[{"key":"a"}]}', /\.title/],
    ['numeric key', '{"achievements":[{"key":1,"title":"A"}]}', /\.key/],
    ['duplicate trimmed ID', '{"achievements":[{"key":"a","title":"A"},{"key":" a ","title":"B"}]}', /重複/],
    ...[
        ['icon', -1], ['icon', 1.5], ['icon', '82'], ['isSecret', 'false'],
        ['description', [1]], ['category', 'bad\nname'], ['category', '<bad>'],
        ['revealSwitchId', -1], ['revealVariableId', 1.5], ['revealThreshold', '10'], ['titel', 'typo']
    ].map(([field, value]) => [field + JSON.stringify(value), JSON.stringify({ achievements: [{ key: 'a', title: 'A', [field]: value }] }), new RegExp('\\.' + field)])
]) {
    test(`validation: ${name} stops boot without writing saves or replacing original definitions`, () => {
        const { run, respond } = setup();
        run('const original = Torigoya.Achievement2.parameter.baseAchievementData; startLoading(); completeBase();');
        assert.doesNotThrow(() => respond(data));
        assert.throws(() => run('DataManager.isDatabaseLoaded()'), expected);
        run(`
            assert.equal(Torigoya.Achievement2.parameter.baseAchievementData, original);
            assert.equal(manager.isReady(), false);
            assert.equal(saves.length, 0);
        `);
    });
}

for (const network of [false, true]) {
    test(`${network ? 'network' : 'HTTP 404'} error uses engine retry with the same external filename`, () => {
        const { run, respond } = setup();
        run('startLoading(); completeBase();');
        if (network) run('externalRequest().onerror();');
        else respond('Not found', 404);
        run(`
            let caught;
            try { DataManager.isDatabaseLoaded(); } catch (error) { caught = error; }
            assert.equal(caught[0], 'LoadError');
            assert.equal(caught[1], 'data/Achievements.json');
            caught[2]();
            assert.equal(DataManager.isDatabaseLoaded(), false);
        `);
        respond();
        run('assert.equal(DataManager.isDatabaseLoaded(), true); assert.equal(saves.length, 0);');
    });
}

test('clear error/loading state on a fresh database load', () => {
    const { run, respond } = setup();
    run('startLoading(); completeBase();');
    respond('bad');
    assert.throws(() => run('DataManager.isDatabaseLoaded()'), /Achievements.json/);
    run('startLoading(); completeBase(); assert.equal(DataManager.isDatabaseLoaded(), false);');
    respond();
    run('assert.equal(DataManager.isDatabaseLoaded(), true);');
});

test('missing base plugin gives actionable dependency error', () => {
    assert.throws(() => setup({ base: false }), /実績プラグイン本体より下/);
});

for (const file of ['../Achievements.json', '/Achievements.json', 'https://example.com/a.json', 'a.json?v=1']) {
    test(`invalid path: ${file}`, () => assert.throws(() => setup({ file }), /DataFile/));
}