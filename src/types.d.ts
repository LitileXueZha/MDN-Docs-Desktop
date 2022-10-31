type scopes =
    'win-max' | 'win-unmax' |
    'find-widget' |
    'statusbar'

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

type BarStatus = {
    place: 'message' | 'custom' | 'app',
    type: 'info' | 'warn' | 'error' | 'loading' | 'done',
    message: string,
    details: any,
}

interface IMDV {
    getVersions(): versions;
    openContextMenu(): void;
    setWindow(action: string): void;
    getWindow(): Promise<any>;
    openDialog(id: number): void;
    pickDirectory(): Promise<any>;
    openErrorBox(title: string, content?: string);
    openMenu(menuId: string, pos: {}): void;
    openSetting(): void;
    getSettings(): any;
    applySettings(settings: any): void;
    getCurrentDocs(): Promise<Doc>;
    getParentDocs(): Promise<Doc[]>;
    getOtherTranslations(slug: string): Promise<Doc[]>;
    getSearchIndex(locale: string): Promise<SearchResult[]|null>;
    findInPage(text: string, options?: any): void;
    findInPage(stop: boolean): void;
    getTotalLocales(dir?: string): Promise<number>;
    downloadRepo(): void;
    updateRepo(): void;

    on(scope: scopes, listener: Function): void;
}

declare interface Window {
    mdv: IMDV;
    worker: Worker,
}
declare const mdv: IMDV;
declare module 'marked';
declare const __DEV__: boolean;
