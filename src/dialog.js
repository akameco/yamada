'use strict';
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;

// dialogを開くとalwaysOnTopが解除されるため
function setWindowOnTop(win) {
	setTimeout(() => {
		if (!win.isAlwaysOnTop()) {
			win.setAlwaysOnTop(true);
		}
	}, 100);
}

module.exports = dispatch => {
	const win = BrowserWindow.getAllWindows()[0];
	electron.dialog.showOpenDialog(win, {properties: ['openDirectory']}, paths => {
		if (paths && paths[0]) {
			dispatch({type: 'CHANGE_DIR', imageDir: paths[0]});
		}
		setWindowOnTop(win);
	});
};
