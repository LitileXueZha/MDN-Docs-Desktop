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
