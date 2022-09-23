import { doInWorker } from 'src/plugins';
import DocRender from './DocRender';

/**
 * Table of contents from <h2>
 */
export function tocH2(render: DocRender) {
    const $content: HTMLElement = render._$refs.content;
    const $toc: HTMLElement = render._$refs.toc;
    const $headings = $content.getElementsByTagName('h2');
    if ($headings.length > 0) {
        const htmls = [];
        for (const h2 of $headings) {
            htmls.push(`<li class="toc-item"><a href="#${h2.id}">${h2.textContent}</a></li>`);
        }
        $toc.innerHTML = htmls.join('');
        $toc.classList.remove('hidden');
    } else {
        $toc.classList.add('hidden');
    }
}

/**
 * Highlight.js
 */
export async function highlightCode(render: DocRender) {
    const $content: HTMLElement = render._$refs.content;
    const $codeBlocks = $content.getElementsByTagName('pre');

    if ($codeBlocks.length === 0) return;

    const codes = Array.from($codeBlocks).map((el) => ({
        data: el.textContent,
        className: el.className || el.firstElementChild?.className,
    }));
    const results: any[] = await doInWorker('highlight-code', codes);

    results.forEach((res, i) => {
        const { value, language } = res;
        const html = `<code class="hljs language-${language}">${value}</code>`;
        $codeBlocks[i].innerHTML = html;
    });
}

/**
 * Replace MDN docs url to in-app
 */
export function preferInterlink(render: DocRender) {
    const MDN_URL = 'https://developer.mozilla.org';
    const REG_MDN_DOCS = /https:\/\/developer\.mozilla\.org(\/[^/]+\/docs)/i;
    const $content: HTMLElement = render._$refs.content;
    const $links = $content.getElementsByTagName('a');
    for (const a of $links) {
        const href = a.getAttribute('href');
        // Only replace the doc
        const newHref = href?.replace(REG_MDN_DOCS, '$1');
        if (newHref && newHref !== href) {
            a.href = newHref;
        }
    }
}

/**
 * Add a <div> wrapped <table> for enhanced scroll
 */
export function enhanceTableWrapper() {}

/**
 * Fix the relative path of assets, see supports in `electron/modules/SchemeMDV`
 */
export function absoluteAssets(render: DocRender) {
    const REG_PROTOCOL = /^[a-z]+:/;
    const $content: HTMLElement = render._$refs.content;
    const $images = $content.getElementsByTagName('img');
    const { url } = render.current;
    for (const img of $images) {
        const src = img.getAttribute('src');
        if (!src) continue;
        if (src[0] === '/') continue;
        if (REG_PROTOCOL.test(src)) continue;

        img.src = `${url}/${src}`;
    }
}

/**
 * Add a tip and open icon for external links
 */
export function externalLinkTip(render: DocRender) {
    const REG_PROTOCOL = /^https?:/;
    const $content: HTMLElement = render._$refs.content;
    const $links = $content.getElementsByTagName('a');
    for (const $a of $links) {
        if (!REG_PROTOCOL.test($a.href)) continue;

        $a.insertAdjacentHTML('beforeend', '<svg class="external-icon"><use xlink:href="#ion-open-outline"/></svg>');
        $a.addEventListener('mouseenter', enter);
        $a.addEventListener('mouseleave', leave);
    }

    let $tip = document.getElementsByClassName('external-tip')[0] as HTMLElement;
    if (!$tip) {
        $tip = document.createElement('div');
        $tip.className = 'external-tip hidden';
        document.body.appendChild($tip);
    }

    function enter(this: HTMLAnchorElement, e: MouseEvent) {
        $tip.classList.remove('hidden');
        $tip.textContent = this.href;

        const {
            top, bottom, height, left,
            right,
        } = this.getBoundingClientRect();
        const { clientWidth, clientHeight } = document.documentElement;
        let topTip = top + height + 8;
        let leftTip = e.pageX;
        if (top > clientHeight / 2) {
            topTip = top - $tip.clientHeight;
        }
        if ($tip.offsetWidth + e.pageX > clientWidth) {
            leftTip = clientWidth - $tip.offsetWidth;
        }
        $tip.style.left = `${leftTip - 24}px`;
        $tip.style.top = `${topTip}px`;
    }
    function leave() {
        $tip.classList.add('hidden');
    }
}
