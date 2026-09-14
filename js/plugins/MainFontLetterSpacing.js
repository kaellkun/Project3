//=============================================================================
// RPG Maker MZ - Main Font Letter Spacing
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Adjusts the letter spacing of the main game font.
 * @author kaellkun
 *
 * @param HiraganaSpacing
 * @text Hiragana spacing
 * @type number
 * @decimals 2
 * @min -20
 * @max 20
 * @default 1
 * @desc Additional spacing after hiragana characters, in pixels.
 *
 * @param KatakanaSpacing
 * @text Katakana spacing
 * @type number
 * @decimals 2
 * @min -20
 * @max 20
 * @default 1
 * @desc Additional spacing after katakana characters, in pixels.
 *
 * @param KanjiSpacing
 * @text Kanji spacing
 * @type number
 * @decimals 2
 * @min -20
 * @max 20
 * @default 1
 * @desc Additional spacing after kanji characters, in pixels.
 *
 * @param LatinNumberSpacing
 * @text English and number spacing
 * @type number
 * @decimals 2
 * @min -20
 * @max 20
 * @default 1
 * @desc Additional spacing after English letters and numbers, in pixels.
 *
 * @param LetterSpacing
 * @text Other character spacing
 * @type number
 * @decimals 2
 * @min -20
 * @max 20
 * @default 1
 * @desc Fallback spacing after punctuation and other characters, in pixels.
 *
 * @help MainFontLetterSpacing.js
 *
 * Applies the configured spacing to text rendered with rmmz-mainfont.
 * Spacing is selected by the character being drawn and is not added after
 * the final character in a string.
 * Number font text and other custom fonts are left unchanged.
 */

(() => {
    "use strict";

    const pluginName = "MainFontLetterSpacing";
    const parameters = PluginManager.parameters(pluginName);
    const spacing = {
        hiragana: Number(parameters.HiraganaSpacing || 0),
        katakana: Number(parameters.KatakanaSpacing || 0),
        kanji: Number(parameters.KanjiSpacing || 0),
        latinNumber: Number(parameters.LatinNumberSpacing || 0),
        other: Number(parameters.LetterSpacing || 0)
    };

    const isMainFont = bitmap =>
        bitmap.fontFace && bitmap.fontFace.includes("rmmz-mainfont");

    const toCharacters = text => Array.from(String(text));

    const characterSpacing = character => {
        const codePoint = character.codePointAt(0);
        if (codePoint >= 0x3040 && codePoint <= 0x309f) {
            return spacing.hiragana;
        }
        if (codePoint >= 0x30a0 && codePoint <= 0x30ff) {
            return spacing.katakana;
        }
        if (
            (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
            (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
            (codePoint >= 0xf900 && codePoint <= 0xfaff)
        ) {
            return spacing.kanji;
        }
        if (
            (codePoint >= 0x0030 && codePoint <= 0x0039) ||
            (codePoint >= 0x0041 && codePoint <= 0x005a) ||
            (codePoint >= 0x0061 && codePoint <= 0x007a)
        ) {
            return spacing.latinNumber;
        }
        return spacing.other;
    };

    const measureSpacedText = (bitmap, text) => {
        const characters = toCharacters(text);
        const context = bitmap.context;
        let width = 0;
        for (const character of characters) {
            width += context.measureText(character).width;
        }
        for (let index = 0; index < characters.length - 1; index++) {
            width += characterSpacing(characters[index]);
        }
        return width;
    };

    const drawSpacedText = (bitmap, text, x, y, align) => {
        const characters = toCharacters(text);
        const context = bitmap.context;
        const width = measureSpacedText(bitmap, text);
        let drawX = x;
        if (align === "center") {
            drawX -= width / 2;
        } else if (align === "right") {
            drawX -= width;
        }
        for (let index = 0; index < characters.length; index++) {
            const character = characters[index];
            context.strokeText(character, drawX, y);
            context.fillText(character, drawX, y);
            drawX += context.measureText(character).width;
            if (index < characters.length - 1) {
                drawX += characterSpacing(character);
            }
        }
    };

    const originalMeasureTextWidth = Bitmap.prototype.measureTextWidth;
    Bitmap.prototype.measureTextWidth = function(text) {
        if (!isMainFont(this)) {
            return originalMeasureTextWidth.call(this, text);
        }
        const context = this.context;
        context.save();
        context.font = this._makeFontNameText();
        const width = measureSpacedText(this, text);
        context.restore();
        return width;
    };

    const originalDrawText = Bitmap.prototype.drawText;
    Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align) {
        if (!isMainFont(this)) {
            originalDrawText.call(this, text, x, y, maxWidth, lineHeight, align);
            return;
        }

        const context = this.context;
        const alpha = context.globalAlpha;
        maxWidth = maxWidth || 0xffffffff;
        let tx = x;
        const ty = Math.round(y + lineHeight / 2 + this.fontSize * 0.35);
        if (align === "center") {
            tx += maxWidth / 2;
        } else if (align === "right") {
            tx += maxWidth;
        }
        context.save();
        context.font = this._makeFontNameText();
        context.textAlign = "left";
        context.textBaseline = "alphabetic";
        context.globalAlpha = 1;
        context.strokeStyle = this.outlineColor;
        context.lineWidth = this.outlineWidth;
        context.lineJoin = "round";
        context.fillStyle = this.textColor;
        drawSpacedText(this, text, tx, ty, align);
        context.globalAlpha = alpha;
        context.restore();
        this._baseTexture.update();
    };
})();