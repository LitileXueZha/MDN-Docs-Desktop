import $ from 'src/utils/selector';


/**
 * Control buttons (max/min/close window)
 */
export function initControls() {
    const $controls = $('.control-buttons');

    $controls.addEventListener('click', (ev) => {
        const action = (ev.target as HTMLElement).dataset?.id;
        if (action) {
            mdv.setWindow(action);
        }
    });
    mdv.on('win-max', () => $controls.classList.add('max'));
    mdv.on('win-unmax', () => $controls.classList.remove('max'));
    mdv.getWindow().then((res) => {
        if (res.maximized) {
            $controls.classList.add('max');
        }
    });
}

/**
 * Application menus
 */
export function initMenus() {
    const $menus = $('.menu-list');

    $menus.addEventListener('click', (ev) => {
        const $el = ev.target as HTMLElement;
        const { key } = $el.dataset;
        if (key) {
            const { x, y, height } = $el.getBoundingClientRect();
            const pos = {
                x: Math.round(x),
                y: Math.round(y + height + 1),
            };
            mdv.openMenu(key, pos);
        }
    });
}

/**
 * Run tasks in web worker
 */
export function doInWorker<T>(task: string, payload: any): Promise<T> {
    return new Promise((resolve, reject) => {
        if (!window.worker) {
            window.worker = new Worker('/dist/js/web-worker.js', { type: 'module' });
        }
        // Once listener
        const onMessage = (e: MessageEvent) => {
            const { task: doneTask, data } = e.data;
            if (doneTask === task) {
                resolve(data);
                window.worker.removeEventListener('message', onMessage);
            }
        };
        window.worker.addEventListener('message', onMessage);
        window.worker.addEventListener('error', reject);
        window.worker.postMessage({ task, payload });
    });
}
