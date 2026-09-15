//=============================================================================
// NRP_LearnSkillList_NonParty.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc v1.10 パーティ未加入アクターのスキル習得画面を呼び出す（閲覧専用）
 * @author （NRP_LearnSkillList拡張）
 * @base NRP_LearnSkillList
 * @orderAfter NRP_LearnSkillList
 * @url 
 *
 * @help NRP_LearnSkillListの拡張プラグインです。
 * まだパーティに加入していない仲間のスキル習得一覧を
 * プラグインコマンドで呼び出すことができます。
 * 
 * ※未加入アクターの場合は「閲覧のみ」となり、
 * 　スキルの習得はできません。
 * 
 * -------------------------------------------------------------------
 * ■使い方
 * -------------------------------------------------------------------
 * 本プラグインはNRP_LearnSkillListが必須です。
 * プラグイン管理でNRP_LearnSkillListより下に配置してください。
 * 
 * -------------------------------------------------------------------
 * ■プラグインコマンド
 * -------------------------------------------------------------------
 * ◆シーン開始（非パーティ・閲覧専用）
 * パーティに加入していないアクターのスキル習得画面を呼び出します。
 * スキルの習得はできず、一覧の閲覧のみとなります。
 * アクターIDを直接指定、または変数で指定できます。
 * 
 * ◆アクター選択から開始（リスト指定・閲覧専用）
 * 指定したアクターIDリストから選択画面を表示し、
 * 選んだアクターのスキル習得画面を呼び出します。
 * スキルの習得はできず、一覧の閲覧のみとなります。
 * 
 * -------------------------------------------------------------------
 * ■注意事項
 * -------------------------------------------------------------------
 * ・未加入アクターの画面では習得操作ができません。
 * ・スキルポイントは表示されますが消費できません。
 * ・パーティに加入後は通常通り習得可能になります。
 * 
 * -------------------------------------------------------------------
 * ■利用規約
 * -------------------------------------------------------------------
 * 特に制約はありません。
 * 改変、再配布自由、商用可、権利表示も任意です。
 * 
 * @-----------------------------------------------------
 * @ プラグインコマンド
 * @-----------------------------------------------------
 * 
 * @command SceneStartNonParty
 * @text シーン開始（非パーティ・閲覧専用）
 * @desc パーティ未加入アクターのスキル一覧を閲覧します。
 * スキルの習得はできません。
 * 
 * @arg ActorId
 * @text アクターID
 * @type actor
 * @desc 対象とするアクターのIDです。
 * 
 * @arg VariableActorId
 * @text アクターID（変数）
 * @type variable
 * @desc アクターIDを変数で指定します。
 * こちらが優先されます。
 * 
 * @-----------------------------------------------------
 * 
 * @command SceneStartWithActorList
 * @text アクター選択から開始（リスト指定・閲覧専用）
 * @desc 指定したアクターリストから選択画面を表示し、
 * スキル一覧を閲覧します。習得はできません。
 * 
 * @arg ActorIdList
 * @text アクターIDリスト
 * @type actor[]
 * @default []
 * @desc 選択画面に表示するアクターのIDリストです。
 * 
 * @arg VariableActorIdList
 * @text アクターIDリスト（変数配列）
 * @type variable
 * @desc アクターIDリストが格納された変数番号です。
 * 配列形式[1,2,3]で格納してください。こちらが優先。
 * 
 * @arg WindowTitle
 * @text ウィンドウタイトル
 * @type string
 * @default スキル一覧を確認するキャラを選んでください
 * @desc 選択画面上部に表示するタイトル文字列です。
 * 
 * @-----------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------
 * 
 * @param ViewOnlyText
 * @text 閲覧専用テキスト
 * @type string
 * @default （閲覧専用）
 * @desc 閲覧専用モード時にヘルプ等に表示するテキストです。
 * 
 */

