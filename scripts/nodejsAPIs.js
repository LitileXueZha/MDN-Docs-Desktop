/**
 * Node.js API repository: https://github.com/nodejs/node/tree/main/doc/api
 * Build tools: https://github.com/nodejs/node/tree/main/tools/doc
 */
const path = require('path');
const fs = require('fs/promises');
const { marked } = require('marked');
const yaml = require('js-yaml');
const { minify } = require('html-minifier-terser');
const { versionSort, toLink } = require('./nodejsAPIs-mixins.js');

const NODE_DOC = process.env.NODE_DOC
    || path.join(__dirname, '../../..', 'node/doc/api');
const GROUPS = {
    // General things, globals, more common use
    0: ['documentation','debugger','synopsis','cli','globals','process','url'],
    // Modules
    1: ['assert','async_hooks','buffer','child_process','cluster','console','crypto','dns',
        'errors','events','fs','http','http2','https','inspector','net','os','path',
        'perf_hooks','querystring','readline','repl','stream','string_decoder','timers',
        'tls','tty','dgram','util','vm','worker_threads','zlib'],
    // Deep guides, deprecated, less common use
    2: ['deprecations','async_context','addons','n-api','embedding','corepack',
        'diagnostics_channel','domain','intl','modules','esm','module','packages',
        'permissions','punycode','report','test','tracing','v8','wasi','webcrypto',
        'webstreams'],
};
const REG_MACROS = {
    YAML: /^<!-- YAML/,
    YAML_DEL: /(^\s*<!-- YAML)|(-->\s*$)/g,
    SOURCE: /(?<=<!-- source_link=).*(?= -->)/,
    INTRODUCE: /<!--\s*introduced_in\s*=\s*(v[0-9]+\.[0-9]+\.[0-9]+)\s*-->/,
    TYPE: /\{[^}]+\}/g,
    STABILITY: /Stability:\s*(\d)/,
};

const defaultRenderer = new marked.Renderer();
const renderer = {
    html(html) {
        if (REG_MACROS.YAML.test(html)) {
            const yamlDoc = html.replace(REG_MACROS.YAML_DEL, '');
            const meta = metaInYaml(yamlDoc);
            const result = ['<div class="api_metadata">'];
            const { added, deprecated, removed, napiVersion, changes } = meta;
            if (changes.length > 0) {
                result.push(
                    '<details class="changelog"><summary>History</summary>' +
                    '<table><tr><th>Version</th><th>Changes</th></tr>'
                );
                changes.forEach((change) => {
                    const description = marked.parse(change.description);
                    let { version } = change;
                    if (Array.isArray(version)) {
                        version = version.join(', ');
                    }
                    result.push(`<tr><td>${version}</td><td>${description}</td></tr>`);
                });
                result.push('</table></details>');
            } else {
                result.push(`${added.description}${deprecated.description}${removed.description}`);
            }
            if (napiVersion.description) result.push(napiVersion.description);
            result.push('</div>');
            return result.join('');
        }
        let matches = html.match(REG_MACROS.SOURCE);
        if (matches) {
            const [link] = matches;
            const href = `https://github.com/nodejs/node/tree/main/${link}`;
            return `<p class="source"><strong>Source Code:&nbsp;</strong><a href="${href}">${link}</a></p>`;
        }
        matches = html.match(REG_MACROS.INTRODUCE);
        if (matches) {
            return `<span id="mini-version">${matches[1]}</span>`
        }
        return defaultRenderer.html(html);
    },
    text(text) {
        if (REG_MACROS.TYPE.test(text)) {
            const parts = text.split('`');
            for (let i = 0; i < parts.length; i += 2) {
                const typeMatches = parts[i].match(REG_MACROS.TYPE);
                if (typeMatches) {
                    typeMatches.forEach((typeMatch) => {
                        parts[i] = parts[i].replace(typeMatch, toLink(typeMatch));
                    });
                }
            }
            return parts.join('`');
        }
        return defaultRenderer.text(text);
    },
    blockquote(quote) {
        const matches = quote.match(REG_MACROS.STABILITY);
        if (matches) {
            const className = `api_stability s_${matches[1]}`;
            return quote.replace(/^<p>/, `<p class="${className}">`);
        }
        return defaultRenderer.blockquote(quote);
    },
};

function groupBy(filename) {
    const name = filename.substring(0, filename.length - 3);
    for (const id in GROUPS) {
        if (GROUPS[id].indexOf(name) > -1) {
            return id;
        }
    }
    throw new Error(`${filename} not been grouped`);
}

async function buildIndexes(docPath) {
    const indexPath = path.join(docPath, 'index.md');
    const indexes = {};
    const rawContent = await fs.readFile(indexPath, 'utf-8');
    const REG_MD = /\.md$/;
    const collector = new marked.Renderer();
    collector.link = (href, title, text) => {
        if (REG_MD.test(href)) {
            indexes[href] = text;
        }
    }
    marked.parse(rawContent, { renderer: collector });
    return indexes;
}

async function buildDoc(nodeVersion, docPath = NODE_DOC) {
    const jsondata = {
        version: nodeVersion,
        createAt: new Date(),
        api: {},
    };
    const indexes = await buildIndexes(docPath);
    const files = Object.keys(indexes);
    const buildTask = async (filename) => {
        const id = filename.replace('.md', '');
        const filePath = path.join(docPath, filename);
        const rawContent = await fs.readFile(filePath, 'utf-8');
        // Minify is unnecessary
        // It costs 10x time but only reduce ~0.1M size (the output json ~4.5M)
        const html = marked.parse(rawContent);
        const group = groupBy(filename);
        jsondata.api[id] = {
            id,
            title: indexes[filename],
            file: filename,
            group,
            html,
        };
    };
    marked.use({ renderer });
    await Promise.all(files.map(buildTask));
    // await buildTask('documentation.md')
    // await fs.writeFile('out.html', jsondata.api.documentation.html);
    return jsondata;
}

function metaInYaml(yamlDoc) {
    const meta = yaml.load(yamlDoc);
    const toData = (annotation, versions) => {
        const values = { description: '' };
        if (versions) {
            values.version = Array.isArray(versions) ? versions.join(', ') : versions;
            values.description = `<span>${annotation} ${values.version}</span>`;
        }
        return values;
    };
    meta.added = toData('Added in:', meta.added);
    meta.deprecated = toData('Deprecated since:', meta.deprecated);
    meta.removed = toData('Removed in:', meta.removed);
    meta.napiVersion = toData('N-API version:', meta.napiVersion);
    meta.changes = meta.changes || [];
    if (meta.changes.length > 0) {
        if (meta.added.description) meta.changes.push(meta.added);
        if (meta.deprecated.description) meta.changes.push(meta.deprecated);
        if (meta.removed.description) meta.changes.push(meta.removed);
        meta.changes.sort((a, b) => versionSort(a.version, b.version));
    }
    return meta;
}

// buildDoc('v1.0');
exports.buildDoc = buildDoc;
