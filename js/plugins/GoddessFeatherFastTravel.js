/*:
 * @target MZ
 * @plugindesc 女神様の羽根で、訪問済みの焚き火・宿屋へ移動します。
 * @author Project3
 *
 * @param FastTravelItemIds
 * @text ファストトラベルアイテムID
 * @type string
 * @default 6,56
 * @desc 対象にするアイテムIDをカンマ区切りで指定します。<FastTravel>付きのアイテムも対象です。
 *
 * @param CampfireCommonEventId
 * @text 焚き火コモンイベントID
 * @type common_event
 * @default 4
 * @desc 実行時に焚き火の場所を訪問済みとして記録するコモンイベントです。
 *
 * @param InnCommonEventId
 * @text 宿屋記録コモンイベントID
 * @type common_event
 * @default 3
 * @desc 実行時に宿屋の場所を訪問済みとして記録するコモンイベントです。
 *
 * @param WindowTitle
 * @text 選択画面タイトル
 * @type string
 * @default 移動先を選択
 *
 * @param CampfireLabel
 * @text 焚き火の表示名
 * @type string
 * @default 焚き火
 *
 * @param InnLabel
 * @text 宿屋の表示名
 * @type string
 * @default 宿屋
 *
 * @help
 * 指定したコモンイベントが実行された時点のマップ・座標を訪問済み地点として保存します。
 * 同じ地点は重複登録しません。保存データにも保持されるため、次回ロード後も利用できます。
 *
 * 対象アイテムはパラメータのID、またはアイテムのメモ欄に <FastTravel> を指定します。
 * 移動先を決定した時だけアイテムを1個消費します。キャンセル時は消費しません。
 * マップイベント名を初期値（EV001など）から変更すると、その名前を移動先名に使用します。
 */

(() => {
    "use strict";

    const pluginName = "GoddessFeatherFastTravel";
    const parameters = PluginManager.parameters(pluginName);
    const itemIds = String(parameters.FastTravelItemIds || "6,56")
        .split(",")
        .map(Number)
        .filter(id => id > 0);
    const campfireCommonEventId = Number(parameters.CampfireCommonEventId || 4);
    const innCommonEventId = Number(parameters.InnCommonEventId || 3);
    const windowTitle = String(parameters.WindowTitle || "移動先を選択");
    const campfireLabel = String(parameters.CampfireLabel || "焚き火");
    const innLabel = String(parameters.InnLabel || "宿屋");

    const _Game_System_initMembers = Game_System.prototype.initMembers;
    Game_System.prototype.initMembers = function() {
        _Game_System_initMembers.apply(this, arguments);
        this._goddessFeatherLocations = [];
    };

    Game_System.prototype.goddessFeatherLocations = function() {
        if (!Array.isArray(this._goddessFeatherLocations)) {
            this._goddessFeatherLocations = [];
        }
        return this._goddessFeatherLocations;
    };

    Game_System.prototype.recordGoddessFeatherLocation = function(type, eventId) {
        if (!$gameMap || !$gamePlayer) return;
        const event = typeof $dataMap !== "undefined" && $dataMap.events
            ? $dataMap.events[eventId]
            : null;
        const eventName = event && event.name && !/^EV\d+$/i.test(event.name)
            ? event.name
            : "";
        const location = {
            type,
            mapId: $gameMap.mapId(),
            x: $gamePlayer.x,
            y: $gamePlayer.y,
            mapName: $dataMapInfos && $dataMapInfos[$gameMap.mapId()]
                ? $dataMapInfos[$gameMap.mapId()].name
                : `マップ${$gameMap.mapId()}`
        };
            if (eventName) location.eventName = eventName;
        const locations = this.goddessFeatherLocations();
        const exists = locations.some(saved => saved.type === location.type
            && saved.mapId === location.mapId
            && saved.x === location.x
            && saved.y === location.y);
        if (!exists) locations.push(location);
    };

    function recordCommonEventLocation(commonEventId, eventId) {
        if (commonEventId === campfireCommonEventId) {
            $gameSystem.recordGoddessFeatherLocation("campfire", eventId);
        } else if (commonEventId === innCommonEventId) {
            $gameSystem.recordGoddessFeatherLocation("inn", eventId);
        }
    }

    const _Game_Temp_reserveCommonEvent = Game_Temp.prototype.reserveCommonEvent;
    Game_Temp.prototype.reserveCommonEvent = function(commonEventId) {
        recordCommonEventLocation(commonEventId);
        return _Game_Temp_reserveCommonEvent.apply(this, arguments);
    };

    const _Game_Interpreter_command117 = Game_Interpreter.prototype.command117;
    Game_Interpreter.prototype.command117 = function(params) {
        recordCommonEventLocation(Number(params[0]), this._eventId);
        return _Game_Interpreter_command117.apply(this, arguments);
    };

    function isFastTravelItem(item) {
        return !!item && (itemIds.includes(item.id) || /<FastTravel>/i.test(item.note || ""));
    }

    class Window_GoddessFeatherTravel extends Window_Command {
        initialize(rect, locations) {
            this._locations = locations;
            super.initialize(rect);
        }

        makeCommandList() {
            const typeCounts = { campfire: 0, inn: 0 };
            for (const location of this._locations) {
                const label = location.type === "campfire" ? campfireLabel : innLabel;
                const mapName = location.mapName || `マップ${location.mapId}`;
                typeCounts[location.type] = (typeCounts[location.type] || 0) + 1;
                const number = typeCounts[location.type];
                const placeName = location.eventName || `${label} ${number}`;
                this.addCommand(`${placeName}：${mapName} (${location.x},${location.y})`, "travel", true, location);
            }
            this.addCommand("戻る", "cancel");
        }
    }

    class Scene_GoddessFeatherTravel extends Scene_MenuBase {
        create() {
            super.create();
            this.createHelpWindow();
            this._helpWindow.setText(windowTitle);
            const rect = new Rectangle(
                0,
                this.mainAreaTop(),
                Graphics.boxWidth,
                this.mainAreaHeight()
            );
            this._travelWindow = new Window_GoddessFeatherTravel(rect, $gameSystem.goddessFeatherLocations());
            this._travelWindow.setHandler("travel", this.onTravel.bind(this));
            this._travelWindow.setHandler("cancel", this.popScene.bind(this));
            this.addWindow(this._travelWindow);
            this._travelWindow.activate();
            this._travelWindow.select(0);
        }

        onTravel() {
            const location = this._travelWindow.currentExt();
            const item = Scene_GoddessFeatherTravel.pendingItem;
            if (!location || !item || !$gameParty.hasItem(item)) {
                this.popScene();
                return;
            }
            $gameParty.consumeItem(item);
            $gamePlayer.reserveTransfer(location.mapId, location.x, location.y, 2, 0);
            SceneManager.goto(Scene_Map);
        }
    }

    const _Scene_Item_useItem = Scene_Item.prototype.useItem;
    Scene_Item.prototype.useItem = function() {
        const item = this.item();
        if (!isFastTravelItem(item)) {
            _Scene_Item_useItem.apply(this, arguments);
            return;
        }
        Scene_GoddessFeatherTravel.pendingItem = item;
        SceneManager.push(Scene_GoddessFeatherTravel);
    };
})();
