import $ from 'src/utils/selector';
import 'in-plugin/sse';


async function onReady() {
    const $findInPage = $('#find-in-page');
    const $result = $findInPage.getElementsByClassName('result')[0] as HTMLElement;
    const $findIn = $('#find-input') as HTMLInputElement;
    const Actions: any = {
        close() {
            $findIn.value = '';
            $result.textContent = '0/0';
            mdv.findInPage(true);
        },
        next() {
            mdv.findInPage($findIn.value, { forward: true, findNext: true });
        },
        prev() {
            mdv.findInPage($findIn.value, { forward: false, findNext: true });
        },
    };
    $findIn.addEventListener('input', () => {
        mdv.findInPage($findIn.value);
    });
    $findIn.addEventListener('keyup', (ev) => {
        if (ev.code === 'Enter') {
            mdv.findInPage($findIn.value, { forward: true, findNext: true });
        }
    });
    $findInPage.addEventListener('click', (ev) => {
        // @ts-ignore
        const aid = ev.target?.dataset?.id;
        Actions[aid]?.();
    });
    mdv.on('find-widget', (res: any) => {
        if (!res) return;
        if (typeof res === 'string') {
            $findIn.value = res;
            return;
        }

        const { activeMatchOrdinal, matches } = res;
        $result.textContent = `${activeMatchOrdinal}/${matches}`;
        if (matches > 0) {
            $findInPage.classList.remove('empty');
        } else {
            $findInPage.classList.add('empty');
        }
    });


    const $findDrag = $findInPage.getElementsByClassName('drag')[0] as HTMLElement;
    let top: number,
        right: number;
    const boundary = {
        top: 44, bottom: 36, left: 4, right: 'BUG_EGG',
    };
    $findDrag.onpointerdown = (ev) => {
        $findDrag.setPointerCapture(ev.pointerId);
        $findInPage.classList.add('dragging');
        const rect = $findInPage.getBoundingClientRect();
        top = rect.top;
        right = document.body.clientWidth - rect.right;
        let idle = true;
        const MAX_TOP = document.body.clientHeight - rect.height - boundary.bottom;
        const MAX_RIGHT = document.body.clientWidth - rect.width - boundary.left;
        const onMove = (evv: PointerEvent) => {
            top += evv.movementY;
            right -= evv.movementX;
            if (top < boundary.top) top = boundary.top;
            else if (top > MAX_TOP) top = MAX_TOP;
            if (right > MAX_RIGHT) right = MAX_RIGHT;
            if (idle) {
                idle = false;
                $findInPage.style.right = `${right}px`;
                $findInPage.style.top = `${top}px`;
                requestAnimationFrame(() => {
                    idle = true;
                });
            }
        };
        const onRelease = (evv: PointerEvent) => {
            $findDrag.removeEventListener('pointermove', onMove);
            $findDrag.removeEventListener('pointerup', onRelease);
            $findDrag.releasePointerCapture(evv.pointerId);
            $findInPage.classList.remove('dragging');
        };
        $findDrag.addEventListener('pointermove', onMove);
        $findDrag.addEventListener('pointerup', onRelease);
    };
}


document.addEventListener('DOMContentLoaded', onReady);
