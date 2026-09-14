const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const core = read('js/rmmz_core.js');
const managers = read('js/rmmz_managers.js');
const main = read('js/main.js');
function definition(source, name) {
    const start = source.indexOf(`${name} = function(`);
    assert.notEqual(start, -1, name);
    return source.slice(start, source.indexOf('\n};', start) + 3);
}

function setup(token = 'boot-1', baseURI = 'https://example.com/game/index.html') {
    const calls = [];
    const context = vm.createContext({
        URL, URLSearchParams, console, calls,
        window: { __Project3CacheBuster: token },
        document: { baseURI },
        Utils: {}, Bitmap: function() {}, WebAudio: function() {}, Video: {},
        DataManager: {}, FontManager: { _urls: {}, _states: {} },
        EffectManager: { _cache: {} },
        XMLHttpRequest: class {
            open(...args) { calls.push(args); }
            overrideMimeType() {}
            send() {}
        },
        Image: class {},
        FontFace: class {
            constructor(...args) { calls.push(args); }
            load() { return new Promise(() => {}); }
        },
        Graphics: { effekseer: { loadEffect(...args) { calls.push(args); return {}; } } }
    });
    const run = code => vm.runInContext(code, context);
    run(main.slice(0, main.indexOf('const main = new Main();')));
    run('Utils.cacheBustedUrl = withProject3CacheBuster;');
    for (const name of ['Bitmap.prototype._startLoading', 'Bitmap.prototype._startDecrypting',
        'WebAudio.prototype._realUrl', 'Video.play']) run(definition(core, name));
    for (const name of ['DataManager.loadDataFile', 'FontManager.startLoading',
        'EffectManager.startLoading']) run(definition(managers, name));
    return { run, calls, context };
}

test('resource URLs share a boot token and replace it without losing query/hash', () => {
    const { run } = setup();
    assert.equal(run('withProject3CacheBuster("data/Actors.json")'), 'data/Actors.json?v=boot-1');
    assert.equal(run('withProject3CacheBuster("img/a.png?mode=x&v=old#part")'), 'img/a.png?mode=x&v=boot-1#part');
    assert.equal(run('withProject3CacheBuster(withProject3CacheBuster("img/a.png"))'), 'img/a.png?v=boot-1');
    assert.equal(setup('boot-2').run('withProject3CacheBuster("data/Actors.json")'), 'data/Actors.json?v=boot-2');
});

test('data/blob/external/sibling URLs are untouched; file previews are supported', () => {
    const { run } = setup();
    for (const url of ['data:image/png;base64,abc', 'blob:https://example.com/123',
        'https://cdn.example.com/img/a.png', '/another-game/a.png', '../game2/a.png']) {
        assert.equal(run(`withProject3CacheBuster(${JSON.stringify(url)})`), url);
    }
    assert.equal(setup('local', 'file:///game/index.html').run('withProject3CacheBuster("img/a.png")'), 'img/a.png?v=local');
});

test('database/map requests use versioned URLs but retain original retry paths', () => {
    const { run, calls } = setup();
    run('DataManager.loadDataFile("$dataMap", "Map001.json"); DataManager.loadDataFile("$dataActors", "Actors.json");');
    assert.deepEqual(calls, [['GET', 'data/Map001.json?v=boot-1'], ['GET', 'data/Actors.json?v=boot-1']]);
    assert.equal(run('window.$dataMap'), null);
});

for (const encrypted of [false, true]) {
    test(`image loading versions the final filename (encrypted=${encrypted}) and keeps its logical URL`, () => {
        const { run, calls } = setup();
        run(`Utils.hasEncryptedImages = () => ${encrypted};
            const bitmap = new Bitmap();
            Object.assign(bitmap, { _url: 'img/system/Window.png', _onLoad() {}, _onError() {}, _destroyCanvas() {} });
            bitmap._startLoading();`);
        assert.equal(run('bitmap._url'), 'img/system/Window.png');
        if (encrypted) assert.deepEqual(calls, [['GET', 'img/system/Window.png_?v=boot-1']]);
        else assert.equal(run('bitmap._image.src'), 'img/system/Window.png?v=boot-1');
    });

    test(`audio URL is versioned after encryption suffix (encrypted=${encrypted})`, () => {
        const { run } = setup();
        run(`Utils.hasEncryptedAudio = () => ${encrypted};`);
        assert.equal(run('WebAudio.prototype._realUrl.call({ _url: "audio/bgm/Theme.ogg" })'),
            `audio/bgm/Theme.ogg${encrypted ? '_' : ''}?v=boot-1`);
    });
}

test('font, video, effect and effect dependencies receive the same token', () => {
    const { run, calls } = setup();
    run('FontManager.startLoading("game-font", "fonts/game.woff");');
    assert.deepEqual(calls[0], ['game-font', 'url(fonts/game.woff?v=boot-1)']);
    run('Object.assign(Video, { _element: { load() {} }, _onLoad() {}, _onError() {}, _onEnd() {} }); Video.play("movies/intro.webm");');
    assert.equal(run('Video._element.src'), 'movies/intro.webm?v=boot-1');
    run('EffectManager.startLoading("effects/Hit.efkefc");');
    assert.equal(calls[1][0], 'effects/Hit.efkefc?v=boot-1');
    assert.equal(calls[1][4]('effects/Texture/Hit.png'), 'effects/Texture/Hit.png?v=boot-1');
    assert.ok(run('EffectManager._cache["effects/Hit.efkefc"]'));
});

