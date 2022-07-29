import os from 'os';
import {
    app, BrowserWindow, clipboard, dialog, ipcMain, Menu, shell,
} from 'electron';
import { IPC_APPLICATION_MENU, IPC_OPEN_DIALOG } from 'e/constants';
import aps from 'e/modules/AppSettings';

class ApplicationMenu {
    constructor() {
        this.current = null;
        this.menus = {};
    }

    build() {
        const home = Menu.buildFromTemplate([
            { label: '回到首页', click: this._onGoHome },
            { label: '设置', click: this._onOpenSetting },
            { type: 'separator' },
            { label: '重新启动', click: this._onRelaunch },
            { label: '退出', role: 'quit' },
        ]);
        const web = Menu.buildFromTemplate([
            { label: '概览', click: this.goto('/docs/Web') },
            { type: 'separator' },
            { label: 'HTML', click: this.goto('/docs/Web/HTML') },
            { label: 'CSS', click: this.goto('/docs/Web/CSS') },
            { label: 'JavaScript', click: this.goto('/docs/Web/JavaScript') },
            { type: 'separator' },
            { label: 'Graphics 图形', click: this.goto('/docs/Web/Guide/Graphics') },
            { label: 'HTTP', click: this.goto('/docs/Web/HTTP') },
            { label: 'APIs', click: this.goto('/docs/Web/API') },
            { label: 'MathML 数学公式', click: this.goto('/docs/Web/MathML') },
        ]);
        const guides = Menu.buildFromTemplate([
            { label: '学习前端开发', click: this.goto('/docs/Learn') },
            { label: '教程', click: this.goto('/docs/Web/Tutorials') },
            { label: '开发者指南', click: this.goto('/docs/Web/Guide') },
            { type: 'separator' },
            { label: 'A11y (Accessibility)', click: this.goto('/docs/Web/Accessibility') },
            { label: '游戏开发', click: this.goto('/docs/Games') },
        ]);
        const feedback = Menu.buildFromTemplate([
            { label: '为 MDN 提供反馈', click: this.goto('/docs/MDN/Contribute/Feedback') },
            { label: '参与 MDN 贡献', click: this.goto('/docs/MDN/Contribute') },
            { type: 'separator' },
            { label: '去 MDN 仓库上提出 issue', click: this._onReportIssue },
        ]);
        const help = Menu.buildFromTemplate([
            { label: 'README', click: this._onReadme },
            { label: 'MDN 官网', click: this._onMDN },
            { type: 'separator' },
            { label: '开发者工具', role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Shift+I' },
            { label: '检查更新' },
            { label: '关于', click: this._openAbout },
        ]);
        const allMenus = Menu.buildFromTemplate([
            { label: '首页', submenu: home },
            { label: 'Web 技术', submenu: web },
            { label: '教程', submenu: guides },
            { label: '反馈', submenu: feedback },
            { label: '帮助', submenu: help },
        ]);
        Menu.setApplicationMenu(allMenus);
        this.current = allMenus;
        this.menus = {
            home, web, guides, feedback, help,
        };
    }

    start() {
        this.build();
        ipcMain.on(IPC_APPLICATION_MENU, this.onPopup);
    }

    stop() {
        ipcMain.removeListener(IPC_APPLICATION_MENU, this.onPopup);
    }

    onPopup = (ev, menuKey, pos = {}) => {
        this.menus[menuKey]?.popup({
            window: BrowserWindow.fromWebContents(ev.sender),
            x: pos.x,
            y: pos.y,
        });
    };

    goto = (url) => (ev, win) => {
        const newURL = `/${aps.data.language}${url}`;
        win?.webContents.executeJavaScript(`history.pushState({},"","${newURL}");dispatchEvent(new Event("popstate"))`);
    };

    _onGoHome = (ev, win) => {
        win?.webContents.executeJavaScript('history.pushState({},"","/");dispatchEvent(new Event("popstate"))');
    };

    _onReadme = () => {
        shell.openExternal('https://github.com/LitileXueZha/MDN-Docs-Desktop');
    };

    _onReportIssue = () => {
        shell.openExternal('https://github.com/mdn/content/issues/new');
    };

    _onMDN = () => {
        shell.openExternal('https://developer.mozilla.org');
    };

    _onOpenSetting = async () => {
        ipcMain.emit(IPC_OPEN_DIALOG, null, 3);
    };

    _onRelaunch = (e) => {
        app.relaunch();
        app.exit(0);
    };

    _openAbout = (ev, win) => {
        const messages = [
            'MIT License, Copyright (c) litilexuezha.\n',
            `当前版本: ${app.getVersion()}`,
            `Electron: ${process.versions.electron}`,
            `Chromium: ${process.versions.chrome}`,
            `Node.js: ${process.versions.node}`,
            `OS: ${os.type()} ${os.arch()} ${os.release()}`,
        ];
        dialog.showMessageBox(win, {
            type: 'info',
            message: 'MDN Docs Desktop',
            detail: messages.join('\n'),
            defaultId: 1,
            buttons: ['复制', '确定'],
            noLink: true,
        }).then(({ response }) => {
            if (response === 0) {
                clipboard.writeText(messages.slice(1).join('\n'), 'selection');
            }
        });
    };
}

export default new ApplicationMenu();
