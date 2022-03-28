/* eslint-env browser */
import { ipcRenderer, contextBridge } from 'electron';
import {
    IPC_APPLICATION_MENU,
    IPC_CONTEXT_MENU,
    IPC_CONTROL_BUTTONS,
    IPC_CONTROL_BUTTONS_WINDOW,
    IPC_OPEN_DIALOG,
    IPC_READ_CONTENT,
    IPC_READ_PARENT_CONTENT,
    IPC_READ_SEARCH_INDEX,
    IPC_READ_TRANSLATE_CONTENT,
    IPC_RELOAD,
    IPC_RENDER,
} from 'e/constants';


const scopeListeners = {};
const register = (scope, listener) => {
    scopeListeners[scope] = listener;
};
const onMainMessage = (ev, scope, ...args) => scopeListeners[scope]?.(...args);

const exposedAPIs = {
    on: register,
    getVersions() {
        return process.versions;
    },
    openContextMenu() {
        ipcRenderer.send(IPC_CONTEXT_MENU);
    },
    setWindow(action) {
        ipcRenderer.send(IPC_CONTROL_BUTTONS, action);
    },
    getWindow() {
        return ipcRenderer.invoke(IPC_CONTROL_BUTTONS_WINDOW);
    },
    openDialog(id) {
        ipcRenderer.send(IPC_OPEN_DIALOG, id);
    },
    openMenu(menuKey, pos) {
        ipcRenderer.send(IPC_APPLICATION_MENU, menuKey, pos);
    },
    openSetting() {
        ipcRenderer.send(IPC_OPEN_DIALOG, 3);
    },
    getCurrentDocs() {
        return ipcRenderer.invoke(IPC_READ_CONTENT);
    },
    getParentDocs() {
        return ipcRenderer.invoke(IPC_READ_PARENT_CONTENT);
    },
    getOtherTranslations(slug) {
        return ipcRenderer.invoke(IPC_READ_TRANSLATE_CONTENT, slug);
    },
    getSearchIndex(locale) {
        return ipcRenderer.invoke(IPC_READ_SEARCH_INDEX, locale);
    },
    reload() {
        ipcRenderer.send(IPC_RELOAD);
    },
};

contextBridge.exposeInMainWorld('mdv', exposedAPIs);
contextBridge.exposeInMainWorld('webviewBridge', exposedAPIs);

ipcRenderer.on(IPC_RENDER, onMainMessage);
