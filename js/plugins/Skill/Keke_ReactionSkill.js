//=============================================================================
//  Keke_ReactionSkill - リアクションスキル
// バージョン: 1.9.9
//=============================================================================
// Copyright (c) 2022 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @target MZ
 * @plugindesc リアクションスキルを自在に作成
 * @author ケケー
 * @url https://kekeelabo.com
 * 
 * @help
 * 【ver.1.9.9】
 * リアクションスキルを自在に作成できる
 * あらゆるリアクションスキルを実現可能
 * リアクションスキルとは相手の行動に反応して発動するスキルのこと
 *
 * ● 特徴 ●
 *
 * ◎リアクションのタイミングを「攻撃前」「攻撃後」で選択可
 * ◎味方への攻撃に対してもリアクション発動できる
 * ◎複数のリアクションを一度に発動できる
 * ◎リアクションとしてアイテムも使用可能
 * ◎リアクション中のみ付与されるステートを設定可能
 * ◎リアクション時に好きなポップメッセージを表示できる
 * ◎発動率と発動条件をjs式で自由に設定できる
 * ◎その他リアクションに付随する様々な設定を完備
 *
 *
 * ● 使い方 ●
 *
 * 【手順1】リアクション登録
 * => プラグインパラメータ →リアクション登録
 * 　リアクションを自由に作成して登録する
 * サンプルが初期状態でいくつか入っているので参考に
 * ◎『実行スキル』『実行アイテム』が空の場合は基本的にリアクション発動しない
 *　が、例外はある
 * 　▼『ものまね』が true の場合は ものまね が実行される
 * 　▼『味方リアクション』『かばう』が true の場合は かばう のみが実行される
 *
 *
 * 【手順2】リアクションを適用
 * アクター、職業、装備、敵キャラ、ステート のメモ欄に
 * 
 * <リアクション: 切り払い>
 * 　リアクション『切り払い』が適用される
 * <リアクション: 切り払い カウンター>
 * 　リアクション『切り払い』と『カウンター』が適用される
 * <リアクション: 切り払い/50 カウンター/200>
 * 　リアクション『切り払い』と『カウンター』が適用される
 * 　『切り払い』は 基本発動率 × 50% の確率で、
 * 　『カウンター』は 基本発動率 × 200% の確率で発動
 *
 *
 * 【機能1】メモ欄からの自分のリアクション率補正
 * 　自分のリアクション発動率を変動させる
 * 　リアクションを発動しやすいキャラやスキル、ステート等を作成可能
 * 
 * アクター、職業、スキル、アイテム、装備、敵キャラ、ステート のメモ欄に
 *
 * <リアクション率: 50>
 *  自分のリアクション発動率を 50% にする
 * 
 * 
 * 【機能2】メモ欄からの相手リアクション率補正
 * 　攻撃側から相手のリアクション発動率を変動させる
 * 　リアクションを発動させづらいキャラやスキル、ステート等を作成可能
 * 
 * アクター、職業、スキル、アイテム、装備、敵キャラ、ステート のメモ欄に
 *
 * <相手リアクション率: 50>
 *  攻撃対象のリアクション発動率を 50% にする
 *
 *
 * 【補足】発動条件スクリプト/発動率スクリプトについて
 * 　発動率スクリプトは発動率に乗算される。発動率 × 発動率スクリプト = 最終発動率
 * 　また、スクリプトの中では特定の変数が使える。内容は以下
 * a
 * 　RA発動者。リアクションを発動するバトラーのクラス。Game_ActorかGame_Enemy
 * b
 * 　受け手。攻撃を受けたバトラーのクラス。Game_ActorかGame_Enemy
 * c
 * 　攻撃者。攻撃を仕掛けたバトラーのクラス。Game_ActorかGame_Enemy
 * act
 * 　攻撃スキル。攻撃者の使用したスキル/アイテムのデータオブジェクト
 * 　例)
 * 　act.id      スキルID
 * 　act.scope   攻撃範囲(1-単体 2-全体 3-ランダム)
 *   act.stypeId スキルタイプID。1～
 *   act.damage.elementId  属性ID
 *   act.damage.critical   クリティカルか
 *   act.damage.type       ダメージタイプ(1-HPダメージ 2-MPダメージ 等)
 * react
 * 　RAスキル。リアクションとして発動するスキル/アイテムのデータオブジェクト
 * elems
 * 　攻撃スキルの属性。配列になっている
 * 　(『Keke_ElementFUllCustom』プラグインで属性を増やせる)
 * 例)
 * act.stypeId == 2 && act.damage.type == 1
 * 　攻撃スキルのスキルタイプIDが2で、かつHPダメージ技の場合のみ発動
 * 
 * 
 * 【備考】サンプルについて
 * 『リアクション登録』には初期状態でサンプルリアクションが入っている
 * まずは「実行スキル」か「実行アイテム」に好きなものを入れること
 * 後はそのまま使うことができる。好みで改造してみるのも
 * ※サンプルのうち『ものまね』『かばう』は、
 *　実行スキルとアイテムが空のままでも機能する
 *　
 *
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 *
 *
 *
 * Freely create reaction skills. Any reaction skill can be realized
 * Reaction skills are skills that activate
 *   in response to the actions of the opponent.
 *
 * ● Features ●
 *
 * ◎You can select the reaction timing "before attack" or "after attack"
 * ◎ Reactions can also be triggered against attacks on allies.
 * ◎ Multiple reactions can be activated at once
 * ◎ Items can also be used as reactions
 * ◎ You can set the state that is given only during the reaction
 * ◎ You can display your favorite pop message when reacting
 * ◎ You can freely set the invoke rate and invoke conditions
 *   with js expressions
 * ◎ Complete with various settings associated with other reactions
 *
 *
 *
 * ● How to use ●
 *
 * [Step 1] Reaction registration
 * => Plugin parameter →Reaction registration
 *   Freely create and register reactions
 *   Some samples are included in the initial state, so please refer to them.
 * ◎Reactions are basically not triggered when "execution skill"
 *   and "execution item" are empty.
 *, but there are exceptions
 * ▼ If "impersonation" is true, he will be impersonated
 * ▼ If "friend reaction" and "cover" are true,
 *   only his cover will be executed.
 *
 *
 * [Step 2] Apply reaction
 * Actor, Class, Skill, Item, Equipment, Enemy Character, State
 *
 * <reaction: CutOff>
 *   Reaction "CutOff" is applied
 * <reaction: CutOff Counter>
 *   Reaction "CutOff" and "Counter" is applied
 * <Reaction: Cut off/50 Counter/200>
 *   Reaction "Cut off" and "Counter" are applied
 *   "Cut off" has a probability of base invoke rate x 50%,
 *   "Counter" is activated with a probability of base invoke rate x 200%
 *
 *
 * [Function 1] Correct your reaction rate from the memo column
 *   Vary your reaction invoke rate
 *   It is possible to create characters, skills, states,
 *   etc. that are easy to trigger reactions
 * 
 * Actor, Class, Skill, Item, Equipment, Enemy Character, State
 * 
 * <reactionRate: 50>
 *   Make your reaction invoke rate 50% of his
 *
 *
 * [Function 2] Compensation of other party's reaction rate
 *  from the memo column
 *   Vary the reaction invoke rate of the opponent from the attacking side
 *   It is possible to create characters, skills, states, etc.
 *   that are difficult to activate reactions
 * 
 * Actor, Class, Skill, Item, Equipment, Enemy Character, State
 *
 * <reactionRateOppo: 50>
 *   Makes the target's reaction invoke rate 50% of his
 * 
 * 
 * [Supplement] About invoke condition script/invoke rate script
 * invoke rate script is multiplied by thie invoke rate.
 * Specific variables can be used in the script. contents are as follows.
 * a
 *  RA activist. Butler class that activates reaction. Game_actor or game_enemy
 * b
 *  A bullet. Batler class attacked. Game_actor or game_enemy
 * c
 *  attacker. Batler class that launched an attack. Game_actor or game_enemy
 * act
 *   Attack skill. Skill/item data object used by the attacker
 *   example)
 *     Act.id skill ID
 *     Act.scope attack range (1-single 2-overall 3-random)
 *     Act.stypeid skill type ID. 1 ~
 *     Act.damage.elementid attribute ID
 *     Act.damage.clitical is it critical?
 *     Act.damage.type Damage type (1-HP Damage 2-MP Damage, etc.)
 * React
 *   RA skill. Skill/item data objects activated as a reaction
 * elems
 *   The elements of an attack skill. Stored as an array.
 *   (You can add more elements using the “Keke_ElementFullCustom” plugin.)
 * example)
 *   act.stypeId == 2 && act.damage.type == 1
 *   Activated only if the skill type ID of the attack skill is 2
 *    and it is an HP damage skill.
 * 
 * 
 * [Remarks] About samples
 * "Reaction registration" contains sample reactions in the initial state
 * First, put whatever you like in "execution skill" or "execution item"
 * After that, you can use it as it is. You can also modify it to your liking.
 * ※ Among the samples, "impersonation" and "cover" are
 *   Works even if execution skills and items are empty
 *　
 *
 *
 * ● Terms of Use ●
 * Feel free to use it under the MIT license.
 * 
 * 
 * 
 * @orderAfter Keke_MangaLikeView
 * 
 * 
 * 
 * @param リアクション登録
 * @desc reactionMaking リアクションを登録する。各メモ欄から <リアクション: アクション名> で呼び出せる
 * @type struct<reaction>[]
 * @default ["{\"アクション名\":\"切り払い\",\"実行スキル\":\"\",\"/実行アイテム\":\"\",\"/ものまね\":\"\",\"タイミング\":\"後\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"\",\"発動率\":\"30\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"100\",\"発動打ち止め\":\"\",\"味方リアクション\":\"true\",\"…味方発動率補正\":\"50\",\"…かばう\":\"true\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"true\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"切り払い！\",\"かばうポップ\":\"切り払い！>%3\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1は切り払った！\",\"かばうログ\":\"%1は%3への攻撃を切り払った！\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"50\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"瞬間防御\",\"実行スキル\":\"2\",\"/実行アイテム\":\"\",\"/ものまね\":\"\",\"タイミング\":\"前\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"\",\"発動率\":\"30\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"10\",\"発動打ち止め\":\"\",\"味方リアクション\":\"\",\"…味方発動率補正\":\"100\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"瞬間防御！\",\"かばうポップ\":\"瞬間防御！\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1はとっさに防御した！\",\"かばうログ\":\"%1は%3をとっさに守った！\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"カウンター\",\"実行スキル\":\"1\",\"/実行アイテム\":\"\",\"/ものまね\":\"\",\"タイミング\":\"後\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"\",\"発動率\":\"30\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"20\",\"発動打ち止め\":\"\",\"味方リアクション\":\"\",\"…味方発動率補正\":\"50\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"カウンター！\",\"かばうポップ\":\"\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1のカウンター！\",\"かばうログ\":\"\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"フルカウンター\",\"実行スキル\":\"1\",\"/実行アイテム\":\"\",\"/ものまね\":\"\",\"タイミング\":\"前\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"\",\"発動率\":\"20\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"100\",\"発動打ち止め\":\"\",\"味方リアクション\":\"\",\"…味方発動率補正\":\"100\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"true\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"フルカウンター！\",\"かばうポップ\":\"\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1のフルカウンター！\",\"かばうログ\":\"\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"早撃ち\",\"実行スキル\":\"1\",\"/実行アイテム\":\"\",\"/ものまね\":\"\",\"タイミング\":\"前\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"\",\"発動率\":\"30\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"30\",\"発動打ち止め\":\"\",\"味方リアクション\":\"\",\"…味方発動率補正\":\"100\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"早撃ち！\",\"かばうポップ\":\"\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1の早撃ち！\",\"かばうログ\":\"\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"オートリバイブ\",\"実行スキル\":\"\",\"/実行アイテム\":\"11\",\"/ものまね\":\"\",\"タイミング\":\"後\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"b.isDead()\",\"発動率\":\"20\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"false\",\"発動順\":\"3\",\"発動打ち止め\":\"true\",\"味方リアクション\":\"true\",\"…味方発動率補正\":\"100\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"オートリバイブ！\",\"かばうポップ\":\"\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1のオートリバイブ！\",\"かばうログ\":\"\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"オートリフレッシュ\",\"実行スキル\":\"\",\"/実行アイテム\":\"12\",\"/ものまね\":\"\",\"タイミング\":\"後\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"b.isRestricted()\",\"発動率\":\"20\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"2\",\"発動打ち止め\":\"true\",\"味方リアクション\":\"true\",\"…味方発動率補正\":\"100\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"オートリフレッシュ！\",\"かばうポップ\":\"\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1のオートリフレッシュ！\",\"かばうログ\":\"\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"オートポーション\",\"実行スキル\":\"\",\"/実行アイテム\":\"8\",\"/ものまね\":\"\",\"タイミング\":\"後\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"b.hp <= b.mhp * 0.75\",\"発動率\":\"20\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"1\",\"発動打ち止め\":\"true\",\"味方リアクション\":\"true\",\"…味方発動率補正\":\"100\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"オートポーション！\",\"かばうポップ\":\"\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1のオートポーション！\",\"かばうログ\":\"\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"アイテム使うな\",\"実行スキル\":\"1\",\"/実行アイテム\":\"\",\"/ものまね\":\"\",\"タイミング\":\"後\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"DataManager.isItem(act)\",\"発動率\":\"100\",\"…発動率スクリプト\":\"\",\"…発動率固定\":\"\",\"発動順\":\"100\",\"発動打ち止め\":\"\",\"味方リアクション\":\"\",\"…味方発動率補正\":\"100\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"true\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"アイテムなぞ使ってんじゃねえ！\",\"かばうポップ\":\"\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"アイテムなぞ使ってんじゃねえ！\",\"かばうログ\":\"\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"ものまね\",\"実行スキル\":\"\",\"/実行アイテム\":\"\",\"/ものまね\":\"true\",\"タイミング\":\"後\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"\",\"発動率\":\"20\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"20\",\"発動打ち止め\":\"\",\"味方リアクション\":\"true\",\"…味方発動率補正\":\"100\",\"…かばう\":\"\",\"…アニメ引き付け\":\"\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"ものまね！\",\"かばうポップ\":\"\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"%1はものまねした！\",\"かばうログ\":\"\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}","{\"アクション名\":\"かばう\",\"実行スキル\":\"\",\"/実行アイテム\":\"\",\"/ものまね\":\"\",\"タイミング\":\"後\",\"発動設定\":\"\",\"相手条件\":\"敵からのみ\",\"…発動条件スクリプト\":\"\",\"発動率\":\"30\",\"…発動率スクリプト\":\"a.tp / 50\",\"…発動率固定\":\"\",\"発動順\":\"30\",\"発動打ち止め\":\"\",\"味方リアクション\":\"true\",\"…味方発動率補正\":\"100\",\"…かばう\":\"true\",\"…アニメ引き付け\":\"true\",\"反応リアクション\":\"\",\"特殊効果\":\"\",\"行動ガード\":\"\",\"/行動キャンセル\":\"\",\"コスト消費\":\"\",\"RA中ステート-自分\":\"\",\"RA中ステート-敵\":\"\",\"回数分繰り返し\":\"\",\"ポップアップとログ\":\"\",\"リアクションポップ\":\"\",\"かばうポップ\":\"かばう！>%3\",\"…ポップアップ設定\":\"\",\"リアクションログ\":\"\",\"かばうログ\":\"%1は%3をかばった！\",\"他プラグイン連携\":\"\",\"バトルウェイト-自分\":\"\",\"バトルウェイト-敵\":\"\",\"フリーアニメ\":\"\"}"]
 * 
 * @param ポップアップアニメ 
 * 
 * @param 出現アニメ登録
 * @parent ポップアップアニメ 
 * @desc appearAnimeMaking 出現アニメーションを登録する。各ポップ設定から呼び出せる
 * @type struct<appearAnime>[]
 * @default ["{\"アニメ名\":\"小さく出る\",\"アニメ時間\":\"20\",\"ディレイ\":\"\",\"上方レイヤー\":\"\",\"アニメ内容\":\"\",\"スケール\":\"0\",\"スケールターン\":\"\",\"フェードイン\":\"0\"}","{\"アニメ名\":\"大きく出る\",\"アニメ時間\":\"20\",\"ディレイ\":\"\",\"上方レイヤー\":\"true\",\"アニメ内容\":\"\",\"スケール\":\"1.5\",\"スケールターン\":\"\",\"フェードイン\":\"\"}","{\"アニメ名\":\"大きく強調\",\"アニメ時間\":\"30\",\"ディレイ\":\"\",\"上方レイヤー\":\"true\",\"アニメ内容\":\"\",\"スケール\":\"\",\"スケールターン\":\"2\",\"フェードイン\":\"\"}","{\"アニメ名\":\"飛び出る\",\"アニメ時間\":\"30\",\"ディレイ\":\"\",\"上方レイヤー\":\"true\",\"アニメ内容\":\"\",\"スケール\":\"\",\"スケールターン\":\"1.5\",\"フェードイン\":\"\"}"]
 * 
 * @param 基本の出現アニメ
 * @parent ポップアップアニメ
 * @desc apperAnimeBasic 個別指定しない場合のポップアップ出現時のアニメーション。出現アニメ登録したアニメ名を書く
 * @default 大きく強調
 * 
 * @param 標準のアニメ無効
 * @parent ポップアップアニメ 
 * @desc noDefaultAnime 標準のポップアップアニメを無効にする
 * @type boolean
 * @default true
 * 
 * @param ポップフォント設定
 * 
 * @param ポップフォント
 * @parent ポップフォント設定
 * @desc popFont 使用するフォント。『Keke_CommonData』でフォント登録した名を書く
 * 
 * @param ポップ文字サイズ
 * @parent ポップフォント設定
 * @desc popFontSize ポップアップの文字サイズ。空欄ならデータベースで設定した文字サイズ。基本 30
 * @default 30
 *
 * @param ポップ文字色
 * @parent ポップフォント設定
 * @desc PopFontColor ポップアップの文字色。赤, 緑, 青, 濃度。色0〜255、濃度0〜1。基本 0, 0, 0, 1
 * @default 0, 0, 0, 1
 *
 * @param ポップ縁取り幅
 * @parent ポップフォント設定
 * @desc popOutWidth ポップアップの縁取り幅。5 なら 5ピクセル。基本 8
 * @default 8
 *
 * @param ポップ縁取り色
 * @parent ポップフォント設定
 * @desc popOutColor ポップアップの縁取り色。赤, 緑, 青, 濃度。色0〜255、濃度0〜1。基本 255, 176, 255, 1
 * @default 255, 176, 255, 1
 * 
 * @param ポップその他設定
 * 
 * @param ポップ表示時間
 * @parent ポップその他設定
 * @desc popDisplayTime ポップアップの表示時間。50 なら 50フレーム。基本 120
 * @default 120
 * 
 * @param ポップ行間調整
 * @parent ポップその他設定 
 * @desc popLineSpace ポップアップの行間調整。5 なら 5ピクセル 広げ、-5 なら 5ピクセル 縮める。基本 5
 * @default 5
 * 
 * @param アイコン表示
 * @parent ポップその他設定
 * @desc showIcon ポップアップの左にスキルアイコンを表示する。基本 true
 * @type boolean
 * @default true
 *
 * @param アイコンサイズ
 * @parent ポップその他設定
 * @desc iconSize アイコンの大きさ。150 なら 150%、50 なら 50% の大きさになる。基本 80
 * @default 80
 * 
 * @param アイコン間隔
 * @parent ポップその他設定
 * @desc iconSpace テキストとアイコンの間隔。5 なら 5ピクセル。基本 2
 * @default 2
 * 
 * @param ポップアップ無効
 * @parent ポップその他設定
 * @desc noPopup ポップアップを表示しない
 * @type boolean
 * 
 * @param かばう設定
 * 
 * @param かばう位置X
 * @parent かばう設定
 * @desc substitutePosX かばう移動先のX位置補正。5 なら 右に 5ピクセル ずれる。基本 -80
 * @default -80
 *
 * @param かばう位置Y
 * @parent かばう設定
 * @desc substitutePosY かばう移動先のY位置補正。5 なら 下に 5ピクセル ずれる。基本 0
 * @default 0
 *
 * @param かばう移動時間
 * @parent かばう設定
 * @desc substituteMoveTime かばう移動(かばう対象の近くへの移動)の所要時間。5 なら 5フレーム。基本 12
 * @default 12
 *
 * @param かばう持続時間
 * @parent かばう設定
 * @desc substituteKeeptime かばう移動先に留まる時間。5 なら 5フレーム。プラグイン『Keke_SpeedStarBattle』用。基本 40
 * @default 40
 * 
 * @param 共通設定
 * @desc 全てのリアクションに適用される共通設定
 * 
 * @param 発動条件スクリプト
 * @parent 共通設定
 * @desc js式で記述。a:RA発動者 b:受け手 c:攻撃者 act:攻撃者スキル(act.idでスキルID) react:RAスキル elems:攻撃属性 v:変数
 * @type multiline_string
 * 
 * @param 発動率スクリプト
 * @parent 共通設定
 * @desc js式で記述。a:RA発動者 b:受け手 c:攻撃者 act:攻撃者スキル(act.idでスキルID) react:RAスキル elems:攻撃属性 v:変数
 * @type multiline_string
 * 
 * @param 重複リアクション計算
 * @parent 共通設定
 * @desc duplicatedReactionCalc 同じリアクションが重複した時の発動率の計算方法。加算か乗算か
 * @type select
 * @option 加算
 * @option 乗算
 * @default 加算
 * 
 * @param その他
 * 
 * @param 味方RA禁止スイッチ
 * @parent その他
 * @desc noPartyReactionSwitchId 味方のリアクション発動を全て禁止するスイッチのID
 * @type switch
 * 
 * @param 敵RA禁止スイッチ
 * @parent その他
 * @desc noTroopReactionSwitchId 敵のリアクション発動を全て禁止するスイッチのID
 * @type switch
 */
 

 
