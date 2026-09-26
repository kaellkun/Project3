//=============================================================================
// RPG Maker MZ - EventQuarterScale
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 指定したメモタグのイベント画像をフィールドマップ上で縮小します。
 * @author Project3
 *
 * @param NoteTag
 * @text 対象メモタグ
 * @desc イベントのメモ欄に記入すると画像を縮小するタグ名です。記入例: <QuarterScale>
 * @type string
 * @default QuarterScale
 *
 * @param Scale
 * @text 縮小率
 * @desc 対象イベント画像の表示倍率です。
 * @type select
 * @option 4分の1 (0.25倍)
 * @value 0.25
 * @option 半分 (0.5倍)
 * @value 0.5
 * @option 8掛け (0.8倍)
 * @value 0.8
 * @default 0.25
 *
 * @help
 * イベントのメモ欄に <QuarterScale> と記入すると、そのイベントの画像を
 * フィールドマップ上で指定した倍率に縮小して表示します。
 *
 * 対象メモタグはプラグインパラメータ「対象メモタグ」で変更できます。
 * 縮小率は「4分の1」「半分」「8掛け」から選択できます。
 * タイル画像を設定したイベントにも適用されます。
 * プレイヤー、フォロワー、乗り物、戦闘画面の画像は変更しません。
 */

(() => {
    'use strict';

    const pluginName = 'EventQuarterScale';
    const parameters = PluginManager.parameters(pluginName);
    const noteTag = String(parameters.NoteTag || 'QuarterScale').trim() || 'QuarterScale';
    const configuredScale = Number(parameters.Scale || 0.25);
    const scale = [0.25, 0.5, 0.8].includes(configuredScale) ? configuredScale : 0.25;

    Game_Event.prototype.isQuarterScaleEvent = function() {
        const eventData = this.event();
        return !!(eventData && eventData.meta &&
            Object.prototype.hasOwnProperty.call(eventData.meta, noteTag));
    };

    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.apply(this, arguments);
        this.updateEventQuarterScale();
    };

    Sprite_Character.prototype.updateEventQuarterScale = function() {
        const isTarget = this._character instanceof Game_Event &&
            this._character.isQuarterScaleEvent();
        const targetScale = isTarget ? scale : 1;
        if (this.scale.x !== targetScale || this.scale.y !== targetScale) {
            this.scale.set(targetScale, targetScale);
        }
    };
})();
