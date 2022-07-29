import { app, BrowserWindow } from 'electron';
import { IPC_RENDER } from 'e/constants';

const BarMessage = {};
['info', 'error', 'warn', 'loading', 'done'].forEach((type) => {
    BarMessage[type] = (message, details) => {
        if (message) {
            write('message', type, message, details);
        }
    };
});


/**
 * Set app statusbar, send data to the main window
 *
 * @param {string} place the placement of this message on statusbar
 * @param {string} type
 * @param {string} message display text
 * @param {any} details any data will be transferred
 */
function write(place, type, message, details) {
    // const [mainWindow] = BrowserWindow.getAllWindows();
    const wins = BrowserWindow.getAllWindows();
    const mainWindow = wins[wins.length - 1];
    if (mainWindow) {
        mainWindow.webContents.send(IPC_RENDER, 'statusbar', {
            place,
            type,
            message,
            details,
        });
    }
}

export default {
    message: BarMessage,
    write,
};
