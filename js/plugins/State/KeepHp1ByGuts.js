//=============================================================================
// Plugin for RPG Maker MZ
// KeepHp1ByGuts.js
//=============================================================================
// [Update History]
// 2023.Sep.27 Ver1.0.0 First Release
// 2023.Oct.01 Ver1.1.0 Add function to check note descriptions
// 2023.Oct.10 Ver1.2.0 - Add Option: limit number of invoke guts.
//                      - Popup recover 1 when the an battler invokes guts.
//                      - It can set the % of invoke guts also to enemies.
// 2025.Jun.25 Ver1.3.0 Change the specification for states
// 2025.Jun.28 Ver1.3.1 Recoveing HP1 popup is selectable.

/*:
 * @target MZ
 * @plugindesc [Ver1.3.1]Actor may survive with 1 HP when one receives fatal damage.
 * @author Sasuke KANNAZUKI
 *
 * @param validAtHp1
 * @text Valid also HP 1?
 * @desc Whether to survive also when one's HP is 1.
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 *
 * @param gutsLimit
 * @text Limit times to invoke
 * @desc The max times to invoke guts for each actor in the battle. If it's -1, it is limitless.
 * @type number
 * @min -1
 * @default -1
 *
 * @param gutsRateFormula
 * @text Actor's Invoke Rate Formula
 * @desc Percentage of survive by guts. a:target, v[n]:variable
 * @type multiline_string
 * @default a.luk / 10
 *
 * @param performGutsText
 * @text Text For When Invokes Survive
 * @desc Display on battle log when it invokes survive. %1:one's name %2:the text "HP"
 * @type string
 * @default %1 narrowly survived with 1 HP!
 *
 * @param doesDisplayGuts
 * @text Does Display HP1 Popup?
 * @desc Does display HP1 popup when inovokes guts?
 * @type boolean
 * @default true
 *
 *
 * @help This plugin does not provide plugin commands.
 * This plugin runs under RPG Maker MZ.
 *
 * [Summary]
 * This plugin enables if an actor receives fatal damage,
 * the actor has a chance of surviving with 1 HP.
 *
 * [Advanced Option 1] (Since Ver1.1.0)
 * By writing following description to note(*1)
 * it can increase/decrease chance of surviving with 1 HP.
 * (*1 : the note of actor, class, weapon, armor, and/or state)
 *
 * <GutsFormula:[formula]>
 * [formula] : the formula that evaluates by eval().
 * where "a" is target, "v[n]" is the value of game variable #n
 *
 * Ex:
 * <GutsFormula:15>
 * Chance will increase by 15%.
 *
 * <GutsFormula:a.luk * 2>
 * Chance will increase by % of targets luk times 2
 *
 * <GutsFormula:if ($gameSwitches.value(12)) {v[15]} else {20}>
 * Chance will increase by when Switch #12 is ON, the value of variable #15(%),
 * otherwise the chance will increase by 20%.
 *
 * If you set chance only by note, set invoke rate of plugin parameter 0.
 *
 * [Advanced Option 2] (Since Ver1.2.0)
 * If you write any enemy's note like <GutsFormula:15>,
 * The enemy will invoke guts by specified probability.
 * And enemies' states also affects the probability of invoke guts.
 * Note that enemies ignore the parameter "Actor's Invoke Rate Formula".
 *
 * [Advanced Option 3] (Since Ver1.3.0)
 * When one is added the state like this, max limit becomes the value
 * set at GutsLimit parameter.
 * Even if the state is expired, max limit becomes GutsLimit by adding
 * state again.
 *
 * [License]
 * this plugin is released under MIT license.
 * http://opensource.org/licenses/mit-license.php
 */

