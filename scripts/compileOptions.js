exports.cssCompileOptions = {
    input: {
        index: 'src/index.scss',
        setting: 'src/setting/index.scss',
        'find-widget': 'src/find-widget/index.scss',
    },
    output: {
        file: 'dist/css/[name].css',
        style: 'compressed',
        loadPaths: [
            'node_modules/@primer/primitives/dist/scss',
            'node_modules/highlight.js/styles',
        ],
        sourceMap: true,
    },
};

exports.htmlCompileOptions = {
    input: {
        index: 'src/index.html',
        setting: 'src/setting/index.html',
        'find-widget': 'src/find-widget/index.html',
    },
    template: 'src/_template.html',
    output: {
        file: 'dist/[name].html',
    },
};
