/* eslint-env browser */
import { ipcRenderer, contextBridge } from 'electron';
import {
    IPC_CONTEXT_MENU, IPC_CONTROL_BUTTONS, IPC_OPEN_DIALOG, IPC_RENDER,
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
    openDialog(id) {
        ipcRenderer.send(IPC_OPEN_DIALOG, id);
    },
};

contextBridge.exposeInMainWorld('mdv', exposedAPIs);
contextBridge.exposeInMainWorld('webviewBridge', exposedAPIs);

ipcRenderer.on(IPC_RENDER, onMainMessage);
