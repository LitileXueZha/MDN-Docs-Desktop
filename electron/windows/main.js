import path from 'path';
import { BrowserWindow, ipcMain, shell } from 'electron';
import { COLORS, IPC_RENDER } from 'e/constants';
import aps from 'e/modules/AppSettings';

class MainWindow {
    constructor() {
        this.ID = 'main';
        this.URL = 'mdv://internal-files/index.html';
        this.win = null;
    }

    async startup() {
        if (!this.win) {
            await this.create();
        }
        ipcMain.on('jump-to', this._onWillNavigate);
    }

    async create() {
        const { background } = COLORS[aps.data.darkMode ? 'dark' : 'light'];
        const win = new BrowserWindow({
            width: 1132,
            height: 700,
            minWidth: 360,
            frame: false,
            useContentSize: true,
            backgroundColor: background,
            icon: path.join(__dirname, 'assets/mdn-web-docs.png'),
            // titleBarOverlay: true,
            // titleBarOverlay: {
            //     color: '#2f3241',
            //     symbolColor: '#74b1be',
            //     height: 32,
            // },
            // transparent: true,
            webPreferences: {
                preload: path.join(__dirname, 'renderer.js'),
                spellcheck: false,
                enableWebSQL: false,
            },
        });

        // await win.loadURL('mdv://internal-files/index.html');
        await win.loadURL(this.URL);
        win.on('maximize', this._onMaximize);
        win.on('unmaximize', this._onUnmaximize);
        win.webContents.on('did-finish-load', () => {
            if (win.isMaximized()) {
                this._onMaximize();
            }
        });
        win.webContents.on('will-navigate', this._onWillNavigate);
        this.win = win;
    }

    _onMaximize = (e) => {
        this.win.webContents.send(IPC_RENDER, 'win-max');
    };

    _onUnmaximize = (e) => {
        this.win.webContents.send(IPC_RENDER, 'win-unmax');
    };

    _onWillNavigate = async (ev, url) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            ev.preventDefault();
            return;
        }
        if (url.startsWith('mdv')) {
            const { pathname, hash } = new URL(url);

            if (this.win.isDestroyed()) {
                await this.create();
            }
            this.win.webContents.executeJavaScript(`history.pushState({},"","${pathname}${hash}");dispatchEvent(new Event('popstate'))`);
            this.win.focus();
            ev.preventDefault();
        }
    };
}


export default new MainWindow();
