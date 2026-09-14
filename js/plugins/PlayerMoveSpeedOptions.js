//=============================================================================
// RPG Maker MZ - Player Move Speed Options
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Adds walking and running speed settings to the options menu.
 * @author kaellkun
 *
 * @param MinSpeed
 * @text Min Speed
 * @type number
 * @min 1
 * @max 6
 * @default 3
 *
 * @param MaxSpeed
 * @text Max Speed
 * @type number
 * @min 1
 * @max 6
 * @default 6
 *
 * @param DefaultWalkSpeed
 * @text Default Walk Speed
 * @type number
 * @min 1
 * @max 6
 * @default 4
 *
 * @param DefaultDashSpeed
 * @text Default Dash Speed
 * @type number
 * @min 1
 * @max 6
 * @default 5
 *
 * @help PlayerMoveSpeedOptions.js
 *
 * Adds two options:
 * - Walk Speed: player speed while not dashing
 * - Dash Speed: player speed while dashing
 *
 * The settings affect normal player movement only. Event move routes and
 * vehicles keep their original speeds.
 */

(() => {
    "use strict";

    const pluginName = "PlayerMoveSpeedOptions";
    const parameters = PluginManager.parameters(pluginName);
    const minSpeed = Number(parameters.MinSpeed || 3).clamp(1, 6);
    const maxSpeed = Number(parameters.MaxSpeed || 6).clamp(minSpeed, 6);
    const defaultWalkSpeed = Number(parameters.DefaultWalkSpeed || 4).clamp(minSpeed, maxSpeed);
    const defaultDashSpeed = Number(parameters.DefaultDashSpeed || 5).clamp(minSpeed, maxSpeed);
    const walkSpeedSymbol = "playerWalkSpeed";
    const dashSpeedSymbol = "playerDashSpeed";

    ConfigManager.playerWalkSpeed = defaultWalkSpeed;
    ConfigManager.playerDashSpeed = defaultDashSpeed;

    const readSpeed = (config, name, defaultValue) => {
        if (name in config) {
            return Number(config[name]).clamp(minSpeed, maxSpeed);
        }
        return defaultValue;
    };

    const originalMakeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = originalMakeData.call(this);
        config.playerWalkSpeed = this.playerWalkSpeed;
        config.playerDashSpeed = this.playerDashSpeed;
        return config;
    };

    const originalApplyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        originalApplyData.call(this, config);
        this.playerWalkSpeed = readSpeed(config, walkSpeedSymbol, defaultWalkSpeed);
        this.playerDashSpeed = readSpeed(config, dashSpeedSymbol, defaultDashSpeed);
    };

    const isSpeedSymbol = symbol => symbol === walkSpeedSymbol || symbol === dashSpeedSymbol;

    const originalAddGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        originalAddGeneralOptions.call(this);
        this.addCommand("歩く速度", walkSpeedSymbol);
        this.addCommand("走る速度", dashSpeedSymbol);
    };

    const originalStatusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const symbol = this.commandSymbol(index);
        if (isSpeedSymbol(symbol)) {
            return String(this.getConfigValue(symbol));
        }
        return originalStatusText.call(this, index);
    };

    const changeSpeed = function(symbol, forward, wrap) {
        const lastValue = this.getConfigValue(symbol);
        let value = lastValue + (forward ? 1 : -1);
        if (value > maxSpeed) {
            value = wrap ? minSpeed : maxSpeed;
        } else if (value < minSpeed) {
            value = wrap ? maxSpeed : minSpeed;
        }
        this.changeValue(symbol, value);
    };

    const originalProcessOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        const symbol = this.commandSymbol(this.index());
        if (isSpeedSymbol(symbol)) {
            changeSpeed.call(this, symbol, true, true);
        } else {
            originalProcessOk.call(this);
        }
    };

    const originalCursorRight = Window_Options.prototype.cursorRight;
    Window_Options.prototype.cursorRight = function() {
        const symbol = this.commandSymbol(this.index());
        if (isSpeedSymbol(symbol)) {
            changeSpeed.call(this, symbol, true, false);
        } else {
            originalCursorRight.call(this);
        }
    };

    const originalCursorLeft = Window_Options.prototype.cursorLeft;
    Window_Options.prototype.cursorLeft = function() {
        const symbol = this.commandSymbol(this.index());
        if (isSpeedSymbol(symbol)) {
            changeSpeed.call(this, symbol, false, false);
        } else {
            originalCursorLeft.call(this);
        }
    };

    const originalRealMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        if (this.isNormal()) {
            return this.isDashing() ? ConfigManager.playerDashSpeed : ConfigManager.playerWalkSpeed;
        }
        return originalRealMoveSpeed.call(this);
    };
})();