//=============================================================================
// RPG Maker MZ - EnemyNightPower
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 夜になると敵のステータスを設定倍率にします。
 * @author Project3
 * @orderAfter MapTypeCommonEvent
 *
 * @param Multiplier
 * @text 夜間ステータス倍率
 * @desc 夜の敵ステータスに掛ける倍率です。10で10倍になります。
 * @type number
 * @decimals 2
 * @min 0
 * @default 10
 *
 * @param NightSwitch
 * @text 夜状態スイッチ
 * @desc MapTypeCommonEventを使わない場合などに、ONを夜として扱うスイッチです。0なら使用しません。
 * @type switch
 * @default 0
 *
 * @help
 * MapTypeCommonEventが管理する昼夜状態が夜のとき、敵のHP・MP・攻撃力・防御力・
 * 魔法力・魔法防御・敏捷性・運に倍率を掛けます。
 * 敵のデータそのものは変更しないため、朝になると通常の値に戻ります。
 */

(() => {
    'use strict';

    const pluginName = 'EnemyNightPower';
    const parameters = PluginManager.parameters(pluginName);
    const multiplier = Number(parameters.Multiplier === undefined || parameters.Multiplier === '' ?
        10 : parameters.Multiplier);
    const nightSwitch = Number(parameters.NightSwitch || 0);

    if (!Number.isFinite(multiplier) || multiplier < 0) {
        throw new Error(`${pluginName}: 夜間ステータス倍率は0以上の数値を指定してください。`);
    }
    if (!Number.isSafeInteger(nightSwitch) || nightSwitch < 0) {
        throw new Error(`${pluginName}: 夜状態スイッチは0以上の整数を指定してください。`);
    }

    function isNight() {
        const timeState = typeof $gameSystem !== 'undefined' && $gameSystem &&
            $gameSystem._mapTypeDayNight;
        if (timeState && typeof timeState.night === 'boolean') return timeState.night;
        return nightSwitch > 0 && typeof $gameSwitches !== 'undefined' &&
            $gameSwitches.value(nightSwitch);
    }

    const upstreamParamBase = Game_Enemy.prototype.paramBase;
    Game_Enemy.prototype.paramBase = function(paramId) {
        const value = upstreamParamBase.apply(this, arguments);
        return isNight() ? value * multiplier : value;
    };
})();