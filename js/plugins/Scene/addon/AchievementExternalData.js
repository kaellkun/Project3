/*:
 * @target MZ
 * @plugindesc 実績とカテゴリを外部JSONファイルから読み込みます。(v1.0.0)
 * @author Project3
 * @base Scene/TorigoyaMZ_Achievement2
 * @orderAfter Scene/TorigoyaMZ_Achievement2
 * @orderAfter Scene/addon/TorigoyaMZ_Achievement2_AddonCategory
 *
 * @param DataFile
 * @text 実績データファイル
 * @desc data/ 以下のJSONファイル名。実績の内容はこのファイルで編集します。
 * @type string
 * @default Achievements.json
 *
 * @help
 * 実績プラグイン本体とカテゴリ設定アドオンより下に配置してください。
 * カテゴリアドオンなしでも実績データを読み込めます。
 *
 * data/Achievements.json をUTF-8のテキストとして編集してください。
 * 本体の「実績情報の登録」は外部データで置き換わります。
 * ポップアップ・保存先など、本体のその他の設定は変更しません。
 *
 * 最小形式:
 * {"achievements":[{"key":"first_step","title":"冒険の始まり"}]}
 *
 * 必須: key（重複しない管理ID）, title（表示名）
 * 任意: description, hint, icon, category, isSecret, note,
 *       revealSwitchId, revealVariableId, revealThreshold, $comment
 * description / hint / note は文字列、または行ごとの文字列配列です。
 * category は初出順に自動登録され、省略時はメモ欄のカテゴリ、
 * それもなければ「その他」になります。カテゴリの設定も置き換わります。
 * 秘密解除は既存本体の仕様（変数 > 閾値 または スイッチON）です。
 * 秘密解除は一覧への表示であり、実績獲得ではありません。
 *
 * 実績獲得は本体のプラグインコマンド「実績の獲得」にkeyを指定します。
 * サンプルは自動獲得せず、ゲームイベントの追加・変更も行いません。
 * JSON内に // コメントは書けません。説明は $comment に記載できます。
 * 編集後はゲームを再起動してください。獲得状況は既存の保存方式を維持し、
 * 同じkeyの実績は獲得済み状態を引き継ぎます。公開後のkey変更に注意。
 *
 * 読込失敗時は通常の読込エラー、書式不正時は対象ファイルと項目を表示して
 * 起動を止めます。空データで続行したり、獲得状況を初期化したりしません。
 * 戦闘・イベントテストでも同じファイルを読み込みます。
 * デプロイ先にも外部JSONを必ず含めてください。
 * 詳細: docs/achievement-external-data.md
 */

