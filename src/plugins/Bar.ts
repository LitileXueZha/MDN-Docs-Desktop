import $ from 'src/utils/selector';
import { logger } from 'src/utils';

const USE_ICONS = {
    info: '#',
    warn: '#ion-warning',
    error: '#ion-close-circle',
    loading: '#eos-loading',
    done: '#ion-checkmark',
};

export default class Bar {
    _$refs: any;
    status: BarStatus;

    constructor() {
        this._$refs = {};
        this.status = {} as any;
    }

    xRef(doms: any) {
        this._$refs = doms;
    }

    write(data: BarStatus) {
        const { place, type, message } = data;
        if (place === 'message') {
            const $message: HTMLElement = this._$refs.message;
            const $text: HTMLSpanElement = this._$refs.text;
            const $useIcon: HTMLElement = this._$refs.useIcon;
            if (type !== this.status.type) {
                $message.classList.remove(this.status.type);
            }
            $message.classList.add(type);
            $text.textContent = message;
            $useIcon.setAttribute('xlink:href', USE_ICONS[type]);
        }
        this.status = data;
        this._sendLogger();
    }

    _sendLogger() {
        const { type, message, details } = this.status;
        let detail: any;
        if (details?.raw) {
            detail = new TextDecoder().decode(details.raw);
        }
        logger(type, message, detail);
    }
}

export function initStatusbar() {
    const $bar = $('.statusbar');
    const $message = $bar.getElementsByClassName('message')[0];
    const $useIcon = $message.getElementsByTagName('use')[0];
    const $text = $message.getElementsByClassName('text')[0];
    const barInstance = new Bar();
    barInstance.xRef({
        message: $message,
        useIcon: $useIcon,
        text: $text,
    });
    mdv.on('statusbar', (data: BarStatus) => {
        barInstance.write(data);
    });
}
