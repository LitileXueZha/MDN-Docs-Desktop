import path from 'path';
import json from '@rollup/plugin-json';

const nodeBuiltins = /(path|fs|stream|child_process|events)/;

export default {
    external: [
        nodeBuiltins,
        // npm packages
        /(electron|debug)/,
    ],
    input: {
        bootstrap: 'electron/bootstrap.js',
        renderer: 'electron/renderer.js',
    },
    output: {
        dir: path.join(__dirname, 'dist'),
        entryFileNames: '[name].js',
        format: 'cjs',
        interop: 'auto',
    },
    plugins: [
        json(),
    ],
};