/*:ja
 * @target MZ
 * @plugindesc v1.10 パーティ未加入アクターのスキル習得画面を呼び出す（閲覧専用）
 * @author （NRP_LearnSkillList拡張）
 * @base NRP_LearnSkillList
 * @orderAfter NRP_LearnSkillList
 * @url 
 *
 * @help NRP_LearnSkillListの拡張プラグインです。
 * まだパーティに加入していない仲間のスキル習得一覧を
 * プラグインコマンドで呼び出すことができます。
 * 
 * ※未加入アクターの場合は「閲覧のみ」となり、
 * 　スキルの習得はできません。
 * 
 * -------------------------------------------------------------------
 * ■使い方
 * -------------------------------------------------------------------
 * 本プラグインはNRP_LearnSkillListが必須です。
 * プラグイン管理でNRP_LearnSkillListより下に配置してください。
 * 
 * -------------------------------------------------------------------
 * ■プラグインコマンド
 * -------------------------------------------------------------------
 * ◆シーン開始（非パーティ・閲覧専用）
 * パーティに加入していないアクターのスキル習得画面を呼び出します。
 * スキルの習得はできず、一覧の閲覧のみとなります。
 * アクターIDを直接指定、または変数で指定できます。
 * 
 * ◆アクター選択から開始（リスト指定・閲覧専用）
 * 指定したアクターIDリストから選択画面を表示し、
 * 選んだアクターのスキル習得画面を呼び出します。
 * スキルの習得はできず、一覧の閲覧のみとなります。
 * 
 * -------------------------------------------------------------------
 * ■注意事項
 * -------------------------------------------------------------------
 * ・未加入アクターの画面では習得操作ができません。
 * ・スキルポイントは表示されますが消費できません。
 * ・パーティに加入後は通常通り習得可能になります。
 * 
 * -------------------------------------------------------------------
 * ■利用規約
 * -------------------------------------------------------------------
 * 特に制約はありません。
 * 改変、再配布自由、商用可、権利表示も任意です。
 * 
 * @-----------------------------------------------------
 * @ プラグインコマンド
 * @-----------------------------------------------------
 * 
 * @command SceneStartNonParty
 * @text シーン開始（非パーティ・閲覧専用）
 * @desc パーティ未加入アクターのスキル一覧を閲覧します。
 * スキルの習得はできません。
 * 
 * @arg ActorId
 * @text アクターID
 * @type actor
 * @desc 対象とするアクターのIDです。
 * 
 * @arg VariableActorId
 * @text アクターID（変数）
 * @type variable
 * @desc アクターIDを変数で指定します。
 * こちらが優先されます。
 * 
 * @-----------------------------------------------------
 * 
 * @command SceneStartWithActorList
 * @text アクター選択から開始（リスト指定・閲覧専用）
 * @desc 指定したアクターリストから選択画面を表示し、
 * スキル一覧を閲覧します。習得はできません。
 * 
 * @arg ActorIdList
 * @text アクターIDリスト
 * @type actor[]
 * @default []
 * @desc 選択画面に表示するアクターのIDリストです。
 * 
 * @arg VariableActorIdList
 * @text アクターIDリスト（変数配列）
 * @type variable
 * @desc アクターIDリストが格納された変数番号です。
 * 配列形式[1,2,3]で格納してください。こちらが優先。
 * 
 * @arg WindowTitle
 * @text ウィンドウタイトル
 * @type string
 * @default スキル一覧を確認するキャラを選んでください
 * @desc 選択画面上部に表示するタイトル文字列です。
 * 
 * @-----------------------------------------------------
 * @ プラグインパラメータ
 * @-----------------------------------------------------
 * 
 * @param ViewOnlyText
 * @text 閲覧専用テキスト
 * @type string
 * @default （閲覧専用）
 * @desc 閲覧専用モード時にヘルプ等に表示するテキストです。
 * 
 */

