'use strict';
const chokidar = require('chokidar');
const storage = require('./storage');

class Watcher {
	constructor(dispatch) {
		this.watcher = null;
		this.dispatch = dispatch;
	}

	watch(dir) {
		if (this.dir && this.dir === dir) {
			return;
		}
		this.dir = dir;
		this.dispatch({type: 'RESET_INDEX'});
		this.dispatch({type: 'CLEAR'});

		// storeに保存 別関数に分ける？
		storage.set('imageDir', this.dir);

		if (this.watcher && this.watcher.getWatched()) {
			this.watcher.close();
		}

		this.watcher = chokidar.watch(dir + '/*.{png|jpg|jpeg|gif}', {ignored: /[\/\\]\./});
		this.watcher.on('all', () => {
			// ファイルに更新がある場合、再シャッフル
			this.dispatch({type: 'SHUFFLE'});
		});

		this.watcher.on('add', path => {
			this.dispatch({type: 'ADD', image: path});
		});

		this.watcher.on('unlink', path => {
			this.dispatch({type: 'REMOVE', image: path});
		});

		this.watcher.on('ready', () => {
			setTimeout(() => {
				this.dispatch({type: 'SHUFFLE'});
				// sendRandomImage();
			}, 100);
		});
	}
}

module.exports = Watcher;
