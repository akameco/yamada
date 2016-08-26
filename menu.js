'use strict';
const electron = require('electron');
const config = require('./config');
const showDialog = require('./dialog');

const {app, BrowserWindow, Menu, shell} = electron;
const appName = app.getName();

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
					showDialog();
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
				clicked: config.get('alwaysOnTop'),
				click() {
					const win = BrowserWindow.getAllWindows()[0];
					win.setAlwaysOnTop(!win.isAlwaysOnTop());
					config.set('alwaysOnTop', win.isAlwaysOnTop());
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

module.exports = Menu.buildFromTemplate(tpl);
