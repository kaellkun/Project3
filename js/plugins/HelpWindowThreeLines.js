//=============================================================================
// HelpWindowThreeLines.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc ヘルプを3行に統一し、ヘルプ内だけ文字サイズを相対調整します。(v1.0.0)
 * @author Copilot
 * @orderAfter FlexibleTopDownUI
 * @orderAfter NRP_LearnSkillList
 * @orderAfter NRP_LearnSkillList_NonParty
 *
 * @param FontSizeRate
 * @text ヘルプ文字サイズ倍率（%）
 * @type number
 * @min 10
 * @max 100
 * @default 85
 * @desc 通常フォントに対する倍率。85で85%、100で縮小なし。ヘルプ内だけに適用。
 *
 * @help
 * ヘルプウィンドウを標準の3行分の高さに統一します。
 * プラグイン管理で「ヘルプ文字サイズ倍率（%）」を設定してください。
 * ゲーム内オプションへの項目追加はありません。
 *
 * 文字サイズ = 元のフォントサイズ × 倍率 / 100（四捨五入、最低1px）。
 * 通常の文字の行間隔、アイコンのサイズ、他のウィンドウは変更しません。
 * Window_Helpを使うプロフィール・セーブ/ロード案内・タイトルにも適用。
 * セーブデータの変更は不要です。
 *
 * FlexibleTopDownUI、NRP_LearnSkillListなどのUIプラグインより下に配置。
 * 本プロジェクトのFlexibleTopDownUIはヘルプ領域の高さに追従します。
 * 独自の高さ/配置を持つ他のUIプラグインは別途調整が必要な場合があります。
 *
 * 自動折り返しやスクロールは追加しません。文章は手動で改行してください。
 * 4行以上の文章は枠外が表示されません。
 * \FS[n]など明示的な文字サイズの制御文字は通常どおり優先されるため、
 * 大きな文字を指定すると3行分が収まらない場合があります。
 */

(() => {
    "use strict";

    const parameters = PluginManager.parameters("HelpWindowThreeLines");
    const rawRate = Number(parameters.FontSizeRate ?? 85);
    const rate = Number.isFinite(rawRate) && parameters.FontSizeRate !== ""
        ? Math.max(10, Math.min(100, rawRate)) / 100
        : 0.85;
    const lines = 3;

    const _Window_Help_initialize = Window_Help.prototype.initialize;
    Window_Help.prototype.initialize = function(rect) {
        // Set the final size before contents creation. Do not mutate the caller's rect.
        const height = this.fittingHeight(lines);
        _Window_Help_initialize.call(this, new Rectangle(rect.x, rect.y, rect.width, height));
    };

    const _Window_Help_resetFontSettings = Window_Help.prototype.resetFontSettings;
    Window_Help.prototype.resetFontSettings = function() {
        _Window_Help_resetFontSettings.call(this);
        const originalSize = this.contents.fontSize;
        this.contents.fontSize = Math.max(1, Math.round(originalSize * rate));
        this._helpFontSizeReduction = originalSize - this.contents.fontSize;
    };

    const _Window_Help_calcTextHeight = Window_Help.prototype.calcTextHeight;
    Window_Help.prototype.calcTextHeight = function(textState) {
        // MZ derives drawTextEx line height from font size: compensate so only
        // glyphs shrink, keeping three standard rows and room for normal icons.
        return _Window_Help_calcTextHeight.call(this, textState) +
            (this._helpFontSizeReduction || 0);
    };

    function helpAreaHeight() {
        return this.calcWindowHeight(lines, false);
    }

    Scene_MenuBase.prototype.helpAreaHeight = helpAreaHeight;
    Scene_Battle.prototype.helpAreaHeight = helpAreaHeight;
    Scene_Status.prototype.profileHeight = helpAreaHeight;

    // File scenes subtract the actual help height from their list area already.
    // Keep their helpAreaHeight() === 0 to avoid reserving the space twice.
    const _Scene_File_helpWindowRect = Scene_File.prototype.helpWindowRect;
    Scene_File.prototype.helpWindowRect = function() {
        const rect = _Scene_File_helpWindowRect.call(this);
        rect.height = helpAreaHeight.call(this);
        return rect;
    };

    if (typeof Scene_LearnSkillList !== "undefined") {
        // Override the plugin's explicit HelpLines parameter as well.
        Scene_LearnSkillList.prototype.helpAreaHeight = helpAreaHeight;
    }
})();