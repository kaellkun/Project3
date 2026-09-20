/*:-----------------------------------------------------------------------------------
 * KEN_StateIconName.js
 * 
 * Copyright (C) 2025 KEN
 * This software is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 * -------------------------------------------------------------------------------------
 */
/*:
 * @target MZ
 * @plugindesc State name display on state icon (Modified)
 * @author KEN (Modified)
 * @version 1.0.2
 * @base NUUN_Base
 * @base NUUN_StateTurn
 * @orderAfter NUUN_Base
 * @orderAfter NUUN_StateTurn
 * @orderAfter NUUN_StateIconSideBySide
 * 
 * @help
 * Displays the state name above the state icon.
 * By default, the first 2 characters of the state name are displayed.
 * 
 * [v1.0.2 Changes]
 * - Fixed bug where states with the same icon would display the same name
 * 
 * [v1.0.1 Changes]
 * - Added font parameter (supports Keke_CommonData registered fonts)
 * 
 * [Required Plugin]
 * - NUUN_StateTurn (must be placed above this plugin)
 * 
 * To specify a custom abbreviation, add the following tag to the state's note field:
 * <StateName:XX>
 * 
 * Example:
 * <StateName:毒>     → Displays "毒"
 * <StateName:ATK↑>   → Displays "ATK↑"
 * 
 * This plugin is compatible with:
 * - NUUN_StateTurn (remaining turn display)
 * - NUUN_StateIconSideBySide (side-by-side state display)
 * 
 * When used with NUUN_StateTurn:
 * - State name is displayed at the top of the icon
 * - Remaining turns are displayed at the bottom
 * 
 * Terms of Use
 * This plugin is distributed under the MIT license.
 * 
 * Log
 * 1/9/2025 Ver.1.0.0
 * First edition.
 * 1/13/2025 Ver.1.0.1
 * Added font parameter.
 * 1/22/2025 Ver.1.0.2
 * Fixed same icon bug.
 * 
 * @param ActorStateNameVisible
 * @desc Show state name on ally state icons.
 * @text Ally state name display
 * @type boolean
 * @default true
 * 
 * @param EnemyStateNameVisible
 * @desc Show state name on enemy state icons.
 * @text Enemy state name display
 * @type boolean
 * @default true
 * 
 * @param DefaultNameLength
 * @desc Default number of characters to display from state name.
 * @text Default name length
 * @type number
 * @default 2
 * @min 1
 * @max 10
 * 
 * @param NameX
 * @desc State name coordinate X (relative).
 * @text Name X coordinate
 * @type number
 * @default 0
 * @min -9999
 * 
 * @param NameY
 * @desc State name coordinate Y (relative).
 * @text Name Y coordinate
 * @type number
 * @default -4
 * @min -9999
 * 
 * @param NameFont
 * @desc Font for state name. Use font name registered in Keke_CommonData. Leave empty for main font.
 * @text Name font
 * @type string
 * @default 
 * 
 * @param NameFontSize
 * @desc Font size for state name (from main font).
 * @text Name font size
 * @type number
 * @default -10
 * @min -9999
 * 
 * @param BuffNameColor
 * @text Buff/Advantageous state name color
 * @desc System color number for buff and advantageous state names.
 * @type color
 * @default 0
 * 
 * @param DebuffNameColor
 * @text Debuff/Disadvantageous state name color
 * @desc System color number for debuff and disadvantageous state names.
 * @type color
 * @default 0
 * 
 * @param ShowBuffName
 * @desc Show name for buff icons (ATK↑, DEF↓, etc).
 * @text Show buff names
 * @type boolean
 * @default true
 * 
 * @param BuffNames
 * @text Custom buff names
 * @desc Custom names for buff parameters.
 * @type struct<BuffNameSetting>[]
 * @default ["{\"paramId\":\"0\",\"buffName\":\"HP\",\"debuffName\":\"HP\"}","{\"paramId\":\"1\",\"buffName\":\"MP\",\"debuffName\":\"MP\"}","{\"paramId\":\"2\",\"buffName\":\"攻\",\"debuffName\":\"攻\"}","{\"paramId\":\"3\",\"buffName\":\"防\",\"debuffName\":\"防\"}","{\"paramId\":\"4\",\"buffName\":\"魔攻\",\"debuffName\":\"魔攻\"}","{\"paramId\":\"5\",\"buffName\":\"魔防\",\"debuffName\":\"魔防\"}","{\"paramId\":\"6\",\"buffName\":\"敏\",\"debuffName\":\"敏\"}","{\"paramId\":\"7\",\"buffName\":\"運\",\"debuffName\":\"運\"}"]
 * 
 */
