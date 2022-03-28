import path from 'path';
import fs from 'fs/promises';
import { app, ipcMain } from 'electron';
import { IPC_READ_SEARCH_INDEX } from 'e/constants';
import locales from 'e/modules/Locales';

const STATUS_PENDING = 'pending';
const STATUS_DONE = 'done';

class SearchIndex {
    constructor() {
        this.PATH = path.join(app.getPath('userData'), 'search-indexs');
        this.status = null;
        this._value = new Map();
    }

    async start() {
        ipcMain.handle(IPC_READ_SEARCH_INDEX, this._onRead);
    }

    stop() {
        ipcMain.removeHandler(IPC_READ_SEARCH_INDEX);
    }

    async build() {
        const list = Array.from(locales.list.keys());
        // Build in sequence, don't use parallel, that is too heavy for CPU
        const buildStepBy = async (i) => {
            if (i >= list.length) {
                return;
            }
            await this._buildIndex(list[i]);
            return buildStepBy(i + 1);
        };
        // await Promise.all(list.map(this._buildIndex));

        await buildStepBy(0);
    }

    _onRead = async (ev, locale) => {
        if (!locales.list.has(locale)) {
            locale = locales.DEFAULT;
        }

        const cachedIndex = this._value.get(locale);
        if (cachedIndex) {
            return cachedIndex;
        }

        try {
            const filePath = path.join(this.PATH, `${locale}.json`);
            const rawJson = await fs.readFile(filePath, 'utf-8');
            const indexData = JSON.parse(rawJson);

            this._value.set(locale, indexData);
            return indexData;
        } catch (e) {
            // Uninitialized or broken json file
            await this._buildIndex(locale);
        }
        return this._value.get(locale);
    };

    _buildIndex = async (locale) => {
        this.status = STATUS_PENDING;
        const { dir } = locales.list.get(locale);

        const { readIndexFiles } = await import('e/modules/Workers');
        const result = await readIndexFiles(dir, locale);
        this._value.set(locale, result);
        this.status = STATUS_DONE;

        const filePath = path.join(this.PATH, `${locale}.json`);
        const fileContent = JSON.stringify(result);
        fs.mkdir(this.PATH).catch(() => {});
        fs.writeFile(filePath, fileContent);
    };
}

export default new SearchIndex();
