import path from 'path';
import json from '@rollup/plugin-json';
import ts from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';


export default {
    input: {
        index: 'index.ts',
    },
    output: {
        dir: path.join(__dirname, '../dist'),
        entryFileNames: '[name].js',
        format: 'es',
    },
    plugins: [
        commonjs(),
        nodeResolve(),
        json(),
        ts(),
    ],
};
