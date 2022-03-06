const path = require('path');
const fs = require('fs/promises');
const EventEmitter = require('events');
const http = require('http');
const rollup = require('rollup/dist/rollup.js');
const loadConfigFile = require('rollup/dist/loadConfigFile.js');
const sass = require('sass');
const chokidar = require('chokidar');
const log = require('./log.js');


const $ev = new EventEmitter();
const ELECTRON = path.resolve(__dirname, '../rollup.config.js');
const JS = path.resolve(__dirname, '../src/rollup.config.js');
const PORT = 8012;

const cssCompileOptions = {
    input: [
        'src/index.scss',
    ],
    output: {
        file: 'dist/[name].css',
        style: 'compressed',
        loadPaths: ['node_modules/@primer/primitives/dist/scss'],
        sourceMap: true,
    },
};
const sseWatches = ['index.html'];

class Watcher extends EventEmitter {
    constructor() {
        super();
        this.fHandles = {};
    }

    async start() {
        log.start = Date.now();
        const loadTasks = [ELECTRON, JS].map((v) => loadConfigFile(v));
        const [electron, js] = await Promise.all(loadTasks);
        electron.warnings.flush();
        js.warnings.flush();
        // const bundle = await rollup.rollup(res.options[0]);
        // const { output } = await bundle.write(res.options[0].output[0]);
        // await bundle.close();
        const options = electron.options.concat(js.options);
        const watcher = rollup.watch(options);
        watcher.on('event', (ev) => {
            if (ev.code === 'BUNDLE_END') {
                const { watchFiles } = ev.result;
                const id = watchFiles.find((s) => s?.indexOf('electron') > 0) ? 'ELECTRON' : 'JS';
                log(ev.duration, 'build %c %c modules', id, watchFiles.length);
                $ev.emit('livereload');
            } else if (ev.code === 'ERROR') {
                log(ev.error);
                $ev.emit('livereload', ev.error);
            }
            ev?.result?.close();
            electron.warnings.flush();
            js.warnings.flush();
        });
        await this.css();
        const sseWatcher = chokidar.watch(sseWatches);
        sseWatcher.on('all', () => {
            $ev.emit('livereload');
        });
        log('watching');
    }

    async css() {
        const { input, output } = cssCompileOptions;
        const addFileHandle = async (entryFile) => {
            const name = path.basename(entryFile, '.scss');
            const outputFile = output.file.replace('[name]', name);
            const handle = await fs.open(outputFile, 'w');
            let mapHandle;
            if (output.sourceMap) {
                mapHandle = await fs.open(`${outputFile}.map`, 'w');
            }
            this.fHandles[entryFile] = {
                handle,
                mapHandle,
                sourceMapComment: `/*# sourceMappingURL=${name}.css.map */`,
            };
        };
        await Promise.all(input.map(addFileHandle));

        const cssWatcher = chokidar.watch('./src/**/*.scss');
        cssWatcher.on('ready', async () => {
            await this.cssBuild();
            cssWatcher.on('all', async (eventName, filePath, stats) => {
                await this.cssBuild();
                $ev.emit('livereload');
            });
        });
    }

    async cssBuild() {
        let count = 0;
        const buildTask = async (entryFile) => {
            const { output } = cssCompileOptions;
            const { handle, mapHandle, sourceMapComment } = this.fHandles[entryFile];
            try {
                const res = sass.compile(entryFile, output);

                count += res.loadedUrls.length;
                await handle.truncate();
                await handle.write(res.css, 0);
                if (output.sourceMap) {
                    await mapHandle.truncate(0);
                    await mapHandle.write(JSON.stringify(res.sourceMap), 0);
                    await mapHandle.sync();
                    await handle.write(sourceMapComment, res.css.length);
                }
                await handle.sync();
            } catch (e) {
                console.error(e);
            }
        };
        const { input } = cssCompileOptions;

        log.start = Date.now();
        await Promise.all(input.map(buildTask));
        log('build %c %c modules', 'CSS', count);
    }

    /**
     * Live reload server
     *
     * Client is injected at rollup `in-plugin/sse`
     *
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse} res
     */
    static sse(req, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.write('event: sse\ndata: connected\n\n');
        $ev.once('livereload', (err) => {
            const data = JSON.stringify(err ?? { reload: 1 });
            res.end(`event: message\ndata: ${data}\n\n`);
            // log('SSE reload');
        });
    }
}

new Watcher().start();
http.createServer(Watcher.sse)
    .listen(PORT, () => {
        log('SSE listen on http://localhost:%c', PORT);
    })
    .on('close', () => $ev.removeAllListeners('livereload'));
