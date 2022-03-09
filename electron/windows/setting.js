import path from 'path';
import { BrowserWindow } from 'electron';
import { COLORS } from 'e/constants';
import aps from 'e/modules/AppSettings';

class SettingWindow {
    constructor() {
        this.ID = 'setting';
        this.URL = path.resolve(__dirname, '../src/setting/index.html');
        this.win = null;
    }

    async create() {
        const { background } = COLORS[aps.data.darkMode ? 'dark' : 'light'];
        const mainWindow = BrowserWindow.getFocusedWindow();
        const win = new BrowserWindow({
            parent: mainWindow,
            width: 800,
            height: 494,
            useContentSize: true,
            fullscreenable: false,
            maximizable: false,
            minimizable: false,
            frame: false,
            modal: true,
            backgroundColor: background,
            webPreferences: {
                preload: path.join(__dirname, 'renderer.js'),
                spellcheck: false,
                enableWebSQL: false,
            },
        });
        win.menuBarVisible = false;

        await win.loadFile(this.URL);
        this.win = win;
    }
}


export default new SettingWindow();