for (const failedUrl of ['effects/Hit.efkefc?v=boot-1', 'effects/Texture/Hit.png?v=boot-1']) {
    test(`effect retry retains its logical key after failure: ${failedUrl}`, () => {
        const { run, calls } = setup();
        for (const name of ['EffectManager.onError', 'EffectManager.checkErrors',
            'EffectManager.throwLoadError', 'EffectManager.isReady']) run(definition(managers, name));
        run('EffectManager._errorUrls = []; EffectManager.startLoading("effects/Hit.efkefc");');
        calls[0][3]('not found', failedUrl);
        let loadError;
        try { run('EffectManager.isReady()'); } catch (error) { loadError = error; }
        assert.equal(loadError[0], 'LoadError');
        assert.equal(loadError[1], 'effects/Hit.efkefc');
        loadError[2]();
        assert.equal(calls[1][0], 'effects/Hit.efkefc?v=boot-1');
        run('EffectManager._cache["effects/Hit.efkefc"].isLoaded = true;');
        assert.equal(run('Object.keys(EffectManager._cache).length'), 1);
        assert.equal(run('EffectManager.isReady()'), true);
    });
}

test('asset policy is installed before plugin setup; plugins and WASM are versioned', () => {
    const { run, calls } = setup();
    run(`
        Utils.cacheBustedUrl = url => url;
        const $plugins = [];
        const PluginManager = {
            makeUrl: filename => 'js/plugins/' + filename + '.js',
            setup() { calls.push(Utils.cacheBustedUrl('data/System.json')); }
        };
        const effekseer = { initRuntime(url) { calls.push(url); } };
        const boot = new Main(); boot.numScripts = 1; boot.onScriptLoad();
        calls.push(PluginManager.makeUrl('MobileTouchControls'));
        boot.initEffekseerRuntime();
    `);
    assert.deepEqual(calls, ['data/System.json?v=boot-1',
        'js/plugins/MobileTouchControls.js?v=boot-1', 'js/libs/effekseer.wasm?v=boot-1']);
});

async function resetPage({ cacheFails = false, workerFails = false, unsupported = false } = {}) {
    const deleted = [], unregistered = [], navigations = [];
    const elements = { status: {}, 'start-game': { hidden: true, addEventListener(_, callback) { this.click = callback; } } };
    const cache = {
        async keys() { return [{ url: 'https://example.com/game/data/Actors.json' }, { url: 'https://example.com/other/data/Actors.json' }]; },
        async delete(request) { deleted.push(request.url); return true; }
    };
    const window = {
        location: { href: 'https://example.com/game/clear-cache.html?test&cache-cleared=old',
            search: '?test&cache-cleared=old', replace(url) { navigations.push(url); } }
    };
    const navigator = {};
    if (!unsupported) {
        window.caches = {
            async keys() { if (cacheFails) throw new Error('Cache API blocked'); return ['shared-cache']; },
            async open() { return cache; }
        };
        navigator.serviceWorker = {
            async getRegistrations() {
                if (workerFails) throw new Error('SW API blocked');
                return ['game/', 'other/', ''].map(scope => ({ scope: `https://example.com/${scope}`,
                    async unregister() { unregistered.push(scope); return true; } }));
            }
        };
    }
    const context = vm.createContext({ URL, Date, window, navigator,
        console: { warn() {} }, document: { getElementById: id => elements[id] },
        localStorage: { clear() { assert.fail('must preserve saves'); } },
        indexedDB: { deleteDatabase() { assert.fail('must preserve saves'); } }
    });
    const script = read('clear-cache.html').match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
    vm.runInContext(script, context);
    await new Promise(setImmediate);
    return { deleted, unregistered, navigations, elements };
}

test('manual reset only clears this game and navigates with a fresh HTML URL', async () => {
    const result = await resetPage();
    assert.deepEqual(result.deleted, ['https://example.com/game/data/Actors.json']);
    assert.deepEqual(result.unregistered, ['game/']);
    const url = new URL(result.navigations[0]);
    assert.equal(url.pathname, '/game/index.html');
    assert.ok(url.searchParams.has('test'));
    assert.notEqual(url.searchParams.get('cache-cleared'), 'old');
});

test('blocked Cache API does not skip service workers; failure is visible and retry works', async () => {
    const result = await resetPage({ cacheFails: true });
    assert.deepEqual(result.unregistered, ['game/']);
    assert.equal(result.elements['start-game'].hidden, false);
    assert.match(result.elements.status.textContent, /失敗/);
    assert.equal(result.navigations.length, 0);
    result.elements['start-game'].click();
    assert.equal(result.navigations.length, 1);
});

test('blocked service workers do not prevent clearing Cache Storage', async () => {
    const result = await resetPage({ workerFails: true });
    assert.equal(result.deleted.length, 1);
    assert.equal(result.elements['start-game'].hidden, false);
});

test('without Cache/SW APIs (such as mobile HTTP), fresh navigation still works', async () => {
    assert.equal((await resetPage({ unsupported: true })).navigations.length, 1);
});