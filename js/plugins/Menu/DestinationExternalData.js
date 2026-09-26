/*:
 * @target MZ
 * @plugindesc 行動目標をメニュー上部に1行表示します。(v1.1.0)
 * @author Project3
 * @base NUUN_Destination
 * @orderAfter NUUN_Destination
 * @orderAfter FlexibleTopDownUI
 *
 * @param FontSize
 * @type number
 * @min 12
 * @max 48
 * @default 24
 * @param DestinationIdVariableId
 * @text 現在の行動目標IDを格納する変数
 * @desc 0で無効。行動目標の変更・解除時とセーブ読込時に現在のIDを書き込みます。
 * @type variable
 * @default 0
 * @command SetDestination
 * @text 行動目標を設定
 * @arg id
 * @text 固定ID（0で解除）
 * @type number
 * @min 0
 * @default 0
 * @command ClearDestination
 * @text 行動目標を解除
 *
 * @help
 * NUUN_DestinationとFlexibleTopDownUIより下に配置してください。
 * 行動目標の内容とIDはNUUN_Destinationの設定を使用します。
 * メニュー画面の所持金の上に、見出しと本文1行を常に表示します。
 * 専用のメニューコマンドは追加しません。本文が長い場合は表示領域内で折り返し後半を省略します。
 * 変数を指定すると、行動目標のID（未設定時は0）を自動的に書き込みます。
 * 制御文字: \V \N \P \G \C \I。
 */

