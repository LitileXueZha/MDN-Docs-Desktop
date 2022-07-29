import {
    app, BrowserWindow, ipcMain,
    protocol,
    session,
} from 'electron';
import mainWindow from 'e/windows/main';
import { IPC_RELOAD } from 'e/constants';
import aps from 'e/modules/AppSettings';
import { MDV_SCHEME, registerSchemeMDV } from 'e/modules/SchemeMDV';
import { version } from '../package.json';

process.env.DEBUG = '*';
process.env.DEBUG_COLORS = 1;
const debug = require('debug');

const log = debug('log');

process.on('uncaughtException', console.error);

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
    app.setUserTasks([
        {
            title: '新窗口',
            description: '新建一个窗口',
            program: process.execPath,
            arguments: app.getAppPath(),
            iconPath: process.execPath,
            iconIndex: 0,
        },
    ]);
    app.setName('MDN Docs Desktop');
    ipcMain.on('error', console.log);

    protocol.registerSchemesAsPrivileged([MDV_SCHEME]);
    await app.whenReady();
    await aps.load();
    registerSchemeMDV();
    await mainWindow.startup();

    import('./bootstrap-modules');
    aps.probeCommands();

    ipcMain.on(IPC_RELOAD, (ev) => {
        ev.sender.reloadIgnoringCache();
    });
}

export const VERSION = version;