/*:ja
 * @target MZ
 * @plugindesc ステートアイコン上にステート名表示（修正版）
 * @author KEN (Modified)
 * @version 1.0.2
 * @base NUUN_Base
 * @base NUUN_StateTurn
 * @orderAfter NUUN_Base
 * @orderAfter NUUN_StateTurn
 * @orderAfter NUUN_StateIconSideBySide
 * 
 * @help
 * ステートアイコンの上にステート名を表示します。
 * デフォルトではステート名の最初の2文字が表示されます。
 * 
 * 【v1.0.2 変更点】
 * ・同じアイコンのステートが複数ある場合に、すべて同じ名前が表示されるバグを修正
 * 
 * 【v1.0.1 変更点】
 * ・フォントパラメータ追加（Keke_CommonData登録フォント対応）
 * 
 * 【必須プラグイン】
 * - NUUN_StateTurn（このプラグインより上に配置してください）
 * 
 * 略称を指定したい場合は、ステートのメモ欄に以下のタグを記述してください：
 * <StateName:略称>
 * 
 * 例：
 * <StateName:毒>      → 「毒」と表示
 * <StateName:ATK↑>    → 「ATK↑」と表示
 * 
 * 以下のプラグインと互換性があります：
 * - NUUN_StateTurn（残りターン表示）
 * - NUUN_StateIconSideBySide（ステート横並び表示）
 * 
 * NUUN_StateTurnと併用時：
 * - ステート名はアイコンの上部に表示
 * - 残りターンはアイコンの下部に表示
 * 
 * 利用規約
 * このプラグインはMITライセンスで配布しています。
 * 
 * 更新履歴
 * 2025/1/9 Ver.1.0.0
 * 初版
 * 2025/1/13 Ver.1.0.1
 * フォントパラメータ追加
 * 2025/1/22 Ver.1.0.2
 * 同じアイコンのステートで名前が重複するバグを修正
 * 
 * @param ActorStateNameVisible
 * @desc 味方のステートアイコンにステート名を表示します。
 * @text 味方ステート名表示
 * @type boolean
 * @default true
 * 
 * @param EnemyStateNameVisible
 * @desc 敵のステートアイコンにステート名を表示します。
 * @text 敵ステート名表示
 * @type boolean
 * @default true
 * 
 * @param DefaultNameLength
 * @desc ステート名から表示するデフォルトの文字数。
 * @text デフォルト表示文字数
 * @type number
 * @default 2
 * @min 1
 * @max 10
 * 
 * @param NameX
 * @desc ステート名座標X（相対）
 * @text ステート名座標X（相対）
 * @type number
 * @default 0
 * @min -9999
 * 
 * @param NameY
 * @desc ステート名座標Y（相対）
 * @text ステート名座標Y（相対）
 * @type number
 * @default -4
 * @min -9999
 * 
 * @param NameFont
 * @desc ステート名のフォント。『Keke_CommonData』で登録したフォント名を書く。空欄ならメインフォント
 * @text ステート名フォント
 * @type string
 * @default 
 * 
 * @param NameFontSize
 * @desc ステート名のフォントサイズ。（メインフォントから）
 * @text ステート名フォントサイズ
 * @type number
 * @default -10
 * @min -9999
 * 
 * @param BuffNameColor
 * @text バフ・有利ステート名の色
 * @desc バフ・有利ステートのステート名のシステムカラー番号。(テキストタブからカラーコード入力可能)
 * @type color
 * @default 0
 * 
 * @param DebuffNameColor
 * @text デバフ・不利ステート名の色
 * @desc デバフ・不利ステートのステート名のシステムカラー番号。(テキストタブからカラーコード入力可能)
 * @type color
 * @default 0
 * 
 * @param ShowBuffName
 * @desc バフアイコン（攻撃力↑、防御力↓など）にも名前を表示します。
 * @text バフ名表示
 * @type boolean
 * @default true
 * 
 * @param BuffNames
 * @text バフ名カスタム設定
 * @desc バフパラメータのカスタム名設定。
 * @type struct<BuffNameSetting>[]
 * @default ["{\"paramId\":\"0\",\"buffName\":\"HP\",\"debuffName\":\"HP\"}","{\"paramId\":\"1\",\"buffName\":\"MP\",\"debuffName\":\"MP\"}","{\"paramId\":\"2\",\"buffName\":\"攻\",\"debuffName\":\"攻\"}","{\"paramId\":\"3\",\"buffName\":\"防\",\"debuffName\":\"防\"}","{\"paramId\":\"4\",\"buffName\":\"魔攻\",\"debuffName\":\"魔攻\"}","{\"paramId\":\"5\",\"buffName\":\"魔防\",\"debuffName\":\"魔防\"}","{\"paramId\":\"6\",\"buffName\":\"敏\",\"debuffName\":\"敏\"}","{\"paramId\":\"7\",\"buffName\":\"運\",\"debuffName\":\"運\"}"]
 * 
 */
