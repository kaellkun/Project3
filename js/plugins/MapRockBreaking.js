//=============================================================================
// RPG Maker MZ - MapRockBreaking
// Released under the MIT license.
//=============================================================================

/*:
 * @target MZ
 * @plugindesc マップ上でSVモーションを使い、岩破壊・草木採取を行います。(v1.1.0)
 * @author Project3
 *
 * @param HammerWeaponId
 * @text 必要なハンマー武器ID
 * @type weapon
 * @default 154
 *
 * @param HammerWeaponImageId
 * @text SVハンマー画像ID
 * @desc Weapons1シートの画像ID。標準の斧画像を初期値にしています。
 * @type number
 * @min 1
 * @default 4
 *
 * @command AdvanceDay
 * @text 日付を進める（旧コマンド）
 * @desc 互換用です。新規設定ではMapTypeCommonEventの「日付を進めて日次アイテムを再ポップ」を使用してください。
 *
 * @help
 * イベントのメモ欄に <岩破壊> または <岩破壊:154,12> を設定します。
 * 数字は必要武器IDと、任意の武器不足時コモンイベントIDです。
 * <岩破壊> のみの場合は標準のハンマー武器ID154を使います。
 * イベントページのトリガーを「決定ボタン」にしてください。
 * パーティが指定武器を持っていれば、
 * リーダーのサイドビュー「振り」モーションとハンマーのSV武器画像を表示し、
 * モーションと同時にセルフスイッチAをONにします。草木採取は短剣のSV武器画像を使います。
 * 対象の相対位置から上下左右の向き・左右反転とアクション位置を調整します。
 * モーション速度は通常より速く、演出は約12フレームで完了します。
 *
 * 破壊後の見た目は、セルフスイッチAを条件にした2ページ目で設定します
 * （画像なし・すり抜け等）。
 *
 * 草木採取イベントはメモ欄に <草木採取> を設定します。
 * <草木採取:148,12> のように必要武器IDと不足時コモンイベントIDを
 * 指定できます。必要武器だけなら <草木採取:148>、草木以外の採取物なら
 * <採取アクション:148,12>、全アクション共通なら <必要武器:148,12> も使えます。
 * 岩破壊では <岩破壊:148,12> のように武器IDとコモンIDを指定します。
 * ハンマー武器ID154も同様に指定できます。所持確認後、リーダーの
 * 短剣のSV武器画像と設定された攻撃モーションを開始し、
 * 元のイベントコマンドも同時に実行します。アイテム獲得やセルフスイッチAは
 * イベントコマンドで設定してください。
 * 必要武器がない場合は指定したコモンイベントを予約します。
 * タプル指定を省略する場合は <武器不足コモン:12> を併用できます。
 * いずれも省略時は標準の不足メッセージを表示します。
 * 草木採取イベントは日次リポップ対象です。通常のアイテムイベントも
 * 日次対象にする場合はメモ欄に <日次リポップ> を付けます。
 * 再ポップの日付管理はMapTypeCommonEventが担当します。朝への切替で日次対象の
 * セルフスイッチAが解除されます。新規の日付進行には、そちらの
 * 「日付を進めて日次アイテムを再ポップ」コマンドを使用してください。
 * 旧「AdvanceDay」コマンドも互換用に残しています。
 */

