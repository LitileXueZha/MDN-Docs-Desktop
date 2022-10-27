import 'in-plugin/sse';
import $ from 'src/utils/selector';
import {
    enhancedScroll, initControls, initDialogs, initScrollTop,
} from 'src/plugins';
import { highlightCode, externalLinkTip, preferInterlink } from 'src/plugins/DocAddons';
import DocRender from 'src/plugins/DocRender';
import keymaps from 'src/plugins/Keymaps';

async function onReady() {
    initControls();

    let data: any;
    try {
        data = await fetch('/nodejs-api.json');
        data = await data.json();
    } catch (err) {
        // Maybe the application not bundle with nodejs-api data
    }
    if (!data?.version) return;

    renderVersions(data.version);
    renderIndexes(data.api);

    const $root = $('.container');
    const $body = $('#md-body');
    const doc = {
        _$refs: { content: $body, root: $root },
        render,
    } as DocRender;
    doc.__DATA__ = data.api;
    await doc.render();
    window.addEventListener('popstate', () => doc.render());

    initScrollTop($root);
    initDialogs();
}

const REG_API = /\w\/([\w-]+)\.\w+/;
const INDEX_API = 'documentation';
let avoidIndexesScroll = false; // should avoid when user click the indexes
async function render(this: DocRender) {
    const { pathname } = window.location;
    const matches = pathname.match(REG_API);
    const id = matches?.[1] || INDEX_API;
    if (id === this.lastRenderDoc) {
        enhancedScroll.call(this._$refs.root);
        return;
    }
    const { html } = this.__DATA__[id];
    const $content: HTMLElement = this._$refs.content;
    $content.innerHTML = html;
    this.lastRenderDoc = id;
    enhancedScroll.call(this._$refs.root);
    renderTOC();
    delightfulHeader($content);
    preferInterlink(this);
    await highlightCode(this);
    externalLinkTip(this);

    const $index = $(`.api-item[data-id=${id}]`);
    // Auto scroll the index item to center
    if (!avoidIndexesScroll) {
        $index.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    avoidIndexesScroll = false;
    $('.api-item.active')?.classList.remove('active');
    $index.classList.add('active');
}

function renderIndexes(api: any) {
    const data = Object.values(api);
    data.sort((a: any, b: any) => {
        const diff = a.group - b.group;
        if (diff !== 0) {
            return diff;
        }
        if (a.title > b.title) {
            return 1;
        }
        if (a.title < b.title) {
            return -1;
        }
        return 0;
    });
    let currGroup = 0;
    const html = [];
    for (let i = 0, len = data.length; i < len; i++) {
        const { id, title, group } = data[i] as any;
        if (group > currGroup) {
            currGroup++;
            html.push('<li class="api-item divider"></li>');
        }
        html.push(`<li class="api-item" data-id="${id}">${title}</li>`);
    }
    const $list = $('#indexes .api-list');
    $list.innerHTML = html.join('');
    $list.onclick = (ev: any) => {
        const { id } = ev.target?.dataset;
        const { file } = api[id];
        window.history.pushState({}, '', `/nodejs-api/${file}`);
        dispatchEvent(new Event('popstate'));
        avoidIndexesScroll = true;
    };
}

function renderTOC() {
    const $body = $('#md-body');
    const $headers = $body.querySelectorAll('h2,h3,h4,h5');
    const html = [];
    let currLevel = 2;
    for (const $h2 of $headers) {
        const { id, textContent, tagName } = $h2;
        const level = parseInt(tagName[1], 10);
        const link = `<a href="#${id}">${textContent}</a>`;
        if (level > currLevel) {
            currLevel++;
            html.push(`<ul class="list"><li class="item">${link}`);
        } else if (level < currLevel) {
            while (--currLevel !== level) {
                html.push('</li></ul>');
            }
            html.push(`</li></ul><li class="item">${link}`);
        } else {
            html.push(`</li><li class="item">${link}`);
        }
    }
    html.push('</li>');
    html[0] = html[0].substring(5);
    $('#toc > .list').innerHTML = html.join('');
}

function delightfulHeader($content: HTMLElement) {
    const $h1 = $content.getElementsByTagName('h1')[0];
    const $miniVer = $('#mini-version');
    const $noMini = $('#no-mini-version');
    if ($miniVer) {
        $noMini.classList.add('hidden');
        $miniVer.parentNode?.removeChild($miniVer);
        $h1.appendChild($miniVer);
    } else {
        $noMini.classList.remove('hidden');
    }
    const $source = $content.getElementsByClassName('source')[0];
    if ($source && $source.previousElementSibling !== $h1) {
        $source.parentNode?.insertBefore($source, $source.previousElementSibling);
    }
    const $history = $content.querySelectorAll('.api_metadata details');
    const onClose = function (this: HTMLDetailsElement, ev: Event) {
        if (ev.target === this) {
            this.removeAttribute('open');
        }
    };
    for (const $el of $history) {
        $el.addEventListener('click', onClose);
    }
}

function renderVersions(version: string) {
    const $verions = document.getElementsByClassName('node-version');
    for (const $el of $verions) {
        $el.textContent = version;
    }
}

document.title = 'Node.js 文档 - MDN Docs Desktop';
document.addEventListener('DOMContentLoaded', onReady);
window.addEventListener('contextmenu', mdv.openContextMenu);
window.addEventListener('keyup', keymaps);
