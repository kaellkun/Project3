//=============================================================================
// keke_PattoMute - パッとミュート
// バージョン: 1.1.4
//=============================================================================
// Copyright (c) 2021 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @target MZ
 * @plugindesc ゲームの音を1ボタンでミュートする
 * @author ケケー
 * @url https://kekeelabo.com
 * 
 *
 *
 * @help
 * 【ver.1.1.4】
 * キーボードの M を押すとゲームの音が消える
 * もう一度押すと元に戻る
 * 起動時からミュートにしておくことも可能
 * ツクールMZ/MV両対応
 *
 *【利用規約】
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 * 
 * 
 * 
 * Mute the game sound by pressing M on the keyboard
 * Press again to undo
 * It is also possible to mute from the start
 * Compatible with both Maker MZ/MV
 *
 *【terms of service】
 * Feel free to use it under the MIT license.
 * 
 * 
 * 
 * @param 起動時にミュート
 * @desc ゲーム起動時にミュートにする
 * @type boolean
 * @default false
 */



(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.match(/^.*\/(.*).js$/)[1];



    //- ミュートキーの設定
    Input.keyMapper['77'] = 'm';



    //- パラメータ受け取り
    let parameters = PluginManager.parameters(pluginName);

    let keke_muteOnBoot = parameters["起動時にミュート"];
    keke_muteOnBoot = keke_muteOnBoot == "true" ? true : false;

    parameters = null;



    //- シーンブート/開始(コア追加)
    const _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        _Scene_Boot_start.apply(this);
        // 起動時にミュート
        if (keke_muteOnBoot) {
            // MVの場合
            if (typeof(ColorManager) == "undefined") {
                AudioManager.masterVolume = 0;
            // MZの場合
            } else {
                muteOn();
            }
        }
    };


    //- シーンベース/更新-MV(コア追加)
    if (typeof(ColorManager) == "undefined") {
    const _Scene_Base_update = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        _Scene_Base_update.call(this);
        // ミュートキーを押したらミュート
        if (Input.isTriggered('m')) {
            let masterVol = AudioManager.masterVolume;
            if (masterVol) {
                AudioManager.masterVolume = 0;
            } else {
                AudioManager.masterVolume = 1;
            }
        };
    };
    };

    //- シーンベース/更新-MZ(コア追加)
    if (typeof(ColorManager) != "undefined") {
    const _Scene_Base_update = Scene_Base.prototype.update;
    Scene_Base.prototype.update = function() {
        _Scene_Base_update.call(this);
        // ミュートキーを押したらミュート
        if (Input.isTriggered('m')) {
            if (AudioManager._muteKe) {
                muteOff();
            } else {
                muteOn();
            }
        };
    };
    };


    //- ミュートオン
    function muteOn() {
        AudioManager._muteKe = true;
        if (AudioManager._bgmBuffer) { AudioManager._bgmBuffer.volume = 0; }
        if (AudioManager._bgsBuffer) { AudioManager._bgsBuffer.volume = 0; }
        if (AudioManager._meBuffer) { AudioManager._meBuffer.volume = 0; }
        if (AudioManager._seBuffers && AudioManager._seBuffers.length) { AudioManager._seBuffers.forEach(buffer => buffer.volume = 0); }
    };

    //- ミュートオフ
    function muteOff() {
        AudioManager._muteKe = false;
        AudioManager.updateBgmParameters(AudioManager._currentBgm);
        AudioManager.updateBgsParameters(AudioManager._currentBgs);
        AudioManager.updateMeParameters(AudioManager._currentMe);
    };


    //- バッファーバラメータの更新(処理追加)
    const _AudioManager_updateBufferParameters = AudioManager.updateBufferParameters;
    AudioManager.updateBufferParameters = function(buffer, configVolume, audio) {
        _AudioManager_updateBufferParameters.apply(this, arguments);
        if (buffer && audio && this._muteKe) {
            buffer.volume = 0;
        }
    };

})();