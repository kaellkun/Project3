//=============================================================================
//  Keke_orderEscapeFix - 行動順・逃走率固定
// バージョン: 1.0.2
//=============================================================================
// Copyright (c) 2022 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 行動順と逃走率を固定する
 * @author ケケー
 * @url https://kekeelabo.com
 * 
 * @help
 * 【ver.1.0.2】
 * 行動順と逃走率を固定値にする
 * 
 * 
 * ● 使い方 ●
 *
 * 【機能】敵ごとに逃走率を設定
 * 　敵キャラのメモ欄に
 * <逃走率: 50>
 * 　50%の確率で逃走可能
 * ※逃走率は“最も確率が低い”敵のものが採用される
 * 　逃走率50%の敵と30%の敵がいるなら30%
 *
 * 
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 *
 *
 *
 * Set the turn order and escape rate to fixed values.
 * 
 * 
 * ● How to use ●
 *
 * [Function] Set escape rate for each enemy
 *   In the memo field of the enemy character
 * <Escape Rate: 50>
 *   50% chance to escape
 * ※ Escape rate is taken from the enemy with the "lowest probability"
 *   30% if there is an enemy with a 50% escape rate
 *   and an enemy with a 30% escape rate
 *
 *
 * ● Terms of Use ●
 * Feel free to use it under the MIT license.
 * 
 * 
 * 
 * @param 行動順固定
 * @desc 行動順のランダム要素をなくす。敏捷性 1 でも高いなら必ず先に行動するようなる
 * @type boolean
 * @default true
 *
 * @param 逃走率固定
 * @desc 逃走率を固定にする
 * @type boolean
 * @default true
 *
 * @param 基本逃走率
 * @desc 固定時の基本逃走率。100 なら 100% の確率で逃走。\v[5] なら変数5を使用
 * @default 100
 *
 * @param 逃走率上昇
 * @desc 逃走失敗時の逃走率上昇量。25 なら 25% 上昇。\v[5] なら変数5を使用
 * @default 25
 */
 
 
 
(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.split("/").pop().split("?")[0].replace(/\.js$/, "");
    
    
    
    //==================================================
    //--  パラメータ受け取り  --//
    //==================================================
    
    //- 真偽化
    function toBoolean(str) {
        if (!str) { return false; }
        const str2 = str.toString().toLowerCase();
        if (str2 == "true" || str2 == "on") { return true; }
        if (str2 == "false" || str2 == "off") { return false; }
        return Number(str);
    };

    const parameters = PluginManager.parameters(pluginName);
    
    const keke_orderix = toBoolean(parameters["行動順固定"]);
    const keke_escapeFix = toBoolean(parameters["逃走率固定"]);
    const keke_escapeRateBasic = parameters["基本逃走率"];
    const keke_escapeRateUp = parameters["逃走率上昇"];
    
    

    //==================================================
    //--  行動順固定
    //==================================================
    
    //- ゲームアクション/スピード(処理追加)
    const _Game_Action_speed = Game_Action.prototype.speed;
    Game_Action.prototype.speed = function() {
        // 行動順固定
        if (keke_orderix) {
            const agi = this.subject().agi;
            let speed = agi;
            if (this.item()) {
                speed += this.item().speed;
            }
            if (this.isAttack()) {
                speed += this.subject().attackSpeed();
            }
            return speed;
        }

        return _Game_Action_speed.apply(this);
    };
    
    
    //- バトルマネージャー/逃走率の作成(処理追加)
    const _BattleManager_makeEscapeRatio = BattleManager.makeEscapeRatio;
    BattleManager.makeEscapeRatio = function() {
        // 逃走率固定
        if (keke_escapeFix) {
            this._escapeRatio = getEscapeRatio();
            return;
        }

        _BattleManager_makeEscapeRatio.apply(this);
    };

    //- 逃走率の取得
    function getEscapeRatio() {
        let rate = null;
        $gameTroop.members().forEach(enemy => {
            const data = enemy.enemy();
            const meta = newFunc_var(data.meta["逃走率"] || data.meta["escapeRate"]);
            if (!meta) { return; }
            rate = rate == null ? Number(meta) / 100 :  Math.min(rate, Number(meta) / 100)
        });
        if (rate == null) { rate = newFunc_var(keke_escapeRateBasic) / 100; }
        return Math.max(rate, 0);
    };
    
    
    //- バトルマネージャー/逃走失敗時の処理(処理追加)
    const _BattleManager_onEscapeFailure = BattleManager.onEscapeFailure;
    BattleManager.onEscapeFailure = function() {
        _BattleManager_onEscapeFailure.apply(this);

        // 逃走率上昇
        if (keke_escapeFix) {
            this._escapeRatio = Math.max(this._escapeRatio - 0.1 + newFunc_var(keke_escapeRateUp) / 100, 0);
        }  
    };



    //==================================================
    //--  テキスト基本 /ベーシック
    //==================================================
    
    //- 変数の置換
    function convertVariable(str) {
        if (str == null) { return str; }
        str = str.toString();
        const matches = str.match(/[\x1b\\]v\[(\d+)\]/gi);
        if (!matches) { return str; }
        matches.forEach(parts => {
            const match = parts.match(/\\v\[(\d+)\]/i);
            const id = Number(match[1]);
            const val = $gameVariables._data[id] || "";
            str = str.replace(match[0], val);
        });
        return str;
    };



    //==================================================
    //--  動的関数 /ベーシック
    //==================================================

    let Funcs = {};

    //- ニューファンク
    function newFunc(str) {
        if (!Funcs[str]) {
            Funcs[str] = new Function("", "return " + str);
        }
        return Funcs[str]();
    };

    //- ニューファンク-変数
    function newFunc_var(str) {
        if (!str) { return null; }
        str = convertVariable(str) || 0;
        // ニューファンク
        return newFunc(str);
    };
    
})();