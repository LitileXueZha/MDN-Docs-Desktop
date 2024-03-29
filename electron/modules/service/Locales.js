import fs from 'fs/promises';
import path from 'path';
import { ipcMain } from 'electron';
import aps from 'e/modules/AppSettings';
import { IPC_DETECT_LOCALES } from 'e/constants';
import Text from './LocalesText.json';

class Locales {
    constructor() {
        this.DEFAULT = 'en-us';
        this.list = new Map();
        this.nativeText = new Map(
            Object.entries(Text).map(([k, v]) => [k.toLowerCase(), v]),
        );
    }

    async start() {
        await this.detect(true);
        ipcMain.handle(IPC_DETECT_LOCALES, this._onDetect);
    }

    stop() {
        ipcMain.removeHandler(IPC_DETECT_LOCALES);
    }

    detect = async (clear = false) => {
        if (clear) {
            this.list.clear();
        } else if (!clear && this.list.size > 0) {
            return;
        }

        const { contentDir, translateDir } = aps.data;
        if (contentDir) {
            this._add(this.DEFAULT, contentDir);
        }
        if (translateDir) {
            try {
                const baseDir = path.join(translateDir, 'files');
                const readDirs = await fs.readdir(baseDir);
                // Some locales may be fronzen, leaved empty directory.
                // https://github.com/mdn/translated-content/blob/main/PEERS_GUIDELINES.md#activating-a-locale
                const checkActive = async (lang) => {
                    const langDir = path.join(baseDir, lang);
                    const files = await fs.readdir(langDir);
                    if (files.length > 1 && files.indexOf('_redirects.txt') > -1) {
                        this._add(lang, null, langDir);
                    }
                };
                await Promise.all(readDirs.map(checkActive));
            } catch (e) {}
        }
    };

    _onDetect = async (ev, dir) => {
        if (dir) {
            let size = 0;
            try {
                const baseDir = path.join(dir, 'files');
                const readDirs = await fs.readdir(baseDir);
                size = readDirs.length;
            } catch (e) {}
            return size;
        }
        const english = this.list.has(this.DEFAULT);
        return this.list.size - (english ? 1 : 0);
    };

    _add = (id, base, dir = '') => {
        const languageText = this.nativeText.get(id) || {};
        const localeValues = {
            ...languageText,
            id,
            dir: dir || path.join(base, 'files', id),
        };

        this.list.set(id, localeValues);
    };
}

const locales = new Locales();
aps.DI('Locales', 'detect', locales.detect);

export default locales;
