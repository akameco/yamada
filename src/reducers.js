'use strict';
const redux = require('redux');
const shuffle = require('lodash.shuffle');
const combineReducers = redux.combineReducers;

const initialState = {
	imageDir: null,
	currentIndex: 0,
	intervalTime: 1000,
	isRunning: false
};

function app(state = initialState, action) {
	switch (action.type) {
		case 'CHANGE_DIR':
			return Object.assign({}, state, {imageDir: action.imageDir});
		case 'INCREMENT_INDEX':
			return Object.assign({}, state, {currentIndex: action.index});
		case 'RESET_INDEX':
			return Object.assign({}, state, {currentIndex: 0});
		case 'START':
			return Object.assign({}, state, {isRunning: true});
		default:
			return state;
	}
}

function images(state = [], action) {
	switch (action.type) {
		case 'ADD':
			return [...state, action.image];
		case 'REMOVE':
			return state.filter(image => image !== action.image);
		case 'SHUFFLE':
			return shuffle(state);
		case 'CLEAR':
			return [];
		default:
			return state;
	}
}

module.exports = combineReducers({images, app});
