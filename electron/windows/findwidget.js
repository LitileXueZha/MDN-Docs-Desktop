import path from 'path';
import { BrowserWindow, ipcMain, shell } from 'electron';
import {
    IPC_FIND_IN_PAGE, IPC_STOP_FIND_IN_PAGE, COLORS, IPC_RENDER,
} from 'e/constants';
import aps from 'e/modules/AppSettings';


class FindWidgetWindow {
    constructor() {
        this.ID = 'find-widget';
        this.URL = 'mdv://internal-files/dist/find-widget.html';
        this.win = null;
        this._closeTimer = null;
    }

    start() {
        ipcMain.on(IPC_FIND_IN_PAGE, this._onFind);
        ipcMain.on(IPC_STOP_FIND_IN_PAGE, this._onStopFind);
    }

    stop() {
        ipcMain.removeListener(IPC_FIND_IN_PAGE, this._onFind);
        ipcMain.removeListener(IPC_STOP_FIND_IN_PAGE, this._onStopFind);
    }

    async create(parent) {
        const { x, y, width } = parent.getNormalBounds();
        const { background } = COLORS[aps.data.darkMode ? 'dark' : 'light'];
        const win = new BrowserWindow({
            parent,
            x: (x + width) - 370 - 12,
            y: y + 32 + 12,
            width: 370,
            height: 42,
            maxWidth: 370,
            maxHeight: 42,
            minWidth: 370,
            minHeight: 42,
            useContentSize: true,
            fullscreenable: false,
            maximizable: false,
            minimizable: false,
            // resizable: false,
            frame: false,
            show: false,
            backgroundColor: background,
            webPreferences: {
                preload: path.join(__dirname, 'renderer.js'),
                spellcheck: false,
                enableWebSQL: false,
                devTools: false,
                images: false,
                webgl: false,
            },
        });

        win.setMenuBarVisibility(false);
        await win.loadURL(this.URL);
        this.win = win;
    }

    _onFind = async (ev, text, options) => {
        clearTimeout(this._closeTimer);
        if (!this.win || this.win.isDestroyed()) {
            const parent = BrowserWindow.fromWebContents(ev.sender);
            await this.create(parent);
        }
        this.win.show();
        // Set current searching text
        if (ev.sender !== this.win.webContents) {
            this.win.webContents.send(IPC_RENDER, 'find-widget', text);
        }
        const { webContents } = this.win.getParentWindow();
        if (text) {
            webContents.findInPage(text, options);
            webContents.once('found-in-page', this._onFound);
        } else {
            webContents.stopFindInPage('clearSelection');
        }
    };

    _onStopFind = (ev) => {
        if (!this.win) return;

        this.win.hide();
        const parent = this.win.getParentWindow();
        parent.webContents.stopFindInPage('clearSelection');
        parent.focus();
        // Close the find widget after 15m
        this._closeTimer = setTimeout(() => this.win.close(), 15 * 60 * 1000);
    };

    _onFound = (ev, result) => {
        if (result.matches === 0) {
            shell.beep();
        }
        this.win.webContents.send(IPC_RENDER, 'find-widget', result);
    };
}

export default new FindWidgetWindow();
