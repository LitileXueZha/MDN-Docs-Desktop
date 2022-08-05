import {
    app, ipcMain, dialog, BrowserWindow,
} from 'electron';
import { IPC_OPEN_DIALOG } from 'e/constants';
import aps from 'e/modules/AppSettings';
import settingWindow from 'e/windows/setting';

const ID_INFO_TEST = 1;
const ID_ABOUT_PANEL = 2;
const ID_SETTING_WINDOW = 3;
const ID_PICK_DIRECTORY = 4;

class Dialogs {
    start() {
        ipcMain.on(IPC_OPEN_DIALOG, this._onOpen);
        ipcMain.handle(IPC_OPEN_DIALOG, this._onOpenAsync);
    }

    stop() {
        ipcMain.removeListener(IPC_OPEN_DIALOG, this._onOpen);
        ipcMain.removeHandler(IPC_OPEN_DIALOG);
    }

    _onOpen = (ev, type) => {
        switch (type) {
            case ID_INFO_TEST: {
                const versions = Object.keys(process.versions).map((k) => `${k}: ${process.versions[k]}`).join('\n');
                dialog.showMessageBox(BrowserWindow.fromWebContents(ev.sender), {
                    type: 'info',
                    defaultId: 1,
                    buttons: ['复制', '确定'],
                    title: 'MDN Docs Desktop',
                    message: 'MDN Docs Desktop',
                    detail: versions,
                    noLink: true,
                });
                break;
            }
            case ID_ABOUT_PANEL:
                app.setAboutPanelOptions({
                    applicationName: 'MDN',
                    applicationVersion: app.getVersion(),
                    copyright: '©litilexuezha',
                });
                app.showAboutPanel();
                break;
            case ID_SETTING_WINDOW:
                settingWindow.create();
                break;
            default:
                break;
        }
    };

    _onOpenAsync = (ev, type) => {
        switch (type) {
            case ID_PICK_DIRECTORY: {
                const win = BrowserWindow.fromWebContents(ev.sender);
                return dialog.showOpenDialog(win, {
                    title: 'MDN Docs Desktop',
                    properties: ['openDirectory'],
                });
            }
            default:
                break;
        }
    };
}

export default new Dialogs();
