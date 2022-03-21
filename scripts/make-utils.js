const fs = require('fs/promises');
const sass = require('sass');
const { minify } = require('html-minifier-terser');
const log = require('./log.js');

const fHandles = new Map();

async function makeHTML(compileOptions) {
    const { input, output, template } = compileOptions;
    let totalBuildFiles = 0;
    if (template && !fHandles.has(template)) {
        // Tepmlate html
        const handle = await fs.open(template, 'r');
        fHandles.set(template, handle);
    }
    const build = async (entryName) => {
        const outputFile = output.file.replace('[name]', entryName);
        let memoHandles = fHandles.get(outputFile);
        if (!memoHandles) {
            const handle = await fs.open(input[entryName], 'r');
            const outHandle = await fs.open(outputFile, 'w');

            memoHandles = {
                chunkId: outputFile,
                handle,
                outHandle,
            };
            fHandles.set(outputFile, memoHandles);
        }

        try {
            const { handle, outHandle } = memoHandles;
            let rawHtml = await readFilebyHandle(handle);
            if (template) {
                const tplHandle = fHandles.get(template);
                const tplStrings = await readFilebyHandle(tplHandle);
                rawHtml = execHTMLTemplate(tplStrings, rawHtml);
            }
            // See https://github.com/terser/html-minifier-terser#options-quick-reference
            const min = await minify(rawHtml, {
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                keepClosingSlash: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
            });

            totalBuildFiles ++;
            await outHandle.truncate(0);
            await outHandle.write(min, 0);
            await outHandle.sync();
        } catch (e) {
            console.error(e);
        }
    };
    const buildTasks = Object.keys(input).map(build);

    const START = Date.now();
    await Promise.all(buildTasks);
    log(Date.now() - START, 'build %c %c modules', 'HTML', totalBuildFiles);
}

const REG_TPL_BLOCK = /(<!-- :(\w+): -->)([^]*)\1/gm;
const REG_TPL_MUSTACHE = /{{(\w+)}}/gm;
function execHTMLTemplate(tpl, rawHtml) {
    const templates = new Map();
    let matches;
    while (matches = REG_TPL_BLOCK.exec(tpl)) {
        const block = matches[2];
        const blockHtml = matches[3];
        templates.set(block, blockHtml);
    }

    const replaceMustache = s => s.replace(REG_TPL_MUSTACHE, (mustache, block) => {
        return templates.get(block) ?? mustache;
    });
    // Replace mustache in template
    templates.forEach((value, key) => {
        templates.set(key, replaceMustache(value));
    });

    return replaceMustache(rawHtml);
}
/**
 * @param {fs.FileHandle} fd
 */
async function readFilebyHandle(fd) {
    const { size } = await fd.stat();
    const buff = Buffer.alloc(size);
    await fd.read(buff, 0, size, 0);
    return buff.toString();
}

async function makeCSS(compileOptions) {
    const { input, output } = compileOptions;
    let totalBuildFiles = 0;
    const build = async (entryName) => {
        const outputFile = output.file.replace('[name]', entryName);
        let memoHandles = fHandles.get(outputFile);
        if (!memoHandles) {
            const handle = await fs.open(outputFile, 'w');
            let mapHandle;
            if (output.sourceMap) {
                mapHandle = await fs.open(`${outputFile}.map`, 'w');
            }
            memoHandles = {
                chunkId: outputFile,
                handle,
                mapHandle,
                sourceMapComment: `/*# sourceMappingURL=${entryName}.css.map */`,
            };
            // Save to memory, speed up write performance in watch mode
            fHandles.set(outputFile, memoHandles);
        }

        try {
            const { handle, mapHandle, sourceMapComment } = memoHandles;
            const res = sass.compile(input[entryName], output);
            const buff = Buffer.from(res.css);

            totalBuildFiles += res.loadedUrls.length;
            await handle.truncate(0);
            await handle.write(buff, 0, buff.byteLength, 0);
            if (output.sourceMap) {
                await mapHandle.truncate(0);
                await mapHandle.write(JSON.stringify(res.sourceMap), 0);
                await mapHandle.sync();
                // NOTE: use buffer.byteLength to fix muti-bytes character, eg: emoji
                // await handle.write(sourceMapComment, res.css.length);
                await handle.write(sourceMapComment, buff.byteLength);
            }
            await handle.sync();
        } catch (e) {
            console.error(e);
        }
    };
    const buildTasks = Object.keys(input).map(build);

    const START = Date.now();
    await Promise.all(buildTasks);
    log(Date.now() - START, 'build %c %c modules', 'CSS', totalBuildFiles);
}

exports.makeCSS = makeCSS;
exports.makeHTML = makeHTML;
