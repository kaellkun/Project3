// CenteredMapName.js Ver.1.0.0
// MIT License (C) 2022 あわやまたな
// http://opensource.org/licenses/mit-license.php

/*:
* @target MZ MV
* @plugindesc マップ名を画面の中央に表示します。
* @author あわやまたな (Awaya_Matana)
* @url https://awaya3ji.seesaa.net/
* @help 左上だと邪魔なのでずらしました。
*
* [更新履歴]
* 2022/08/28：Ver.1.0.0　公開。
*
*/

'use strict';
{
	const _Window_MapName_initialize = Window_MapName.prototype.initialize;
	Window_MapName.prototype.initialize = function(rect) {
		_Window_MapName_initialize.call(this, rect);
		this.x = Math.floor((Graphics.boxWidth - this.width)/2);
		this.y = Math.floor((Graphics.boxHeight - this.height)/2);
	};
}