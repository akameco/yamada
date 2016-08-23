'use strict';
const path = require('path');
const electron = require('electron');
const isDev = require('electron-is-dev');
const Conf = require('electron-config');
const parseArgs = require('electron-args');
const commandInstaller = require('command-installer');
const windowStateKeeper = require('electron-window-state');
const Watcher = require('./watch');

require('electron-debug')({showDevTools: true});

const {app, BrowserWindow, dialog, ipcMain, Menu, shell} = electron;
const appName = app.getName();

const config = new Conf();

let mainWindow;

const cli = parseArgs(`
	Usage
	  $ yamada [path]

	Options
	  --interval,-i    interval time

	Examples
	  $ yamada . -i 3000
	  $ yamada ~/Pictures/
`, {
	alias: {
		h: 'help',
		interval: 'i'
	},
	default: {
		interval: 1000,
		executedFrom: process.cwd()
	}
});

const {executedFrom, interval} = cli.flags;
const input = cli.input[0];

const watcher = new Watcher({interval});

const getImagePath = () => {
	if (input) {
		return path.resolve(executedFrom, input);
	}
	if (config.has('imageDir')) {
		return config.get('imageDir');
	}
	return null;
};

const setWindowOnTop = win => {
	setTimeout(() => {
		if (!win.isAlwaysOnTop()) {
			win.setAlwaysOnTop(true);
		}
	}, 100);
};

const showDialog = () => {
	dialog.showOpenDialog(
		mainWindow,
		{properties: ['openDirectory']},
		paths => {
			const openPath = paths[0];
			if (openPath) {
				watcher.manage(openPath, {win: mainWindow});
			}
			setWindowOnTop(mainWindow);
		}
	);
};

function createMainWindow() {
	const size = electron.screen.getPrimaryDisplay().workAreaSize;

	const mainWindowState = windowStateKeeper({
		defaultWidth: 260,
		defaultHeight: 280
	});

	const {width, height, x, y} = mainWindowState;

	const defaultWindowState = {
		title: 'yamada',
		width,
		height,
		x: size.width - width,
		y: size.height - height,
		alwaysOnTop: true,
		transparent: true,
		frame: false,
		hasShadow: false
	};

	const windowState = Object.assign({}, defaultWindowState, {x, y});
	const win = new BrowserWindow(windowState);
	mainWindowState.manage(win);

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', () => {
		mainWindow = null;
	});

	return win;
}

app.on('browser-window-focus', () => {
	mainWindow.setHasShadow(true);
});

app.on('browser-window-blur', () => {
	mainWindow.setHasShadow(false);
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

const tpl = [
	{
		label: appName,
		submenu: [
			{
				label: `${appName}について`,
				role: 'about'
			},
			{type: 'separator'},
			{
				label: 'サービス',
				role: 'services',
				submenu: []
			},
			{type: 'separator'},
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
			{type: 'separator'},
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
					mainWindow.setAlwaysOnTop(!mainWindow.isAlwaysOnTop());
					config.set('alwaysOnTop', mainWindow.isAlwaysOnTop());
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

app.on('ready', () => {
	mainWindow = createMainWindow();
	const imagePath = getImagePath();

	if (imagePath) {
		watcher.manage(imagePath, {win: mainWindow});
	} else {
		showDialog(mainWindow);
	}

	const appMenu = Menu.buildFromTemplate(tpl);
	Menu.setApplicationMenu(appMenu);

	const resourcesDirectory = isDev ? __dirname : process.resourcesPath;
	commandInstaller(`${resourcesDirectory}/yamada.sh`, 'yamada').catch(err => {
		console.error(err);
	});

	ipcMain.on('open', () => {
		showDialog(mainWindow);
	});
});
