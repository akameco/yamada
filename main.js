'use strict';
const path = require('path');
const electron = require('electron');
const chokidar = require('chokidar');
const shuffle = require('lodash.shuffle');
const storage = require('electron-json-storage');
const commandInstaller = require('command-installer');
const parseArgs = require('minimist');
const app = electron.app;

const INTERVAL_TIME = process.env.INTERVAL_TIME || 3000;
const EXT_PATTERNS = '/*.{png|jpg|jpeg|gif}';
const WAIT_TIME = 100;

const WIDTH = 260;
const HEIGHT = 280;

let mainWindow;
let images = [];
let watcher = null;
let timer = null;

function createMainWindow() {
	const electronScreen = electron.screen;
	const size = electronScreen.getPrimaryDisplay().workAreaSize;

	const win = new electron.BrowserWindow({
		title: 'yamada',
		width: WIDTH,
		height: HEIGHT,
		x: size.width - WIDTH,
		y: size.height - HEIGHT,
		alwaysOnTop: true,
		transparent: true,
		frame: false,
		hasShadow: false
	});

	if (process.env.NODE_ENV === 'development') {
		win.openDevTools();
	}

	createMenu();

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', () => {
		mainWindow = null;
	});

	return win;
}

function createMenu() {
	const Menu = electron.Menu;
	const name = app.getName();
	const menu = Menu.buildFromTemplate([{
		label: name,
		submenu: [
			{label: 'About ' + name, role: 'about'},
			{type: 'separator'},
			{label: 'Services', role: 'services', submenu: []},
			{type: 'separator'},
			{label: 'Hide ' + name, accelerator: 'Command+H', role: 'hide'},
			{label: 'Hide Others', accelerator: 'Command+Alt+H', role: 'hideothers'},
			{label: 'Show All', role: 'unhide'},
			{type: 'separator'},
			{label: 'Open...', accelerator: 'Command+O', click: openDialogFilterDirectory},
			{label: 'Alway On Top', accelerator: 'Command+T', click: () => mainWindow.setAlwaysOnTop(true)},
			{type: 'separator'},
			{label: 'Quit', accelerator: 'Command+Q', click: () => app.quit()}
		]
	}]);
	Menu.setApplicationMenu(menu);
}

function loadCofig() {
	const input = parseArgs(process.argv.slice(1));

	if (input.h || input.help) {
		console.log(`
  Usage
    $ yamada [path]

  Options
    -h, --help     show help
    -v, --version  show version

  Examples
    $ yamada .
    $ yamada ~/Pictures/`);
		process.exit(0); // eslint-disable-line
	}

	const executedFrom = input['executed-from'] ? input['executed-from'] : process.cwd();
	if (input._.length === 0) {
		storage.get('config', (err, data) => {
			if (err) {
				throw err;
			}

			if (data.imageDir) {
				setupWatcher(data.imageDir);
			} else {
				openDialogFilterDirectory();
			}
		});
	} else {
		setupWatcher(path.resolve(executedFrom, input._[0]));
	}
}

function openDialogFilterDirectory() {
	electron.dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']}, paths => {
		if (!paths) {
			return;
		}

		openDirectory(paths[0]);
		setWindowOnTop();
	});
}

function openDirectory(dir) {
	if (dir && typeof dir === 'object') {
		return;
	}

	saveImageDir(dir);
	images = [];
	setupWatcher(dir);
}

function saveImageDir(dir) {
	storage.set('config', {imageDir: dir}, err => {
		if (err) {
			throw err;
		}
	});
}

// dialogを開くとalwaysOnTopが解除されるため
function setWindowOnTop() {
	setTimeout(() => {
		if (!mainWindow.isAlwaysOnTop()) {
			mainWindow.setAlwaysOnTop(true);
		}
	}, WAIT_TIME);
}

function updateImages(time) {
	let i = 0;
	timer = setInterval(() => {
		sendImage(images[++i % images.length]);
	}, time);
}

function sendImage(image) {
	try {
		mainWindow.webContents.send('image', JSON.stringify(image));
	} catch (e) {
		console.log('Error', e);
	}
}

function setupWatcher(dir) {
	if (watcher && watcher.getWatched()) {
		watcher.close();
	}

	watcher = chokidar.watch(dir + EXT_PATTERNS, {ignored: /[\/\\]\./});
	watcher
		.on('all', () => {
			// ファイルに更新がある場合、再シャッフル
			images = shuffle(images);
		})
	.on('add', path => {
		images.push(path);
	})
	.on('unlink', path => {
		images = images.filter(filename => filename !== path);
	})
	.on('ready', () => {
		setTimeout(() => {
			images = shuffle(images);
			sendImage(images[0]);
		}, WAIT_TIME);
	});
}

function getResourcesDirectory() {
	if (process.env.NODE_ENV === 'development') {
		return __dirname;
	}
	return process.resourcesPath;
}

app.on('window-all-closed', () => {
	clearInterval(timer);
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
		updateImages(INTERVAL_TIME);
	}
});

app.on('ready', () => {
	commandInstaller(`${getResourcesDirectory()}/yamada.sh`, 'yamada').then(() => {
		loadCofig();
		mainWindow = createMainWindow();
		updateImages(INTERVAL_TIME);
	});
});

app.on('browser-window-focus', () => {
	if (!mainWindow.hasShadow()) {
		mainWindow.setHasShadow(true);
	}
});

app.on('browser-window-blur', () => {
	if (mainWindow.hasShadow()) {
		mainWindow.setHasShadow(false);
	}
});
