import path from 'path';
import { BrowserWindow } from 'electron';
import { COLORS } from 'e/constants';
import aps from 'e/modules/AppSettings';

class SettingWindow {
    constructor() {
        this.ID = 'setting';
        this.URL = 'mdv://internal-files/setting.html';
        this.win = null;
    }

    async create() {
        const { background } = COLORS[aps.data.darkMode ? 'dark' : 'light'];
        const mainWindow = BrowserWindow.getFocusedWindow();
        const win = new BrowserWindow({
            parent: mainWindow,
            width: 720,
            height: 445,
            useContentSize: true,
            fullscreenable: false,
            maximizable: false,
            minimizable: false,
            frame: false,
            titleBarOverlay: true,
            modal: true,
            backgroundColor: background,
            // show: false,
            webPreferences: {
                preload: path.join(__dirname, 'renderer.js'),
                spellcheck: false,
                enableWebSQL: false,
            },
        });
        win.setMenuBarVisibility(false);
        // win.on('ready-to-show', () => win.show());
        // Fix window flicker. See https://github.com/electron/electron/issues/10616
        win.once('close', () => mainWindow.focus());

        await win.loadURL(this.URL);
        this.win = win;
    }
}


export default new SettingWindow();
