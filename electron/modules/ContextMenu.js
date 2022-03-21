import {
    ipcMain, Menu, BrowserWindow, app, nativeTheme,
    nativeImage,
} from 'electron';
import path from 'path';
import { IPC_CONTEXT_MENU } from 'e/constants';
import aps from 'e/modules/AppSettings';
import logo from '../../assets/mdn-web-docs.png';

class ContextMenu {
    constructor() {
        this.current = null;
        this.icon = nativeImage.createFromDataURL(logo).resize({ width: 16, height: 16 });
    }

    start() {
        if (!this.current) {
            this.build();
        }
        ipcMain.on(IPC_CONTEXT_MENU, this.onPopup);
    }

    stop() {
        ipcMain.removeListener(IPC_CONTEXT_MENU, this.onPopup);
        this.current = null;
    }

    build() {
        this.current = Menu.buildFromTemplate([
            { label: '返回', click: this._onGoBack },
            { label: '前进', click: this._onGoForward },
            { label: '刷新', role: 'reload', accelerator: 'CmdOrCtrl+R' },
            { type: 'separator' },
            {
                label: '暗黑主题', type: 'checkbox', checked: aps.data.darkMode, click: this._onDarkModeClick,
            },
            { label: '检查', role: 'toggleDevTools', accelerator: 'F12' },
            { type: 'separator' },
            { label: '在 MDN 上查看', icon: this.icon },
            { label: '网页内查找', accelerator: 'CmdOrCtrl+F' },
            { label: '重新启动', click: this._onRelaunch },
            { label: '退出', role: 'quit' },
        ]);
    }

    onPopup = (ev) => {
        if (!this.current) {
            return;
        }
        const win = BrowserWindow.fromWebContents(ev.sender);
        this.current.popup({ window: win });
    };

    _onGoBack = (ev, win) => {
        win?.webContents.goBack();
    };

    _onGoForward = (ev, win) => {
        win?.webContents.goForward();
    };

    _onDarkModeClick = (e) => {
        aps.data.darkMode = e.checked;
        if (e.checked) {
            nativeTheme.themeSource = 'dark';
            return;
        }
        nativeTheme.themeSource = 'light';
    };

    _onRelaunch = (e) => {
        app.relaunch();
        app.exit(0);
    };
}

export default new ContextMenu();
