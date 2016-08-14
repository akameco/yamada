'use strict';
const {BrowserWindow, Menu, app, shell} = require('electron');
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
					label: `${appName}について`,
					role: 'about'
				},
				{
					type: 'separator'
				},
				{
					label: 'サービス',
					role: 'services',
					submenu: []
				},
				{
					type: 'separator'
				},
				{
					label: `${appName}を隠す`,
					accelerator: 'Command+H',
					role: 'hide'
				},
				{
					label: '他を隠す',
					accelerator: 'Command+Alt+H',
					role: 'hideothers'
				},
				{
					label: 'すべてを表示',
					role: 'unhide'
				},
				{
					type: 'separator'
				},
				{
					label: '終了',
					accelerator: 'Command+Q',
					click() {
						app.quit();
					}
				}
			]
		},
		{
			label: 'ファイル',
			submenu: [
				{
					label: '開く...',
					accelerator: 'Command+O',
					click() {
						dialog(dispatch);
					}
				},
				{
					type: 'separator'
				},
				{
					label: 'シャッフル',
					click() {
						dispatch({type: 'SHUFFLE'});
					}
				}
			]
		},
		{
			label: 'ウインドウ',
			role: 'window',
			submenu: [
				{
					label: '最前面に固定',
					accelerator: 'Command+T',
					type: 'checkbox',
					clicked: isOnTop,
					click() {
						isOnTop = win.isAlwaysOnTop();
						win.setAlwaysOnTop(!isOnTop);
					}
				}
			]
		},
		{
			label: 'ヘルプ',
			role: 'help',
			submenu: [
				{
					label: 'Learn More',
					click() {
						shell.openExternal('https://github.com/akameco/yamada');
					}
				}
			]
		}
	];

	return Menu.buildFromTemplate(tpl);
};