/*~struct~BuffNameSetting:
 * @param paramId
 * @text Parameter ID
 * @desc Parameter ID (0:HP, 1:MP, 2:ATK, 3:DEF, 4:MAT, 5:MDF, 6:AGI, 7:LUK)
 * @type select
 * @option HP
 * @value 0
 * @option MP
 * @value 1
 * @option ATK
 * @value 2
 * @option DEF
 * @value 3
 * @option MAT
 * @value 4
 * @option MDF
 * @value 5
 * @option AGI
 * @value 6
 * @option LUK
 * @value 7
 * @default 0
 * 
 * @param buffName
 * @text Buff name
 * @desc Name to display when buffed.
 * @type string
 * @default 
 * 
 * @param debuffName
 * @text Debuff name
 * @desc Name to display when debuffed.
 * @type string
 * @default 
 */
/*~struct~BuffNameSetting:ja
 * @param paramId
 * @text パラメータID
 * @desc パラメータID (0:HP, 1:MP, 2:攻撃力, 3:防御力, 4:魔法力, 5:魔法防御, 6:敏捷性, 7:運)
 * @type select
 * @option HP
 * @value 0
 * @option MP
 * @value 1
 * @option 攻撃力
 * @value 2
 * @option 防御力
 * @value 3
 * @option 魔法力
 * @value 4
 * @option 魔法防御
 * @value 5
 * @option 敏捷性
 * @value 6
 * @option 運
 * @value 7
 * @default 0
 * 
 * @param buffName
 * @text バフ時の名前
 * @desc バフ時に表示する名前。
 * @type string
 * @default 
 * 
 * @param debuffName
 * @text デバフ時の名前
 * @desc デバフ時に表示する名前。
 * @type string
 * @default 
 */

var Imported = Imported || {};
Imported.KEN_StateIconName = true;

