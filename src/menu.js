'use strict';
const {BrowserWindow, Menu, app} = require('electron');
const dialog = require('./dialog');
const appName = app.getName();

module.exports = dispatch => {
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
					label: 'Open...',
					accelerator: 'Command+O',
					click() {
						dialog(dispatch);
					}
				},
				{
					label: 'Alway On Top',
					accelerator: 'Command+T',
					click() {
						const win = BrowserWindow.getAllWindows()[0];
						win.setAlwaysOnTop(true);
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