(function() {
"use strict";

const PLUGIN_NAME = "NRP_LearnSkillList_NonParty";
const parameters = PluginManager.parameters(PLUGIN_NAME);
const pViewOnlyText = parameters["ViewOnlyText"] || "（閲覧専用）";

// 閲覧専用モードフラグ
let mViewOnlyMode = false;
// アクターリスト選択用のグローバル変数
let mTargetActorIds = [];
let mWindowTitle = "";

//-----------------------------------------------------------------------------
// ユーティリティ関数
//-----------------------------------------------------------------------------

function setDefault(str, def) {
    if (str == undefined || str == "") {
        return def;
    }
    return str;
}

function toNumber(str, def) {
    if (str == undefined || str == "") {
        return def;
    }
    return isNaN(str) ? def : +(str || def);
}

/**
 * ●アクターを取得（パーティ未加入でも可）
 */
function getActorById(args) {
    let actorId = setDefault(args.ActorId);

    // 変数の指定がある場合は優先
    const variableActorId = setDefault(args.VariableActorId);
    if (variableActorId) {
        actorId = $gameVariables.value(variableActorId);
    }

    if (!actorId) {
        return null;
    }

    // アクターを取得（パーティ加入の有無に関係なく取得可能）
    return $gameActors.actor(actorId);
}

/**
 * ●アクターIDリストを取得
 */
function getActorIdList(args) {
    // 変数指定がある場合は優先
    const variableActorIdList = setDefault(args.VariableActorIdList);
    if (variableActorIdList) {
        const listValue = $gameVariables.value(variableActorIdList);
        if (Array.isArray(listValue)) {
            return listValue.map(id => Number(id));
        }
        return [];
    }

    // 通常のリスト指定
    const actorIdList = args.ActorIdList;
    if (actorIdList) {
        try {
            const parsed = JSON.parse(actorIdList);
            return parsed.map(id => Number(id));
        } catch (e) {
            return [];
        }
    }

    return [];
}

/**
 * ●閲覧専用モードかどうかを取得
 */
function isViewOnlyMode() {
    return mViewOnlyMode;
}

// グローバルに公開（他の処理から参照用）
window.NRP_LearnSkillList_NonParty = {
    isViewOnlyMode: isViewOnlyMode
};

//-----------------------------------------------------------------------------
// プラグインコマンド
//-----------------------------------------------------------------------------

/**
 * ●シーン開始（非パーティ・閲覧専用）
 */
PluginManager.registerCommand(PLUGIN_NAME, "SceneStartNonParty", function(args) {
    const actor = getActorById(args);
    
    if (!actor) {
        console.warn("NRP_LearnSkillList_NonParty: アクターが見つかりません。");
        return;
    }

    // 選択肢ウィンドウが存在する場合は非表示
    if (SceneManager._scene._choiceListWindow) {
        SceneManager._scene._choiceListWindow.hide();
    }

    // 閲覧専用モードをON
    mViewOnlyMode = true;

    // 対象アクターの顔グラフィックを事前読み込み
    ImageManager.loadFace(actor.faceName());

    // メニューアクターとして設定（NRP_LearnSkillListの仕組みを利用）
    $gameParty._menuActorId = actor.actorId();

    // スキル習得シーンを開始
    SceneManager.push(Scene_LearnSkillList);
});

/**
 * ●アクター選択から開始（リスト指定・閲覧専用）
 */
PluginManager.registerCommand(PLUGIN_NAME, "SceneStartWithActorList", function(args) {
    const actorIdList = getActorIdList(args);
    
    if (!actorIdList || actorIdList.length === 0) {
        console.warn("NRP_LearnSkillList_NonParty: アクターリストが空です。");
        return;
    }

    // 有効なアクターのみフィルタ
    mTargetActorIds = actorIdList.filter(id => $gameActors.actor(id));
    
    if (mTargetActorIds.length === 0) {
        console.warn("NRP_LearnSkillList_NonParty: 有効なアクターがいません。");
        return;
    }

    // タイトルを設定
    mWindowTitle = setDefault(args.WindowTitle, "スキル一覧を確認するキャラを選んでください");

    // 選択肢ウィンドウが存在する場合は非表示
    if (SceneManager._scene._choiceListWindow) {
        SceneManager._scene._choiceListWindow.hide();
    }

    // 閲覧専用モードをON
    mViewOnlyMode = true;

    // 対象アクター全員の顔グラフィックを事前読み込み
    for (const actorId of mTargetActorIds) {
        const actor = $gameActors.actor(actorId);
        if (actor) {
            ImageManager.loadFace(actor.faceName());
        }
    }

    // メニューアクターをクリア
    $gameParty._menuActorId = 0;

    // カスタムアクター選択シーンを開始
    SceneManager.push(Scene_LearnSkillSelectActorCustom);
});

//-----------------------------------------------------------------------------
// Scene_LearnSkillSelectActorCustom
//
// カスタムアクター選択シーン（任意のアクターリストから選択）
//-----------------------------------------------------------------------------

function Scene_LearnSkillSelectActorCustom() {
    this.initialize(...arguments);
}

Scene_LearnSkillSelectActorCustom.prototype = Object.create(Scene_MenuBase.prototype);
Scene_LearnSkillSelectActorCustom.prototype.constructor = Scene_LearnSkillSelectActorCustom;

Scene_LearnSkillSelectActorCustom.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
};

/**
 * ●ウィンドウの生成
 */
Scene_LearnSkillSelectActorCustom.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    
    // タイトルウィンドウを作成
    this.createTitleWindow();
    // アクター選択用ウィンドウを作成
    this.createActorListWindow();
};

