const IN_PRODUCTION = process.env.NODE_ENV === 'production';

exports.cssCompileOptions = {
    input: {
        index: 'src/index.scss',
        setting: 'src/setting/index.scss',
        'find-widget': 'src/find-widget/index.scss',
        'nodejs-api': 'src/nodejs-api/index.scss',
    },
    output: {
        file: 'dist/css/[name].css',
        style: IN_PRODUCTION ? 'compressed' : 'expanded',
        loadPaths: [
            'node_modules/@primer/primitives/dist/scss',
            'node_modules/highlight.js/styles',
        ],
        sourceMap: IN_PRODUCTION ? undefined : true,
    },
};

exports.htmlCompileOptions = {
    input: {
        index: 'src/index.html',
        setting: 'src/setting/index.html',
        'find-widget': 'src/find-widget/index.html',
        'nodejs-api': 'src/nodejs-api/index.html',
    },
    template: 'src/_template.html',
    output: {
        file: 'dist/[name].html',
    },
};

exports.nodejsCompileOptions = {
    input: undefined,
    output: {
        file: 'dist/nodejs-api.json',
    },
    version: 'v19.0.0',
};
