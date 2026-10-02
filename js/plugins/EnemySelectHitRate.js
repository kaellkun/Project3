//=============================================================================
// RPG Maker MZ - Enemy Select Hit Rate
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 敵選択ウィンドウで敵名の横に命中率を表示します。
 * @author Copilot
 * @orderAfter Battle/Log/RIT_HitRateDisplay
 * @orderAfter State/KEN_ForcedTargetState
 *
 * @help
 * 戦闘中に敵を選択するとき、入力中のスキル・アイテムをその敵に使った
 * 場合の命中率を敵名の右側に表示します。
 * 敵全体・敵ランダム対象のスキルでも敵選択ウィンドウを表示し、対象範囲を
 * チップで案内します。これらの範囲では敵を選んでも実際の対象は変更しません。
 *
 * 命中率は RIT_HitRateDisplay が導入されていればその計算
 * (Game_Action.getHitRateInfo) を、無ければ標準の
 * itemHit × (1 - itemEva) を使うため、バトルログの表示と一致します。
 *
 * @param Format
 * @text 表示書式
 * @desc 命中率の書式。%1 が命中率(整数)に置き換わります。
 * @type string
 * @default %1%
 *
 * @param TextColor
 * @text 文字色
 * @desc 命中率の文字色(システムカラー番号)。
 * @type number
 * @min 0
 * @max 31
 * @default 0
 *
 * @param ShowCertainHit
 * @text 必中スキルでも表示
 * @desc 必中タイプのスキル・アイテムでも命中率を表示するか。
 * @type boolean
 * @default true
 */

