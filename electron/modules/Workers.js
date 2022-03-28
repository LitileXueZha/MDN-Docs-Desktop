/**
 * Tasks run in worker
 *
 * Some operations may block the main process, eg:
 * - I/O intensive, fs APIs
 * - CPU intensive, Zlib/Crypto
 *
 *
 * See https://nodejs.org/en/docs/guides/dont-block-the-event-loop/#what-code-runs-on-the-worker-pool
 *     https://www.electronjs.org/docs/latest/tutorial/performance#3-blocking-the-main-process
 */

import {
    isMainThread, parentPort, Worker, workerData,
} from 'worker_threads';
import fs from 'fs/promises';
import path from 'path';
import { load } from 'js-yaml';


class WorkersNS {
    static async readIndexFiles({ dir, locale }) {
        const REG_FM = /^---([^]+?)---/m;
        const metaIndexs = [];
        const fdir = async (d) => {
            const subDirs = await fs.readdir(d).catch(() => {
                // Not a directory
            });
            if (!subDirs) return;

            let indexPath;
            const fullPaths = [];
            for (const file of subDirs) {
                const subPath = `${d}${path.sep}${file}`;
                if (file === 'index.html' || file === 'index.md') {
                    indexPath = subPath;
                    continue;
                }
                fullPaths.push(subPath);
            }

            if (indexPath) {
                /**
                 * INFO:
                 */
                // const raw = await fs.readFile(indexPath, 'utf-8');
                const fd = await fs.open(indexPath, 'r');
                const raw = await fd.readFile('utf-8');
                const yaml = raw.match(REG_FM)?.[1];
                const metadata = load(yaml || '');
                if (metadata) {
                    const { title, slug } = metadata;
                    const url = `/${locale}/docs/${slug}`;
                    metaIndexs.push({ title, url });
                }
                await fd.close();
            }
            await Promise.all(fullPaths.map(fdir));
        };

        await fdir(dir);
        /**
         * TODO: Popularity
         *
         * metaIndexs.sort();
         *
         * Possible two ways:
         * - Grab from mdn...
         * - Store single-user visited pages, generate the popularity file until reach
         *   a certain number of size or every several days.
         */
        const sortIndexs = metaIndexs.sort((a, b) => {
            // Sort by first alphabet
            if (a.title > b.title) {
                return 1;
            }
            if (a.title < b.title) {
                return -1;
            }
            return 0;
        });
        parentPort.postMessage(sortIndexs);
    }
}

export function readIndexFiles(dir, locale) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
            workerData: {
                task: 'readIndexFiles',
                payload: { dir, locale },
            },
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (exitCode) => resolve());
    });
}

export function other() {}

// In-worker
if (!isMainThread) {
    const { task, payload } = workerData;
    WorkersNS[task]?.(payload);
}
