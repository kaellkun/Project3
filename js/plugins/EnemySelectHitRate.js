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
})();
