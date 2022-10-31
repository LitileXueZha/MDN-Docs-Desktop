/* eslint-env browser */
import { ipcRenderer, contextBridge } from 'electron';
import {
    IPC_APPLICATION_MENU,
    IPC_APPLY_SETTINGS,
    IPC_CONTEXT_MENU,
    IPC_CONTROL_BUTTONS,
    IPC_CONTROL_BUTTONS_WINDOW,
    IPC_DETECT_LOCALES,
    IPC_DOWNLOAD_REPO,
    IPC_FIND_IN_PAGE,
    IPC_GET_SETTINGS,
    IPC_OPEN_DIALOG,
    IPC_READ_CONTENT,
    IPC_READ_PARENT_CONTENT,
    IPC_READ_SEARCH_INDEX,
    IPC_READ_TRANSLATE_CONTENT,
    IPC_RELOAD,
    IPC_RENDER,
    IPC_STOP_FIND_IN_PAGE,
    IPC_UPDATE_REPO,
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
        const selectedText = window.getSelection()?.toString();
        const { tagName, isContentEditable } = document.activeElement;
        const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA';
        const data = {
            selectedText,
            editable: isInput || isContentEditable,
        };
        ipcRenderer.send(IPC_CONTEXT_MENU, data);
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
    pickDirectory() {
        return ipcRenderer.invoke(IPC_OPEN_DIALOG, 4);
    },
    openErrorBox(title, content = '') {
        ipcRenderer.send(IPC_OPEN_DIALOG, 5, title, content);
    },
    openMenu(menuKey, pos) {
        ipcRenderer.send(IPC_APPLICATION_MENU, menuKey, pos);
    },
    openSetting() {
        ipcRenderer.send(IPC_OPEN_DIALOG, 3);
    },
    getSettings() {
        return ipcRenderer.invoke(IPC_GET_SETTINGS);
    },
    applySettings(settings) {
        ipcRenderer.send(IPC_APPLY_SETTINGS, settings);
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
    findInPage(...args) {
        if (args[0] === true) {
            ipcRenderer.send(IPC_STOP_FIND_IN_PAGE);
            return;
        }
        ipcRenderer.send(IPC_FIND_IN_PAGE, ...args);
    },
    getTotalLocales(dir) {
        return ipcRenderer.invoke(IPC_DETECT_LOCALES, dir);
    },
    downloadRepo() {
        ipcRenderer.send(IPC_DOWNLOAD_REPO);
    },
    updateRepo() {
        ipcRenderer.send(IPC_UPDATE_REPO);
    },
};

contextBridge.exposeInMainWorld('mdv', exposedAPIs);
contextBridge.exposeInMainWorld('webviewBridge', exposedAPIs);

ipcRenderer.on(IPC_RENDER, onMainMessage);
