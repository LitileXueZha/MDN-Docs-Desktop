const path = require('path');
const fs = require('fs/promises');
const rollup = require('rollup');
const asar = require('asar');
const loadConfigFile = require('rollup/dist/loadConfigFile.js');
const log = require('./log.js');

class Builder {
    constructor() {}

    async run() {
        // Production build
        process.env.NODE_ENV = 'production';

        await Builder.rmrf('dist');
        const rollc = await loadConfigFile(path.resolve(__dirname, '../rollup.config.js'));

        rollc.warnings.flush();
        for (const option of rollc.options) {
            const START = Date.now();
            const bundle = await rollup.rollup(option);
            const info = await Promise.all(option.output.map(bundle.write));
            await bundle.close();

            const id = Object.values(option.input)[0].indexOf('electron') > -1 ? 'ELECTRON' : 'JS';
            log(Date.now() - START, 'build %c %c files', id, info[0].output.length);
        }

        const { makeCSS, makeHTML } = require('./make-utils.js');
        const { cssCompileOptions, htmlCompileOptions } = require('./compileOptions.js');

        await fs.mkdir('dist/css', { recursive: true });
        await makeCSS(cssCompileOptions);
        await makeHTML(htmlCompileOptions);
        await this.pack();
    }

    async pack() {
        const START = Date.now();
        await Promise.all([
            Builder.cp('assets', 'dist/assets'),
            fs.copyFile('main.js', 'dist/main.js'),
            fs.copyFile('package.json', 'dist/package.json'),
        ]);
        await asar.createPackage('dist', 'dist/app.asar');
        log(Date.now() - START, 'packed %c', 'dist/app.asar');
    }

    static async rmrf(dir) {
        await fs.rm(dir, { recursive: true, force: true });
        await fs.mkdir(dir);
    }

    static async cp(dir, dest) {
        const files = await fs.readdir(dir, { withFileTypes: true });
        const copyTo = (fDirent) => {
            const src = path.join(dir, fDirent.name);
            const destination = path.join(dest, fDirent.name);
            if (fDirent.isDirectory()) {
                return Builder.cp(src, destination);
            }
            return fs.copyFile(src, destination);
        }

        await fs.mkdir(dest, { recursive: true });
        await Promise.all(files.map(copyTo));
    }
}

new Builder().run();
