const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const pluginPath = path.join(root, 'js/plugins/Common/DarkPlasma_OrderIdAlias.js');
const pluginSource = fs.readFileSync(pluginPath, 'utf8');

function loadSkillList(src) {
    const requestedParameters = [];
    const context = {
        document: { currentScript: { src } },
        PluginManager: {
            parameters(name) {
                requestedParameters.push(name);
                return name === 'DarkPlasma_OrderIdAlias' ? { sortSkillById: 'true' } : {};
            }
        },
        DataManager: {
            extractMetadata(data) {
                data.meta = {};
                const match = data.note.match(/<OrderId:([^>]+)>/);
                if (match) data.meta.OrderId = match[1];
            }
        },
        Window_ItemList: { prototype: { makeItemList() {} } },
        Window_SkillList: {
            prototype: {
                makeItemList() {
                    this._data = this.items;
                }
            }
        }
    };

    vm.runInNewContext(pluginSource, context, { filename: pluginPath });
    return { context, requestedParameters };
}

function sortSkills(src, skills) {
    const { context, requestedParameters } = loadSkillList(src);
    for (const skill of skills) context.DataManager.extractMetadata(skill);
    const window = { items: skills };
    context.Window_SkillList.prototype.makeItemList.call(window);
    return {
        ids: window._data.map(skill => skill.id),
        requestedParameters
    };
}

test('reads sortSkillById with cache-busted and hash-suffixed script URLs', () => {
    const skills = [
        { id: 3, note: '' },
        { id: 2, note: '<OrderId:1000>' },
        { id: 1, note: '' }
    ];

    for (const suffix of ['?v=123', '#boot']) {
        const { ids, requestedParameters } = sortSkills(
            `file:///game/js/plugins/Common/DarkPlasma_OrderIdAlias.js${suffix}`,
            skills.map(skill => ({ ...skill }))
        );
        assert.deepEqual(ids, [1, 3, 2], suffix);
        assert.deepEqual(requestedParameters, ['DarkPlasma_OrderIdAlias'], suffix);
    }
});

test('respects an explicit OrderId of zero', () => {
    const { ids } = sortSkills(
        'file:///game/js/plugins/Common/DarkPlasma_OrderIdAlias.js',
        [
            { id: 4, note: '<OrderId:0>' },
            { id: 1, note: '' },
            { id: 2, note: '<OrderId:2>' }
        ]
    );

    assert.deepEqual(ids, [4, 1, 2]);
});