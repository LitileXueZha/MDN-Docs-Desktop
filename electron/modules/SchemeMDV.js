import path from 'path';
import fs from 'fs/promises';
import { protocol } from 'electron';

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

        protocol.registerFileProtocol(this.NAME, async (req, callback) => {
            const { url } = req;
            const { hostname, pathname } = new URL(url);

            // Map to root dir's files
            if (hostname === 'internal-files') {
                const ext = path.extname(pathname).substring(1);
                const mimeType = MIME_TYPES[ext];
                let filePath = path.join(DIR_ROOT, pathname);

                if (pathname === '' || pathname === '/') {
                    filePath = INDEX;
                } else {
                    await fs.access(filePath).catch(() => {
                        // historyApiFallback
                        filePath = INDEX;
                    });
                }

                callback({ mimeType, path: filePath, headers: { 'Cache-Control': 'no-store' } });
                return;
            }

            callback({ statusCode: 404 });
        });
    }
}

export default new SchemeMDV();
