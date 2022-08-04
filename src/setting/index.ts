import 'in-plugin/sse';
import $ from 'src/utils/selector';
import { initControls } from 'src/plugins';

async function onReady() {
    initControls();
    $('#close').addEventListener('click', () => mdv.setWindow('close'));

    const $form = document.forms[0];
    const $lang = $form.language as HTMLSelectElement;
    const $darkMode = $form['dark-mode'] as HTMLInputElement;
    const $content = $form['content-dir'] as HTMLInputElement;
    const $translate = $form['translate-dir'] as HTMLInputElement;
    const $save = $('#save') as HTMLButtonElement;
    const settings = await mdv.getSettings();
    const {
        language,
        darkMode,
        contentDir,
        translateDir,
        commands,
    } = settings;

    $lang.value = language;
    $darkMode.checked = darkMode;
    $content.value = contentDir;
    $translate.value = translateDir;
    $save.addEventListener('click', () => {
        const savedChanges = {
            language: $lang.value,
            darkMode: $darkMode.checked,
            contentDir: $content.value,
            translateDir: $translate.value,
        };
        mdv.applySettings(savedChanges);
        requestAnimationFrame(() => mdv.setWindow('close'));
        // mdv.setWindow('close');
    });

    $content.nextElementSibling?.addEventListener('click', async () => {
        const { canceled, filePaths } = await mdv.openDialogAsync(4);
        if (canceled) return;
        $content.value = filePaths[0] as string;
    });
    const $total = $('#detect-translations').firstElementChild as HTMLSpanElement;
    const setTranslationsNum = (dir?: string) => mdv.getTotalLocales(dir).then((count) => {
        $total.textContent = count.toString();
    });
    setTranslationsNum();
    $translate.nextElementSibling?.addEventListener('click', async () => {
        const { canceled, filePaths } = await mdv.openDialogAsync(4);
        if (canceled) return;
        $translate.value = filePaths[0] as string;
        setTranslationsNum($translate.value);
    });
    $translate.addEventListener('input', () => setTranslationsNum($translate.value));

    const $download = $('#download');
    if (contentDir || translateDir) {
        $download.classList.add('hidden');
    } else {
        $download.addEventListener('click', mdv.downloadRepo);
    }

    const $sync = $('#sync');
    if (commands.indexOf('git') > -1) {
        $sync.addEventListener('click', mdv.updateRepo);
    } else {
        $sync.setAttribute('disabled', 'disabled');
        $download.setAttribute('disabled', 'disabled');
    }
}

document.addEventListener('DOMContentLoaded', onReady);
if (__DEV__) {
    window.addEventListener('contextmenu', mdv.openContextMenu);
}
