import fs from 'fs/promises';
import path from 'path';
import aps from 'e/modules/AppSettings';
import Text from './LocalesText.json';

class Locales {
    constructor() {
        this.DEFAULT = 'en-us';
        this.list = new Map();
        this.nativeText = new Map(
            Object.entries(Text).map(([k, v]) => [k.toLowerCase(), v]),
        );
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
                for (const dir of readDirs) {
                    this._add(dir, translateDir);
                }
            } catch (e) {}
        }
    };

    _add = (id, base) => {
        const languageText = this.nativeText.get(id) || {};
        const localeValues = {
            ...languageText,
            id,
            dir: path.join(base, 'files', id),
        };

        this.list.set(id, localeValues);
    };
}

export default new Locales();
