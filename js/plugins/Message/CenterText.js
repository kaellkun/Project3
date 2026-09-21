/*:
 * @target MZ
 * @plugindesc メッセージウィンドウの文章を行単位で中央寄せします。
 * @author Project3
 *
 * @param DefaultAlignment
 * @text 初期配置
 * @type select
 * @option 中央
 * @value center
 * @option 左
 * @value left
 * @default left
 *
 * @help
 * メッセージウィンドウの各行を本文領域の中央に配置します。
 * 顔グラフィックがある場合は、顔グラフィックを避けた本文領域が対象です。
 *
 * メッセージ中で次の制御文字を使うと、行ごとの配置を変更できます。
 *   \\CENTER  中央寄せ
 *   \\LEFT    左寄せ
 *
 * 制御文字は行頭に置くと、その行全体に適用されます。
 */

'use strict';

(() => {
    const pluginName = 'CenterText';
    const parameters = PluginManager.parameters(pluginName);
    const defaultAlignment = parameters.DefaultAlignment === 'left'
        ? 'left'
        : 'center';

    const _Window_Message_startMessage = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() {
        this._centerTextAlignment = defaultAlignment;
        _Window_Message_startMessage.call(this);
    };

    const _Window_Message_newPage = Window_Message.prototype.newPage;
    Window_Message.prototype.newPage = function(textState) {
        _Window_Message_newPage.call(this, textState);
        textState.centerTextLineStart = textState.index;
        this.updateCenterTextLinePosition(textState);
    };

    const _Window_Message_processNewLine = Window_Message.prototype.processNewLine;
    Window_Message.prototype.processNewLine = function(textState) {
        _Window_Message_processNewLine.call(this, textState);
        textState.centerTextLineStart = textState.index;
        this.updateCenterTextLinePosition(textState);
    };

    const _Window_Message_processEscapeCharacter =
        Window_Message.prototype.processEscapeCharacter;
    Window_Message.prototype.processEscapeCharacter = function(code, textState) {
        if (code === 'CENTER' || code === 'LEFT') {
            this._centerTextAlignment = code === 'CENTER' ? 'center' : 'left';
            this.updateCenterTextLinePosition(textState);
            return;
        }
        _Window_Message_processEscapeCharacter.call(this, code, textState);
    };

    Window_Message.prototype.updateCenterTextLinePosition = function(textState) {
        const alignment = this._centerTextAlignment || defaultAlignment;
        if (alignment !== 'center') {
            textState.x = textState.startX;
            return;
        }

        const faceExists = $gameMessage.faceName() !== '';
        const faceWidth = ImageManager.standardFaceWidth;
        const spacing = 20;
        const margin = faceExists ? faceWidth + spacing : 4;
        const left = textState.rtl ? 4 : margin;
        const right = textState.rtl
            ? this.innerWidth - margin
            : this.innerWidth - 4;
        const availableWidth = Math.max(0, right - left);
        const line = textState.text.slice(textState.centerTextLineStart)
            .split(/[\n\f]/, 1)[0];
        const lineWidth = Math.min(this.measureCenterTextLine(line), availableWidth);
        const offset = Math.max(0, (availableWidth - lineWidth) / 2);
        const lineLeft = left + offset;
        textState.x = textState.rtl ? lineLeft + lineWidth : lineLeft;
        textState.startX = textState.x;
    };

    Window_Message.prototype.measureCenterTextLine = function(line) {
        const processEscapeCharacter = this.processEscapeCharacter;
        this.processEscapeCharacter = Window_Base.prototype.processEscapeCharacter;
        const width = this.textSizeEx(line).width;
        this.processEscapeCharacter = processEscapeCharacter;
        this.resetFontSettings();
        return width;
    };
})();
