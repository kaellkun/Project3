//=============================================================================
//  Keke_TpCustom - TPカスタム
// バージョン: 1.3.2（NUUN_PassiveSkill連携対応版）
//=============================================================================
// Copyright (c) 2021 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @target MZ
 * @plugindesc TPを拡張する（NUUN_PassiveSkill連携対応版）
 * @author ケケー（改変）
 * @url https://kekeelabo.com
 * 
 * @help
 * 【ver.1.3.2】NUUN_PassiveSkill連携対応版
 * TPを拡張する。以下の項目を自由に設定可能
 * 
 * ■ NUUN_PassiveSkill連携について
 * パッシブスキルが参照する武器のメモ欄に記載したTP関連タグも
 * 反映されるようになりました。
 * 
 * 【プラグイン読み込み順】
 * 1. NUUN_Base
 * 2. NUUN_PassiveSkill
 * 3. Keke_TpCustom（このプラグイン）
 * 
 * ---
 * ◎最大TP
 * ◎初期TP
 * ◎ダメージTPチャージ量
 * ◎消費TP
 * ◎TP動作のカスタマイズ
 * ◎MP動作のTP化
 * ◎メモ欄でHP/MP/TPダメージ
 * ◎運でMP/TP回復
 * 
 * 
 * ● 使い方 ●
 *
 * 【機能1】最大TP
 * 標準は 100。好きな値に設定できる
 *
 * ●メモ欄で最大TPを設定
 * アクター、職業、スキル、アイテム、装備、敵キャラ、ステート のメモ欄に
 * <最大TP: 200>
 * 　最大TP 200 にする
 * ※設定が複数ある場合は最大値が適用される
 *
 *
 * 【機能2】初期TP
 * 　標準は 0〜25。好きな値に設定できる
 * 　25~50 のように書くと、25〜50 のランダム値になる
 *
 * ●メモ欄で初期TPを設定
 * アクター、職業、スキル、アイテム、装備、敵キャラ、ステート のメモ欄に
 * <初期TP: 50>
 * 　戦闘開始時のTPが最大TPの 50% になる
 * <初期TP: 25~50>
 * 　戦闘開始時のTPが 25〜50 のランダム値になる
 * ※設定が複数ある場合、最大値が適用される
 * <初期TP加算: 10>
 * 　基本の初期TPに 10% を加算する
 * ※設定が複数ある場合、全て合計される
 * ●同様に初期MPも設定可能
 * <初期MP: 50>
 * 　戦闘開始時のMPが最大TPの M0% になる
 *
 *
 * 【機能3】ダメージTPチャージ量
 * 　標準は ダメージ / 最大HP(小数点切り捨て)。好きな計算式に設定できる
 *
 * ●ダメージTPカスタム
 * 　js式でTPチャージ量を記述
 * 　25 * d / php* tcr  など
 *
 * ●ダメージTP固定値
 * 　固定値分だけTPチャージするようにする
 * 　5 なら 5 上昇
 * 
 * ●ダメージTP最低値
 * 　TPチャージ量の最低値を設定する
 * 　5 なら 上昇量が 5 未満でも 5 は上昇
 *
 * ※優先度は カスタム > 固定値 > 最低値
 *
 * ●メモ欄でダメージTPチャージ量を設定
 * アクター、職業、スキル、アイテム、装備、敵キャラ、ステート のメモ欄に
  * <ダメージTPカスタム: 25 * d / php* tcr>
 * 　ダメージTPの式が 25 * d / php* tcrになる
 * 　この式はHPが少ないほどTPが多く溜まる仕様
 * <ダメージTP固定: 5>
 * 　ダメージTPが固定値で 5 になる
 * <ダメージTP最低: 5>
 * 　ダメージTP量の最低値が 5 になる
 * ※設定が複数ある場合、最大値が適用される
 *
 *
 * 【機能4】消費TP
 * 　スキルの消費TPを 100 を超えて設定できる
 * スキルのメモ欄に
 * <消費TP: 200>
 * 　スキルの消費TPが 200 になる
 * 
 * 
 * 【機能5】メモ欄でHP/MP/TPダメージ
 * スキル、アイテムのメモ欄に
 * <HPダメージ: 5~10>
 * 　5～10 のHPダメージ
 * <MPダメージ: 5~10>
 * 　5～10 のMPダメージ
 * <TPダメージ: 5~10>
 * 　5～10 のTPダメージ
 * <TPダメージ: a.atk * 0.5>
 * 　行動者の 攻撃力 * 0.5 のTPダメージ
 * <TPダメージ: b.maxTp() * 0.5>
 * 　受け手の 最大TP * 0.5 のTPダメージ
 * 
 * 
 * 【機能6】メモ欄でHP/MP/TP変動
 *  (ダメージと違って効果値が固定。クリティカルや属性の影響がない)
 * スキル、アイテムのメモ欄に
 * <HP変動: -5~-10>
 * 　HPが 5~10 回復
 * <MP変動: -5~-10>
 * 　MPが 5~10 回復
 * <TP変動: -5~-10>
 * 　TPが 5~10 回復
 * <TP変動: a.atk * -0.5>
 * 　TPが行動者の 攻撃力 * 0.5 回復
 * <TP変動: b.maxTp() * -0.5>
 * 　TPが受け手の 最大TP * 0.5 回復
 * 
 * 
 * 【機能7】メモ欄で自分のHP/MP/TP変動
 * スキル、アイテムのメモ欄に
 * <自分HP変動: -5~-10>
 * 　自分のHPが 5~10 回復
 * <自分MP変動: -5~-10>
 * 　自分のMPが 5~10 回復
 * <自分TP変動: -5~-10>
 * 　自分のTPが 5~10 回復
 * <自分TP変動: a.atk * -0.5>
 * 　自分のTPが行動者の 攻撃力 * 0.5 回復
 * <自分TP変動: b.maxTp() * -0.5>
 * 　自分のTPが受け手の 最大TP * 0.5 回復
 * 
 * 
 * 【機能8】メモ欄でMP/TPダメージ率
 * スキル、アイテムのメモ欄に
 * <MPダメージ率: 1.5>
 * 　受けるMPダメージが 1.5倍
 * <TPダメージ率: 1.5>
 * 　受けるTPダメージが 1.5倍
 * <MTPダメージ率: 1.5>
 * 　受けるMPダメージとTPダメージが 1.5倍
 * 
 * 
 * 【機能9】メモ欄で与MP/TPダメージ率
 * スキル、アイテムのメモ欄に
 * <与MPダメージ率: 1.5>
 * 　与えるMPダメージが 1.5倍
 * <与TPダメージ率: 1.5>
 * 　与えるTPダメージが 1.5倍
 * <与MTPダメージ率: 1.5>
 * 　与えるMPダメージとTPダメージが 1.5倍
 *
 *
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 *
 *
 *
 * Extend TP. The following items can be freely set
 * ◎ Maximum TP
 * ◎ Initial TP
 * ◎ Damage TP Charge Amount
 * ◎ Consumed TP
 * ◎ Customize TP Movement
 * ◎ Convert MP Movement to TP
 * ◎ HP/MP/TP Damage by Note Tags
 * ◎ MP/TP Recovery Based on Luck
 * 
 * 
 * ● How to Use ●
 *
 * [Function 1] Maximum TP
 *   Standard is 100. can be set to any value
 *
 * ● Set Maximum TP by Note Tags
 * 　In the memo field of actors, occupations, skills, items, equipment,
 *   enemy characters, and states
 * <maxTp: 200>
 *   Set maximum TP to 200
 * ※ If there are multiple settings, the maximum value is applied.
 *
 *
 * [Function 2] Initial TP
 *   The standard is 0-25. can be set to any value
 *   If you write like 25~50, it will be a random value between 25~50
 *
 * ● Set Initial TP by Bote Tags
 * 　In the memo field of actors, occupations, skills, items, equipment,
 *   enemy characters, and states
 * <initTp: 50>
 *   TP at the start of battle is 50% of maximum TP
 * <initTp: 25~50>
 *   TP at the start of battle will be a random value between 25 and 50
 * ※ If there are multiple settings, the maximum value is applied.
 * <initTpAdd: 10>
 *   Adds 10% to the base initial TP
 * ※ If there are multiple settings, they are all summed.
 * ● You can also set the initial MP in the same way
 * <initMp: 50>
 * MP at the start of battle will be M0% of maximum TP
 *
 *
 * [Function 3] Damage TP Charge Amount
 *   Standard is damage / maximum HP (decimal point rounded down).
 *   Can be set to any formula
 *
 * ● Damage TP custom
 *   Describe the TP charge amount with a js expression
 *   25 * d / php* tcr etc.
 *
 * ● Damage TP fixed value
 * 　Try to charge TP for a fixed amount
 *   If 5, increase by 5
 *
 * ● Minimum Damage TP
 *   Set the minimum TP charge amount
 *   If 　5, 5 will rise even if the amount of increase is less than 5
 *
 * ※ Priority is his custom>fixed value>lowest value
 *
 * ● Set Damage TP Charge Amount by Note Tags
 * 　In the memo field of actors, occupations, skills, items, equipment,
 *   enemy characters, and states
 * <damageTpCustom: 25 * d / php* tcr>
 *   Damage TP formula becomes 25 * d / php * tcr
 *   This formula is designed so that the less HP you have,
 *   the more TP you accumulate.
 * <damageTpFix: 5>
 * 　Damage TP becomes a fixed value of 5
 * <damageTpMin: 5>
 * 　The minimum damage TP amount will be 5
 * ※ If there are multiple settings, the maximum value is applied.
 *
 *
 * [Function 4] Consumed TP
 * 　Skill consumption TP can be set over 100
 *   In the memo field of the skill
 * <tpCost: 200>
 * 　Skill consumption TP becomes 200
 * 
 * 
 * [Function 5] HP/MP/TP Damage by Note Tags
 * In the skill or item note box:
 * <hpDamage: 5~10>
 *   Deals 5 to 10 HP damage
 * <mpDamage: 5~10>
 *   Deals 5 to 10 MP damage
 * <tpDamage: 5~10>
 *   Deals 5 to 10 TP damage
 * <tpDamage: a.atk * 0.5>
 *   Deals TP damage equal to the user's ATK * 0.5
 * <tpDamage: b.maxTp() * 0.5>
 *   Deals TP damage equal to the target's max TP * 0.5
 * 
 * 
 * [Function 6] HP/MP/TP Change by Note Tags
 * (Unlike damage, 
 *  this applies a fixed value without critical or element influence)
 * In the skill or item note box:
 * <hpChange: -5~-10>
 *   Restores 5 to 10 HP
 * <mpChange: -5~-10>
 *   Restores 5 to 10 MP
 * <tpChange: -5~-10>
 *   Restores 5 to 10 TP
 * <tpChange: a.atk * -0.5>
 *   Restores TP equal to the user's ATK * 0.5
 * <tpChange: b.maxTp() * -0.5>
 *   Restores TP equal to the target's max TP * 0.5
 * 
 * 
 * [Function 7] Self HP/MP/TP Change by Note Tags 
 * In the note box of a skill or item:
 * <hpChangeSelf: -5~-10>
 *   Restores 5 to 10 HP to the user
 * <mpChnageSelf: -5~-10>
 *   Restores 5 to 10 MP to the user
 * <tpChangeSelf: -5~-10>
 *   Restores 5 to 10 TP to the user
 * <tpChangeSelf: a.atk * -0.5>
 *   Restores TP equal to the user's ATK * 0.5
 * <tpChangeSelf: b.maxTp() * -0.5>
 *   Restores TP equal to the target's max TP * 0.5
 * 
 * 
 * [Function 8] MP/TP Damage Rate Modifiers by Note Tags
 * In the skill or item note box:
 * <mpDamageRate: 1.5>
 *   Increases MP damage received by 1.5x
 * <tpDamageRate: 1.5>
 *   Increases TP damage received by 1.5x
 * <mtpDamageRate: 1.5>
 *   Increases both MP and TP damage received by 1.5x
 * 
 * 
 * [Feature 9] MP/TP Damage Given Rate Modifiers by Note Tags
 * In the skill or item note box:
 * <mpDamageRateGive: 1.5>
 *   Increases MP damage dealt by 1.5x
 * <tpDamageRateGive: 1.5>
 *   Increases TP damage dealt by 1.5x
 * <mtpDamageRateGive: 1.5>
 *   Increases both MP and TP damage dealt by 1.5x
 *
 *
 * ● Terms of Use ●
 * Feel free to use it under the MIT license.
 * 
 * 
 * 
 * @param 最大TP
 * @desc maxTp TP最大値。基本 100
 * @default 100
 *
 * @param 初期MP
 * @desc initMp MPにTP同様の初期値を設定。50 なら最大TPの 50%。5~10 で 5〜10 のランダムになる
 * 
 * @param 初期TP
 * @desc initTp TP初期値。50 なら最大TPの 50%。5~10 で 5〜10 のランダムになる。基本 0~25
 * @default 0~25
 * 
 * @param ダメージTP
 * 
 * @param ダメージTPカスタム
 * @parent ダメージTP
 * @type multiline_string
 * @desc damageTpCustom ダメージTPチャージ量をjs式で記述。a:行動者 b:受け手 v:変数 d:ダメージ量 php:ダメージ前の受け手HP tcr:TPチャージ率
 *
 * @param ダメージTP固定値
 * @parent ダメージTP
 * @desc damageTpFix ダメージTPチャージ量の固定値
 *
 * @param ダメージTP最低値
 * @parent ダメージTP
 * @desc damageTpMin ダメージTPチャージ量の最低値
 * 
 * @param TPチャージ1回だけ
 * @parent ダメージTP
 * @desc tpChargeOnlyOnce 攻撃が複数ヒットしてもダメージTPチャージを1回分しかしないようにする
 * @type boolean
 * @default false
 * 
 * @param TPチャージ無効
 * @parent ダメージTP
 * @desc noTpCharge ダメージTPチャージを無効化する
 * @type boolean
 * @default false
 * 
 * @param TP動作/バトル
 * 
 * @param 最大TP効果
 * @parent TP動作/バトル
 * @desc maxTpEffect TP回復量が最大TPに連動するようにする。最大TPが 150 なら 100 の場合の 1.5倍 回復
 * @type boolean
 * @default false
 * 
 * @param 戦闘不能時にTP0
 * @parent TP動作/バトル
 * @desc tp_0_onDeath 戦闘不能時にTPを 0 にするようにする
 * @type boolean
 * @default false
 * 
 * @param TP動作/バトル外
 * 
 * @param TPも全回復
 * @parent TP動作/バトル外
 * @desc tpRecoverAll 全回復時にTPも全回復する
 * @type boolean
 * @default false
 * 
 * @param 常にTP表示
 * @parent TP動作/バトル外
 * @desc showTpAlways メニュー画面でTP持ち越しでなくとも常にTP表示する
 * @type boolean
 * @default false
 * 
 * @param MP動作のTP化
 * 
 * @param MPチャージ
 * @parent MP動作のTP化
 * @desc mpCharge MPもTP同様にチャージされるようにする。チャージ量はTPと同じ
 * @type boolean
 * @default false
 * 
 * @param 最大MP効果
 * @parent MP動作のTP化
 * @desc maxMpEffect MP回復量が最大MPに連動するようにする。最大MPが 150 なら 100 の場合の 1.5倍 回復
 * @type boolean
 * @default false
 * 
 * @param 戦闘不能時にMP0
 * @parent MP動作のTP化
 * @desc mp_0_onDeath 戦闘不能時にMPを 0 にするようにする
 * @type boolean
 * @default false
 * 
 * @param MP/TPダメージ
 * 
 * @param クリティカル倍率
 * @parent MP/TPダメージ
 * @desc criticalRate クリティカルヒットした時にMP/TPダメージにかける倍率。2 なら 2倍のダメージ
 * @default 2
 * 
 * @param 弱点倍率
 * @parent MP/TPダメージ
 * @desc weekRate 弱点を突いた時にMP/TPダメージにかける倍率。2 なら 2倍のダメージ
 * @default 2
 * 
 * @param 運の活用
 * 
 * @param 運でMP回復
 * @parent 運の活用
 * @desc mpRecoveryByLuck 運の能力値に応じて行動選択前にMPを回復する
 * @type boolean
 * @default true
 * 
 * @param └MP回復量
 * @parent 運の活用
 * @desc mpRecoveryVol js式で記述。a:回復バトラー a.luk:回復バトラーの運 avLuk:運の平均値
 * 
 * @param 運でTP回復
 * @parent 運の活用
 * @desc tpRecoveryByLuck 運の能力値に応じて行動選択前にTPを回復する
 * @type boolean
 * @default true
 * 
 * @param └TP回復量
 * @parent 運の活用
 * @desc tpRecoveryVol js式で記述。a:回復バトラー a.luk:回復バトラーの運 avLuk:運の平均値
 */
 
 
 
