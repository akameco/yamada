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

let mainWindow;
let images = [];
let watcher = null;

function createMainWindow() {
	const size = electron.screen.getPrimaryDisplay().workAreaSize;
	const defaultWindowState = {
		width: 260,
		height: 280,
		x: size.width - 260,
		y: size.height - 280
	};

	const lastWindowState = storage.get('windowState') || defaultWindowState;

	const win = new electron.BrowserWindow({
		title: 'yamada',
		width: lastWindowState.width,
		height: lastWindowState.height,
		x: lastWindowState.x,
		y: lastWindowState.y,
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
	electron.dialog.showOpenDialog(mainWindow, {properties: ['setImageDir']}, paths => {
		setImageDir(paths);
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

function setImageDir(paths) {
	if (paths[0] && typeof paths[0] === 'object') {
		return;
	}

	images = [];
	setupWatcher(paths[0]);
	storage.set('imageDir', paths[0]);
}

// dialogを開くとalwaysOnTopが解除されるため
function setWindowOnTop() {
	setTimeout(() => {
		if (!mainWindow.isAlwaysOnTop()) {
			mainWindow.setAlwaysOnTop(true);
		}
	}, 100);
}

function sendImage(image) {
	try {
		mainWindow.webContents.send('image', JSON.stringify(image));
	} catch (e) {
		console.log('Error', e);
	}
}

function updateImages(time) {
	time = time || 3000;
	let i = 0;
	setInterval(() => {
		sendImage(images[++i % images.length]);
	}, time);
}

function setupWatcher(dir) {
	if (watcher && watcher.getWatched()) {
		watcher.close();
	}

	watcher = chokidar.watch(dir + '/*.{png|jpg|jpeg|gif}', {ignored: /[\/\\]\./});
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
			}, 100);
		});
}

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

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (!mainWindow) {
		mainWindow = createMainWindow();
		updateImages();
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
			updateImages();
		} catch (e) {
			console.log(e);
		}
	});
});

app.on('before-quit', () => {
	storage.set('windowState', mainWindow.getBounds());
});
