import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CONTROL_BUTTONS } from 'e/constants';

class ControlButtons {
    start() {
        ipcMain.on(IPC_CONTROL_BUTTONS, this.onClick);
    }

    stop() {
        ipcMain.removeListener(IPC_CONTROL_BUTTONS, this.onClick);
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
}

export default new ControlButtons();
