import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CONTROL_BUTTONS, IPC_CONTROL_BUTTONS_WINDOW } from 'e/constants';

class ControlButtons {
    start() {
        ipcMain.on(IPC_CONTROL_BUTTONS, this.onClick);
        ipcMain.handle(IPC_CONTROL_BUTTONS_WINDOW, this._onWindowStatus);
    }

    stop() {
        ipcMain.removeListener(IPC_CONTROL_BUTTONS, this.onClick);
        ipcMain.removeHandler(IPC_CONTROL_BUTTONS_WINDOW);
    }

    onClick = (ev, action) => {
        const win = BrowserWindow.fromWebContents(ev.sender);
        switch (action) {
            case 'max':
                win.maximize();
                break;
            case 'min':
                win.minimize();
                break;
            case 'close':
                win.close();
                break;
            case 'restore':
                win.restore();
                break;
            default:
                break;
        }
    };

    _onWindowStatus(ev) {
        const win = BrowserWindow.fromWebContents(ev.sender);
        return {
            visible: win.isVisible(),
            maximized: win.isMaximized(),
            fullScreen: win.isFullScreen(),
        };
    }
}

export default new ControlButtons();
