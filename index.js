'use strict';
const ipcRenderer = global.require('electron').ipcRenderer;

document.addEventListener('DOMContentLoaded', () => {
  const mainEl = document.querySelector('.main');
  ipcRenderer.on('image', (ev, data) => {
    mainEl.innerHTML = `<img src='${JSON.parse(data)}'>`;
  });
});
