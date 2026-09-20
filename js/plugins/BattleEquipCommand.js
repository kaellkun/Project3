//=============================================================================
// RPG Maker MZ - Battle Equip Command
//=============================================================================

/*:
 * @target MZ
 * @plugindesc 戦闘中のアクターコマンドに「装備」を追加し、そのアクターの装備画面を開きます。(v1.0.0)
 * @author Copilot
 *
 * @help BattleEquipCommand.js
 *
 * アクターコマンドの末尾に「装備」(用語: 装備) を追加します。
 * 選択するとメニューと同じ装備画面 (Scene_Equip) を、入力中のアクターで
 * 直接開きます。戦闘中は他アクターへの切り替え (PageUp/PageDown・
 * ページボタン) を無効化します。
 *
 * 装備画面から戻ると、戦闘は入力中の状態から再開します。
 * 戦闘開始処理 (BGM再生・BattleManager.startBattle) や戦闘終了処理
 * ($gameParty.onBattleEnd など) は往復時には実行されません。
 *
 * プラグインコマンドはありません。
 */

(() => {
    "use strict";

    const goingToEquip = () => SceneManager.isNextScene(Scene_Equip);
    const returningFromEquip = () => SceneManager.isPreviousScene(Scene_Equip);

    //-----------------------------------------------------------------------------
    // Window_ActorCommand
    //-----------------------------------------------------------------------------
    const _Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
    Window_ActorCommand.prototype.makeCommandList = function() {
        _Window_ActorCommand_makeCommandList.call(this);
        if (this._actor) {
            this.addEquipCommand();
        }
    };

    Window_ActorCommand.prototype.addEquipCommand = function() {
        this.addCommand(TextManager.equip, "equip");
    };

    //-----------------------------------------------------------------------------
    // Scene_Battle
    //-----------------------------------------------------------------------------
    const _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        _Scene_Battle_createActorCommandWindow.call(this);
        this._actorCommandWindow.setHandler("equip", this.commandEquip.bind(this));
    };

    Scene_Battle.prototype.commandEquip = function() {
        $gameParty.setMenuActor(BattleManager.actor());
        SceneManager.push(Scene_Equip);
    };

    // Like Scene_Map -> menu: no fade and keep the battle visible for the snapshot.
    const _Scene_Battle_stop = Scene_Battle.prototype.stop;
    Scene_Battle.prototype.stop = function() {
        if (goingToEquip()) {
            Scene_Message.prototype.stop.call(this);
        } else {
            _Scene_Battle_stop.call(this);
        }
    };

    // The battle is still running; skip onBattleEnd/autosave and snap the background.
    const _Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function() {
        if (goingToEquip()) {
            Scene_Message.prototype.terminate.call(this);
            this._actorCommandWindow.hide();
            SceneManager.snapForBackground();
        } else {
            _Scene_Battle_terminate.call(this);
        }
    };

    // Resume input; BattleManager keeps its phase and the BGM is already playing.
    const _Scene_Battle_start = Scene_Battle.prototype.start;
    Scene_Battle.prototype.start = function() {
        if (returningFromEquip()) {
            Scene_Message.prototype.start.call(this);
            this._statusWindow.refresh();
        } else {
            _Scene_Battle_start.call(this);
        }
    };

    //-----------------------------------------------------------------------------
    // Scene_Equip (battle: current actor only)
    //-----------------------------------------------------------------------------
    const _Scene_Equip_createCommandWindow = Scene_Equip.prototype.createCommandWindow;
    Scene_Equip.prototype.createCommandWindow = function() {
        _Scene_Equip_createCommandWindow.call(this);
        if ($gameParty.inBattle()) {
            delete this._commandWindow._handlers.pagedown;
            delete this._commandWindow._handlers.pageup;
        }
    };

    const _Scene_Equip_needsPageButtons = Scene_Equip.prototype.needsPageButtons;
    Scene_Equip.prototype.needsPageButtons = function() {
        return !$gameParty.inBattle() && _Scene_Equip_needsPageButtons.call(this);
    };
})();