/**
 * ●タイトルウィンドウの作成
 */
Scene_LearnSkillSelectActorCustom.prototype.createTitleWindow = function() {
    const rect = this.titleWindowRect();
    this._titleWindow = new Window_Help(rect);
    this._titleWindow.setText(mWindowTitle);
    this.addWindow(this._titleWindow);
};

/**
 * ●タイトルウィンドウ領域
 */
Scene_LearnSkillSelectActorCustom.prototype.titleWindowRect = function() {
    const wx = 0;
    const wy = this.mainAreaTop();
    const ww = Graphics.boxWidth;
    const wh = this.calcWindowHeight(1, false);
    return new Rectangle(wx, wy, ww, wh);
};

/**
 * ●アクターリストウィンドウの作成
 */
Scene_LearnSkillSelectActorCustom.prototype.createActorListWindow = function() {
    const rect = this.actorListWindowRect();
    this._actorListWindow = new Window_LearnSkillActorList(rect);
    this._actorListWindow.setActorIds(mTargetActorIds);
    this._actorListWindow.setHandler("ok", this.onActorOk.bind(this));
    this._actorListWindow.setHandler("cancel", this.popScene.bind(this));
    this.addWindow(this._actorListWindow);
};

/**
 * ●アクターリストウィンドウ領域
 */
Scene_LearnSkillSelectActorCustom.prototype.actorListWindowRect = function() {
    const titleRect = this.titleWindowRect();
    const wx = 0;
    const wy = titleRect.y + titleRect.height;
    const ww = Graphics.boxWidth;
    const wh = Graphics.boxHeight - wy;
    return new Rectangle(wx, wy, ww, wh);
};

/**
 * ●処理開始
 */
Scene_LearnSkillSelectActorCustom.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    
    this._actorListWindow.refresh();
    this._actorListWindow.activate();
    this._actorListWindow.select(0);
};

/**
 * ●アクターの選択確定
 */
Scene_LearnSkillSelectActorCustom.prototype.onActorOk = function() {
    const actor = this._actorListWindow.currentActor();
    if (actor) {
        $gameParty._menuActorId = actor.actorId();
        SceneManager.push(Scene_LearnSkillList);
    }
};

/**
 * ●シーン終了時
 */
Scene_LearnSkillSelectActorCustom.prototype.terminate = function() {
    Scene_MenuBase.prototype.terminate.call(this);
    // マップに戻る時は閲覧専用モードを解除
    if (SceneManager._nextScene instanceof Scene_Map) {
        mViewOnlyMode = false;
    }
};

//-----------------------------------------------------------------------------
// Window_LearnSkillActorList
//
// アクター選択ウィンドウ（任意のアクターリスト表示）
//-----------------------------------------------------------------------------

function Window_LearnSkillActorList() {
    this.initialize(...arguments);
}

Window_LearnSkillActorList.prototype = Object.create(Window_Selectable.prototype);
Window_LearnSkillActorList.prototype.constructor = Window_LearnSkillActorList;

Window_LearnSkillActorList.prototype.initialize = function(rect) {
    Window_Selectable.prototype.initialize.call(this, rect);
    this._actorIds = [];
    this._actors = [];
};

/**
 * ●アクターIDリストを設定
 */
Window_LearnSkillActorList.prototype.setActorIds = function(actorIds) {
    this._actorIds = actorIds;
    this._actors = actorIds.map(id => $gameActors.actor(id)).filter(a => a);
    this.refresh();
};

/**
 * ●最大項目数
 */
Window_LearnSkillActorList.prototype.maxItems = function() {
    return this._actors.length;
};

/**
 * ●現在選択中のアクター
 */
Window_LearnSkillActorList.prototype.currentActor = function() {
    return this._actors[this.index()];
};

/**
 * ●項目の高さ
 */
Window_LearnSkillActorList.prototype.itemHeight = function() {
    return Math.floor(this.innerHeight / this.numVisibleRows());
};

/**
 * ●表示行数
 */
Window_LearnSkillActorList.prototype.numVisibleRows = function() {
    return Math.min(this._actors.length, 4);
};

/**
 * ●項目の描画
 */
