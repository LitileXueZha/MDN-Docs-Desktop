import path from 'path';
import fs from 'fs/promises';
import { protocol } from 'electron';
import aps from 'e/modules/AppSettings';
import { REG_DOC, REG_DOC_NODEJS } from 'e/constants';
import {slugToFolder} from 'e/modules/util';

export const MDV_NAME = 'mdv';
export const MDV_SCHEME = {
    scheme: MDV_NAME,
    privileges: {
        secure: true, standard: true, supportFetchAPI: true, corsEnabled: true,
    },
};

const MIME_TYPES = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
};
/**
 * In-app scheme `mdv` (alias of MDN Docs Viewer)
 */
export function registerSchemeMDV() {
    // Bundle all files in dist/
    // The project root === ./
    const DIR_ROOT = __dirname;
    const INDEX = path.join(DIR_ROOT, 'index.html');
    const NODEJS_INDEX = path.join(DIR_ROOT, 'nodejs-api.html');

    protocol.registerFileProtocol(MDV_NAME, async (req, callback) => {
        const { url } = req;
        const { hostname, pathname } = new URL(url);

        /**
         * Host: internal-files
         *
         * Map to the root dir's files.
         * @example `mdv://internal-files/dist/index.html`
         */
        if (hostname === 'internal-files') {
            const ext = path.extname(pathname).substring(1);
            // Such as "for...of" "try..catch" is not valid extname.
            const validExt = pathname.lastIndexOf(`..${ext}`) < 0;
            const mimeType = MIME_TYPES[ext];
            let filePath = path.join(DIR_ROOT, pathname);
            let matches;

            if (pathname === '' || pathname === '/') {
                filePath = INDEX;
            } else if (validExt && ext && (matches = pathname.match(REG_DOC))) {
                const lang = matches[1].toLowerCase();
                const mdnFolder = slugToFolder(pathname);
                const assetPath = mdnFolder.replace('/docs', '');

                filePath = path.join(aps.data.contentDir, 'files', assetPath.replace(lang, 'en-us'));
                if (lang !== 'en-us') {
                    // Find assets in translated-content first, if failed,
                    // it mostly at content.
                    const i18nAsset = path.join(aps.data.translateDir, 'files', assetPath);
                    try {
                        await fs.access(i18nAsset);
                        filePath = i18nAsset;
                    } catch (e) {}
                }
            } else if (REG_DOC_NODEJS.test(pathname)) {
                if (pathname.endsWith('.json')) {
                    // Request for jsondata, should not try the index
                } else {
                    await fs.access(filePath).catch(() => {
                        filePath = NODEJS_INDEX;
                    });
                }
            } else {
                const mdnFolder = slugToFolder(pathname);
                filePath = path.join(DIR_ROOT, mdnFolder);
                await fs.access(filePath).catch(() => {
                    // historyApiFallback
                    filePath = INDEX;
                });
            }

            callback({ mimeType, path: filePath });
            return;
        }

        callback({ statusCode: 404 });
    });
}
