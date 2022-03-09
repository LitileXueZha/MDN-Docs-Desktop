// @ts-nocheck
import light from '@primer/primitives/dist/js/colors/light';
import dark from '@primer/primitives/dist/js/colors/dark';
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

    $.id('open')?.addEventListener('click', () => mdv.openDialog(1));
    $.id('open1')?.addEventListener('click', () => mdv.openDialog(2));
    $.id('open2')?.addEventListener('click', () => mdv.openDialog(3));
    console.log(word, { light, dark });
    console.log(mdv.getVersions());
    window.addEventListener('hashchange', (e) => {
        console.log(e);
    });
}


document.addEventListener('DOMContentLoaded', onReady);
window.addEventListener('contextmenu', () => {
    mdv.openContextMenu();
});
