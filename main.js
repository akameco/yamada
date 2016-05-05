'use strict';
const path = require('path');
const electron = require('electron');
const chokidar = require('chokidar');
const shuffle = require('lodash.shuffle');
const commandInstaller = require('command-installer');
const parseArgs = require('minimist');
const storage = require('./storage');
const createMenu = require('./menu');
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

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', () => {
		mainWindow = null;
	});

	return win;
}

const openDialogFilterDirectory = () => {
	electron.dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']}, paths => {
		if (!paths) {
			return;
		}

		openDirectory(paths[0]);
		setWindowOnTop();
	});
};

function loadCofig() {
	const n = process.env.NODE_ENV === 'development' ? 2 : 1;
	const input = parseArgs(process.argv.slice(n));

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
	if (input._.length !== 0) {
		setupWatcher(path.resolve(executedFrom, input._[0]));
		return;
	}

	const imageDir = storage.get('imageDir');
	if (imageDir) {
		setupWatcher(imageDir);
	} else {
		openDialogFilterDirectory();
	}
}

function openDirectory(dir) {
	if (dir && typeof dir === 'object') {
		return;
	}

	storage.set('imageDir', dir);
	images = [];
	setupWatcher(dir);
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
	const resourcesDirectory = process.env.NODE_ENV === 'development' ? __dirname : process.resourcesPath;
	commandInstaller(`${resourcesDirectory}/yamada.sh`, 'yamada').then(() => {
		loadCofig();
		try {
			const appMenu = createMenu(openDialogFilterDirectory);
			electron.Menu.setApplicationMenu(appMenu);
			mainWindow = createMainWindow();
			updateImages(INTERVAL_TIME);
		} catch (e) {
			console.log(e);
		}
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
