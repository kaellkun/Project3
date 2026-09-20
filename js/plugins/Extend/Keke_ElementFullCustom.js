//=============================================================================
// Keke_ElementFullCustom - 属性フルカスタム
// バージョン: 1.5.5
//=============================================================================
// Copyright (c) 2021 ケケー
// Released under the MIT license
// http://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 属性を万能に拡張する
 * @author ケケー
 * @url https://kekeelabo.com
 *
 * @help
 * 【ver.1.5.5】
 * 属性を万能に拡張する
 *
 * ● 特徴 ●
 *
 * ■属性ダメージの固定値増減(もちろん割合でも)
 * ■攻撃側からの属性ダメージ増減
 * ■属性によるダメージ反転(ダメージ<==>回復)
 * ■複数属性。計算式も設定できる(合算・最大値・平均)
 * ■技ごとに属性計算式を詳細設定
 *
 *
 * ● 使い方 ●
 *
 * ■属性を設定する
 *
 * ◇アクター、職業、装備、スキル、アイテム、ステートのメモ欄に
 *
 * 属性威力(属性による与ダメージ)を変えるなら
 * <属性威力: (計算記号)(効果値)(r), (!)(属性名), (属性名)>
 *
 * 属性耐性(属性による被ダメージ)を変えるなら
 * <属性耐性: (計算記号)(効果値)(r), (!)(属性名), (属性名)>
 *
 * 属性を追加するなら(全てのスキルに適用される)
 * <属性追加: (属性名)/(対象スキルタイプID), (属性名)/(対象スキルタイプID)>
 * ※ /(対象スキルタイプID) の部分は省略可
 * 
 * 通常攻撃属性を追加するなら(通常攻撃属性のスキルにのみ適用される)
 * <通常属性追加: (属性名)/(対象スキルタイプID), (属性名)/(対象スキルタイプID)>
 * ※ /(対象スキルタイプID) の部分は省略可
 *
 * ※属性名は , で区切って何個でも追加できる。もちろん1個でもよい
 * 　以下ふたつはスキル・アイテムのメモ欄だけ
 *
 * 属性ダメージの計算順を変えるなら
 * <属性計算: (乗算先/加算先)>
 *
 * 複数属性時のを計算法を変えるなら
 * <複数属性: (合算/最大値/平均)>
 *
 * ●(計算記号)(効果値)(r)
 * ダメージの変動量
 * ◎ 計算記号が +  
 * 　固定値加算。100 なら、ダメージが 100 増加。計算記号を省くとこれになる
 * ◎ 計算記号が - 
 * 　固定値減算。-100 なら、ダメージが100減少
 * ◎ 計算記号が * 
 * 　乗算。*2 なら、ダメージが 2倍 になる
 * ◎ 計算記号が / 
 * 　除算。/2 なら、ダメージが 1/2倍 になる
 * ◎ 計算記号が +*  
 * 　割合加算(乗算)。+*1 なら、元ダメージの 1倍分 ダメージを増加
 * ◎ 計算記号が -*  
 * 　割合減算(乗算)。-*1 なら、元ダメージの 1倍分 ダメージを減少
 * ◎ 計算記号が +/  
 * 　割合加算(除算)。+/2 なら、元ダメージの 1/2倍分 ダメージを増加
 * ◎ 計算記号が -/ 
 * 　割合減算(除算)。-/2 なら、元ダメージの 1/2倍分 ダメージを減少
 * ◎ r 
 * 　ダメージ反転(reverseの略)。ダメージなら回復し、
 * 　回復ならダメージを受けるようになる
 * ※割合加算とは
 * 　元ダメージに割合をかけて足す計算式
 * 　元ダメージが 100 、割合加算 0.1 と 0.2 がある場合、
 * 　100 + 100 * 0.1 + 100 * 0.2 = 130
 *
 * ●(属性名)
 * 適用する属性
 * データベースで設定した属性名を書く。IDではない
 * 以下特殊な書式
 * ◎ 全/all 
 * 　全ての属性に適用する
 * ◎(!) 
 * 　属性名の頭に ! をつけると、書いた属性以外の属性全てに適用する
 * 　!炎, 氷 , 雷 なら、炎、氷、雷以外の全ての属性に適用
 *
 * ●属性計算順
 * 属性ダメージを乗算と加算どちらを先に計算するか
 ※省略可能。省略した場合はプラグインパラメータでの設定が適用される
 * ◎乗算先 
 * 　乗算を先に計算する
 * ◎加算先 
 * 　加算と減算を先に計算する
 * ※計算順が変わると何が変わるか
 * 　最終ダメージが変わる
 * 　元ダメージが 100 、加算が +50 、乗算が *1.5 の場合、
 * ◎乗算先 => 100 * 1.5 + 50 = 200
 * ◎加算先 => (100 + 50) * 1.5 = 225
 *
 * ●複数属性計算法
 * 属性が複数あるとき、どのように効果を算出するか
 * 3つから選べる
 * ※省略可能。省略した場合はプラグインパラメータでの設定が適用される
 * ◎合算 => 全ての属性の効果を合算する
 * ◎最大値 => 最も有効な属性の効果のみ適用する
 * ◎平均 => 全ての属性の効果を平均する
 * ※なお、この計算法は特徴による属性有効度には適用されない
 * 　特徴の場合は絶対に「最大値」になる
 *
 * ★例) 
 * 
 * 炎属性の与ダメージを 2倍
 * <属性威力: *2, 炎>
 * 
 * 炎属性の与ダメージを 100 増加
 * <属性威力: +100, 炎>
 *
 * 全属性の与ダメージを 2倍
 * <属性威力: *2, 全>
 *
 * 炎属性以外の与ダメージを 1倍分 増加
 * <属性威力: +*1, !炎>
 * 
 * 通常攻撃の与ダメージを 2倍
 * <属性威力: *2, 通常攻撃>
 *
 * 炎属性の被ダメージを 2倍
 * <属性耐性: *2, 炎>
 * 
 * 氷属性と雷属性の被ダメージを 100 減少
 * <属性耐性: -100, 氷, 雷>
 *
 * 全属性の被ダメージを 1/2
 * <属性耐性: /2, 全>
 *
 * 氷属性と雷属性以外の被ダメージを 1/2倍分 減少
 * <属性耐性: -/2, !氷, 雷>
 *
 * 炎属性の攻撃を受けたとき回復
 * <属性耐性: r, 炎>
 *
 * 光属性と闇属性を追加する
 * <属性追加: 光, 闇>
 * 
 * スキルタイプ1のスキルにのみ、光属性と闇属性を追加する
 * <属性追加: 光/1, 闇/1>
 * 
 * 通常攻撃属性に光属性と闇属性を追加する
 * <通常属性追加: 光, 闇>
 *
 * 属性計算を乗算先にする
 * <属性計算: 乗算先>
 *
 * 複数属性の効果を合算にする
 * <複数属性: 合算>
 * 
 *
 * ● 利用規約 ●
 * MITライセンスのもと、自由に使ってくれて大丈夫です
 *
 *
 *
 * Extend attributes universally
 *
 * ● Features ●
 *
 * ■ Fixed value increase/decrease of element damage (of course percentage)
 * ■ Increase or decrease element damage from the attacking side
 * ■ Damage reversal by element (damage <==> recovery)
 * ■ Many element. Calculation method can also be set
 *   (total, max, average)
 * ■ Detailed setting of element calculation method for each skill
 *
 *
 * ● How to use ●
 *
 * ■ Set element
 *
 * ◇ Actors, classes, equipment, skills, items, and state memos
 *
 * If you want to change element power (damage done by element)
 * <elementAtk: (calcSymbol)(effectVal)(r),
 *   (!)(elementName), (elementName)>
 *
 * If you want to change element resistance (damage received by element)
 * <elementDef: (calSymbol)(effectVal)(r),
 *   (!)(elementName), (elementName)>
 *
 * If you want to add elements (applies to all skills)
 * <elementAdd: (elementName)/(targetSkillTypeId),
 *   (elementName)/(targetSkillTypeId)>
 * ※ "/(targetSkillTypeId)" can be omitted.
 *
 * If you want to add normal attack elements 
 *  (applies only to skills with normal attack elements)
 * <attackElementsAdd: (elementName)/(targetSkillTypeId), 
 *   (elementName)/(targetSkillTypeId)>
 * ※ "/(targetSkillTypeId)" can be omitted.
 * 
 * ※ Any number of element names can be added by separating them with,
 *   Of course, one
 *   The following two are only memo fields for skills and items
 *
 * If you want to change the calculation order of element damage
 * <elementCalc: (manyplyFirst/additionFirst)>
 *
 * If you want to change the calculation method for many elements
 * <manyElement: (total/max/average)>
 *
 *
 * ● (calcSymbol)(effectVal)(r)
 * Damage variation
 * ◎ CalcSymbol is +
 *   Fixed value addition. 100 increases damage by 100.
 *   If you omit the calcSymbol, you get this
 * ◎ CalcSymbol is -
 *   Fixed value subtraction. -100 means 100 less damage
 * ◎ Calculation symbol is *
 *   Multiplication. *2 doubles the damage
 * ◎ CalcSymbol is /
 *   Division. /2 means 1/2 damage
 * ◎ CalcSymbol is +*
 *   Percentage addition (multiplication). +*1 increases damage
 *   by 1x original damage
 * ◎ CalcSymbol is -*
 *   Percent Subtraction (Multiplication). -*1 reduces damage
 *   by 1x original damage
 * ◎ CalcSymbol is +/
 *   Percentage addition (division). +/2 increases damage
 *   by 1/2 times original damage
 * ◎ CalcSymbol is -/
 *   Percent Subtraction (Division). -/2 reduces damage
 *   by 1/2 times original damage
 * ◎ r
 *   Damage reversal (short for reverse). If you take damage,
 *   you will recover, and if you recover, you will receive damage.
 * ※ What is percentage addition?
 *   Calculated by multiplying the original damage
 *   by a percentage and adding it
 *   If the original damage is 100 and the percentage addition is 0.1 and 0.2,
 *   100 + 100 * 0.1 + 100 * 0.2 = 130
 *
 *
 * ● (elementName)
 * elements to apply
 * Write the element name seted in the database. not ID
 * below special format
 * ◎ all
 *   apply to all elements
 * ◎(!)
 *   Prefixing an element name with ! applies it to all elements
 *   except the one you just wrote.
 *   !Fire, Ice, Lightning applies to all elements except fire, ice,
 *   and lightning
 *
 *
 * ● ElementCalcOrder
 * Whether to calculate multiplication or addition of element damage first
 * Can be omitted.
 * If omitted, the setting in the plugin parameter will be applied
 * ◎ MultiplyFirst
 *   Calculate multiplication first
 * ◎ AdditionFirst
 *   Calculate addition and subtraction first
 * ※ What will change if the order of calculation changes?
 *   final damage changes
 *   If the original damage is 100,
 *   the addition is +50, and the multiplication is *1.5,
 * ◎ MultiplyFirst => 100 * 1.5 + 50 = 200
 * ◎ AdditionFirst => (100 + 50) * 1.5 = 225
 *
 *
 * ● ManyCalcMethod
 * How to calculate the effect when there are many elements
 * Choose from 3
 * ※ Can be omitted.
 *   If omitted, the setting in the plugin parameter will be applied
 * ◎ total => add up the effects of all elements
 * ◎ max => Apply only the effect of the most effective element
 * ◎ average => Average the effect of all elements
 * ※ Note that this calculation method does not apply 
 *  to element effectiveness based on traits.
 *  In the case of features, it is absolutely the "maximum value"
 *
 *
 * ★ Example)
 * 2x fire damage dealt
 * <elementAtk: *2, fire>
 * 
 * Fire element damage dealt increased by 100
 * <elementAtk: +100, fire>
 *
 * 2x damage dealt for all elements
 * <elementAtk: *2, all>
 *
 * 1x non-fire damage dealt
 * <elementAtk: +*1, !flame>
 *
 * 2x normal attack damage
 * <elementAtk: *2, normalAttack>
 *
 * 2x fire damage taken
 * <elementDef: *2, fire>
 * 
 * Reduces ice and lightning damage taken by 100
 * <elementDef: -100, ice, lightning>
 *
 * Damage received from all elements 1/2
 * <elementDef: /2, all>
 *
 * Reduces damage taken by non-ice and lightning elements by 1/2
 * <elementDef: -/2, !ice, lightning>
 *
 * Recover when attacked by fire element
 * <elementDef: r, fire>
 *
 * Add light and dark elements
 * <elementAdd: light, dard>
 * 
 * Add light and dark elements only skill of skill type id 1.
 * <elementAdd: light/1, dard/1>
 * 
 * Add light and dark elements to normal attack attributes
 * <attackElementsAdd: light, dark>
 *
 * Multiply element calculations
 * <elementCalc: multi>
 *
 * Combine the effects of many elements
 * <manyElement: total>
 *
 *
 * ● Terms of Use ●
 * Feel free to use it under the MIT license.
 * 
 * 
 * 
 * @param 属性計算順
 * @desc elementCalcOrder 乗算と加算のどちらを先に計算するか
 * @type select
 * @option 乗算先
 * @option 加算先
 * @default 乗算先
 *
 * @param 複数属性計算法
 * @desc manyElementMethod 属性が複数あるとき、どのように効果を算出するか。メモ欄で技別に設定もできる
 * @type select
 * @option 合算
 * @option 最高値
 * @option 平均
 * @default 合算
 * 
 * @param …特徴にも適用
 * @desc manyElementMethodAlsoTraits 複数属性計算法を特徴の属性有効度にも適用する
 * @type boolean
 * @default true
 */
 
 
 
