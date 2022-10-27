import path from 'path';
import fs from 'fs';
import { defineConfig } from 'rollup';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import ts from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import virtual from '@rollup/plugin-virtual';
import image from '@rollup/plugin-image';
import replace from '@rollup/plugin-replace';


const IN_PRODUCTION = process.env.NODE_ENV === 'production';
const DIR_OUTPUT = path.join(__dirname, 'dist');

const ELECTRON = defineConfig({
    external: [
        'fs/promises',
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
        sourcemap: IN_PRODUCTION ? undefined : true,
    },
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            __DEV__: String(!IN_PRODUCTION),
        }),
        alias({
            entries: [
                { find: 'e', replacement: path.resolve(__dirname, 'electron') },
            ],
        }),
        nodeResolve(),
        json(),
        image(),
        IN_PRODUCTION && terser(),
    ],
});
const JS = defineConfig({
    input: {
        index: 'src/index.ts',
        setting: 'src/setting/index.ts',
        'web-worker': 'src/web-worker.ts',
        'find-widget': 'src/find-widget/index.ts',
    },
    output: {
        dir: DIR_OUTPUT,
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        format: 'es',
        sourcemap: IN_PRODUCTION ? undefined : 'inline',
    },
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            __DEV__: String(!IN_PRODUCTION),
        }),
        virtual({
            'in-plugin/sse': IN_PRODUCTION ? '' : fs.readFileSync('src/sse.js', 'utf-8'),
        }),
        // IMPORTANT: this typescript plugin must place before  '@rollup/plugin-node-resolve'
        // otherwise will occur some errors of "Circular dependencies"
        ts({ tsconfig: 'src/tsconfig.json' }),
        commonjs(),
        nodeResolve(),
        json(),
        IN_PRODUCTION && terser(),
    ],
    // perf: true,
    onwarn(warnings, warn) {
        if (warnings.code === 'UNRESOLVED_IMPORT') {
            // Modules are resolved by typescript
            return;
        }
        if (warnings.code === 'EVAL') {
            // eval() is currently necessary for Macros
            return;
        }
        warn(warnings);
    },
});

export default [ELECTRON, JS];
