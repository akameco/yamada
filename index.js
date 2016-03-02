'use strict';
const ipcRenderer = global.require('electron').ipcRenderer;
const remote = require('electron').remote;
const app = remote.app;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

let menu = new Menu();
menu.append(new MenuItem({ 
  label: 'ファイルを開く...',
  click: () => ipcRenderer.send('open')
}));
menu.append(new MenuItem({ type: 'separator' }));
menu.append(new MenuItem({ 
  label: 'yamadaを終了',
  click: () => app.quit()
}));

window.addEventListener('contextmenu', e => {
  e.preventDefault();
  menu.popup(remote.getCurrentWindow());
}, false);

document.addEventListener('DOMContentLoaded', () => {
  const mainEl = document.querySelector('.main');
  ipcRenderer.on('image', (ev, data) => {
    mainEl.innerHTML = `<img src='${JSON.parse(data)}'>`;
  });
});
