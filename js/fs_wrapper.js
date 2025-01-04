const { memfs } = require('./packages');
const realFs = require('fs');
const path = require('path');

function readFileSync(filepath, options) {
    console.log({ path: filepath })
    try {
        console.log({ filepath, options })
        return memfs.readFileSync(filepath, options);
    } catch (err) {
        if (err.code === 'ENOENT') {
            const content = realFs.readFileSync(filepath, options);

            if (options?.isNeedCache) {
                const folderPath = path.dirname(filepath);

                if (!memfs.existsSync(folderPath)) {
                    memfs.mkdirSync(folderPath, { recursive: true });
                }
                memfs.writeFileSync(filepath, content, options);
            }
            return content;
        } else {
            throw err;
        }
    }
}

module.exports = {
    ...realFs,
    readFileSync,
};
