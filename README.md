# react-native-file-viewer-turbo

Since the original [react-native-file-viewer](https://github.com/vinzscam/react-native-file-viewer) is no longer maintained, I decided to fork it and update it to work with the latest React Native versions.

This native file viewer for React Native utilizes the QuickLook Framework on iOS and the ACTION_VIEW intent to launch the default app associated with the specified file on Android. It now features TurboModules and Expo support while maintaining backward compatibility with Legacy Native Modules.

While most of the code remains the same as the original library, I implemented several changes to enhance the overall UI/UX and ensure proper handling of asynchronous logic by using promises instead of EventEmitters where applicable.

## Compatibility
This library requires React Native 0.76.3 or newer. It is compatible with Expo SDK 52 or newer.

## Expo

### Installation

```sh
npx expo install react-native-file-viewer-turbo
```

Add plugin to your `app.json` or `app.config.js` with preferred `mimeTypes` (it will modify AndroidManifest.xml as described below in extra step for Android section):

```json
{
  "plugins": [
    [
      "react-native-file-viewer-turbo",
      {
        "mimeTypes": [
          "*/*"
        ]
      }
    ]
  ]
}
```

## Bare React Native

### Installation

```sh
npm install react-native-file-viewer-turbo
OR
yarn add react-native-file-viewer-turbo

cd ios && pod install
```

#### Extra step (Android only)

If your app is targeting **Android 11 (API level 30) or newer**, the following extra step is required, as described in [Declaring package visibility needs](https://developer.android.com/training/package-visibility/declaring) and [Package visibility in Android 11](https://medium.com/androiddevelopers/package-visibility-in-android-11-cc857f221cd9).

Specifically:

> If your app targets Android 11 or higher and needs to interact with apps other than the ones that are visible automatically, add the <queries> element in your app's manifest file. Within the <queries> element, specify the other apps by package name, by intent signature, or by provider authority, as described in the following sections.

For example, if you know upfront that your app is supposed to open PDF files, the following lines should be added to your `AndroidManifest.xml`.

```diff
    ...
  </application>
+ <queries>
+   <intent>
+     <action android:name="android.intent.action.VIEW" />
+     <!-- If you don't know the MIME type in advance, set "mimeType" to "*/*". -->
+     <data android:mimeType="application/pdf" />
+   </intent>
+ </queries>
</manifest>
```

## API

### `open(filepath: string, options?: Options): Promise<void>`

| Parameter              | Type   | Description                                                                                                                                                                                                                                         |
| ---------------------- | ------ |-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **filepath**           | string | The absolute path where the file is stored. The file needs to have a valid extension to be successfully detected. Use [expo-file-system constants](https://docs.expo.dev/versions/latest/sdk/filesystem/#constants) to determine the absolute path correctly. |
| **options** (optional) | Object | Some options to customize the behaviour. See below.                                                                                                                                                                                                 |

#### Options

| Parameter                         | Type          | Platform     | Description                                                                                      |
|-----------------------------------|---------------|--------------|--------------------------------------------------------------------------------------------------|
| **displayName** (optional)        | string        | iOS          | Customize the QuickLook title                                                                    |
| **doneButtonTitle** (optional)    | string        | iOS          | Customize UINavigationController Done button title                                               |
| **doneButtonPosition** (optional) | left \| right | iOS          | Customize UINavigationController Done button position                                            |
| **onDismiss** (optional)          | function      | iOS, Android | Callback invoked when the viewer is being dismissed                                              |
| **showOpenWithDialog** (optional) | boolean       | Android      | If there is more than one app that can open the file, show an _Open With_ dialogue box           |
| **showAppsSuggestions** (optional) | boolean       | Android      | If there is not an installed app that can open the file, open the Play Store with suggested apps |

**IMPORTANT**: Try to be as granular as possible when defining your own queries. This might affect your Play Store approval, as mentioned in [Package visibility filtering on Android](https://developer.android.com/training/package-visibility).

> If you publish your app on Google Play, your app's use of this permission is subject to approval based on an upcoming policy.

## Usage

### Open a local file

```javascript
import { open } from "react-native-file-viewer-turbo";

try {
  await open(path); //absolute-path-to-my-local-file
} catch (e) {
  // error
}
```

### Pick up and open a local file #1 (using [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/document-picker/))

```javascript
import { open } from "react-native-file-viewer-turbo";
import { getDocumentAsync } from "expo-document-picker";

try {
  const result = await getDocumentAsync({ type: 'application/pdf' });
  if (result.assets?.[0] === null) {
    return
  }
  await open(result.assets?.[0].uri, { displayName: 'My PDF Document' });
} catch (e) {
  // error
}
```

### Pick up and open a local file #2 (using [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker))

```javascript
import { open } from "react-native-file-viewer-turbo";
import { launchImageLibraryAsync } from "expo-image-picker";

try {
  const result = await launchImageLibraryAsync();
  if (result.assets?.[0] === null) {
    return
  }
  await open(result.assets?.[0].uri, { displayName: 'Image' });
} catch (e) {
  // error
}
```

### Prompt the user to choose an app to open the file with (if there are multiple installed apps that support the mimetype)

```javascript
import { open } from "react-native-file-viewer-turbo";

try {
  await open(path, { showOpenWithDialog: true }) // absolute-path-to-my-local-file.
} catch (e) {
  // error
}
```

### Open a file from Android assets folder

Since the library works only with absolute paths and Android assets folder doesn't have any absolute path, the file needs to be copied first. Use [copyAsync](https://docs.expo.dev/versions/latest/sdk/filesystem/#filesystemcopyasyncoptions) of [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem).

Example (using expo-file-system):

```javascript
import { open } from "react-native-file-viewer-turbo";
import { copyAsync, documentDirectory } from "expo-file-system";

const file = "file-to-open.doc"; // this is your file name
const dest = `${documentDirectory}/${file}`;

await copyAsync({ from: file, to: dest })
await open(dest, { displayName: 'My Document' })
```

### Download and open a file (using [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem))

No function about file downloading has been implemented in this package.
Use [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem) or any similar library for this purpose.

Example (using expo-file-system):

```javascript
import { open } from "react-native-file-viewer-turbo";
import { downloadAsync, documentDirectory } from "expo-file-system";
import { Platform } from "react-native";

const url =
  "https://github.com/Vadko/react-native-file-viewer-turbo/raw/main/docs/sample.pdf";

// *IMPORTANT*: The correct file extension is always required.
// You might encounter issues if the file's extension isn't included
// or if it doesn't match the mime type of the file.
// https://stackoverflow.com/a/47767860
function getUrlExtension(url: string) {
  return url.split(/[#?]/)[0].split(".").pop()?.trim() ?? "";
}

const extension = getUrlExtension(url);

// Feel free to change main path according to your requirements.
const localFile = `${documentDirectory}/temporaryfile.${extension}`;

const options = {
  fromUrl: url,
  toFile: localFile,
};

try {
  const result = await downloadAsync(url, localFile);
  await open(result.uri, { displayName: "Downloaded PDF" });
} catch (e) {
  // error
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
