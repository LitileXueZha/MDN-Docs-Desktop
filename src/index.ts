import light from '@primer/primitives/dist/js/colors/light';
import dark from '@primer/primitives/dist/js/colors/dark';
import $ from 'src/utils/selector';
import { initControls, initMenus } from 'src/plugins';
import Search from 'src/plugins/Search';
import DocRender from 'src/plugins/DocRender';
import {
    tocH2, highlightCode, preferInterlink, absoluteAssets, externalLinkTip,
} from 'src/plugins/DocAddons';
import { initStatusbar } from 'src/plugins/Bar';
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

    const $sct = $('#scroll-top');
    const sctObserver = new IntersectionObserver((entry) => {
        if (entry[0].intersectionRatio > 0) {
            $sct.style.visibility = 'hidden';
        } else {
            $sct.style.visibility = 'visible';
        }
    }, { root: $root });
    sctObserver.observe($('#sct-observe-helper'));
    $sct.addEventListener('click', () => {
        $root.scrollTo(0, 0);
    });
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
            $root.scrollTo(0, 0);
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
window.addEventListener('keyup', (ev) => {
    if (ev.ctrlKey && ev.code === 'KeyF') {
        const selectedText = window.getSelection()?.toString();
        mdv.findInPage(selectedText || '');
    }
    if (ev.code === 'Slash' || ev.code === 'NumpadDivide') {
        $('#nav-input').focus();
    }
});