(() => {
    'use strict';

    const pluginName = 'AchievementExternalData';
    const achievement = window.Torigoya && window.Torigoya.Achievement2;
    if (!achievement || !achievement.Manager) {
        throw new Error(`${pluginName}: 実績プラグイン本体より下に配置してください。`);
    }

    const file = String(PluginManager.parameters(pluginName).DataFile || 'Achievements.json').trim();
    if (!file.endsWith('.json') || /[\\:?#<>]/.test(file) ||
        file.split('/').some(part => !part || part === '.' || part === '..')) {
        throw new Error(`${pluginName}: DataFileにはdata/以下の相対JSONファイル名を指定してください。`);
    }

    const dataName = '$dataAchievementExternal';
    let loadError = null;
    let applied = false;

    function invalid(location, message) {
        throw new Error(`${location}: ${message}`);
    }

    function object(value, location) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            invalid(location, 'オブジェクトを指定してください。');
        }
    }

    function text(value, location, fallback = '', multiline = false) {
        if (value === undefined) return fallback;
        if (multiline && Array.isArray(value) && value.every(line => typeof line === 'string')) {
            return value.join('\n');
        }
        if (typeof value !== 'string') invalid(location, '文字列を指定してください。');
        return value;
    }

    function integer(value, location) {
        if (value === undefined) return 0;
        if (!Number.isSafeInteger(value) || value < 0) {
            invalid(location, '0以上の整数を指定してください。');
        }
        return value;
    }

    function normalize(data) {
        object(data, 'ルート');
        if (!Array.isArray(data.achievements)) invalid('achievements', '実績の配列が必要です。');
        const allowed = new Set([
            'key', 'title', 'description', 'hint', 'icon', 'category', 'isSecret',
            'note', 'revealSwitchId', 'revealVariableId', 'revealThreshold', '$comment'
        ]);
        const keys = new Set();
        const categories = new Set();
        const achievements = data.achievements.map((entry, index) => {
            const location = `achievements[${index}]（${index + 1}件目）`;
            object(entry, location);
            for (const field of Object.keys(entry)) {
                if (!allowed.has(field)) invalid(`${location}.${field}`, '未対応の項目です。');
            }
            const key = text(entry.key, `${location}.key`).trim();
            if (!key) invalid(`${location}.key`, '空でない管理IDが必要です。');
            if (keys.has(key)) invalid(`${location}.key`, `管理ID「${key}」が重複しています。`);
            keys.add(key);
            const title = text(entry.title, `${location}.title`).trim();
            if (!title) invalid(`${location}.title`, '空でない表示名が必要です。');
            if (entry.isSecret !== undefined && typeof entry.isSecret !== 'boolean') {
                invalid(`${location}.isSecret`, 'true または false を指定してください。');
            }

            const result = {
                key,
                title,
                description: text(entry.description, `${location}.description`, '', true),
                hint: text(entry.hint, `${location}.hint`, '', true),
                icon: integer(entry.icon, `${location}.icon`),
                isSecret: entry.isSecret === true,
                revealSwitchId: integer(entry.revealSwitchId, `${location}.revealSwitchId`),
                revealVariableId: integer(entry.revealVariableId, `${location}.revealVariableId`),
                revealThreshold: integer(entry.revealThreshold, `${location}.revealThreshold`),
                note: text(entry.note, `${location}.note`, '', true)
            };
            DataManager.extractMetadata(result);
            const noteCategory = result.meta['カテゴリー'] || result.meta['カテゴリ'] || result.meta.Category;
            const category = text(entry.category === undefined ? noteCategory : entry.category,
                `${location}.category`, 'その他').trim() || 'その他';
            if (/[<>\r\n]/.test(category)) invalid(`${location}.category`, '< > や改行は使用できません。');
            // 本体のsetAchievementsによるメタデータ再生成後もカテゴリを保持する。
            // カテゴリアドオンが最優先する「カテゴリー」タグで明示指定を反映する。
            result.note += `\n<カテゴリー:${category}>`;
            categories.add(category);
            return result;
        });
        // 0件でもカテゴリウィンドウの列数が0にならないようにする。
        if (!categories.size) categories.add('その他');
        return { achievements, categories: Array.from(categories, name => ({ name, prefix: '' })) };
    }

    // 標準のXHR・キャッシュ対策・リトライを利用する。
    // _databaseFilesには加えず、テスト時のTest_接頭辞を避ける。
    const upstreamLoadDatabase = DataManager.loadDatabase;
    DataManager.loadDatabase = function() {
        loadError = null;
        applied = false;
        window[dataName] = null;
        upstreamLoadDatabase.apply(this, arguments);
        this.loadDataFile(dataName, file);
    };

    const upstreamOnXhrLoad = DataManager.onXhrLoad;
    DataManager.onXhrLoad = function(xhr, name, src, url) {
        if (name !== dataName) return upstreamOnXhrLoad.apply(this, arguments);
        if (xhr.status >= 400) return this.onXhrError(name, src, url);
        try {
            const data = JSON.parse(xhr.responseText.replace(/^\uFEFF/, ''));
            window[dataName] = normalize(data);
            loadError = null;
        } catch (error) {
            window[dataName] = null;
            loadError = new Error(`${pluginName}: data/${file}\n${error.message}`);
        }
    };

    const upstreamIsDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        // 非同期コールバックでthrowせず、起動ループでMZのエラー画面に渡す。
        if (loadError) throw loadError;
        if (!upstreamIsDatabaseLoaded.apply(this, arguments) || !window[dataName]) return false;
        if (!applied) {
            const data = window[dataName];
            achievement.parameter.baseAchievementData = data.achievements;
            const category = achievement.Addons && achievement.Addons.Category;
            if (category) category.parameter.categories = data.categories;
            applied = true;
        }
        // この後で本体のonDatabaseLoaded -> Manager.initが呼ばれる。
        // 本体の獲得状況読込・保存処理には手を加えない。
        return true;
    };
})();