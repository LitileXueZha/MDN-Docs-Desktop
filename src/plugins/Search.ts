import { debounce } from 'src/utils';
import { doInWorker } from 'src/plugins';


class Search {
    $body: HTMLElement|null;
    readyLocales: Set<string>;
    pending: boolean;
    $onScroll: HTMLElement;
    autoHide: boolean;
    HIGHLIGHT: string;
    selectIndex: number;

    constructor(onScroll: HTMLElement) {
        this.HIGHLIGHT = 'highlight';
        this.$body = null;
        this.$onScroll = onScroll;
        this.readyLocales = new Set();
        this.pending = false;
        this.selectIndex = -1;
        this.autoHide = true;
    }

    bindInputEl(el: HTMLInputElement) {
        const startSearch = debounce(async (ev: Event) => {
            this.init();
            if (this.pending) return;

            const query = el.value.trim();
            if (query) {
                let locale = window.location.pathname.match(/^\/([\w-]+)\//)?.[1];
                if (!locale) {
                    locale = 'en-US';
                }
                locale = locale.toLowerCase();
                this.pending = true;
                try {
                    let data;
                    if (!this.readyLocales.has(locale)) {
                        this.showLoading(el);
                        data = await mdv.getSearchIndex(locale);
                        if (data) {
                            this.readyLocales.add(locale);
                        }
                    }
                    const result = await doInWorker<SearchResult[]>('search-index', {
                        query,
                        locale,
                        data,
                    });
                    this.showResult(result, el);
                } catch (e) {
                    console.error(e);
                } finally {
                    this.pending = false;
                }
            }
        });
        el.addEventListener('input', startSearch);
        // el.addEventListener('focus', () => {
        //     this.setPositionAt(el);
        //     el.select();
        // });
        el.addEventListener('blur', () => {
            if (this.autoHide) {
                this.hide();
            }
        });
        el.addEventListener('keydown', (ev) => {
            if (!this.$body) return;

            const keyUp = ev.key === 'ArrowUp';
            const keyDown = ev.key === 'ArrowDown';
            if (keyUp || keyDown) {
                let i = this.selectIndex;
                this.$body.children[i]?.classList.remove(this.HIGHLIGHT);

                if (keyDown) i++;
                else i--;
                const endIndex = this.$body.childElementCount - 1;
                if (i > endIndex) i = 0;
                else if (i < 0) i = endIndex;

                this.$body.children[i].classList.add(this.HIGHLIGHT);
                this.selectIndex = i;
                ev.preventDefault();
                return;
            }
            const keyEnter = ev.key === 'Enter';
            if (keyEnter && this.selectIndex > -1) {
                // Bubble up to `this.$body.onclick` and hide
                (this.$body.children[this.selectIndex] as HTMLElement).click();
                el.blur();
            }
        });
    }

    showResult(result: SearchResult[], el: HTMLElement) {
        if (!this.$body) return;

        let html: string;
        if (result.length > 0) {
            const { paddingLeft } = getComputedStyle(el);
            html = result
                .map(({ title, url }) => `
                    <a class="result-item" href="${url}" style="padding: 8px ${paddingLeft};">
                        <div class="title">${title}</div>
                        <div class="url">${url}</div>
                    </a>
                `).join('');
        } else {
            html = `
                <div class="no-result">
                    <!--<svg class="mdv-icon"><use xlink:href="#ion-walk" /></svg>-->
                    <i class="mdv-icon">🐷</i>
                    <div>无结果</div>
                </div>
            `;
        }

        this.$body.innerHTML = html;
        this.setPositionAt(el);
    }

    showLoading(el: HTMLElement) {
        if (!this.$body) return;

        this.$body.innerHTML = `
            <div class="loading">
                <svg class="mdv-icon"><use xlink:href="#eos-loading" /></svg>
                <div>正在初始化索引...</div>
            </div>
        `;
        this.setPositionAt(el);
    }

    init() {
        if (this.$body) {
            return;
        }
        const $box = document.createElement('div');
        $box.className = 'search-box';
        $box.addEventListener('mouseenter', () => {
            this.autoHide = false;
        });
        $box.addEventListener('mouseleave', () => {
            this.autoHide = true;
        });
        $box.addEventListener('click', () => this.hide());
        this.$body = $box;
        this.$onScroll.appendChild($box);
    }

    hide() {
        if (!this.$body) return;

        this.$body.classList.add('hidden');
        if (this.selectIndex !== -1) {
            this.$body.children[this.selectIndex].classList.remove(this.HIGHLIGHT);
            this.selectIndex = -1;
        }
    }

    setPositionAt(el: HTMLElement) {
        if (!this.$body) return;

        const rect = el.getBoundingClientRect();
        const { left, width } = rect;
        const top = rect.top + this.$onScroll.scrollTop - 32 + rect.height;
        this.$body.style.width = `${width}px`;
        this.$body.style.left = `${left}px`;
        this.$body.style.top = `${top}px`;
        this.$body.classList.remove('hidden');
    }
}

export default Search;
