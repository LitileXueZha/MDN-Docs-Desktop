import light from '@primer/primitives/dist/js/colors/light';
import dark from '@primer/primitives/dist/js/colors/dark';
import $ from 'src/utils/selector';
import {
    enhancedScroll, initControls, initDialogs, initMenus, initScrollTop,
} from 'src/plugins';
import Search from 'src/plugins/Search';
import DocRender from 'src/plugins/DocRender';
import {
    tocH2, highlightCode, preferInterlink, absoluteAssets, externalLinkTip,
} from 'src/plugins/DocAddons';
import { initStatusbar } from 'src/plugins/Bar';
import keymaps from 'src/plugins/Keymaps';
import 'in-plugin/sse';


async function onReady() {
    initControls();
    initMenus();
    initStatusbar();

    $('#open-setting').addEventListener('click', () => mdv.openSetting());
    const $moreBtn = $('#more');
    const $modal = $('#more-modal') as any;
    $moreBtn.addEventListener('click', () => $modal.showModal());

    console.log(mdv.getVersions());

    const $root = $('#container-root');
    initDocRenderer($root);

    const searchIns = new Search($root);
    searchIns.bindInputEl($('#search') as HTMLInputElement);
    searchIns.bindInputEl($('#nav-input') as HTMLInputElement);

    initScrollTop($root);
    initDialogs();
}

function initDocRenderer($root: HTMLElement) {
    const doc = new DocRender();
    doc.use(tocH2, highlightCode, preferInterlink, absoluteAssets, externalLinkTip);
    doc.xRef({
        title: $('#doc-title'),
        content: $('#mdn-content'),
        breadcrumb: $('#breadcrumb'),
        noTranslate: $('#no-translation'),
        lang: $('#lang-select'),
        toc: $('#toc'),
    });
    const $home = $('.home-page');
    const $doc = $('#doc-container');
    const $search = $('#search') as HTMLInputElement;
    const PATHNAME_HOME = '/index.html';
    let unwantedGoBack = false;
    let lastDisplayURL: string; // fix unexpected popstate event fired by hash change
    const renderBody = async (ev?: PopStateEvent) => {
        if (unwantedGoBack) {
            unwantedGoBack = false;
            return;
        }

        const { pathname, hash } = window.location;
        const urlPathname = decodeURIComponent(pathname).toLowerCase();
        if (urlPathname === lastDisplayURL) {
            enhancedScroll.call($root);
            if (!hash) $root.scrollTo(0, 0);
            else {
                // Enchance scroll behavior when click the title
                requestAnimationFrame(() => $(hash)?.scrollIntoView());
            }
            return;
        }
        if (pathname === '/' || urlPathname === PATHNAME_HOME) {
            lastDisplayURL = pathname;
            $home.classList.remove('hidden');
            $doc.classList.add('hidden');
            $search.value = '';
            return;
        }
        $home.classList.add('hidden');
        $doc.classList.remove('hidden');

        await doc.render();
        console.log(doc.current);
        if (doc.current) {
            const { url } = doc.current;
            if (url !== urlPathname) {
                // Redirect or fallback
                window.history.replaceState({}, '', url);
            }
            lastDisplayURL = url;
            enhancedScroll.call($root);
            return;
        }
        unwantedGoBack = true;
        window.history.back();
    };

    renderBody();
    window.addEventListener('popstate', renderBody);
}


document.addEventListener('DOMContentLoaded', onReady);
window.addEventListener('contextmenu', mdv.openContextMenu);
window.addEventListener('keyup', keymaps);
if (__DEV__) {
    window.addEventListener('error', (ev) => {
        mdv.openErrorBox('Client error', ev.error.stack);
    });
    window.addEventListener('unhandledrejection', (ev) => {
        mdv.openErrorBox('Client unhandledrejection', ev.reason);
    });
}
