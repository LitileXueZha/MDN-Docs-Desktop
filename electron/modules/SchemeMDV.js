import path from 'path';
import fs from 'fs/promises';
import { protocol } from 'electron';
import aps from 'e/modules/AppSettings';

class SchemeMDV {
    constructor() {
        this.NAME = 'mdv';
        this.SCHEME = {
            scheme: this.NAME,
            privileges: {
                secure: true, standard: true, supportFetchAPI: true, corsEnabled: true,
            },
        };
    }

    register() {
        const MIME_TYPES = {
            html: 'text/html',
            css: 'text/css',
            js: 'application/javascript',
        };
        // The project root === ../dist
        const DIR_ROOT = path.resolve(__dirname, '..');
        const INDEX = path.join(DIR_ROOT, 'dist/index.html');
        const REG_DOC = /^\/([a-zA-Z-]+)\/docs/i;

        protocol.registerFileProtocol(this.NAME, async (req, callback) => {
            const { url } = req;
            const { hostname, pathname } = new URL(url);

            // Map to root dir's files
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
}

export default new SchemeMDV();
