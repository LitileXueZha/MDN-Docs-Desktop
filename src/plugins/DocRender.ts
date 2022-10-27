import { doInWorker } from 'src/plugins';


class DocRender {
    _$refs: any;
    current: Doc;
    parents: Doc[];
    translations: Doc[];
    title: string;
    _localeDocs: Map<string, any>;
    _addon: any;
    [key: string]: any,

    constructor() {
        this._$refs = {};
        this.current = {} as any;
        this.parents = [];
        this.translations = [];
        this.title = '';
        this._localeDocs = new Map();
        this._addon = null;
    }

    /**
     * @param doms needs `{ title, content, breadcrumb, lang, noTranslate }`
     */
    xRef(doms: Object) {
        this._$refs = doms;
    }

    async render() {
        const res = await mdv.getCurrentDocs();
        this.current = res;

        if (res) {
            this._localeDocs.clear();

            const data = await doInWorker('parse-docs', res);
            this._renderBody(data);
            this._localeDocs.set(res.locale, data);

            this.fetchParents();
            this.fetchTranslation();
        }
    }

    use(...addons: Function[]) {
        if (addons.length === 0) return;

        let composedAddon = addons[0];
        if (addons.length > 1) {
            composedAddon = addons
                .map((fn) => (next: any) => (...args: any) => {
                    fn(...args);
                    next(...args);
                })
                .reduce((f, g) => (next: any) => f(g(next)));
            composedAddon = composedAddon(() => {});
        }

        this._addon = composedAddon;
    }

    async fetchParents() {
        const parents = await mdv.getParentDocs();
        this.parents = parents;
        const parentDocs = await doInWorker<any>('parse-docs-lazy', parents);

        const $breadcrumb: HTMLElement = this._$refs.breadcrumb;
        const $frag = document.createDocumentFragment();
        const addItem = (text: string, url?: string) => {
            const $li = document.createElement('li');
            $li.className = 'breadcrumb-item';
            if (url) {
                const $a = document.createElement('a');
                $a.href = url;
                $a.textContent = text;
                $li.appendChild($a);
            } else {
                $li.textContent = text;
            }
            $frag.appendChild($li);
        };
        for (let i = 0, len = parents.length; i < len; i++) {
            if (parents[i]) {
                addItem(parentDocs[i].attributes.title, parents[i].url);
            }
        }
        addItem(this.title);
        $breadcrumb.innerHTML = '';
        $breadcrumb.appendChild($frag);
    }

    async fetchTranslation() {
        const translations = await mdv.getOtherTranslations(this.current.slug);
        this.translations = [this.current];

        const $lang: HTMLSelectElement = this._$refs.lang;
        const $noTranslate: HTMLElement = this._$refs.noTranslate;
        const $frag = document.createDocumentFragment();
        for (const doc of translations) {
            if (doc.locale === this.current.locale) continue;

            this.translations.push(doc);
            const $option = document.createElement('option');
            $option.value = doc.locale;
            $option.textContent = doc.native;
            $frag.appendChild($option);
        }
        $lang.innerHTML = `<option value='${this.current.locale}'>${this.current.native}</option>`;
        $lang.appendChild($frag);
        $lang.onchange = this._onTranslationChange;

        if (this.translations.length === 1) {
            $noTranslate.classList.remove('hidden');
        } else {
            $noTranslate.classList.add('hidden');
        }
    }

    _renderBody(data: any) {
        const { attributes, html } = data;
        const { title, slug } = attributes;

        this._$refs.content.innerHTML = html;
        this._$refs.title.textContent = title;
        document.title = `${title} - MDN Docs Desktop`;
        this.title = title;
        this._addon?.(this);
    }

    _onTranslationChange = async () => {
        const { value } = this._$refs.lang as HTMLSelectElement;
        if (value === this.current.locale) {
            return;
        }

        const current = this.translations.find((d) => d.locale === value);
        if (current) {
            // Try to load from parsed docs
            let data = this._localeDocs.get(current.locale);
            if (!data) {
                data = await doInWorker('parse-docs', current);
                this._localeDocs.set(current.locale, data);
            }
            this.current = current;
            this._renderBody(data);
            window.history.replaceState({}, '', current.url);
            this.fetchParents();
        }
    };
}

export default DocRender;
