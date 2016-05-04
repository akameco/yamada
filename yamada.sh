#!/bin/bash

if [ "$(uname)" == 'Darwin' ]; then
	OS='Mac'
else
	echo "Your platform ($(uname -a)) is not supported."
	exit 1
fi

while getopts ":h-:" opt; do
	case "$opt" in
		-)
			case "${OPTARG}" in
				help)
					EXPECT_OUTPUT=1
					;;
			esac
			;;
		h)
			EXPECT_OUTPUT=1
			;;
	esac
done

APP_NAME="yamada"
APP="$APP_NAME.app"
BUNDLE_IDENTIFIER="com.electron.yamada"

if [ -z "${APP_PATH}" ]; then
	if [ -x "/Applications/$APP" ]; then
		APP_PATH="/Applications"
	elif [ -x "$HOME/Applications/$APP_PATH" ]; then
		APP_PATH="$HOME/Applications"
	else
		APP_PATH="$(mdfind "kMDItemCFBundleIdentifier == $BUNDLE_IDENTIFIER" | grep -v ShipIt | head -1 | xargs -0 dirname)"

		# Exit if APP can't be found
		if [ ! -x "$APP_PATH/$APP" ]; then
			echo "Cannot locate $APP, it is usually located in /Applications."
			exit 1
		fi
	fi
fi


if [ $EXPECT_OUTPUT ]; then
	"$APP_PATH/$APP/Contents/MacOS/$APP_NAME" --executed-from="$(pwd)" "$@"
	exit $?
else
	open -a "$APP_PATH/$APP" -n --args --executed-from="$(pwd)" "$@"
fi
