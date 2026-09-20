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
 * (命中率 - 回避率) + (成功率 + 追加成功率 - 100)
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
     const successRate = this.item().successRate;
     let add = 0;
     if(this.item().meta.additionalSuccessRate){
       add = Number(this.item().meta.additionalSuccessRate);
     }
     if (this.isPhysical()) {
       result += 2 - successRate * 0.01 - add * 0.01 - this.subject().hit;
     } else if (this.isMagical()) {
       result += 1 - successRate * 0.01 - add * 0.01;
     }
     return result;
   };

 })();
