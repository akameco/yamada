'use strict';
const {take, call, put, fork, select} = require('redux-saga').effects;
const {sendImage} = require('../actions/');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function * watchAndLog() {
	while (true) { //eslint-disable-line
		const action = yield take('*');
		console.log('action', action);
	}
}

function * updateImg() {
	while (true) { // eslint-disable-line
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
	yield fork(updateImg);
	yield fork(watchAndLog);
	yield fork(start);
};
