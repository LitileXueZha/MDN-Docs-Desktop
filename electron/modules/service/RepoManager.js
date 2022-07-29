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
    || 'https://github.com/mdn/content.git';
const TRANSLATED_CONTENT_URL = process.env.TRANSLATED_CONTENT_URL
    || 'https://github.com/mdn/translated-content.git';

class RepoManager {
    constructor() {
        this.pending = false;
        this.PATH = `${app.getPath('downloads')}${path.sep}MDN-Works`; // ~/Downloads/MDN-Works
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
            message: '默认保存到下载目录',
            detail: `具体位置为\n${this.PATH}`,
            buttons: ['确定', '取消'],
            cancelId: 6,
            noLink: true,
        });
        if (action.response === 0) {
            this.pending = true;
            bar.message.loading('正在克隆仓库');
            // git clone --depth 1 --no-tags --progress [repo_url] content
            const cp1 = spawn('git', [
                '-C', this.PATH,
                'clone', '--depth', '1', '--no-tags',
                CONTENT_URL, 'content',
            ]);
            const cp2 = spawn('git', [
                '-C', this.PATH,
                'clone', '--depth', '1', '--no-tags',
                TRANSLATED_CONTENT_URL, 'translated-content',
            ]);
            let numClosed = 0;
            const handleClose = (code) => {
                numClosed += 1;
                // All tasks are done
                if (numClosed === 2) {
                    this._onTaskDone(code);
                }
            };

            cp1.stderr.on('data', this._onStderr);
            cp2.stderr.on('data', this._onStderr);
            cp1.stdout.on('data', this._onStdout);
            cp2.stdout.on('data', this._onStdout);
            cp1.on('error', console.error);
            cp2.on('error', console.error);
            cp1.on('exit', (code) => {
                handleClose(code);
                if (code === 0) {
                    aps.data.contentDir = `${this.PATH}${path.sep}content`;
                }
            });
            cp2.on('exit', (code) => {
                handleClose(code);
                if (code === 0) {
                    aps.data.translateDir = `${this.PATH}${path.sep}translated-content`;
                }
            });
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
            const cp = spawn('git', ['-C', gitDir, 'pull', '--ff']);
            cp.stderr.on('data', this._onStderr);
            cp.stdout.on('data', this._onStdout);
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

    _onStderr = (chunk) => {
        bar.message.error('下载/同步仓库出错', { raw: chunk });
        // Show the error in terminal, useful on Linux
        console.log('GITERR', chunk.toString());
    };

    _onStdout = (chunk) => {
        // Clear statusbar through null string
        bar.message.info('\0', { raw: chunk });
        console.log('GITOUT', chunk.toString());
    };
}

export default new RepoManager();
