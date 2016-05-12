'use strict';
const path = require('path');
const electron = require('electron');
const {app, BrowserWindow, Menu, ipcMain} = require('electron');
const commandInstaller = require('command-installer');
const parseArgs = require('minimist');
const redux = require('redux');
const createSagaMiddleware = require('redux-saga').default;
const Watcher = require('./watcher');
const storage = require('./storage');
const createMenu = require('./menu');
const dialog = require('./dialog');
const rootReducers = require('./reducers/');
const rootSaga = require('./sagas/');
const {createStore, applyMiddleware} = redux;

let mainWindow;

const sagaMiddleware = createSagaMiddleware();
const store = createStore(rootReducers, applyMiddleware(sagaMiddleware));

const watcher = new Watcher(store.dispatch);

sagaMiddleware.run(rootSaga);

store.subscribe(() => {
	watcher.watch(store.getState().app.imageDir);
});

function createMainWindow() {
	const size = electron.screen.getPrimaryDisplay().workAreaSize;
	const defaultWindowState = {
		title: 'yamada',
		width: 260,
		height: 280,
		x: size.width - 260,
		y: size.height - 280,
		alwaysOnTop: true,
		transparent: true,
		frame: false,
		hasShadow: false
	};

	const windowState = Object.assign({}, defaultWindowState, storage.get('windowState'));
	const win = new BrowserWindow(windowState);

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
		pathToOpen
	};
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
		}
	});

	app.on('ready', () => {
		const resourcesDirectory = process.env.NODE_ENV === 'development' ? __dirname : process.resourcesPath;
		console.log(process.versions);
		commandInstaller(`${resourcesDirectory}/yamada.sh`, 'yamada').then(() => {
			try {
				mainWindow = createMainWindow();

				const imageDir = args.pathToOpen ? args.pathToOpen : storage.get('imageDir');

				if (imageDir) {
					store.dispatch({type: 'CHANGE_DIR', imageDir});
				} else {
					dialog(store.dispatch);
				}

				const appMenu = createMenu(store.dispatch);
				Menu.setApplicationMenu(appMenu);
				store.dispatch({type: 'START'});
			} catch (e) {
				console.log(e);
				console.log(e.stack);
			}
		});

		ipcMain.on('open', () => {
			dialog(store.dispatch);
		});
	});

	app.on('before-quit', () => {
		storage.set('windowState', Object.assign({}, mainWindow.getBounds(), {alwaysOnTop: mainWindow.isAlwaysOnTop()}));
	});
}

start();