(() => {
    "use strict";

    const pluginName = "EnemySelectHitRate";
    const parameters = PluginManager.parameters(pluginName);
    const paramFormat = String(parameters.Format || "%1%");
    const paramTextColor = Number(parameters.TextColor || 0);
    const paramShowCertainHit = parameters.ShowCertainHit !== "false";
    const scopePreviewHeaderHeight = 38;

    const clamp01 = value => Math.min(Math.max(Number(value) || 0, 0), 1);

    Window_BattleEnemy.prototype.hitRateForEnemy = function(enemy) {
        const action = BattleManager.inputtingAction && BattleManager.inputtingAction();
        if (!action || !enemy) return null;
        const item = action.item();
        if (!item) return null;
        if (!paramShowCertainHit && item.hitType === Game_Action.HITTYPE_CERTAIN) return null;
        if (typeof action.getHitRateInfo === "function") {
            const info = action.getHitRateInfo(enemy);
            if (info && info.type !== "none") return info.finalRate;
        }
        const hit = clamp01(action.itemHit(enemy));
        const eva = clamp01(action.itemEva(enemy));
        return Math.round(hit * (1 - eva) * 100);
    };

    Window_BattleEnemy.prototype.hitRateText = function(index) {
        const rate = this.hitRateForEnemy(this._enemies[index]);
        return rate === null ? "" : paramFormat.replace("%1", String(rate));
    };

    Window_BattleEnemy.prototype.scopePreviewText = function() {
        const action = BattleManager.inputtingAction && BattleManager.inputtingAction();
        if (!this._scopePreviewMode || !action) return "";
        if (this._scopePreviewMode === "all") return "敵全体";
        if (this._scopePreviewMode === "random") return `敵ランダム${action.numTargets()}回`;
        return "";
    };

    Window_BattleEnemy.prototype.setScopePreviewMode = function(mode) {
        if (this._scopePreviewMode === mode) return;
        this._scopePreviewMode = mode;
        this.refresh();
        this.refreshCursor();
    };

    const _Window_BattleEnemy_itemRect = Window_BattleEnemy.prototype.itemRect;
    Window_BattleEnemy.prototype.itemRect = function(index) {
        const rect = _Window_BattleEnemy_itemRect.call(this, index);
        if (this.scopePreviewText()) rect.y += scopePreviewHeaderHeight;
        return rect;
    };

    const _Window_BattleEnemy_refresh = Window_BattleEnemy.prototype.refresh;
    Window_BattleEnemy.prototype.refresh = function() {
        _Window_BattleEnemy_refresh.call(this);
        this.drawScopePreviewChip();
    };

    Window_BattleEnemy.prototype.drawScopePreviewChip = function() {
        const label = this.scopePreviewText();
        if (!label || !this.contents) return;
        this.resetFontSettings();
        this.contents.fontSize = 20;
        const x = 12;
        const y = 5;
        const height = 28;
        const width = Math.min(this.innerWidth - 24, this.textWidth(label) + 28);
        if (width <= 0) return;
        const background = this._scopePreviewMode === "all" ? "rgba(34, 104, 112, 0.88)" : "rgba(103, 83, 42, 0.88)";
        const accent = this._scopePreviewMode === "all" ? "#75e1d2" : "#f0cf78";
        this.contents.fillRect(x, y, width, height, background);
        this.contents.fillRect(x, y, 3, height, accent);
        this.contents.fillRect(x + 3, y, width - 3, 1, accent);
        this.contents.fillRect(x + 3, y + height - 1, width - 3, 1, accent);
        this.changeTextColor(ColorManager.normalColor());
        this.drawText(label, x + 12, y, width - 18, height, "left");
        this.resetTextColor();
        this.resetFontSettings();
    };

    const _Window_BattleEnemy_select = Window_BattleEnemy.prototype.select;
    Window_BattleEnemy.prototype.select = function(index) {
        _Window_BattleEnemy_select.call(this, index);
        if (this._scopePreviewMode === "all") {
            for (const enemy of $gameTroop.aliveMembers()) enemy.select();
        }
    };

    const _Window_BattleEnemy_refreshCursor = Window_BattleEnemy.prototype.refreshCursor;
    Window_BattleEnemy.prototype.refreshCursor = function() {
        if (this._scopePreviewMode === "all") {
            this.setCursorRect(0, 0, this.innerWidth, this.innerHeight);
        } else {
            _Window_BattleEnemy_refreshCursor.call(this);
        }
    };

    const _Window_BattleEnemy_update = Window_BattleEnemy.prototype.update;
    Window_BattleEnemy.prototype.update = function() {
        _Window_BattleEnemy_update.call(this);
        if (this._scopePreviewMode === "all" && this._cursorSprite) {
            const pulse = (Math.sin((Graphics.frameCount || 0) * Math.PI / 45) + 1) / 2;
            this._cursorSprite.alpha = 0.42 + pulse * 0.16;
        }
    };

    // 元の描画が敵名を行幅いっぱいに描くため、命中率の分だけ行幅を一時的に詰める。
    const _Window_BattleEnemy_itemLineRect = Window_BattleEnemy.prototype.itemLineRect;
    Window_BattleEnemy.prototype.itemLineRect = function(index) {
        const rect = _Window_BattleEnemy_itemLineRect.call(this, index);
        if (this._hitRateReserve > 0) rect.width = Math.max(rect.width - this._hitRateReserve, 0);
        return rect;
    };

    const _Window_BattleEnemy_drawItem = Window_BattleEnemy.prototype.drawItem;
    Window_BattleEnemy.prototype.drawItem = function(index) {
        const text = this.hitRateText(index);
        if (!text) {
            _Window_BattleEnemy_drawItem.call(this, index);
            return;
        }
        const rect = this.itemLineRect(index);
        this.resetFontSettings();
        const gap = this.itemPadding();
        const textWidth = this.textWidth(text);
        this._hitRateReserve = textWidth + gap;
        _Window_BattleEnemy_drawItem.call(this, index);
        this._hitRateReserve = 0;
        this.resetFontSettings();
        this.changeTextColor(ColorManager.textColor(paramTextColor));
        this.drawText(text, rect.x + rect.width - textWidth, rect.y, textWidth, "right");
        this.resetTextColor();
    };

    const _Scene_Battle_onSelectAction = Scene_Battle.prototype.onSelectAction;
    Scene_Battle.prototype.onSelectAction = function() {
        const action = BattleManager.inputtingAction();
        const scopeMode = action && action.isForOpponent()
            ? action.isForAll() ? "all" : action.isForRandom() ? "random" : null
            : null;
        this._enemyScopePreview = scopeMode;
        this._enemyWindow.setScopePreviewMode(scopeMode);
        if (scopeMode) {
            this.startEnemySelection();
        } else {
            _Scene_Battle_onSelectAction.call(this);
        }
    };

    const _Scene_Battle_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
    Scene_Battle.prototype.onEnemyOk = function() {
        if (!this._enemyScopePreview) {
            _Scene_Battle_onEnemyOk.call(this);
            return;
        }
        this._enemyScopePreview = null;
        this.hideSubInputWindows();
        this._enemyWindow.setScopePreviewMode(null);
        this.selectNextCommand();
    };

    const _Scene_Battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
    Scene_Battle.prototype.onEnemyCancel = function() {
        _Scene_Battle_onEnemyCancel.call(this);
        this._enemyScopePreview = null;
        this._enemyWindow.setScopePreviewMode(null);
    };
})();
