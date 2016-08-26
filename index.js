'use strict';
const path = require('path');
const electron = require('electron');
const isDev = require('electron-is-dev');
const parseArgs = require('electron-args');
const commandInstaller = require('command-installer');
const config = require('./config');
const watcher = require('./watch');
const menu = require('./menu');
const showDialog = require('./dialog');

require('electron-debug')({showDevTools: true});

const {app, BrowserWindow, ipcMain, Menu} = electron;

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

const getImagePath = () => {
	if (input) {
		return path.resolve(executedFrom, input);
	}
	if (config.has('imageDir')) {
		return config.get('imageDir');
	}
	return null;
};

function createMainWindow() {
	const lastWindowState = config.get('lastWindowState');

	const win = new BrowserWindow({
		title: app.getName(),
		width: lastWindowState.width,
		height: lastWindowState.height,
		x: lastWindowState.x,
		y: lastWindowState.y,
		alwaysOnTop: true,
		transparent: true,
		frame: false,
		hasShadow: false
	});

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

app.on('ready', () => {
	mainWindow = createMainWindow();
	const imagePath = getImagePath();

	if (imagePath) {
		watcher.manage(imagePath, {win: mainWindow, interval});
	} else {
		showDialog();
	}

	Menu.setApplicationMenu(menu);

	const resourcesDirectory = isDev ? __dirname : process.resourcesPath;
	commandInstaller(`${resourcesDirectory}/yamada.sh`, 'yamada').catch(err => {
		console.error(err);
	});

	ipcMain.on('open', () => {
		showDialog();
	});
});

app.on('before-quit', () => {
	if (!mainWindow.isFullScreen()) {
		config.set('lastWindowState', mainWindow.getBounds());
	}
});
