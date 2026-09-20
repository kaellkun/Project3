//=============================================================================
// RPGツクールMZ - LL_EncounterAdjust.js v1.0.1
//-----------------------------------------------------------------------------
// ルルの教会 (Lulu's Church)
// https://nine-yusha.com/
//
// URL below for license details.
// https://nine-yusha.com/plugin/
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Adjusts the number of steps required for encounters to occur.
 * @author Lulu's Church
 * @url https://nine-yusha.com/plugin
 *
 * @help LL_EncounterAdjust.js
 *
 * In the default encounter step calculation, it is theoretically possible for
 * an encounter to occur after just 1 step.
 *
 * When this plugin is enabled, the number of steps required for encounters
 * will be randomly set according to the dispersion rate.
 * For example, on a map with an encounter step count of 30 and a dispersion
 * rate of 50%, encounters will occur between 15 and 45 steps.
 * (No encounters will occur between steps 1 and 14.)
 *
 * Terms of use:
 *   ・No copyright notice required.
 *   ・No report needed for use.
 *   ・Free for commercial and non-commercial.
 *   ・No restriction for adult works.
 *   ・You may modify freely for your game.
 *   ・Redistribution as plugin material (incl. modified) prohibited.
 *
 * Author: Lulu's Church
 * Date: 2020/10/13
 *
 * @param encountRate
 * @text Dispersion Rate
 * @desc Sets the dispersion rate (%) for the number of steps before an encounter.
 * @default 50
 * @type number
 * @min 0
 * @max 100
 */

/*:ja
 * @target MZ
 * @plugindesc エンカウント発生歩数の調整をおこないます。
 * @author ルルの教会
 * @url https://nine-yusha.com/plugin
 *
 * @help LL_EncounterAdjust.js
 *
 * 通常のエンカウント歩数計算式では、
 * 理論上1歩～エンカウントが発生する可能性があります。
 *
 * このプラグインを有効にすると、
 * エンカウント発生歩数が分散率に応じてランダムに設定されるようになります。
 * 例えば、分散率50%でエンカウント歩数が30歩に設定されたマップでは、
 * 15～45歩の間でエンカウントが発生するように調整します。
 * (1～14歩の間エンカウントが発生しなくなります)
 *
 * 利用規約:
 *   ・著作権表記は必要ございません。
 *   ・利用するにあたり報告の必要は特にございません。
 *   ・商用・非商用問いません。
 *   ・R18作品にも使用制限はありません。
 *   ・ゲームに合わせて自由に改変していただいて問題ございません。
 *   ・プラグイン素材としての再配布（改変後含む）は禁止させていただきます。
 *
 * 作者: ルルの教会
 * 作成日: 2020/10/13
 *
 * @param encountRate
 * @text 分散率
 * @desc エンカウント発生歩数の分散率(0～100%)を設定します。
 * @default 50
 * @type number
 * @min 0
 * @max 100
 */

(() => {
	"use strict";
	const pluginName = "LL_EncounterAdjust";

	const parameters = PluginManager.parameters(pluginName);
	const encountRate = Number(parameters['encountRate'] || 50);

	Game_Player.prototype.makeEncounterCount = function() {
		let n = $gameMap.encounterStep();
		let r = Math.randomInt(n * (encountRate / 100) + 1) - Math.randomInt(n * (encountRate / 100) + 1);
		n += r;
		this._encounterCount = n > 0 ? n : 1;
	};
})();
