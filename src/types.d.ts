type scopes = 'win-max' | 'win-unmax';

type versions = {
    chrome: string,
    electron: string,
    node: string,
    v8: string,
    [key: string]: string,
}

type Doc = {
    isMarkdown: boolean,
    raw: string,
    file: string,
    slug: string,
    url: string,
    locale: string,
    native: string,
}

type SearchResult = {
    title: string,
    url: string,
}

interface IMDV {
    getVersions(): versions;
    openContextMenu(): void;
    setWindow(action: string): void;
    getWindow(): Promise<any>;
    openDialog(id: number): void;
    openMenu(menuId: string, pos: {}): void;
    getCurrentDocs(): Promise<Doc>;
    getParentDocs(): Promise<Doc[]>;
    getOtherTranslations(slug: string): Promise<Doc[]>;
    getSearchIndex(locale: string): Promise<SearchResult[]|null>;

    on(scope: scopes, listener: Function): void;
}

declare interface Window {
    mdv: IMDV;
    worker: Worker,
}
declare const mdv: IMDV;
declare module 'marked';