Window_LearnSkillActorList.prototype.drawItem = function(index) {
    const actor = this._actors[index];
    if (!actor) return;

    const rect = this.itemRect(index);
    const lineHeight = this.lineHeight();
    
    // 顔グラフィックを描画
    const faceWidth = ImageManager.faceWidth;
    const faceHeight = ImageManager.faceHeight;
    const facePadding = 4;
    this.drawActorFace(actor, rect.x + facePadding, rect.y + facePadding, 
                       Math.min(faceWidth, rect.height - facePadding * 2), 
                       Math.min(faceHeight, rect.height - facePadding * 2));
    
    // テキスト開始位置
    const textX = rect.x + faceWidth + 20;
    const textWidth = rect.width - faceWidth - 30;
    
    // 名前
    this.drawText(actor.name(), textX, rect.y + 4, textWidth);
    
    // クラス
    this.changeTextColor(ColorManager.systemColor());
    this.drawText(actor.currentClass().name, textX, rect.y + lineHeight + 4, textWidth);
    this.resetTextColor();
    
    // レベル
    const levelLabel = TextManager.levelA;
    const levelValue = actor.level;
    this.drawText(levelLabel + " " + levelValue, textX + 200, rect.y + lineHeight + 4, 100);
    
    // スキルポイント表示（NRP_LearnSkillListの機能を利用）
    if (actor.skillPoint !== undefined) {
        const sp = actor.skillPoint();
        const spName = this.getSkillPointName();
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(spName + ":", textX, rect.y + lineHeight * 2 + 4, 60);
        this.resetTextColor();
        this.drawText(sp, textX + 70, rect.y + lineHeight * 2 + 4, 100);
    }
};

/**
 * ●スキルポイント名を取得
 */
Window_LearnSkillActorList.prototype.getSkillPointName = function() {
    // NRP_LearnSkillListのパラメータから取得を試みる
    const params = PluginManager.parameters("NRP_LearnSkillList");
    return params["SkillPointName"] || "SP";
};

/**
 * ●顔グラフィックの描画（サイズ調整版）
 */
Window_LearnSkillActorList.prototype.drawActorFace = function(actor, x, y, width, height) {
    this.drawFace(actor.faceName(), actor.faceIndex(), x, y, width, height);
};

/**
 * ●リフレッシュ
 */
Window_LearnSkillActorList.prototype.refresh = function() {
    // 顔グラフィックの事前読み込み
    for (const actor of this._actors) {
        ImageManager.loadFace(actor.faceName());
    }
    Window_Selectable.prototype.refresh.call(this);
};

//-----------------------------------------------------------------------------
// Scene_LearnSkillList の拡張
// （閲覧専用モード対応）
//-----------------------------------------------------------------------------

if (typeof Scene_LearnSkillList !== "undefined") {
    
    /**
     * ●シーン初期化時に閲覧専用モードの場合は顔グラを読み込む
     */
    const _Scene_LearnSkillList_initialize = Scene_LearnSkillList.prototype.initialize;
    Scene_LearnSkillList.prototype.initialize = function() {
        _Scene_LearnSkillList_initialize.apply(this, arguments);
        
        // 閲覧専用モードの場合、対象アクターの顔グラを読み込む
        if (mViewOnlyMode && $gameParty._menuActorId) {
            const actor = $gameActors.actor($gameParty._menuActorId);
            if (actor) {
                ImageManager.loadFace(actor.faceName());
            }
        }
    };

    /**
     * ●アクター取得のオーバーライド
     * 閲覧専用モードの場合、パーティメンバーかどうかに関係なくアクターを取得
     */
    const _Scene_LearnSkillList_actor = Scene_LearnSkillList.prototype.actor;
    Scene_LearnSkillList.prototype.actor = function() {
        // 閲覧専用モードの場合は直接アクターを取得
        if (mViewOnlyMode && $gameParty._menuActorId) {
            return $gameActors.actor($gameParty._menuActorId);
        }
        return _Scene_LearnSkillList_actor.apply(this, arguments);
    };

    /**
     * ●シーン終了時に閲覧専用モードを解除
     */
    const _Scene_LearnSkillList_terminate = Scene_LearnSkillList.prototype.terminate;
    Scene_LearnSkillList.prototype.terminate = function() {
        _Scene_LearnSkillList_terminate.apply(this, arguments);
        // マップに戻る時は閲覧専用モードを解除
        if (SceneManager._nextScene instanceof Scene_Map) {
            mViewOnlyMode = false;
        }
    };

    // nextActor/previousActorの無効化（リスト指定時）
    const _Scene_LearnSkillList_nextActor = Scene_LearnSkillList.prototype.nextActor;
    Scene_LearnSkillList.prototype.nextActor = function() {
        // 閲覧専用モード時でリストがある場合
        if (mViewOnlyMode && mTargetActorIds.length > 0) {
            const currentId = $gameParty._menuActorId;
            const currentIndex = mTargetActorIds.indexOf(currentId);
            if (currentIndex >= 0 && currentIndex < mTargetActorIds.length - 1) {
                const nextId = mTargetActorIds[currentIndex + 1];
                $gameParty._menuActorId = nextId;
                this.updateActor();
                this.onActorChange();
                return;
            }
            return; // リスト外なら何もしない
        }
        _Scene_LearnSkillList_nextActor.apply(this, arguments);
    };

    const _Scene_LearnSkillList_previousActor = Scene_LearnSkillList.prototype.previousActor;
    Scene_LearnSkillList.prototype.previousActor = function() {
        // 閲覧専用モード時でリストがある場合
        if (mViewOnlyMode && mTargetActorIds.length > 0) {
            const currentId = $gameParty._menuActorId;
            const currentIndex = mTargetActorIds.indexOf(currentId);
            if (currentIndex > 0) {
                const prevId = mTargetActorIds[currentIndex - 1];
                $gameParty._menuActorId = prevId;
                this.updateActor();
                this.onActorChange();
                return;
            }
            return; // リスト外なら何もしない
        }
        _Scene_LearnSkillList_previousActor.apply(this, arguments);
    };
}

