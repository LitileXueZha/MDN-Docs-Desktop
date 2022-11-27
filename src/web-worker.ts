import fm from 'front-matter';
import { parse as markedParse } from 'marked';
import hljs from 'highlight.js';
import SearchIndex from 'src/utils/SearchIndex';
import macro from 'src/plugins/Macro';

onconnect = function onConnect(e: MessageEvent) {
    const port = e.ports[0];
    port.onmessage = function onMessage(ev: MessageEvent) {
        const { task, payload } = ev.data;
        const done = (data: any) => port.postMessage({ task, data });

        switch (task) {
        case 'search-index':
            onSearchIndex(payload, done);
            break;
        case 'parse-docs':
            onParseDoc(payload, done);
            break;
        case 'parse-docs-lazy':
            onLazyParseDoc(payload, done);
            break;
        case 'highlight-code':
            onHighlightCode(payload, done);
            break;
        default:
            break;
        }
    };
};

function onParseDoc(data: Doc, done: Function) {
    const { isMarkdown, raw, locale } = data;
    const { attributes, body, bodyBegin } = fm(raw);
    let html = body;

    html = macro(html, { locale });
    if (isMarkdown) {
        html = markedParse(html);
    }

    done({ attributes, html, bodyBegin });
}
/**
 * Only parse front-matter
 */
function onLazyParseDoc(docs: Doc[], done: Function) {
    const result = docs.map((source) => {
        if (source) {
            const { raw } = source;
            const { attributes, body, bodyBegin } = fm(raw);

            return { attributes, html: body, bodyBegin };
        }
        return null;
    });
    done(result);
}

const searchIndex = new SearchIndex();
async function onSearchIndex(params: any, done: Function) {
    const { query, locale, data } = params;

    if (data) {
        searchIndex.add(data, locale);
    }
    const result = searchIndex.query(query, locale);
    done(result);
}

/**
 * Detect code language:
 * - `brush: {name}`       Old MDN formats
 * - `language-{name}`     Added by 'marked'
 */
const REG_LANGUAGE = /(?:brush:\s*|language-)([\w+-]+)/i;
function onHighlightCode(codes: any[], done: Function) {
    const result = [];

    for (let i = 0, len = codes.length; i < len; i++) {
        const { data, className } = codes[i];
        const matches = className?.match(REG_LANGUAGE);
        let res;
        if (matches && hljs.getLanguage(matches[1])) {
            res = hljs.highlight(data, { language: matches[1] });
        } else {
            // Auto hightlight
            res = hljs.highlightAuto(data);
        }
        const { value, language } = res;

        result.push({ value, language });
    }
    done(result);
}
