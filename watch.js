'use strict';
const path = require('path');
const shuffle = require('lodash.shuffle');
const chokidar = require('chokidar');
const electron = require('electron');
const Conf = require('electron-config');

const config = new Conf();

class Watcher {
	reset() {
		this.index = 0;
		this.images = [];
	}

	next() {
		this.index = this.index || 0;
		const img = this.images[this.index];
		this.index = (this.index + 1) % this.images.length;
		if (img) {
			return img;
		}
		return path.resolve(__dirname, './yamada.png');
	}

	shuffle() {
		this.images = shuffle(this.images);
	}

	connect(win) {
		if (this.time) {
			clearInterval(this.time);
		}

		win.webContents.send('image', this.next());

		this.time = setInterval(() => {
			win.webContents.send('image', this.next());
		}, this.interval);
	}

	manage(dir, opts = {}) {
		if (this.dir && this.dir === dir) {
			return;
		}

		this.dir = dir;

		this.reset();

		config.set('imageDir', dir);

		opts.win = opts.win || electron.BrowserWindow.getAllWindows()[0];
		this.interval = opts.interval || this.interval;

		let watcher = this.watcher;

		if (watcher && watcher.getWatched()) {
			watcher.close();
		}

		watcher = chokidar.watch(
			`${dir}/**/*.{png|jpg|jpeg|gif}`, {
				ignored: /[\/\\]\./,
				awaitWriteFinish: {
					stabilityThreshold: 2000,
					pollInterval: 100
				}
			});

		watcher.on('add', path => {
			this.images = [...this.images, path];
		});

		watcher.on('unlink', path => {
			this.images = this.images.filter(image => image !== path);
		});

		watcher.on('ready', () => {
			setTimeout(() => {
				this.image = shuffle(this.images);
			}, 100);
		});

		this.connect(opts.win);
	}
}

module.exports = new Watcher();
