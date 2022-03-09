import path from 'path';
import fs from 'fs';
import { defineConfig } from 'rollup';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import ts from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import virtual from '@rollup/plugin-virtual';


const IN_PRODUCTION = process.env.NODE_ENV === 'production';
const DIR_OUTPUT = path.join(__dirname, 'dist');

const ELECTRON = defineConfig({
    external: [
        /(path|fs|stream|child_process|events|debug)/,
        'electron', // DO NOT USE REGEXP, WILL BREAK DYNAMIC IMPORT
    ],
    input: {
        bootstrap: 'electron/bootstrap.js',
        renderer: 'electron/renderer.js',
    },
    output: {
        dir: DIR_OUTPUT,
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        format: 'cjs',
        interop: 'auto',
    },
    plugins: [
        alias({
            entries: [
                { find: 'e', replacement: path.resolve(__dirname, 'electron') },
            ],
        }),
        json(),
    ],
});
const JS = defineConfig({
    input: {
        index: 'src/index.ts',
    },
    output: {
        dir: DIR_OUTPUT,
        entryFileNames: '[name].js',
        format: 'es',
        sourcemap: 'inline',
    },
    plugins: [
        virtual({
            'in-plugin/sse': IN_PRODUCTION ? '' : fs.readFileSync('src/sse.js', 'utf-8'),
        }),
        commonjs(),
        nodeResolve(),
        json(),
        ts({ tsconfig: 'src/tsconfig.json' }),
    ],
    onwarn(warnings, warn) {
        if (warnings.code === 'UNRESOLVED_IMPORT') {
            // Modules are resolved by typescript
            return;
        }
        warn(warnings);
    },
});

export default [ELECTRON, JS];
