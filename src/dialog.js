'use strict';
const electron = require('electron');

// dialogを開くとalwaysOnTopが解除されるため
function setWindowOnTop(mainWindow) {
	setTimeout(() => {
		if (!mainWindow.isAlwaysOnTop()) {
			mainWindow.setAlwaysOnTop(true);
		}
	}, 100);
}

module.exports = (mainWindow, dispatch) => {
	console.log(mainWindow);
	electron.dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']}, paths => {
		if (paths && paths[0]) {
			dispatch({type: 'CHANGE_DIR', imageDir: paths[0]});
		}
		setWindowOnTop(mainWindow);
	});
};
