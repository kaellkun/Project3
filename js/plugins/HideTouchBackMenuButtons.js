//=============================================================================
// RPG Maker MZ - Hide Touch Back Menu Buttons
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Hides the standard touch back and menu buttons.
 * @author Project3
 *
 * @help HideTouchBackMenuButtons.js
 *
 * Hides the standard RPG Maker MZ touch UI buttons used for cancel/back and
 * menu actions. Keyboard, mouse, and other touch input behavior is unchanged.
 */

/*:ja
 * @target MZ
 * @plugindesc タッチ操作用の戻るボタンとメニューボタンを非表示にします。
 * @author Project3
 *
 * @help HideTouchBackMenuButtons.js
 *
 * RPG Maker MZ 標準のタッチ操作用「戻る」ボタンと「メニュー」ボタンを
 * 非表示にします。キーボード、マウス、その他のタッチ入力は変更しません。
 */

(() => {
    Scene_Map.prototype.createMenuButton = function() {};
    Scene_MenuBase.prototype.createCancelButton = function() {};
    Scene_MenuBase.prototype.createPageButtons = function() {};
    Scene_Battle.prototype.createCancelButton = function() {};
    Window_ChoiceList.prototype.createCancelButton = function() {};
    Window_EventItem.prototype.createCancelButton = function() {};
})();
