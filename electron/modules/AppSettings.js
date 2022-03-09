import fs from 'fs/promises';
import path from 'path';
import { app, nativeTheme } from 'electron';

const DEFAULTS = {
    language: 'zh-CN',
    darkMode: false,
    contentDir: '',
    translateDir: '',
};

class AppSettings {
    constructor() {
        this.PATH = path.join(app.getPath('userData'), 'settings.json');
        this.data = this.createStoreProxy(DEFAULTS);
    }

    async load() {
        try {
            const rawJson = await fs.readFile(this.PATH, 'utf-8');
            const data = JSON.parse(rawJson);
            if (data.darkMode) {
                nativeTheme.themeSource = 'dark';
            }
            this.data = this.createStoreProxy(data);
        } catch (error) {
            // Not initialized or parse error
            fs.writeFile(this.PATH, JSON.stringify(DEFAULTS));
        }
    }

    createStoreProxy(obj) {
        const filePath = this.PATH;
        let timer;
        return new Proxy(obj, {
            get(target, key) {
                return target[key];
            },
            set(target, key, value) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    // eslint-disable-next-line no-param-reassign
                    target[key] = value;
                    fs.writeFile(filePath, JSON.stringify(target));
                }, 150);
                return true;
            },
        });
    }
}

export default new AppSettings();
