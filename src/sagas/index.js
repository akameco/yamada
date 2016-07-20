/* eslint-disable no-constant-condition */
'use strict';
const {delay, effects} = require('redux-saga');

const {take, call, put, fork, select} = effects;
const {sendImage} = require('../actions/');

function * watchAndLog() {
	while (true) {
		const action = yield take('*');
		console.log('action', action);
	}
}

function * updateImg() {
	while (true) {
		yield take('UPDATE_IMAGE');
		const images = yield select(state => state.images);
		let index = yield select(state => state.app.currentIndex);
		index = index ? index : 0;
		yield call(sendImage, images[index]);
		yield put({type: 'INCREMENT_INDEX', index: (index + 1) % images.length});
	}
}

function * start() {
	yield take('START');
	while (yield select(state => state.app.isRunning)) {
		yield put({type: 'UPDATE_IMAGE'});
		yield call(delay, 1000);
	}
}

module.exports = function * rootSaga() {
	const forks = [fork(updateImg), fork(start)];
	if (process.env.NODE_ENV === 'development') {
		forks.push(fork(watchAndLog));
	}
	yield forks;
};
