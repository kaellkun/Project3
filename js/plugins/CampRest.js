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
 * @text HP回復率タグ未設定時の回復率
 * @type number
 * @decimals 0
 * @min 1
 * @max 100
 * @default 25
 * @desc 互換用。<CampRestHpRate:25> がない食材に適用します。
 *
 * @help
 * アイテムのメモに <CampRestHpRate:25> を設定すると、
 * 焚き火用の食材となり、1個で全員の最大HPの25%を回復します（0～100）。
 * <CampRestMeat> でも食材として登録できます。
 * 食材の「使用効果」の「ステート解除」は生存中の全員に適用します。
 * 解除確率は使用効果の設定に従い、使用個数分だけ判定します。
 * HPを回復しない食材には <CampRestHpRate:0> を指定してください。
 * 通常使用時の対象・効果は変更しません。
 */

(() => {
    "use strict";

    const pluginName = "CampRest";
    const parameters = PluginManager.parameters(pluginName);
    const meatItemIds = String(parameters.MeatItemIds || "2,65,89")
        .split(",")
        .map(Number)
        .filter(id => id > 0);
    const hpRecoveryRate = Math.max(1, Math.min(100, Number(parameters.HpRecoveryRate || 25)));

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
        return !!item && (meatItemIds.includes(item.id) ||
            /<CampRestMeat>|<CampRestHpRate\s*:/i.test(item.note || ""));
    }

    function foodHpRate(item) {
        const tag = /<CampRestHpRate\s*:([^>]*)>/i.exec(item.note || "");
        if (!tag) return hpRecoveryRate;
        const rate = Number(tag[1]);
        if (!tag[1].trim() || !Number.isFinite(rate) || rate < 0 || rate > 100) {
            throw new Error(`CampRest: ${item.name} (ID ${item.id}) の CampRestHpRate は0～100で指定してください。`);
        }
        return rate;
    }

    function stateRemovalEffects(item) {
        return item.effects.filter(effect => effect.code === Game_Action.EFFECT_REMOVE_STATE);
    }

    function recoveryText(rate, items) {
        const names = [...new Set(items.flatMap(item =>
            stateRemovalEffects(item).map(effect => $dataStates[effect.dataId].name)))];
        const hp = `HP回復 ${Math.min(100, Math.round(rate * 100) / 100)}%`;
        return names.length > 0 ? `${hp} / 解除: ${names.join("・")}` : hp;
    }

    class Window_CampRestCommand extends Window_Command {
        makeCommandList() {
            this.addCommand("食材を使う", "meat", this.meatCount() > 0);
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
            this._quantities = new Map();
            super.initialize(rect);
        }

        makeCommandList() {
            for (const item of this._items) {
                const count = this._quantities.get(item) || 0;
                this.addCommand(`${item.name}  (${count}/${$gameParty.numItems(item)}個)`, "item", true, item);
            }
            this.addCommand("選んだ食材で休憩する", "finish", this._quantities.size > 0);
        }
    }

    class Window_CampRestQuantity extends Window_Command {
        initialize(rect, item) {
            this._item = item;
            super.initialize(rect);
        }

        makeCommandList() {
            const max = $gameParty.numItems(this._item);
            for (let count = 0; count <= max; count++) {
                const rate = foodHpRate(this._item) * count;
                const label = count === 0 ? "使わない" :
                    `${count}個  (${recoveryText(rate, [this._item])})`;
                this.addCommand(label, "quantity", true, count);
            }
        }
    }

    class Window_CampRestConfirm extends Window_Command {
        makeCommandList() {
            this.addCommand("この内容で休憩する", "yes");
            this.addCommand("食材を選び直す", "no");
        }
    }

    class Scene_CampRest extends Scene_MenuBase {
        create() {
            super.create();
            this._selectedQuantities = new Map();
            this.createHelpWindow();
            this.updateHelp();
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
            return this.windowRect(this.meatItems().length + 1);
        }

        quantityWindowRect(item) {
            return this.windowRect($gameParty.numItems(item) + 1);
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
            this._itemWindow._quantities = this._selectedQuantities;
            this._itemWindow.setHandler("item", this.onItem.bind(this));
            this._itemWindow.setHandler("finish", this.onFinishSelection.bind(this));
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
            this._confirmWindow.setHandler("no", this.showItemWindow.bind(this));
            this._confirmWindow.setHandler("cancel", this.showItemWindow.bind(this));
            this.addWindow(this._confirmWindow);
        }

        meatItems() {
            return $gameParty.allItems().filter(isCampRestMeat);
        }

        showMainWindow() {
            this.updateHelp();
            this._mainWindow.refresh();
            this._mainWindow.show();
            this._mainWindow.activate();
            this._itemWindow.hide();
            this._quantityWindow.hide();
            this._confirmWindow.hide();
        }

        onMeat() {
            this._mainWindow.deactivate();
            this._mainWindow.hide();
            this.showItemWindow();
        }

        showItemWindow() {
            this.updateHelp();
            this._itemWindow._items = this.meatItems();
            const rect = this.itemWindowRect();
            this._itemWindow.move(rect.x, rect.y, rect.width, rect.height);
            this._itemWindow.refresh();
            this._quantityWindow.hide();
            this._confirmWindow.hide();
            this._itemWindow.show();
            this._itemWindow.activate();
        }

        onItem() {
            this._selectedItem = this._itemWindow.currentExt();
            this._quantityWindow._item = this._selectedItem;
            const rect = this.quantityWindowRect(this._selectedItem);
            this._quantityWindow.move(rect.x, rect.y, rect.width, rect.height);
            this._quantityWindow.refresh();
            this._quantityWindow.selectExt(this._selectedQuantities.get(this._selectedItem) || 0);
            this._itemWindow.hide();
            this._quantityWindow.show();
            this._quantityWindow.activate();
        }

        updateHelp() {
            const total = [...this._selectedQuantities.values()].reduce((sum, count) => sum + count, 0);
            const rate = this.selectedHpRate();
            const recovery = recoveryText(rate, [...this._selectedQuantities.keys()]);
            this._helpWindow.setText(`焚き火休憩では、食材を複数種類まとめて使えます。\n選択中: 合計${total}個 / ${recovery}\n食材の効果は生存中の全員に適用。MPは全員全回復します。`);
        }

        selectedHpRate() {
            return [...this._selectedQuantities].reduce(
                (sum, [item, count]) => sum + foodHpRate(item) * count, 0
            );
        }

        onQuantity() {
            const count = this._quantityWindow.currentExt();
            if (count > 0) {
                this._selectedQuantities.set(this._selectedItem, count);
            } else {
                this._selectedQuantities.delete(this._selectedItem);
            }
            this.showItemWindow();
        }

        onFinishSelection() {
            this._itemWindow.hide();
            this._confirmWindow.show();
            this._confirmWindow.select(0);
            this._confirmWindow.activate();
        }

        onConfirm() {
            for (const [item, count] of this._selectedQuantities) {
                if ($gameParty.numItems(item) < count) {
                    SoundManager.playBuzzer();
                    this._helpWindow.setText("食材の所持数が足りません。食材を選び直してください。");
                    this._confirmWindow.activate();
                    return;
                }
            }
            const rate = this.selectedHpRate();
            const action = new Game_Action($gameParty.leader());
            for (const [item, count] of this._selectedQuantities) {
                $gameParty.loseItem(item, count);
                for (const actor of $gameParty.members()) {
                    if (!actor.isAlive()) continue;
                    for (let i = 0; i < count; i++) {
                        for (const effect of stateRemovalEffects(item)) {
                            action.itemEffectRemoveState(actor, effect);
                        }
                    }
                }
            }
            for (const actor of $gameParty.members()) {
                if (actor.isAlive() && rate > 0) actor.gainHp(Math.floor(actor.mhp * rate / 100));
            }
            this.finishRest();
        }

        onRest() {
            this.finishRest();
        }

        finishRest() {
            for (const actor of $gameParty.members()) {
                actor.setMp(actor.mmp);
                actor.refresh();
            }
            SceneManager.pop();
        }
    }

    window.Scene_CampRest = Scene_CampRest;
})();
