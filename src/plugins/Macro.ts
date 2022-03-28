/**
 * MDN Macros
 *
 * Macro is a code snippet (like function in JavaScript) which could
 * be reused by MDN contributors. It is not part of content or translate
 * content repository, so we need to transform it by self.
 *
 * Full macros are listed in mdn/yari/kumascript/macros, we just
 * transform that only the basic but not contains translation.
 */

/**
 * macroname is case insensitive.
 */

import MacroPolyfills from 'src/plugins/MacroPolyfills';

const Macros = {
    ...MacroPolyfills,
    env: {},
    unsupport(text: string) {
        return `<span class="macro" title="Not found this Macro polyfill">${text}</span>`;
    },
};

const FUNC_MAPS: any = {};
const REG_MACRO = /(?<!\\){{(.+?)}}/gm;
const REG_MACRO_NAME = /\w+/;

Object.keys(Macros).forEach((name) => {
    if (typeof (Macros as any)[name] === 'function') {
        FUNC_MAPS[name.toLowerCase()] = name;
    }
});

function transform(matchText: string, macroFn: string) {
    try {
        let support = false;
        let js = macroFn.replace(REG_MACRO_NAME, (name: string) => {
            const funcName = FUNC_MAPS[name.toLowerCase()];
            if (funcName) {
                support = true;
                return `Macros.${funcName}`;
            }
            return name;
        });
        if (support) {
            // Missing brackets ()
            if (js.indexOf('(') < 0) {
                js = `${js}()`;
            }
            return eval(js);
        }
    } catch (e) {
        // Supress the error
        // console.error(e);
    }

    return Macros.unsupport(matchText);
}

export default function macro(html: string, environments: Object) {
    Macros.env = environments;
    return html.replace(REG_MACRO, transform);
}