(() => {
    'use strict';

    const parameters = PluginManager.parameters('MapRockBreaking');
    const hammerWeaponId = Number(parameters.HammerWeaponId || 154);
    const hammerWeaponImageId = Math.max(1, Number(parameters.HammerWeaponImageId || 4));
    const motionSpeed = 3;
    const motionDuration = 12;
    const bitmapLoadTimeout = 45;

    // Backward compatibility: respawn is owned by MapTypeCommonEvent.
    PluginManager.registerCommand('MapRockBreaking', 'AdvanceDay', function() {
        PluginManager.callCommand(this, 'MapTypeCommonEvent', 'AdvanceDay', {});
    });

    function labelArguments(value) {
        if (value === undefined || value === null || value === true || value === false) return [];
        return String(value).split(',').map(argument => argument.trim());
    }

    function labelId(value, fallback = 0) {
        if (value === undefined || value === '') return fallback;
        const id = Number(value);
        return Number.isSafeInteger(id) && id >= 0 ? id : -1;
    }

    function actionConfig(event, label, isRock = false) {
        const meta = event.event().meta || {};
        const labelValue = meta[label] ?? meta[isRock ? 'RockBreak' : 'PlantHarvest'] ??
              (isRock ? undefined : meta['採取アクション'] ?? meta.GatherAction);
        if (labelValue === undefined || labelValue === false) return null;
        const args = labelArguments(labelValue);
        const genericArgs = labelArguments(meta['必要武器'] ?? meta.RequiredWeapon);
        const separateWeapon = meta['採取必要武器'] ?? meta.HarvestWeapon;
        const separateCommon = meta['武器不足コモン'] ?? meta.MissingWeaponCommonEvent;
        const weaponArg = args[0];
        const commonArg = args[1];
        let weaponId;
        if (separateWeapon !== undefined) {
            weaponId = labelId(separateWeapon);
        } else if (weaponArg !== undefined) {
            weaponId = labelId(weaponArg);
        } else if (genericArgs[0] !== undefined) {
            weaponId = labelId(genericArgs[0]);
        } else {
            weaponId = isRock ? hammerWeaponId : 0;
        }
        let commonEventId;
        if (commonArg !== undefined) {
            commonEventId = labelId(commonArg);
        } else if (separateCommon !== undefined) {
            commonEventId = labelId(separateCommon);
        } else if (genericArgs[1] !== undefined) {
            commonEventId = labelId(genericArgs[1]);
        } else {
            commonEventId = 0;
        }
        return { weaponId, commonEventId };
    }

    function handleMissingWeapon(event, weaponName, configuredCommonEventId) {
        const commonEventId = configuredCommonEventId || 0;
        if (commonEventId > 0 && $dataCommonEvents[commonEventId]) {
            $gameTemp.reserveCommonEvent(commonEventId);
        } else {
            if (commonEventId < 0 || (commonEventId > 0 && !$dataCommonEvents[commonEventId])) {
                console.warn(`MapRockBreaking: 武器不足コモンイベントID ${commonEventId} が不正です。`);
            }
            showFailure(`${weaponName}が必要だ！`);
        }
    }

    function showFailure(message) {
        if ($gameMessage && !$gameMessage.isBusy()) {
            $gameMessage.add(message);
        } else if (SoundManager && SoundManager.playBuzzer) {
            SoundManager.playBuzzer();
        }
    }

    function playerCharacterSprite(spriteset) {
        return spriteset._characterSprites.find(sprite => sprite._character === $gamePlayer);
    }

    function attackDirection(event) {
        const dx = $gameMap.deltaX(event.x, $gamePlayer.x);
        const dy = $gameMap.deltaY(event.y, $gamePlayer.y);
        if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 4 : 6;
        if (Math.abs(dy) > 0) return dy < 0 ? 8 : 2;
        return $gamePlayer.direction();
    }

    class Sprite_FieldAction extends Sprite_Actor {
        constructor(actor, event, direction, motionType, weaponImageId) {
            super(actor);
            this._fieldEvent = event;
            this._fieldDirection = direction;
            this._fieldFrames = 0;
            this._fieldComplete = false;
            this._fieldPlayerSprite = null;
            this._fieldPlayerVisible = true;
            this.setHome(0, 0);
            this.startMove(0, 0, 0);
            // SV actor sheets face left by default. Flip right/downward attacks.
            this.scale.x = direction === 6 || direction === 2 ? -1 : 1;
            this.startMotion(motionType);
            this._weaponSprite.animationWait = () => motionSpeed;
            if (weaponImageId > 0) actor.startWeaponAnimation(weaponImageId);
            if (this._shadowSprite) this._shadowSprite.visible = false;
        }

        motionSpeed() {
            return motionSpeed;
        }

        updatePosition() {
            // Sprite_Actor.setBattler calls setHome during super() before our event is assigned.
            if (!this._fieldEvent || !$gamePlayer || !$gameMap) return;
            const dx = $gameMap.deltaX(this._fieldEvent.x, $gamePlayer.x);
            const dy = $gameMap.deltaY(this._fieldEvent.y, $gamePlayer.y);
            this.x = $gamePlayer.screenX() + Math.sign(dx) * 6;
            this.y = $gamePlayer.screenY() + Math.sign(dy) * 4;
            this.z = $gamePlayer.screenZ() + 0.1;
        }

        updateVisibility() {
            this.visible = !!this._actor;
        }

        updateShadow() {
            if (this._shadowSprite) this._shadowSprite.visible = false;
        }

        update() {
            super.update();
            this._fieldFrames++;
            if (this._mainSprite && this._mainSprite.bitmap && this._mainSprite.bitmap.isReady()) {
                if (!this._fieldPlayerSprite) {
                    const spriteset = SceneManager._scene && SceneManager._scene._spriteset;
                    this._fieldPlayerSprite = spriteset && playerCharacterSprite(spriteset);
                    if (this._fieldPlayerSprite) {
                        this._fieldPlayerVisible = this._fieldPlayerSprite.visible;
                        this._fieldPlayerSprite.visible = false;
                    }
                }
                if (this._fieldFrames >= motionDuration) this.finish();
            } else if (this._fieldFrames >= bitmapLoadTimeout) {
                this.finish();
            }
        }

        finish() {
            if (this._fieldComplete) return;
            this._fieldComplete = true;
            if (this._fieldPlayerSprite) {
                this._fieldPlayerSprite.visible = this._fieldPlayerVisible;
            }
            const onComplete = this._onFieldActionComplete;
            if (this.parent) this.parent.removeChild(this);
            this.destroy({ children: true });
            if (onComplete) onComplete();
        }
    }

    function attackMotionForWeaponType(weaponTypeId) {
        return $dataSystem.attackMotions[weaponTypeId] || null;
    }

    function svMotionTypeForWeaponType(weaponTypeId) {
        const motion = attackMotionForWeaponType(weaponTypeId);
        if (!motion) return 'swing';
        if (motion.type === 0) return 'thrust';
        if (motion.type === 2) return 'missile';
        return 'swing';
    }

    function weaponImageIdForWeaponType(weaponTypeId) {
        const motion = attackMotionForWeaponType(weaponTypeId);
        if (motion && motion.weaponImageId > 0) return motion.weaponImageId;
        return weaponTypeId === 18 ? hammerWeaponImageId : 0;
    }

    function startFieldAction(event, motionType, weaponImageId) {
        const scene = SceneManager._scene;
        const spriteset = scene && scene._spriteset;
        const actor = $gameParty.leader();
        if (!spriteset || !spriteset._tilemap || !actor) return false;

        event._fieldActionRunning = true;
        event._starting = false;
        event.lock();
        $gamePlayer._fieldRockBreaking = true;
        $gameMap._fieldRockBreaking = true;
        const direction = attackDirection(event);
        const fieldSprite = new Sprite_FieldAction(actor, event, direction, motionType, weaponImageId);
        fieldSprite._onFieldActionComplete = () => {
            event._fieldActionRunning = false;
            event.unlock();
            $gamePlayer._fieldRockBreaking = false;
            $gameMap._fieldRockBreaking = false;
        };
        spriteset._tilemap.addChild(fieldSprite);
        return true;
    }

    const _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        const rock = actionConfig(this, '岩破壊', true);
        const harvest = actionConfig(this, '草木採取');
        if ((!rock && !harvest) || this._trigger !== 0 || this._erased || this._fieldActionRunning) {
            return _Game_Event_start.apply(this, arguments);
        }
        const startArgs = arguments;
        const selfSwitchKey = [this._mapId, this._eventId, 'A'];
        if ($gameSelfSwitches.value(selfSwitchKey)) {
            return _Game_Event_start.apply(this, arguments);
        }

        if (harvest) {
            if (harvest.weaponId < 0 || harvest.commonEventId < 0) {
                showFailure('草木採取イベントの武器IDまたはコモンイベントIDを確認してください。');
                return;
            }
            const requiredWeapon = harvest.weaponId > 0 ? $dataWeapons[harvest.weaponId] : null;
            if (harvest.weaponId > 0 && (!requiredWeapon || !$gameParty.hasItem(requiredWeapon, true))) {
                handleMissingWeapon(this, requiredWeapon ? requiredWeapon.name : '必要な武器',
                    harvest.commonEventId);
                return;
            }
            const started = startFieldAction(this, svMotionTypeForWeaponType(1),
                weaponImageIdForWeaponType(1), () => {});
            if (!started) return _Game_Event_start.apply(this, arguments);
            _Game_Event_start.apply(this, startArgs);
            return;
        }

        if (rock.weaponId < 0 || rock.commonEventId < 0) {
            showFailure('岩破壊イベントの武器IDまたはコモンイベントIDを確認してください。');
            return;
        }
        const requiredWeapon = rock.weaponId > 0 ? $dataWeapons[rock.weaponId] : null;
        if (rock.weaponId > 0 && (!requiredWeapon || !$gameParty.hasItem(requiredWeapon, true))) {
            handleMissingWeapon(this, requiredWeapon ? requiredWeapon.name : '必要なハンマー',
                rock.commonEventId);
            return;
        }
        const started = startFieldAction(this, svMotionTypeForWeaponType(18),
            weaponImageIdForWeaponType(18), () => {});
        if (!started) return _Game_Event_start.apply(this, arguments);
        $gameSelfSwitches.setValue(selfSwitchKey, true);
    };

    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        return !this._fieldRockBreaking && _Game_Player_canMove.apply(this, arguments);
    };

    const _Game_Map_isEventRunning = Game_Map.prototype.isEventRunning;
    Game_Map.prototype.isEventRunning = function() {
        return !!this._fieldRockBreaking || _Game_Map_isEventRunning.apply(this, arguments);
    };
})();
