import path from 'path';
import { BrowserWindow } from 'electron';
import { COLORS, IPC_RENDER } from 'e/constants';
import aps from 'e/modules/AppSettings';

class MainWindow {
    constructor() {
        this.ID = 'main';
        this.URL = path.resolve(__dirname, '../src/index.html');
        this.win = null;
    }

    async startup() {
        if (!this.win) {
            await this.create();
        }
    }

    async create() {
        const { background } = COLORS[aps.data.darkMode ? 'dark' : 'light'];
        const win = new BrowserWindow({
            width: 1132,
            height: 700,
            minWidth: 360,
            frame: false,
            useContentSize: true,
            titleBarStyle: 'hidden',
            backgroundColor: background,
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

        win.on('maximize', this._onMaximize);
        win.on('unmaximize', this._onUnmaximize);
        // await win.loadURL('mdv://internal-files/index.html');
        await win.loadURL(this.URL);
        this.win = win;
    }

    _onMaximize = (e) => {
        this.win.webContents.send(IPC_RENDER, 'win-max');
    };

    _onUnmaximize = (e) => {
        this.win.webContents.send(IPC_RENDER, 'win-unmax');
    };
}


export default new MainWindow();
