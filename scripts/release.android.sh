set -e

BASEDIR="$( cd "$(dirname "$0")" ; pwd -P )"

if [ "$1" == "--apk" ]
then 
  echo "GENERATING APK"

  node $BASEDIR/change-version.js
  rm -f $BASEDIR/../App.apk
  (cd $BASEDIR/../android && ./gradlew assembleRelease)
  mv $BASEDIR/../android/app/build/outputs/apk/release/app-release.apk $BASEDIR/../App.apk
  exit
fi

echo "GENERATING APP BUNDLE"

if ! hash fastlane 2>/dev/null; then
	echo "\x1B[91m"
  echo 'É NECESSÁRIO INSTALAR O fastlane'
  echo 'https://docs.fastlane.tools/getting-started/android/setup/'
fi

(cd android && fastlane release)