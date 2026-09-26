const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const plugin = fs.readFileSync(path.join(root, 'js/plugins/EventQuarterScale.js'), 'utf8');

function setup(eventMeta, scale = '0.25') {
    class Game_Event {
        constructor() {
            this.meta = eventMeta;
        }

        event() {
            return { meta: this.meta };
        }
    }

    class Sprite_Character {
        constructor(character) {
            this._character = character;
            this.scale = {
                x: 1,
                y: 1,
                set: (x, y) => {
                    this.scale.x = x;
                    this.scale.y = y;
                }
            };
        }

        update() {}
    }

    const context = vm.createContext({
        Game_Event,
        Sprite_Character,
        PluginManager: { parameters: () => ({ NoteTag: 'QuarterScale', Scale: scale }) }
    });
    vm.runInContext(plugin, context);
    return { Game_Event: context.Game_Event, Sprite_Character: context.Sprite_Character };
}

test('対象タグのイベント画像だけ設定倍率になる', () => {
    const { Game_Event, Sprite_Character } = setup({ QuarterScale: true }, '0.5');
    const sprite = new Sprite_Character(new Game_Event());
    sprite.update();
    assert.equal(sprite.scale.x, 0.5);
    assert.equal(sprite.scale.y, 0.5);
});

test('8掛けを選ぶと0.8倍になる', () => {
    const { Game_Event, Sprite_Character } = setup({ QuarterScale: true }, '0.8');
    const sprite = new Sprite_Character(new Game_Event());
    sprite.update();
    assert.equal(sprite.scale.x, 0.8);
    assert.equal(sprite.scale.y, 0.8);
});

test('対象タグがないイベント画像は等倍のままになる', () => {
    const { Game_Event, Sprite_Character } = setup({ OtherTag: true });
    const sprite = new Sprite_Character(new Game_Event());
    sprite.update();
    assert.equal(sprite.scale.x, 1);
    assert.equal(sprite.scale.y, 1);
});

test('イベントページ切替後も現在のメモタグに追従する', () => {
    const { Game_Event, Sprite_Character } = setup({ QuarterScale: true });
    const event = new Game_Event();
    const sprite = new Sprite_Character(event);
    sprite.update();
    event.meta = {};
    sprite.update();
    assert.equal(sprite.scale.x, 1);
    assert.equal(sprite.scale.y, 1);
});
