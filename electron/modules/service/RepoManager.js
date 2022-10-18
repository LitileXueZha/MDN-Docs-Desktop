import { spawn } from 'child_process';
import { userInfo } from 'os';
import path from 'path';
import {
    app, BrowserWindow, dialog, ipcMain, shell,
} from 'electron';
import { IPC_DOWNLOAD_REPO, IPC_UPDATE_REPO } from 'e/constants';
import aps from 'e/modules/AppSettings';
import bar from 'e/modules/surface/Bar';

const CONTENT_URL = process.env.CONTENT_URL
    || 'https://github.com/mdn/content.git/';
const TRANSLATED_CONTENT_URL = process.env.TRANSLATED_CONTENT_URL
    || 'https://github.com/mdn/translated-content.git';

class RepoManager {
    constructor() {
        this.pending = false;
        this.PATH = path.join(app.getPath('downloads'), 'MDN-Works'); // ~/Downloads/MDN-Works
    }

    start() {
        ipcMain.on(IPC_DOWNLOAD_REPO, this._onClone);
        ipcMain.on(IPC_UPDATE_REPO, this._onPull);
    }

    stop() {
        ipcMain.removeListener(IPC_DOWNLOAD_REPO, this._onClone);
        ipcMain.removeListener(IPC_UPDATE_REPO, this._onPull);
    }

    _onClone = async (ev) => {
        if (this.pending) return;

        const win = BrowserWindow.fromWebContents(ev.sender);
        const action = await dialog.showMessageBox(win, {
            type: 'info',
            title: 'MDN Docs Desktop',
            message: '默认保存到下载目录',
            detail: `具体位置为\n${this.PATH}`,
            buttons: ['确定', '取消'],
            cancelId: 6,
            noLink: true,
        });
        if (action.response === 0) {
            this.pending = true;
            bar.message.loading('正在克隆仓库');
            let numClosed = 0;
            const handleClose = (code) => {
                numClosed += 1;
                // All tasks are done
                if (numClosed === 2) {
                    this._onTaskDone(code);
                }
            };
            const spawnClone = (name, url) => {
                // git clone --depth 1 --no-tags --progress [repo_url] content
                const cp = spawn('git', [
                    '-C', this.PATH,
                    'clone', '--depth', '1', '--no-tags',
                    url, name,
                ]);
                cp.stderr.on('data', (chunk) => this._onStderr(name, chunk));
                cp.stdout.on('data', (chunk) => this._onStdout(name, chunk));
                cp.on('error', console.error);
                cp.on('exit', (code) => {
                    handleClose(code);
                    if (code === 0) {
                        const dir = path.join(this.PATH, name);
                        switch (name) {
                            case 'content':
                                aps.data.contentDir = dir;
                                break;
                            case 'translated-content':
                                aps.data.translateDir = dir;
                                break;
                            default:
                                break;
                        }
                    }
                });
            };

            spawnClone('content', CONTENT_URL);
            spawnClone('translated-content', TRANSLATED_CONTENT_URL);
        }
    };

    _onPull = async (ev) => {
        if (this.pending) return;

        const { contentDir, translateDir } = aps.data;
        let total = 0;
        let numClosed = 0;
        const handleClose = (code) => {
            numClosed += 1;
            if (numClosed === total) {
                this._onTaskDone(code);
            }
        };
        const spawnPull = (gitDir) => {
            this.pending = true;
            bar.message.loading('正在同步仓库');
            total += 1;
            // git pull
            const cp = spawn('git', ['-C', gitDir, 'pull', '--ff', '-q', '-p']);
            const name = gitDir.substr(gitDir.lastIndexOf(path.sep) + 1);
            cp.stderr.on('data', (chunk) => this._onStderr(name, chunk));
            cp.stdout.on('data', (chunk) => this._onStdout(name, chunk));
            cp.on('exit', handleClose);
            cp.on('error', console.error);
        };

        if (contentDir) spawnPull(contentDir);
        if (translateDir) spawnPull(translateDir);
    };

    _onTaskDone = (exitCode) => {
        this.pending = false;
        shell.beep();
        if (exitCode === 0) {
            bar.message.done('下载/同步仓库完成');
        }
    };

    _onStderr = (name, chunk) => {
        bar.message.error('下载/同步仓库出错', { raw: chunk });
        // Show the error in terminal, useful on Linux
        process.stderr.write(`GITERR(${name}) `);
        process.stderr.write(chunk);
    };

    _onStdout = (name, chunk) => {
        // Clear statusbar through null string
        bar.message.info('\0', { raw: chunk });
        process.stdout.write(`GITOUT(${name}) `);
        process.stdout.write(chunk);
    };
}

export default new RepoManager();
