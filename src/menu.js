'use strict';
const electron = require('electron');
const dialog = require('./dialog');
const Menu = electron.Menu;
const app = electron.app;
const appName = app.getName();

module.exports = (mainWindow, dispatch) => {
	const tpl = [
		{
			label: appName,
			submenu: [
				{
					label: 'About ' + appName,
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
					label: 'Hide ' + appName,
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
						dialog(mainWindow, dispatch);
					}
				},
				{
					label: 'Alway On Top',
					accelerator: 'Command+T',
					click() {
						mainWindow.setAlwaysOnTop(true);
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
