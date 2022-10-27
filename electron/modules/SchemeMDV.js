import path from 'path';
import fs from 'fs/promises';
import { protocol } from 'electron';
import aps from 'e/modules/AppSettings';
import { REG_DOC, REG_DOC_NODEJS } from 'e/constants';

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
            const mimeType = MIME_TYPES[ext];
            let filePath = path.join(DIR_ROOT, pathname);
            let matches;

            if (pathname === '' || pathname === '/') {
                filePath = INDEX;
            } else if (ext && (matches = pathname.match(REG_DOC))) {
                const docAssetsDir = matches[1].toLowerCase() === 'en-us'
                    ? aps.data.contentDir
                    : aps.data.translateDir;
                const assetPath = pathname.replace('/docs', '');

                filePath = path.join(docAssetsDir, 'files', assetPath);
            } else if (REG_DOC_NODEJS.test(pathname)) {
                await fs.access(filePath).catch(() => {
                    filePath = NODEJS_INDEX;
                });
            } else {
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
