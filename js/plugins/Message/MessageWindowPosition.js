/*:
 * @target MZ
 * @plugindesc イベント内のメッセージ表示位置を上・下に一括固定します。
 * @author Project3
 *
 * @command SetPosition
 * @text メッセージ表示位置の一括指定
 * @desc このイベントの以降の「文章の表示」の位置を指定します。
 *
 * @arg Position
 * @text 表示位置
 * @type select
 * @option すべて上
 * @value top
 * @option すべて下
 * @value bottom
 * @option イベントコマンドの設定を採用
 * @value event
 * @default event
 *
 * @help
 * プラグインコマンド「メッセージ表示位置の一括指定」を実行すると、
 * そのイベントの以降の「文章の表示」のウィンドウ位置を変更します。
 *
 * ・すべて上：元の上・中・下の指定にかかわらず、上に表示します。
 * ・すべて下：元の上・中・下の指定にかかわらず、下に表示します。
 * ・イベントコマンドの設定を採用：固定を解除し、元の指定に従います。
 *
 * 初期状態は「イベントコマンドの設定を採用」です。
 * イベント終了時に自動解除され、別イベントや並列イベントには影響しません。
 * 呼び出したコモンイベントには、その時点の設定を引き継ぎます。
 * 呼び出し先での設定変更は、呼び出し元には影響しません。
 * 実行中にセーブした場合は設定を引き継いで再開し、イベント終了時に解除します。
 *
 * 顔グラフィック・背景・名前や、選択肢の左右位置は変更しません。
 */

(() => {
    'use strict';

    const pluginName = 'MessageWindowPosition';

    PluginManager.registerCommand(pluginName, 'SetPosition', function(args) {
        switch (args.Position) {
            case 'top':
                this._messageWindowPositionOverride = 0;
                break;
            case 'bottom':
                this._messageWindowPositionOverride = 2;
                break;
            case 'event':
                this._messageWindowPositionOverride = null;
                break;
            default:
                throw new Error(`${pluginName}: Invalid Position: ${args.Position}`);
        }
    });

    const _Game_Interpreter_clear = Game_Interpreter.prototype.clear;
    Game_Interpreter.prototype.clear = function() {
        _Game_Interpreter_clear.apply(this, arguments);
        this._messageWindowPositionOverride = null;
    };

    const _Game_Interpreter_terminate = Game_Interpreter.prototype.terminate;
    Game_Interpreter.prototype.terminate = function() {
        _Game_Interpreter_terminate.apply(this, arguments);
        this._messageWindowPositionOverride = null;
    };

    const _Game_Interpreter_setupChild = Game_Interpreter.prototype.setupChild;
    Game_Interpreter.prototype.setupChild = function() {
        _Game_Interpreter_setupChild.apply(this, arguments);
        this._childInterpreter._messageWindowPositionOverride =
            this._messageWindowPositionOverride;
    };

    const _Game_Interpreter_command101 = Game_Interpreter.prototype.command101;
    Game_Interpreter.prototype.command101 = function(params) {
        const position = this._messageWindowPositionOverride;
        if (position === 0 || position === 2) {
            params = params.slice();
            params[3] = position;
        }
        return _Game_Interpreter_command101.call(this, params);
    };
})();
