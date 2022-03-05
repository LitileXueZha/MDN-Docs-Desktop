import path from 'path';
import fs from 'fs';
import {
    app, BrowserWindow, nativeTheme, Menu, ipcMain, dialog,
} from 'electron';
import debug from 'debug';
import { version } from '../package.json';

const log = debug('log');

// eslint-disable-next-line
export async function startup() {
    nativeTheme.themeSource = 'dark';
    log('booting %o', 'MDN-Docs-Desktop');
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    // app.addRecentDocument(path.join(__dirname, '../index.html'));
    app.setUserTasks([
        {
            title: '新窗口',
            description: '新建一个窗口',
            program: process.execPath,
            arguments: '--new-window',
            iconPath: process.execPath,
            iconIndex: 0,
        },
    ]);

    await app.whenReady();
    const win = await createWindow();

    const ctxMenu = Menu.buildFromTemplate([
        { label: '返回', type: 'normal' },
        { label: '前进', type: 'normal' },
        {
            label: '重新加载', type: 'normal', role: 'forcereload', accelerator: 'Ctrl+R',
        },
        { type: 'separator' },
        {
            label: '暗黑主题',
            type: 'checkbox',
            checked: true,
            click: (e) => {
                if (e.checked) {
                    nativeTheme.themeSource = 'dark';
                    return;
                }
                nativeTheme.themeSource = 'light';
            },
        },
        { label: 'Item3Item3Item3Item3Item3', type: 'radio', checked: true },
        { label: '刷新', role: 'reload' },
        { label: '检查', role: 'toggleDevTools', accelerator: 'F12' },
        { type: 'separator' },
        {
            label: '重新启动',
            type: 'normal',
            click: () => {
                app.relaunch();
                app.exit(0);
            },
        },
        { label: '退出', role: 'quit', accelerator: 'Ctrl+Q' },
    ]);

    win.webContents.on('context-menu', () => {
        ctxMenu.popup();
    });
    win.webContents.openDevTools();

    const versions = Object.keys(process.versions).map((k) => `${k}: ${process.versions[k]}`).join('\n');
    ipcMain.on('opendialog', (ev, type) => {
        if (type === 1) {
            dialog.showMessageBox(BrowserWindow.getAllWindows()[0], {
                type: 'info',
                defaultId: 0,
                buttons: ['复制', '确定'],
                // title: 'MDN Docs Desktop',
                message: 'MDN Docs Desktop',
                detail: versions,
                noLink: true,
            });
        } else if (type === 2) {
            app.setAboutPanelOptions({
                applicationName: 'MDN',
                applicationVersion: version,
                copyright: '©litilexuezha',
            });
            app.showAboutPanel();
        } else if (type === 3) {
            app.showEmojiPanel();
        }
    });
}

async function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 360,
        frame: false,
        useContentSize: true,
        titleBarStyle: 'hidden',
        // titleBarOverlay: true,
        titleBarOverlay: {
            color: '#2f3241',
            symbolColor: '#74b1be',
            height: 32,
        },
        // transparent: true,
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            spellcheck: false,
            enableWebSQL: false,
        },
    });

    win.on('ready-to-show', () => {
        log('createWindow');
    });
    await win.loadFile(path.resolve(__dirname, '../index.html'));
    return win;
}
