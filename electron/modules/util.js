const SLUG_FOLDERS = {
    '*': '_star_',
    ':': '_colon_',
    '::': '_doublecolon_',
    '?': '_question_',
};
/**
 * Escape url to file path
 * 
 * See yari/libs/slug-utils/index.js
 */
export function slugToFolder(slug) {
    const replacements = [];
    for (let i = 0, len = slug.length; i < len; i++) {
        const s = slug[i];
        const ss = s + slug[i + 1];
        if (SLUG_FOLDERS[ss]) {
            replacements.push(SLUG_FOLDERS[ss]);
            i++;
        } else if (SLUG_FOLDERS[s]) {
            replacements.push(SLUG_FOLDERS[s]);
        } else {
            replacements.push(s);
        }
    }
    return replacements.join('');
}
