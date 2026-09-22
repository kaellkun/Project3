//=============================================================================
// 成功率命中率回避率改変
// RIT_SucHitEva.js
// Copyright (c) 2020 ライト
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 成功・命中・回避の判定を仕様変更します
 * @author ライト
 *
 * @help
 *
 * デフォルト仕様の(成功・命中判定)⇒(回避判定)の２段階判定を無くし、
 * (成功・命中・回避)をまとめた１回の判定にします。
 *
 * ・追加成功率の設定(物理攻撃・魔法攻撃のみ)
 * スキルのメモ欄に<additionalSuccessRate:50>と記述すると、成功率が50加算されます。
 *
 * 最終的な命中率(%)は
 * ・物理攻撃
 * 成功率 + 追加成功率 + 命中補正 - 回避率
 *
 *   命中補正は使用者の命中率特徴から求めます。
 *   ・アクター/職業/敵キャラ本体に命中率の特徴がある場合
 *       命中補正 = 合計命中率 - 100   (例: 命中率95% → -5)
 *   ・本体に命中率の特徴がない場合
 *       命中補正 = 装備・ステートの命中率の合計   (例: 特徴なし → ±0)
 *
 * ・魔法攻撃
 * 成功率 + 追加成功率 - 魔法回避率
 *
 * ・必中攻撃
 * 成功率
 *
 * となります。
 *
 *
 * ■ライセンス表記
 * このプラグインは MIT ライセンスで配布されます。
 * ご自由にお使いください。
 * http://opensource.org/licenses/mit-license.php
 *
 */

 (() => {
   'use strict';

   const HIT_TRAIT = { code: Game_BattlerBase.TRAIT_XPARAM, dataId: 0 };

   function hasBaseHitTrait(battler) {
     const objects = battler.isActor()
       ? [battler.actor(), battler.currentClass()]
       : [battler.enemy()];
     return objects.some(obj => obj && obj.traits.some(t =>
       t.code === HIT_TRAIT.code && t.dataId === HIT_TRAIT.dataId));
   }

   //追加定義: 命中補正(小数)。本体に命中率がなければ装備・ステート分を加算補正として扱う
   Game_Action.prototype.hitCorrection = function() {
     const subject = this.subject();
     return hasBaseHitTrait(subject) ? subject.hit - 1 : subject.hit;
   };

   //追加定義: スキルの追加成功率(小数)
   Game_Action.prototype.additionalSuccessRate = function() {
     const meta = this.item().meta;
     return meta && meta.additionalSuccessRate ? Number(meta.additionalSuccessRate) * 0.01 : 0;
   };

   //上書き定義
   const _Game_Action_itemHit = Game_Action.prototype.itemHit;
   Game_Action.prototype.itemHit = function(/*target*/) {
     const tmp = _Game_Action_itemHit.apply(this, arguments);
     if(this.isCertainHit()){
       return this.item().successRate * 0.01;
     }else{
       return 1;
     }
   };

   //追加定義
   const _Game_Action_itemEva = Game_Action.prototype.itemEva;
   Game_Action.prototype.itemEva = function(target) {
     let result = _Game_Action_itemEva.apply(this, arguments);
     const successRate = this.item().successRate * 0.01;
     const add = this.additionalSuccessRate();
     if (this.isPhysical()) {
       result += 1 - successRate - add - this.hitCorrection();
     } else if (this.isMagical()) {
       result += 1 - successRate - add;
     }
     return result;
   };

 })();
