import path from 'path';
import json from '@rollup/plugin-json';
import ts from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import virtual from '@rollup/plugin-virtual';


const IN_PRODUCTION = process.env.NODE_ENV === 'production';
const LIVERELOAD_SCRIPT = `
const sse = new EventSource('http://localhost:8012');
sse.addEventListener('message', (ev) => {
    const data = JSON.parse(ev.data);
    if (data.reload) {
        location.reload();
    }
});
window.addEventListener('unload', () => sse.close());
`;

export default {
    input: {
        index: path.join(__dirname, 'index.ts'),
    },
    output: {
        dir: path.join(__dirname, '../dist'),
        entryFileNames: '[name].js',
        format: 'es',
    },
    plugins: [
        virtual({
            'in-plugin/sse': IN_PRODUCTION ? '' : LIVERELOAD_SCRIPT,
        }),
        commonjs(),
        nodeResolve(),
        json(),
        ts({
            tsconfig: path.join(__dirname, 'tsconfig.json'),
        }),
    ],
    onwarn(warnings, warn) {
        if (warnings.code === 'UNRESOLVED_IMPORT') {
            // Modules are resolved by typescript
            return;
        }
        warn(warnings);
    },
};
