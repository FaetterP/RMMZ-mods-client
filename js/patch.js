const fs = require('fs');
const { memfs, diff } = require('./js/packages');
const path = require('path');
const fsWrapper = require('./js/fs_wrapper');

const dataDir = "./data";
const modsDir = "./mods";
const finalDir = "./data";

if (!fs.existsSync(finalDir)) {
    fs.mkdirSync(finalDir);
}

async function processMods() {
    const dataFiles = fs.readdirSync(dataDir);
    const modDirs = fs.readdirSync(modsDir);
    if (modDirs.length === 0) {
        addLog("No mods detected")
    }
    else {
        addLog(`Detected mods: ${modDirs.join(" | ")}`);
    }

    for (const modDirName of modDirs) {
        addLog(`[${modDirName}] Start processing mod`);
        const modDirPath = path.join(modsDir, modDirName);
        let patchApplied = false;

        for (const filename of dataFiles) {
            if (!filename.endsWith(".json")) continue;

            const originalFilePath = path.join(dataDir, filename);
            let originalData = JSON.stringify(JSON.parse(fs.readFileSync(originalFilePath, 'utf-8')), null, 2);

            const finalFilePath = path.join(finalDir, filename);
            let finalData = JSON.stringify(JSON.parse(fsWrapper.readFileSync(finalFilePath, 'utf-8')), null, 2);
            const modFilePath = path.join(modDirPath, "data", filename);

            if (fs.existsSync(modFilePath)) {
                addLog(`[${modDirName}] Updating ${filename.replace(/\.[^.]*$/, '')}`);
                const modData = JSON.stringify(JSON.parse(fs.readFileSync(modFilePath, 'utf-8')), null, 2);

                const patch = diff.createPatch(filename, JSON.parse(JSON.stringify(originalData)), modData);

                const patchedData = diff.applyPatch(finalData, patch);
                if (patchedData === false) {
                    addLog(`[${modDirName}] Failed to apply changes from ${filename.replace(/\.[^.]*$/, '')}`, "error");
                } else {
                    finalData = patchedData;
                    patchApplied = true;

                    const folderPath = path.dirname(finalFilePath);
                    if (!memfs.existsSync(folderPath)) {
                        memfs.mkdirSync(folderPath, { recursive: true });
                    }
                    memfs.writeFileSync(finalFilePath, finalData, 'utf-8');
                    addLog(`[${modDirName}] File ${filename.replace(/\.[^.]*$/, '')} successfully modified`);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 0));
        }

        if (patchApplied) {
            addLog(`[${modDirName}] Mod successfully applied`, "success");
        }
    }
}

processMods().then(() => {
    addLog("Launch game")

    require = ((originalRequire) => {
        return (module) => module === "fs" ? require("./js/fs_wrapper") : originalRequire(module);
    })(require);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "js/main.js";
    script._url = "js/main.js";
    document.body.appendChild(script);
}).catch(error => { console.log(error); addLog(`Error processing mods: ${error}`, "error") });
