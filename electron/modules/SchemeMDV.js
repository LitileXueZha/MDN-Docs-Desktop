import path from 'path';
import fs from 'fs/promises';
import { protocol } from 'electron';
import aps from 'e/modules/AppSettings';

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
    // The project root === ../dist
    const DIR_ROOT = path.resolve(__dirname, '..');
    const INDEX = path.join(DIR_ROOT, 'dist/index.html');
    const REG_DOC = /^\/([a-z-]+)\/docs/i;

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
