import path from 'path';
import { BrowserWindow, ipcMain, shell } from 'electron';
import {
    COLORS, IPC_RENDER, REG_DOC, REG_DOC_NODEJS,
} from 'e/constants';
import aps from 'e/modules/AppSettings';


class NodejsApi {
    constructor() {
        this.ID = 'nodejs-api';
        this.URL = 'mdv://internal-files/nodejs-api.html';
        this.win = null;
    }

    start() {
    }

    stop() {
    }

    async create() {
        const { background } = COLORS[aps.data.darkMode ? 'dark' : 'light'];
        const current = BrowserWindow.getFocusedWindow();
        let x; let
            y;
        if (!current.isMaximized()) {
            const rect = current.getNormalBounds();
            x = rect.x + 20;
            y = rect.y + 20;
        }
        const win = new BrowserWindow({
            width: 1132,
            height: 700,
            x,
            y,
            minWidth: 360,
            frame: false,
            useContentSize: true,
            backgroundColor: background,
            webPreferences: {
                preload: path.join(__dirname, 'renderer.js'),
                spellcheck: false,
                enableWebSQL: false,
                webgl: false,
            },
        });

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

    _onWillNavigate = (ev, url) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            ev.preventDefault();
            return;
        }
        if (url.startsWith('mdv')) {
            const { pathname, hash } = new URL(url);
            let inAppUrl = pathname;
            if (REG_DOC.test(inAppUrl)) {
                ipcMain.emit('jump-to', ev, url);
                ev.preventDefault();
                return;
            }
            if (!REG_DOC_NODEJS.test(inAppUrl)) {
                inAppUrl = `/nodejs-api${pathname}`;
            }
            this.win.webContents.executeJavaScript(`history.pushState({},"","${inAppUrl}${hash}");dispatchEvent(new Event('popstate'))`);
            ev.preventDefault();
        }
    };
}

export default new NodejsApi();
