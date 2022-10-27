import events from 'events';
import { BrowserWindow } from 'electron';

// TODO:
class WindowManager extends events {
    constructor() {
        super();
        this.a = 1;
    }

    register(id, winInstance) {}

    /**
     *
     * @param {string} registerId
     * @param {boolean} alwaysCreate
     * @returns {Promise<BrowserWindow>}
     */
    async open(registerId, alwaysCreate) {}
}

export default new WindowManager();
