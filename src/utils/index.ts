export function debounce(fn: Function, delay: number = 250) {
    let timer: any;
    return (...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function throttle(fn: Function, threshold: number = 10, by?: () => number) {
    let lastValue = 0;
    return (...args: any[]) => {
        const curr = by?.();
        if (curr && Math.abs(curr - lastValue) < threshold) {
            lastValue = curr;
            return;
        }
        fn(...args);
    };
}

export function logger(label: string, title: string, detail: any = '') {
    console.log(
        '%c%s%c%s%c%o',
        'color:#fff;background-color:purple;padding:0 4px;',
        label,
        'font-weight:bold;padding:0 4px;',
        title,
        'color:gray',
        detail,
    );
}