/*:ja
 * @target MZ
 * @plugindesc [Ver1.3.1]致命的ダメージを受けてもたまにHP1で踏み止まる
 * @author 神無月サスケ
 *
 * @param validAtHp1
 * @text 残りHP1でも発動？
 * @desc 
 * @type boolean
 * @on 発動する
 * @off 発動しない
 * @default true
 *
 * @param gutsLimit
 * @text 最大踏み止まり回数
 * @desc 1回の戦闘で、各アクターが何回まで踏み止まれるか。-1 を指定すると、無制限に。
 * @type number
 * @min -1
 * @default -1
 *
 * @param gutsRateFormula
 * @text アクター発動確率式
 * @desc 残りHP1で踏み止まる確率を％で返す数式。aは対象者に、v[n]はn番目の変数に
 * @type multiline_string
 * @default a.luk / 10
 *
 * @param performGutsText
 * @text 発動時メッセージ
 * @desc 残りHP1で踏み止まった際に表示する文字列。%1はアクター名、%2はHP(略)の名称に置き換え
 * @type string
 * @default %1は辛うじて%2 1 で踏み止まった！
 *
 * @param doesDisplayGuts
 * @text HP1回復表示？
 * @desc ガッツ発生の際、HP1回復をポップアップさせる？
 * @type boolean
 * @default true
 *
 * @help このプラグインには、プラグインコマンドはありません。
 * このプラグインは、RPGツクールMZに対応しています。
 *
 * ■概要
 * このプラグインは、任意のアクターが現在のHP以上のダメージを受けた際、
 * 指定された確率でHP 1での踏み止まりが発動します。
 *
 * ■拡張機能１(Ver1.1.0～)
 *
 * プラグインパラメータで指定した値からの、発動確率の増減が可能です。
 * 特徴のある項目(アクター、職業、武器、防具、ステート)のメモに、
 * 下記のように記述します。
 * 複数の項目に記述がある場合は、それらの値を合計した値になります。
 *
 * <GutsFormula:[数式]>
 * [数式] : eval関数で評価される数式です。
 * aは対象アクターに、v[n]はn番の変数の値に置き換えられます。
 * マイナスの数値も設定可能です。
 *
 * 例：
 * <GutsFormula:15>
 * 確率に15％がプラスされます。
 *
 * <GutsFormula:a.luk * 1.5>
 * 確率に対象アクターの運の1.5倍の値がプラスされます。
 *
 * <GutsFormula:if ($gameSwitches.value(12)) {v[15]} else {20}>
 * 12番のスイッチがONの時は、15番の変数の値、OFFの時は20%がプラスされます。
 *
 * 専らステートなどのメモで確率設定を行う場合、
 * プラグインパラメータ側の発動確率式を0にすると良いでしょう。
 *
 * ■拡張機能２(Ver1.2.0～)
 * 敵キャラのメモに <GutsFormula:15> のように書くことにより、
 * 敵キャラも確率で自動蘇生します。
 * なお、敵キャラには、パラメータの「アクター発動確率式」は加算されませんが
 * ステートが付与されている場合は、その確率も加算されます。
 *
 * ■拡張機能３(Ver1.3.0～)
 * メモが書かれたステートをかける時は、かけられた時点で
 * パラメータ「最大踏み止まり回数」まで、残り回数が追加されます。
 * 一旦、踏み止まり回数に達してステートが解除された場合でも、
 * 再びステートをかけられたら、また最大踏み止まり回数が適用されます。
 *
 * ■ライセンス表記
 * このプラグインは MIT ライセンスで配布されます。
 * ご自由にお使いください。
 * http://opensource.org/licenses/mit-license.php
 */

