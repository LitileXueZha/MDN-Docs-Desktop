const util = require('util');

/**
 * Time logger
 *
 * Usage:
 * ```js
 * log(100, '%c costs %c', 'build', 11);
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
        ts = 0;
    }
    const { isTTY } = process.stdout;
    let i = 0;
    msg = msg.replaceAll('%c', () => {
        const arg = args[i++];
        if (isTTY) {
            return util.inspect(arg, { colors: true });
        }
        return arg;
    });
    let tsMessage = '';
    if (ts > 0) {
        tsMessage = ts < 1000 ? `+${ts}ms` : `+${Math.round(ts / 1000)}s`;
        if (isTTY) {
            // magenta
            tsMessage = `\x1b[35m${tsMessage}\x1b[0m`;
        }
    }
    process.stdout.write(`  ${msg} ${tsMessage}\n`);
}

module.exports = log;