(() => {
    'use strict';
    
    // NUUN_StateTurn 必須チェック
    if (!Imported.NUUN_StateTurn) {
        console.error('KEN_StateIconName: NUUN_StateTurn is required. Please install and place it above this plugin.');
        return;
    }
    
    const pluginName = 'KEN_StateIconName';
    const parameters = PluginManager.parameters(pluginName);
    
    const ActorStateNameVisible = parameters['ActorStateNameVisible'] === 'true';
    const EnemyStateNameVisible = parameters['EnemyStateNameVisible'] === 'true';
    const DefaultNameLength = Number(parameters['DefaultNameLength'] || 2);
    const NameX = Number(parameters['NameX'] || 0);
    const NameY = Number(parameters['NameY'] || -4);
    const NameFont = parameters['NameFont'] || '';
    const NameFontSize = Number(parameters['NameFontSize'] || -10);
    const BuffNameColor = (DataManager.nuun_structureData(parameters['BuffNameColor'])) || 0;
    const DebuffNameColor = (DataManager.nuun_structureData(parameters['DebuffNameColor'])) || 0;
    const ShowBuffName = parameters['ShowBuffName'] === 'true';
    
    // バフ名設定のパース
    let BuffNames = [];
    try {
        BuffNames = JSON.parse(parameters['BuffNames'] || '[]').map(str => {
            const obj = JSON.parse(str);
            return {
                paramId: Number(obj.paramId),
                buffName: obj.buffName || '',
                debuffName: obj.debuffName || ''
            };
        });
    } catch (e) {
        console.warn('KEN_StateIconName: BuffNames parse error', e);
    }
    
    // バフ名を取得する関数
    const getBuffName = (paramId, isBuff) => {
        const setting = BuffNames.find(s => s.paramId === paramId);
        if (setting) {
            return isBuff ? setting.buffName : setting.debuffName;
        }
        // デフォルト名
        const defaultNames = ['HP', 'MP', '攻', '防', '魔攻', '魔防', '敏', '運'];
        return defaultNames[paramId] || '';
    };

    //=============================================================================
    // ステート名取得関連
    //=============================================================================
    
    /**
     * ステートの表示名を取得
     * @param {Object} state - ステートデータ
     * @returns {string} 表示するステート名
     */
    const getStateDisplayName = (state) => {
        if (!state) return '';
        
        // メモ欄から<StateName:XX>タグを検索
        const meta = state.meta;
        if (meta && meta.StateName) {
            return String(meta.StateName);
        }
        
        // タグがなければデフォルトの文字数で切り取る
        return state.name.substring(0, DefaultNameLength);
    };
    
    /**
     * ステートが不利ステート（バッドステート）かどうかを判定
     * @param {Object} state - ステートデータ
     * @returns {boolean}
     */
    const isBadState = (state) => {
        if (!state) return false;
        return !!state.meta.BatState;
    };

    //=============================================================================
    // Game_BattlerBase - ステート名情報の取得
    //=============================================================================
    
    /**
     * 全ステート・バフの名前情報を取得
     * @returns {Array} [{name: string, bad: boolean}, ...]
     */
    Game_BattlerBase.prototype.allStateNames = function() {
        const names = this.ken_stateNames();
        if (ShowBuffName) {
            Array.prototype.push.apply(names, this.ken_buffNames());
        }
        return names;
    };
    
    /**
     * ステートの名前情報を取得
     * 【v1.0.2 修正】ステート配列を直接使用し、アイコンで検索しない
     * @returns {Array}
     */
    Game_BattlerBase.prototype.ken_stateNames = function() {
        const states = this.nuun_stateTurnFilter(); // NUUN_StateTurn のメソッドを流用
        const names = [];
        
        // 【修正】ステート配列を直接イテレートする
        // アイコンIDで検索すると、同じアイコンのステートが重複してしまう
        for (const state of states) {
            if (state && state.iconIndex > 0) {
                names.push({
                    name: getStateDisplayName(state),
                    bad: isBadState(state)
                });
            }
        }
        return names;
    };
    
    /**
     * バフの名前情報を取得
     * @returns {Array}
     */
    Game_BattlerBase.prototype.ken_buffNames = function() {
        const buffIcons = this.buffIcons();
        const names = [];
        
        buffIcons.forEach(buffIcon => {
            let paramId = 0;
            let isBuff = true;
            
            if (buffIcon > Game_BattlerBase.ICON_DEBUFF_START) {
                paramId = (buffIcon - Game_BattlerBase.ICON_DEBUFF_START) % 8;
                isBuff = false;
            } else if (buffIcon > Game_BattlerBase.ICON_BUFF_START) {
                paramId = (buffIcon - Game_BattlerBase.ICON_BUFF_START) % 8;
                isBuff = true;
            }
            
            const buff = this._buffs[paramId];
            if (buff !== 0 && this.nuun_buffTurnsFilter(paramId)) { // NUUN_StateTurn のメソッドを流用
                names.push({
                    name: getBuffName(paramId, buff > 0),
                    bad: buff < 0
                });
            }
        });
        return names;
    };

    //=============================================================================
    // Sprite_StateIcon - ステート名表示（NUUN_StateTurn のメソッドをフック）
    //=============================================================================
    
    /**
     * textTurn をフックして名前表示用スプライトも作成
     */
    const _Sprite_StateIcon_textTurn = Sprite_StateIcon.prototype.textTurn;
    Sprite_StateIcon.prototype.textTurn = function() {
        _Sprite_StateIcon_textTurn.call(this);
        this.ken_textName();
    };
    
    /**
     * ステート名表示用スプライトを作成
     */
    Sprite_StateIcon.prototype.ken_textName = function() {
        const sprite = new Sprite();
        this.addChild(sprite);
        this._kenNameSprite = sprite;
        this._kenNameSprite.x = this.x + NameX;
        this._kenNameSprite.y = this.y + NameY;
        this._kenNameSprite.bitmap = new Bitmap(this.bitmap.width, this.bitmap.height);
        this._kenStateName = '';
        this._kenStateNameBad = false;
    };
    
    /**
     * updateTurn をフックして名前データも更新
     */
    const _Sprite_StateIcon_updateTurn = Sprite_StateIcon.prototype.updateTurn;
    Sprite_StateIcon.prototype.updateTurn = function(index) {
        _Sprite_StateIcon_updateTurn.call(this, index);
        this.ken_updateStateName(index);
    };
    
    /**
     * ステート名を更新
     * @param {number} index - アニメーションインデックス
     */
    Sprite_StateIcon.prototype.ken_updateStateName = function(index) {
        let names = [];
        if (this.shouldDisplay() && this.ken_shouldShowName()) {
            names = this._battler.allStateNames();
        }
        const nameData = names[index];
        this._kenStateName = nameData ? nameData.name : '';
        this._kenStateNameBad = nameData ? nameData.bad : false;
    };
    
    /**
     * ステート名表示の可否判定
     * @returns {boolean}
     */
    Sprite_StateIcon.prototype.ken_shouldShowName = function() {
        if (!this._battler) return false;
        if (this._battler.isActor()) {
            return ActorStateNameVisible;
        } else if (this._battler.isEnemy()) {
            return EnemyStateNameVisible;
        }
        return false;
    };
    
    /**
     * updateFrame をフックして名前を描画
     */
    const _Sprite_StateIcon_updateFrame = Sprite_StateIcon.prototype.updateFrame;
    Sprite_StateIcon.prototype.updateFrame = function() {
        _Sprite_StateIcon_updateFrame.call(this);
        this.ken_drawStateName();
    };
    
    /**
     * ステート名を描画
     */
    Sprite_StateIcon.prototype.ken_drawStateName = function() {
        if (!this._kenNameSprite || !this._kenNameSprite.bitmap) return;
        
        this._kenNameSprite.bitmap.clear();
        if (this._kenStateName && this._kenStateName.length > 0) {
            this.ken_setupNameFont();
            this._kenNameSprite.bitmap.drawText(
                this._kenStateName, 
                0, 
                0, 
                ImageManager.iconWidth, 
                ImageManager.iconHeight
            );
        }
    };
    
    /**
     * ステート名用フォント設定（Keke_StatePopup方式）
     */
    Sprite_StateIcon.prototype.ken_setupNameFont = function() {
        if (!this._kenNameSprite || !this._kenNameSprite.bitmap) return;
        
        const bitmap = this._kenNameSprite.bitmap;
        // フォントフェイスを設定（Keke_StatePopup方式）
        bitmap.fontFace = NameFont || $gameSystem.mainFontFace();
        bitmap.fontSize = this.nuun_fontSize() + NameFontSize;
        bitmap.textColor = this.ken_nameTextColor();
        bitmap.outlineColor = this.nuun_outlineColor();
        bitmap.outlineWidth = this.nuun_outlineWidth();
    };
    
    /**
     * ステート名の文字色
     * @returns {string}
     */
    Sprite_StateIcon.prototype.ken_nameTextColor = function() {
        const colorIndex = this._kenStateNameBad ? DebuffNameColor : BuffNameColor;
        return NuunManager.getColorCode(colorIndex);
    };

})();
