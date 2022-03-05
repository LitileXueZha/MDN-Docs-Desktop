/* eslint-env browser */
import { ipcRenderer } from 'electron';


window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type]);
    }
    document.getElementById('open').addEventListener('click', () => {
        ipcRenderer.send('opendialog', 1);
    });
    document.getElementById('open1').addEventListener('click', () => {
        ipcRenderer.send('opendialog', 2);
    });
    document.getElementById('open2').addEventListener('click', () => {
        ipcRenderer.send('opendialog', 3);
    });
});
