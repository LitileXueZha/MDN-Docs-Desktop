import $ from 'src/utils/selector';

export default function keymaps(ev: KeyboardEvent) {
    switch (ev.code) {
    case 'KeyF': {
        if (ev.ctrlKey) {
            const selectedText = window.getSelection()?.toString();
            mdv.findInPage(selectedText || '');
        }
        break;
    }
    case 'KeyR':
        if (ev.ctrlKey) {
            window.location.reload();
        }
        break;
    // Focus on search-box (only worked in MDN)
    case 'Slash':
    case 'NumpadDivide': {
        const $search = $('#nav-input') as HTMLInputElement;
        if ($search) {
            $search.focus();
            $search.select();
        }
        break;
    }
    default:
        break;
    }
}
