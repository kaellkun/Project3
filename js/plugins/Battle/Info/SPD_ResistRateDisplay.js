//=============================================================================
// RPGツクールMZ - SPD_ResistRateDisplay.js v1.0.0
//-----------------------------------------------------------------------------
// サードギア (Third Gear)
// https://x.com/ThirdGear_Games
//=============================================================================

/*:
 * @target MZ
 * @plugindesc スキル選択時エネミー耐性表示プラグイン
 * @author スピード(サードギア)
 *
 * @help
 * SPD_ResistRateDisplay.js
 * 
 * 敵を対象に取るスキルの対象選択ウィンドウで、攻撃の属性倍率やステート(弱体)耐性を表示するプラグインです。
 * 攻撃したことのない属性で攻撃する場合、初めは「???%」と表示され
 * 一度攻撃した後は その戦闘中「120%」等と表示されるようになります。
 * 
 * 戦闘後にフラグはリセットされます。
 * (リセットしない場合、エネミー種類数×(属性+ステート+弱体)で、
 *  大量のフラグの保持が必要となり、セーブデータサイズが巨大になるため未対応。)
 * 
 * ゲーム内で一定数倒したエネミーに対しては、耐性を全開示する設定が可能です。
 * 内部で討伐数を保持するためセーブデータは大きくなります。ご了承ください。
 * また、他の討伐数記録（図鑑系プラグイン）と二重にデータを保持する場合があります。
 * 
 * 攻撃の場合は、その攻撃の属性を読み取り、敵の耐性値を参照してダメージ倍率を表示します。
 * 「HPダメージ」または「HP吸収」でなく、敵を対象に取るスキルに関しては。
 * 弱体耐性やステート耐性に対しての表示が可能です（メタデータでの制御は必要）
 * 
 * 「毒+麻痺」「DEF弱体+麻痺」のような
 * 複数ステート付与や弱体とステートの複合表示はできません。
 * (表示はされきませんが、命中すれば両方の耐性は以降開示されます。)
 * 
 * 「炎属性攻撃+毒」の場合は、炎属性耐性が優先して表示されます。
 * (表示はされきませんが、命中すれば毒耐性も開示されます。)
 * 
 * 同じIDのエネミーが複数体出現する場合は、いずれか1体に攻撃した情報を、
 * 他の同一IDエネミーを選択した場合でも共有する仕様になっています。
 * (例：ゴブリンAに炎属性攻撃をした場合、ゴブリンBの炎属性耐性も表示されるようになる。)
 * 
 * エネミーに耐性が変動するステートが付与された場合、変動した後の結果が表示されます。
 * 
 * ■ステート耐性を表示させたい場合
 * ステートだけ付与する非ダメージスキルの場合は、タグを付けることで対応できます。
 * <DisplayState:12> → ステートID12のステート耐性を表示
 * 
 * ■弱体耐性を表示させたい場合
 * 弱体だけ付与する非ダメージスキルの場合は、スキルのメモにタグを付けることで対応できます。
 * <DisplayDebuff:2> → ステータスID2(ATK)の弱体耐性を表示
 * ※HPMAX(0)～LUK(7)までしか対応していません。
 * 
 * --注意事項--
 * 「敵キャラの出現」には対応していますが、「仲間を呼ぶ」系のプラグインでエラーが出る可能性はあります。
 * （なるべく出ない書き方にはしています。）
 * 
 * 通常攻撃が複数属性になる場合（炎＋氷属性の剣を装備して通常攻撃等）には対応しています。
 * 一方 外部プラグインによって、スキルが複数属性を持っているケースには対応していません。
 * -----------
 * 
 * 
 * 作成者：スピード（サードギア）
 * 作成日：2025/10/20
 * 
 * 利用規約:
 *   ・著作権表記：不要
 *   ・利用報告：不要
 *   ・商用・非商用：どちらでも可
 *   ・R-18作品：使用可
 *   ・改変：可
 *   ・プラグイン素材の再配布：禁止
 *   ・本プラグインベースの改変プラグイン配布：許可
 * 
 *
 * ■更新履歴
 * v1.0.0 (25/10/20) リリース
 * 
 * @param elementList
 * @text 耐性表示属性リスト
 * @desc ここに入れた属性IDのみ耐性表示します。
 * @type number[]
 * @default []
 * @min 1
 * 
 * @param unDisplaySwitch
 * @text 耐性表示無効スイッチ
 * @desc このスイッチがONの場合、当プラグイン機能を無効にします。(0なら無視)
 * @type number
 * @default 0
 * @min 0
 * 
 * @param rateFontSize
 * @text 耐性値フォントサイズ
 * @desc 表示する文字列のフォントサイズの設定です。
 * @type number
 * @default 24
 * @min 1
 * 
 * @param rateOpenCondition
 * @text 耐性全開示条件
 * @desc その敵を「この値」以上倒していれば、耐性を全開示する。(0なら無効)
 * @type num
 * @default 0
 * @min 0
 * 
 * @param ratePositionType
 * @text 耐性値表示位置タイプ
 * @desc 耐性値の文字列表示位置の起点です。(1:左上 2:左下 3:右上 4:右下)
 * @type number
 * @default 1
 * @max 4
 * @min 1
 * 
 * @param ratePositionX
 * @text 耐性値表示位置X
 * @desc 耐性値の文字列表示位置のX座標補正です
 * @type number
 * @default -12
 * @min -10000
 * @max 10000
 *
 * @param ratePositionY
 * @text 耐性値表示位置Y
 * @desc 耐性値の文字列表示位置のY座標補正です
 * @type number
 * @default -12
 * @min -10000
 * @max 10000
 * 
 * @param unKnownText
 * @text 耐性不明時表示テキスト
 * @desc 未だ耐性値が不明な属性に対して表示する文字列です。
 * @type string
 * @default ???%
 * 
 * @param rateDisplayType
 * @text 耐性表示形式
 * @desc 耐性表示の形式を選択します。属性有効度75%の場合、true:「-25%」 / false:「75%」 と表示します。
 * @type boolean
 * @default false
 * 
 * @param rateMinus
 * @text 負の耐性表示の無効処理
 * @desc trueの場合は、属性有効度が0%未満になった場合、「0%」に置き換えます。
 * @type boolean
 * @default true
 * 
 * @param mixMaterialType
 * @text 複数属性の計算方式
 * @desc 複数属性を持つ攻撃の属性有効度算出方式。true->最低有効度参照 / false->最高有効度参照 (MZのデフォルト)
 * @type boolean
 * @default false
 * 
 * @param colorToOver
 * @text 有効色
 * @desc 属性有効度が「有効属性ライン」以上の場合、その色で耐性を表示します。
 * @type string
 * @default #ffff00
 * 
 * @param toOver
 * @text 有効属性ライン
 * @desc 「有効色」で属性耐性を表示する基準です。
 * @type number
 * @default 120
 * 
 * @param toOverEx
 * @text 有効追加効果ライン
 * @desc 「有効色」でステート・弱体耐性を表示する基準です。
 * @type number
 * @default 80
 * 
 * @param colorToUnder
 * @text 耐性色
 * @desc 属性有効度が「耐性属性ライン」以下の場合、その色で耐性を表示します。
 * @type string
 * @default #80ff80
 * 
 * @param toUnder
 * @text 耐性属性ライン
 * @desc 「耐性色」で属性耐性を表示する基準です。(1～99の間で設定してください)
 * @type number
 * @default 80
 * 
 * @param toUnderEx
 * @text 耐性追加効果ライン
 * @desc 「耐性色」でステート・弱体耐性を表示する基準です。
 * @type number
 * @default 50
 * 
 * @param colorToNormal
 * @text 通常耐性色
 * @desc 属性(ステート、弱体)有効度が有効色～耐性色の間の場合、この色で耐性を表示します。
 * @type string
 * @default #ffffff
 * 
 * @param colorToBlock
 * @text 無効属性/耐性色
 * @desc 属性(ステート、弱体)有効度が0%以下の場合、この色で耐性を表示します。
 * @type string
 * @default #d6d6d6
 * 
 * @param colorToUnknown
 * @text 不明属性/耐性色
 * @desc 属性(ステート、弱体)有効度が不明の場合、この色で耐性を表示します。
 * @type string
 * @default #ffffff
 * 
 * 
 * 
 */

