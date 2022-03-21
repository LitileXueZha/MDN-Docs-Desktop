exports.cssCompileOptions = {
    input: {
        index: 'src/index.scss',
    },
    output: {
        file: 'dist/css/[name].css',
        style: 'compressed',
        loadPaths: ['node_modules/@primer/primitives/dist/scss'],
        sourceMap: true,
    },
};

exports.htmlCompileOptions = {
    input: {
        index: 'src/index.html',
        setting: 'src/setting/index.html',
    },
    template: 'src/_template.html',
    output: {
        file: 'dist/[name].html',
    },
};
