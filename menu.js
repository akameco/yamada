'use strict';
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;
const appName = app.getName();
const Menu = electron.Menu;

function setOnTop() {
	const win = BrowserWindow.getAllWindows()[0];
	win.setAlwaysOnTop(true);
}

function createMenu(openDialogFilterDirectory) {
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
						openDialogFilterDirectory();
					}
				},
				{
					label: 'Alway On Top',
					accelerator: 'Command+T',
					click() {
						setOnTop();
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
}

module.exports = createMenu;
