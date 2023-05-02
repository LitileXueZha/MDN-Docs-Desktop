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
            window.worker = new SharedWorker('/js/web-worker.js', { type: 'module' });
            window.worker.port.start();
        }
        // Once listener
        const onMessage = (e: MessageEvent) => {
            const { task: doneTask, data } = e.data;
            if (doneTask === task) {
                resolve(data);
                window.worker.port.removeEventListener('message', onMessage);
            }
        };
        window.worker.port.addEventListener('message', onMessage);
        window.worker.port.addEventListener('error', reject);
        window.worker.port.postMessage({ task, payload });
    });
}

export function initScrollTop($root: HTMLElement) {
    const $sct = $('#scroll-top');
    const sctObserver = new IntersectionObserver((entry) => {
        if (entry[0].intersectionRatio > 0) {
            $sct.classList.add('anim-hide');
        } else {
            $sct.classList.remove('anim-hide');
        }
    }, { root: $root });
    sctObserver.observe($('#sct-observe-helper'));
    $sct.addEventListener('click', () => {
        $root.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
}

// TODO: memorized scroll positions
export function enhancedScroll(this: HTMLElement | null) {
    let { hash } = window.location;
    if (!hash) this?.scrollTo(0, 0);
    else {
        hash = decodeURIComponent(hash);
        // Enchance scroll behavior when click the title
        requestAnimationFrame(() => {
            try {
                $(hash).scrollIntoView();
            } catch (e) {}
        });
    }
}

export function initDialogs() {
    const $dialogs = document.getElementsByTagName('dialog');
    for (const $el of $dialogs) {
        if ($el.classList.contains('modal')) {
            $el.addEventListener('click', closeByOutsideClick);
        }
    }
    function closeByOutsideClick(this: HTMLDialogElement, ev: MouseEvent) {
        if (ev.target === this) {
            this.close();
        }
    }
}
