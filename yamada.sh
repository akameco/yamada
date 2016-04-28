#!/bin/bash

if [ "$(uname)" == 'Darwin' ]; then
	OS='Mac'
else
	echo "Your platform ($(uname -a)) is not supported."
	exit 1
fi

APP_NAME="yamada.app"
BUNDLE_IDENTIFIER="com.electron.yamada"

if [ -z "${APP_PATH}" ]; then
	if [ -x "/Applications/$APP_NAME" ]; then
		APP_PATH="/Applications"
	elif [ -x "$HOME/Applications/$APP_PATH" ]; then
		APP_PATH="$HOME/Applications"
	else
		APP_PATH="$(mdfind "kMDItemCFBundleIdentifier == $BUNDLE_IDENTIFIER" | grep -v ShipIt | head -1 | xargs -0 dirname)"

		# Exit if APP can't be found
		if [ ! -x "$APP_PATH/$APP_NAME" ]; then
			echo "Cannot locate $APP_NAME, it is usually located in /Applications."
			exit 1
		fi
	fi
fi

open -a "$APP_PATH/$APP_NAME" --args --executed-from="$(pwd)" "$@"
