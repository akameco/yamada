'use strict';
const {BrowserWindow, dialog} = require('electron');
const watcher = require('./watch');

const setWindowOnTop = win => {
	setTimeout(() => {
		if (!win.isAlwaysOnTop()) {
			win.setAlwaysOnTop(true);
		}
	}, 100);
};

module.exports = () => {
	const win = BrowserWindow.getAllWindows()[0];

	dialog.showOpenDialog(
		win,
		{properties: ['openDirectory']},
		paths => {
			const openPath = paths[0];
			if (openPath) {
				watcher.manage(openPath, {win});
			}
			setWindowOnTop(win);
		}
	);
};