//==================================================
/*~struct~reaction:
//==================================================
 * @param アクション名
 * @desc actionName リアクションの名前。メモ欄からの呼び出しに使う
 *
 * @param 実行スキル
 * @desc doSkill リアクションとして実行するスキル
 * @type skill
 *
 * @param /実行アイテム
 * @desc doItem リアクションとして実行するアイテム
 * @type item
 *
 * @param /ものまね
 * @desc mimic 相手の行動をそのまま返す
 * @type boolean
 *
 * @param タイミング
 * @desc timing リアクションを繰り出すタイミング
 * @type select
 * @option 前
 * @option 後
 * @default 後
 *
 * @param 発動設定
 * 
 * @param 相手条件
 * @parent 発動設定
 * @desc opponentCondition 敵からの攻撃時のみリアクション発動するか、味方からのみ発動するか、全ての相手に発動するか
 * @type select
 * @option 敵からのみ
 * @option 味方からのみ
 * @option すべての相手
 * @default 敵からのみ
 *
 * @param …発動条件スクリプト
 * @parent 発動設定
 * @desc js式で記述。a:RA発動者 b:受け手 c:攻撃者 act:攻撃者スキル(act.idでスキルID) react:RAスキル elems:攻撃属性 v:変数
 * @type multiline_string
 *
 * @param 発動率
 * @parent 発動設定
 * @desc invokeRate リアクションの発動率。百分率。5 なら 5%。発動率スクリプトはこの発動率に乗算される
 * @type 
 * @default 50
 *
 * @param …発動率スクリプト
 * @parent 発動設定
 * @desc js式で記述。a:RA発動者 b:受け手 c:攻撃者 act:攻撃者スキル(act.idでスキルID) react:RAスキル elems:攻撃属性 v:変数
 * @type multiline_string
 * 
 * @param …共通発動率を無視
 * @parent 発動設定
 * @desc noPerScriptCommon　共通の発動率スクリプトを無視する
 * @type boolean
 * 
 * @param …発動率固定
 * @parent 発動設定
 * @desc fixInvokeRate 発動率を固定し、攻撃側からのリアクション率の影響を受けなくなる
 * @type boolean
 *
 * @param 発動順
 * @parent 発動設定
 * @desc orderOfInvoke リアクションの発動順。数値が高いほど先に発動する
 * @default 0
 *
 * @param 発動打ち止め
 * @parent 発動設定
 * @desc stopInvoke このリアクションが発動した時点で、以降のリアクションの発動を打ち止めにする
 * @type boolean
 * 
 * @param 味方リアクション
 * @parent 発動設定
 * @desc friendReaction 味方への攻撃に対してもリアクションを発動する
 * @type boolean

 *
 * @param …味方発動率補正
 * @parent 発動設定
 * @desc friendReactionRevise 味方リアクション時の発動率補正。50 なら通常の発動率の 50%
 * @default 100
 *
 * @param …かばう
 * @parent 発動設定
 * @desc substitute 味方リアクション時、本来のターゲットの代わりに自分がターゲットになる
 * @type boolean
 *
 * @param …アニメ引き付け
 * @parent 発動設定
 * @desc attractAnime かばうの際、アニメーションも自分の方に表示する
 * @type boolean
 *
 * @param 反応リアクション
 * @parent 発動設定
 * @desc reflectReaction ターゲットに関係なく相手の行動に対してリアクションを発動する
 * @type boolean
 * 
 * @param 特殊効果
 * 
 * @param 行動ガード
 * @parent 特殊効果
 * @desc actGuard 相手の行動の効果を無効化する(エフェクトは表示される)
 * @type boolean
 *
 * @param /行動キャンセル
 * @parent 特殊効果
 * @desc actCancel 相手の行動のキャンセルする(エフェクトも表示されない)
 * @type boolean
 *
 * @param コスト消費
 * @parent 特殊効果
 * @desc payCost スキルのMPTPアイテムの個数などを消費する
 * @type boolean
 * 
 * @param …消費HP
 * @parent 特殊効果
 * @desc HpConsume リアクションで消費するHP量。JS式可。a:発動者 v:変数
 * 
 * @param …消費MP
 * @parent 特殊効果
 * @desc MpConsume リアクションで消費するMP量。JS式可。a:発動者 v:変数
 * 
 * @param …消費TP
 * @parent 特殊効果
 * @desc TpConsume リアクションで消費するTP量。JS式可。a:発動者 v:変数
 *
 * @param RA中ステート-自分
 * @parent 特殊効果
 * @desc atateInRA-self リアクション中のみ自分にかけるステート。5 なら iD5 のステート
 * @type state
 *
 * @param RA中ステート-敵
 * @parent 特殊効果
 * @desc stateInRA-enemy リアクション中のみ敵側にかけるステート。5 なら iD5 のステート
 * @type state
 * 
 * @param 回数分繰り返し
 * @parent 特殊効果
 * @desc repeatSameAsActTimes 相手の行動の連続回数分だけリアクションも繰り返す
 * @type boolean
 *
 * @param ポップアップとログ
 * 
 * @param リアクションポップ
 * @parent ポップアップとログ
 * @desc reactionPop リアクション発動時に表示するポップアップ。%1:発動者名, %2:スキル名
 *
 * @param かばうポップ
 * @parent ポップアップとログ
 * @desc substitutePop かばう発動時に表示するポップアップ。%1:発動者名, %2:スキル, %3:かばう対象
 *
 * @param …ポップアップ設定
 * @parent ポップアップとログ
 * @desc popupCfg ポップアップの設定
 * @type struct<popCfg>
 *
 * @param リアクションログ
 * @parent ポップアップとログ
 * @desc reactionLog リアクション発動時に表示するログメッセージ。%1:発動者名, %2:スキル名
 *
 * @param かばうログ
 * @parent ポップアップとログ
 * @desc substitureLog かばう発動時に表示するログメッセージ。%1:発動者名, %2:スキル名, %3:かばう対象
 * 
 * @param ログ技名
 * @parent ポップアップとログ
 * @desc logSkillName ログで表示される技名。空欄なら本来の技名を表示
 *
 * @param 他プラグイン連携
 * 
 * @param バトルウェイト-自分
 * @parent 他プラグイン連携
 * @desc battleWait-self 自分のバトルウェイトの増減補正。50 なら 50%。プラグイン『Keke_SpeedStarBattle』用
 *
 * @param バトルウェイト-敵
 * @parent 他プラグイン連携
 * @desc battleWait-enemy 敵側のバトルウェイトの増減補正。50 なら 50%。プラグイン『Keke_SpeedStarBattle』用
 *
 * @param フリーアニメ
 * @parent 他プラグイン連携
 * @desc freeAnime フリーアニメを再生する。メモ欄同様に記述。プラグイン『Keke_FreeAnime』が必要
 * @type multiline_string
 */
 
 

//==================================================
/*~struct~invokeCondition:
//==================================================
 * @param 相手条件
 * @desc opponentCondition 敵からの攻撃時のみリアクション発動するか、味方からのみ発動するか、全ての相手に発動するか
 * @type select
 * @option 敵からのみ
 * @option 味方からのみ
 * @option すべての相手
 * @default 敵からのみ
 * 
 * @param 条件リスト
 * @desc conditionList 実行条件のリスト。バトラーの能力値や状態、変数など
 * @type struct<battlerCondition>[]
 */



//==================================================
/*~struct~battlerCondition:
//==================================================
 * @param バトラー
 * @desc battler 条件とするバトラー
 * @type select
 * @option リアクション発動者
 * @option 被弾した者
 * @option 攻撃した者
 * @default リアクション発動者
 * 
 * @param 条件-能力値
 * @desc condition-parameter 条件とする能力値。バトラークラスの変数名を書く。atk、def など
 * 
 * @param /条件-変数
 * @desc condition-variable 条件とする変数
 * @type variable
 * 
 * @param 比較演算子
 * @desc comparisonOperator 条件と値の比較演算子
 * @type select
 * @option ==
 * @option >
 * @option >=
 * @option <
 * @option <=
 * @option !=
 * @default >=
 * 
 * @param 値
 * @desc value 条件と比較する値・* / % を先頭につけてJS式可。*2 なら 能力値の 2倍 など
 * 
 * @param …値-能力値
 * @desc value-parameter 値を能力値で指定。。バトラークラスの変数名を書く。atk、def など
 * 
 * @param …値-変数
 * @desc  value-variable 値を変数で指定
 * 
 * @param 関数条件
 * @desc methodCondition バトラークラスの関数を条件とする。isDead、isRestricted、isAlive など
 */



//==================================================
/*~struct~popCfg:
//==================================================
 * @param フォント
 * @desc font 使用するフォント。『Keke_CommonData』でフォント登録しそのフォント名を書く。空欄ならメインフォント
 * 
 * @param 文字サイズ
 * @desc fontSize ポップアップの文字サイズ。空欄だと標準サイズ。+1 で標準サイズ + 1、-1 で標準サイズ - 1
 *
 * @param 文字色
 * @desc fontColor ポップアップの文字色。赤, 緑, 青, 濃度。色0〜255、濃度0〜1
 *
 * @param 縁取り幅
 * @desc outWidth ポップアップの縁取り幅。5 なら 5ピクセル。+1 で 標準 + 1ピクセル、-1 で 標準 - 1ピクセル 
 *
 * @param 縁取り色
 * @desc outColor ポップアップの縁取り色。赤, 緑, 青, 濃度。色0〜255、濃度0〜1
 * 
 * @param 出現アニメ
 * @desc appearAnime ポップアップ出現時のアニメーション。出現アニメ登録したアニメ名を書く
 * 
 * @param 無効
 * @desc invalid ポップアップを表示しない
 * @type boolean
 */



//==================================================
/*~struct~appearAnime:
//==================================================
 * @param アニメ名
 * @desc animeName アニメーションの名前。各ポップ設定からの呼び出しに使う
 *
 * @param アニメ時間
 * @desc animeTime アニメの実行時間。5 なら 5フレーム。基本 20
 * @default 20
 * 
 * @param ディレイ
 * @desc delay アニメ開始を遅らせる。5 なら 5フレーム 待ってから開始
 * 
 * @param 上方レイヤー
 * @desc upperLayer 通常より上のレイヤーに配置する
 * @type boolean
 * 
 * @param アニメ内容
 * 
 * @param スケール
 * @parent アニメ内容
 * @desc scale 拡縮アニメ。2 なら サイズ2倍→1倍、0.5 なら サイズ0.5倍→1倍
 * 
 * @param スケールターン
 * @parent アニメ内容
 * @desc scaleTurn 拡縮アニメ-往復。2 なら サイズ1倍→2倍→1倍。0.5 なら サイズ1倍→0.5倍→1倍
 * 
 * @param フェードイン
 * @parent アニメ内容
 * @desc fadeIn 不透明度アニメ。50 なら 不透明度50→255
 */
 
 
 
