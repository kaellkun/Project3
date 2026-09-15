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
 * @param MessageLineSpacing
 * @text Message line spacing
 * @type number
 * @decimals 2
* @min 0
 * @max 20
* @default 1
* @desc Line-height multiplier for the message window. CSS line-height uses the same scale.
 *
 * @param SpecialCharacterRules
 * @text Special character rules
 * @type string
 * @default [{"character":"【","leftTrim":1,"rightTrim":0,"noSpacingAfter":true},{"character":"】","leftTrim":0,"rightTrim":1},{"character":"「","leftTrim":1,"rightTrim":0,"noSpacingAfter":true},{"character":"」","leftTrim":0,"rightTrim":1},{"character":"、","leftTrim":0,"rightTrim":1},{"character":"。","leftTrim":0,"rightTrim":1},{"character":"『","leftTrim":1,"rightTrim":0},{"character":"』","leftTrim":0,"rightTrim":1},{"character":"（","leftTrim":1,"rightTrim":0},{"character":"）","leftTrim":0,"rightTrim":1},{"character":"［","leftTrim":1,"rightTrim":0},{"character":"］","leftTrim":0,"rightTrim":1},{"character":"｛","leftTrim":1,"rightTrim":0},{"character":"｝","leftTrim":0,"rightTrim":1}]
 * @desc JSON rules. leftTrim/rightTrim remove half-width units. leftPadding/rightPadding add font-size units.
 *
 * @help MainFontLetterSpacing.js
 *
 * Applies the configured spacing to text rendered with rmmz-mainfont.
 * Spacing is selected by the character being drawn and is not added after
 * the final character in a string.
 * Disabled entries retain the window's paint opacity for both text and outline.
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
    const messageLineSpacing = Number(parameters.MessageLineSpacing || 1);
    const baseFontSize = () =>
        typeof $gameSystem?.mainFontSize === "function"
            ? $gameSystem.mainFontSize()
            : 28;

    const defaultSpecialCharacterRules = [
        ["【", 1, 0, 0, true], ["】", 0, 1, 0.2, false], ["「", 1, 0, 0, true], ["」", 0, 1, 0, false],
        ["、", 0, 1, 0, false], ["。", 0, 1, 0, false],
        ["『", 1, 0, 0, false], ["』", 0, 1, 0, false], ["（", 1, 0, 0, false], ["）", 0, 1, 0, false],
        ["［", 1, 0, 0, false], ["］", 0, 1, 0, false], ["｛", 1, 0, 0, false], ["｝", 0, 1, 0, false]
    ];

    const parseSpecialCharacterRules = value => {
        try {
            const rules = JSON.parse(value || "[]");
            return rules.reduce((result, rule) => {
                if (rule.character) {
                    result[rule.character] = {
                        leftTrim: Number(rule.leftTrim || 0),
                        rightTrim: Number(rule.rightTrim || 0),
                        leftPadding: Number(rule.leftPadding || 0),
                        rightPadding: Number(rule.rightPadding || 0),
                        noSpacingAfter: rule.noSpacingAfter === true
                    };
                }
                return result;
            }, {});
        } catch (error) {
            return {};
        }
    };

    const specialCharacterRules = parseSpecialCharacterRules(
        parameters.SpecialCharacterRules
    );
    if (Object.keys(specialCharacterRules).length === 0) {
        for (const [character, leftTrim, rightTrim, leftPadding, noSpacingAfter] of defaultSpecialCharacterRules) {
            specialCharacterRules[character] = {
                leftTrim,
                rightTrim,
                leftPadding,
                rightPadding: 0,
                noSpacingAfter
            };
        }
    }
    for (const character of ["、", "。"] ) {
        if (!specialCharacterRules[character]) {
            specialCharacterRules[character] = {
                leftTrim: 0,
                rightTrim: 1,
                leftPadding: 0,
                rightPadding: 0,
                noSpacingAfter: false
            };
        }
    }

    const isMainFont = bitmap =>
        bitmap.fontFace && bitmap.fontFace.includes("rmmz-mainfont");

    const toCharacters = text => Array.from(String(text));

    const characterSpacing = (bitmap, character) => {
        const scale = bitmap.fontSize / baseFontSize();
        if (specialCharacterRules[character]?.noSpacingAfter) {
            return 0;
        }
        const codePoint = character.codePointAt(0);
        if (codePoint >= 0x3040 && codePoint <= 0x309f) {
            return spacing.hiragana * scale;
        }
        if (codePoint >= 0x30a0 && codePoint <= 0x30ff) {
            return spacing.katakana * scale;
        }
        if (
            (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
            (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
            (codePoint >= 0xf900 && codePoint <= 0xfaff)
        ) {
            return spacing.kanji * scale;
        }
        if (
            (codePoint >= 0x0030 && codePoint <= 0x0039) ||
            (codePoint >= 0x0041 && codePoint <= 0x005a) ||
            (codePoint >= 0x0061 && codePoint <= 0x007a)
        ) {
            return spacing.latinNumber * scale;
        }
        if (
            (codePoint >= 0xff10 && codePoint <= 0xff19) ||
            (codePoint >= 0xff21 && codePoint <= 0xff3a) ||
            (codePoint >= 0xff41 && codePoint <= 0xff5a)
        ) {
            return spacing.kanji * scale;
        }
        return spacing.other * scale;
    };

    const characterTrim = (bitmap, character) => {
        const rule = specialCharacterRules[character];
        const halfWidth = bitmap.fontSize / 2;
        return rule
            ? {
                left: rule.leftTrim * halfWidth,
                right: rule.rightTrim * halfWidth,
                leftPadding: rule.leftPadding * bitmap.fontSize,
                rightPadding: rule.rightPadding * bitmap.fontSize
            }
            : { left: 0, right: 0, leftPadding: 0, rightPadding: 0 };
    };

    const measureSpacedText = (bitmap, text) => {
        const characters = toCharacters(text);
        const context = bitmap.context;
        let width = 0;
        for (const character of characters) {
            const trim = characterTrim(bitmap, character);
            width += context.measureText(character).width - trim.left - trim.right;
            width += trim.leftPadding + trim.rightPadding;
        }
        for (let index = 0; index < characters.length - 1; index++) {
            width += characterSpacing(bitmap, characters[index]);
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
            const trim = characterTrim(bitmap, character);
            drawX += trim.leftPadding;
            const glyphX = drawX - trim.left;
            context.strokeText(character, glyphX, y);
            context.fillText(character, glyphX, y);
            drawX += context.measureText(character).width - trim.left - trim.right;
            drawX += trim.rightPadding;
            if (index < characters.length - 1) {
                drawX += characterSpacing(bitmap, character);
            }
        }
    };

    const lastTextCharacter = text => {
        const characters = toCharacters(text);
        return characters[characters.length - 1];
    };

    const hasNextTextCharacter = textState => {
        const nextCharacter = textState.text[textState.index];
        return nextCharacter && nextCharacter.charCodeAt(0) >= 0x20;
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
        // Keep the alpha set by Bitmap.paintOpacity (e.g. disabled commands).
        // Both glyph fill and outline must dim; save/restore preserves the state.
        context.strokeStyle = this.outlineColor;
        context.lineWidth = this.outlineWidth;
        context.lineJoin = "round";
        context.fillStyle = this.textColor;
        drawSpacedText(this, text, tx, ty, align);
        context.restore();
        this._baseTexture.update();
    };

    const originalFlushTextState = Window_Base.prototype.flushTextState;
    Window_Base.prototype.flushTextState = function(textState) {
        const bitmap = this.contents;
        const lastCharacter = lastTextCharacter(textState.buffer);
        originalFlushTextState.call(this, textState);
        if (
            isMainFont(bitmap) &&
            lastCharacter &&
            hasNextTextCharacter(textState)
        ) {
            textState.x += characterSpacing(bitmap, lastCharacter);
        }
    };

    const originalMessageCalcTextHeight = Window_Message.prototype.calcTextHeight;
    Window_Message.prototype.calcTextHeight = function(textState) {
        return originalMessageCalcTextHeight.call(this, textState) * messageLineSpacing;
    };

    const originalMessageWindowRect = Scene_Message.prototype.messageWindowRect;
    Scene_Message.prototype.messageWindowRect = function() {
        const rect = originalMessageWindowRect.call(this);
        const defaultFourLineHeight = this.calcWindowHeight(4, false);
        const threeLineHeight = this.calcWindowHeight(3, false);
        rect.height -= defaultFourLineHeight - threeLineHeight;
        rect.height += (defaultFourLineHeight - threeLineHeight) *
            (messageLineSpacing - 1) * 3;
        return rect;
    };
})();