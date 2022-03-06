const util = require('util');

/**
 * Time logger
 *
 * Usage:
 * ```js
 * log(100, '%c costs %c', 'build', 11);
 * log(Error);
 * log.start = Date.now();
 * log('%c', 'colorful');
 * ```
 *
 * @param {number} ts
 * @param {string} msg
 * @param  {...any} args
 */
function log(ts, msg, ...args) {
    if (typeof ts !== 'number') {
        args.unshift(msg);
        msg = ts;
        ts = log.start ? Date.now() - log.start : 0;
        log.start = undefined;
    }
    if (typeof msg === 'object') {
        console.error(msg);
        return;
    }
    const tsFormat = ts < 1000 ? `${ts}ms` : `${Math.round(ts / 1000)}s`;
    const { isTTY } = process.stdout;
    let i = 0;
    msg = msg.replaceAll('%c', (s) => {
        if (isTTY) {
            return util.inspect(args[i++], { colors: true });
        }
        return s;
    });
    // magenta
    process.stdout.write(`  ${msg} \x1b[35m+${tsFormat}\x1b[0m\n`);
}

module.exports = log;
