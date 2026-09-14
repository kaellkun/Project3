//=============================================================================
// RPG Maker MZ - MapTypeCommonEvent v2.0.0
// Released under the MIT license.
//=============================================================================

/*:
 * @target MZ
 * @plugindesc マップ種別の入場コモン・昼夜フィルター・特殊シンボル撃破による夜を管理。(v2.0.0)
 * @author Project3
 * @orderAfter Keke_TimingCommon
 * @orderAfter LN_FilmicFilter
 * @orderAfter HUG/LN_FilmicFilter
 *
 * @param Rules
 * @text マップ種別の設定
 * @desc 種別ごとの入場コモン・昼夜フィルター・夜の影響除外をまとめて設定します。
 * @type struct<MapTypeRule>[]
 * @default ["{\"MapType\":\"街\",\"CommonEventId\":\"0\",\"DayFilter\":\"-2\",\"NightFilter\":\"-2\",\"ExcludeNight\":\"false\"}","{\"MapType\":\"ワールドマップ\",\"CommonEventId\":\"0\",\"DayFilter\":\"-2\",\"NightFilter\":\"-2\",\"ExcludeNight\":\"false\"}","{\"MapType\":\"ダンジョン\",\"CommonEventId\":\"0\",\"DayFilter\":\"-2\",\"NightFilter\":\"-2\",\"ExcludeNight\":\"false\"}","{\"MapType\":\"屋内\",\"CommonEventId\":\"0\",\"DayFilter\":\"-2\",\"NightFilter\":\"-2\",\"ExcludeNight\":\"true\"}"]
 *
 * @param OnlyTypeChange
 * @text 種別が変わるときだけ実行
 * @desc ONなら「街→街」など、同じ種別の別マップへの移動では実行しません。
 * @type boolean
 * @on 種別が変わるときだけ
 * @off 別マップへの入場ごと
 * @default false
 *
 * @param RunOnNewGame
 * @text ニューゲーム開始マップでも実行
 * @desc ONなら初期マップへの入場も対象にします。ロードだけでは新規発動しません。
 * @type boolean
 * @default false
 *
 * @param FilterEnabled
 * @text 昼夜フィルター連携
 * @desc LN_FilmicFilter導入時のみ使用できます。OFFならフィルターを一切変更しません。
 * @type boolean
 * @default true
 *
 * @param DefaultDayFilter
 * @text 昼の標準フィルター番号
 * @desc -2:マップのFilmicFilterタグ（なければ0）、-1:フィルターなし、0以上:実在の番号。
 * @type number
 * @min -2
 * @default -2
 *
 * @param DefaultNightFilter
 * @text 夜の標準フィルター番号
 * @desc -2:昼と同じ、-1:フィルターなし、0以上:実在の夜用番号。プロジェクトの夜の村は5。
 * @type number
 * @min -2
 * @default -2
 *
 * @param KillsPerNight
 * @text 夜になるまでの基本撃破数
 * @desc 昼に何回「撃破を記録」すると夜になるか。初期値3。1以上。
 * @type number
 * @min 1
 * @default 3
 *
 * @param InitialTime
 * @text ゲーム開始時の時間帯
 * @desc ニューゲームの昼夜。夜開始でも到来回数は0、夜コモンは発動しません。保存済みの状態を優先。
 * @type select
 * @option 昼
 * @value day
 * @option 夜
 * @value night
 * @default day
 *
 * @param NightStep
 * @text 夜の到来ごとの必要数増減
 * @desc 基本撃破数＋夜の到来回数×この値。0なら毎回同じ。負数で減少。最低1。
 * @type number
 * @min -999999
 * @default 0
 *
 * @param NightThresholds
 * @text 夜ごとの必要数リスト（任意）
 * @desc 例:3,5,7なら1回目3・2回目5・以後7。増減式より優先。空欄なら増減式。
 * @type string
 * @default
 *
 * @param ThresholdVariable
 * @text 必要数を指定する変数（任意）
 * @desc 正の整数なら最優先。0以下ならリスト/増減式。判定は撃破記録時。未指定なら不要。
 * @type variable
 * @default 0
 *
 * @param MaxThreshold
 * @text 必要撃破数の上限（任意）
 * @desc 増減式・リスト・変数のすべてに適用。0なら上限なし。
 * @type number
 * @default 0
 *
 * @param NightCommonEvent
 * @text 夜になったときのコモン
 * @desc 昼→夜で1回予約。トリガーは「なし」。0なら何もしません。
 * @type common_event
 * @default 0
 *
 * @param MorningCommonEvent
 * @text 朝になったときのコモン
 * @desc 夜→昼で1回予約。トリガーは「なし」。0なら何もしません。
 * @type common_event
 * @default 0
 *
 * @param NightSwitch
 * @text 夜状態の出力スイッチ（任意）
 * @desc 屋内でも夜ならON。出力専用です。昼夜の変更は本プラグインのコマンドで行います。
 * @type switch
 * @default 0
 *
 * @command RecordDefeat
 * @text 特殊シンボルの撃破を記録
 * @desc 必ず「戦闘の処理→勝ったとき」に配置。敗北・逃走は記録しません。初期値1。
 * @arg Amount
 * @text 加算数
 * @desc ボスを2回分にする場合などに変更。夜中は累計のみ加算。昼は今回の進捗にも加算。
 * @type number
 * @min 1
 * @default 1
 *
 * @command Morning
 * @text 朝にする（宿泊など）
 * @desc 昼へ戻し、今回の撃破進捗を0にします。累計撃破数と夜の到来回数は保持します。
 *
 * @command StartNight
 * @text 夜にする（強制）
 * @desc 昼→夜なら到来回数を1加算。すでに夜なら何もしません。夜コモンも予約します。
 *
 * @command SetProgress
 * @text 今回の撃破進捗を変更
 * @desc 昼の進捗を指定値にします。累計・到来回数は変更せず、自動で夜にもなりません。
 * @arg Value
 * @text 進捗
 * @type number
 * @default 0
 *
 * @command GetState
 * @text 現在の数値を変数へ取得
 * @desc 選択した変数だけに現在値を書き込みます。未選択なら何も変更しません。
 * @arg TotalVariable
 * @text 累計撃破数の格納先
 * @type variable
 * @default 0
 * @arg ProgressVariable
 * @text 今回の撃破進捗の格納先
 * @type variable
 * @default 0
 * @arg NightsVariable
 * @text 夜の到来回数の格納先
 * @type variable
 * @default 0
 * @arg RequiredVariable
 * @text 次の夜の必要撃破数の格納先
 * @type variable
 * @default 0
 * @arg RemainingVariable
 * @text あと何回で夜かの格納先
 * @type variable
 * @default 0
 *
 * @command RefreshFilter
 * @text 種別・昼夜フィルターを再適用
 * @desc 一時的な手動フィルター演出から、現在のマップ種別と昼夜の設定へ戻します。
 *
 * @help
 * 【最短の設定：3回倒すと夜、屋内は暗くしない】
 * 1. LN_FilmicFilter、Keke_TimingCommon、本プラグインの順にON。
 * 2. 屋外のマップのメモに <マップ種別:街> などを記入。
 *    建物は <マップ種別:屋内> と記入。
 * 3. 「夜の標準フィルター番号」に実在する夜用番号を設定。
 *    このプロジェクトは5（夜の村）。種別設定の街の昼は1、屋内の昼は4。
 * 4. 特殊シンボルのイベントの「戦闘の処理」の「勝ったとき」に
 *    「特殊シンボルの撃破を記録」を置く。逃走可能・敗北可能が両方OFFで
 *    勝利分岐がない場合は「戦闘の処理」の直後に置く。
 *    通常の敵や逃走・敗北分岐には置かない。敵の数ではなく勝利1回を数える。
 * 5. 宿泊イベントなどに「朝にする」を置く。
 * 基本撃破数3のままで、昼に3勝→夜→宿泊→再び昼に3勝→次の夜、となります。
 * 勝利コマンドを置くだけでよく、スイッチ・変数の割当は必須ではありません。
 * 本プラグインは勝利を自動検出しません。同じ勝利でコマンドを2回呼ぶと2回分です。
 *
 * ■ 昼夜とフィルター
 * 種別設定で「昼の番号」「夜の番号」を設定。-2は標準設定を継承します。
 * 昼の優先順：種別の昼 → 昼の標準 → マップの<FilmicFilter:番号> → 0。
 * 夜の優先順：種別の夜 → 夜の標準 → そのマップの昼。
 * -1はフィルター無効、0は番号0のフィルター（無効ではありません）。
 * 「夜の影響を除外」がONなら夜も昼用を使用。屋内は初期設定でONです。
 * <屋内> を追記するだけでも、種別を変えずに夜の影響を除外できます。
 * 例：<マップ種別:街><屋内> は街として入場判定し、見た目は街の昼用。
 * 店専用の見た目なら種別「屋内」や独自の「店」を登録して昼の番号を指定。
 * 屋内でも世界は夜のまま。外へ出ると夜用に戻り、朝にはなりません。
 * タグなしマップにも昼夜の標準を適用。洞窟などは除外設定を明示してください。
 * <昼夜フィルター無効> のマップは本プラグインではフィルターに触れません。
 * 移動先の設定はマップ読込時、ロード時も再適用。昼夜変更時も反映します。
 * 切替は瞬時です。毎フレーム上書きしないため、手動の演出も可能です。
 * 手動フィルターは次のマップ開始・昼夜変更・再適用コマンドまで維持します。
 * 戦闘中には再適用せず、マップ復帰時に反映します。
 * 実在しないフィルター番号はLN本体のエラーになります。番号を確認してください。
 *
 * ■ 撃破数と夜の回数の計算
 * 「累計撃破数」：夜も含め、記録した加算数の合計。朝になっても維持。
 * 「今回の撃破進捗」：朝から昼の間に記録した加算数。
 * 「夜の到来回数」：昼→夜に切り替わった回数。屋内移動・ロードでは増えません。
 * 必要数 = 基本撃破数 + 夜の到来回数 × 必要数増減（最低1）。
 * 例：基本3、増減2なら、各昼に3、5、7、9…回が必要。
 * 個別指定したい場合はリストに3,5,7と設定（最後の7を以後繰り返す）。
 * 指定変数が正の整数なら最優先。必要数上限は最後に適用します。
 * 必要数は各「撃破を記録」時に再計算します。変数変更だけでは夜になりません。
 * 昼に必要数以上になると1度だけ夜へ。余剰分は今回の進捗から消費されます。
 * 例：必要3で一度に加算10 → 累計10、進捗0、夜到来1。3夜分にはしません。
 * 夜中の撃破は累計だけ増え、次の昼には繰り越しません。
 * 夜明けは自動ではありません。宿泊・物語イベントで「朝にする」を実行。
 * 「朝にする」は昼でも進捗0にします。累計と夜到来回数は減らしません。
 * 「夜にする」は強制イベント用。すでに夜なら到来回数は増えません。
 * 必要に応じて「今回の撃破進捗を変更」で調整し、次の撃破時に判定できます。
 * ■ ゲーム開始時の時間帯
 * 「ゲーム開始時の時間帯」で昼/夜を選択。初期値は昼、全カウントは0です。
 * 夜開始でも夜の到来回数は0で、夜到来コモンは予約しません。
 * 最初のマップから夜用フィルター・夜状態スイッチを適用（屋内は昼用）。
 * 夜開始後に朝にすれば、初回の必要数で次の夜を迎えます。
 * 昼夜状態を保存済みのセーブでは、開始設定を変更しても保存された状態を優先。
 * 導入前など昼夜状態のない旧セーブだけは、この開始設定で初期化します。
 * 開始直後の演出は、必要に応じてニューゲーム用コモンなどで設定してください。
 *
 * ■ イベントへの利用
 * 「現在の数値を変数へ取得」で必要な値だけ取り出せます。
 * 例：「あと何回で夜か」を変数に入れ、文章で「あと\\V[1]回」と表示。
 * 夜中の残り回数は0。必要撃破数の取得は次の昼に適用される値です。
 * 夜状態の出力スイッチは必要なときだけ指定。出力専用で、直接変更しないこと。
 * 夜/朝のコモンは「なし」トリガーで作成。任意で演出を設定できます。
 * すでに実行中のイベントやタイミングコモンを中断せず、予約として実行します。
 * タイミングコモンの全勝利コモンに「撃破を記録」を置くと通常戦闘も数えるので注意。
 *
 * ■ 設定
 * マップの設定画面の「メモ」に、次のいずれかを記入してください。
 *   <マップ種別:街>
 *   <マップ種別:ワールドマップ>
 *   <マップ種別:ダンジョン>
 * <MapType:街> も使用できます。両方ある場合は「マップ種別」が優先です。
 * 1マップに1種別を指定してください。種別名は任意の文字列で追加できます。
 * 前後の空白は無視し、名前は完全一致（英字の大文字小文字も区別）です。
 * 同種別の複数登録ではコモンは全件実行し、フィルター設定は先頭の1件を使います。
 *
 * 「マップ種別の設定」の「街」に実行したい入場コモンを指定します。
 * コモンイベントのトリガーは「なし」にしてください。
 * 街だけで実行するなら、他の種別のコモンは0（なし）のままで構いません。
 * 同じ種別を複数登録すると、登録順に実行します。
 *
 * ■ 入場の判定
 * 場所移動でマップIDが変わったときだけ判定します。
 * 同一マップ内の場所移動、メニュー/戦闘からの復帰、ロード、
 * マップの再読込だけでは新しく発動しません。
 * ニューゲームは初期設定では対象外です（設定で変更可能）。
 *
 * 街の屋内にも「街」を指定して「種別が変わるときだけ実行」をONにすると、
 * 街→店→街では発動せず、ワールドマップ→街では発動します。
 * この設定では街A→街Bも発動しません。
 * タグなしマップは種別なしとして扱います。
 *
 * ■ Keke_TimingCommon v1.3.8との併用
 * プラグイン管理では、Keke_TimingCommonより下に配置してください。
 * 本プラグインは単独でも動作し、タイミングコモンの設定を変更しません。
 * タイミングコモンとその終了後の処理が完了するまで、開始を待ちます。
 * 通常のマップインタープリターで実行するため、文章表示やウェイトも可能です。
 * 実行中の通常イベントは中断せず、終了後に実行します。
 * 既存の予約コモンを優先し、その後、通常の自動実行イベントより先に開始します。
 * 並列処理イベントは通常どおり動作します。
 *
 * 「場所移動-後」に同じコモンを指定すると、両プラグインで2回実行されます。
 * 街限定の処理は本プラグインだけに登録してください。
 * タイミングコモンの「全無効」は本プラグインには影響しません。
 * 入場コモンの開始前に別マップへ移動した場合、古い入場予約は破棄します。
 * 入場コモン内での場所移動も次の入場として判定するため、移動ループに注意。
 *
 * 入場予約はセーブされます。オートセーブ等をロードしたときは、
 * 保存時点で未実行だった予約を再開します（ロードによる新規発動ではありません）。
 * 既存セーブでも使用できます。導入後はゲームを再起動してください。
 * 詳細: docs/map-type-common-event.md
 */

