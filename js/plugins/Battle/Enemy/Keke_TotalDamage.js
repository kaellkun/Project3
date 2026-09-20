//=============================================================================
//  Keke_TotalDamage_Modified - 合計ダメージ＋個別ポップアップ（修正版v5）
//=============================================================================
// Original Copyright (c) 2022 ケケー
// Released under the MIT license
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 合計ダメージとヒット数を表示する（修正版v5）
 * @author ケケー (Modified)
 * 
 * @help
 * 【ver.1.3.2-mod5】
 * 
 * ===== 修正版の変更点 =====
 * ・スリップダメージを多段ヒットから除外
 * ・回復をヒットカウントから除外
 * ・1ヒットの場合は合計表示を省略
 * ・標準のダメージポップアップをデフォルトで無効化
 * ・【新機能】個別ダメージをKeke風デザインで表示
 * ・【v4】多段ヒット時の縦並び表示
 * ・【v5】ラベル横並び（Hit-100、回復+500、継続-50 形式）
 * ・【v5】フォント処理をKeke_StatePopup方式に修正
 * ============================
 *
 * @param フォント設定
 * 
 * @param フォント
 * @parent フォント設定
 * @desc 使用するフォント。『Keke_CommonData』で登録したフォント名を書く。空欄ならメインフォント
 * @default 
 * 
 * @param 文字サイズ
 * @parent フォント設定
 * @default 48
 * 
 * @param 縁取り幅
 * @parent フォント設定
 * @default 10
 * 
 * @param 文字色設定
 * 
 * @param HPダメージ色
 * @parent 文字色設定
 * @type struct<colorCfg>
 * @default {"文字色":"255, 255, 255, 1","文字色2":"255, 224, 224, 1","グラデーション":"false","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param HP回復色
 * @parent 文字色設定
 * @type struct<colorCfg>
 * @default {"文字色":"180, 255, 180, 1","文字色2":"255, 255, 255, 1","グラデーション":"false","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param HPダメージ色-弱点
 * @parent 文字色設定
 * @type struct<colorCfg>
 * @default {"文字色":"255, 32, 32, 1","文字色2":"255, 255, 255, 1","グラデーション":"true","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param HPダメージ色-耐性
 * @parent 文字色設定
 * @type struct<colorCfg>
 * @default {"文字色":"0, 128, 255, 1","文字色2":"255, 255, 255, 1","グラデーション":"true","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param HPダメージ色-クリティカル
 * @parent 文字色設定
 * @type struct<colorCfg>
 * @default {"文字色":"255, 255, 64, 1","文字色2":"255, 255, 255, 1","グラデーション":"true","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param MPダメージ色
 * @parent 文字色設定
 * @type struct<colorCfg>
 * @default {"文字色":"255, 128, 255, 1","文字色2":"255, 255, 255, 1","グラデーション":"false","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param MP回復色
 * @parent 文字色設定
 * @type struct<colorCfg>
 * @default {"文字色":"80, 255, 255, 1","文字色2":"255, 255, 255, 1","グラデーション":"false","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param 継続ダメージ色
 * @parent 文字色設定
 * @type struct<colorCfg>
 * @default {"文字色":"255, 200, 128, 1","文字色2":"255, 255, 200, 1","グラデーション":"false","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param 表示設定
 * 
 * @param 表示時間
 * @parent 表示設定
 * @default 120
 *
 * @param 表示位置-味方
 * @parent 表示設定
 * @type struct<posCfg>
 * @default {"表示方向":"下","ずらしX":"0","ずらしY":"0"}
 * 
 * @param 表示位置-敵
 * @parent 表示設定
 * @type struct<posCfg>
 * @default {"表示方向":"下","ずらしX":"0","ずらしY":"0"}
 * 
 * @param レイヤー
 * @parent 表示設定
 * @type select
 * @option ウインドウ上
 * @option ウインドウ下
 * @default ウインドウ上
 * 
 * @param 付属設定
 * 
 * @param 出現アニメ
 * @parent 付属設定
 * @type struct<appearAnime>
 * @default {"アニメ時間":"15","移動X":"0","移動Y":"0","スケール":"3","フェードイン":"","無効":"false"}
 * 
 * @param ヒット数
 * @parent 付属設定
 * @type struct<hitNum>
 * @default {"表示方向":"左","ずらしX":"0","ずらしY":"0","フォント":"","文字サイズ":"30","縁取り幅":"8","文字色":"240, 240, 0, 1","文字色2":"255, 255, 255, 1","グラデーション":"true","縁取り色":"0, 0, 0, 1","ヒット数ラベル":"Hit","文字色-ラベル":"0, 255, 192, 1","文字色2-ラベル":"255, 255, 255, 1","グラデーション-ラベル":"true","縁取り色-ラベル":"0, 0, 0, 1","ラベル幅":"32","無効":"false"}
 * 
 * @param ミス回避
 * @parent 付属設定
 * @type struct<missEva>
 * @default {"テキスト-ミス":"Miss","テキスト-回避":"Miss","フォント":"","文字サイズ":"30","縁取り幅":"9","文字色":"255, 255, 255, 1","文字色2":"","グラデーション":"false","縁取り色":"0, 0, 0, 1","無効":"false"}
 * 
 * @param 全体合計
 * 
 * @param 全体合計ダメージ
 * @parent 全体合計
 * @type struct<totalDamageAll>
 * @default {"全体合計を表示":"false"}
 * 
 * @param その他
 * 
 * @param ダメージポップ無効
 * @parent その他
 * @desc 標準のダメージポップを無効にしてKeke風で表示
 * @type boolean
 * @default true
 * 
 * @param オーバーキルを許可
 * @parent その他
 * @type boolean
 * @default true
 * 
 * @param 個別合計を無効
 * @parent その他
 * @type boolean
 * @default false
 * 
 * @param 1ヒット時も表示
 * @parent その他
 * @type boolean
 * @default false
 * 
 * @param スリップダメージをカウント
 * @parent その他
 * @type boolean
 * @default false
 * 
 * @param 回復をカウント
 * @parent その他
 * @type boolean
 * @default false
 * 
 * @param 個別ダメージ設定
 * 
 * @param 個別ダメージフォント
 * @parent 個別ダメージ設定
 * @desc 個別ダメージのフォント（空欄ならフォント設定を使用）
 * @default 
 * 
 * @param 個別ダメージ文字サイズ
 * @parent 個別ダメージ設定
 * @default 36
 * 
 * @param 個別ダメージ縁取り幅
 * @parent 個別ダメージ設定
 * @default 8
 * 
 * @param 個別ダメージ表示時間
 * @parent 個別ダメージ設定
 * @default 60
 * 
 * @param 縦並び間隔
 * @parent 個別ダメージ設定
 * @desc 多段ヒット時の縦並び間隔（ピクセル）
 * @default 40
 * 
 * @param 個別ラベル設定
 * 
 * @param ラベル-ダメージ
 * @parent 個別ラベル設定
 * @desc 通常ダメージのラベル（空欄で非表示）
 * @default Hit
 * 
 * @param ラベル-回復
 * @parent 個別ラベル設定
 * @desc 回復のラベル（空欄で非表示）
 * @default 回復
 * 
 * @param ラベル-継続
 * @parent 個別ラベル設定
 * @desc 継続（スリップ）ダメージのラベル（空欄で非表示）
 * @default 継続
 * 
 * @param ラベル文字サイズ
 * @parent 個別ラベル設定
 * @desc ラベルの文字サイズ
 * @default 20
 */

/*~struct~totalDamageAll:
 * @param 全体合計を表示
 * @type boolean
 * @default false
 * 
 * @param フォント
 * @default 
 * 
 * @param 文字サイズ
 * @default 48
 * 
 * @param 縁取り幅
 * @default 10
 * 
 * @param HPダメージ色
 * @type struct<colorCfg>
 * @default {"文字色":"255, 255, 128, 1","縁取り色":"0, 0, 0, 1"}
 * 
 * @param 表示時間
 * @default 120
 *
 * @param 位置X
 * @default 0
 * 
 * @param 位置Y
 * @default 0
 *
 * @param 位置寄せX
 * @type select
 * @option 左寄せ
 * @option 中央寄せ
 * @option 右寄せ
 * @default 右寄せ
 * 
 * @param 位置寄せY
 * @type select
 * @option 上寄せ
 * @option 中央寄せ
 * @option 下寄せ
 * @default 上寄せ
 * 
 * @param レイヤー
 * @type select
 * @option ウインドウ上
 * @option ウインドウ下
 * @default ウインドウ上
 *
 * @param 出現アニメ
 * @type struct<appearAnime>
 * @default {"アニメ時間":"10","移動X":"200","移動Y":"0","スケール":"1","フェードイン":"0","無効":"false"}
 *
 * @param ヒット数
 * @type struct<hitNum>
 * @default {"表示方向":"左","ずらしX":"0","ずらしY":"0","フォント":"","文字サイズ":"36","縁取り幅":"8","文字色":"0, 255, 128, 1","文字色2":"255, 255, 255, 1","グラデーション":"true","縁取り色":"0, 0, 0, 1","ヒット数ラベル":"Hit","文字色-ラベル":"255, 192, 0, 1","文字色2-ラベル":"255, 255, 255, 1","グラデーション-ラベル":"true","縁取り色-ラベル":"0, 0, 0, 1","ラベル幅":"30","無効":"false"}
 */

/*~struct~colorCfg:
 * @param 文字色
 * @default 255, 255, 255, 1
 * 
 * @param 文字色2
 * @default 
 * 
 * @param グラデーション
 * @type boolean
 * @default false
 * 
 * @param 縁取り色
 * @default 0, 0, 0, 1
 * 
 * @param 無効
 * @type boolean
 * @default false
 */

/*~struct~posCfg:
 * @param 表示方向
 * @type select
 * @option 上
 * @option 中央
 * @option 下
 * @default 下
 *
 * @param ずらしX
 * @default 0
 * 
 * @param ずらしY
 * @default 0
 */

/*~struct~appearAnime:
 * @param アニメ時間
 * @default 15
 *
 * @param 移動X
 * @default 0
 *
 * @param 移動Y
 * @default 0
 * 
 * @param スケール
 * @default 3
 * 
 * @param フェードイン
 * @default 
 *
 * @param 無効
 * @type boolean
 * @default false
 */

/*~struct~hitNum:
 * @param 表示方向
 * @type select
 * @option 上
 * @option 下
 * @option 左
 * @option 右
 * @default 左
 *
 * @param ずらしX
 * @default 0
 * 
 * @param ずらしY
 * @default 0
 * 
 * @param フォント
 * @default 
 * 
 * @param 文字サイズ
 * @default 30
 * 
 * @param 縁取り幅
 * @default 8
 * 
 * @param 文字色
 * @default 240, 240, 0, 1
 * 
 * @param 文字色2
 * @default 255, 255, 255, 1
 * 
 * @param グラデーション
 * @type boolean
 * @default true
 *
 * @param 縁取り色
 * @default 0, 0, 0, 1
 * 
 * @param ヒット数ラベル
 * @default Hit
 * 
 * @param 文字色-ラベル
 * @default 0, 255, 192, 1
 * 
 * @param 文字色2-ラベル
 * @default 255, 255, 255, 1
 * 
 * @param グラデーション-ラベル
 * @type boolean
 * @default true
 * 
 * @param 縁取り色-ラベル
 * @default 0, 0, 0, 1
 * 
 * @param ラベル幅
 * @default 32
 * 
 * @param 無効
 * @type boolean
 * @default false
 */

/*~struct~missEva:
 * @param テキスト-ミス
 * @default Miss
 * 
 * @param テキスト-回避
 * @default Miss
 * 
 * @param フォント
 * @default 
 * 
 * @param 文字サイズ
 * @default 30
 * 
 * @param 縁取り幅
 * @default 9
 * 
 * @param 文字色
 * @default 255, 255, 255, 1
 * 
 * @param 文字色2
 * @default 
 * 
 * @param グラデーション
 * @type boolean
 * @default false
 * 
 * @param 縁取り色
 * @default 0, 0, 0, 1
 * 
 * @param 無効
 * @type boolean
 * @default false
 */

(() => {
    const pluginName = document.currentScript.src.split("/").pop().split("?")[0].replace(/\.js$/, "");

    //--------------------------------------------------
    // ユーティリティ関数
    //--------------------------------------------------
    function strToHash(str) {
        if (!str || !str.length) return {};
        try {
            const strs = JSON.parse(str);
            let hash = {};
            for (let key in strs) {
                if (!key || strs[key] === undefined || strs[key] === null) continue;
                hash[key] = strToAuto(strs[key], key);
            }
            return hash;
        } catch (e) { return {}; }
    }

    function strToAuto(val, key = "") {
        if (val === null || val === undefined) return val;
        if (val === "") return "";
        if (val[0] === "{") return strToHash(val);
        if (val[0] === "[") {
            try { return JSON.parse(val).map(v => strToAuto(v)); }
            catch (e) { return []; }
        }
        let match = (val + ",").match(/^\s*(-?\d+\s*,\s*-?\d+\s*,\s*-?\d+\s*,?\s*-?\d*\.?\d*)\s*,$/);
        if (match && !(val + ",").match(/[^\d\.\-,\s]/)) {
            if (key.match(/(カラー|色|塗り)/)) {
                return "rgba(" + match[1] + ")";
            }
            return JSON.parse("[" + match[1] + "]");
        }
        if (val === "true") return true;
        if (val === "false") return false;
        if (!isNaN(Number(val)) && val !== "") return Number(val);
        return val;
    }

    function toBoolean(str) {
        if (!str) return false;
        const s = String(str).toLowerCase();
        return s === "true" || s === "on";
    }

    function safeNumber(val, defaultVal) {
        if (val === null || val === undefined || val === "") return defaultVal;
        const n = Number(val);
        return isNaN(n) ? defaultVal : n;
    }

    //--------------------------------------------------
    // パラメータ取得
    //--------------------------------------------------
    const parameters = PluginManager.parameters(pluginName);
    
    const keke_fontFace = parameters["フォント"] || "";
    const keke_fontSize = safeNumber(parameters["文字サイズ"], 48);
    const keke_outWidth = safeNumber(parameters["縁取り幅"], 10);

    const keke_colorCfg = {};
    keke_colorCfg.hpDamage = strToHash(parameters["HPダメージ色"]);
    keke_colorCfg.hpHeal = strToHash(parameters["HP回復色"]);
    keke_colorCfg.hpDamageWeak = strToHash(parameters["HPダメージ色-弱点"]);
    keke_colorCfg.hpDamageResist = strToHash(parameters["HPダメージ色-耐性"]);
    keke_colorCfg.hpDamageCritical = strToHash(parameters["HPダメージ色-クリティカル"]);
    keke_colorCfg.mpDamage = strToHash(parameters["MPダメージ色"]);
    keke_colorCfg.mpHeal = strToHash(parameters["MP回復色"]);
    keke_colorCfg.slipDamage = strToHash(parameters["継続ダメージ色"]);

    // デフォルト色設定
    const defaultColors = {
        hpDamage: { text: "rgba(255, 255, 255, 1)", outline: "rgba(0, 0, 0, 1)" },
        hpHeal: { text: "rgba(180, 255, 180, 1)", outline: "rgba(0, 0, 0, 1)" },
        mpDamage: { text: "rgba(255, 128, 255, 1)", outline: "rgba(0, 0, 0, 1)" },
        mpHeal: { text: "rgba(80, 255, 255, 1)", outline: "rgba(0, 0, 0, 1)" },
        slipDamage: { text: "rgba(255, 200, 128, 1)", outline: "rgba(0, 0, 0, 1)" }
    };
    for (let key in defaultColors) {
        if (!keke_colorCfg[key]) keke_colorCfg[key] = {};
        if (!keke_colorCfg[key]["文字色"]) keke_colorCfg[key]["文字色"] = defaultColors[key].text;
        if (!keke_colorCfg[key]["縁取り色"]) keke_colorCfg[key]["縁取り色"] = defaultColors[key].outline;
    }

    const keke_viewTime = safeNumber(parameters["表示時間"], 120);
    const keke_posCfgFrd = strToHash(parameters["表示位置-味方"]);
    const keke_posCfgOpp = strToHash(parameters["表示位置-敵"]);
    const keke_layer = parameters["レイヤー"] || "ウインドウ上";
    const keke_appearAnime = strToHash(parameters["出現アニメ"]);
    const keke_hitCfg = strToHash(parameters["ヒット数"]);
    const keke_missEva = strToHash(parameters["ミス回避"]);
    const keke_totalDamageAllCfg = strToHash(parameters["全体合計ダメージ"]);
    
    const keke_noDamagePop = toBoolean(parameters["ダメージポップ無効"]);
    const keke_okOverkill = toBoolean(parameters["オーバーキルを許可"]);
    const keke_noEachTotal = toBoolean(parameters["個別合計を無効"]);
    const keke_showSingleHit = toBoolean(parameters["1ヒット時も表示"]);
    const keke_countSlipDamage = toBoolean(parameters["スリップダメージをカウント"]);
    const keke_countRecovery = toBoolean(parameters["回復をカウント"]);
    
    // 個別ダメージ設定
    const keke_indivFontFace = parameters["個別ダメージフォント"] || "";
    const keke_indivFontSize = safeNumber(parameters["個別ダメージ文字サイズ"], 36);
    const keke_indivOutWidth = safeNumber(parameters["個別ダメージ縁取り幅"], 8);
    const keke_indivViewTime = safeNumber(parameters["個別ダメージ表示時間"], 60);
    const keke_stackInterval = safeNumber(parameters["縦並び間隔"], 40);
    
    // ラベル設定
    const keke_labelDamage = parameters["ラベル-ダメージ"] || "";
    const keke_labelHeal = parameters["ラベル-回復"] || "";
    const keke_labelSlip = parameters["ラベル-継続"] || "";
    const keke_labelFontSize = safeNumber(parameters["ラベル文字サイズ"], 20);

    //--------------------------------------------------
    // 破棄付きスプライト
    //--------------------------------------------------
    function SpriteKeTtdm() { this.initialize(...arguments); }
    SpriteKeTtdm.prototype = Object.create(Sprite.prototype);
    SpriteKeTtdm.prototype.constructor = SpriteKeTtdm;
    SpriteKeTtdm.prototype.destroy = function() {
        if (this.bitmap && !this.bitmap._url) { this.bitmap.destroy(); }
        Sprite.prototype.destroy.call(this);
    };

    //--------------------------------------------------
    // 公開メソッド
    //--------------------------------------------------
    Game_Temp.prototype.destroyTotalDamageAllKe = function() { destroyTotalDamageAll(); };

    //--------------------------------------------------
    // オーバーキル許可
    //--------------------------------------------------
    if (keke_okOverkill) {
        Game_Action.prototype.clear = function() {
            this._item = new Game_Item();
            this._targetIndex = -1;
            this._forcing = false;
        };
    }

    //--------------------------------------------------
    // バトラースプライト検索
    //--------------------------------------------------
    function searchSpriteBattler(battler) {
        const scene = SceneManager._scene;
        if (!scene || !scene._spriteset) return null;
        const sprites = battler._enemyId ? scene._spriteset._enemySprites : scene._spriteset._actorSprites;
        if (!sprites) return null;
        for (const sprite of sprites) {
            if (!sprite._battler) continue;
            if ((battler._actorId && sprite._battler._actorId === battler._actorId) || 
                (battler._enemyId && sprite._battler.index() === battler.index())) {
                return sprite;
            }
        }
        return null;
    }

    //--------------------------------------------------
    // フォントサイズ取得（Keke_StatePopup方式）
    //--------------------------------------------------
    function getFontSize(size) {
        const mainSize = keke_fontSize || $gameSystem.mainFontSize();
        if (!size && size !== 0) { return mainSize; }
        const sizeStr = size.toString();
        if (sizeStr.includes("+")) {
            const plus = Number(sizeStr.replace("+", ""));
            return mainSize + plus;
        } else if (sizeStr.includes("-")) {
            const minus = Number(sizeStr.replace("-", ""));
            return mainSize - minus;
        }
        return Number(size) || mainSize;
    }

    //--------------------------------------------------
    // テキスト幅測定（Keke_StatePopup方式）
    //--------------------------------------------------
    function measureTextWidth(text, fontSize, fontFace, bitmap) {
        let useExistingBitmap = false;
        let oriFontFace = null;
        let oriFontSize = null;
        if (bitmap) {
            useExistingBitmap = true;
            oriFontFace = bitmap.fontFace;
            oriFontSize = bitmap.fontSize;
        } else {
            bitmap = new Bitmap(1, 1);
        }
        bitmap.fontSize = fontSize || $gameSystem.mainFontSize();
        bitmap.fontFace = fontFace || $gameSystem.mainFontFace();
        const width = bitmap.measureTextWidth(text);
        if (useExistingBitmap) {
            bitmap.fontFace = oriFontFace;
            bitmap.fontSize = oriFontSize;
        } else {
            bitmap.destroy();
        }
        return width;
    }

    //--------------------------------------------------
    // グラデーションテキスト描画
    //--------------------------------------------------
    function drawTextGradient(bitmap, text, x, y, maxWidth, lineHeight, color1, color2) {
        const ctx = bitmap.context;
        ctx.save();
        ctx.font = bitmap._makeFontNameText ? bitmap._makeFontNameText() : `${bitmap.fontSize}px ${bitmap.fontFace}`;
        ctx.textBaseline = "middle";
        const grad = ctx.createLinearGradient(x, y, x, y + lineHeight);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        const tx = x;
        const ty = y + lineHeight / 2;
        ctx.lineWidth = bitmap.outlineWidth;
        ctx.strokeStyle = bitmap.outlineColor;
        ctx.strokeText(text, tx, ty, maxWidth);
        ctx.fillStyle = grad;
        ctx.fillText(text, tx, ty, maxWidth);
        ctx.restore();
        bitmap._baseTexture.update();
    }

    //--------------------------------------------------
    // 色設定取得
    //--------------------------------------------------
    function getColorConfig(value, type, weak, critical, isSlip) {
        const isHeal = value < 0;
        if (isSlip && !isHeal) {
            return keke_colorCfg.slipDamage;
        }
        if (type === "hp") {
            if (isHeal) return keke_colorCfg.hpHeal;
            if (weak === "weak" && keke_colorCfg.hpDamageWeak["文字色"]) return keke_colorCfg.hpDamageWeak;
            if (weak === "resist" && keke_colorCfg.hpDamageResist["文字色"]) return keke_colorCfg.hpDamageResist;
            if (critical && keke_colorCfg.hpDamageCritical["文字色"]) return keke_colorCfg.hpDamageCritical;
            return keke_colorCfg.hpDamage;
        } else {
            return isHeal ? keke_colorCfg.mpHeal : keke_colorCfg.mpDamage;
        }
    }

    //--------------------------------------------------
    // ラベル取得
    //--------------------------------------------------
    function getDamageLabel(value, isSlip) {
        const isHeal = value < 0;
        if (isHeal) return keke_labelHeal;
        if (isSlip) return keke_labelSlip;
        return keke_labelDamage;
    }

    //--------------------------------------------------
    // 個別ダメージスプライト初期化
    //--------------------------------------------------
    const _Sprite_Battler_initMembers = Sprite_Battler.prototype.initMembers;
    Sprite_Battler.prototype.initMembers = function() {
        _Sprite_Battler_initMembers.call(this);
        this._kekeIndivDamageSprites = [];
    };

    //--------------------------------------------------
    // 既存スプライトを上に押し上げる
    //--------------------------------------------------
    function pushUpExistingSprites(battlerSprite) {
        if (!battlerSprite._kekeIndivDamageSprites) return;
        const sprites = battlerSprite._kekeIndivDamageSprites;
        for (const sprite of sprites) {
            sprite._targetY -= keke_stackInterval;
        }
    }

    //--------------------------------------------------
    // 個別ダメージスプライト作成（横並びラベル）
    //--------------------------------------------------
    function createIndividualDamageSprite(battlerSprite, value, type, isCritical, weak, isSlip) {
        if (!battlerSprite || !battlerSprite.parent) return;
        
        // 既存のスプライトを上に押し上げる
        pushUpExistingSprites(battlerSprite);
        
        const colorCfg = getColorConfig(value, type, weak, isCritical, isSlip);
        const absValue = Math.abs(value);
        const isHeal = value < 0;
        const label = getDamageLabel(value, isSlip);
        
        // 表示文字列を作成（横並び: ラベル+符号+数値）
        // 例: Hit-100, 回復+500, 継続-50
        const sign = isHeal ? "+" : "-";
        const valueStr = absValue.toString();
        const displayText = label ? (label + sign + valueStr) : (sign + valueStr);
        
        const fontSize = keke_indivFontSize;
        const ow = keke_indivOutWidth;
        const fontFace = keke_indivFontFace || keke_fontFace || $gameSystem.mainFontFace();
        
        // テキスト幅を測定
        const textWidth = measureTextWidth(displayText, fontSize, fontFace);
        const height = fontSize;
        
        const bitmap = new Bitmap(textWidth + ow * 2, height + ow * 2);
        bitmap.fontSize = fontSize;
        bitmap.fontFace = fontFace;
        bitmap.outlineWidth = ow;
        bitmap.outlineColor = colorCfg["縁取り色"] || "rgba(0, 0, 0, 1)";
        bitmap.textColor = colorCfg["文字色"] || "rgba(255, 255, 255, 1)";
        
        // テキスト描画
        if (colorCfg["グラデーション"] && colorCfg["文字色2"]) {
            drawTextGradient(bitmap, displayText, ow, ow / 2, textWidth, height, colorCfg["文字色"], colorCfg["文字色2"]);
        } else {
            bitmap.drawText(displayText, ow, ow / 2, textWidth, height);
        }
        
        const sprite = new SpriteKeTtdm(bitmap);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        
        const posCfg = battlerSprite._enemy ? keke_posCfgOpp : keke_posCfgFrd;
        const offsetY = safeNumber(posCfg["ずらしY"], 0) - 32;
        
        sprite._baseX = (battlerSprite._homeX || 0) + (battlerSprite._offsetX || 0);
        sprite._baseY = (battlerSprite._homeY || 0) + (battlerSprite._offsetY || 0) + offsetY;
        sprite._targetY = sprite._baseY;
        sprite._currentY = sprite._baseY;
        sprite._moveY = 0;
        sprite._viewTime = keke_indivViewTime;
        sprite._velocityY = -2.5;
        sprite._gravity = 0.12;
        sprite._phase = "rise";
        sprite.x = sprite._baseX;
        sprite.y = sprite._baseY;
        
        const scene = SceneManager._scene;
        if (scene && scene._spriteset) {
            const layer = keke_layer === "ウインドウ下" ? scene._spriteset._battleField : scene._windowLayer;
            if (layer) layer.addChild(sprite);
        }
        
        if (!battlerSprite._kekeIndivDamageSprites) battlerSprite._kekeIndivDamageSprites = [];
        battlerSprite._kekeIndivDamageSprites.push(sprite);
    }

    //--------------------------------------------------
    // 個別ダメージスプライト更新
    //--------------------------------------------------
    function updateIndividualDamageSprites(battlerSprite) {
        if (!battlerSprite._kekeIndivDamageSprites) return;
        const sprites = battlerSprite._kekeIndivDamageSprites;
        for (let i = sprites.length - 1; i >= 0; i--) {
            const sprite = sprites[i];
            
            // 縦並び位置へスムーズに移動
            if (sprite._currentY > sprite._targetY) {
                sprite._currentY -= 3;
                if (sprite._currentY < sprite._targetY) {
                    sprite._currentY = sprite._targetY;
                }
            }
            
            // 跳ね上がりアニメーション
            if (sprite._phase === "rise") {
                sprite._velocityY += sprite._gravity;
                sprite._moveY += sprite._velocityY;
                if (sprite._velocityY >= 0) {
                    sprite._phase = "stay";
                    sprite._moveY = 0;
                }
            }
            
            sprite.y = sprite._currentY + sprite._moveY;
            
            sprite._viewTime--;
            
            if (sprite._viewTime < 15) {
                sprite.opacity = Math.floor(sprite.opacity * 0.85);
            }
            
            if (sprite._viewTime <= 0 || sprite.opacity <= 0) {
                sprite.destroy();
                sprites.splice(i, 1);
            }
        }
    }

    const _Sprite_Battler_update = Sprite_Battler.prototype.update;
    Sprite_Battler.prototype.update = function() {
        _Sprite_Battler_update.call(this);
        updateIndividualDamageSprites(this);
    };

    //--------------------------------------------------
    // ダメージポップアップ判定
    //--------------------------------------------------
    const _Game_Battler_shouldPopupDamage = Game_Battler.prototype.shouldPopupDamage;
    Game_Battler.prototype.shouldPopupDamage = function() {
        let result = _Game_Battler_shouldPopupDamage.apply(this);
        return result || this._result.hpDamagePureKe || this._result.mpDamagePureKe;
    };

    //--------------------------------------------------
    // ダメージポップアップ開始
    //--------------------------------------------------
    const _Game_Battler_startDamagePopup = Game_Battler.prototype.startDamagePopup;
    Game_Battler.prototype.startDamagePopup = function() {
        measureTotalDamage(this);
        
        if (keke_noDamagePop) {
            const result = this._result;
            // 重複防止チェック
            if (result._individualPopupShownKe) return;
            
            const battlerSprite = searchSpriteBattler(this);
            const isSlip = result._isSlipDamageKe || false;
            
            if (battlerSprite) {
                if (result.hpDamage !== 0) {
                    createIndividualDamageSprite(battlerSprite, result.hpDamage, "hp", result.critical, result.weakKe, isSlip);
                    result._individualPopupShownKe = true;
                } else if (result.mpDamage !== 0) {
                    createIndividualDamageSprite(battlerSprite, result.mpDamage, "mp", false, "", isSlip);
                    result._individualPopupShownKe = true;
                }
            }
            return;
        }
        _Game_Battler_startDamagePopup.apply(this);
    };

    //--------------------------------------------------
    // 自動回復時の処理（スリップダメージ）
    //--------------------------------------------------
    const _Game_Battler_regenerateAll = Game_Battler.prototype.regenerateAll;
    Game_Battler.prototype.regenerateAll = function() {
        const preAlive = this.isAlive();
        // スリップダメージフラグを立てる
        this.result()._isSlipDamageKe = true;
        _Game_Battler_regenerateAll.apply(this);
        if (preAlive) measureTotalDamage(this);
    };

    //--------------------------------------------------
    // 合計ダメージ計測
    //--------------------------------------------------
    function measureTotalDamage(battler) {
        const result = battler.result();
        if (result._totalMeasuredKe) return;
        
        if (!battler._totalDamagesKe) {
            battler._totalDamagesKe = { hp:0, mp:0, order:false, start:true, hit:0, preHpDamage:null, preMpDamage:null, weak:"", critical:false };
        }
        if (!BattleManager._totalDamagesAllKe) {
            BattleManager._totalDamagesAllKe = { hp:0, mp:0, order:false, start:true, hit:0, isActor:null };
        }
        
        const total = battler._totalDamagesKe;
        const totalAll = BattleManager._totalDamagesAllKe;
        const showEach = !keke_noEachTotal;
        const showAll = keke_totalDamageAllCfg && keke_totalDamageAllCfg["全体合計を表示"];
        
        let changeHp = result.hpDamagePureKe != null ? result.hpDamagePureKe : result.hpDamage;
        let changeMp = result.mpDamagePureKe != null ? result.mpDamagePureKe : result.mpDamage;
        const isSlipDamage = result._isSlipDamageKe || false;
        
        if (result.missed || result.evaded) {
            if (showEach) {
                if (result.missed) total.missed = true;
                if (result.evaded) total.evaded = true;
                total.order = true;
            }
        } else if (changeHp) {
            if (total.preHpDamage && (total.preHpDamage * changeHp < 0)) total.hp = 0;
            total.preHpDamage = changeHp;
            
            if (showEach) {
                total.hp += changeHp;
                if ((keke_countSlipDamage || !isSlipDamage) && (keke_countRecovery || changeHp > 0)) total.hit++;
                total.order = true;
                total.weak = total.weak || result.weakKe;
                total.critical = total.critical || result.critical;
            }
            
            changeHp -= (result.hpRegeneKe || 0);
            if (showAll && result.hpDamage > 0 && changeHp) {
                totalAll.hp += changeHp;
                if ((keke_countSlipDamage || !isSlipDamage) && (keke_countRecovery || changeHp > 0)) totalAll.hit++;
                if (totalAll.isActor == null) totalAll.isActor = battler._actorId ? true : false;
                totalAll.order = true;
            }
        } else if (changeMp) {
            if (total.preMpDamage && (total.preMpDamage * changeMp < 0)) total.mp = 0;
            total.preMpDamage = changeMp;
            
            if (showEach) {
                total.mp += changeMp;
                if ((keke_countSlipDamage || !isSlipDamage) && (keke_countRecovery || changeMp > 0)) total.hit++;
                total.order = true;
            }
            
            changeMp -= (result.mpRegeneKe || 0);
            if (showAll && result.mpDamage > 0 && changeMp) {
                totalAll.mp += changeMp;
                if ((keke_countSlipDamage || !isSlipDamage) && (keke_countRecovery || changeMp > 0)) totalAll.hit++;
                if (totalAll.isActor == null) totalAll.isActor = battler._actorId ? true : false;
                totalAll.order = true;
            }
        }
        result._totalMeasuredKe = true;
    }

    //--------------------------------------------------
    // リザルトクリア
    //--------------------------------------------------
    const _Game_Battler_clearResult = Game_Battler.prototype.clearResult;
    Game_Battler.prototype.clearResult = function() {
        _Game_Battler_clearResult.apply(this);
        this.result()._totalMeasuredKe = null;
        this.result()._isSlipDamageKe = null;
        this.result()._individualPopupShownKe = null;
    };

    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        target.result()._totalMeasuredKe = null;
        // 通常攻撃時はスリップダメージフラグをクリア
        target.result()._isSlipDamageKe = false;
        // 重複防止フラグをクリア
        target.result()._individualPopupShownKe = null;
        _Game_Action_apply.apply(this, arguments);
    };

    //--------------------------------------------------
    // アクション準備
    //--------------------------------------------------
    const _Game_Action_prepare = Game_Action.prototype.prepare;
    Game_Action.prototype.prepare = function() {
        initTotalDamage();
        _Game_Action_prepare.apply(this);
    };

    function initTotalDamage() {
        const members = [...$gameParty.members(), ...$gameTroop.members()];
        let inited = false;
        members.forEach(b => {
            const total = b._totalDamagesKe;
            if (total && total.order) return;
            if (b._inPopWaitKe) return;
            b._totalDamagesKe = null;
            b.clearResult();
            inited = true;
        });
        if (inited) BattleManager._totalDamagesAllKe = null;
    }

    //--------------------------------------------------
    // ダメージポップアップ更新
    //--------------------------------------------------
    const _Sprite_Battler_updateDamagePopup = Sprite_Battler.prototype.updateDamagePopup;
    Sprite_Battler.prototype.updateDamagePopup = function() {
        _Sprite_Battler_updateDamagePopup.apply(this);
        updateTotalDamage(this, false);
    };

    const _Spriteset_Battle_update = Spriteset_Battle.prototype.update;
    Spriteset_Battle.prototype.update = function() {
        _Spriteset_Battle_update.apply(this);
        updateTotalDamage(this, true);
    };

    function updateTotalDamage(bodySprite, isAll) {
        const allCfg = isAll ? keke_totalDamageAllCfg : null;
        startTotalDamageSprite(bodySprite, allCfg);
        updateTotalDamageSprite(bodySprite, allCfg);
    }

    function updateTotalDamageSprite(bodySprite, allCfg) {
        const tdSprite = bodySprite._totalDamageSpriteKe;
        if (!tdSprite) return;
        if (allCfg) updateTotalDamagePosAll(tdSprite, allCfg);
        else updateTotalDamagePos(tdSprite, bodySprite);
        updateAppearAnime(tdSprite);
        updateTotalDamageDel(tdSprite);
        updateTotalDamageDelAnime(tdSprite, bodySprite);
    }

    //--------------------------------------------------
    // 合計ダメージスプライト開始
    //--------------------------------------------------
    function startTotalDamageSprite(bodySprite, allCfg) {
        const total = allCfg ? BattleManager._totalDamagesAllKe : (bodySprite._battler ? bodySprite._battler._totalDamagesKe : null);
        if (!total || !total.order) return;
        
        if (!keke_showSingleHit && total.hit <= 1) {
            if (total.missed || total.evaded) makeMissEva(bodySprite, total);
            total.order = false;
            total.start = false;
            return;
        }
        
        if (total.hp) {
            if (allCfg && total.hp < 0) return;
            createTotalDamageSprite(bodySprite, total.hp, total.hit, "hp", total.start, allCfg, total.isActor, total.weak, total.critical);
        } else if (total.mp) {
            if (allCfg && total.mp < 0) return;
            createTotalDamageSprite(bodySprite, total.mp, total.hit, "mp", total.start, allCfg, total.isActor, "", false);
        } else if (total.missed || total.evaded) {
            makeMissEva(bodySprite, total);
        }
        total.order = false;
        total.start = false;
    }

    //--------------------------------------------------
    // 合計ダメージスプライト作成
    //--------------------------------------------------
    function createTotalDamageSprite(bodySprite, value, hitNum, type, isStart, allCfg, isActor, weak, critical) {
        const fontSize = getFontSize(allCfg ? allCfg["文字サイズ"] : keke_fontSize);
        const ow = safeNumber(allCfg ? allCfg["縁取り幅"] : keke_outWidth, 10);
        const fontFace = (allCfg ? allCfg["フォント"] : keke_fontFace) || $gameSystem.mainFontFace();
        
        const colorCfg = getColorConfig(value, type, weak, critical, false);
        if (colorCfg["無効"]) return;
        
        const valueStr = value.toString().replace("-", "");
        const width = measureTextWidth(valueStr, fontSize, fontFace);
        const height = fontSize;
        const d = prepareDraw(hitNum, width, height, ow, allCfg, fontFace);
        
        const bitmap = new Bitmap(d.bitmapW, d.bitmapH);
        bitmap.fontSize = fontSize;
        bitmap.fontFace = fontFace;
        bitmap.outlineWidth = ow;
        bitmap.outlineColor = colorCfg["縁取り色"] || "rgba(0, 0, 0, 1)";
        bitmap.textColor = colorCfg["文字色"] || "rgba(255, 255, 255, 1)";
        
        drawDamageValue(bitmap, valueStr, d, colorCfg);
        drawHitNum(bitmap, d);
        createSprite(bitmap, d, isStart, bodySprite, allCfg);
    }

    //--------------------------------------------------
    // 描画準備
    //--------------------------------------------------
    function prepareDraw(hitNum, width, height, ow, allCfg, fontFace) {
        const d = {};
        d.hitCfg = (allCfg ? allCfg["ヒット数"] : keke_hitCfg) || {};
        const noHitDraw = d.hitCfg["無効"];
        
        d.hitStr = hitNum.toString();
        d.hitLabel = noHitDraw ? "" : (d.hitCfg["ヒット数ラベル"] || "Hit");
        
        const hitFontSize = getFontSize(d.hitCfg["文字サイズ"] || 30);
        const hitOw = safeNumber(d.hitCfg["縁取り幅"], 8);
        const hitDire = d.hitCfg["表示方向"] || "左";
        const hitOffsetX = safeNumber(d.hitCfg["ずらしX"], 0);
        const hitOffsetY = safeNumber(d.hitCfg["ずらしY"], 0);
        const hitH = noHitDraw ? 0 : hitFontSize;
        const hitFontFace = d.hitCfg["フォント"] || fontFace || $gameSystem.mainFontFace();
        const hitNumW = noHitDraw ? 0 : measureTextWidth(d.hitStr, hitFontSize, hitFontFace);
        const hitLabelW = noHitDraw ? 0 : safeNumber(d.hitCfg["ラベル幅"], measureTextWidth(d.hitLabel, hitFontSize, hitFontFace));
        const hitW = noHitDraw ? 0 : hitNumW + hitLabelW + hitOw / 2 + 2;
        
        if (hitDire === "左") {
            d.bitmapW = width + ow * 2 + hitW + hitOffsetX;
            d.bitmapH = Math.max(height + ow * 2, hitH + hitOw * 2 + hitOffsetY);
            d.hitX = hitOw / 2 + hitOffsetX;
            d.hitY = ow + hitOffsetY + Math.floor((height - hitH) / 2);
            d.damageX = d.hitX + hitW + 2;
            d.damageY = ow / 2;
            d.damageCenterX = -hitW / 2;
        } else if (hitDire === "右") {
            d.bitmapW = width + ow * 2 + hitW + hitOffsetX;
            d.bitmapH = Math.max(height + ow * 2, hitH + hitOw * 2 + hitOffsetY);
            d.damageX = ow / 2;
            d.damageY = ow / 2;
            d.hitX = d.damageX + width + hitOw / 2 + hitOffsetX;
            d.hitY = ow + hitOffsetY + Math.floor((height - hitH) / 2);
            d.damageCenterX = hitW / 2;
        } else if (hitDire === "上") {
            d.bitmapW = Math.max(width + ow * 2, hitW + hitOw * 2.5 + hitOffsetX);
            d.bitmapH = height + ow * 2 + hitH + hitOffsetY;
            d.hitX = ow / 2 + hitOffsetX;
            d.hitY = ow / 2 + hitOffsetY;
            d.damageX = ow / 2;
            d.damageY = d.hitY + hitH + ow / 2;
            d.damageCenterX = 0;
        } else {
            d.bitmapW = Math.max(width + ow * 2, hitW + hitOw * 2.5 + hitOffsetX);
            d.bitmapH = height + ow * 2 + hitH + hitOffsetY;
            d.damageX = ow / 2;
            d.damageY = ow / 2;
            d.hitX = ow / 2 + hitOffsetX;
            d.hitY = d.damageY + height + ow / 2 + hitOffsetY;
            d.damageCenterX = 0;
        }
        
        d.damageW = width;
        d.damageH = height;
        d.hitW = hitW;
        d.hitH = hitH;
        d.hitNumW = hitNumW;
        d.hitLabelW = hitLabelW;
        d.hitOw = hitOw;
        d.hitFontSize = hitFontSize;
        d.hitFontFace = hitFontFace;
        if (noHitDraw) d.damageCenterX = (d.damageCenterX || 0) - 32;
        return d;
    }

    //--------------------------------------------------
    // ダメージ値描画
    //--------------------------------------------------
    function drawDamageValue(bitmap, valueStr, d, colorCfg) {
        const text = abbreviationValue(valueStr);
        if (colorCfg["グラデーション"] && colorCfg["文字色2"]) {
            drawTextGradient(bitmap, text, d.damageX, d.damageY, d.damageW, d.damageH, colorCfg["文字色"], colorCfg["文字色2"]);
        } else {
            bitmap.drawText(text, d.damageX, d.damageY, d.damageW, d.damageH);
        }
    }

    //--------------------------------------------------
    // ヒット数描画
    //--------------------------------------------------
    function drawHitNum(bitmap, d) {
        if (d.hitCfg["無効"] || !d.hitStr) return;
        
        const preFontSize = bitmap.fontSize;
        const preOutlineWidth = bitmap.outlineWidth;
        const preTextColor = bitmap.textColor;
        const preOutlineColor = bitmap.outlineColor;
        const preFontFace = bitmap.fontFace;
        
        bitmap.fontSize = d.hitFontSize;
        bitmap.fontFace = d.hitFontFace;
        bitmap.outlineWidth = d.hitOw;
        
        const labelX = d.hitX + d.hitNumW + 2;
        bitmap.textColor = d.hitCfg["文字色-ラベル"] || "rgba(0, 255, 192, 1)";
        bitmap.outlineColor = d.hitCfg["縁取り色-ラベル"] || "rgba(0, 0, 0, 1)";
        if (d.hitCfg["グラデーション-ラベル"] && d.hitCfg["文字色2-ラベル"]) {
            drawTextGradient(bitmap, d.hitLabel, labelX, d.hitY, d.hitLabelW, d.hitH, d.hitCfg["文字色-ラベル"], d.hitCfg["文字色2-ラベル"]);
        } else {
            bitmap.drawText(d.hitLabel, labelX, d.hitY, d.hitLabelW, d.hitH);
        }
        
        bitmap.textColor = d.hitCfg["文字色"] || "rgba(240, 240, 0, 1)";
        bitmap.outlineColor = d.hitCfg["縁取り色"] || "rgba(0, 0, 0, 1)";
        if (d.hitCfg["グラデーション"] && d.hitCfg["文字色2"]) {
            drawTextGradient(bitmap, d.hitStr, d.hitX, d.hitY, d.hitNumW, d.hitH, d.hitCfg["文字色"], d.hitCfg["文字色2"]);
        } else {
            bitmap.drawText(d.hitStr, d.hitX, d.hitY, d.hitNumW, d.hitH);
        }
        
        bitmap.fontSize = preFontSize;
        bitmap.outlineWidth = preOutlineWidth;
        bitmap.textColor = preTextColor;
        bitmap.outlineColor = preOutlineColor;
        bitmap.fontFace = preFontFace;
    }

    //--------------------------------------------------
    // スプライト作成
    //--------------------------------------------------
    function createSprite(bitmap, d, isStart, bodySprite, allCfg) {
        const tdSprite = bodySprite._totalDamageSpriteKe;
        if (tdSprite) {
            tdSprite.bitmap.destroy();
            tdSprite.bitmap = bitmap;
            initSpriteProperties(tdSprite, d, isStart, null, allCfg);
            return;
        }
        const sprite = new SpriteKeTtdm(bitmap);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite._pseudo3dType = "excl";
        const scene = SceneManager._scene;
        if (scene) {
            const layerWord = allCfg ? allCfg["レイヤー"] : keke_layer;
            const layer = layerWord === "ウインドウ下" && scene._spriteset ? scene._spriteset._battleField : scene._windowLayer;
            if (layer) layer.addChild(sprite);
        }
        bodySprite._totalDamageSpriteKe = sprite;
        initSpriteProperties(sprite, d, isStart, bodySprite, allCfg);
    }

    function initSpriteProperties(sprite, d, isStart, bodySprite, allCfg) {
        sprite._viewTimeKe = Math.floor(safeNumber(allCfg ? allCfg["表示時間"] : keke_viewTime, 120) / 2);
        sprite._delAnimeKe = null;
        sprite._damageCenterXKe = d.damageCenterX || 0;
        if (isStart) startAppearAnime(sprite, allCfg);
        sprite._updatesPosKe = true;
        sprite.opacity = 255;
        if (allCfg) sprite._isAllKe = true;
    }

    //--------------------------------------------------
    // ミス・回避作成
    //--------------------------------------------------
    function makeMissEva(bodySprite, total) {
        const cfg = keke_missEva || {};
        if (cfg["無効"]) return;
        const text = total.missed ? (cfg["テキスト-ミス"] || "Miss") : (cfg["テキスト-回避"] || "Miss");
        if (!text) return;
        createTextSprite(bodySprite, text, cfg, total.start);
    }

    function createTextSprite(bodySprite, text, cfg, isStart) {
        const fontSize = getFontSize(cfg["文字サイズ"] || 30);
        const ow = safeNumber(cfg["縁取り幅"], 9);
        const fontFace = cfg["フォント"] || keke_fontFace || $gameSystem.mainFontFace();
        const width = measureTextWidth(text, fontSize, fontFace);
        const height = fontSize;
        const bitmap = new Bitmap(width + ow * 2, height + ow * 2);
        bitmap.fontSize = fontSize;
        bitmap.fontFace = fontFace;
        bitmap.outlineWidth = ow;
        bitmap.outlineColor = cfg["縁取り色"] || "rgba(0, 0, 0, 1)";
        bitmap.textColor = cfg["文字色"] || "rgba(255, 255, 255, 1)";
        bitmap.drawText(text, ow / 2, ow / 2, width, height);
        createSprite(bitmap, {}, isStart, bodySprite, null);
    }

    //--------------------------------------------------
    // 位置更新
    //--------------------------------------------------
    function updateTotalDamagePos(sprite, battlerSprite) {
        if (!sprite._frame || !sprite._frame.width) return;
        const posCfg = battlerSprite._enemy ? keke_posCfgOpp : keke_posCfgFrd;
        const offsetX = safeNumber(posCfg["ずらしX"], 0) + (sprite._movedXKe || 0);
        const offsetY = safeNumber(posCfg["ずらしY"], 0) + (sprite._movedYKe || 0);
        
        if (battlerSprite && battlerSprite.parent) {
            const pos = posCfg["表示方向"] === "上" ? -1 : posCfg["表示方向"] === "中央" ? -0.5 : 0;
            const frameHeight = battlerSprite._frame ? battlerSprite._frame.height : 0;
            const underOffsetY = pos === 0 && frameHeight ? -sprite._frame.height / 2 : 0;
            const svActorOffsetX = $gameSystem.isSideView() && battlerSprite._actor ? -32 : 0;
            sprite.x = (battlerSprite._homeX || 0) + (battlerSprite._offsetX || 0) + offsetX + svActorOffsetX;
            sprite.y = (battlerSprite._homeY || 0) + (battlerSprite._offsetY || 0) + frameHeight * battlerSprite.scale.y * pos + offsetY + underOffsetY;
        }
        noOutScreen(sprite, sprite._frame.width, sprite._frame.height);
    }

    function updateTotalDamagePosAll(sprite, allCfg) {
        if (!sprite._frame || !sprite._frame.width) return;
        const alignX = allCfg["位置寄せX"] || "";
        const alignY = allCfg["位置寄せY"] || "";
        const offsetX = safeNumber(allCfg["位置X"], 0) + (sprite._movedXKe || 0);
        const offsetY = safeNumber(allCfg["位置Y"], 0) + (sprite._movedYKe || 0);
        sprite.x = alignX.includes("右") ? Graphics.width - offsetX : alignX.includes("中央") ? Graphics.width / 2 + offsetX : offsetX;
        sprite.y = alignY.includes("下") ? Graphics.height - offsetY : alignY.includes("中央") ? Graphics.height / 2 + offsetY : offsetY;
    }

    function noOutScreen(sprite, w, h) {
        const overL = sprite.x - w / 2;
        const overR = sprite.x + w / 2 - Graphics.width;
        const overU = sprite.y - h / 2;
        const overD = sprite.y + h / 2 - Graphics.height;
        if (overL < 0) sprite.x -= overL;
        else if (overR > 0) sprite.x -= overR;
        if (overU < 0) sprite.y -= overU;
        else if (overD > 0) sprite.y -= overD;
    }

    //--------------------------------------------------
    // 出現アニメ
    //--------------------------------------------------
    function startAppearAnime(sprite, allCfg) {
        const cfg = (allCfg ? allCfg["出現アニメ"] : keke_appearAnime) || {};
        if (cfg["無効"]) return;
        const time = safeNumber(cfg["アニメ時間"], 15);
        if (!time) return;
        const moveX = safeNumber(cfg["移動X"], 0);
        const moveY = safeNumber(cfg["移動Y"], 0);
        if (moveX || moveY) {
            sprite._moveAnimeKe = { timeMax: time, duration: time, startX: moveX, startY: moveY };
            sprite._movedXKe = moveX;
            sprite._movedYKe = moveY;
        }
        const scale = safeNumber(cfg["スケール"], 3);
        if (scale && scale !== 1) {
            sprite._scaleAnimeKe = { timeMax: time, duration: time, start: scale };
            sprite.scale.x = scale;
            sprite.scale.y = scale;
        }
        const fade = cfg["フェードイン"];
        if (fade !== null && fade !== undefined && fade !== "") {
            sprite._fadeAnimeKe = { timeMax: time, duration: time, start: Number(fade) };
            sprite.opacity = Number(fade);
        }
    }

    function updateAppearAnime(sprite) {
        if (sprite._moveAnimeKe) {
            const ani = sprite._moveAnimeKe;
            sprite._movedXKe = applyEasing(sprite._movedXKe, ani.startX, 0, ani.duration, ani.timeMax, "eo");
            sprite._movedYKe = applyEasing(sprite._movedYKe, ani.startY, 0, ani.duration, ani.timeMax, "eo");
            ani.duration--;
            if (ani.duration < 0) sprite._moveAnimeKe = null;
        }
        if (sprite._scaleAnimeKe) {
            const ani = sprite._scaleAnimeKe;
            sprite.scale.x = applyEasing(sprite.scale.x, ani.start, 1, ani.duration, ani.timeMax, "eo");
            sprite.scale.y = sprite.scale.x;
            ani.duration--;
            if (ani.duration < 0) sprite._scaleAnimeKe = null;
        }
        if (sprite._fadeAnimeKe) {
            const ani = sprite._fadeAnimeKe;
            sprite.opacity = applyEasing(sprite.opacity, ani.start, 255, ani.duration, ani.timeMax, "eo");
            ani.duration--;
            if (ani.duration < 0) sprite._fadeAnimeKe = null;
        }
    }

    //--------------------------------------------------
    // 消去処理
    //--------------------------------------------------
    function updateTotalDamageDel(sprite) {
        if (!sprite._viewTimeKe || sprite._delAnimeKe) return;
        sprite._viewTimeKe--;
        if (!sprite._viewTimeKe) sprite._delAnimeKe = { duration: 15 };
    }

    function updateTotalDamageDelAnime(sprite, bodySprite) {
        if (!sprite._delAnimeKe) return;
        sprite.opacity = applyEasing(sprite.opacity, 255, 0, sprite._delAnimeKe.duration, 15, "ei");
        sprite._delAnimeKe.duration--;
        if (!sprite._delAnimeKe.duration) destroyTotalDamage(sprite, bodySprite);
    }

    function destroyTotalDamage(sprite, bodySprite) {
        sprite.destroy();
        bodySprite._totalDamageSpriteKe = null;
    }

    function destroyTotalDamageAll() {
        const scene = SceneManager._scene;
        if (!scene || !scene._spriteset) return;
        const sprites = [...(scene._spriteset._actorSprites || []), ...(scene._spriteset._enemySprites || [])];
        sprites.forEach(s => {
            if (s._totalDamageSpriteKe) destroyTotalDamage(s._totalDamageSpriteKe, s);
        });
        if (scene._spriteset._totalDamageSpriteKe) destroyTotalDamage(scene._spriteset._totalDamageSpriteKe, scene._spriteset);
    }

    //--------------------------------------------------
    // 数値省略
    //--------------------------------------------------
    function abbreviationValue(val) {
        const str = val.toString();
        const len = str.length;
        if (len >= 13) return str.slice(0, len - 12) + "兆";
        if (len >= 9) return str.slice(0, len - 8) + "億";
        if (len >= 7) return str.slice(0, len - 4) + "万";
        return val.toString();
    }

    //--------------------------------------------------
    // イージング
    //--------------------------------------------------
    function applyEasing(current, start, target, duration, timeMax, easing) {
        if (duration <= 0) return target;
        const t = 1 - duration / timeMax;
        let ease;
        if (easing === "ei") ease = t * t;
        else if (easing === "eo") ease = 1 - (1 - t) * (1 - t);
        else ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        return start + (target - start) * ease;
    }
})();
