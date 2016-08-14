'use strict';
const {BrowserWindow, dialog} = require('electron');

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
	dialog.showOpenDialog(win, {properties: ['openDirectory']}, paths => {
		if (paths && paths[0]) {
			dispatch({type: 'CHANGE_DIR', imageDir: paths[0]});
		}
		setWindowOnTop(win);
	});
};
