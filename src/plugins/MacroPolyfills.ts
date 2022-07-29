export default {
    Glossary(term: string, label?: string) {
        const base = `/${this.env.locale}/docs/Glossary`;
        const subPath = term.replace(/\s+/g, '_');

        return `<a href="${base}/${subPath}">${label || term}</a>`;
    },
    HTMLElement(el: string, label?: string) {
        const elementName = el.toLowerCase();
        const url = `/${this.env.locale}/docs/Web/HTML/Element/${elementName}`;

        return `<a href="${url}"><code>&lt;${label || elementName}&gt;</code></a>`;
    },
    Event(name: string, label?: string) {
        const url = `/${this.env.locale}/docs/Web/Events/${name}`;
        return `<a href="${url}" title="${url}"><code>${label || name}</code></a>`;
    },
    jsxref(api: string, label?: string) {
        let url = `/${this.env.locale}/docs/Web/JavaScript/Reference/`;
        let apiPath = api.replace('()', '').replace('.prototype.', '.');

        if (apiPath.indexOf('/') < 0) {
            apiPath = apiPath.replace('.', '/');
            url += `Global_Objects/${apiPath}`;
        } else {
            url += api;
        }
        return `<a href="${url}"><code>${label || api}</code></a>`;
    },
    domxref(api: string, label?: string) {
        let url = `/${this.env.locale}/docs/Web/API/`;
        const apiPath = api.replace(/\s+/g, '_')
            .replace('()', '').replace('.prototype.', '.')
            .replace(/\./g, '/');

        url += apiPath;
        return `<a href="${url}"><code>${label || api}</code></a>`;
    },
    htmlattrxref(attribute: string, el?: string, label?: string) {
        let url = `/${this.env.locale}/docs/Web/HTML/`;
        const attr = attribute.toLowerCase();
        if (el) {
            url += `Element/${el}`;
        } else {
            url += 'Global_attributes';
        }
        url += `#attr-${attr}`;
        return `<a href="${url}"><code>${label || attr}</code></a>`;
    },
    htmlattrdef(attribute: string) {
        return `<a id="attr-${attribute}" href="#attr-${attribute}"><b><code>${attribute}</code></b></a>`;
    },
    CSSxRef(name: string, label?: string) {
        const SPECIALS: any = {
            '&lt;color&gt;': 'color_value',
            '&lt;flex&gt;': 'flex_value',
            '&lt;position&gt;': 'position_value',
        };
        let slug = name.replace(/&lt;(.*)&gt;/g, '$1');
        if (name in SPECIALS) {
            slug = SPECIALS[name];
        }
        const url = `/${this.env.locale}/docs/Web/CSS/${slug}`;
        const displayName = (label || name).toLowerCase();
        return `<a href="${url}"><code>${displayName}</code></a>`;
    },
    SVGElement(el: string) {
        const url = `/${this.env.locale}/docs/Web/SVG/Element/${el}`;
        return `<a href="${url}"><code>&lt;${el}&gt;</code></a>`;
    },
    SpecName(name: string, anchor?: string, label?: string) {
        return `<span class="specification">${label || name}</span>`;
    },
    readonlyInline() {
        return '<span class="readonly">readonly</span>';
    },
    Experimental_Inline() {
        return '<svg class="mdv-icon"><title>Experimental</title><use xlink:href="#ion-flask" /></svg>';
    },
} as any;
