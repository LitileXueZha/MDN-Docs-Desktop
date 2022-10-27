import {
    app, BrowserWindow, dialog, ipcMain,
    protocol,
    session,
} from 'electron';
import mainWindow from 'e/windows/main';
import { IPC_RELOAD } from 'e/constants';
import aps from 'e/modules/AppSettings';
import { MDV_SCHEME, registerSchemeMDV } from 'e/modules/SchemeMDV';
import winman from 'e/modules/service/WindowManager';
import { version } from '../package.json';

process.on('uncaughtException', (error) => {
    dialog.showErrorBox('uncaughtException', error.stack);
    // app.quit();
});
process.on('unhandledRejection', console.error);
function log() {}
if (__DEV__) {
    process.env.DEBUG = '*';
    process.env.DEBUG_COLORS = 1;
    log = require('debug')('log');
}


export async function startup() {
    log('booting %o', 'MDN-Docs-Desktop');
    log(app.getLocaleCountryCode());
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow.create();
        }
    });
    // app.addRecentDocument(path.join(__dirname, '../index.html'));
    if (process.platform === 'win32') {
        app.setUserTasks([
            {
                title: '新窗口',
                description: '新建一个窗口',
                program: process.execPath,
                arguments: app.getAppPath(),
                iconPath: process.execPath,
                iconIndex: 0,
            },
            {
                title: 'Node.js 文档',
                description: '打开 Node.js 文档窗口',
                program: process.execPath,
                arguments: `${app.getAppPath()} --open-nodejs-api`,
                iconPath: process.execPath,
                iconIndex: 0,
            },
        ]);
    }
    app.setName('MDN Docs Desktop');
    app.setAboutPanelOptions({
        applicationName: 'MDN Docs Desktop',
        applicationVersion: app.getVersion(),
        copyright: 'MIT License, Copyright (c) litilexuezha',
        authors: ['litilexuezha', 'other contributors'],
        website: 'https://github.com/LitileXueZha/MDN-Docs-Desktop',
    });
    // 开机启动
    // app.setLoginItemSettings(settings) macOS Windows
    ipcMain.on('error', console.log);

    protocol.registerSchemesAsPrivileged([MDV_SCHEME]);
    await app.whenReady();
    await aps.load();
    registerSchemeMDV();
    await mainWindow.startup();
    await winman.open('main', true);

    import('./bootstrap-modules');
    aps.probeCommands();

    ipcMain.on(IPC_RELOAD, (ev) => {
        ev.sender.reloadIgnoringCache();
    });
}

export const VERSION = version;
