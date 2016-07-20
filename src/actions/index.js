 /* eslint-disable import/no-extraneous-dependencies */
'use strict';
const {BrowserWindow} = require('electron');

function sendAction(action, val) {
	const win = BrowserWindow.getAllWindows()[0];
	try {
		win.webContents.send(action, JSON.stringify(val));
	} catch (err) {
		console.log('Error', err);
	}
}

exports.sendImage = image => {
	sendAction('image', image);
};
