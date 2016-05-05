'use strict';
const path = require('path');
const electron = require('electron');
const shuffle = require('lodash.shuffle');
const commandInstaller = require('command-installer');
const parseArgs = require('minimist');
const redux = require('redux');
const Watcher = require('./watcher');
const storage = require('./storage');
const createMenu = require('./menu');
const dialog = require('./dialog');
const app = electron.app;
const createStore = redux.createStore;
const combineReducers = redux.combineReducers;

let mainWindow;

function imageDir(state = null, action) {
	switch (action.type) {
		case 'CHANGE_DIR':
			return action.imageDir;
		default:
			return state;
	}
}

function images(state = [], action) {
	switch (action.type) {
		case 'ADD':
			return [...state, action.image];
		case 'REMOVE':
			return state.filter(image => image !== action.image);
		case 'SHUFFLE':
			return shuffle(state);
		case 'CLEAR':
			return [];
		default:
			return state;
	}
}

const rootReducers = combineReducers({images, imageDir});
let store = createStore(rootReducers);

const watcher = new Watcher(store.dispatch);

store.subscribe(() => {
	watcher.watch(store.getState().imageDir);
});

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

function parseCommandLine() {
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

	if (input.v || input.version) {
		console.log(app.getName(), app.getVersion());
		process.exit(0); // eslint-disable-line
	}

	const executedFrom = input['executed-from'] ? input['executed-from'] : process.cwd();
	const pathToOpen = input._.length === 0 ? null : path.resolve(executedFrom, input._[0]);

	return {
		pathToOpen: pathToOpen
	};
}

function sendAction(action, val) {
	try {
		mainWindow.webContents.send(action, JSON.stringify(val));
	} catch (e) {
		console.log('Error', e);
	}
}

function sendImage(image) {
	sendAction('image', image);
}

// function sendRandomImage() {
// 	const images = store.getState();
// 	sendAction('image', images[0]);
// }

function updateImages(time) {
	time = time || 3000;
	let i = 0;
	setInterval(() => {
		const images = store.getState().images;
		sendImage(images[++i % images.length]);
	}, time);
}

function start() {
	const args = parseCommandLine();

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
			try {
				mainWindow = createMainWindow();

				console.log(args);
				const imageDir = args.pathToOpen ? args.pathToOpen : storage.get('imageDir');

				if (imageDir) {
					store.dispatch({type: 'CHANGE_DIR', imageDir: imageDir});
				} else {
					dialog(mainWindow, store.dispatch);
				}

				const appMenu = createMenu(mainWindow, store.dispatch);
				electron.Menu.setApplicationMenu(appMenu);
				updateImages();
			} catch (e) {
				console.log(e);
				console.log(e.stack);
			}
		});
	});

	app.on('before-quit', () => {
		storage.set('windowState', mainWindow.getBounds());
	});
}

start();
