/*:
 * @target MZ
 * @plugindesc ステータス・装備・戦闘情報から未使用能力値を非表示にします。
 * @author Project3
 *
 * @help
 * 防御力、魔法防御、運を表示対象から除外します。
 * 能力値の計算やバフそのものは変更しません。
 */
(() => {
    const visibleParamIds = [2, 4, 6];
    globalThis.StatusVisibleParamIds = visibleParamIds;

    const originalParameters = PluginManager.parameters;
    PluginManager.parameters = function(name) {
        const parameters = originalParameters.call(this, name);
        if (name === "Battle/CMenu/KEN_BattleStateInformation") {
            const config = JSON.parse(parameters.battlerAreaConfig || "[]");
            return {
                ...parameters,
                battlerAreaConfig: JSON.stringify(config.filter(item => {
                    return !/battler\.param\((3|5|7)\)/.test(item.itemValue || "");
                }))
            };
        }
        return parameters;
    };

    Window_StatusParams.prototype.maxItems = function() {
        return visibleParamIds.length;
    };

    Window_StatusParams.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        const paramId = visibleParamIds[index];
        const name = TextManager.param(paramId);
        const value = this._actor.param(paramId);
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(name, rect.x, rect.y, 160);
        this.resetTextColor();
        this.drawText(value, rect.x + 160, rect.y, 60, "right");
    };

    Window_EquipStatus.prototype.drawAllParams = function() {
        for (let index = 0; index < visibleParamIds.length; index++) {
            const x = this.itemPadding();
            const y = this.paramY(index);
            this.drawItem(x, y, visibleParamIds[index]);
        }
    };
})();
