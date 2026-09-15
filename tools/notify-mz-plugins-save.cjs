const { execFile } = require("node:child_process");

const appBundleId = "jp.co.kadokawa.rpgmz";
const appleScript = [
    `tell application id "${appBundleId}" to activate`,
    "display alert \"plugins.js が更新されました\" " +
        "message \"RPGツクールMZでプラグイン設定を続ける前に、プロジェクトを開き直してください。開き直す前にMZで保存すると、VS Codeの変更が上書きされる可能性があります。\" " +
        "as warning buttons {\"OK\"} default button \"OK\""
];

if (process.argv.includes("--dry-run")) {
    console.log(appleScript.join("\n"));
    process.exit(0);
}

execFile("/usr/bin/pgrep", ["-x", "RPGMZ"], error => {
    if (error) {
        process.exit(0);
    }

    const args = appleScript.flatMap(line => ["-e", line]);
    execFile("/usr/bin/osascript", args, notifyError => {
        if (notifyError) {
            console.error(`MZ notification failed: ${notifyError.message}`);
            process.exitCode = 1;
        }
    });
});