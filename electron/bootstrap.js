import path from 'path';
import fs from 'fs/promises';
import {
    app, BrowserWindow, nativeTheme, Menu, ipcMain, dialog,
    protocol,
    session,
} from 'electron';
import mainWindow from 'e/windows/main';
import setting from 'e/windows/setting';
import { IPC_CONTEXT_MENU, IPC_OPEN_DIALOG } from 'e/constants';
import aps from 'e/modules/AppSettings';
import mdv from 'e/modules/SchemeMDV';
import locales from 'e/modules/Locales';
import { version } from '../package.json';

process.env.DEBUG = '*';
process.env.DEBUG_COLORS = 1;
const debug = require('debug');
const log = debug('log');

// eslint-disable-next-line
export async function startup() {
    log('booting %o', 'MDN-Docs-Desktop');
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
    app.setUserTasks([
        {
            title: '新窗口',
            description: '新建一个窗口',
            program: process.execPath,
            arguments: path.resolve(__dirname, '..'),
            iconPath: process.execPath,
            iconIndex: 0,
        },
    ]);

    protocol.registerSchemesAsPrivileged([mdv.SCHEME]);
    await app.whenReady();
    mdv.register();
    await aps.load();
    await mainWindow.startup();
    await locales.detect();
    const [ctxMenu, ctrlButtons, menus, cnProvider] = await Promise.all([
        import('e/modules/ContextMenu'),
        import('e/modules/ControlButtons'),
        import('e/modules/ApplicationMenu'),
        import('e/modules/ContentProvider'),
    ]);
    ctxMenu.default.start();
    ctrlButtons.default.start();
    menus.default.start();
    cnProvider.default.start();

    const versions = Object.keys(process.versions).map((k) => `${k}: ${process.versions[k]}`).join('\n');
    ipcMain.on(IPC_OPEN_DIALOG, (ev, type) => {
        if (type === 1) {
            dialog.showMessageBox(BrowserWindow.fromWebContents(ev.sender), {
                type: 'info',
                defaultId: 1,
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
            // app.showEmojiPanel();
            // createWindow(win, true);
            setting.create();
        }
    });
}