//-----------------------------------------------------------------------------
// Window_LearnSkillList の拡張
// （閲覧専用モード対応：スキル選択を無効化）
//-----------------------------------------------------------------------------

if (typeof Window_LearnSkillList !== "undefined") {
    
    /**
     * ●項目が有効かどうか（習得可能かどうか）
     */
    const _Window_LearnSkillList_isEnabled = Window_LearnSkillList.prototype.isEnabled;
    Window_LearnSkillList.prototype.isEnabled = function(item) {
        // 閲覧専用モードの場合は全て無効（習得不可）
        if (mViewOnlyMode) {
            return false;
        }
        return _Window_LearnSkillList_isEnabled.apply(this, arguments);
    };

    /**
     * ●項目の描画
     * ※閲覧専用モード時も見やすくするため、描画自体は通常通り
     */
    const _Window_LearnSkillList_drawItem = Window_LearnSkillList.prototype.drawItem;
    Window_LearnSkillList.prototype.drawItem = function(index) {
        _Window_LearnSkillList_drawItem.apply(this, arguments);
    };
}

//-----------------------------------------------------------------------------
// Window_LearnSkillConfirm の拡張
// （閲覧専用モード対応：確認ウィンドウを表示しない）
//-----------------------------------------------------------------------------

if (typeof Window_LearnSkillConfirm !== "undefined") {
    
    /**
     * ●確認ウィンドウの表示
     */
    const _Window_LearnSkillConfirm_show = Window_LearnSkillConfirm.prototype.show;
    Window_LearnSkillConfirm.prototype.show = function() {
        // 閲覧専用モードの場合は表示しない
        if (mViewOnlyMode) {
            return;
        }
        _Window_LearnSkillConfirm_show.apply(this, arguments);
    };
}

//-----------------------------------------------------------------------------
// ヘルプウィンドウへの閲覧専用表示
//-----------------------------------------------------------------------------

if (typeof Window_Help !== "undefined") {
    
    const _Window_Help_setText = Window_Help.prototype.setText;
    Window_Help.prototype.setText = function(text) {
        // Scene_LearnSkillList内で閲覧専用モードの場合、注記を追加
        if (mViewOnlyMode && SceneManager._scene instanceof Scene_LearnSkillList) {
            // ヘルプテキストに閲覧専用の注記を追加（2行目がある場合は末尾に）
            if (text && !text.includes(pViewOnlyText)) {
                // 改行があるか確認
                if (text.includes("\n")) {
                    text = text + " " + pViewOnlyText;
                } else {
                    text = text + "\n" + pViewOnlyText;
                }
            }
        }
        _Window_Help_setText.apply(this, arguments);
    };
}

// グローバルスコープに公開（他プラグインからの参照用）
window.Scene_LearnSkillSelectActorCustom = Scene_LearnSkillSelectActorCustom;
window.Window_LearnSkillActorList = Window_LearnSkillActorList;

})();
