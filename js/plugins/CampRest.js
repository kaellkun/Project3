/*:
 * @target MZ
 * @plugindesc 焚き火休憩で魔物の肉を使ったHP回復とMP全回復を提供します。
 * @author Project3
 *
 * @command StartRest
 * @text 焚き火休憩を開始
 * @desc 焚き火休憩の選択画面を開きます。
 *
 * @command SetCheckpoint
 * @text 焚き火再開ポイントを記録
 * @desc 現在の状態を記録し、ゲームオーバー後に「焚き火から再開」を選べるようにします。
 * イベントのメモ欄に<CampRestPoint>を付けると起動時に自動で記録されます。
 *
 * @param MeatItemIds
 * @text 魔物の肉アイテムID
 * @type string
 * @default 2,65,89
 * @desc カンマ区切りで指定します。アイテムのメモに<CampRestMeat>を付けても対象になります。
 *
 * @param HpRecoveryRate
 * @text 肉1個のHP回復率
 * @type number
 * @decimals 0
 * @min 1
 * @max 100
 * @default 25
 * @desc 肉1個で最大HPの何パーセント回復するかを指定します。
 */

(() => {
    "use strict";

    const pluginName = "CampRest";
    const parameters = PluginManager.parameters(pluginName);
    const meatItemIds = String(parameters.MeatItemIds || "2,65,89")
        .split(",")
        .map(Number)
        .filter(id => id > 0);
    const hpRecoveryRate = Math.max(1, Math.min(100, Number(parameters.HpRecoveryRate || 25))) / 100;

    PluginManager.registerCommand(pluginName, "StartRest", () => {
        SceneManager.push(Scene_CampRest);
    });

    //-----------------------------------------------------------------------------
    // 焚き火再開ポイント
    // 焚き火イベント発動時の状態をメモリ上に記録し、ゲームオーバー後に
    // 「焚き火から再開」で記録時点の状態・位置へ戻れるようにします。
    //-----------------------------------------------------------------------------
    const checkpoint = {
        contents: null,
        mapId: 0,
        x: 0,
        y: 0,
        direction: 2
    };

    function saveCheckpoint() {
        $gameSystem.onBeforeSave();
        checkpoint.contents = JsonEx.stringify(DataManager.makeSaveContents());
        checkpoint.mapId = $gameMap.mapId();
        checkpoint.x = $gamePlayer.x;
        checkpoint.y = $gamePlayer.y;
        checkpoint.direction = $gamePlayer.direction();
    }

    function clearCheckpoint() {
        checkpoint.contents = null;
        checkpoint.mapId = 0;
        pendingResumeReplay = false;
    }

    let pendingResumeReplay = false;

    function resumeFromCheckpoint() {
        if (!checkpoint.contents) {
            return false;
        }
        const contents = JsonEx.parse(checkpoint.contents);
        DataManager.extractSaveContents(contents);
        $gamePlayer.reserveTransfer(
            checkpoint.mapId, checkpoint.x, checkpoint.y, checkpoint.direction, 0
        );
        // 記録時はイベント実行中のため、マップを再構築して実行状態を破棄します。
        $gamePlayer.requestMapReload();
        // BGM等の復帰はゲームオーバー画面のフェードアウト後に行います。
        pendingResumeReplay = true;
        SceneManager.goto(Scene_Map);
        return true;
    }

    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        if (pendingResumeReplay) {
            pendingResumeReplay = false;
            $gameSystem.onAfterLoad();
        }
        _Scene_Map_start.apply(this, arguments);
    };

    PluginManager.registerCommand(pluginName, "SetCheckpoint", () => {
        saveCheckpoint();
    });

    // メモ欄に<CampRestPoint>を持つイベントは、起動した瞬間に
    // (セーブのみ・キャンセル等、その後の選択に関係なく)再開ポイントを記録します。
    function isCampRestPointEvent(event) {
        const data = event && event.event ? event.event() : null;
        return !!data && /<CampRestPoint>/i.test(data.note || "");
    }

    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        _Game_Event_start.apply(this, arguments);
        if (this._starting && isCampRestPointEvent(this)) {
            saveCheckpoint();
        }
    };

    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        clearCheckpoint();
        _DataManager_setupNewGame.apply(this, arguments);
    };

    const _DataManager_loadGame = DataManager.loadGame;
    DataManager.loadGame = function() {
        return _DataManager_loadGame.apply(this, arguments).then(result => {
            clearCheckpoint();
            return result;
        });
    };

    window.CampRestCheckpoint = {
        isValid: () => !!checkpoint.contents,
        save: saveCheckpoint,
        clear: clearCheckpoint,
        resume: resumeFromCheckpoint
    };

    function isCampRestMeat(item) {
        return !!item && (meatItemIds.includes(item.id) || /<CampRestMeat>/i.test(item.note || ""));
    }

    class Window_CampRestCommand extends Window_Command {
        makeCommandList() {
            this.addCommand("魔物の肉を使う", "meat", this.meatCount() > 0);
            this.addCommand("使わずに休憩する", "rest");
            this.addCommand("やめる", "cancel");
        }

        meatCount() {
            return $gameParty.allItems().filter(isCampRestMeat)
                .reduce((total, item) => total + $gameParty.numItems(item), 0);
        }
    }

    class Window_CampRestItem extends Window_Command {
        initialize(rect, items) {
            this._items = items;
            super.initialize(rect);
        }

        makeCommandList() {
            for (const item of this._items) {
                this.addCommand(`${item.name}  (${$gameParty.numItems(item)}個)`, "item", true, item);
            }
        }
    }

    class Window_CampRestQuantity extends Window_Command {
        initialize(rect, item) {
            this._item = item;
            super.initialize(rect);
        }

        makeCommandList() {
            const max = $gameParty.numItems(this._item);
            for (let count = 1; count <= max; count++) {
                const rate = Math.min(100, Math.round(hpRecoveryRate * count * 100));
                this.addCommand(`${count}個  (HP回復 ${rate}%)`, "quantity", true, count);
            }
        }
    }

    class Window_CampRestConfirm extends Window_Command {
        makeCommandList() {
            this.addCommand("この数量で使う", "yes");
            this.addCommand("数量を選び直す", "no");
        }
    }

    class Scene_CampRest extends Scene_MenuBase {
        create() {
            super.create();
            this.createHelpWindow();
            this._helpWindow.setText("焚き火休憩では、魔物の肉1個につき全員のHPを\n最大HPの25%回復できます。\n休憩を終えると、肉を使わなくても全員のMPが全回復します。");
            this.createMainWindow();
            this.createItemWindow();
            this.createQuantityWindow();
            this.createConfirmWindow();
            this.showMainWindow();
        }

        windowRect(rowCount) {
            // FlexibleTopDownUI がコマンド行高を拡張するため、
            // Window_Selectable 基準の calcWindowHeight ではなく
            // Window_Command 基準でジャストサイズを計算します。
            const ww = Math.min(520, Graphics.boxWidth - 48);
            const y = this._helpWindow.height + 24;
            const rowHeight = Window_Command.prototype.itemHeight();
            const padding = $gameSystem.windowPadding() * 2;
            const maxRows = Math.max(1, Math.floor(
                (Graphics.boxHeight - y - 24 - padding) / rowHeight
            ));
            const wh = Window_Command.prototype.fittingHeight(Math.min(rowCount, maxRows));
            return new Rectangle((Graphics.boxWidth - ww) / 2, y, ww, wh);
        }

        mainWindowRect() {
            return this.windowRect(3);
        }

        itemWindowRect() {
            return this.windowRect(Math.max(1, this.meatItems().length));
        }

        quantityWindowRect(item) {
            return this.windowRect(Math.max(1, $gameParty.numItems(item)));
        }

        confirmWindowRect() {
            return this.windowRect(2);
        }

        createMainWindow() {
            this._mainWindow = new Window_CampRestCommand(this.mainWindowRect());
            this._mainWindow.setHandler("meat", this.onMeat.bind(this));
            this._mainWindow.setHandler("rest", this.onRest.bind(this));
            this._mainWindow.setHandler("cancel", this.popScene.bind(this));
            this.addWindow(this._mainWindow);
        }

        createItemWindow() {
            const rect = this.itemWindowRect();
            this._itemWindow = new Window_CampRestItem(rect, this.meatItems());
            this._itemWindow.setHandler("item", this.onItem.bind(this));
            this._itemWindow.setHandler("cancel", this.showMainWindow.bind(this));
            this.addWindow(this._itemWindow);
        }

        createQuantityWindow() {
            const item = this.meatItems()[0] || $dataItems[1];
            const rect = this.quantityWindowRect(item);
            this._quantityWindow = new Window_CampRestQuantity(rect, item);
            this._quantityWindow.setHandler("quantity", this.onQuantity.bind(this));
            this._quantityWindow.setHandler("cancel", this.showItemWindow.bind(this));
            this.addWindow(this._quantityWindow);
        }

        createConfirmWindow() {
            const rect = this.confirmWindowRect();
            this._confirmWindow = new Window_CampRestConfirm(rect);
            this._confirmWindow.setHandler("yes", this.onConfirm.bind(this));
            this._confirmWindow.setHandler("no", this.showQuantityWindow.bind(this));
            this._confirmWindow.setHandler("cancel", this.showQuantityWindow.bind(this));
            this.addWindow(this._confirmWindow);
        }

        meatItems() {
            return $gameParty.allItems().filter(isCampRestMeat);
        }

        showMainWindow() {
            this._mainWindow.refresh();
            this._mainWindow.show();
            this._mainWindow.activate();
            this._itemWindow.hide();
            this._quantityWindow.hide();
            this._confirmWindow.hide();
        }

        onMeat() {
            this._itemWindow.refresh();
            this._itemWindow.move(this.itemWindowRect());
            this._mainWindow.deactivate();
            this._mainWindow.hide();
            this._itemWindow.show();
            this._itemWindow.activate();
        }

        showItemWindow() {
            this._quantityWindow.hide();
            this._confirmWindow.hide();
            this._itemWindow.show();
            this._itemWindow.activate();
        }

        onItem() {
            this._selectedItem = this._itemWindow.currentExt();
            this._quantityWindow._item = this._selectedItem;
            this._quantityWindow.move(this.quantityWindowRect(this._selectedItem));
            this._quantityWindow.refresh();
            this._itemWindow.hide();
            this._quantityWindow.show();
            this._quantityWindow.activate();
        }

        showQuantityWindow() {
            this._confirmWindow.hide();
            this._quantityWindow.show();
            this._quantityWindow.activate();
        }

        onQuantity() {
            this._selectedQuantity = this._quantityWindow.currentExt();
            this._quantityWindow.deactivate();
            this._quantityWindow.hide();
            this._confirmWindow.show();
            this._confirmWindow.activate();
        }

        onConfirm() {
            const item = this._selectedItem;
            const count = Math.min(this._selectedQuantity, $gameParty.numItems(item));
            if (count > 0) {
                $gameParty.loseItem(item, count);
                for (const actor of $gameParty.members()) {
                    if (actor.isAlive()) actor.gainHp(Math.floor(actor.mhp * hpRecoveryRate * count));
                }
            }
            this.finishRest(`魔物の肉を${count}個使いました。全員のHPを回復し、MPを全回復しました。`);
        }

        onRest() {
            this.finishRest("焚き火で休憩しました。全員のMPが全回復しました。");
        }

        finishRest(message) {
            for (const actor of $gameParty.members()) {
                actor.setMp(actor.mmp);
                actor.refresh();
            }
            $gameMessage.add(message);
            SceneManager.pop();
        }
    }

    window.Scene_CampRest = Scene_CampRest;
})();