(() => {
	"use strict";
	const pluginName = "SPD_ResistRateDisplay";
	const parameters = PluginManager.parameters(pluginName);

	//-------------------------------------------
	// パラメータ取得
	//-------------------------------------------
	const param = {
		/** @type {number[]} 表示対象の属性IDリスト */
		elementList: JSON.parse(parameters["elementList"] || "[]").map(Number),

		/** @type {number} 無効スイッチID（0なら無視） */
		unDisplaySwitch: Number(parameters["unDisplaySwitch"] || 0),

		/** @type {number} 耐性全表示 */
		rateOpenCondition: Number(parameters["rateOpenCondition"] || 0),

		/** @type {number} 耐性値表示位置タイプ */
		ratePositionType: Number(parameters["ratePositionType"] || 1),

		/** @type {number} フォントサイズ */
		rateFontSize: Number(parameters["rateFontSize"] || 24),

		/** @type {number} 耐性値表示位置X */
		ratePositionX: Number(parameters["ratePositionX"] || 0),

		/** @type {number} 耐性値表示位置Y */
		ratePositionY: Number(parameters["ratePositionY"] || 0),

		/** @type {string} 耐性不明時の表示文字列 */
		unKnownText: String(parameters["unKnownText"] || "???%"),

		/** @type {boolean} 負の値表示無効処理 */
		rateMinus: parameters["rateMinus"] === "true",

		/** @type {boolean} 表示形式（true:"-25%", false:"75%"） */
		rateDisplayType: parameters["rateDisplayType"] === "true",

		/** @type {boolean} 複数属性の計算方式（true:最小値, false:最大値） */
		mixMaterialType: parameters["mixMaterialType"] === "true",

		/** @type {string} 有効属性の表示色 */
		colorToOver: String(parameters["colorToOver"] || "#ffff00"),

		/** @type {number} 有効属性ライン（％） */
		toOver: Number(parameters["toOver"] || 120),

		/** @type {number} 有効ステートライン（％） */
		toOverEx: Number(parameters["toOverEx"] || 80),

		/** @type {string} 耐性属性の表示色 */
		colorToUnder: String(parameters["colorToUnder"] || "#80ff80"),

		/** @type {number} 耐性属性ライン（％） */
		toUnder: Number(parameters["toUnder"] || 80),

		/** @type {number} 耐性属性ライン（％） */
		toUnderEx: Number(parameters["toUnderEx"] || 50),

		/** @type {string} 通常属性の表示色 */
		colorToNormal: String(parameters["colorToNormal"] || "#8d8d8d"),

		/** @type {string} 無効属性の表示色 */
		colorToBlock: String(parameters["colorToBlock"] || "#8d8d8d"),

		/** @type {string} 不明属性の表示色 */
		colorToUnknown: String(parameters["colorToUnknown"] || "#FFFFFF")
	};

	// 敵を倒したときに呼ぶ(討伐数記録内部変数)
	const _Game_Enemy_performCollapse = Game_Enemy.prototype.performCollapse;
	Game_Enemy.prototype.performCollapse = function() {
		_Game_Enemy_performCollapse.call(this);

		if (!$gameSystem._enemyDefeatCount_SPD) $gameSystem._enemyDefeatCount_SPD = [];
		const id = this.enemyId();
		if (!$gameSystem._enemyDefeatCount_SPD[id]) $gameSystem._enemyDefeatCount_SPD[id] = 0;
		$gameSystem._enemyDefeatCount_SPD[id] += 1;
	};


	//フラグ生成
	const _Scene_Battle_startActorCommandSelection = Scene_Battle.prototype.startActorCommandSelection;
	Scene_Battle.prototype.startActorCommandSelection = function() {
		const enemies = $gameTroop.members();
		const elementCount = $dataSystem.elements.length - 1;
		const stateCount = $dataStates.length - 1;

		// 一度だけ配列を初期化
		if (!$gameTemp._elementFlag) $gameTemp._elementFlag = [];
		if (!$gameTemp._stateFlag) $gameTemp._stateFlag = [];
		if (!$gameTemp._debuffFlag) $gameTemp._debuffFlag = [];
		if (!$gameTemp._enemyId) $gameTemp._enemyId = [];

		// 敵の数だけチェック
		for (let i = 0; i < enemies.length; i++) {
			const enemy = enemies[i];
			if (!enemy) continue;

			const enemyId = enemy.enemyId(); // 現在のID

			// 前回記録と違っていたら（新しい敵がスロットに入ったときだけ）
			if ($gameTemp._enemyId[i] !== enemyId) {

				// フラグ初期化
				$gameTemp._elementFlag[i] = [];
				for (let j = 0; j <= elementCount; j++) {
					$gameTemp._elementFlag[i][j] = false;
				}

				$gameTemp._stateFlag[i] = [];
				for (let j = 0; j <= stateCount; j++) {
					$gameTemp._stateFlag[i][j] = false;
				}

				$gameTemp._debuffFlag[i] = [];
				for (let j = 0; j < 8; j++) {
					$gameTemp._debuffFlag[i][j] = false;
				}

				// 敵IDを更新
				$gameTemp._enemyId[i] = enemyId;
			}
		}
		

		//同じ種別のエネミーならフラグのORを取る
		for (let i = 0; i < enemies.length; i++) {
			for (let j = i + 1; j < enemies.length; j++) {
				// 同じ種類の敵なら統合
				if (enemies[i].enemyId() === enemies[j].enemyId()) {
					
					// 属性フラグ OR 統合
					for (let k = 1; k <= elementCount; k++) {
						const merged = ($gameTemp._elementFlag[i][k] || $gameTemp._elementFlag[j][k]);
						$gameTemp._elementFlag[i][k] = merged;
						$gameTemp._elementFlag[j][k] = merged;
					}

					// ステートフラグ OR 統合
					for (let k = 1; k <= stateCount; k++) {
						const merged = ($gameTemp._stateFlag[i][k] || $gameTemp._stateFlag[j][k]);
						$gameTemp._stateFlag[i][k] = merged;
						$gameTemp._stateFlag[j][k] = merged;
					}

					// デバフフラグ OR 統合
					for (let k = 0; k < 8; k++) {
						const merged = ($gameTemp._debuffFlag[i][k] || $gameTemp._debuffFlag[j][k]);
						$gameTemp._debuffFlag[i][k] = merged;
						$gameTemp._debuffFlag[j][k] = merged;
					}
				}
			}
		}

		// 元の処理を呼ぶ
    	_Scene_Battle_startActorCommandSelection.call(this);
	};

	//フラグ管理
	const _Game_Action_apply = Game_Action.prototype.apply;
	Game_Action.prototype.apply = function(target) {
		// 元の処理を実行（ダメージ計算やステート付与など）
		_Game_Action_apply.call(this, target);
		const skill = $dataSkills[$gameTemp.lastActionData(0)];
		// troopId は配列内の位置から取得
		const troopMembers = $gameTroop.members();
		const troopId = troopMembers.indexOf(target);
		if (troopId < 0) return;

		// 対象が敵の場合のみ
		if (target.isEnemy() && this.isHpEffect()) { // HPダメージ系のみ
			// ■ 属性フラグ
			let elementIds = [skill.damage.elementId];
			if (skill.damage.elementId === -1) {
				// 通常攻撃属性の場合、アクターの追加攻撃属性を取得
				this.subject().traitObjects().forEach(obj => {
					if (obj.traits) {
						obj.traits.forEach(trait => {
							if (trait.code === Game_BattlerBase.TRAIT_ATTACK_ELEMENT) {
								elementIds.push(trait.dataId);
							}
						});
					}
				});
			}
			// -1や0など対象外を除外 & パラメータリストで絞り込み
			elementIds = elementIds.filter(id => id > 0 && param.elementList.includes(id));
			

			// 属性フラグ配列初期化
			if (!$gameTemp._elementFlag) $gameTemp._elementFlag = [];
			if (!$gameTemp._elementFlag[troopId]) $gameTemp._elementFlag[troopId] = [];
			elementIds.forEach(id => { $gameTemp._elementFlag[troopId][id] = true; });

			
		}
		// ■ ステートフラグ
		if (!$gameTemp._stateFlag) $gameTemp._stateFlag = [];
		if (!$gameTemp._stateFlag[troopId]) $gameTemp._stateFlag[troopId] = [];
		skill.effects.forEach(effect => {
			if (effect.code === Game_Action.EFFECT_ADD_STATE) {
				const stateId = effect.dataId;
				$gameTemp._stateFlag[troopId][stateId] = true;
			}
		});

		// ■ デバフフラグ
		if (!$gameTemp._debuffFlag) $gameTemp._debuffFlag = [];
		if (!$gameTemp._debuffFlag[troopId]) $gameTemp._debuffFlag[troopId] = [];
		skill.effects.forEach(effect => {
			if (effect.code === Game_Action.EFFECT_ADD_DEBUFF) {
				const paramId = effect.dataId;
				$gameTemp._debuffFlag[troopId][paramId] = true;
			}
		});
	};


	//耐性計算
	function rateCalculate(enemy, skill, subject){
		let unknown = true; //非公開チェッカ
		const enemyId = enemy.enemyId();
		let troopId = 0;
		const troopMembers = $gameTroop.members();
		if (enemy.isEnemy()) troopId = troopMembers.indexOf(enemy); //エネミーのトループIDを取る
		else return "";

		if (!skill) return ""; //テキスト非表示
		if ($gameSwitches.value(param.unDisplaySwitch)) return ""; //テキスト非表示
		//敵を対象に取らないスキルは対象外
		if (skill.scope!=1 && skill.scope!=2 && skill.scope!=6 && skill.scope!=8) return "";

		let rate = 1.0;

		//ここからステートorデバフ耐性表示
		if (skill.damage.type != 1 && skill.damage.type != 5){
			//ステート耐性表示の場合
			if(!isNaN(Number(skill.meta?.DisplayState))){
				const stateId = Number(skill.meta?.DisplayState);
				rate = enemy.stateRate(stateId); // 0～1 の倍率

				if($gameSystem._enemyDefeatCount_SPD && param.rateOpenCondition>0 && $gameSystem._enemyDefeatCount_SPD[enemyId]>=param.rateOpenCondition){
					//全開示モード
				}
				else if($gameTemp._stateFlag){
					if(!$gameTemp._stateFlag[troopId][stateId]){
						$gameTemp.rateDisplayColor = 0;
						return param.unKnownText;
					}
				}
			}

			//デバフ耐性表示の場合
			if(!isNaN(Number(skill.meta?.DisplayDebuff))){
				const debuffId = Number(skill.meta?.DisplayDebuff);
				rate = enemy.debuffRate(debuffId); // 0～1.0

				if($gameSystem._enemyDefeatCount_SPD && param.rateOpenCondition>0 && $gameSystem._enemyDefeatCount_SPD[enemyId]>=param.rateOpenCondition){
					//全開示モード
				}
				else if($gameTemp._debuffFlag){
					if(!$gameTemp._debuffFlag[troopId][debuffId]){
						$gameTemp.rateDisplayColor = 0;
						return param.unKnownText;
					}
				}
			}
			
			if(rate<0 && param.rateMinus) rate = 0;
			//色変更に対応する処理
			let num = Math.round(rate * 100);

			if(num>=Number(param.toOverEx)) $gameTemp.rateDisplayColor = 1; //有効 
			else if(num<=0) $gameTemp.rateDisplayColor = 4; //無効
			else if(num<=Number(param.toUnderEx)) $gameTemp.rateDisplayColor = 3; //耐性
			else $gameTemp.rateDisplayColor = 2; //通常
			return Math.round(rate * 100) + "%";
		}
		//ここから攻撃の耐性表示
		else{			
			let elementIds = [skill.damage.elementId];
			// 通常攻撃属性の場合、アクターの攻撃追加属性を取得
			if (skill.damage.elementId === -1) {
				// traitObjects() から追加属性を抽出
				subject.traitObjects().forEach(obj => {
					if (obj.traits) {
						obj.traits.forEach(trait => {
							// trait.code === Game_BattlerBase.TRAIT_ATTACK_ELEMENT で攻撃時追加属性
							if (trait.code === Game_BattlerBase.TRAIT_ATTACK_ELEMENT) {
								elementIds.push(trait.dataId); // 追加属性IDを push
							}
						});
					}
				});
			}
			//-1等と対象外の属性を消しておく
			elementIds = elementIds.filter(id => id > 0);
			elementIds = elementIds.filter(id => param.elementList.includes(id));
			
			if(elementIds.length === 0) return "";

			// 敵の属性有効度計算
			const rates = elementIds.map(id => enemy.elementRate(id));
			rate = 1.0;
			//属性有効度の算出
			if(param.mixMaterialType) rate = rates.length > 0 ? Math.min(...rates) : 1.0;
			else rate = rates.length > 0 ? Math.max(...rates) : 1.0;

			if(rate<0 && param.rateMinus) rate = 0;

			if($gameSystem._enemyDefeatCount_SPD && param.rateOpenCondition>0 && $gameSystem._enemyDefeatCount_SPD[enemyId]>=param.rateOpenCondition){
					//全開示モード
			}
			else{
				//不明な属性が1つでも含まれる場合は、不明であることを表示
				for(let i=0; i<elementIds.length; i++){
					if($gameTemp._elementFlag){
						if(!$gameTemp._elementFlag[troopId][elementIds[i]]){
							$gameTemp.rateDisplayColor = 0;
							return param.unKnownText;
						}
					}
				}
			}

			//色変更に対応する処理
			let num = Math.round(rate * 100);
			console.log(num);

			if(num>=Number(param.toOver)) $gameTemp.rateDisplayColor = 1; //有効 
			else if(num<=0) $gameTemp.rateDisplayColor = 4; //無効
			else if(num<=Number(param.toUnder)) $gameTemp.rateDisplayColor = 3; //耐性
			else $gameTemp.rateDisplayColor = 2; //通常

			//表示形式に合わせて成型
			if(param.rateDisplayType){
				let rateText = rate - 1; //80% -> -0.2
				rateText = Math.round(rateText * 100) // -0.2 -> -20
				if(rateText<0) return rateText+"%";
				else if(rateText==0) return "±0%";
				else return "+"+rateText+"%";
			} 
			else return Math.round(rate * 100) + "%";
		}
	};

	const _Sprite_Enemy_initialize = Sprite_Enemy.prototype.initialize;
    Sprite_Enemy.prototype.initialize = function(battler) {
        _Sprite_Enemy_initialize.call(this, battler);

        // 属性表示用スプライト作成
        this._resistSprite = new Sprite();
        this._resistBitmap = new Bitmap(param.rateFontSize*3, param.rateFontSize + 10);
        this._resistSprite.bitmap = this._resistBitmap;
        this.addChild(this._resistSprite);

        this._resistText = rateCalculate(this._battler, null, null);
        this._bitmapWidth = 0;
        this._bitmapHeight = 0;
    };

    const _Sprite_Enemy_update = Sprite_Enemy.prototype.update;
    Sprite_Enemy.prototype.update = function() {
        _Sprite_Enemy_update.call(this);

		if (!this._resistSprite) return;

		let showResist = false;
		let skill = null;
		let subject = null;
		const scene = SceneManager._scene;
		if (scene) {
			// スキル選択中
			if (scene._skillWindow && scene._skillWindow.active) {
				showResist = true;
				skill = scene._skillWindow.item();
				subject = scene._skillWindow._actor || null;
				this._lastSkill = skill;
				this._lastSubject = subject;
			}
			// アクターコマンドで通常攻撃選択中
			else if (scene._actorCommandWindow && scene._actorCommandWindow.active) {
				const command = scene._actorCommandWindow.currentSymbol();
				if (command === 'attack') {
					showResist = true;
					subject = scene._actorCommandWindow._actor || null;
					skill = subject ? $dataSkills[subject.attackSkillId()] : null;
					this._lastSkill = skill;
					this._lastSubject = subject;
				}
			}
			// 敵選択画面中
			else if (scene._enemyWindow && scene._enemyWindow.active) {
				showResist = true;
				skill = this._lastSkill || null;
				subject = this._lastSubject || null;
			}
		}

		// subject が null の場合は rateCalculate 側で無視
		if (showResist && skill && subject) {
			this._resistText = rateCalculate(this._battler, skill, subject);
			this.updateResistBitmap();
		}
		this._resistSprite.visible = showResist;

        if (!this._resistSprite) return;

        // 画像がロードされて幅高さが取得できたら
        if (showResist && this.bitmap && this.bitmap.width > 0) {
            this._bitmapWidth = this.bitmap.width;
            this._bitmapHeight = this.bitmap.height;

            // 配置を固定する処理
			if(param.ratePositionType == 1){
				this._resistSprite.x = -this._bitmapWidth /2;
            	this._resistSprite.y = -this._bitmapHeight;
			}
			else if(param.ratePositionType == 2){
				this._resistSprite.x = -this._bitmapWidth /2;
            	this._resistSprite.y = this._bitmapHeight;
			}
			else if(param.ratePositionType == 3){
				this._resistSprite.x = this._bitmapWidth /2;
            	this._resistSprite.y = -this._bitmapHeight;
			}
			else{
				this._resistSprite.x = this._bitmapWidth /2;
            	this._resistSprite.y = this._bitmapHeight;
			}
            this._resistSprite.x += param.ratePositionX;
            this._resistSprite.y += param.ratePositionY;

            // 文字描画
			this._resistBitmap.fontSize = param.rateFontSize;

            this._resistBitmap.clear();
            this._resistBitmap.drawText(
                this._resistText,
                0,
                0,
                this._resistBitmap.width,
                this._resistBitmap.height,
                "center"
            );
        }
    };

	Sprite_Enemy.prototype.updateResistBitmap = function() {
		if (!this._resistBitmap || !this._resistText) return;

		const bitmap = this._resistBitmap;
		bitmap.clear();

		bitmap.fontSize = param.rateFontSize || 20;
		const text = this._resistText;

		// 文字色設定
		let color = param.colorToUnknown;
		switch ($gameTemp.rateDisplayColor) {
			case 1: color = param.colorToOver; break;
			case 2: color = param.colorToNormal; break;
			case 3: color = param.colorToUnder; break;
			case 4: color = param.colorToBlock; break;
		}
		bitmap.textColor = color;

		// 文字描画
		bitmap.drawText(text, 0, 0, bitmap.width, bitmap.height, "center");
	};
})();
