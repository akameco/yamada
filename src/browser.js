'use strict';
const {ipcRenderer, remote} = global.require('electron');
const {app, Menu, MenuItem} = remote;

let keepAspectRatio = false;
const menu = new Menu();
menu.append(new MenuItem({
	label: 'ファイルを開く...',
	click: () => ipcRenderer.send('open')
}));
menu.append(new MenuItem({
	label: 'アスペクト比を維持',
	type: 'checkbox',
	checked: keepAspectRatio,
	click: () => {
		keepAspectRatio = !keepAspectRatio;
	}
}));
menu.append(new MenuItem({type: 'separator'}));
menu.append(new MenuItem({
	label: 'yamadaを終了',
	click: () => app.quit()
}));

const getInlineImageStyle = () => {
	const maxOption = keepAspectRatio ? 'max-' : '';
	return `style="${maxOption}width: 100%; ${maxOption}height: 100%"`;
};

window.addEventListener('contextmenu', e => {
	e.preventDefault();
	menu.popup(remote.getCurrentWindow());
}, false);

document.addEventListener('DOMContentLoaded', () => {
	const mainEl = document.querySelector('.main');
	ipcRenderer.on('image', (ev, data) => {
		mainEl.innerHTML = `<img src='${JSON.parse(data)}' ${getInlineImageStyle()}>`;
	});
});
