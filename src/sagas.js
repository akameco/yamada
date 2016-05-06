'use strict';
const effects = require('redux-saga').effects;
const take = effects.take;
const call = effects.call;
const put = effects.put;
const fork = effects.fork;
const select = effects.select;
const sendImage = require('./actions').sendImage;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function* watchAndLog() {
	while (true) { //eslint-disable-line
		const action = yield take('*');
		console.log('action', action);
	}
}

function* updateImg(getState) {
	while (true) { // eslint-disable-line
		yield take('UPDATE_IMAGE');
		const images = yield select(state => state.images);
		let index = yield select(state => state.app.currentIndex);
		index = index ? index : 0;
		yield call(sendImage, images[index]);
		yield put({type: 'INCREMENT_INDEX', index: (index + 1) % images.length});
	}
}
function* start() {
	yield take('START');
	while (yield select(state => state.app.isRunning)) {
		yield put({type: 'UPDATE_IMAGE'});
		yield call(delay, 1000);
	}
}

module.exports = function* rootSaga(getState) {
	yield fork(updateImg);
	yield fork(watchAndLog);
	yield fork(start);
};