(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.match(/^.*\/([^/?#]+)\.js(?:[?#].*)?$/)[1];



    //==================================================
    //--  他プラグインからの引用メソッド
    //==================================================

    //- フルアニメステータスの取得
    function getFullAnimeStatus() {
        if ($gameSystem.isSideView()) { return null; }
        return $gameTemp._fullAnimeStatusKe;
    };
    
    //- フルアニメステータスASIの取得
    function getFullAnimeStatusAsi(battler) {
        if (!getFullAnimeStatus() || $gameSystem.isSideView()) { return null; }
        const asi = $gameTemp.getFullAnimeStatusAsiKe(battler);
        if (!asi || !asi.faceBaseSprite) { return null; }
        return asi;
    };

    //- フルアニメ顔移動の開始
    function startFaceMoveFullAnime(battler, x, y, timeMax) {
        const asi = getFullAnimeStatusAsi(battler);
        if (!asi) { return; }
        const fullAnime = getFullAnimeStatus();
        fullAnime.startFaceMove(battler, asi, x, y, timeMax);
    };

    //- フルアニメ移動中か
    function isFullAnimeMoving(battler) {
        const asi = getFullAnimeStatusAsi(battler);
        if (!asi) { return false; }
        if (asi.faceMove) { return true; }
        return false;
    };


    //- フリーアニメプラグインがあるか
    function isFreeAnime() {
        return PluginManager._scripts.some(n => n == "Keke_FreeAnime");
    };

    
    //- スピードスターバトルか
    function isSpeedStar() {
        const gs = $gameSystem;
        return gs._speedStarInitedKe && !gs._noSpeedStarKe;
    };


    //- アイコンバックを描画するか - メニュー快適化
    function isIconBackDraw() {
        if (!$gameTemp.isIconBackDrawKe) { return false; };
        return $gameTemp.isIconBackDrawKe.apply(this, arguments);
    };

    //- アイコンバックの描画 - メニュー快適化
    function drawIconBack(bitmap, iconIndex, x, y) {
        if (!$gameTemp.drawIconBackKe) { return; };
        $gameTemp.drawIconBackKe.apply(this, arguments);
    };


    //- 全ての属性の取得 - 属性フルカスタム
    function getAllElements(action) {
        if ($gameTemp.getAllElementsKe) {
            return $gameTemp.getAllElementsKe(action);
        }
        return getElements();
    };

    //- 属性の取得
    function getElements(action) {
        if (!action) { return []; }
        const elementId = action.item().damage.elementId;
        if (elementId < 0) {
            return action.subject().attackElements()
        } else {
            return [elementId];
        }
    };


    //- スコア/ガード済みをオン
    function onScoreGuarded() {
        if ($gameTemp.onScoreGuardedKe) {
            return $gameTemp.onScoreGuardedKe();
        }
    };



    //==================================================
    //--  ファイル変数
    //==================================================

    // リアクション用変数
    let ReactionQueues = { pre:[], after:[], on:false };
    let CurrentQueue = null;
    let ReactionBattlers = [];
    let WaitingSubject = null;
    let OriSubject = null;
    let OriAction = null;
    let ReactionStates = [];
    let BattleWaitRateOpp = null;
    let PopBattlers = [];
    
    // ポップアップテキストの設定
    let PopText = "";
    let PopIconIndex = null;
    let PopFontFace = null;
    let PopFontSize = null;
    let PopFontColor = null;
    let PopOutW = null;
    let PopOutColor = null;
    let PopPadding = null;
    let PopTime = null;
    let PopAnime = null;



    //==================================================
    //--  文字列オート変換 /ベーシック
    //==================================================
    
    //- 文字列のハッシュ化
    function strToHash(str) {
        if (!str || !str.length) { return {}; }
        let hash = {};
        const strs = JSON.parse(str);
        let val = null;
        let val2 = null;
        for (let key in strs) {
            val = strs[key];
            if (!key || !val) { continue; }
            val2 = strToAuto(val, key);
            hash[key] = val2;
        }
        return hash;
    };
    
    //- 文字列のリスト化
    function strToList(str) {
        if (!str || !str.length) { return []; }
        let array = JSON.parse(str);
        return array.map((val, i) => {
            return strToAuto(val);
        });
    };
    
    //- 文字列の自動処理
    function strToAuto(val, key = "") {
        let val2 = null;
        let match = null;
        let end = false;
        if (!end) {
            if (val[0] == "{") {
                val2 = strToHash(val);
                end = true;
            }
        }
        if (!end) {
            if (val[0] == "[") {
                val2 = strToList(val);
                end = true;
            }
        }
        if (!end) { val = val + ","; }
        if (!end) {
            match = val.match(/^\s*(-?\d+\s*,\s*-?\d+\s*,\s*-?\d+\s*,?\s*-?\d*\.?\d*)\s*,$/);
            if (match && !val.match(/[^\d\.\-,\s]/)) {
                if (key.match(/(カラー|色|塗り)/) && !key.includes("トーン") && !key.includes("ブレンド") && !key.includes("配色") && !key.includes("着色") &&  !key.includes("フラッシュ") && !key.includes("チェンジ") &&  !key.includes("選択")) {
                    val2 = "rgba(" +  match[1] + ")";
                } else {
                    val2 = JSON.parse("[" +  match[1] + "]");
                }
                end = true;
            }
        }
        if (!end) {
            match = val.match(/(-?\d+\.?\d*),\s*/g);
            if (match && match.length >= 2 && !val.match(/[^\d\.\-,\s]/)) {
                val2 = JSON.parse("[" + match.reduce((r, s) => r + s).replace(/,$/, "") + "]");
                end = true;
            }
        }
        if (!end) {
            match = val.match(/^(true|false)\s*,/);
            if (match) {
                val2 = match[1] == "true" ? true : false;
                end = true;
            }
        }
        if (!end) {
            match = val.match(/^(-?\d+\.?\d*)\s*,/);
            if (match && !val.match(/[a-z]/)) {
                val2 = Number(match[1]); end = true;
                end = true;
            }
        }
        if (!end) {
            if (val[0] == "\"") { val = val.slice(1); }
            val2 = val.slice(0, -1);
        }
        return val2;
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
    
    const keke_reactionList = strToList(parameters["リアクション登録"]);

    //- ポップアップアニメ
    const keke_appearAnimeList = strToList(parameters["出現アニメ登録"]);
    const keke_appearAnimeBasic = parameters["基本の出現アニメ"];
    const keke_noDefoAnime = toBoolean(parameters["標準のアニメ無効"]);

    //- ポップフォント設定
    const keke_popFontFace = parameters["ポップフォント"];
    const keke_popFontSize = Number(parameters["ポップ文字サイズ"]);
    const keke_popFontColor = "rgba(" + parameters["ポップ文字色"] + ")";
    const keke_popOutWidth = Number(parameters["ポップ縁取り幅"]);
    const keke_popOutColor = "rgba(" + parameters["ポップ縁取り色"] + ")";

    //- ポップその他設定
    const keke_popShowTime = Number(parameters["ポップ表示時間"]);
    const keke_paddingOffset = Number(parameters["ポップ行間調整"]);
    const keke_showIcon = toBoolean(parameters["アイコン表示"]);
    const keke_iconSize = Number(parameters["アイコンサイズ"]);
    const keke_iconSpace = Number(parameters["アイコン間隔"]);
    const keke_popupInvalid = toBoolean(parameters["ポップアップ無効"]);

    //- かばう設定
    const keke_subX = Number(parameters["かばう位置X"]);
    const keke_subY = Number(parameters["かばう位置Y"]);
    const keke_subMoveTime = Number(parameters["かばう移動時間"]) || 12;
    const keke_subKeepTime = Number(parameters["かばう持続時間"]);

    //- 共通設定
    const keke_conditionScript = parameters["発動条件スクリプト"];
    const keke_perScript = parameters["発動率スクリプト"];
    const keke_duplicatedReactionCalc = parameters["重複リアクション計算"];

    //- その他
    const keke_noPartyReactionSwitchId = Number(parameters["味方RA禁止スイッチ"]);
    const keke_noTroopReactionSwitchId = Number(parameters["敵RA禁止スイッチ"]);

    parameters = null;



    //==================================================
    //--  リアクション変数
    //==================================================

    //- リアクション用ファイル変数の初期化
    function initReactionFileMembers() {
        // リアクションキューの初期化
        initReactionQueue();
        ReactionBattlers = [];
        WaitingSubject = null;
        OriSubject = null;
        OriAction = null;
        ReactionStates = [];
        bwWateOpp = null;
        BattleManager._battleWaitRateKeRask = null;
        PopBattlers = [];
    };

    //- リアクションキューの初期化
    function initReactionQueue() {
        ReactionQueues = { pre:[], after:[], on:false }
        CurrentQueue = null;
    };

    //- リアクション変数の初期化
    function initReactionMembers(battler) {
        // リアクション発動者
        battler._doingReactionKe = null;
        battler._stopsReactionKe = null;
        battler._throughReactionKe = null;
        battler._isGuardedBattlersKe = null;
        battler._isActCancelKe = null;
        battler._noCostKeRask = null;
        battler._inReactionsKe = null;
        battler._reactionNoKe = 0;
        // 行動者
        battler._takingReactionKe = null;
        // かばう
        battler._subTargetPacksKe = null;
        battler._subUserKe = null;
    };
    
    
    
    //==================================================
    //-- リアクションの開始
    //==================================================
    
    //- リアクションの開始
    function startReaction() {
        const subject = BattleManager._subject;
        const action = subject.currentAction();
        const through = subject._throughReactionKe;
        subject._throughReactionKe = null;
        // アクションがなければリターン
        if (!action || !action.item()) { return; }
        // 行動者がリアクション中はリターン
        if (subject._doingReactionKe) { return; }
        // リアクションしないアクションならリターン
        if (through || isQuickSkill(action)) { return; }
        // アクションがリアクションならリターン
        if (action._isReactionKe) { return; }
        // 味方への行動ならリターン
        if (action.isForFriend()) { return; }
        // リアクションステータスの解除
        remReactionStatus(subject);
        let result = false;
        // リアクションの準備
        const d = prepareReaction(subject, action);
        const targets = d.targets;
        ReactionBattlers = [];
        // 相手リアクション率の取得
        let reactRateOppo = getReactionRateOppo(subject, action);
        // 自分のリアクション
        targets.forEach(target => {
            // 全リアクションの検索
            const reactions = searchReactionAll(subject, target, action);
            // リアクションの追加
            if (addReaction(subject, action, d, reactions, target, reactRateOppo)) {
                result = true;
            };
        });
        // 味方のリアクション
        targets.forEach(target => {
            // 味方のリアクションを検索
            const rs = searchFriendReaction(target, subject, action);
            if (!rs || !rs.length) { return; }
            rs.forEach(r => {
                const reactions = r.reactions;
                const user = r.user;
                // リアクションの追加-味方リアクション
                if (addReaction(subject, action, d, reactions, user, reactRateOppo, target)) {
                    result = true;
                };
            });
        });
        // 反応リアクション
        const members = subject._actorId ? $gameTroop.aliveMembers() : $gameParty.aliveMembers();
        members.forEach(target => {
            // 全アクションを検索-反応リアクション
            const reactions = searchReactionAll(subject, target, action, null, true);
            // リアクションの追加
            if (addReaction(subject, action, d, reactions, target, reactRateOppo)) {
                result = true;
            };
        });
        // キューの処理追加
        processQueueAddition();
        // リアクションがあるなら本来の行動者を保存
        if (ReactionQueues.on) {
            WaitingSubject = subject;
            OriSubject = subject;
            // 行動者のリアクション受け中フラグをオン
            subject._takingReactionKe = true;
        }
        // 前キューがないときはすぐに本来の攻撃者の攻撃
        if (!ReactionQueues.pre.length) {
            result = false;
        }
        return result;
    };

    //- プラグイン『TorigoyaMZ_QuickSkill』対応
    function isQuickSkill(action){
        const item = action.item();
        return item && (item.meta['QuickSkill'] || item.meta['ターン消費なし'] || item.meta['ターン消費無し']);
    };


    //- リアクションの準備
    function prepareReaction(subject, action) {
        let d = {};
        d.subject = subject;
        d.action = action;
        // ターゲットを保存
        const oriTargets = action.makeTargets();
        d.oriTargets = oriTargets.map(t => battlerToData(t));
        action._targetsKeRask = d.oriTargets;
        // リアクション用ターゲット
        d.targets = Array.from(new Set(oriTargets)).filter(b => b.isAlive() && (b._actorId ? $gameParty.battleMembers().includes(b) : true));
        // 本来のアクションを保存
        OriAction = action;
        // 行動者のリアクション実行中フラグを解除
        subject._doingReactionKe = null;
        return d;
    };
    

    //- リアクションの追加
    function addReaction(subject, action, d, reactions, user, reactRateOppo, subTarget) {
        if (!reactions || !reactions.length) { return false; }
        let result = false;
        // 自分リアクション率の取得
        const reactRate = getReactionRateSelf(user, action, subTarget, subject) * (reactRateOppo / 100);
        reactions.forEach(reaction => {
            // リアクションキューのセット
            const queue = setReactionQueue(reaction, user, subject, action, reactRate, subTarget, d.oriTargets);
            // 前リアクションならリターン予約
            if  (queue && (reaction.data["タイミング"] == "前" || reaction.data["/行動キャンセル"])) { result = true; }
        });
        ReactionBattlers.push(user);
        return result;
    };
    
    //- 自分リアクション率の取得
    function getReactionRateSelf(user, action, subTarget, subject) {
        // 全てのメタの合算-数値リスト
        const metas = bundleAllMeta_array(user, ["リアクション率", "自分リアクション率", "reactRate", "reactRateSelf"], action, true);
        if (!metas.length) { return 100; }
        let rate = 100;
        metas.forEach(meta => {
            rate *= !meta ? 1 : newFunc(meta, user, subTarget || user, subject, action.item()) / 100;
        });
        return Math.round(rate);
    };

    //- 相手リアクション率の取得
    function getReactionRateOppo(subject, action) {
        // 全てのメタの合算-数値リスト
        const metas = bundleAllMeta_array(subject, ["相手リアクション率", "reactRateOppo"], action, true);
        if (!metas.length) { return 100; }
        let rate = 100;
        metas.forEach(meta => {
            rate *= !meta ? 1 : newFunc(meta, subject, {}, {}, action.item()) / 100;
        });
        return Math.round(rate);
    };
    
    //- 全リアクションの検索
    function searchReactionAll(subject, user, action, subTarget, reflect) {
        let reactions = [];
        // 前リアクションの検索
        let list = searchReaction("前", subject, user, action, subTarget, reflect);
        if (list) { reactions = [...reactions, ...list]; }
        // 後リアクションの検索
        list = searchReaction("後", subject, user, action, subTarget, reflect);
        if (list) { reactions = [...reactions, ...list]; }
        return reactions;
    };
    
    //- リアクションの検索
    function searchReaction(phase, subject, user, action, subTarget, reflect) {
        // リアクションの取得
        let reactions = getReactions(user);
        if (!reactions || !reactions.length) { return; }
        // リアクションの実行判定
        reactions = reactions.filter(reaction => judgeReaction1(reaction, subject, user, phase, subTarget, reflect));
        if (!reactions || !reactions.length) { return; }
        return reactions;
    };
    
    // 味方のリアクションを検索
    function searchFriendReaction(user, subject, action, ReactionBattlers) {
        // 味方グループを取得
        let groop = user._actorId ? $gameParty.aliveMembers() : $gameTroop.aliveMembers();
        groop = groop.filter(b => b.isAlive() && !isSameBattler(b, user));
        // グループ全員を検索
        let rs = [];
        for (let battler of groop) {
            if (ReactionBattlers && ReactionBattlers.some(b => isSameBattler(b, battler))) { return; }
            // 全リアクションの検索
            let reactions = searchReactionAll(subject, battler, battler, user);
            if (!reactions || !reactions.length) { continue; }
            rs.push({ user:battler, reactions:reactions });
        };
        return rs;
    };
    
    //- リアクションの取得
    function getReactions(target) {
        // 全てのメタの合算-文字列リスト
        let strs = bundleAllMeta_strs(target, ["リアクション", "reaction"]);
        if (!strs || !strs.length) { return null; }
        const args = [];
        // 名前と確率を取得
        strs.forEach(str => {
            const ss = str.split("/");
            args.push({ name:ss[0], rate:ss[1] ? Number(ss[1]) : 100 });
        });
        // 重複があったらひとつにして確率を計算
        const args2 = [];
        args.forEach(arg => {
            // 重複があるか判定
            for (let argPre of args2) {
                if (argPre.name == arg.name) {
                    // 乗算
                    if (keke_duplicatedReactionCalc == "乗算") {
                        argPre.rate *= arg.rate / 100;
                    // 加算
                    } else {
                        argPre.rate += arg.rate;
                    }
                    return;
                }
            };
            args2.push(arg);
        });
        // データを取得
        const args3 = [];
        args2.forEach(arg => {
            const reaction = keke_reactionList.find(d => d["アクション名"] == arg.name);
            if (!reaction) { return; }
            args3.push({ data:reaction, per:arg.rate });
        });
        return args3;
    };
    
    //- リアクションの実行判定1
    function judgeReaction1(reactionData, subject, user, phase, subTarget, reflect) {
        const reaction = reactionData.data;
        // 禁止スイッチの判定
        if (user._actorId && $gameSwitches.value(keke_noPartyReactionSwitchId)) { return false; }
        if (user._enemyId && $gameSwitches.value(keke_noTroopReactionSwitchId)) { return false; }
        // 行動可能か
        if (!user.isAlive() || user.isRestricted()) { return false; }
        // 自分対象なら false
        if (isSameBattler(subject, user)) { return false; }
        // タイミング
        const timing = reaction["タイミング"];
        if ((timing == "前" || timing == "一方的") && phase != "前") { return; }
        if (timing == "後" && phase != "後") { return; }
        // 自分へのリアクション判定
        if (!subTarget && !reflect) {
            if (reaction["反応リアクション"]) { return false; }
        // 味方へのリアクション判定
        } else if (subTarget && !reflect) {
            if (reaction["反応リアクション"]) { return false; }
        // 反応リアクション判定
        } else if (reflect) {
            if (!reaction["反応リアクション"]) { return false; }
        }
        return true;
    };
    
    //- リアクションの実行判定2
    function judgeReaction2(queue, subject, user, action, subTarget, isAdvance) {
        // 先行判定済みなら判定を飛ばす
        if (queue.judged) { return true; }
        // 行動ガード/キャンセル/かばう時のみ先行判定
        if (isAdvance) {
            if (!isAdvanceReaction(queue)) { return true; }
        }
        const item = action.item();
        // 先行判定済みなら発動条件判定を飛ばす
        if (!queue.judged) {
            // スクリプト用変数
            const a = user;
            const b = subTarget || user;
            const c = subject;
            const act = OriAction ? OriAction.item() || {} : {}
            const react = action.item() || {};
            const elems = getAllElements(OriAction);
            // 相手条件
            if (queue.byCondition) {
                const bc = queue.byCondition;
                const opp = isByOpponent(subject, user);
                const frd = !opp;
                if (bc == "敵からのみ" && !opp) { return false; }
                if (bc == "味方からのみ" && !frd) { return false; }
            }
            // 発動条件スクリプト
            if (queue.conditionScript) {
                if (!newFunc(queue.conditionScript, a, b, c, act, react, elems)) { return false; }
            }
            if (keke_conditionScript) {
                if (!newFunc(keke_conditionScript, a, b, c, act, react, elems)) { return false; }
            }
            // 発動率
            let reactRate = queue.reactRate;
            const reactRevise = queue.perRevise != null && subTarget ? queue.perRevise / 100 : 1;
            reactRate = (reactRate != null && !queue.perFix) ? reactRate / 100 : 1;
            let per = Number(queue.per || 1) * reactRevise * reactRate;
            if (queue.perScript) {
                per *= newFunc(queue.perScript, a, b, c, act, react, elems);
            }
            if (keke_perScript && !queue.noPerScriptCommon) {
                per *= newFunc(keke_perScript, a, b, c, act, react, elems);
            }
            per = Math.round(per * (queue.per2 != null ? queue.per2 : 100) / 100);
            if (per != null) {
                if (Math.randomInt(100) >= per) { return false; }
            }
        }
        // 行動可能か
        if (!user.isAlive() || user.isRestricted()) { return false; }
        // 通常のスキル仕様可能判定
        if (item) {
            if (!queue.payCost) { user._noCostKeRask = true; }
            const canUse = user.canUse(item);
            user._noCostKeRask = null;
            if (!canUse) { return false; }
        }
        // コストが足りるか
        if (queue.payCost) {
            const hpCost = queue.hpCost || 0;
            if (user.hp < hpCost) { return false; }
            const mpCost = (queue.mpCost || 0) + (item ? user.skillMpCost(item) : 0);
            if (user.mp < mpCost) { return false; }
            const tpCost = (queue.tpCost || 0) + (item ? user.skillTpCost(item) : 0);
            if (user.tp < tpCost) { return false; }
        }
        // 味方へのリアクション判定
        if (subTarget) {
            // 味方リアクションでない場合は基本実行しないが、
            if (!queue.toFriend) {
                // かばう発動している時だけは実行する
                if (!isSubUser(user, subTarget)) {
                    return false;
                }
            }
        }
        // かばわれる側はかばう行動をしない
        if (queue.isSubstitutePure && isSubTarget(user)){
            return false;
        }
        // 先行判定済みフラグをオン
        if (isAdvance) {
            queue.judged = true;
        }
        return true;
    };

    //- コスト無消費時はコスト判定を飛ばす
    const _Game_BattlerBase_canPaySkillCost = Game_BattlerBase.prototype.canPaySkillCost;
    Game_BattlerBase.prototype.canPaySkillCost = function(skill) {
        if (this._noCostKeRask) { return true; }

        return _Game_BattlerBase_canPaySkillCost.apply(this, arguments);
    };

    //- かばう発動者か
    function isSubUser(battler, subTarget) {
        const packs = battler._subTargetPacksKe || battler._subedTargetsPackKe;
        if (!packs || !packs.length) { return false;}
        for (let pack of packs) {
            const target = dataToBattler(pack.battlerData);
            if (isSameBattler(target, subTarget)) { return true; }
        }
        return false;
    };

    //- かばう対象か
    function isSubTarget(battler) {
        return battler._subUserKe || battler._subedUserKe;
    };

    
    //- 敵からの行動か
    function isByOpponent(subject, target) {
        let result = false;
        if (subject._actorId && target._enemyId) { result = true; }
        if (subject._enemyId && target._actorId) { result = true; }
        if (subject._actorId && subject.isConfused() && target._actorId) { result = true; }
        if (subject._enemyId && subject.isConfused() && target._enemyId) { result = true; }
        return result;
    };

    
    //- リアクションキューのセット
    function setReactionQueue(reactionData, user, subject, action, reactRate, subTarget, oriTargets) {
        const reaction = reactionData.data
        // スクリプト用変数
        const a = user;
        const b = subTarget || user;
        const c = subject;
        const act = action.item();
        // 実行アクションを取得
        let skillId = reaction["実行スキル"];
        let itemId = reaction["/実行アイテム"];
        if (reaction["/ものまね"]) {
            const item = action.item();
            const isSkill = action._item.isSkill();
            if (isSkill) { skillId = item.id;  itemId = null; } else
            { itemId = item.id;  skillId = null; }
        }
        // キューを作成
        const queue = { subject:subject, user:user, reactRate:reactRate, subTarget:subTarget, reaction:reaction }
        // 名前
        queue.name = reaction["アクション名"];
        // アクション作成
        queue.action = new Game_Action(user);
        // アクションにリアクションフラグをセット
        queue.action._isReactionKe = true;
        // 使用スキル/アイテム
        if (skillId) {
            // 通常攻撃のときは通常攻撃スキルをセット
            if (skillId == 1) {
                queue.action.setSkill(user.attackSkillId());
            // その他のときはそのままセット
            } else {
                queue.action.setSkill(skillId);
            }
        } else if (itemId) {
            queue.action.setItem(itemId);
        }
        // タイミング
        queue.timing = reaction["タイミング"] || "後";
        // 相手条件
        queue.byCondition = reaction["相手条件"];
        // 発動条件スクリプト
        queue.conditionScript = reaction["…発動条件スクリプト"];
        // 発動率
        queue.per = reaction["発動率"];
        queue.per2 = reactionData.per;
        queue.perScript = reaction["…発動率スクリプト"];
        queue.noPerScriptCommon = reaction["…共通発動率を無視"];
        queue.perRevise = reaction["…味方発動率補正"];
        queue.perFix = reaction["…発動率固定"];
        // 発動順
        queue.order = reaction["発動順"] || 0;
        // 発動打ち止め
        queue.stopsAfter = reaction["発動打ち止め"];
        // 味方リアクション
        queue.toFriend = reaction["味方リアクション"];
        // 反応リアクション
        queue.reflect = reaction["反応リアクション"];
        // 行動ガード
        queue.actGuard = reaction["行動ガード"];
        queue.actCancel = reaction["/行動キャンセル"];
        // コスト消費
        queue.payCost = reaction["コスト消費"];
        // 各種コスト
        queue.hpCost = Math.round(newFunc(reaction["…消費HP"], a, b, c, act, queue.action.item()));
        queue.mpCost = Math.round(newFunc(reaction["…消費MP"], a, b, c, act, queue.action.item()) * user.mcr);
        queue.tpCost = Math.round(newFunc(reaction["…消費TP"], a, b, c, act, queue.action.item()));
        // RA中ステート
        queue.stateSelf = reaction["RA中ステート-自分"];
        queue.stateOpp = reaction["RA中ステート-敵"];
        // 回数分繰り返し
        queue.repeatNum = reaction["回数分繰り返し"] ? (action.item().repeats || 1) : 1;
        // かばう
        queue.isSubstitute = subTarget && reaction["…かばう"] && isNeedSubstitute(user, subTarget);
        queue.isSubstitutePure = reaction["…かばう"];
        queue.subX = keke_subX;
        queue.subY = keke_subY
        queue.subMoveTime = keke_subMoveTime;
        queue.subKeepTime = keke_subKeepTime;
        queue.attractsAnime = reaction["…アニメ引き付け"];
        // リアクションポップ
        queue.reactionPop = reaction["リアクションポップ"] || "";
        const popCfg = reaction["…ポップアップ設定"] || {};
        queue.popCfg = popCfg;
        queue.popFontFace = popCfg["フォント"] || keke_popFontFace;
        queue.popFontEachSize = getFontSize(popCfg["文字サイズ"]);
        queue.popFontBaseSize = getFontSize(keke_popFontSize);
        queue.popFontColor = popCfg["文字色"] || keke_popFontColor || "rgba(255, 208, 255, 1)";
        queue.popOutW = getOutWidth(popCfg["縁取り幅"]);
        queue.popOutColor = popCfg["縁取り色"] || keke_popOutColor || "rgba(0, 0, 0, 1)";
        queue.popInvalid = popCfg["無効"] != null ? popCfg["無効"] : keke_popupInvalid;
        // リアクションログ
        queue.reactionLog = reaction["リアクションログ"] || "";
        // かばうメッセージ
        if (queue.isSubstitute) {
            queue.substitutePop = reaction["かばうポップ"] || "";
            queue.substituteLog = reaction["かばうログ"] || "";
        };
        // ログ技名
        queue.logSkillName = reaction["ログ技名"];
        // バトルウェイト補正
        queue.bwReviseSelf = reaction["バトルウェイト-自分"];
        queue.bwReviseOpp = reaction["バトルウェイト-敵"];
        // フリーアニメ
        queue.freeAnime = reaction["フリーアニメ"];
        // かばうでなく、アクションもないならリターン
        //if (!queue.isSubstitute && !queue.action.item()) { return; }
        // 現在のアクションステートを保存
        //queue.oriActionState = user._actionState;
        // キューの挿入
        for (let i = 0; i < queue.repeatNum; i++) {
            insertQueue(queue);
        }
        // 元のアクションを保存
        saveOriAction(queue, user, subject, action, queue.timing, oriTargets);
        // 発動者のリアクション打ち止めフラグをオフ
        user._stopsReactionKe = null;
        // キュー実行済みフラグをオフ
        //didQueue = null;
        // フラグを進める
        if (queue.timing == "前") { queue.pre = 1; } else
        if (queue.timing == "後") { queue.after = 1; }
        return queue;
    };
    
    //- キューの挿入
    function insertQueue(queue) {
        const timing = queue.timing;
        if (timing == "前") {
            ReactionQueues.pre.push(queue);
        } else if (timing == "後") {
            ReactionQueues.after.push(queue);
        }
    };
    
    //- 元のアクションを保存
    function saveOriAction(queue, target, subject, action, timing, oriTargets) {
        // 行動者のターゲットを保存
        action._targetsKeRask = oriTargets;
        // セット
        queue.ori = { subject:subject, target:target, actions:subject._actions.map(a => a) };
    };

    
    //- キューの処理追加
    function processQueueAddition() {
        const qs = ReactionQueues;
        // キューの実行判定2
        qs.pre = qs.pre.filter(queue => judgeReaction2(queue, queue.subject, queue.user, queue.action, queue.subTarget, true));
        qs.after = qs.after.filter(queue => judgeReaction2(queue, queue.subject, queue.user, queue.action, queue.subTarget, true));
        // 発動打ち止めの処理-先行
        processStopsAfter_advance();
        // 重複リアクションの削除-先行
        delDuplicateReaction_advance();
        // キューの有効判定
        if (qs.pre.length || qs.after.length) { qs.on = true; } else { qs.on = false; }
        if (!qs.on) { return; }
        // 発動順を適用
        qs.pre.sort((a, b) => b.order - a.order);
        qs.after.sort((a, b) => b.order - a.order);
        // キューを全て統合
        let total = [...qs.pre, ...qs.after];
        total.forEach(queue => {
            // 行動ガードのセット
            setActGuard(queue);
            // 行動キャンセルのセット
            setActCancel(queue);
        });
        // かばう発動者の選択
        subQueue = choiceSubstituteUser(total);
        // かばう発動時は
        if (subQueue) {
            // リアクション番号の処理(先行)
            processReactionNo(subQueue, subQueue.user);
            // かばうの処理
            processSubstitute(subQueue);
        }
        // 敵バトルウェイト率を取得
        let battleWaitRate = 100;
        total.forEach(queue => {
            battleWaitRate = Math.min(battleWaitRate, queue.bwReviseOpp != null ? queue.bwReviseOpp : 100);
        });
        BattleWaitRateOpp = battleWaitRate;
        // 前リアクションがないときのみ敵バトルウェイト補正の適用
        if (!qs.pre.length) {
            applyBattleWaitRate(BattleWaitRateOpp);
        }
    };

    //- 発動打ち止めの処理-先行
    function processStopsAfter_advance() {
        const qs = ReactionQueues;
        let stopBattlers = [];
        qs.pre.forEach((queue, i) => {
            if (isStopBattler(queue.user, stopBattlers) && isAdvanceReaction(queue)) { qs.pre[i] = null; }
            if (queue.stopsAfter) { stopBattlers.push(queue.user); }
        });
        qs.after.forEach((queue, i) => {
            if (isStopBattler(queue.user,  stopBattlers) && isAdvanceReaction(queue)) { qs.after[i] = null; }
            if (queue.stopsAfter) { stopBattlers.push(queue.user); }
        });
        qs.pre = qs.pre.filter(queue => queue);
        qs.after = qs.after.filter(queue => queue);
    };

    //- リアクション打ち止めバトラーか
    function isStopBattler(battler, stopBattlers) {
        if (!stopBattlers.length) { return; }
        for (let stopBattler of stopBattlers) {
            if (isSameBattler(battler, stopBattler)) { return true; }
        };
        return false;
    };

    //- 重複リアクションの削除-先行
    function delDuplicateReaction_advance() {
        const qs = ReactionQueues;
        let stopReactions = [];
        qs.pre.forEach((queue, i) => {
            if (isDuplicateReaction(queue, stopReactions)) { qs.pre[i] = null; }
            if (isAdvanceReaction(queue)) { stopReactions.push({ user:queue.user, reaction:queue.reaction }); }
        });
        qs.after.forEach((queue, i) => {
            if (isDuplicateReaction(queue, stopReactions)) { qs.after[i] = null; }
            if (isAdvanceReaction(queue)) { stopReactions.push({ user:queue.user, reaction:queue.reaction }); }
        });
        qs.pre = qs.pre.filter(queue => queue);
        qs.after = qs.after.filter(queue => queue);
    };

    //- 重複リアクションか
    function isDuplicateReaction(queue, stopReactions) {
        if (!stopReactions.length) { return; }
        for (let stopReaction of stopReactions) {
            if (isSameBattler(queue.user, stopReaction.user) && queue.reaction == stopReaction.reaction) { return true; }
        };
        return false;
    };

    //- 行動ガードのセット
    function setActGuard(queue) {
        if (!queue.actGuard || queue.actCancel) { return; }
        const subject = queue.subject;
        const user = queue.user;
        // 行動者にガードされるバトラーをセット
        if (!subject._isGuardedBattlersKe) { subject._isGuardedBattlersKe = []; }
        subject._isGuardedBattlersKe.push(battlerToData(user));
    };

    //- 行動ガードされるか
    function isActGuarded(subject, target) {
        if (!subject._isGuardedBattlersKe || !subject._isGuardedBattlersKe.length) { return false; }
        return subject._isGuardedBattlersKe.find(battlerData => isSameBattler(dataToBattler(battlerData), target));
    };

    //- 行動キャンセルのセット
    function setActCancel(queue) {
        if (!queue.actCancel) { return; }
        // 行動者に行動キャンセルをセット
        queue.subject._isActCancelKe = true;
    };

    //- 行動キャンセルか
    function isActCancel(subject) {
        if (subject && subject._isActCancelKe) {
            return true;
        };
        return false;
    };


    //- 先行判定リアクションか
    function isAdvanceReaction(queue) {
        return queue.actGuard || queue.actCancel || queue.isSubstitute;
    };



    //==================================================
    //-- かばうの処理
    //==================================================

    // かばう発動者の選択
    function choiceSubstituteUser(total) {
        let subQueue = null;
        // かばう可能キューを取得
        const subs = total.filter(queue => queue.isSubstitute && isNeedSubstitute(queue.subject, queue.subTarget));
        // ガード者を優先的に取得
        subQueue = subs.find(queue => queue.actGuard);
        // かばうキューを取得
        if (!subQueue) { subQueue = subs[0]; }
        // 選んだ以外のかばうキューは消去する
        const qs = ReactionQueues;
        qs.pre.forEach((queue, i) => {
            if (queue.isSubstitute && queue != subQueue) {
                qs.pre[i] = null;
            }
        });
        qs.after.forEach((queue, i) => {
            if (queue.isSubstitute && queue != subQueue) {
                qs.after[i] = null;
            }
        });
        qs.pre = qs.pre.filter(queue => queue);
        qs.after = qs.after.filter(queue => queue);
        /*delQueues = total.filter(queue => queue.isSubstitute && queue != subQueue);
        delQueues.forEach(queue => {
            queue.stops = true;
        });*/
        return subQueue;
    };
    
    //- かばうの処理
    function processSubstitute(queue) {
        const user = queue.user;
        const subTarget = queue.subTarget;
        const actionName = queue.action.item() ? queue.action.item().name : "";
        const bm = BattleManager;
        // かばう発動者のセット
        setSubUser(user, subTarget, queue.attractsAnime, queue);
        // かばう対象のセット
        setSubTarget(user, subTarget, queue);
        // RA中ステートの適用
        applyReactionState(queue, true);
        // 純かばう時のみの処理
        if (!queue.actGuard && !queue.actCancel) {
            // かばうポップを表示
            if (queue.substitutePop) {
                const subText = queue.substitutePop ? queue.substitutePop.format(user.name(), actionName, subTarget.name()) : "";
                createPopSprite(user, queue, subText);
            }
            // かばうログを表示
            if (queue.substituteLog) {
                bm._logWindow.addText(queue.substituteLog.format(user.name(), actionName, subTarget.name()));
            }
            // フリーアニメ・スキルの実行
            doFreeAnimeSkill(user, subTarget, queue);
            // ポップ表示済みフラグをオン
            queue.poped = true;
        }
    };
    
    //- かばうが必要か
    function isNeedSubstitute(subject, subTarget) {
        // かばう対象が防御中ならfalse
        //if (subTarget.isGuard()) { return false; }
        // かばう対象が行動ガードするならfalse
        if (isActGuarded(subject, subTarget)) { return false; }
        // 行動キャンセルならリターン
        if (isActCancel(subject)) { return; }
        // かばう対象をかばう者がいるならfalse
        if (subTarget._subUserKe) { return false; }
        return true;
    };

    //- かばう発動者のセット
    function setSubUser(subject, target, attractsAnime, queue) {
        target._subUserKe = { battlerData:battlerToData(subject), attractsAnime:attractsAnime, reactionNo:queue.reactionNo };
    };
    
    //- かばう対象のセット
    function setSubTarget(subject, target, queue) {
        // 移動用
        if (!subject._subTargetPacksKe) { subject._subTargetPacksKe = []; }
        subject._subTargetPacksKe.unshift({ battlerData:battlerToData(target), x:queue.subX, y:queue.subY, moveTime:queue.subMoveTime, keepTime:queue.subKeepTime });
    };
    
    //- かばうの適用
    function applySubstitute(subject, target) {
        if (!target._subUserKe) { return target; }
        //if (!isConflictBattler(subject, target)) { return target; }
        const subUser = target._subUserKe;
        // ターゲットを変更
        const newTarget = dataToBattler(subUser.battlerData);
        // かばう発動者が行動阻害中ならリターン
        if (!newTarget.isAlive() || newTarget.isRestricted()) { return target; }
        target = newTarget;
        return target;
    };


    //- スブライトアクター/対象位置の更新(処理追加)
    const _Sprite_Actor_updateTargetPosition = Sprite_Actor.prototype.updateTargetPosition;
    Sprite_Actor.prototype.updateTargetPosition = function() {
        // かばう中の移動-アクター
        if (moveInSubstitute_actor(this)) { return; }

        _Sprite_Actor_updateTargetPosition.apply(this);
    };

    //- かばう中の移動-アクター
    function moveInSubstitute_actor(actorSprite) {
        const actor = actorSprite._actor;
        if (!actor || !actor._subTargetPacksKe || !actor._subTargetPacksKe.length) { return false; }
        // 移動させる
        const subData = actor._subTargetPacksKe[0];
        const subTarget = dataToBattler(subData.battlerData);
        const subSprite = searchSpriteBattler(subTarget);
        const x = subSprite.x - actorSprite._homeX + subData.x;
        const y = subSprite.y - actorSprite._homeY + subData.y;
        actorSprite.startMove(x, y, subData.moveTime);
        return true;
    };


    //- スブライトエネミー/位置の更新(処理追加)
    const _Sprite_Enemy_updatePosition = Sprite_Enemy.prototype.updatePosition;
    Sprite_Enemy.prototype.updatePosition = function() {
        _Sprite_Enemy_updatePosition.apply(this);

        // かばう中の移動-敵キャラ
        moveInSubstitute_enemy(this);
    };
    
    //- かばう中の移動-敵キャラ
    function moveInSubstitute_enemy(enemySprite) {
        const enemy = enemySprite._enemy;
        if (!enemy || !enemy.isSpriteVisible() || enemySprite.isMoving()) { return; }
        // かばう移動済みの時はリターン
        if (enemySprite._subMovedKe == 1) { return; }
        if (!enemy._subTargetPacksKe || !enemy._subTargetPacksKe.length) { return; }
        // 移動させる
        const subData = enemy._subTargetPacksKe[0];
        const subTarget = dataToBattler(subData.battlerData);
        const subSprite = searchSpriteBattler(subTarget);
        const x = subSprite.x - enemySprite._homeX + subData.x * -1;
        const y = subSprite.y - enemySprite._homeY + subData.y;
        enemySprite.startMove(x, y, subData.moveTime);
        // 敵キャラのみの再チルドとかばう移動フラグを進める
        enemySprite.parent.addChild(enemySprite);
        enemySprite._subMovedKe = 1;
        return true;
    };


    //- かばうの解除
    function remSubstitute(battler) {
        if (!battler._subTargetPacksKe || !battler._subTargetPacksKe.length) { return; }
        // かばう対象の発動者変数を削除
        battler._subTargetPacksKe.forEach(pack => {
            const target = dataToBattler(pack.battlerData);
            // かばう発動者の終了処理
            const subUser = target._subUserKe;
            if (subUser) {
                // リアクション番号の消去
                delReactionNo(subUser.reactionNo, dataToBattler(subUser.battlerData));
            }
            target._subUserKe = null;
        });
        // かばう発動者の対象変数を削除
        battler._subTargetPacksKe = null;
        // かばう戻り移動-フルアニメ
        moveBackSubstituteFullAnime(battler);
        // かばう戻り移動-敵キャラ
        moveBackSubstituteEnemy(battler);
    };

    //- かばう戻り移動-フルアニメ
    function moveBackSubstituteFullAnime(battler) {
        // フルアニメ顔移動の開始
        startFaceMoveFullAnime(battler, 0, 0, keke_subMoveTime);
    };

    //- かばう戻り移動-敵キャラ
    function moveBackSubstituteEnemy(enemy) {
        if (!enemy._enemyId) { return; }
        const enemySprite = searchSpriteBattler(enemy);
        if (!enemySprite || enemySprite._subMovedKe != 1) { return; }
        enemySprite.startMove(0, 0, keke_subMoveTime);
        enemySprite._subMovedKe = 2;
    };


    //- スブライトエネミー/移動終了時の処理(処理追加)
    if (Sprite_Enemy.prototype.onMoveEnd == Sprite_Battler.prototype.onMoveEnd) {
        Sprite_Enemy.prototype.onMoveEnd = function() {
            Sprite_Battler.prototype.onMoveEnd.call(this);
        };
    }
    const _Sprite_Enemy_onMoveEnd = Sprite_Enemy.prototype.onMoveEnd;
    Sprite_Enemy.prototype.onMoveEnd = function() {
        _Sprite_Enemy_onMoveEnd.apply(this);

        // かばう移動から戻ったときに、
        if (this._subMovedKe == 2) {
            // 敵キャラスプライトの再チルド
            rechildEnemySprite();
            // かばう移動フラグを初期化
            this._subMovedKe = null;
        }
    };

    //- 敵キャラスプライトの再チルド
    function rechildEnemySprite() {
        const spriteset = SceneManager._scene._spriteset;
        for (const sprite of  spriteset._enemySprites) {
            spriteset._battleField.addChild(sprite);
        }
    };

    //- スブライトアクター/メイン更新(処理追加)
    const _Sprite_Battler_updateMain = Sprite_Battler.prototype.updateMain;
    Sprite_Battler.prototype.updateMain = function() {
        _Sprite_Battler_updateMain.apply(this);

        // かばう中の移動-フルアニメ
        moveInSubstitute_fullAnime(this);
    };

    //- かばう中の移動-フルアニメ
    function moveInSubstitute_fullAnime(battlerSprite) {
        const battler = battlerSprite._battler;
        if (!battler._subTargetPacksKe || !battler._subTargetPacksKe.length) { return; }
        const asi = getFullAnimeStatusAsi(battler);
        if (!asi || isFullAnimeMoving(battler)) { return; }
        const subData = battler._subTargetPacksKe[0];
        const subTarget = dataToBattler(subData.battlerData);
        const subFaceBase = getFullAnimeStatusAsi(subTarget).faceBaseSprite;
        const x = (subFaceBase.x + subData.x * (battler._enemyId ? -1 : 1)) - asi.faceHomeX;
        const y = (subFaceBase.y + subData.y) - asi.faceHomeY;
        // フルアニメ顔移動の開始
        startFaceMoveFullAnime(battler, x, y, subData.moveTime);
    };

    //- かばう時のアニメ引き付け
    const _Window_BattleLog_showAnimation = Window_BattleLog.prototype.showAnimation;
    Window_BattleLog.prototype.showAnimation = function(subject, targets, animationId) {
        targets = targets.map(battler => {
            if (battler && battler._subUserKe && battler._subUserKe.attractsAnime) {
                return dataToBattler(battler._subUserKe.battlerData);
            };
            return battler;
        });

        _Window_BattleLog_showAnimation.apply(this, arguments);
    };



    //==================================================
    //-- リアクションの更新
    //==================================================

    //- バトルマネージャー/イベントの更新(処理追加);
    const _BattleManager_updateEvent = BattleManager.updateEvent;
    BattleManager.updateEvent = function() {
        if (ReactionQueues.on && (this._phase.match(/turn|start/)) && !CurrentQueue) {
            // リアクションキューの実行
            reactioned = doReactionQueue();
            return true;
        }

        return _BattleManager_updateEvent.apply(this);
    };

    //- バトルマネージャー/フェイズの更新(処理追加)
    /*const _BattleManager_updatePhase = BattleManager.updatePhase;
    BattleManager.updatePhase = function(timeActive) {
        let reactioned = false;
        if (ReactionQueues.on && (this._phase.match(/turn|start/)) && !CurrentQueue) {
            // リアクションキューの実行
            reactioned = doReactionQueue();
        }

        // リアクション発動直後はターンとアクションの処理を飛ばす
        if (!(reactioned && this._phase.match(/turn|action/i))) {
            _BattleManager_updatePhase.apply(this, arguments);
        }
    };*/

    //- リアクションキューの実行
    function doReactionQueue() {
        // キューの取り出し
        const queue = pickoutQueue();
        if (!queue) { return false; }
        const user = queue.user;
        const action = queue.action;
        const bm = BattleManager;
        // リアクションの実行判定2。falseなら次のキューへ
        if (!judgeReaction2(queue, queue.subject, user, action, queue.subTarget)) { nextQueue(queue);  return true; }
        // 発動打ち止めの処理
        processStopAfter(queue);
        // 重複リアクションの削除
        delDuplicateReaction(queue);
        // 発動者のリアクション実行中フラグをオン
        user._doingReactionKe = queue.action;
        // リアクション番号の処理
        processReactionNo(queue, user);
        // コストの消費
        consumeCost(user, queue);
        // RA中ステートの適用
        applyReactionState(queue);
        // リアクションを開始
        let target = null;
        if (action.item()) {
            // リアクションの対象をセット
            if (action.isForOne()) {
                if (action.isForOpponent()) {
                    target = queue.subject;
                    action.setTarget(target.index());
                } else if  (action.isForFriend() && !action.isForUser()){
                    target = queue.subTarget || queue.user;
                    action.setTarget(target.index());
                }
            }
            // 自分バトルウェイト補正の適用
            applyBattleWaitRate(queue.bwReviseSelf);
            // ログ技名を適用
            let oriSkillName = "";
            if (queue.logSkillName) {
                oriSkillName = action.item().name;
                action.item().name = queue.logSkillName;
            }
            // アクションと行動者をセット
            user._actions.unshift(action);
            bm._subject = user;
            // スキルのコストなしフラグ
            user._noCostKeRask = !queue.payCost;

            // アクションの開始
            bm.startAction();

            // アクションを消去
            user.removeCurrentAction();
            // コストなしフラグを初期化
            user._noCostKeRask = null;
            // HPMPTPをマイナスにしない処理
            user._hp = Math.max(user._hp, 0);
            user._mp = Math.max(user._mp, 0);
            user._tp = Math.max(user._tp, 0);
            // 少し遅らせて技名を戻す
            if (queue.logSkillName) {
                setTimeout(restoreSkillName, 0, action, oriSkillName);
            }
        }
        // リアクションのセット
        setReaction(queue, action, user, target);
        return true;
    };

    //- 技名を戻す
    function restoreSkillName(action, oriSkillName) {
        action.item().name = oriSkillName;
    };

    //- キューの取り出し
    function pickoutQueue() {
        if (!ReactionQueues.on) { return; }
        let queue = null;
        // 前リアクション
        if (ReactionQueues.pre.length) {
            queue = ReactionQueues.pre.shift();
        }
        // 後リアクション
        if (!WaitingSubject) {
            if (!queue && ReactionQueues.after.length) {
                queue = ReactionQueues.after.shift();
            }
        }
        // キューが空になったらオフ
        if (!ReactionQueues.pre.length && !ReactionQueues.after.length) {
            ReactionQueues.on = false;
        }
        return queue;
    };
    
    //- 次のキューへ
    function nextQueue(queue) {
        const phase = queue.timing == "前" ? "pre" : "after";
        const length = ReactionQueues[phase].length;
        // キューが残っていれば次のキューへ
        if (length) {
            doReactionQueue();
        // 残っていなければリアクションを終了
        } else {
            if (queue.timing == "前") { queue.pre = 2;} else
            { queue.after = 2; }
            CurrentQueue = queue;
            // リアクションの終了
            endReaction(true);
        } 
    };

    //- 発動打ち止めの処理
    function processStopAfter(currentQueue) {
        if (!currentQueue.stopsAfter) { return; }
        const stopBattler = currentQueue.user;
        ReactionQueues.pre = ReactionQueues.pre.filter(queue => !isSameBattler(queue.user, stopBattler));
        ReactionQueues.after = ReactionQueues.after.filter(queue => !isSameBattler(queue.user, stopBattler));
    };

    //- 重複リアクションの削除
    function delDuplicateReaction(currentQueue) {
        const stopBattler = currentQueue.user;
        ReactionQueues.pre = ReactionQueues.pre.filter(queue => !(isSameBattler(queue.user, stopBattler) && queue.reaction == currentQueue.reaction));
        ReactionQueues.after = ReactionQueues.after.filter(queue => !(isSameBattler(queue.user, stopBattler) && queue.reaction == currentQueue.reaction));
    };

    //- リアクション番号の処理
    function processReactionNo(queue, user) {
        // キューに番号セット済みならリターン
        if (queue.reactionNo) { return; }
        // 発動者のリアクション番号を進める
        if (!user._reactionNoKe) { user._reactionNoKe = 0; }
        user._reactionNoKe++;
        // キューにリアクション番号をセット
        queue.reactionNo = user._reactionNoKe;
        // 発動者の実行中リアクションとしてリアクション番号を追加
        if (!user._inReactionsKe) { user._inReactionsKe = []; }
        user._inReactionsKe.push(user._reactionNoKe);
    };

    //- コストの消費
    function consumeCost(user, queue) {
        if (queue.hpCost) { user._hp -= queue.hpCost; }
        if (queue.mpCost) { user._mp -= queue.mpCost; }
        if (queue.tpCost) { user._tp -= queue.tpCost; }
    };

    //- RA中ステートの適用
    function applyReactionState(queue, keep) {
        // 自分
        if (queue.stateSelf && !queue.user.isStateAffected(queue.stateSelf)) {
            queue.user.addState(queue.stateSelf);
            ReactionStates.push({ target:queue.user, stateId:queue.stateSelf, keep:keep });
        }
        // 相手
        if (queue.stateOpp && !queue.subject.isStateAffected(queue.stateOpp)) {
            queue.subject.addState(queue.stateOpp);
            ReactionStates.push({ target:queue.subject, stateId:queue.stateOpp, keep:keep });
        }
    };

    //- リアクションのセット
    function setReaction(...args) {
        const logWindow = SceneManager._scene._logWindow;
        logWindow.push("runReactionKe", ...args);
    };


    //- リアクションの起動
    Window_BattleLog.prototype.runReactionKe = function(...args) {
        invokeReaction(...args);
    };

    //- リアクションの発動
    function invokeReaction(queue, action, user, target) {
        const bm = BattleManager;
        // 現在のキューをセット
        CurrentQueue = queue;
        // アクションのアイコン番号を取得
        const iconIndex = action.item() ? action.item().iconIndex : 0;
        // ポップアップを表示
        const actionName = action.item() ? action.item().name : "";
        if (!queue.poped) {
            // かばうポップを表示
            if (queue.substitutePop) {
                const subText = queue.substitutePop ? queue.substitutePop.format(user.name(), actionName, queue.subTarget.name()) : "";
                createPopSprite(user, queue, subText, iconIndex);
            // リアクションポップを表示
            } else if (queue.reactionPop) {
                const reactText = queue.reactionPop ? queue.reactionPop.format(user.name(), actionName) : "";
                createPopSprite(user, queue, reactText, iconIndex);
            }
            // かばうログを表示
            if (queue.substituteLog) {
                bm._logWindow.addText(queue.substituteLog.format(user.name(), actionName, queue.subTarget.name()));
            // リアクションログを表示
            } else if (queue.reactionLog) {
                bm._logWindow.addText(queue.reactionLog.format(user.name(), actionName));
            }
        }
        // フリーアニメ・スキルの実行
        if (action.item()) { doFreeAnimeSkill(user, target, queue); }
        // リアクションフラグを進める
        if (queue.pre) { queue.pre = 3; } else
        if (queue.after) { queue.after = 3; }
        // アクションがない場合はすぐにリアクションの終了
        if (!action.item()) {
            endReaction();
        }
    };

    //- バトルウェイト補正の適用
    function applyBattleWaitRate(rate) {
        if (!isSpeedStar()) { return; }
        const bm = BattleManager;
        bm._battleWaitRateKeRask = (rate == null || rate == 100) ? null : rate / 100;
    };



    //==================================================
    //--  リアクションの終了
    //==================================================
    
    //- リアクションの終了
    function endReaction(end, endSubject) {
        // バトル終了チェック
        if (checkBattleEnd()) { return; };
        // 現在のキューがなければリターン
        if (!CurrentQueue) { return; }
        const queue = CurrentQueue;
        // 前リアクションの終了
        endPreReaction(queue, endSubject);
        // 後リアクションの終了
        endAfterReaction(queue);
        // リアクション中フラグの解除
        remDoingReaction(queue, queue.user);
        // リアクション番号の消去
        delReactionNo(queue.reactionNo, queue.user, queue.subject) 
        // リアクションポップ中フラグの解除
        //remInReactionPop();
        // 発動者のアクションステートを戻す
        /*if (!(BattleManager.isTpb() && queue.oriActionState == "undecided" && queue.user._tpbTurnEnd)) {
            queue.user._actionState = queue.oriActionState;
        }*/
        // リアクション発動者を行動者から削除
        if (isSameBattler(BattleManager._subject, queue.user)) { BattleManager._subject = null };
        // フェイズをターンに変更
        BattleManager._phase = "turn";
        // 全て終了
        if (!CurrentQueue && !ReactionQueues.on) {
            // リアクションステータスの解除
            remReactionStatus();
        }
    };

    //- リアクション中フラグの解除
    function remDoingReaction(queue, user) {
        user._doingReactionKe = null;
    };

    //- リアクション番号の消去
    function delReactionNo(reactionNo, user) {
        if (!user._inReactionsKe) { return; }
        user._inReactionsKe.remove(reactionNo);
    };
    
    //- バトル終了チェック
    function checkBattleEnd() {
        if (!$gameTroop.isAllDead() && !$gameParty.isAllDead()) { return false; }
        // リアクションキューの初期化
        initReactionQueue();
        // リアクションポップ中フラグの解除
        //remInReactionPop();
        BattleManager._phase = "turnEnd";
        BattleManager._subject = null;
        return true;
    };

    
    //- 前リアクションの終了
    function endPreReaction(queue, endSubject) {
        if (!queue.pre || queue.pre <= 1) { return; }
        // 本来の行動者のアクション後の終了
        if (queue.pre == 4 || (endSubject && endSubject == queue.subject)) {
            // 現在のキューを終了
            CurrentQueue = null;
            // 行動者の行動待ちフラグを解除
            WaitingSubject = null;
            return;
        };
        // RA中ステートの解除
        //remReactionState();
        //  前キューがなくなったら
        if (!ReactionQueues.pre.length) {
            // 前リアクションフラグを進める
            queue.pre = 4;
            // 本来のアクションの復元
            const restored = restoreOriAction(queue);
            // 復元したら現在のキューを終了せずに次のキューを飛ばす
            if (restored) {
                return;
            }
        }
        // 現在のキューを終了
        CurrentQueue = null;
    };

    //- 本来のアクションの復元
    function restoreOriAction(queue) {
        if (!OriSubject) { return false; }
        const subject = OriSubject;
        const ori = queue.ori;
        // 本来の行動者を行動者に戻す
        BattleManager._subject = subject;
        // 行動キャンセルの処理
        if (isActCancel(subject) || !subject.isAlive() || !subject.canMove()) {
            // 行動キャンセルを解除
            subject._isActCancelKe = null;
            // 行動者の行動待ちフラグを解除
            WaitingSubject = null;
            // 行動者のアクションを戻して減らす
            subject._actions = ori.actions;
            subject.removeCurrentAction();
            //subject.setActionState("acting");
            if (!subject.numActions()) {
                BattleManager.endBattlerActions(subject);
            }
            return false;
        // アクションを復元
        } else if (ori.actions.length) {
            subject._actions = ori.actions;
            subject._throughReactionKe = true;
            // 敵バトルウェイト補正の適用
            applyBattleWaitRate(BattleWaitRateOpp);
        }
        return true;
    };

    
    //- 後リアクションの終了
    function endAfterReaction(queue) {
        if (!queue.after || queue.after <= 1) { return; }
        // RA中ステートの解除
        //remReactionState();
        // 複数回行動なら本来の行動者に戻す
        if (OriSubject) {
            if (OriSubject.isAlive() && OriSubject.numActions() && OriSubject.isActing()) {
                BattleManager._subject = OriSubject;
            } else if (OriSubject.isActing()) {
                BattleManager.endBattlerActions(OriSubject);
            }
        }
        // 現在のキューを終了
        CurrentQueue = null;
    };


    //- リアクションステータスの解除
    function remReactionStatus(subject) {
        subject = subject || OriSubject;
        // 本来の行動者の処理
        if (subject) {
            // リアクション受け中フラグを初期化
            subject._takingReactionKe = null;
            // ガードされるバトラーを初期化
            subject._isGuardedBattlersKe = null;
            // 行動キャンセルフラグを初期化
            subject._isActCancelKe = null;
        }
        // RA中ステートの解除(強制)
        remReactionState(true);
        // 全てのリアクションバトラーを処理
        ReactionBattlers.forEach(battler => {
            // かばうの解除
            remSubstitute(battler);
        });
        // リアクション用ファイル変数の初期化
        initReactionFileMembers();
    };

    //- RA中ステートの解除
    function remReactionState(force) {
        if (!ReactionStates || !ReactionStates.length) { return; }
        ReactionStates.forEach((d, i) => {
            if (d.keep && !force) { return; }
            d.target.removeState(d.stateId);
            ReactionStates[i] = null;
        });
        ReactionStates = ReactionStates.filter(d => d);
    };


    //- ゲームアクション/ターゲットの作成(処理追加)
    const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
    Game_Action.prototype.makeTargets = function() {
        // 作成したターゲットを復元
        if (this._targetsKeRask) {
            return this._targetsKeRask.map(d => dataToBattler(d));
        }
        // バグ防止。アイテムがなかったらリターン
        //if (!this.item()) { return; }

        return _Game_Action_makeTargets.apply(this);
    };
    
    
    //- バトルマネージャー/アクション終了時の処理(処理追加)
    const _BattleManager_endBattlerActions = BattleManager.endBattlerActions;
    BattleManager.endBattlerActions = function(battler) {
        // リアクションの場合は実行しない
        if (this._action && this._action._isReactionKe) { return; }

        _BattleManager_endBattlerActions.apply(this, arguments);
    };


    //- ゲームパーティ/バトル終了時の処理
    const _Game_Party_onBattleEnd = Game_Party.prototype.onBattleEnd;
    Game_Party.prototype.onBattleEnd = function() {
        _Game_Party_onBattleEnd.apply(this);

        // リアクション用ファイル変数の初期化
        initReactionFileMembers();
        // RA中ステートの解除
        remReactionState();
        // リアクション変数を初期化
        this.allMembers().forEach(battler => {
            // かばうの解除
            remSubstitute(battler);
            // リアクション変数の初期化
            initReactionMembers(battler)
        });
    };



    //==================================================
    //--  リアクションに伴う処理
    //==================================================

    //- ゲームバトラー/アイテムの消費(処理追加)
    const _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        // コストなしを適用
        if (this._noCostKeRask) { return; }

        _Game_Battler_useItem.apply(this, arguments);
    };


    //- ゲームバトラー/アクション開始時の処理(処理追加)
    const _Game_Battler_performActionStart = Game_Battler.prototype.performActionStart;
    Game_Battler.prototype.performActionStart = function(action) {
        // リアクション中はアクションステートを変更しない
        const oriActionState = this._actionState;

        _Game_Battler_performActionStart.apply(this, arguments);

        if (this._doingReactionKe) {
            this._actionState = oriActionState;
        }
    };


    //- フリーアニメ・スキルの実行
    function doFreeAnimeSkill(subject, target, queue) {
        if (!isFreeAnime() || !queue.freeAnime) { return; }
        // アニメファイルとコモンを取得
        const metaList = metaAll(queue.freeAnime, ["フリーアニメ", "freeAnime"]);
        if (!metaList || !metaList.length) { return; }
        metaList.forEach(meta => {
            //フリーアニメ・スキルの実行-個別
            BattleManager.doFreeAnimeSkillKe(meta, subject, [target]);
        });
    };

    //- バトルマネージャー/TPBバトラーの更新(処理追加)
    const _BattleManager_updateTpbBattler = BattleManager.updateTpbBattler;
    BattleManager.updateTpbBattler = function(battler) {
        // 行動中で止まってしまうバグ防止
        if (battler._tpbState == "acting" && battler._actionState.match(/waiting|undecided/i) && !battler._actions.length) {
           battler.clearTpbChargeTime();
        }
        
        _BattleManager_updateTpbBattler.apply(this, arguments);
    };

    
    
    //==================================================
    //--  リアクションポップ
    //==================================================
    
    //- ポップスプライトの形成
    function createPopSprite(battler, cfg, text, iconIndex) {
        if (cfg.popInvalid) { return; }
        if (!PopBattlers.some(b => isSameBattler(b, battler))) { PopBattlers.push(battler); }
        const asi = getFullAnimeStatusAsi(battler);
        const fast = getFullAnimeStatus();
        let viewer = null;
        let lastPop = {};
        // フルアニメ
        if (asi) {
            viewer = asi;
            lastPop = asi.damages[asi.damages.length - 1] || {};
            // ダメージスプライトの破棄
            if (!(lastPop && (lastPop._isSkillPopKe || lastPop._reactionNoKe))) {
                viewer.damages.forEach(d => setDestroyDamage(fast, d, asi));
                viewer.damages = [];
            }
        // 通常
        } else {
            // バトラースプライトの取得
            viewer = searchSpriteBattler(battler);
            if (!viewer) { return; }
            lastPop = viewer._damages[viewer._damages.length - 1] || {};
            // ダメージスプライトの破棄
            if (!(lastPop && (lastPop._isSkillPopKe || lastPop._reactionNoKe))) {
                viewer._damages.forEach(d => setDestroyDamage(fast, d));
                viewer._damages = [];
            }
        }
        // ダメージスプライトの形成
        PopText = text;
        PopIconIndex = iconIndex && keke_showIcon ? iconIndex : 0;
        PopFontFace = cfg.popFontFace;
        const eachSize = cfg.popFontEachSize;
        const baseSize = cfg.popFontBaseSize;
        PopFontSize = eachSize;
        PopFontColor = cfg.popFontColor;
        PopOutW = cfg.popOutW;
        PopOutColor = cfg.popOutColor;
        const sizeOffset = eachSize && baseSize ? Math.max(eachSize - baseSize, 0) : 0;
        PopPadding = PopFontSize + keke_paddingOffset + sizeOffset;
        PopTime = keke_popShowTime;
        PopAnime = cfg["出現アニメ"] || keke_appearAnimeBasic; 
        // フルアニメの形成
        let newPop = null;
        if (viewer.isAsi) {
            fast.createDamageSprite(battler, viewer, null, "reaction");
            newPop = asi.damages[asi.damages.length - 1] || {};
        // 通常の形成
        } else {
            viewer.createDamageSprite();
            newPop = viewer._damages[viewer._damages.length - 1] || {};
            // 画面外に出さない
            const startX = viewer.x + viewer.damageOffsetX();
            const startY = viewer.y + viewer.damageOffsetY();
            noOutScreen(newPop, newPop._widthKe, newPop._heightKe, startX, startY);
        }
        PopText = "";
        PopFontFace = null;
        PopFontSize = null;
        PopFontColor = null;
        PopOutW = null;
        PopOutColor = null;
        PopPadding = null;
        PopTime = null;
        PopAnime = null;
        // スプライトにリアクション番号をセット
        newPop._reactionNoKe = cfg.reactionNo;
        // 最初の位置を保存
        newPop._oriXKe = newPop.x;
        newPop._oriYKe = newPop.y;
    };

    // ダメージポップ破棄のセット
    function setDestroyDamage(body, damage, asi) {
        const time = Math.round(damage._duration / 60 * 1000);
        setTimeout(destroyDamage, time, body, damage, asi);
    };

    // ダメージポップの破棄
    function destroyDamage(body, damage, asi) {
        if (!body) { return; }
        body.destroyDamageSprite(damage, asi);
    };


    //- スプライトダメージ/セットアップ(処理追加)
    const _Sprite_Damage_setup = Sprite_Damage.prototype.setup ;
    Sprite_Damage.prototype.setup = function(target) {
        // バトラーを保存
        this._battlerKe = target;
        // テキストポップの形成
        if (PopText) {
            createTextPop(this, PopText);
            // 行間と表示時間を変更
            if (PopPadding) { this._popPaddingKeRask = PopPadding; }
            if (PopTime) { this._duration = PopTime; }
            // 出現アニメの開始
            if (PopAnime) {
                startAppearAnime(this, PopAnime)
            }
            return;
        }

        _Sprite_Damage_setup.apply(this, arguments);
    };
    
    //- スプライトダメージ/更新(処理追加)
    const _Sprite_Damage_update = Sprite_Damage.prototype.update;
    Sprite_Damage.prototype.update = function() {
        // バトル終了時はすぐ消す
        if (this._reactionNoKe && BattleManager._phase == "battleEnd") {
            this._duration = 1;
        }
        // 出現アニメの更新
        if (this._reactionNoKe && updateAppearAnime(this)) {
            return;
        }

        _Sprite_Damage_update.apply(this);
    };

    //- テキストポップの形成
    function createTextPop(popSprite, text) {
        const fontSize = popSprite.fontSize();
        const ow = popSprite.outlineWidth();
        const h = fontSize + ow * 2;
        let w = measureTextWidth(text, fontSize, popSprite.bitmap) + ow * 2;
        // アイコンを形成
        let iw = 0;
        let ih = 0;
        if (PopIconIndex) {
            const anchorX = popSprite._anchorXKe != null ?  popSprite._anchorXKe :  0.5;
            const iconSprite = createIconSprite(PopIconIndex, 0.5, 1);
            ih = Math.floor(h * keke_iconSize / 100);
            iconSprite.scale.y = ih / ImageManager.iconHeight;
            iconSprite.scale.x = iconSprite.scale.y;
            iw = Math.floor(ImageManager.iconWidth * iconSprite.scale.x);
            w += iw;
            iconSprite.x = -w * anchorX + iw / 2 + ow * (0.5 - anchorX) - keke_iconSpace;
            iconSprite.y = -40;
            iconSprite.ry = iconSprite.y;
            popSprite.addChild(iconSprite);
            iconSprite.dy = 0;
        }
        // テキストを形成
        const textSprite = popSprite.createChildSprite(w + ow, h);
        textSprite.bitmap.drawText(text, 0, ow / 2, w, h, "center");
        textSprite.dy = 0;
        if (iw) { textSprite.x += iw / 2; }
        // サイズを保存
        popSprite._widthKe = w + iw;
        popSprite._heightKe = Math.max(h, ih);
    };
    
    //- 画面外に出さない
    function noOutScreen(sprite, w, h, startX, startY) {
        const overL = sprite.x;
        const overR = sprite.x + w / 2 - Graphics.width;
        const overU = sprite.y - h;
        const overD = sprite.y - Graphics.height;
        if (overL < 0) { sprite.x -= overL; } else
        if (overR > 0) { sprite.x -= overR; }
        if (overU < 0 || overD > 0) {
            sprite.x = startX;
            sprite.y = startY;
        }
    };


    //- スブライトバトラー/ダメージスプライトの形成(処理追加)
    const _Sprite_Battler_createDamageSprite = Sprite_Battler.prototype.createDamageSprite;
    Sprite_Battler.prototype.createDamageSprite = function() {
        const lastPop = this._damages[this._damages.length - 1];

        _Sprite_Battler_createDamageSprite.apply(this);

        // ポップアップの行間調整
        const curPop = this._damages[this._damages.length - 1];
        if (lastPop) {
            const padding = Math.max(curPop._popPaddingKeRask || 0, lastPop._popPaddingKeRask || 0);
            if (padding) {
                curPop.y += 16 - padding;
            }
        }
    };


    //- スブライトアクター/ダメージスプライトの形成(処理追加)
    /*if (Sprite_Actor.prototype.createDamageSprite == Sprite_Battler.prototype.createDamageSprite) {
        Sprite_Actor.prototype.createDamageSprite = function() {
            Sprite_Battler.prototype.createDamageSprite.call(this);
        };
    };
    const _Sprite_Actor_createDamageSprite = Sprite_Actor.prototype.createDamageSprite;
    Sprite_Actor.prototype.createDamageSprite = function() {
        const lastPop = this._damages[this._damages.length - 1];

        _Sprite_Actor_createDamageSprite.apply(this);

        // ポップアップの行間調整
        const curPop = this._damages[this._damages.length - 1];
        if (lastPop) {
            const padding = Math.max(curPop._popPaddingKeRask, lastPop._popPaddingKeRask);
            if (padding) {
                curPop.y += 16 - padding;
            }
        }
    };
    
    //- スブライトエネミー/ダメージスプライトの形成(処理追加)
    if (Sprite_Enemy.prototype.createDamageSprite == Sprite_Battler.prototype.createDamageSprite) {
        Sprite_Enemy.prototype.createDamageSprite = function() {
            Sprite_Battler.prototype.createDamageSprite.call(this);
        };
    };
    const _Sprite_Enemy_createDamageSprite = Sprite_Enemy.prototype.createDamageSprite;
    Sprite_Enemy.prototype.createDamageSprite = function() {
        const lastPop = this._damages[this._damages.length - 1];
        
        _Sprite_Enemy_createDamageSprite.apply(this);

        // ポップアップの行間調整
        const curPop = this._damages[this._damages.length - 1];
        if (lastPop) {
            const padding = Math.max(curPop._popPaddingKeRask, lastPop._popPaddingKeRask);
            if (padding) {
                curPop.y += 16 - padding;
            }
        }
    };*/

    
    //- テキストポップのフォント(処理追加)
    const _Sprite_Damage_fontFace = Sprite_Damage.prototype.fontFace;
    Sprite_Damage.prototype.fontFace = function() {
        if (PopFontFace) { return PopFontFace; }

        return _Sprite_Damage_fontFace.apply(this);
    };

    //- テキストポップの文字サイズ(処理追加)
    const _Sprite_Damage_fontSize = Sprite_Damage.prototype.fontSize;
    Sprite_Damage.prototype.fontSize = function() {
        if (PopFontSize) { return PopFontSize; }

        return _Sprite_Damage_fontSize.apply(this);
    };
    
    //- テキストポップの文字色(処理追加)
    const _Sprite_Damage_damageColor = Sprite_Damage.prototype.damageColor;
    Sprite_Damage.prototype.damageColor = function() {
        if (PopFontColor) { return PopFontColor; }

        return _Sprite_Damage_damageColor.apply(this);
    };
    
    //- テキストポップの縁取り幅(処理追加)
    const _Sprite_Damage_outlineWidth = Sprite_Damage.prototype.outlineWidth;
    Sprite_Damage.prototype.outlineWidth = function() {
        if (PopOutW) { return PopOutW; }

        return _Sprite_Damage_outlineWidth.apply(this);
    };
    
    //- テキストポップの縁取り色(処理追加)
    const _Sprite_Damage_outlineColor = Sprite_Damage.prototype.outlineColor;
    Sprite_Damage.prototype.outlineColor = function() {
        if (PopOutColor) { return PopOutColor; }

        return _Sprite_Damage_outlineColor.apply(this);
    };


    //- スブライトダメージ/破棄(処理追加)
    const _Sprite_Damage_destroy = Sprite_Damage.prototype.destroy;
    Sprite_Damage.prototype.destroy = function() {
        // アイコンビットマップを破棄させない
        for (const child of this.children) {
            if (child.bitmap && child.bitmap._url) {
                 if (child.parent) { child.parent.removeChild(child); }
                child.destroy();
            }
        }
        if (!this._texture) { return; }

        _Sprite_Damage_destroy.apply(this, arguments);
    };


    //- スブライトダメージ/不透明度の更新(処理追加)
    const _Sprite_Damage_updateOpacity = Sprite_Damage.prototype.updateOpacity;
    Sprite_Damage.prototype.updateOpacity = function() {
        // リアクションポップ中フラグ時はポップアップを消さない
        if (subjectInReaction(this, this._battlerKe)) {
            this.opacity = 255;
            return;
        } 

        _Sprite_Damage_updateOpacity.apply(this);
    };

    //- スブライトダメージ/実行中か(処理追加)
    const _Sprite_Damage_isPlaying = Sprite_Damage.prototype.isPlaying;
    Sprite_Damage.prototype.isPlaying = function() {
        // リアクションポップ中フラグ時はポップアップを消さない
        if (subjectInReaction(this, this._battlerKe)) {
            return true;
        }

        return _Sprite_Damage_isPlaying.apply(this);
    };

    //- 本体がリアクション実行中か
    function subjectInReaction(popSprite, battler) {
        if (!battler || !battler._inReactionsKe || !popSprite._reactionNoKe) { return false; }
        return battler._inReactionsKe.includes(popSprite._reactionNoKe);
    };


    //- リアクションポップ中フラグの解除
    /*function remInReactionPop() {
        PopBattlers.forEach(battler => {
            battler._inReactionPopKe = null;
        });
        PopBattlers = [];
    };*/



    //==================================================
    //--  出現アニメ
    //==================================================

    //- 出現アニメの開始
    function startAppearAnime(sprite, animeName) {
        if (!animeName) { return; }
        const drift = {};
        // パラメータ
        const d = keke_appearAnimeList.filter(a => a["アニメ名"] == animeName)[0];
        if (!d || d["無効"]) { return; }
        const timeMax = d["アニメ時間"] || 0;
        if (!timeMax) { return; }
        const scale = d["スケール"];
        const scaleT = d["スケールターン"];
        const opacity = d["フェードイン"];
        const delay = d["ディレイ"];
        const easing = "EO";
        // アニメ時間
        drift.timeMax = timeMax;
        drift.duration = timeMax;
        // ディレイ
        if (delay) {
            drift.delay = delay;
        }
        // スケール
        if (scale != null && scale != 1) {
            // スケールX
            drift.scaleXs = makeDrift([{ val:1, easing:easing }], scale, timeMax, "スケールX");
            sprite.scale.x = scale;
            // スケールY
            drift.scaleYs = makeDrift([{ val:1, easing:easing }], scale, timeMax, "スケールY");
            sprite.scale.y = scale;
        }
        // スケールターン
        if (scaleT != null && scaleT != 1) {
            // スケールXターン
            drift.scaleXTs = makeDrift([{ val:scaleT, easing:"TN" }], 1, timeMax, "スケールXターン");
            // スケールYターン
            drift.scaleYTs = makeDrift([{ val:scaleT, easing:"TN" }], 1, timeMax, "スケールYターン");
        }
        // 不透明度
        if (opacity != null && opacity != 255) {
            drift.opacities = makeDrift([{ val:255, easing:easing }], opacity, timeMax, "不透明度");
            sprite.opacity = opacity;
        }
        // レイヤー
        if (d["上方レイヤー"]) {
            setTimeout(childUpperLayer, 0, sprite);
        }
        // 変数にセット
        sprite._driftKe = drift;
        // 標準のアニメを無効
        const noDefoAnime = keke_noDefoAnime;
        if (noDefoAnime) {
            sprite._noDefoAnimeKe = true;
            sprite.children.forEach(child => {
                child.y = 0;
            });
        }
    };

    //- 上方レイヤーへのチルド
    function childUpperLayer(sprite) {
        if (!sprite || !sprite.transform) { return}
        SceneManager._scene._windowLayer.addChild(sprite);
    };

    //- 変動の作成
    function makeDrift(datas, current, time, word) {
        if (!datas || !datas.length) { return; }
        if (word == "回転角") { current %= 360; }
        let ds = [];
        // データの数だけ処理
        datas.forEach(data => {
            if (data.val == null) { return; }
            const d = {};
            d.num = data.num || 1;
            d.datas = data.datas || ["", ""];
            const extra = data.extra || "";
            d.break = extra.includes("B");
            d.jump = extra.includes("J");
            d.direction = extra.includes("D");
            d.isCos = extra.includes("C");
            d.isRandom = d.datas[1].includes("~");
            d.easing = data.easing || "E";
            d.easingRate = data.easingRate || 1;
            d.timeMax = time / d.num;
            d.duration = d.timeMax;
            d.start = roundDecimal(current, 1000000);
            d.target = Number(data.val);
            d.vol = d.target - d.start;
            d.current = d.start;
            d.end = 0;
            // 終点
            if (d.easing == "TN" || d.easing == "RD") {
                d.end = d.start;
            } else {
                d.end = d.target;
            }
            ds.push(d);
        });
        return ds;
    };


    //- 出現アニメの更新
    function updateAppearAnime(sprite) {
        if (!sprite._driftKe) { return; }
        const drift = sprite._driftKe;
        let scaling = false;
        // ディレイ
        if (drift.delay) {
            drift.delay--;
            if (!drift.delay) {
                sprite.visible = true;
            }
            return true;
        }
        // スケールX
        if (drift.scaleXs && drift.scaleXs.length) {
            let scaleXs = updateDrift(drift.scaleXs, "スケールX");
            scaleXs.forEach(v => sprite.scale.x += v);
            scaling = true;
        }
        // スケールY
        if (drift.scaleYs && drift.scaleYs.length) {
            let scaleYs = updateDrift(drift.scaleYs, "スケールY");
            scaleYs.forEach(v => sprite.scale.y += v);
        }
        // スケールXターン
        if (drift.scaleXTs && drift.scaleXTs.length) {
            let scaleXTs = updateDrift(drift.scaleXTs, "スケールXターン");
            scaleXTs.forEach(v => sprite.scale.x += v);
            scaling = true;
        }
        // スケールYターン
        if (drift.scaleYTs && drift.scaleYTs.length) {
            let scaleYTs = updateDrift(drift.scaleYTs, "スケールYターン");
            scaleYTs.forEach(v => sprite.scale.y += v);
        }
        // 不透明度
        if (drift.opacities && drift.opacities.length) {
            let opacities = updateDrift(drift.opacities, "不透明度");
            opacities.forEach(v => sprite.opacity += v);
        }
        // カウントを減らす
        drift.duration--;
        // 終了
        if (!drift.duration) {
            sprite._driftKe = null;
        }
        // スケールアニメ中の位置補正
        /*if (scaling) {
            // Y位置補正
            sprite.y = sprite._oriYKe + (sprite._heightKe * (sprite.scale.y - 1)) / 2;
            // 画面外に出さない
            sprite.x = sprite._oriXKe;
            noOutScreen(sprite, sprite._widthKe * sprite.scale.x, sprite._heightKe * sprite.scale.y, sprite._oriXKe, sprite._oriYKe);
        }*/
        return true;
    };

    //- 変動の更新
    function updateDrift(ds, word) {
        let rs= []
        // データの数だけ処理
        ds.forEach(d => {
            // カウントを減らす
            d.duration--;
            let r = 0;
            next = applyEasing(d.current, d.start, d.target, d.duration, d.timeMax, d.easing, d.easingRate);
            r = next - d.current;
            d.current = next;
            // 終了
            if (d.duration <= 0) {
                // 終了値に合わせる
                r += roundDecimal(d.end - next, 1000000);
                d.num--;
                d.duration = d.timeMax;
            }
            if (r) { rs.push(r); }
        });
        return rs;
    };


    //- スブライトダメージ/子要素の更新(処理追加)
    const _Sprite_Damage_updateChild = Sprite_Damage.prototype.updateChild;
    Sprite_Damage.prototype.updateChild = function(sprite) {
        // 標準のダメージアニメを無効
        if (this._noDefoAnimeKe) { return; }

        _Sprite_Damage_updateChild.apply(this, arguments);
    };



    //==================================================
    //--  共通処理
    //==================================================
    
    //- バトルマネージャー/スタートアクション(処理追加)
    const _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        // バグ防止(アクションがない時は防御をセット)
        const action = this._subject.currentAction();
        if (!action || !action.item()) {
            const newAction = new Game_Action(this._subject);
            if (!newAction.subject()) { return; }
            newAction.setGuard();
            this._subject._actions[0] = newAction;
        }
        
        // リアクションの開始
        if (startReaction()) { return; };

        _BattleManager_startAction.apply(this);

        // 行動者なら行動待ちフラグを解除
        if (isSameBattler(this._subject, WaitingSubject)) {
            WaitingSubject = null;
        }
    };

    //- バトルマネージャー/エンドアクション(処理追加)
    const _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        const subject = this._subject;

        _BattleManager_endAction.apply(this);

        // リアクションの終了
        endReaction(false, subject);
    };


    //- バトルマネージャー/インヴォークアクション(処理追加)
    const _BattleManager_invokeAction = BattleManager.invokeAction;
    BattleManager.invokeAction = function(subject, target) {
        // スピードスターバトル時の通常インヴォークアクション
        if (isSpeedStar() && !this._invokePopWaitKe) {
            _BattleManager_invokeAction.apply(this, arguments);
            return;
        }

        // かばうの適用
        target = applySubstitute(subject, target);

        // 行動がガードされる時はアクション効果を飛ばす
        if (isActGuarded(subject, target)) {
            // スコア/ガード済みをオン
            onScoreGuarded();
        } else {
            _BattleManager_invokeAction.apply(this, arguments);
        }
    };



    //==================================================
    //--  テキスト基本 /ベーシック
    //==================================================
    
    //- テキスト横幅の測定
    function measureTextWidth(text, fontSize, bitmap) {
        if (!bitmap) { bitmap = new Bitmap(); }
        bitmap.fontSize = fontSize;
        return bitmap.measureTextWidth(text);
    };
    
    //- 文字サイズの取得
    function getFontSize(size) {
        const mainSize = keke_popFontSize || $gameSystem.mainFontSize();
        if (!size) { return mainSize; }
        const sizeStr = size.toString();
        if (sizeStr.includes("+")) {
            const plus = Number(sizeStr.replace("+", ""));
            size = mainSize + plus;
        } else if (sizeStr.includes("-")) {
            const minus = Number(sizeStr.replace("-", ""));
            size = mainSize - minus;
        }
        return Number(size);
    };

    //- 縁取り幅の取得
    function getOutWidth(size) {
        const mainSize = keke_popOutWidth || 3;
        if (!size) { return mainSize; }
        const sizeStr = size.toString();
        if (sizeStr.includes("+")) {
            const plus = Number(sizeStr.replace("+", ""));
            size = mainSize + plus;
        } else if (sizeStr.includes("-")) {
            const minus = Number(sizeStr.replace("-", ""));
            size = mainSize - minus;
        }
        return Number(size);
    };

    //- 小数点を丸める
    function roundDecimal(val, rate) {
        const newVal = Math.floor(val* rate) / rate
        return newVal;
    };



    //==================================================
    //--  バトラー基本 /ベーシック
    //==================================================
    
    //- バトラーをデータへ
    function battlerToData(battler) {
        if (battler._actorId) {
            return { type:"actor", id:battler._actorId, isData:true }
        } else {
            return { type:"enemy", index:battler.index(), isData:true }
        }
    };
    
    //- データをバトラーへ
    function dataToBattler(data) {
        if (data.type == "actor") {
            return $gameParty.allMembers().find(actor => actor._actorId == data.id);
        } else {
            return $gameTroop.members()[data.index];
        }
    };

    //- 同じバトラーか
    function isSameBattler(a, b) {
        if (!a || !b) { return false; }
        if (a.isData) { a = dataToBattler(a); }
        if (b.isData) { b = dataToBattler(b); }
        if (a._actorId) {
            if (!b._actorId) { return false; }
            return a._actorId == b._actorId;
        } else {
            if (!b._enemyId) { return false; }
            return a.index() == b.index();
        }
    };
    
    //- 敵対バトラーか
    function isConflictBattler(a, b) {
        if (!a || !b) { return false; }
        if (a.isData) { a = dataToBattler(a); }
        if (b.isData) { b = dataToBattler(b); }
        if (a._actorId) {
            return b._enemyId;
        } else {
            return b._actorId;
        }
    };

    //- 同じアクションか
    function isSameAction(action1, action2) {
        if (!action1 || !action2) { return false; }
        if (action1.subject() != action2.subject()) { return false; }
        const item1 = action1._item;
        const item2 = action2._item;
        if (item1._dataClass != item2._dataClass) { return false; }
        if (item1.itemId() != item2.itemId()) { return false; }
        return true;
    };



    //==================================================
    //--  スプライト基本 /ベーシック
    //==================================================
    
    //- スプライトの検索-バトラー
    function searchSpriteBattler(battler) {
        const spriteset = SceneManager._scene._spriteset;
        let result = null;
        const sprites = battler._enemyId ? spriteset._enemySprites : spriteset._actorSprites;
        for (const sprite of sprites) {
            if(!sprite._battler) { continue; }
            if ((battler._actorId && sprite._battler._actorId == battler._actorId) || (battler._enemyId && sprite._battler.index() == battler.index())) {
                result = sprite;
                break;
            }
        }
        return result;
    };



    //==================================================
    //--  追加スプライト /ベーシック
    //==================================================
    
    //- 破棄付きスプライト
    function SpriteKeRask() {
        this.initialize(...arguments);
    }

    SpriteKeRask.prototype = Object.create(Sprite.prototype);
    SpriteKeRask.prototype.constructor = SpriteKeRask;

    SpriteKeRask.prototype.destroy = function() {
        if (this.parent) { this.parent.removeChild(this); }
        if (this.bitmap && !this.bitmap._url) { this.bitmap.destroy(); }
        
        if (this._texture) { Sprite.prototype.destroy.apply(this); }
    };



    //==================================================
    //--  動的関数 /ベーシック
    //==================================================

    let Funcs = {};

    //- ニューファンク
    function newFunc(str, a, b, c, act, react, elems) {
        v = $gameVariables._data;
        if (!Funcs[str]) {
            Funcs[str] = new Function("a", "b", "c", "act", "react", "elems", "v", "return " + str);
        }
        return Funcs[str](a, b, c, act, react, elems, v);
    };



    //==================================================
    //--  メタ配列 /ベーシック
    //==================================================
     
    //- 全てのメタの合算-配列
    function bundleAllMeta_array(battler, words, action, noDelSpace, ratioIndex) {
        let data = null
        let array = [];
        // バトラー値
        if (battler) {
            data = battler._actorId ? battler.actor() : battler.enemy();
            if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
            if (battler._actorId) {
                // 職業値
                data = battler.currentClass();
                if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
                // 装備値
                battler._equips.forEach(equip => {
                    data = equip.object();
                    if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
                });
            }
            // ステート値
            battler._states.forEach(stateId => {
                data = $dataStates[stateId];
                if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
            });
        }
        // アクション値
        if (action) {
            data = action.item ? action.item() : action;
            if (data) { metaAll(data.note, words, noDelSpace, ratioIndex).forEach(e => array.push(e)); }
        }
        // 空の要素は削除
        array = array.filter(e => e);
        return array;
    };

    //- 全てのメタの合算-文字列リスト
    function bundleAllMeta_strs(battler, words, action) {
        const array = bundleAllMeta_array(battler, words, action, true);
        if (!array || !array.length) { return []; }
        let strings = [];
        array.forEach(string => {
            if (!string) { return; }
            const strs = string.split(/,|\s|\n/);
            strs.forEach(str => {
                if (!str) { return; }
                strings.push(str);
            })
        });
        return strings;
    };
    
    //- 全てのメタの合算-数値リスト
    function bundleAllMeta_nums(battler, words, action) {
        const array = bundleAllMeta_array(battler, words, action);
        if (!array || !array.length) { return []; }
        let nums = [];
        array.forEach(string => {
            if (!string) { return; }
            const strs = string.split(/,|\s/);
            strs.forEach(str => {
                if (!str) { return; }
                const num = Number(str);
                if (isNaN(num)) { return; }
                nums.push(num);
            })
        });
        return nums;
    };

    //- 全取得メタ
    function metaAll(note, words, noDelSpace, ratioIndex) {
        let result = [];
        words.forEach(word => {
            // 複数用と単体用の正規表現を作成
            const regText = '\<' + word + ':([^\>]*)\>';
            const regExp_g = new RegExp(regText, 'gi');
            const regExp = new RegExp(regText, 'i');
            // マッチ判定
            let matches = note.match(regExp_g);
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
                    let str = match[1];
                    // スペースを削除
                    if (str && !noDelSpace) { str = str.replace(/\s/g, ""); }
                    result.push(str);
                });
            }
        });
        return result;
    };



    //==================================================
    //--  イージング /ベーシック
    //==================================================

    //- イージングの適用
    function applyEasing(current, start, target, duration, timeMax, easing, easingRate = 1) {
        // イージングの処理
        if (easing.match(/ei|eo|e/i)) {
            return processEasing(current, target, duration + 1, timeMax, easing, easingRate);
        }
        // カービング
        if (easing.match(/tn|cg|fk|cf|rd|bk/i)) {
            return processCurving(current, start, target, duration + 1, timeMax, easing, easingRate);
        }
    };
    
    //- イージングの処理
    function processEasing(current, target, duration, timeMax, easing, easingRate = 1) {
        const lt = calcEasing((timeMax - duration) / timeMax, easing, easingRate);
        const t = calcEasing((timeMax - duration + 1) / timeMax, easing, easingRate);
        const start = (current - target * lt) / (1 - lt);
        return start + (target - start) * t;
    };
    
    //- イージングの計算
    function calcEasing(t, easing, easingRate = 1) {
        const exponent = 2 * easingRate;
        switch (easing.toUpperCase()) {
            case "EI":
                return easeIn(t, exponent);
            case "EO":
                return easeOut(t, exponent);
            case "E":
                return easeInOut(t, exponent);
            default:
                return t;
        }
    };
    
    //- 各イージング処理
    function easeIn(t, exponent) {
        return Math.pow(t, exponent) || 0.001;
    };
    
    function easeOut(t, exponent) {;
        return 1 - (Math.pow(1 - t, exponent) || 0.001);
    };
    
    function easeInOut(t, exponent) {
        if (t < 0.5) {
            return easeIn(t * 2, exponent) / 2;
        } else {
            return easeOut(t * 2 - 1, exponent) / 2 + 0.5;
        }
    };
    
    //- カービングの処理
    function processCurving(current, start, target, duration, timeMax, easing, easingRate = 1) {
        // 0 の時の処理
        if (duration <= 0) { return easing.match(/tn|rd|bk/i) ? start : target; }
        let result = 0;
        // ターン
        if (easing.toUpperCase() == "TN") {
            result = processTurn(current, start, target, duration, timeMax, easingRate);
        // チャージ
        } else if (easing.toUpperCase() == "CG") {
            result = processCharge(current, start, target, duration, timeMax, easingRate);
        // フック
        } else if (easing.toUpperCase() == "FK") {
            result = processFook(current, start, target, duration, timeMax, easingRate);
        // チャージフック
        } else if (easing.toUpperCase() == "CF") {
            result = processChargeFook(current, start, target, duration, timeMax, easingRate);
        // ラウンド
        } else if (easing.toUpperCase() == "RD") {
            result = processRound(current, start, target, duration, timeMax, easingRate);
        // バック
        }  else if (easing.toUpperCase() == "BK") {
            result = processBack(current, start, target, duration, timeMax, easingRate);
        }
        return result;
    };
    
    //- ターンの処理
    function processTurn(current, start, target, duration, timeMax, easingRate) {
        let result = 0;
        const d1 = Math.round(timeMax / 2);
        const d2 = timeMax - d1;
        if (duration > d2) {
            result = processEasing(current, target, duration - d2, d1, "eo", easingRate);
        } else {
            result = processEasing(current, start, duration, d2, "ei", easingRate);
        }
        return result;
    };
    
    //- チャージの処理
    function processCharge(current, start, target, duration, timeMax, easingRate) {
        let result = 0;
        const d1 = Math.round(timeMax / 3);
        const d2 = timeMax - d1;
        if (duration > d2) {
            result = processEasing(current, start + (start - target) * easingRate, duration - d2, d1, "e");
        } else {
            result = processEasing(current, target, duration, d2, "e");
        }
        return result;
    };
    
    //- フックの処理
    function processFook(current, start, target, duration, timeMax, easingRate) {
        let result = 0;
        const d1 = Math.round(timeMax * 2 / 3);
        const d2 = timeMax - d1;
        if (duration > d2) {
            result = processEasing(current, target + (target - start) * easingRate, duration - d2, d1, "e");
        } else {
            result = processEasing(current, target, duration, d2, "e");
        }
        return result;
    };
    
    //- チャージフックの処理
    function processChargeFook(current, start, target, duration, timeMax, easingRate) {
        let result = 0;
        const d1 = Math.round(timeMax / 4);
        const d3 = Math.round(timeMax / 4);
        const d2 = timeMax - d1 - d3;
        if (duration > (d2 + d3)) {
            result = processEasing(current, start + (start - target) * easingRate, duration - d2 - d3, d1, "e");
        } else if (duration > d3) {
            result = processEasing(current, target + (target - start) * easingRate, duration - d3, d2, "e");
        } else {
            result = processEasing(current, target, duration, d3, "e");
        }
        return result;
    };
    
    //- ラウンドの処理
    function processRound(current, start, target, duration, timeMax, easingRate) {
        let result = 0;
        const d1 = Math.round(timeMax / 4);
        const d2 = Math.round(timeMax / 2);
        const d3 = timeMax - d1 - d2;
        if (duration > (d2 + d3)) {
            result = processEasing(current, target, duration - d2 - d3, d1, "eo");
        } else if (duration > d3) {
            result = processEasing(current, start + (start - target) * easingRate, duration - d3, d2, "e");
        } else {
            result = processEasing(current, start, duration, d3, "ei");
        }
        return result;
    };
    
    //- バックの処理
    function processBack(current, start, target, duration, timeMax, easingRate) {
        let result = 0;
        const d1 = 1;
        const d2 = timeMax - d1;
        if (duration > d2) {
            result = processEasing(current, target, duration - d2, d1, "e", easingRate);
        } else {
            result = processEasing(current, start, duration, d2, "e", easingRate);
        }
        return result;
    };
    
    
    
    //==================================================
    //--  アイコンスプライト /ベーシック
    //==================================================
    
    //- アイコンスプライトの形成
    function createIconSprite(iconIndex, anchorX, anchorY) {
        const baseSprite = new SpriteKeRask();
        baseSprite.anchor.x = anchorX || 0.5;
        baseSprite.anchor.y = anchorY || 0.5;
        const pw = ImageManager.iconWidth;
        const ph = ImageManager.iconHeight;
        const sx = (iconIndex % 16) * pw;
        const sy = Math.floor(iconIndex / 16) * ph;
        if (isIconBackDraw()) {
            const backSprite = new SpriteKeRask(new Bitmap(pw, ph));
            backSprite.anchor.x = anchorX || 0.5;
            backSprite.anchor.y = anchorY || 0.5;
            drawIconBack(backSprite.bitmap, iconIndex);
            baseSprite.addChild(backSprite)
        }
        const iconSprite = new SpriteKeRask();
        const bitmap = ImageManager.loadSystem("IconSet");
        iconSprite.bitmap = bitmap;
        iconSprite.anchor.x = anchorX || 0.5;
        iconSprite.anchor.y = anchorY || 0.5;
        iconSprite.setFrame(sx, sy, pw, ph);
        baseSprite.addChild(iconSprite)
        return baseSprite;
    };
    
})();