// @ts-nocheck
import light from '@primer/primitives/dist/js/colors/light';
import dark from '@primer/primitives/dist/js/colors/dark';
import $ from 'src/utils/selector';
import { initControls, initMenus } from 'src/plugins';
import Search from 'src/plugins/Search';
import DocRender from 'src/plugins/DocRender';
import { tocH2, highlightCode, preferInterlink } from 'src/plugins/DocAddons';
import 'in-plugin/sse';

const word: string = 'Hello world';

async function onReady() {
    const environment = ['node', 'electron', 'chrome'];
    const versions = mdv.getVersions();
    for (const env of environment) {
        const $node = $(`#${env}-version`);
        if ($node) {
            $node.innerText = versions[env];
        }
    }

    initControls();
    initMenus();

    $('#open-setting').addEventListener('click', () => mdv.openSetting());
    $('#open')?.addEventListener('click', () => mdv.openDialog(1));
    $('#open1')?.addEventListener('click', () => mdv.openDialog(2));
    $('#open2')?.addEventListener('click', () => mdv.openDialog(3));
    console.log(word, { light, dark });
    console.log(mdv.getVersions());
    const doc = new DocRender();
    doc.use(tocH2, highlightCode, preferInterlink);
    doc.xRef({
        title: $('#doc-title'),
        content: $('#mdn-content'),
        breadcrumb: $('#breadcrumb'),
        noTranslate: $('#no-translation'),
        lang: $('#lang-select'),
        toc: $('#toc'),
    });
    const $container = $('main.container');
    const $home = $('.home-page');
    const $doc = $('#doc-container');
    const PATHNAME_HOME = '/dist/index.html';
    let unwantedGoBack = false;
    let lastDisplayURL; // fix unexpected popstate event fired by hash change
    window.addEventListener('popstate', async (ev) => {
        if (unwantedGoBack) {
            unwantedGoBack = false;
            return;
        }

        const { pathname } = window.location;
        const urlPathname = decodeURIComponent(pathname).toLowerCase();

        if (urlPathname === lastDisplayURL) return;
        if (pathname === '/' || urlPathname === PATHNAME_HOME) {
            lastDisplayURL = pathname;
            $home.classList.remove('hidden');
            $doc.classList.add('hidden');
            return;
        }
        $home.classList.add('hidden');
        $doc.classList.remove('hidden');

        await doc.render();
        console.log(doc.current);
        if (doc.current) {
            $container.scrollTop = 0;
            const { url } = doc.current;
            // Redirect or fallback
            if (urlPathname !== url) {
                window.history.replaceState({}, '', url);
            }
            lastDisplayURL = url;
            return;
        }
        unwantedGoBack = true;
        window.history.back();
    });

    const $homeSearch = $('#search');
    const $pageSearch = $('#nav-input');
    const searchIns = new Search($container);
    searchIns.bindInputEl($homeSearch);
    searchIns.bindInputEl($pageSearch);

    const $sct = $('#scroll-top');
    const sctObserver = new IntersectionObserver((entry) => {
        if (entry[0].intersectionRatio > 0) {
            $sct.style.display = 'none';
        } else {
            $sct.style.display = 'block';
        }
    }, { root: $container });
    sctObserver.observe($('#sct-observe-helper'));
    $sct.addEventListener('click', () => {
        $container.scrollTop = 0;
    });
}


document.addEventListener('DOMContentLoaded', onReady);
window.addEventListener('contextmenu', () => {
    mdv.openContextMenu();
});
