//=============================================================================
// RPG Maker MZ - License Notice
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Adds a credits and licenses item to the title menu.
 * @author kaellkun
 *
 * @help LicenseNotice.js
 *
 * Displays the contents of README.md in a paged window from the title menu.
 */

(() => {
    "use strict";

    const titleCommandName = "Credits & Licenses";
    const pageSize = 13;

    const originalMakeCommandList = Window_TitleCommand.prototype.makeCommandList;
    Window_TitleCommand.prototype.makeCommandList = function() {
        originalMakeCommandList.call(this);
        this.addCommand(titleCommandName, "licenses");
    };

    const originalCommandWindowRect = Scene_Title.prototype.commandWindowRect;
    Scene_Title.prototype.commandWindowRect = function() {
        const rect = originalCommandWindowRect.call(this);
        rect.height = this.calcWindowHeight(4, true);
        rect.y = Graphics.boxHeight - rect.height - 96 + $dataSystem.titleCommandWindow.offsetY;
        return rect;
    };

    const originalCreateCommandWindow = Scene_Title.prototype.createCommandWindow;
    Scene_Title.prototype.createCommandWindow = function() {
        originalCreateCommandWindow.call(this);
        this._commandWindow.setHandler("licenses", this.commandLicenses.bind(this));
    };

    Scene_Title.prototype.commandLicenses = function() {
        this._commandWindow.close();
        SceneManager.push(Scene_LicenseNotice);
    };

    function Scene_LicenseNotice() {
        this.initialize(...arguments);
    }

    Scene_LicenseNotice.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_LicenseNotice.prototype.constructor = Scene_LicenseNotice;

    Scene_LicenseNotice.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const rect = new Rectangle(48, 48, Graphics.boxWidth - 96, Graphics.boxHeight - 96);
        this._licenseWindow = new Window_LicenseNotice(rect);
        this.addWindow(this._licenseWindow);
        fetch("README.md")
            .then(response => {
                if (!response.ok) {
                    throw new Error("README.md could not be loaded");
                }
                return response.text();
            })
            .then(text => this._licenseWindow.setText(text))
            .catch(() => this._licenseWindow.setText("README.md could not be loaded."));
    };

    function Window_LicenseNotice() {
        this.initialize(...arguments);
    }

    Window_LicenseNotice.prototype = Object.create(Window_Base.prototype);
    Window_LicenseNotice.prototype.constructor = Window_LicenseNotice;

    Window_LicenseNotice.prototype.initialize = function(rect) {
        Window_Base.prototype.initialize.call(this, rect);
        this._lines = ["Loading..."];
        this._page = 0;
        this.refresh();
    };

    Window_LicenseNotice.prototype.setText = function(text) {
        this._lines = text.replace(/\r/g, "").split("\n");
        this._page = 0;
        this.refresh();
    };

    Window_LicenseNotice.prototype.maxPages = function() {
        return Math.max(1, Math.ceil(this._lines.length / pageSize));
    };

    Window_LicenseNotice.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (Input.isRepeated("down") || Input.isRepeated("right")) {
            this.changePage(1);
        } else if (Input.isRepeated("up") || Input.isRepeated("left")) {
            this.changePage(-1);
        } else if (Input.isTriggered("cancel")) {
            SceneManager.pop();
        }
    };

    Window_LicenseNotice.prototype.changePage = function(direction) {
        const page = (this._page + direction + this.maxPages()) % this.maxPages();
        if (this._page !== page) {
            this._page = page;
            SoundManager.playCursor();
            this.refresh();
        }
    };

    Window_LicenseNotice.prototype.refresh = function() {
        this.contents.clear();
        const start = this._page * pageSize;
        const lines = this._lines.slice(start, start + pageSize);
        for (let index = 0; index < lines.length; index++) {
            this.drawText(lines[index], 0, index * this.lineHeight(), this.innerWidth);
        }
        const footer = `${this._page + 1}/${this.maxPages()}  Up/Down: Page  X: Back`;
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(footer, 0, this.innerHeight - this.lineHeight(), this.innerWidth, "right");
        this.resetTextColor();
    };
})();