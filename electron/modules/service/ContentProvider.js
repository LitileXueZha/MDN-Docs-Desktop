import path from 'path';
import { createReadStream } from 'fs';
import readline from 'readline';
import fs from 'fs/promises';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import aps from 'e/modules/AppSettings';
import { IPC_READ_CONTENT, IPC_READ_PARENT_CONTENT, IPC_READ_TRANSLATE_CONTENT } from 'e/constants';
import locales from './Locales';
import {slugToFolder} from 'e/modules/util';

const REG_CONTENT_URL = /^\/([a-z]{2}(-\w+)?)\/docs\/(.+)/;
const REG_REDIRECT_SEPARATOR = /\t+/;
const INDEX_HTML = 'index.html';
const INDEX_MARKDOWN = 'index.md';
const REDIRECT_FILE = '_redirects.txt';

const ERR_INVALID = 1;
const ERR_INCORRECT_SETTGINS = 2;
const ERR_NOT_FOUND = 3;

class ContentProvider {
    constructor() {
        this.redirects = new Map();
        this._loadedRedirects = new Set();
        this._findError = null;
    }

    start() {
        ipcMain.handle(IPC_READ_CONTENT, this._onRead);
        ipcMain.handle(IPC_READ_PARENT_CONTENT, this._onReadParents);
        ipcMain.handle(IPC_READ_TRANSLATE_CONTENT, this._onReadTranslations);
    }

    stop() {
        ipcMain.removeHandler(IPC_READ_CONTENT);
        ipcMain.removeHandler(IPC_READ_PARENT_CONTENT);
        ipcMain.removeHandler(IPC_READ_TRANSLATE_CONTENT);
    }

    _onRead = async (e) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        const url = e.sender.getURL();
        const route = this._normalizedURL(url);
        const doc = await this._getContentByURL(route);

        if (doc) {
            aps.data.lastOpenDoc = doc.path;
            return doc;
        }

        // Strange links, not supported
        // - /en/web/api
        // - /docs/web/html
        dialog.showMessageBox(win, {
            type: 'error',
            title: 'MDN Docs Desktop',
            message: `ContentProvider 未支持文档路径\n${new URL(url).pathname}\n\nError_${this._findError}`,
            noLink: true,
        });
    };

    /**
     * Find the possible file content
     *
     * Maybe the path [dir][url][filename] is:
     * -- translate dir
     * -- fallback to content dir (en-us)
     *   -- found in redirects
     *   -- url
     *     -- index.{md|html}
     * @param {string} url eg: /zh-CN/docs/web/HTML
     */
    async _getContentByURL(url, useFallback = true, redirect = true) {
        const matches = url.match(REG_CONTENT_URL);
        // Invalid url
        if (!matches) {
            this._findError = ERR_INVALID;
            return;
        }

        const locale = matches[1];
        const slug = matches[3];
        const localeValues = locales.list.get(locale);
        // No translation
        if (!localeValues) {
            if (useFallback && locale !== locales.DEFAULT) {
                return this._getContentByURL(url.replace(locale, locales.DEFAULT), false);
            }
            this._findError = ERR_INCORRECT_SETTGINS;
            return;
        }

        // Fix cycle redirects
        if (redirect) {
            const reURL = await this._getRedirectURL(url).catch(() => {});
            // Found redirect
            if (reURL && reURL !== url) {
                return this._getContentByURL(reURL, true, false);
            }
        }

        const { dir, native } = localeValues;
        let folder = path.join(dir, slugToFolder(slug));

        await fs.access(folder).catch(() => {
            folder = false;
        });
        if (!folder) {
            // Fallback
            if (useFallback && locale !== locales.DEFAULT) {
                const fallbackURL = url.replace(locale, locales.DEFAULT);
                return this._getContentByURL(fallbackURL, false);
            }

            // Not found
            this._findError = ERR_NOT_FOUND;
            return;
        }

        let isMarkdown = true;
        let filePath = path.join(folder, INDEX_MARKDOWN);
        const raw = await fs.readFile(filePath, 'utf-8').catch(() => {
            isMarkdown = false;
            filePath = path.join(folder, INDEX_HTML);
            return fs.readFile(filePath, 'utf-8');
        }).catch(() => {
            // Not found index file
            this._findError = ERR_NOT_FOUND;
        });

        if (raw) {
            return {
                path: filePath,
                raw,
                isMarkdown,
                locale,
                slug,
                url,
                native,
            };
        }
    }


    _getRedirectURL = (url) => new Promise((resolve, reject) => {
        const locale = url.split('/')[1];
        if (this._loadedRedirects.has(locale)) {
            resolve(this.redirects.get(url));
            return;
        }

        const { contentDir, translateDir } = aps.data;
        const dir = locale === locales.DEFAULT ? contentDir : translateDir;
        const filePath = path.join(dir, 'files', locale, REDIRECT_FILE);
        const reader = readline.createInterface({
            input: createReadStream(filePath).on('error', reject),
            crlfDelay: Infinity,
        });

        reader.on('error', reject);
        reader.on('line', (line) => {
            if (!line) return;
            if (line[0] === '#') return; // comments

            const [from, to] = line.trim().split(REG_REDIRECT_SEPARATOR);
            const fromURL = from.toLowerCase();
            const toURL = to.toLowerCase();

            this.redirects.set(fromURL, toURL);
        });
        reader.on('close', () => {
            this._loadedRedirects.add(locale);
            resolve(this.redirects.get(url));
        });
    });

    _onReadParents = async (e) => {
        const route = this._normalizedURL(e.sender.getURL());
        const routeSplits = route.split('/');
        const routeParents = [];
        let str = '';
        for (let i = 1, len = routeSplits.length - 1; i < len; i++) {
            str += `/${routeSplits[i]}`;
            // Real parent url at '/zh-cn/docs/....'
            if (i > 2) {
                routeParents.push(str);
            }
        }

        if (routeParents.length > 0) {
            const findTasks = routeParents.map((link) => this._getContentByURL(link));
            const parentDocs = await Promise.all(findTasks);

            return parentDocs;
        }

        return [];
    };

    _onReadTranslations = async (e, slug) => {
        if (!slug) return [];

        const url = e.sender.getURL();
        const { pathname } = new URL(url);
        const currLocale = pathname.match(REG_CONTENT_URL)?.[1].toLowerCase();
        const list = locales.list.values();
        const translations = [];
        const find = async () => {
            const { value, done } = list.next();
            if (done) return;
            if (value.id === currLocale) return find();

            const otherURL = `/${value.id}/docs/${slug.toLowerCase()}`;
            const doc = await this._getContentByURL(otherURL, false);
            if (doc) {
                translations.push(doc);
            }
            return find();
        };

        await find();
        return translations;
    };

    _normalizedURL(originalURL) {
        const { pathname } = new URL(originalURL);
        const route = decodeURIComponent(pathname).toLowerCase();
        let fixDocsURL = route;
        // Fix missing '/docs' slug
        if (route.indexOf('/docs') < 0) {
            fixDocsURL = route.replace(/^\/([\w-]+)/, '/$1/docs');
        }

        return fixDocsURL;
    }
}

export default new ContentProvider();
