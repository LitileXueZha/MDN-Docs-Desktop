const path = require('path');
const fs = require('fs/promises');
const EventEmitter = require('events');
const http = require('http');
const { spawn } = require('child_process');
const rollup = require('rollup/dist/rollup.js');
const loadConfigFile = require('rollup/dist/loadConfigFile.js');
const chokidar = require('chokidar');
const log = require('./log.js');
const { makeCSS, makeHTML, makeNodejs } = require('./make-utils.js');
const { cssCompileOptions, htmlCompileOptions, nodejsCompileOptions } = require('./compileOptions.js');


const $ev = new EventEmitter();
const PORT = 8012;

class Watcher extends EventEmitter {
    constructor() {
        super();
        this.fHandles = {};
    }

    async start() {
        await fs.rm('dist', { recursive: true, force: true });
        const START = Date.now();
        const rollc = await loadConfigFile(path.resolve(__dirname, '../rollup.config.js'));
        // const bundle = await rollup.rollup(rollc.options[1]);
        // console.log(bundle.getTimings())
        // Reference https://github.com/rollup/rollup/issues/2716#issuecomment-466628455
        // const { output } = await bundle.write(res.options[0].output[0]);
        // await bundle.close();
        const watcher = rollup.watch(rollc.options);
        watcher.on('event', (ev) => {
            if (ev.code === 'BUNDLE_END') {
                const { watchFiles } = ev.result;
                const id = watchFiles.find((s) => s?.indexOf('electron') > 0) ? 'ELECTRON' : 'JS';
                log(ev.duration, 'build %c %c modules', id, watchFiles.length);
                $ev.emit('livereload');
                this.emit(id);
            } else if (ev.code === 'ERROR') {
                console.error(ev.error);
                $ev.emit('livereload', ev.error);
            }
            ev?.result?.close();
            rollc.warnings.flush();
        });

        await fs.mkdir('dist/css', { recursive: true }); // supress file open error
        this.startWatcher('./src/**/*.scss', makeCSS.bind(null, cssCompileOptions));
        this.startWatcher('./src/**/*.html', makeHTML.bind(null, htmlCompileOptions));

        log(Date.now() - START, 'watching');

        await Promise.all([
            makeNodejs(nodejsCompileOptions),
            fs.symlink(path.resolve('assets'), 'dist/assets', 'dir'),
            fs.copyFile('main.js', 'dist/main.js'),
            fs.copyFile('package.json', 'dist/package.json'),
        ]);
        this.launchElectron();
    }

    launchElectron() {
        let cp;
        const binElecton = require('electron');
        const cwd = path.resolve(__dirname, '..');
        const kill = () => {
            if (!cp || cp.killed) return;
            if (process.platform !== 'win32') {
                return cp.kill();
            }
            spawn('taskkill', ['/T', '/F', '/PID', cp.pid]);
        }
        const launch = () => {
            kill();
            cp = spawn(binElecton, ['dist'], { cwd, stdio: 'inherit' });
            log(`launch ${binElecton} %c`, cp.pid);
            this.once('ELECTRON', launch);
        };
        // JS compilation is more slowly than ELECTRON
        this.once('JS', launch);
        process.on('SIGINT', () => {
            kill();
            process.exit();
        });
    }

    startWatcher(paths, make) {
        const watcher = chokidar.watch(paths);
        watcher.on('ready', () => {
            make();
            watcher.on('all', async (eventName, filePath, stats) => {
                await make();
                $ev.emit('livereload');
            });
        });
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
        const sendReloadMessage = (err) => {
            const data = JSON.stringify(err ?? { reload: 1 });
            res.end(`event: message\ndata: ${data}\n\n`);
            // log('SSE reload');
        };
        $ev.once('livereload', sendReloadMessage);
        req.on('close', () => {
            $ev.removeListener('livereload', sendReloadMessage);
        });
    }
}

new Watcher().start();
http.createServer(Watcher.sse)
    .listen(PORT, () => {
        log('SSE listen on http://localhost:%c', PORT);
    });
