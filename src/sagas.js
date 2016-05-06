'use strict';
const effects = require('redux-saga').effects;
const take = effects.take;
const call = effects.call;
const put = effects.put;
const sendImage = require('./actions').sendImage;

function* watchAndLog() {
	while (true) { //eslint-disable-line
		const action = yield take('*');
		console.log('action', action);
	}
}

function* updateImg(getState) {
	while (true) { // eslint-disable-line
		yield take('UPDATE_IMAGE');
		const images = getState().images;
		const index = getState().app.currentIndex || 0;
		console.log(index);
		yield call(sendImage, images[index]);
		yield put({type: 'INCREMENT_INDEX', index: (index + 1) % images.length});
	}
}

module.exports = function* rootSaga(getState) {
	yield [watchAndLog(getState), updateImg(getState)];
};
