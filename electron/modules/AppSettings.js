import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { app, ipcMain, nativeTheme } from 'electron';
import { IPC_APPLY_SETTINGS, IPC_GET_SETTINGS } from 'e/constants';

const DEFAULTS = {
    language: 'zh-CN',
    darkMode: false,
    contentDir: '',
    translateDir: '',
    firstLaunch: true,
    lastOpenDoc: '',
};

class AppSettings {
    constructor() {
        this.PATH = path.join(app.getPath('userData'), 'settings.json');
        this.data = this._createStoreProxy(DEFAULTS);
        // Available commands, added after `this.probeCommands()`
        this.commands = [];
        console.log(this.PATH);
    }

    async load() {
        try {
            const rawJson = await fs.readFile(this.PATH, 'utf-8');
            const data = JSON.parse(rawJson);
            if (data.darkMode) {
                nativeTheme.themeSource = 'dark';
            }
            data.firstLaunch = false;
            this.data = this._createStoreProxy(data);
        } catch (error) {
            // Not initialized or parse error
            fs.writeFile(this.PATH, JSON.stringify(DEFAULTS));
        }
        ipcMain.handle(IPC_GET_SETTINGS, this._getAll);
        ipcMain.on(IPC_APPLY_SETTINGS, this._apply);
    }

    async probeCommands() {
        const CMD = {
            git: ['git', ['--version']],
        };
        const commands = Object.keys(CMD);
        const tasks = commands.map((name) => this._probeSpawn(...CMD[name]));
        const result = await Promise.all(tasks);
        for (let i = 0, len = result.length; i < len; i++) {
            if (result[i]) {
                this.commands.push(commands[i]);
            }
        }
    }

    /**
     * Dependency Injection
     *
     * This `AppSettings` module is a low-level module, it's not recommend to
     * be depended or imported by high-level module.
     *
     * But we need some APIs from high-level module indeed, so we could inject
     * these APIs to the low-level module.
     *
     * @param {string} module the higher hierarchy module
     * @param {string} api injected API which needed by `AppSettings`
     * @param {Function} fn
     */
    DI(module, api, fn) {
        if (!this._deps) {
            this._deps = {};
        }
        if (!this._deps[module]) {
            this._deps[module] = {};
        }
        this._deps[module][api] = fn;
    }

    _getAll = () => {
        const settings = this.data;
        return {
            ...settings,
            commands: this.commands,
        };
    };

    _apply = (ev, settings) => {
        if (typeof settings !== 'object') return;

        for (const key in settings) {
            if (key in this.data && settings[key] !== this.data[key]) {
                this.data[key] = settings[key];
                this._applySettingItem(key);
            }
        }
    };

    _applySettingItem = (key) => {
        const value = this.data[key];
        switch (key) {
        case 'darkMode':
            nativeTheme.themeSource = value ? 'dark' : 'system';
            break;
        case 'contentDir':
        case 'translateDir':
            clearTimeout(this._$1timer);
            this._$1timer = setTimeout(() => {
                this._deps.Locales.detect(true);
            }, 10);
            break;
        default:
            break;
        }
    };

    _createStoreProxy(obj) {
        const filePath = this.PATH;
        let timer;
        return new Proxy(obj, {
            get(target, key) {
                return target[key];
            },
            set(target, key, value) {
                // eslint-disable-next-line no-param-reassign
                target[key] = value;
                clearTimeout(timer);
                timer = setTimeout(() => {
                    fs.writeFile(filePath, JSON.stringify(target));
                }, 150);
                return true;
            },
        });
    }

    _probeSpawn(command, args) {
        return new Promise((resolve) => {
            try {
                const cp = spawn(command, args);
                cp.on('error', () => resolve(false));
                cp.on('close', () => resolve(true));
            } catch (e) {
                resolve(false);
            }
        });
    }
}

export default new AppSettings();