(() => {
    'use strict';
    const pluginName = 'DestinationExternalData';
    const fullName = `Menu/${pluginName}`;
    if (!window.Imported?.NUUN_Destination ||
        typeof Game_System.prototype.setDestinationId !== 'function') {
        throw new Error(`${pluginName}: NUUN_Destinationを有効にし、本アドオンより上に配置してください。`);
    }
    const params = { ...PluginManager.parameters(pluginName), ...PluginManager.parameters(fullName) };
    const setting = (name, fallback, min, max) => {
        const value = Number(params[name] || fallback);
        if (!Number.isInteger(value) || value < min || value > max) {
            throw new Error(`${pluginName}: ${name}は${min}〜${max}の整数が必要です。`);
        }
        return value;
    };
    const fontSize = setting('FontSize', 24, 12, 48);
    const destinationIdVariableId = setting('DestinationIdVariableId', 0, 0, 9999);

    const syncDestinationId = system => {
        if (destinationIdVariableId > 0 && $gameVariables) {
            const id = system.getDestinationId();
            if ($gameVariables.value(destinationIdVariableId) !== id) {
                $gameVariables.setValue(destinationIdVariableId, id);
            }
        }
    };
    const originalSetDestinationId = Game_System.prototype.setDestinationId;
    Game_System.prototype.setDestinationId = function(id) {
        originalSetDestinationId.call(this, id);
        syncDestinationId(this);
    };
    const originalOnAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        originalOnAfterLoad.apply(this, arguments);
        syncDestinationId(this);
    };

    const setDestination = args => {
        $gameSystem.setDestinationId(Number(args.id || 0));
    };
    const clearDestination = () => {
        $gameSystem.setDestinationId(0);
    };
    PluginManager.registerCommand(pluginName, 'SetDestination', setDestination);
    PluginManager.registerCommand(fullName, 'SetDestination', setDestination);
    PluginManager.registerCommand(pluginName, 'ClearDestination', clearDestination);
    PluginManager.registerCommand(fullName, 'ClearDestination', clearDestination);

    class Window_MenuDestination extends Window_Base {
        initialize(rect) {
            this._lines = [];
            super.initialize(rect);
            this.refresh();
        }
        lineHeight() { return fontSize + 8; }
        resetFontSettings() {
            super.resetFontSettings();
            this.contents.fontSize = Math.min(fontSize, Math.max(1, Math.floor((this.innerWidth - 8) / 3)));
        }
        resolvedText() {
            const raw = this.getDestinationList();
            return this.convertEscapeCharacters(raw == null || !raw.trim() ? '未設定' : raw)
                .replace(/\r\n?/g, '\n');
        }
        update() {
            const text = this.resolvedText();
            if (text !== this._resolvedText) this.refresh();
            super.update();
        }
        refresh() {
            this.resetFontSettings();
            this._resolvedText = this.resolvedText();
            this._lines = this.wrapText(`\x1bC[16]行動目標\x1bC[0] ${this._resolvedText}`);
            this.paint();
        }
        wrapText(text) {
            // textWidthはMainFontLetterSpacingの実測を利用。字間を1文字幅の和で推定しない。
            // 負の字間・括弧トリムのインクはadvanceよりはみ出すので左右に1emを確保。
            const width = Math.max(1, this.innerWidth - this.contents.fontSize * 2 - 4);
            const rows = [[]];
            let used = 0;
            let color = ColorManager.normalColor();
            const newline = () => { rows.push([]); used = 0; };
            const tokens = text.match(/\x1b[A-Za-z]+(?:\[\d+\])?|\n|[^\x1b]/gu) || [];
            for (const token of tokens) {
                if (token === '\n') { newline(); continue; }
                const control = /^\x1b([A-Za-z]+)(?:\[(\d+)\])?$/.exec(token);
                if (control) {
                    const code = control[1].toUpperCase();
                    if (code === 'C') color = ColorManager.textColor(Number(control[2] || 0));
                    if (code === 'I') {
                        const size = Math.min(ImageManager.iconWidth, this.lineHeight() - 4, width - 4);
                        const advance = Math.max(1, size + 4);
                        if (used && used + advance > width) newline();
                        rows.at(-1).push({ icon: Number(control[2] || 0), size, x: used, width: advance });
                        used += advance;
                    }
                    continue; // 未対応の制御コードは実行しない。
                }
                if (token.charCodeAt(0) < 32) continue;
                let row = rows.at(-1);
                let last = row.at(-1);
                const extend = last && last.text !== undefined && last.color === color;
                const candidate = extend ? last.text + token : token;
                const measured = Math.max(0, this.textWidth(candidate));
                const nextWidth = extend ? Math.max(last.width, measured) : measured;
                const x = extend ? last.x : used;
                if (row.length && x + nextWidth > width) {
                    newline(); row = rows.at(-1); last = null;
                }
                if (last && extend) {
                    last.text = candidate;
                    last.width = nextWidth;
                    used = last.x + nextWidth;
                } else {
                    const advance = Math.max(0, this.textWidth(token));
                    row.push({ text: token, color, x: used, width: advance });
                    used += advance;
                }
            }
            return rows;
        }
        paint() {
            if (!this.contents) return;
            this.contents.clear();
            this.contentsBack.clear();
            this.resetFontSettings();
            const first = 0;
            const count = Math.ceil(this.innerHeight / this.lineHeight());
            const inset = this.contents.fontSize + 2;
            for (let i = first; i < Math.min(this._lines.length, first + count); i++) {
                const y = i * this.lineHeight();
                for (const run of this._lines[i]) {
                    if (run.icon !== undefined) {
                        const bitmap = ImageManager.loadSystem('IconSet');
                        const iw = ImageManager.iconWidth;
                        const ih = ImageManager.iconHeight;
                        this.contents.blt(bitmap, run.icon % 16 * iw, Math.floor(run.icon / 16) * ih,
                            iw, ih, inset + run.x + 2, y + 2, run.size, run.size);
                    } else {
                        this.changeTextColor(run.color);
                        const size = this.contents.fontSize;
                        const available = Math.max(1, this.innerWidth - inset * 2);
                        // 極端に幅の広い1文字も黙って切り捨てず縮小する。
                        if (run.width > available) this.contents.fontSize = Math.max(1, size * available / run.width);
                        this.drawText(run.text, inset + run.x, y, Math.max(1, this.textWidth(run.text)));
                        this.contents.fontSize = size;
                    }
                }
            }
        }
    }
    window.Window_MenuDestination = Window_MenuDestination;

    function moveWindow(win, rect) {
        const resized = win.width !== rect.width || win.height !== rect.height;
        win.move(rect.x, rect.y, rect.width, rect.height);
        if (resized) {
            win.createContents();
            win.refresh();
            if (win.refreshCursor) win.refreshCursor();
        }
    }
    const relayout = Scene_Menu.prototype.relayoutMenuWindows;
    Scene_Menu.prototype.relayoutMenuWindows = function() {
        if (relayout) relayout.apply(this, arguments);
        else {
            // 標準UIでも毎回元のrectから計算し、前回の短縮済み高さは使わない。
            moveWindow(this._commandWindow, this.commandWindowRect());
            moveWindow(this._statusWindow, this.statusWindowRect());
            const gold = this.goldWindowRect();
            moveWindow(this._goldWindow, new Rectangle(0, Graphics.boxHeight - gold.height, Graphics.boxWidth, gold.height));
        }
        const panel = this._destinationWindow;
        if (!panel) return;
        const status = this._statusWindow;
        const bottom = Math.min(status.y + status.height, this._goldWindow.y);
        const available = Math.max(0, bottom - status.y);
        const minimumStatus = Math.min(96, Math.max(Math.floor(available / 2),
            available - panel.padding * 2 - panel.lineHeight()));
        const desired = panel.lineHeight() * 2 + panel.padding * 2;
        const height = Math.min(desired, Math.max(0, available - minimumStatus));
        const y = bottom - height;
        moveWindow(status, new Rectangle(status.x, status.y, status.width, Math.max(1, y - status.y)));
        // 高さが極端に足りない場合はビットマップの負サイズを避ける。
        panel.visible = height > panel.padding * 2;
        moveWindow(panel, new Rectangle(0, y, Graphics.boxWidth, Math.max(panel.padding * 2 + 1, height)));
        if (!relayout && this._commandWindow.y + this._commandWindow.height > y) {
            const cmd = this._commandWindow;
            moveWindow(cmd, new Rectangle(cmd.x, cmd.y, cmd.width, Math.max(cmd.padding * 2 + 1, y - cmd.y)));
        }
        this._destinationLayoutSize = `${Graphics.boxWidth}:${Graphics.boxHeight}`;
    };
    const create = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        create.apply(this, arguments);
        this._destinationWindow = new Window_MenuDestination(new Rectangle(0, 0, Graphics.boxWidth, 80));
        this.addWindow(this._destinationWindow);
        this.relayoutMenuWindows();
    };
    const update = Scene_Menu.prototype.update;
    Scene_Menu.prototype.update = function() {
        const panel = this._destinationWindow;
        if (panel && this._destinationLayoutSize !== `${Graphics.boxWidth}:${Graphics.boxHeight}`) {
            this.relayoutMenuWindows();
        }
        update.apply(this, arguments);
    };
})();