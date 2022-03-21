type scopes = 'win-max' | 'win-unmax';

type versions = {
    chrome: string,
    electron: string,
    node: string,
    v8: string,
    [key: string]: string,
}

interface IMDV {
    getVersions(): versions;
    openContextMenu(): void;
    setWindow(action: string): void;
    openDialog(id: number): void;
    openMenu(menuKey: string): void;
    on(scope: scopes, listener: Function): void;
}

declare const mdv: IMDV;