(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.split("/").pop().split("?")[0].replace(/\.js$/, "");



    //==================================================
    //--  公開メソッド
    //==================================================

    //- HPダメージの取得(公開)
    Game_Temp.prototype.getHpDamageKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getHpDamage(...args);
    };

    //- HP変動の取得(公開)
    Game_Temp.prototype.getHpChangeKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getHpChange(...args);
    };

    //- 自分HP変動の取得(公開)
    Game_Temp.prototype.getHpChangeSelfKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getHpChangeSelf(...args);
    };


    //- MPダメージの取得(公開)
    Game_Temp.prototype.getMpDamageKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getMpDamage(...args);
    };

    //- MP変動の取得(公開)
    Game_Temp.prototype.getMpChangeKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getMpChange(...args);
    };

    //- 自分MP変動の取得(公開)
    Game_Temp.prototype.getMpChangeSelfKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getMpChangeSelf(...args);
    };


    //- TPダメージの取得(公開)
    Game_Temp.prototype.getTpDamageKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getTpDamage(...args);
    };

    //- TP変動の取得(公開)
    Game_Temp.prototype.getTpChangeKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getTpChange(...args);
    };

    //- 自分TP変動の取得(公開)
    Game_Temp.prototype.getTpChangeSelfKeTpcs = function(...args) {
        // カットインマネージャー/実行中か
        return getTpChangeSelf(...args);
    };



    //==================================================
    //--  他プラグインとの連携メソッド
    //==================================================

    //- 収束効果の適用 - スキルマスタリー
    function applyConvergence(action, target) {
        if (!$gameTemp.applyConvergenceKe) { return 1; };
        return $gameTemp.applyConvergenceKe(action, target);
    };

    //- 無限TPの取得 - パラメータ限界突破
    function getTpInfinity(value) {
        if (!$gameTemp.getTpInfinityKe) { return false; };
        return $gameTemp.getTpInfinityKe(value);
    };

    //- 無限状態か - パラメータ限界突破
    function isInfinity(battler, hpType) {
        if (!$gameTemp.isInfinityKe) { return false; };
        return $gameTemp.isInfinityKe(battler, hpType);
    };

    //- 装備の最大TP - 装備スロットカスタム
    function equipMaxTp(actor) {
        if (!actor._actorId || !$gameTemp.equipMaxTpKe) { return 0; }
        return $gameTemp.equipMaxTpKe(actor);
    };



    //==================================================
    //--  パラメータ受け取り
    //==================================================
    
    //- 真偽化
    function toBoolean(str) {
        if (!str) { return false; }
        const str2 = str.toString().toLowerCase();
        if (str2 == "true" || str2 == "on") { return true; }
        if (str2 == "false" || str2 == "off") { return false; }
        return Number(str);
    };

    let parameters = PluginManager.parameters(pluginName);
    
    const keke_maxTp = parameters["最大TP"];
    const keke_initTp = parameters["初期TP"];
    const keke_initMp = parameters["初期MP"];

    //- ダメージTP
    const keke_damageTpCustom = parameters["ダメージTPカスタム"];
    const keke_damageTpFix = parameters["ダメージTP固定値"];
    const keke_damageTpMin = parameters["ダメージTP最低値"];
    const keke_tpChargeOnlyOnce = toBoolean(parameters["TPチャージ1回だけ"]);
    const keke_noTpCharge = toBoolean(parameters["TPチャージ無効"]);

    //- TP動作(バトル)
    const keke_maxTpEffect = toBoolean(parameters["最大TP効果"]);
    const keke_tp_0_onDeath = toBoolean(parameters["戦闘不能時にTP0"]);
    

    //- TP動作(バトル外)
    const keke_tpRecoverAll = toBoolean(parameters["TPも全回復"]);
    const keke_showTpAlways = toBoolean(parameters["常にTP表示"]);

    //- MP動作
    const keke_mpCharge = toBoolean(parameters["MPチャージ"]);
    const keke_maxMpEffect = toBoolean(parameters["最大MP効果"]);
    const keke_mp_0_onDeath = toBoolean(parameters["戦闘不能時にMP0"]);

    //- TPダメージ 
    const keke_criticalRate = Number(parameters["クリティカル倍率"]);
    const keke_weekRate = Number(parameters["弱点倍率"]);

    //- 運の活用
    const keke_mpRecoveryByLuck = toBoolean(parameters["運でMP回復"]);
    const keke_mpRecoveryVol = parameters["└MP回復量"];
    const keke_tpRecoveryByLuck = toBoolean(parameters["運でTP回復"]);
    const keke_tpRecoveryVol =parameters ["└TP回復量"];

    parameters = null;
    
    
    
    //==================================================
    //-- 最大TP/初期TP
    //==================================================
    
    //- ゲーム・バトラーベース/最大TP(処理追加)
    const _Game_BattlerBase_maxTp = Game_BattlerBase.prototype.maxTp;
    Game_BattlerBase.prototype.maxTp = function() {
        let val = keke_maxTp;
        const metas = bundleAllMeta_array(this, ["最大TP", "maxTp"]);
        val = metas.length ? arrayMax(metas) : val;
        if (val) {
            return getTpInfinity(val) || (Number(val) + equipMaxTp(this));
        }

        return _Game_BattlerBase_maxTp.apply(this) + equipMaxTp(this);
    };
    
    
    //- ゲーム・バトラーベース/初期TP(処理追加)
    const _Game_Battler_initTp = Game_Battler.prototype.initTp;
    Game_Battler.prototype.initTp = function() {
        // 初期MP
        initMp(this);
        // 初期TP
        if (initTp(this)) { return; };

        _Game_Battler_initTp.apply(this);
    };

    //- 初期TP
    function initTp(battler) {
        // 無限状態なら満タン
        if (isInfinity(battler, "tp")) { battler._tp = battler.maxTp();  return true; }
        let val = keke_initTp;
        const metas = bundleAllMeta_array(battler, ["初期TP", "initTp"]);
        val = metas.length ? arrayMax(metas) : val;
        
        // 初期TP加算の取得（複数ある場合は合計）
        const addMetas = bundleAllMeta_array(battler, ["初期TP加算", "initTpAdd"]);
        let addVal = 0;
        if (addMetas.length) {
            addVal = addMetas.reduce((acc, cur) => acc + betweenRandom(cur), 0);
        }
        
        if (val || addVal) {
            // 二点間ランダム
            val = betweenRandom(val || 0);
            // 加算値を追加
            val = Number(val) + addVal;
            // 最大TPに対する割合化
            const valRate = Math.floor(battler.maxTp() * val / 100)
            battler.setTp(valRate);
            return true;
        }
        return false;
    };



    //==================================================
    //-- ダメージTP
    //==================================================

    // ダメージ量
    let Damage = null;
    // ダメージ前のHP
    let PreHp = null;
    
    //- ゲームバトラー/ダメージ時の処理(処理追加)
    const _Game_Battler_onDamage = Game_Battler.prototype.onDamage;
    Game_Battler.prototype.onDamage = function(value) {
        // ダメージ量を保存
        Damage = value;

        _Game_Battler_onDamage.apply(this, arguments);

        Damage = null;
    };

    //- ゲームアクション/HPダメージの実行(処理追加)
    const _Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        // ダメージ前のHPを保存
        PreHp = target.hp || 1;

        _Game_Action_executeHpDamage.apply(this, arguments);

        PreHp = null;
    };
    
    //- ゲームバトラー/ダメージTPチャージ(処理追加)
    const _Game_Battler_chargeTpByDamage = Game_Battler.prototype.chargeTpByDamage;
    Game_Battler.prototype.chargeTpByDamage = function(dr) {
        // TPチャージ無効
        if (keke_noTpCharge) { return; }
        // カスタム
        if (keke_damageTpCustom) {
            let metas = bundleAllMeta_array(this, ["ダメージTPカスタム", "damageTpCustom"]);
            const str = metas.length ? metas[metas.length - 1] : keke_damageTpCustom;
            const result = Math.floor(newFunc_battler(str, BattleManager._subject, this));
            this.gainSilentTp(result);
            return result;
        }
        // 固定値
        let metas = bundleAllMeta_array(this, ["ダメージTP固定", "damageTpFix"]);
        const fix = metas.length ? arrayMax(metas) : keke_damageTpFix;
        if (fix) {
            this.gainSilentTp(Number(fix) * this.tcr);
            return;
        }
        // 最低値
        metas = bundleAllMeta_array(this, ["ダメージTP最低", "damageTpMin"]);
        const min = metas.length ? arrayMax(metas) : keke_damageTpMin;
        if (min) {
            const result = Math.floor(50 * dr * this.tcr);
            this.gainSilentTp(Math.max(result, Number(min)));
            return;
        }

        _Game_Battler_chargeTpByDamage.apply(this, arguments);
    };


    //- ゲームアクション/行動使用者効果の適用(処理追加)
    const _Game_Action_applyItemUserEffect = Game_Action.prototype.applyItemUserEffect;
    Game_Action.prototype.applyItemUserEffect = function(/*target*/) {
        // TPチャージ1回だけ(連撃時にTPチャージを1回だけにする)
        if (this.subject()._tpChargeOnlyOnceKe) { return; }

        const item = this.item();
        const tpGain = item.tpGain;
        item.tpGain = 0;
        _Game_Action_applyItemUserEffect.apply(this, arguments);
        item.tpGain = tpGain;

        // TPチャージ1回だけフラグをオン
        if (keke_tpChargeOnlyOnce) {
            this.subject()._tpChargeOnlyOnceKe = true;
        }
    };

    const _Game_Action_applyForTpGain = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        if (!this._tpGainAppliedKe) {
            const tpGain = this.item().tpGain;
            if (tpGain) {
                this.subject().gainSilentTp(tpGain);
            }
            this._tpGainAppliedKe = true;
        }
        _Game_Action_applyForTpGain.apply(this, arguments);
    };

    //- ゲームバトラー/全アクション終了時の処理(処理追加)
    const _Game_Battler_onAllActionsEnd = Game_Battler.prototype.onAllActionsEnd;
    Game_Battler.prototype.onAllActionsEnd = function() {
        _Game_Battler_onAllActionsEnd.apply(this);

        // TPチャージ1回だけフラグをオフ
        this._tpChargeOnlyOnceKe = null;
    };



    //==================================================
    //-- TP動作(バトル)
    //==================================================

    //- ゲームバトラー/TP増減(処理追加)
    const _Game_Battler_gainTp = Game_Battler.prototype.gainTp;
    Game_Battler.prototype.gainTp = function(value) {
        // 最大TP効果(最大TPに応じてTP増減量を増やす)
        if (keke_maxTpEffect) {
            value = Math.floor(value * this.maxTp() / 100);
        }

        _Game_Battler_gainTp.call(this, value);
    };

    //- ゲームバトラー/裏でのTP増減(処理追加)
    const _Game_Battler_gainSilentTp = Game_Battler.prototype.gainSilentTp;
    Game_Battler.prototype.gainSilentTp = function(value) {
        // 最大TP効果(最大TPに応じてTP増減量を増やす)
        let valueEx = null;
        if (keke_maxTpEffect) {
            valueEx = Math.floor(value * this.maxTp() / 100);
        }

        _Game_Battler_gainSilentTp.call(this, valueEx || value);

        // MPチャージ
        mpCharge(this, value);
    };


    //- ゲーム・バトラーベース/スキルのTPコスト(処理追加)
    const _Game_BattlerBase_skillTpCost = Game_BattlerBase.prototype.skillTpCost;
    Game_BattlerBase.prototype.skillTpCost = function(skill) {
        // メモ欄のTPコストを適用
        const meta = skill.meta["消費TP"] || skill.meta["tpCost"];
        if (meta) {
            return Number(meta);
        }

        return _Game_BattlerBase_skillTpCost.apply(this, arguments);
    };


    //- ゲーム・バトラーベース/戦闘不能(処理追加)
    const _Game_BattlerBase_die = Game_BattlerBase.prototype.die;
    Game_BattlerBase.prototype.die = function() {
        _Game_BattlerBase_die.apply(this);

        // 戦闘不能時にTP0
        if (keke_tp_0_onDeath) {
            setTimeout(tp_0, 0, this);
        }
        // 戦闘不能時にMP0
        if (keke_mp_0_onDeath) {
            setTimeout(mp_0, 0, this);
        }
    };

    //- TP0
    function tp_0(battler) {
        if (!battler) { return; }
        battler._tp = 0;
    };

    //- MP0
    function mp_0(battler) {
        if (!battler) { return; }
        battler._mp = 0;
    };



    //==================================================
    //-- TP動作(バトル外)
    //==================================================

    //- ゲーム・バトラーベース/全回復(処理追加)
    const _Game_BattlerBase_recoverAll = Game_BattlerBase.prototype.recoverAll;
    Game_BattlerBase.prototype.recoverAll = function() {
        _Game_BattlerBase_recoverAll.apply(this);

        // 全回復時にTPも全回復
        if (keke_tpRecoverAll) {
            this._tp = this.maxTp();
        }
    };


    //- スブライトゲージ/有効か(処理追加)
    const _Sprite_Gauge_isValid = Sprite_Gauge.prototype.isValid;
    Sprite_Gauge.prototype.isValid = function() {
        // 常にTP表示
        if (this._battler && this._statusType == "tp" && keke_showTpAlways) {
            return true;
        }

        return _Sprite_Gauge_isValid.apply(this);
    };



    //==================================================
    //--  MP動作のTP化
    //==================================================

    //- 初期MP
    function initMp(battler) {
        if (!keke_initMp) { return; }
        // 無限状態なら満タン
        if (isInfinity(battler, "mp")) { battler._mp = battler.mmp;  return; }
        let val = keke_initMp;
        const metas = bundleAllMeta_array(battler, ["初期MP", "initMp"]);
        val = metas.length ? arrayMax(metas) : val;
        if (val) {
            // 二点間ランダム
            val = betweenRandom(val);
            // 最大MPに対する割合化
            const valRate = Math.floor(battler.mmp * Number(val) / 100)
            battler.setMp(valRate);
        }
    };


    //- MPチャージ
    function mpCharge(battler, value) {
        if (!keke_mpCharge) { return; }
        let valueEx = null;
        // 最大MP効果
        if (keke_maxMpEffect) {
            valueEx = Math.floor(value * battler.mmp / 100);
        }
        battler.setMp(battler.mp + (valueEx || value));
    };


    //- ゲームバトラー/MP増減(処理追加)
    const _Game_Battler_gainMp = Game_Battler.prototype.gainMp;
    Game_Battler.prototype.gainMp = function(value) {
        // 最大MP効果(最大MPに応じてMP増減量を増やす)
        if (keke_maxMpEffect) {
            value = Math.floor(value * this.mmp / 100);
        }

        _Game_Battler_gainMp.call(this, value);
    };



    //==================================================
    //-- メモ欄でHP/MP/TPダメージ
    //==================================================

    //- ゲームアクション/適用(処理追加)
    const _Game_Action_apply = Game_Action.prototype.apply
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.apply(this, arguments);

        const subject = this.subject();
        // TPダメージの処理
        processTpDamage(this, subject, target);
        // TP変動の処理
        processTpChange(this, subject, target);
        // MPダメージの処理
        processMpDamage(this, subject, target);
        // MP変動の処理
        processMpChange(this, subject, target);
        // HPダメージの処理
        processHpDamage(this, subject, target);
        // HP変動の処理
        processHpChange(this, subject, target);
    };


    //- HPダメージの処理
    function processHpDamage(action, subject, target) {
        if ((subject._actorId && target._actorId) || (subject._enemyId && target._enemyId)) { return; }
        const result = target.result();
        if (!result.isHit()) { return; }
        // メモ欄からHPダメージ量を取得
        const val = getHpDamage(subject, action, target);
        if (!val) { return; }

        // 受ける側のHPダメージ率を取得
        let rate = 1;
        metas = bundleAllMeta_array(target, ["HPダメージ率", "hpDamageRate"], action);
        if (metas.length) {
            rate *= metas.reduce((acc, cur) => acc * Number(cur) / 100, 1);
        }
        // 与える側のHPダメージ率を取得
        metas = bundleAllMeta_array(subject, ["与HPダメージ率", "hpDamageRateGive"], action);
        if (metas.length) {
            rate *= metas.reduce((acc, cur) => acc * Number(cur) / 100, 1);
        }

        // HPダメージを適用
        const damage = Math.ceil(val * rate * (result.critical ? keke_criticalRate : 1) * (target.isGuard() ? 1 / (2 * target.grd) : 1) * action.calcElementRate(target) * applyConvergence(action, target));
        target.gainHp(-damage);
    };

    //- HPダメージの取得
    function getHpDamage(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["HPダメージ", "hpDamage"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };


    //- HP変動の処理
    function processHpChange(action, subject, target) {
        const result = target.result();
        if (!result.isHit()) { return; }
        // メモ欄からHP変動量を取得
        let val = getHpChange(action.subject(), action, target);
        if (val) {
            // HP変動を適用
            target.gainHp(Math.ceil(val));
        }
        // メモ欄から自分HP変動量を取得
        val = getHpChangeSelf(action.subject(), action, target);
        if (val) {
            // 自分HP変動を適用
            subject.gainHp(Math.ceil(val));
        }
    };

    //- HP変動の取得
    function getHpChange(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["HP変動", "hpChange"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };

    //- 自分HP変動の取得
    function getHpChangeSelf(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["自分HP変動", "hpChangeSelf"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };


    //- MPダメージの処理
    function processMpDamage(action, subject, target) {
        if ((subject._actorId && target._actorId) || (subject._enemyId && target._enemyId)) { return; }
        const result = target.result();
        if (!result.isHit()) { return; }
        // メモ欄からMPダメージ量を取得
        const val = getMpDamage(subject, action, target);
        if (!val) { return; }

        // 受ける側のMPダメージ率を取得
        let rate = 1;
        metas = bundleAllMeta_array(target, ["MPダメージ率", "MTPダメージ率", "mpDamageRate", "mtpDamageRate"], action);
        if (metas.length) {
            rate *= metas.reduce((acc, cur) => acc * Number(cur) / 100, 1);
        }
        // 与える側のMPダメージ率を取得
        metas = bundleAllMeta_array(subject, ["与MPダメージ率", "与MTPダメージ率", "mpDamageRateGive", "mtpDamageRateGive"], action);
        if (metas.length) {
            rate *= metas.reduce((acc, cur) => acc * Number(cur) / 100, 1);
        }

        // MPダメージを適用
        const damage = Math.ceil(val * rate * (result.critical ? keke_criticalRate : 1) * (target.isGuard() ? 1 / (2 * target.grd) : 1) * tpDamageElementRate(target, action) * applyConvergence(action, target));
        target.gainMp(-damage);
    };

    //- MPダメージの取得
    function getMpDamage(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["MPダメージ", "mpDamage"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };


    //- MP変動の処理
    function processMpChange(action, subject, target) {
        const result = target.result();
        if (!result.isHit()) { return; }
        // メモ欄からMP変動量を取得
        let val = getMpChange(action.subject(), action, target);
        if (val) {
            // MP変動を適用
            target.gainMp(Math.ceil(val));
        }
        // メモ欄から自分MP変動量を取得
        val = getMpChangeSelf(action.subject(), action, target);
        if (val) {
            // 自分MP変動を適用
            subject.gainMp(Math.ceil(val));
        }
    };

    //- MP変動の取得
    function getMpChange(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["MP変動", "mpChange"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };

    //- 自分MP変動の取得
    function getMpChangeSelf(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["自分MP変動", "自分MTP変動", "mpChangeSelf", "mtpChangeSelf"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };


    //- TPダメージの処理
    function processTpDamage(action, subject, target) {
        if ((subject._actorId && target._actorId) || (subject._enemyId && target._enemyId)) { return; }
        const result = target.result();
        if (!result.isHit()) { return; }
        // メモ欄からTPダメージ量を取得
        const val = getTpDamage(subject, action, target);
        if (!val) { return; }

        // 受ける側のMPダメージ率を取得
        let rate = 1;
        metas = bundleAllMeta_array(target, ["TPダメージ率", "MTPダメージ率", "tpDamageRate", "mtpDamageRate"], action);
        if (metas.length) {
            rate *= metas.reduce((acc, cur) => acc * Number(cur) / 100, 1);
        }
        // 与える側のTPダメージ率を取得
        metas = bundleAllMeta_array(subject, ["与TPダメージ率", "与MTPダメージ率", "tpDamageRateGive", "mtpDamageRateGive"], action);
        if (metas.length) {
            rate *= metas.reduce((acc, cur) => acc * Number(cur) / 100, 1);
        }

        // TPダメージを適用
        const damage = Math.ceil(val * rate * (result.critical ? keke_criticalRate : 1) * (target.isGuard() ? 1 / (2 * target.grd) : 1) * tpDamageElementRate(target, action) * applyConvergence(action, target));
        target.gainTp(-damage);
    };

    //- TPダメージの取得
    function getTpDamage(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["TPダメージ", "tpDamage"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };


    //- TP変動の処理
    function processTpChange(action, subject, target) {
        const result = target.result();
        if (!result.isHit()) { return; }
        // メモ欄からTP変動量を取得
        let val = getTpChange(action.subject(), action, target);
        if (val) {
            // TP変動を適用
            target.gainTp(Math.ceil(val));
        }
        // メモ欄から自分TP変動量を取得
        val = getTpChangeSelf(action.subject(), action, target);
        if (val) {
            // 自分TP変動を適用
            subject.gainTp(Math.ceil(val));
        }
    };

    //- TP変動の取得
    function getTpChange(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["TP変動", "tpChange"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };

    //- 自分TP変動の取得
    function getTpChangeSelf(subject, action, target) {
        let metas = bundleAllMeta_array(subject, ["自分TP変動", "自分MTP変動", "tpChangeSelf", "mtpChangeSelf"], action);
        if (!metas.length) { return 0; }
        return metas.reduce((acc, cur) => acc + betweenRandom(cur, 1, subject, target || subject), 0);
    };


    //- TPダメージ属性倍率
    function tpDamageElementRate(target, action) {
        const elementRate = action.calcElementRate(target);
        if (elementRate <= 1) { return elementRate; }
        if (keke_weekRate) { return keke_weekRate; }
        return elementRate; 
    };



    //==================================================
    //-- 運の活用
    //==================================================

    //- ゲームバトラー/TPBターンの開始
    const _Game_Battler_startTpbTurn = Game_Battler.prototype.startTpbTurn;
    Game_Battler.prototype.startTpbTurn = function() {
        // MPの回復
        recoveryMp(this);
        // TPの回復
        recoveryTp(this);

        _Game_Battler_startTpbTurn.apply(this);
    };

    //- MPの回復
    function recoveryMp(battler) {
        if (!keke_mpRecoveryByLuck) { return; }
        // 運を取得
        const luck = battler.luk;
        if (!luck) { return; }
        // 回復率とかけて回復量を算出
        const val = Math.round(betweenRandom(keke_mpRecoveryVol, 1, battler));  //Math.round(betweenRandom(keke_mpRecoveryRate, luck / 100)) || luck;
        // 回復を適用
        battler.gainMp(val);
    };

    //- TPの回復
    function recoveryTp(battler) {
        if (!keke_tpRecoveryByLuck) { return; }
        // 運を取得
        const luck = battler.luk;
        if (!luck) { return; }
        // 回復率とかけて回復量を算出
        const val = Math.round(betweenRandom(keke_tpRecoveryVol, 1, battler));  //Math.round(betweenRandom(keke_tpRecoveryRate, luck / 100)) || luck;
        // 回復を適用
        battler.gainTp(val);
    };


    //- 運の平均値
    function averageLuck() {
        const members = [...$gameParty.battleMembers().filter(a => a.isAppeared()), ...$gameTroop.members().filter(e => e.isAppeared())];
        const totalLuk = members.reduce((acc, cur) => acc + cur.luk, 0);
        return Math.round(totalLuk / members.length);
    };


    
    //==================================================
    //--  計算基本 /ベーシック
    //==================================================
    
    //- 二点間ランダム
    function betweenRandom(val, times, subject, target) {
        if (!val) { return newFunc(val, subject, target); }
        const valStr = val.toString();
        let valStrs = valStr.split("~");
        if (valStrs.length >= 2) {
            const vals = valStrs.map(v => Math.round(newFunc(v, subject, target) * (times || 1)));
            vals.sort((a, b) => a - b);
            val = vals[0] + Math.random() * (vals[1] - vals[0]);
        }
        return newFunc(val, subject, target);
    };
    
    //- 配列最大値
    function arrayMax(array) {
        let max = null;
        let maxIndex = null;
        array.forEach((v, i) => {
            const vs = v.split("~");
            if (vs.length >= 2) {
                v = (Number(vs[0]) + Number(vs[1])) / 2;
            }
            v = Number(v);
            if (!max || v > max) {
                max = v;
                maxIndex = i;
            }
        });
        return array[maxIndex];
    };



    //==================================================
    //--  動的関数 /ベーシック
    //==================================================

    let Funcs = {};

    //- ニューファンク-バトラー
    function newFunc(str, subject, target) {
        const a = subject;
        const b = target;
        const v = $gameVariables._data;
        const tcr = b ? b.tcr : 1;
        const avLuk = averageLuck();
        if (!Funcs[str]) {
            Funcs[str] = new Function("a", "b", "v", "tcr", "avLuk", "return " + str);
        }
        return Funcs[str](a, b, v, tcr, avLuk);
    };
    
    
    
    //==================================================
    //--  メタ配列 /ベーシック
    //==================================================
     
    //- 全てのメタの合算-配列
    function bundleAllMeta_array(battler, words, action) {
        // イニット
        let data = null
        let array = [];
        // バトラー値
        data = battler.actorId ? battler.actor() : battler.enemy();
        if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        if (battler._actorId) {
            // 職業値
            data = battler.currentClass();
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
            // 装備値
            battler._equips.forEach(equip => {
                data = equip.object();
                if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
            });
            // パッシブスキル武器値（NUUN_PassiveSkill連携）
            if (typeof battler.passiveSkillObject === 'function') {
                const passiveWeapons = battler.passiveSkillObject();
                if (passiveWeapons && Array.isArray(passiveWeapons)) {
                    passiveWeapons.forEach(weapon => {
                        if (weapon && weapon.note) {
                            metaAll(weapon.note, words).forEach(e => array.push(e));
                        }
                    });
                }
            }
        }
        // ステート値
        battler._states.forEach(stateId => {
            data = $dataStates[stateId];
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        }, battler);
        // アクション値
        if (action) {
            data = action._item ? action.item() : action;
            if (data && data.note) { metaAll(data.note, words).forEach(e => array.push(e)); }
        }
        // スペースを削除
        array = array.map(e => e.replace(/\s/g, ""));
        // 空の要素は削除
        array = array.filter(e => e);
        return array;
    };
    
    //- 全取得メタ
    function metaAll(note, words, ratioIndex) {
        var result = [];
        words.forEach(word => {
            // 複数用と単体用の正規表現を作成
            var regText = '\<' + word + ':([^\>]*)\>';
            var regExp_g = new RegExp(regText, 'gi');
            var regExp = new RegExp(regText, 'i');
            // マッチ判定
            var matches = note.match(regExp_g);
            if (matches) {
                // 全てのマッチを処理
                matches.forEach(function(line) {
                    const match = line.match(regExp);
                    // 成功率として扱う引数の処理
                    const vals = match[1].replace(/\s/g, "").split(",");
                    const ratioIndexEx = ratioIndex - 1;
                    if (ratioIndex && vals[ratioIndexEx] && Math.randomInt(100) >= Number(vals[ratioIndexEx])) {
                        return;
                    }
                    result.push(match[1]);
                });
            }
        });
        return result;
    };
      
})();