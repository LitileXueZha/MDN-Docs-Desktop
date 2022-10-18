import {
    ipcMain, Menu, BrowserWindow, app, nativeTheme,
    nativeImage,
    shell,
} from 'electron';
import path from 'path';
import { IPC_CONTEXT_MENU, IPC_FIND_IN_PAGE, IPC_OPEN_DIALOG } from 'e/constants';
import aps from 'e/modules/AppSettings';
import logo from '../../../assets/mdn-web-docs.png';

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
        const tplMenus = [
            { label: '返回', click: this._onGoBack, enabled: false },
            { label: '前进', click: this._onGoForward, enabled: false },
            { label: '刷新', role: 'reload', accelerator: 'CmdOrCtrl+R' },
            { type: 'separator' },
            {
                label: '暗黑主题', type: 'checkbox', checked: aps.data.darkMode, click: this._onDarkModeClick,
            },
            { label: '网页内查找', accelerator: 'CmdOrCtrl+F', click: this._onFindWidget },
            { label: '在 MDN 上查看', icon: this.icon, click: this._onMDNForward },
        ];

        if (__DEV__) {
            this.current = Menu.buildFromTemplate(tplMenus.concat([
                { type: 'separator' },
                { label: '开发者菜单', enabled: false },
                { label: '检查', role: 'toggleDevTools', accelerator: 'F12' },
                { label: '设置', accelerator: 'F1', click: this._onOpenSetting },
                { label: '重新启动', click: this._onRelaunch },
                { label: '退出', role: 'quit' },
            ]));
            return;
        }
        this.current = Menu.buildFromTemplate(tplMenus);
    }

    onPopup = (ev) => {
        if (!this.current) {
            return;
        }
        const win = BrowserWindow.fromWebContents(ev.sender);
        const back = ev.sender.canGoBack();
        const forward = ev.sender.canGoForward();
        this.current.items[0].enabled = back;
        this.current.items[1].enabled = forward;
        this.current.items[4].checked = aps.data.darkMode;
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

    _onMDNForward = (ev, win) => {
        const MDN = 'https://developer.mozilla.org';
        const url = win.webContents.getURL();
        const { pathname, hash } = new URL(url);
        shell.openExternal(`${MDN}${pathname}${hash}`);
    };

    _onFindWidget = (ev, win) => {
        ipcMain.emit(IPC_FIND_IN_PAGE, { sender: win.webContents });
    };

    _onOpenSetting = (ev, win) => {
        ipcMain.emit(IPC_OPEN_DIALOG, null, 3);
    };

    _onRelaunch = (e) => {
        app.relaunch();
        app.exit(0);
    };
}

export default new ContextMenu();
