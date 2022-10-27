import {
    ipcMain, Menu, BrowserWindow, app, nativeTheme,
    nativeImage,
    shell,
} from 'electron';
import path from 'path';
import {
    IPC_CONTEXT_MENU, IPC_FIND_IN_PAGE, IPC_OPEN_DIALOG, REG_DOC_NODEJS,
} from 'e/constants';
import aps from 'e/modules/AppSettings';
import logo from '../../../assets/mdn-web-docs.png';
import nodeLogo from '../../../assets/nodejs.png';

class ContextMenu {
    constructor() {
        this.current = null;
        this.icon = nativeImage.createFromDataURL(logo).resize({ width: 16, height: 16 });
        this.iconNode = nativeImage.createFromDataURL(nodeLogo).resize({ width: 16, height: 16 });
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
            {
                label: '在 MDN 上查看', icon: this.icon, click: this._onMDNForward, id: 'mdn',
            },
            {
                label: '在 nodejs.org 上查看', icon: this.iconNode, click: this._onNodejsForward, id: 'nodejs',
            },
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
        const url = ev.sender.getURL();
        const win = BrowserWindow.fromWebContents(ev.sender);
        const back = ev.sender.canGoBack();
        const forward = ev.sender.canGoForward();
        this.current.items[0].enabled = back;
        this.current.items[1].enabled = forward;
        this.current.items[4].checked = aps.data.darkMode;
        this._setMenuIcon(url);
        this.current.popup({ window: win });
    };

    _setMenuIcon = (url) => {
        const { pathname } = new URL(url);
        const isNodejsApi = REG_DOC_NODEJS.test(pathname);
        const mdn = this.current.getMenuItemById('mdn');
        const nodejs = this.current.getMenuItemById('nodejs');
        mdn.visible = !isNodejsApi;
        nodejs.visible = isNodejsApi;
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

    _onNodejsForward = (ev, win) => {
        const NODEJS = 'https://nodejs.org/api';
        const url = win.webContents.getURL();
        const { pathname, hash } = new URL(url);
        let id = pathname.replace(REG_DOC_NODEJS, '');
        id = id.substring(0, id.indexOf('.'));
        id = id || '/documentation';
        shell.openExternal(`${NODEJS}${id}.html${hash}`);
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
