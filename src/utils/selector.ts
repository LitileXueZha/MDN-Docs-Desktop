/**
 * Select one HTMLElement
 *
 * Prefer faster `.getElement*()`
 * See https://stackoverflow.com/q/14377590/9471439
 *
 * @param query css selectors
 */
function selector(query: string) {
    if (query[0] === '#') {
        return document.getElementById(query.substring(1)) as HTMLElement;
    }
    if (query[0] === '.') {
        return document.getElementsByClassName(query.substring(1))[0] as HTMLElement;
    }

    return document.querySelector(query) as HTMLElement;
}

export default selector;
