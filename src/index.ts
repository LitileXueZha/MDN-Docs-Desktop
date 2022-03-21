// @ts-nocheck
import light from '@primer/primitives/dist/js/colors/light';
import dark from '@primer/primitives/dist/js/colors/dark';
import fm from 'front-matter';
import { marked } from 'marked';
import $ from 'src/utils/selector';
import 'in-plugin/sse';

const word: string = 'Hello world';

async function onReady() {
    const environment = ['node', 'electron', 'chrome'];
    const versions = mdv.getVersions();
    for (const env of environment) {
        const $node = $.id(`${env}-version`);
        if ($node) {
            $node.innerText = versions[env];
        }
    }
    const $controls = $.class('control-buttons')[0];
    $controls.addEventListener('click', (e) => {
        const id = e.target.dataset?.id;
        if (id) {
            mdv.setWindow(id);
        }
    });
    mdv.on('win-max', () => $controls.classList.add('max'));
    mdv.on('win-unmax', () => $controls.classList.remove('max'));

    const $menus = $.class('menu-list')[0];
    $menus.addEventListener('click', (e) => {
        const { key } = e.target.dataset;
        if (key) {
            const { x, y, height } = e.target.getBoundingClientRect();
            const pos = {
                x: Math.round(x),
                y: Math.round(y + height + 1),
            };
            mdv.openMenu(key, pos);
        }
    });

    $.id('open-setting')?.addEventListener('click', () => mdv.openSetting());
    $.id('open')?.addEventListener('click', () => mdv.openDialog(1));
    $.id('open1')?.addEventListener('click', () => mdv.openDialog(2));
    $.id('open2')?.addEventListener('click', () => mdv.openDialog(3));
    console.log(word, { light, dark });
    console.log(mdv.getVersions());
    let unwantedGoBack = false;
    const $container = $('main.container');
    const $home = $.class('home-page')[0];
    const $doc = $.id('doc-container');
    const $content = $.id('mdn-content');
    const $title = $.id('doc-title');
    const $breadcrumb = $.id('breadcrumb');
    const $lang: HTMLElement = $.id('lang-select');
    const PATHNAME_HOME = '/dist/index.html';
    let lastDisplayURL; // fix unexpected popstate event fired by hash change
    window.addEventListener('popstate', (e) => {
        if (unwantedGoBack) {
            unwantedGoBack = false;
            return;
        }

        const { pathname } = window.location;
        const urlPathname = decodeURIComponent(pathname).toLowerCase();

        if (urlPathname === lastDisplayURL) return;
        if (pathname === '/' || urlPathname === PATHNAME_HOME) {
            $home.classList.remove('hidden');
            $doc.classList.add('hidden');
            return;
        }
        $home.classList.add('hidden');
        $doc.classList.remove('hidden');
        mdv.getCurrentDocs().then((res) => {
            console.log(res);
            if (res) {
                const { attributes, body } = fm(res.raw);
                const { title, slug } = attributes;
                console.log(attributes);
                $title.textContent = title;
                $content.innerHTML = res.isMarkdown ? marked.parse(body, { baseUrl: '#' }) : body;
                $container.scrollTop = 0;
                if (urlPathname !== res.url) {
                    // Redirect or fallback in english
                    window.history.replaceState({}, '', res.url);
                }
                lastDisplayURL = res.url;
                mdv.getParentDocs().then((parents) => {
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
                    for (const doc of parents) {
                        if (doc) {
                            const { attributes } = fm(doc.raw);
                            addItem(attributes.title, doc.url);
                        }
                    }
                    addItem(title);
                    $breadcrumb.innerHTML = '';
                    $breadcrumb.appendChild($frag);
                });
                $lang.innerHTML = `<option value='${res.locale}'>${res.native}</option>`;
                mdv.getOtherTranslations(res.slug).then((translations) => {
                    const $frag = document.createDocumentFragment();
                    for (const doc of translations) {
                        const $option = document.createElement('option');
                        $option.value = doc.locale;
                        $option.textContent = doc.native;
                        $frag.appendChild($option);
                    }
                    $lang.appendChild($frag);
                });
                return;
            }
            unwantedGoBack = true;
            window.history.back();
        });
    });
}


document.addEventListener('DOMContentLoaded', onReady);
window.addEventListener('contextmenu', () => {
    mdv.openContextMenu();
});