/*~struct~MapTypeRule:
 * @param MapType
 * @text マップ種別
 * @desc メモ欄に記入する種別名。例: 街、ワールドマップ、ダンジョン
 * @type string
 * @default 街
 *
 * @param CommonEventId
 * @text コモンイベント
 * @desc この種別のマップへの入場時に実行します。0（なし）は無効です。
 * @type common_event
 * @default 0
 *
 * @param DayFilter
 * @text 昼のフィルター番号
 * @desc -2:昼の標準を継承、-1:フィルターなし、0以上:実在の番号。
 * @type number
 * @min -2
 * @default -2
 *
 * @param NightFilter
 * @text 夜のフィルター番号
 * @desc -2:夜の標準を継承、-1:フィルターなし、0以上:実在の番号。夜除外時は使用しません。
 * @type number
 * @min -2
 * @default -2
 *
 * @param ExcludeNight
 * @text 夜の影響を除外
 * @desc ONなら世界が夜でも昼用フィルターを使用。屋内・洞窟向け。世界の昼夜は変えません。
 * @type boolean
 * @default false
 */

(() => {
    'use strict';

    const pluginName = 'MapTypeCommonEvent';
    const parameters = PluginManager.parameters(pluginName);
    const onlyTypeChange = parameters.OnlyTypeChange === 'true';
    const runOnNewGame = parameters.RunOnNewGame === 'true';
    const initialTime = parameters.InitialTime || 'day';
    if (!['day', 'night'].includes(initialTime)) {
        throw new Error(`${pluginName}: ゲーム開始時の時間帯は昼(day)か夜(night)を指定してください。`);
    }

    function integer(value, fallback, min, label) {
        const result = value === undefined || value === '' ? fallback : Number(value);
        if (!Number.isSafeInteger(result) || result < min) {
            throw new Error(`${pluginName}: ${label}は${min}以上の整数を指定してください。`);
        }
        return result;
    }
    const filterEnabled = parameters.FilterEnabled !== 'false';
    const dayFilter = integer(parameters.DefaultDayFilter, -2, -2, '昼の標準番号');
    const nightFilter = integer(parameters.DefaultNightFilter, -2, -2, '夜の標準番号');
    const baseKills = integer(parameters.KillsPerNight, 3, 1, '基本撃破数');
    const nightStep = integer(parameters.NightStep, 0, -999999, '必要数増減');
    const maxThreshold = integer(parameters.MaxThreshold, 0, 0, '必要数上限');
    const thresholdVariable = integer(parameters.ThresholdVariable, 0, 0, '必要数変数');
    const nightSwitch = integer(parameters.NightSwitch, 0, 0, '夜状態スイッチ');
    const nightCommon = integer(parameters.NightCommonEvent, 0, 0, '夜コモン');
    const morningCommon = integer(parameters.MorningCommonEvent, 0, 0, '朝コモン');
    const thresholds = String(parameters.NightThresholds || '').trim();
    const thresholdList = thresholds ? thresholds.split(/[,、，]/)
        .map(value => integer(value.trim(), 0, 1, '夜ごとの必要数リスト')) : [];
    let rules;
    try {
        const entries = JSON.parse(parameters.Rules || '[]');
        if (!Array.isArray(entries)) throw new Error('リストを指定してください。');
        rules = entries.map((entry, index) => {
            const rule = typeof entry === 'string' ? JSON.parse(entry) : entry;
            if (!rule || typeof rule.MapType !== 'string' || !rule.MapType.trim()) {
                throw new Error(`${index + 1}件目のマップ種別が空、または不正です。`);
            }
            const commonEventId = Number(rule.CommonEventId || 0);
            if (!Number.isSafeInteger(commonEventId) || commonEventId < 0) {
                throw new Error(`${index + 1}件目のコモンイベントIDが不正です。`);
            }
            return {
                mapType: rule.MapType.trim(), commonEventId,
                dayFilter: integer(rule.DayFilter, -2, -2, '種別の昼番号'),
                nightFilter: integer(rule.NightFilter, -2, -2, '種別の夜番号'),
                excludeNight: rule.ExcludeNight === undefined ? rule.MapType.trim() === '屋内' :
                    rule.ExcludeNight === 'true' || rule.ExcludeNight === true
            };
        });
    } catch (error) {
        throw new Error(`${pluginName}:「種別ごとのコモンイベント」の設定を確認してください。\n${error.message}`);
    }

    function currentMapType() {
        const meta = $dataMap && $dataMap.meta;
        if (!meta) return '';
        const value = meta['マップ種別'] !== undefined ? meta['マップ種別'] : meta.MapType;
        return typeof value === 'string' ? value.trim() : '';
    }

    // 状態はGame_Systemだけが正本。出力スイッチ・取得先変数からの逆同期はしない。
    function state() {
        if (!$gameSystem._mapTypeDayNight) {
            $gameSystem._mapTypeDayNight = { night: initialTime === 'night', total: 0, progress: 0, nights: 0 };
        }
        return $gameSystem._mapTypeDayNight;
    }

    function requiredKills() {
        const s = state();
        let result = thresholdList.length ? thresholdList[Math.min(s.nights, thresholdList.length - 1)] :
            Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, baseKills + s.nights * nightStep));
        const variable = thresholdVariable ? $gameVariables.value(thresholdVariable) : 0;
        if (Number.isSafeInteger(variable) && variable > 0) result = variable;
        return maxThreshold > 0 ? Math.min(result, maxThreshold) : result;
    }

    function syncNightSwitch() {
        if (nightSwitch) $gameSwitches.setValue(nightSwitch, state().night);
    }

    function reserveTransitionCommon(id) {
        if (!id) return;
        const common = $dataCommonEvents[id];
        if (common && Array.isArray(common.list)) $gameTemp.reserveCommonEvent(id);
        else console.warn(`${pluginName}: コモンイベント ${id} が存在しません。`);
    }

    function filterIdForMap() {
        const meta = $dataMap.meta || {};
        // 同種別の複数登録はコモンのみ全件実行。見た目には先頭の設定を使用。
        const rule = rules.find(entry => entry.mapType === currentMapType());
        const mapDefault = meta.FilmicFilter === 'none' ? -1 :
            integer(meta.FilmicFilter, 0, -1, 'マップのFilmicFilter');
        let day = rule && rule.dayFilter !== -2 ? rule.dayFilter : dayFilter;
        if (day === -2) day = mapDefault;
        const indoors = meta['屋内'] !== undefined || (rule ? rule.excludeNight : currentMapType() === '屋内');
        if (!state().night || indoors) return day;
        const night = rule && rule.nightFilter !== -2 ? rule.nightFilter : nightFilter;
        return night === -2 ? day : night;
    }

    function applyFilter() {
        if (!filterEnabled || !$dataMap || !$gameScreen || !$gameScreen._lnFilmicFilter ||
            ($dataMap.meta && $dataMap.meta['昼夜フィルター無効'] !== undefined)) return;
        const id = filterIdForMap();
        // LN v1.1.1はプラグインの配置フォルダに関係なくこの名前でコマンド登録する。
        // waitには文字列"false"ではなくbooleanを渡す。durationもnumberで指定。
        // LN側は正のID指定でenabledを戻さないので、無効→有効の復帰はここで補う。
        const control = $gameScreen._lnFilmicFilter;
        PluginManager.callCommand(new Game_Interpreter(), 'LN_FilmicFilter', 'SetFilmicFilter',
            { filterId: id, duration: 0, wait: false });
        control.enabled = id >= 0;
    }

    function refreshCurrentMapFilter() {
        // 転送待ちには$dataMapが移動先の場合がある。次のsetup/startで反映する。
        if (SceneManager._scene instanceof Scene_Map && !$gameParty.inBattle() &&
            !$gamePlayer.isTransferring() && !SceneManager.isSceneChanging()) applyFilter();
    }

    function startNight() {
        const s = state();
        if (s.night) return;
        s.night = true;
        s.nights = Math.min(Number.MAX_SAFE_INTEGER, s.nights + 1);
        s.progress = 0;
        syncNightSwitch();
        reserveTransitionCommon(nightCommon);
        refreshCurrentMapFilter();
    }

    PluginManager.registerCommand(pluginName, 'RecordDefeat', args => {
        const amount = integer(args.Amount, 1, 1, '加算数');
        const s = state();
        s.total = Math.min(Number.MAX_SAFE_INTEGER, s.total + amount);
        if (!s.night) {
            s.progress = Math.min(Number.MAX_SAFE_INTEGER, s.progress + amount);
            if (s.progress >= requiredKills()) startNight();
        }
    });
    PluginManager.registerCommand(pluginName, 'StartNight', startNight);
    PluginManager.registerCommand(pluginName, 'Morning', () => {
        const s = state();
        const wasNight = s.night;
        s.night = false;
        s.progress = 0;
        syncNightSwitch();
        if (wasNight) reserveTransitionCommon(morningCommon);
        refreshCurrentMapFilter();
    });
    PluginManager.registerCommand(pluginName, 'SetProgress', args => {
        const value = integer(args.Value, 0, 0, '今回の撃破進捗');
        if (!state().night) state().progress = value;
    });
    PluginManager.registerCommand(pluginName, 'GetState', args => {
        const s = state();
        const required = requiredKills();
        const values = { TotalVariable: s.total, ProgressVariable: s.progress, NightsVariable: s.nights,
            RequiredVariable: required, RemainingVariable: s.night ? 0 : Math.max(0, required - s.progress) };
        // 書き込み途中のエラーで一部だけ変えないようIDを先に検証。
        const outputs = Object.entries(values).map(([key, value]) =>
            [integer(args[key], 0, 0, '取得先変数'), value]);
        for (const [id, value] of outputs) if (id) $gameVariables.setValue(id, value);
    });
    PluginManager.registerCommand(pluginName, 'RefreshFilter', refreshCurrentMapFilter);

    // performTransfer時の$dataMapは既に移動先。移動元の種別はGame_Mapに保存する。
    const upstreamSetup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        upstreamSetup.apply(this, arguments);
        this._mapTypeCommonEventType = currentMapType();
        syncNightSwitch();
        applyFilter();
    };

    const upstreamStart = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        // 導入前のセーブや、エディタでメモを変更した後のロードにも対応する。
        $gameMap._mapTypeCommonEventType = currentMapType();
        syncNightSwitch();
        applyFilter();
        upstreamStart.apply(this, arguments);
    };

    const upstreamPerformTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        const transferring = this.isTransferring();
        const oldMapId = $gameMap.mapId();
        const oldType = $gameMap._mapTypeCommonEventType || '';
        upstreamPerformTransfer.apply(this, arguments);
        const mapId = $gameMap.mapId();
        if (!transferring || this.isTransferring() || oldMapId === mapId) return;

        // 別の場所移動が先に実行された場合、旧マップの予約を持ち越さない。
        $gameMap._mapTypeCommonEventPending = null;
        const mapType = currentMapType();
        if (oldMapId === 0 && !runOnNewGame) return;
        if (!mapType || (oldMapId > 0 && onlyTypeChange && oldType === mapType)) return;
        const ids = rules.filter(rule => rule.mapType === mapType && rule.commonEventId > 0)
            .map(rule => rule.commonEventId);
        if (ids.length) {
            // 関数やインタープリターを保持せず、標準のセーブで復元できるデータだけを保存。
            $gameMap._mapTypeCommonEventPending = { mapId, ids };
        }
    };

    function timingCommonBusy(map) {
        // 公開APIだけでは終了ハンドラ待ちを検出できないため、その待機状態も確認。
        return ($gameTemp && typeof $gameTemp.inTimingCommonKe === 'function' &&
            $gameTemp.inTimingCommonKe()) || !!map._tCommonHandlerKe ||
            !!(map._tCommonPretersKe && map._tCommonPretersKe.length) ||
            !!map._interpreter._stopByTimingCommonKe;
    }

    function pendingEntry(map) {
        const pending = map._mapTypeCommonEventPending;
        if (pending && pending.mapId === map.mapId() && pending.ids.length) return pending;
        return null;
    }

    const upstreamSetupStartingEvent = Game_Map.prototype.setupStartingEvent;
    Game_Map.prototype.setupStartingEvent = function() {
        const pending = pendingEntry(this);
        if (!pending) return upstreamSetupStartingEvent.apply(this, arguments);
        if (this._interpreter.isRunning() || $gamePlayer.isTransferring() ||
            SceneManager.isSceneChanging() || $gameMessage.isBusy() || timingCommonBusy(this)) {
            return false;
        }
        this.refreshIfNeeded();
        // 標準予約キューは書き換えず、他のプラグインの予約を先に処理する。
        if (this._interpreter.setupReservedCommonEvent()) return true;
        while (pending.ids.length) {
            const id = pending.ids.shift();
            const common = $dataCommonEvents[id];
            if (!common || !Array.isArray(common.list)) {
                console.warn(`${pluginName}: コモンイベント ${id} が存在しません。`);
                continue;
            }
            if (!common.list.some(command => command.code !== 0)) continue;
            if (!pending.ids.length) this._mapTypeCommonEventPending = null;
            this._interpreter.setup(common.list, 0);
            return true;
        }
        this._mapTypeCommonEventPending = null;
        return upstreamSetupStartingEvent.apply(this, arguments);
    };

    const upstreamIsEventRunning = Game_Map.prototype.isEventRunning;
    Game_Map.prototype.isEventRunning = function() {
        // 開始待ちの隙間にメニュー・エンカウント・移動を受け付けない。
        return upstreamIsEventRunning.apply(this, arguments) || !!pendingEntry(this);
    };
})();