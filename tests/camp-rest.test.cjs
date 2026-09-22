const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const pluginSource = fs.readFileSync("js/plugins/CampRest.js", "utf8");

test("CampRest is valid JavaScript and documents its plugin command", () => {
    assert.match(pluginSource, /@command StartRest/);
    assert.match(pluginSource, /PluginManager\.registerCommand\(pluginName, "StartRest"/);
    assert.match(pluginSource, /setText\("焚き火休憩では/);
});

test("CampRest registration is enabled with the project meat defaults", () => {
    const context = {};
    vm.runInNewContext(fs.readFileSync("js/plugins.js", "utf8"), context);
    const plugin = context.$plugins.find(entry => entry.name === "CampRest");
    assert.ok(plugin);
    assert.equal(plugin.status, true);
    assert.equal(plugin.parameters.MeatItemIds, "2,65,89");
    assert.equal(plugin.parameters.HpRecoveryRate, "25");
});

test("CampRest contains tagged meat support, quantity confirmation, and MP recovery", () => {
    assert.match(pluginSource, /<CampRestMeat>/);
    assert.match(pluginSource, /この数量で使う/);
    assert.match(pluginSource, /actor\.gainHp\(Math\.floor\(actor\.mhp \* hpRecoveryRate \* count\)\)/);
    assert.match(pluginSource, /actor\.setMp\(actor\.mmp\)/);
    assert.doesNotMatch(pluginSource, /\.mmp\(\)/);
});

test("CampRest finishRest restores MP through the mmp getter without throwing", () => {
    const source = pluginSource.match(/finishRest\(message\) \{([\s\S]*?)\n        \}/)[1];
    const actor = {
        _mp: 0,
        get mmp() { return 42; },
        setMp(value) { this._mp = value; },
        refresh() {},
    };
    const context = {
        $gameParty: { members: () => [actor] },
        $gameMessage: { add() {} },
        SceneManager: { pop() {} },
        message: "",
    };
    vm.runInNewContext(source, context);
    assert.equal(actor._mp, 42);
});
