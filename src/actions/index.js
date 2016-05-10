'use strict';
const {BrowserWindow} = require('electron');

function sendAction(action, val) {
	const win = BrowserWindow.getAllWindows()[0];
	try {
		win.webContents.send(action, JSON.stringify(val));
	} catch (e) {
		console.log('Error', e);
	}
}

exports.sendImage = image => {
	sendAction('image', image);
};