(() => {
  const pluginName = 'KeepHp1ByGuts';
  //
  // process parameters
  //
  const parameters = PluginManager.parameters(pluginName);
  const validAtHp1 = eval(parameters['validAtHp1'] || 'false');
  const gutsLimit = +parameters['gutsLimit'] || 0;
  const gutsRateFormula = parameters['gutsRateFormula'] || 'a.luk * 2';
  const performGutsText = parameters['performGutsText'] ||
    '%1 narrowly survived with 1 HP!';
  const doesDisplayGuts = eval(parameters['doesDisplayGuts'] || 'true');

  //
  // functions of parameters
  //
  const canInvokeGuts = battler => {
    return battler.hp > 1 || battler.hp === 1 && validAtHp1;
  };

  const calculateFormula = (battler, formula) => {
    try {
      const a = battler;
      const v = $gameVariables._data;
      return +eval(formula) || 0;
    } catch (e) {
      console.error("Error: Guts Formula is invalid!! " + formula);
      return 0;
    }
  };

  const chanceInNotes = battler => {
    let chance = 0;
    const objects = battler.traitObjects();
    for (object of objects) {
      const formula = object.meta.GutsFormula;
      if (formula && formula !== true) {
        chance += calculateFormula(battler, formula);
      }
    }
    return chance;
  };

  const doesSuccessGuts = battler => {
    let chance = 0;
    if (battler.isActor()) {
      chance += calculateFormula(battler, gutsRateFormula);
    }
    chance += chanceInNotes(battler);
    return Math.randomInt(100) < chance;
  };

  //
  // Set guts limit at beginning of the battle and so on
  //
  const _Scene_Battle_start = Scene_Battle.prototype.start;
  Scene_Battle.prototype.start = function() {
    _Scene_Battle_start.call(this);
    $gameParty.members().forEach(a => a.gutsLimit = gutsLimit);
    $gameTroop.members().forEach(e => e.gutsLimit = gutsLimit);
  };

  const _Game_Battler_addState = Game_Battler.prototype.addState;
  Game_Battler.prototype.addState = function(stateId) {
    _Game_Battler_addState.call(this, stateId);
    if ($dataStates[stateId].meta.GutsFormula) {
      this.gutsLimit = gutsLimit;
    }
  };

  //
  // Process damage
  //
  const reduceGutsLimit = battler => {
    if (battler.gutsLimit === 0) {
      return false;
    }
    if (battler.gutsLimit === 1) {
      // If it's affected by states, remove the states.
      const states = battler.states();
      for (state of states) {
        if (state.meta.GutsFormula) {
          battler.eraseState(state.id);
        }
      }
    }
    battler.gutsLimit--;
    return true;
  };

  const _Game_Battler_gainHp = Game_Battler.prototype.gainHp;
  Game_Battler.prototype.gainHp = function(value) {
    let originValue = null;
    let invoked = false;
    if (this.hp + value <= 0 && canInvokeGuts(this)) {
      if (doesSuccessGuts(this)) {
        invoked = reduceGutsLimit(this);
        originValue = value;
        if (invoked) {
          value = validAtHp1 && this.hp === 1 ? 0 : -Math.max(this.hp - 1, 0);
        }
      }
    }
    _Game_Battler_gainHp.call(this, value);
    if (originValue != null) {
      this._result.hpDamage = -originValue;
      this._result.invokeGuts = invoked;
    }
  };

  //
  // Display popup recover HP by 1
  //
  Window_BattleLog.prototype.popupGuts = function(target) {
    target.startGutsPopup();
    this.popupDamage(target);
  };

  Game_Battler.prototype.startGutsPopup = function() {
    const result = this._result;
    result.hpAffected = true;
    result.hpDamage = -1;
  };

  //
  // Display battle log
  //
  Game_Battler.prototype.didInvokeGuts = function() {
    return !!this._result.invokeGuts;
  };

  Game_Battler.prototype.resetInvokeGuts = function() {
    this._result.invokeGuts = null;
  };

  const _Window_BattleLog_displayDamage =
   Window_BattleLog.prototype.displayDamage;
  Window_BattleLog.prototype.displayDamage = function(target) {
    _Window_BattleLog_displayDamage.call(this, target);
    this.displayGuts(target);
  };

  Window_BattleLog.prototype.displayGuts = function(target) {
    if (target.didInvokeGuts()) {
      target.resetInvokeGuts();
      if (doesDisplayGuts) {
        this.push("wait");
        this.push("popupGuts", target);
      }
      const data = target.isActor() ? target.actor() : target.enemy();
      this.push("addText", performGutsText.format(
        data.name, TextManager.hpA)
      );
    }
  };

})();