(() => {
    //- プラグイン名
    const pluginName = document.currentScript.src.split(/[?#]/)[0].split("/").pop().replace(/\.js$/, "");



    //==================================================
    //--  公開メソッド
    //==================================================

    //- 全ての属性の取得(公開)
    Game_Temp.prototype.getAllElementsKe = function(action) {
        return getAllElements(action);
    };


    
    //==================================================
    //--  パラメータ受け取り
    //==================================================
    
    const parameters = PluginManager.parameters(pluginName);
    
    const keke_elementCalcOrder = parameters["属性計算順"];
    const keke_manyElementMethod = parameters["複数属性計算法"];
    const keke_memAlsoTraits = parameters["…特徴にも適用"];
    
    
    
    //==================================================
    //--  属性フルカスタム
    //==================================================
    
    // ダメージ計算前に属性結果を消去(処理追加)
    const _Game_Action_prototype_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply= function(target) {
        target._elementResultKeElfc = null;

        _Game_Action_prototype_apply.apply(this, arguments);
    };
    
    
    //- 属性ダメージの適用 呼び出し(処理追加)
    const _Game_Action_evalDamageFormula = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function(target) {
        let result = _Game_Action_evalDamageFormula.apply(this, arguments);

        // 属性ダメージの適用
        return applyElementDamage(result, this, target);
    };

    //- 属性ダメージの適用
    function applyElementDamage(damage, action, target) {
        const oriDamage = damage;
        const isRev = oriDamage < 0 ? -1 : 1;
        let damageD = damage;
        const subject = action.subject();
        const item = action.item();
        // 全ての属性の取得
        const elements = getAllElements(action);
        // 属性メタ取得
        let atks = bundleAllMeta_array(subject, ["属性威力", "elementAtk"]);
        let defs = bundleAllMeta_array(target, ["属性耐性", "elementDef"]);    
        // 乗算加算タイプ取得
        let tpType = keke_elementCalcOrder;
        meta = getMetaStr(item.note, ["属性計算", "elementCalc"]);
        if (meta) { tpType = meta; }
        // メタ順ソート(威力)
        atks = arraySortByCalcSymbol(atks, tpType);
        // メタ順ソート(耐性)
        defs = arraySortByCalcSymbol(defs, tpType);
        // 属性ごとにメタから属性倍率を取得
        const metaSet = [atks, defs];
        const pluss = [];
        const times = [];
        const plussD = [];
        const timesD = [];
        let reverse = false;
        // 全ての属性を処理
        elements.forEach((elemId, i) => {
            // 倍率を初期化
            pluss[i] = 0;
            times[i] = 1;
            plussD[i] = 0;
            timesD[i] = 1;
            // 全てのメタを処理
            metaSet.forEach((metas, j) => {
                if (!metas.length) { return; }
                metas.forEach(meta => {
                    if (!meta) { return; }
                    const strs = meta.split(",");
                    const targets = strs.slice(1);
                    // アンチ判定
                    const anti = targets[0].includes("!");
                    targets[0] = targets[0].replace(/\!/g, "");
                    // 属性一致してるか
                    let ok = anti ? true : false;
                    let id = null;
                    for (const target of targets) {
                        if (target.match(/全|all/i)) { ok = true;  break; }
                        id = $dataSystem.elements.indexOf(target);
                        if (elemId == id) { ok = anti ? false : true; break; }
                    }
                    if (!ok) { return; }
                    // 一致してたら倍率を取得
                    const calcs = strSymbolCalc(strs[0], isRev < 0, damage);
                    pluss[i] += calcs[0] != null ? calcs[0] : 0;
                    times[i] *= calcs[1] != null ? calcs[1] : 1;
                    // 耐性のみの取得
                    if (j == 1) {
                        plussD[i] += calcs[0] ? calcs[0] : 0;
                        timesD[i] *= calcs[1] ? calcs[1] : 1;
                    }
                    // リバース判定
                    reverse = reverse || (strs[0].includes("r") ? true : false);
                });
            }); 
        });
        // 複数属性の計算法を取得
        let manyMethod = keke_manyElementMethod;
        meta = getMetaStr(action.item().note, ["複数属性", "manyElement"]);
        if (meta) { manyMethod = meta; }
        // 属性ダメージ計算
        damage = calcElementDamage(damage, oriDamage, reverse, pluss, times, manyMethod);
        // 属性ダメージ計算(耐性のみ)
        damageD = calcElementDamage(damageD, oriDamage, reverse, plussD, timesD, manyMethod);
        // 属性結果を保存
        const startDamage = oriDamage / action.calcElementRate(target);
        target._elementResultKeElfc = damageD - startDamage;
        // 通常攻撃属性の適用
        damage = applyNormalElement(action, metaSet, oriDamage, isRev, damage);
        return damage;
    };


    //- 全ての属性の取得
    function getAllElements(action) {
        const subject = action.subject();
        const item = action.item();
        // デフォルト属性を取得
        const elementId = item.damage.elementId;
        let elements = elementId < 0 ? subject.attackElements() : elementId > 0 ? [elementId] : [];
        // 属性追加を取得
        let addElems = getAddElements(action, elementId);
        if (addElems.length) { elements = elements.concat(addElems); }
        // 属性の重複を削除
        elements = elements.filter((e, i, self) => self.indexOf(e) == i);
        return elements;
    };

    //- 属性追加の取得
    function getAddElements(action, elementId) {
        const subject = action.subject();
        let addElems = [];
        let elemNames = bundleAllMeta_string(subject, ["属性追加", "追加属性", "elementAdd", "addElement"], action);
        addElems = [...addElems, ...elemNames.map(elemName => checkSkillType(action, elemName) && $dataSystem.elements.indexOf(extractElemName(elemName)))];
        // 通常属性追加
        if (elementId == -1) {
            elemNames = bundleAllMeta_string(subject, ["通常属性追加", "attackElementAdd"], action);
            addElems = [...addElems, ...elemNames.map(elemName => checkSkillType(action, elemName) && $dataSystem.elements.indexOf(extractElemName(elemName)))];
        }
        return addElems.filter(elemId => elemId > 0);
    };

    //- スキルタイプの判定
    function checkSkillType(action, elemName) {
        const strs = elemName.split("/");
        const item = action.item();
        if (strs.length >= 2 && item) {
            const actionStypeId = action.item().stypeId;
            const tageStypeId = Number(strs[1]);
            if (actionStypeId != tageStypeId) { return false; }
        }
        return true;
    };

    //- 属性名の抽出
    function extractElemName(elemName) {
        const strs = elemName.split("/");
        if (strs.length >= 2) {
           return strs[0];
        }
        return elemName;
    };


    //- 属性ダメージ計算
    function calcElementDamage(damage, oriDamage, reverse, pluss, times, manyMethod) {
        // 複数属性効果(加算)
        damage += arrayTotalByMethod(pluss, manyMethod, "加算");
        // 複数属性効果(乗算)
        damage *= arrayTotalByMethod(times, manyMethod, "乗算");
        // ダメージが 0 未満なら 0 にする
        if (damage * oriDamage < 0) { damage = 0; }
        // リバース
        damage *= reverse ? -1 : 1;
        // NaN防止
        if (isNaN(damage)) { damgage = 0; }
        return damage;
    };


    //- 通常攻撃属性の適用
    function applyNormalElement(action, metaSet, oriDamage, isRev, damage) {
        const item = action.item();
        const elementId = item.damage.elementId;
        if (elementId != -1) { return damage; }
        metaSet.forEach((metas, j) => {
            if (!metas.length) { return; }
            metas.forEach(meta => {
                if (!meta) { return; }
                const strs = meta.split(",");
                const targets = strs.slice(1);
                // 属性一致してるか
                let ok = false;
                for (const target of targets) {
                    if (target.match(/通常攻撃|通常|normalAttack/i)) { ok = true;  break; }
                }
                if (!ok) { return; }
                // 一致してたら倍率を取得
                const calcs = strSymbolCalc(strs[0], isRev < 0, oriDamage);
                damage += calcs[0] ? calcs[0] : 0;
                damage *= calcs[1] ? calcs[1] : 1;
            });
        });
        return damage;
    };


    //- 属性追加を特徴の属性計算にも反映(処理追加)
    const _Game_Action_calcElementRate = Game_Action.prototype.calcElementRate;
    Game_Action.prototype.calcElementRate = function(target) {
        const elementId = this.item().damage.elementId;
        let addElems = getAddElements(this, elementId);
        // 属性追加があれば独自計算
        if (addElems.length) {
            const elements = getAllElements(this);
            // 複数属性計算法を特徴にも適用する場合
            if (keke_memAlsoTraits) {
                // 属性レート計算
                return calcElementRate(target, elements);
            // しない場合
            } else {
                // 属性レート最大値
                return  this.elementsMaxRate(target, elements);
            }
        }

        return _Game_Action_calcElementRate.apply(this, arguments);
    };

    //- 属性レート計算
    function calcElementRate(target, elements) {
        if (!elements || !elements.length) { return 1; }
        const method = keke_manyElementMethod;
        let rate = (method.match(/合算|total/i)) ? 1 : 0;
        elements.forEach(elemId => {
            const elemRate = target.elementRate(elemId);
            if (method.match(/合算|total/i)) {
                rate *= elemRate;
            } else if (method.match(/平均|average/i)) {
                rate += elemRate;
            } else {
                rate = Math.max(rate, elemRate);
            }
        });
        if (method.match(/平均|average/i)) { rate /= elements.length; }
        return rate;
    };
    
    
    
    //==================================================
    //--  メタ文字列 /ベーシック 
    //==================================================
     
    //- 全てのメタの合算-文字列
    function bundleAllMeta_string(battler, words, action) {
        // イニット
        let data = null
        let str = "";
        // バトラー値
        data = battler.actorId ? battler.actor() : battler.enemy();
        if (data) { str += getMetaStr(data.note, words, true); }
        if (battler._actorId) {
            // 職業値
            data = battler.currentClass();
            if (data) { str += getMetaStr(data.note, words, true); }
            // 装備値
            battler._equips.forEach(equip => {
                data = equip.object();
                if (data) { str += getMetaStr(data.note, words, true); }
            });
        }
        // ステート値
        battler._states.forEach(stateId => {
            data = $dataStates[stateId];
            if (data) { str += getMetaStr(data.note, words, true); }
        });
        // アクション値
        if (action) {
            data = action.item();
            if (data) { str += getMetaStr(data.note, words, true); }
        }
        // スペース削除
        str = str.replace(/\s/g, "");
        // 最後の , を削除
        if (str.match(/,+$/)) { str = str.replace(/,+$/, ""); }
        return str.split(",");
    };

    //- メタ文字列を取得
    function getMetaStr(note, words, total = false) {
        let str = "";
        metas = metaAll(note, words);
        for (const meta of metas) {
            str += meta;
            if (total) { str += meta ? "," : ""; }
        }
        return str;
    };
    
    
    
    //==================================================
    //--  メタ配列 /ベーシック
    //==================================================
    
    //- 全てのメタの合算-配列
    function bundleAllMeta_array(battler, words, action) {
        let array = [];
        let data = null;
        // バトラー値
        data = battler.actorId ? battler.actor() : battler.enemy();
        if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        if (battler._actorId) {
            // 職業値
            data = battler.currentClass();
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
            // 装備値
            battler.equips().forEach(data => {
                if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
            }, battler);
        }
        // ステート値
        battler._states.forEach(stateId => {
            data = $dataStates[stateId];
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        }, battler);
        // アクション値
        if (action) {
            data = action.item();
            if (data) { metaAll(data.note, words).forEach(e => array.push(e)); }
        }
        // 空の要素は削除
        array = array.filter(e => e);
        return array;
    };
    
    //- 全取得メタ
    function metaAll(note, words) {
        let result = [];
        words.forEach(word => {
            const regText = '\<' + word + ':([^\>]*)\>';
            const regExp_g = new RegExp(regText, 'gi');
            const regExp = new RegExp(regText, 'i');
            const matches = note.match(regExp_g);
            if (matches) {
                matches.forEach(function(line) {
                    result.push(line.match(regExp)[1].replace(/\s/g, ""));
                });
            }
        });
        return result;
    };

    
    
    //==================================================
    //--  計算コモン /ベーシック
    //==================================================
    
    //- 配列の計算記号によるソート
    function arraySortByCalcSymbol(array, first = "乗算先") {
        array = array.map(a => !a.startsWith("+") && !a.startsWith("-") && !a.startsWith("*") && !a.startsWith("/") ? "+" + a : a);
        const plus = array.filter(a => a.startsWith("+") || a.startsWith("*+") || a.startsWith("/+") || a.startsWith("-") || a.startsWith("*-") || a.startsWith("/*"));
        const times = array.filter(a => (a.startsWith("*") && !a.startsWith("*+") && !a.startsWith("*-")) || (a.startsWith("/") && !a.startsWith("/+") && !a.startsWith("/-")));
        array = first.match(/加算先|plus/i) ? plus.concat(times) : times.concat(plus);
        return array;
    }
    
    //- 文字列の記号計算
    function strSymbolCalc(str, rev = false, oriVal = 0) {
        const nums = str.match(/^([\+\-\*\/]+)(\d*.?\d*)/);
        const symbol = nums[1];
        let num = Number(nums[2]) || 0;
        let plus = null;
        let times = null;
        if (symbol == "+" || symbol == "-") {
            num *= rev ? -1 : 1;
            num *= symbol == "-" ? -1 : 1;
            plus = num;
        } else if ((symbol.includes("+") || symbol.includes("-")) && (symbol.includes("*") || symbol.includes("/"))) {
            num =  symbol.includes("/") ? oriVal / num : oriVal * num;
            num *= rev ? -1 : 1;
            num *=  symbol.includes("-") ? -1 : 1;
            plus = num;
        } else {
            times = symbol == "/" ? 1 / num : num;
        }
        return [plus, times];
    };
    
    //- 配列の計算法別合算
    function arrayTotalByMethod(array, method = "合算", calc = "加算") {
        if (!array || !array.length) { return calc == "加算" ? 0 : 1; }
        let total = (calc.match(/乗算|multi/i) && method.match(/合算|total/i)) ? 1 : 0;
        for (const val of array) {
            if (method.match(/合算|total/i)) {
                if (calc.match(/加算|plus/i)) { total += val; } else { total *= val; }
            } else if (method.match(/平均|average/i)) {
                total += val;
            } else {
                if (val > 0) { total = Math.max(val, total); }
                if (val < 0) { total = Math.min(val, total); }
            }
        }
        if (method.match(/平均|average/i)) { total /= array.length; }
        return total;
    };
        
})();