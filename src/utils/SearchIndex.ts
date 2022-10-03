/**
 * Quick references:
 * - fuzzy-search
 * - flexsearch
 * - https://developer.mozilla.org/api/v2/search
 */


class SearchIndex {
    MAX: number;
    DELIMITER: RegExp;
    data: Map<string, any>;

    constructor() {
        this.MAX = 6;
        this.DELIMITER = /\s+/;
        this.data = new Map();
    }

    add(data: SearchResult[], locale: string) {
        for (const index of data) {
            const { title, url } = index;
            const id = title.toLowerCase();
            let item = this.data.get(id);
            if (!item) {
                item = { title };
                this.data.set(id, item);
            }
            // Different translations with the same title
            if (!item[locale]) {
                item[locale] = [];
            }
            // Different urls (document) may have the same title
            item[locale].push(url);
        }
    }

    query(word: string, locale: string): SearchResult[] {
        const titles = this.data.keys();
        const indexStartsWith = [];
        const indexContains = [];
        const iWord = word.toLowerCase();
        // At least two characters can be meaningful
        const containWords = word.split(this.DELIMITER).filter((s) => s.length > 1);

        for (const title of titles) {
            const rawTitle = this.data.get(title).title;
            if (title.startsWith(iWord)) {
                indexStartsWith.push({
                    id: title,
                    mark: SearchIndex.markRangeSanitize(rawTitle, 0, word),
                });
                continue;
            }
            let idx = -1;
            let containIdx = -1;
            for (let i = 0, len = containWords.length; i < len; i++) {
                idx = title.indexOf(containWords[i].toLowerCase());
                // idx = rawTitle.indexOf(containWords[i]);
                if (idx > -1) {
                    containIdx = i;
                    break;
                }
            }
            if (idx > -1) {
                indexContains.push({
                    id: title,
                    mark: SearchIndex.markRangeSanitize(rawTitle, idx, containWords[containIdx]),
                });
            }
        }
        // TODO: Match times as priority
        // indexContains.sort()

        const result = [];
        const findKeys = [...indexStartsWith, ...indexContains];
        for (const key of findKeys) {
            const urls = this.data.get(key.id);
            if (urls) {
                // May be in english
                const links = urls[locale] || urls['en-us'];
                if (links) {
                    for (const url of links) {
                        result.push({ title: key.mark, url });
                    }
                }
            }
            if (result.length >= this.MAX) {
                break;
            }
        }
        return result;
    }

    static markRangeSanitize(text: string, startIndex: number, word: string) {
        const ESCAPE: any = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
        };
        const strs = [];
        const endIndex = startIndex + word.length - 1;
        for (let i = 0, len = text.length; i < len; i++) {
            if (i === startIndex) {
                strs.push('<mark>');
            }
            const w = text[i];
            if (startIndex <= i && i <= endIndex) {
                // w = word[i - startIndex];
            }
            strs.push(ESCAPE[w] ?? w);
            if (i === endIndex) {
                strs.push('</mark>');
            }
        }
        return strs.join('');
    }

    static sanitize(content: string) {
        // Reserved characters
        const ESCAPE: any = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
        };
        const strs = [];
        for (let i = 0, len = content.length; i < len; i++) {
            strs.push(ESCAPE[content[i]] ?? content[i]);
        }
        return strs.join('');
    }
}

export default SearchIndex;
