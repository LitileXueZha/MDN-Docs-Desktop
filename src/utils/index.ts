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
