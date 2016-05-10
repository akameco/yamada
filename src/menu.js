'use strict';
const {BrowserWindow, Menu, app} = require('electron');
const dialog = require('./dialog');
const appName = app.getName();

module.exports = dispatch => {
	const win = BrowserWindow.getAllWindows()[0];
	let isOnTop = win.isAlwaysOnTop();

	const tpl = [
		{
			label: appName,
			submenu: [
				{
					label: `About ${appName}`,
					role: 'about'
				},
				{
					type: 'separator'
				},
				{
					label: 'Services',
					role: 'services',
					submenu: []
				},
				{
					type: 'separator'
				},
				{
					label: `Hide ${appName}`,
					accelerator: 'Command+H',
					role: 'hide'
				},
				{
					label: 'Hide Others',
					accelerator: 'Command+Alt+H',
					role: 'hideothers'
				},
				{
					label: 'Show All',
					role: 'unhide'
				},
				{
					type: 'separator'
				},
				{
					label: '開く...',
					accelerator: 'Command+O',
					click() {
						dialog(dispatch);
					}
				},
				{
					label: '最前面にする',
					accelerator: 'Command+T',
					type: 'checkbox',
					clicked: isOnTop,
					click() {
						isOnTop = win.isAlwaysOnTop();
						win.setAlwaysOnTop(!isOnTop);
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'Quit',
					accelerator: 'Command+Q',
					click() {
						app.quit();
					}
				}
			]
		}
	];

	return Menu.buildFromTemplate(tpl);
};
