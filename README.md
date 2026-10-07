# react-native-file-viewer-turbo

Since the original [react-native-file-viewer](https://github.com/vinzscam/react-native-file-viewer) is no longer maintained, I decided to fork it and update it to work with the latest React Native versions.

This native file viewer for React Native utilizes the QuickLook Framework on iOS and the ACTION_VIEW intent to launch the default app associated with the specified file on Android. It now features TurboModules and Expo support.

## ⚠️ New Architecture Only

**Starting from version 0.7.0, this library supports only the New Architecture.** If you need to support the Old Architecture, please use version 0.6.x or earlier.

While most of the code remains the same as the original library, I implemented several changes to enhance the overall UI/UX and ensure proper handling of asynchronous logic by using promises instead of EventEmitters where applicable.

## Compatibility

This library requires React Native 0.76 or newer (New Architecture) and is compatible with Expo SDK 52 or newer. On web, `open()` opens the file (an http(s), `blob:` or `data:` URL) in a new browser tab; call it directly from a user action, otherwise the browser may block the tab.

## Expo

### Installation

```sh
npx expo install react-native-file-viewer-turbo
```

If you use `showOpenWithDialog` on Android, add the plugin to your `app.json` or `app.config.js` with preferred `mimeTypes` (it will modify AndroidManifest.xml as described below in extra step for Android section):

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-file-viewer-turbo",
        {
          "mimeTypes": ["application/pdf", "image/*"]
        }
      ]
    ]
  }
}
```

## Bare React Native

### Installation

```sh
npm install react-native-file-viewer-turbo
# or
yarn add react-native-file-viewer-turbo

cd ios && pod install
```

#### Extra step (Android only)

If you use `showOpenWithDialog` and your app is targeting **Android 11 (API level 30) or newer**, the following extra step is required, as described in [Declaring package visibility needs](https://developer.android.com/training/package-visibility/declaring) and [Package visibility in Android 11](https://medium.com/androiddevelopers/package-visibility-in-android-11-cc857f221cd9). A plain `open()` works without it.

Specifically:

> If your app targets Android 11 or higher and needs to interact with apps other than the ones that are visible automatically, add the `<queries>` element in your app's manifest file. Within the `<queries>` element, specify the other apps by package name, by intent signature, or by provider authority, as described in the following sections.

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

**IMPORTANT**: Try to be as granular as possible when defining your own queries. This might affect your Play Store approval, as mentioned in [Package visibility filtering on Android](https://developer.android.com/training/package-visibility).

## Android FileProvider

On Android the library shares files with the viewer app through its own FileProvider with the authority `${applicationId}.fileviewerturbo.provider` (up to 0.7.5 it was `${applicationId}.provider`, which clashed with other libraries). Files must be in the app's files or cache directory, app-specific external storage or the external storage root, see [`fileviewerturbo_provider_paths.xml`](android/src/main/res/xml/fileviewerturbo_provider_paths.xml).

## API

### `open(filepath: string, options?: Options): Promise<void>`

| Parameter              | Type      | Description                                                                                                                                                                                                                                                                              |
| ---------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **filepath**           | `string`  | The absolute path, `file://` URI or (Android only) `content://` URI of the file. The file needs to have a valid extension to be successfully detected. Use [expo-file-system constants](https://docs.expo.dev/versions/latest/sdk/filesystem/) to determine the absolute path correctly. |
| **options** (optional) | `Options` | Some options to customize the behaviour. See below.                                                                                                                                                                                                                                      |

#### Options

| Parameter                          | Type          | Platform     | Description                                                                                      |
| ---------------------------------- | ------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| **displayName** (optional)         | string        | iOS          | Customize the QuickLook title                                                                    |
| **doneButtonTitle** (optional)     | string        | iOS          | Customize UINavigationController Done button title                                               |
| **doneButtonPosition** (optional)  | left \| right | iOS          | Customize UINavigationController Done button position                                            |
| **onDismiss** (optional)           | function      | iOS, Android | Callback invoked when the viewer is being dismissed                                              |
| **showOpenWithDialog** (optional)  | boolean       | Android      | If there is more than one app that can open the file, show an _Open With_ dialogue box           |
| **showAppsSuggestions** (optional) | boolean       | Android      | If there is not an installed app that can open the file, open the Play Store with suggested apps |

## Usage

### Open a local file

```ts
import { open } from 'react-native-file-viewer-turbo';

try {
  await open(path); // absolute path, file:// URI or (Android only) content:// URI
} catch (e) {
  // error
}
```

### Customize the viewer and get notified when it is closed

```ts
import { open } from 'react-native-file-viewer-turbo';

try {
  await open(path, {
    displayName: 'Sample PDF', // iOS
    doneButtonTitle: 'Close', // iOS
    doneButtonPosition: 'right', // iOS
    onDismiss: () => {
      console.log('Viewer dismissed');
    },
  });
} catch (e) {
  // error
}
```

### Pick up and open a local file #1 (using [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/document-picker/))

```ts
import { getDocumentAsync } from 'expo-document-picker';
import { open } from 'react-native-file-viewer-turbo';

try {
  const result = await getDocumentAsync({ type: 'application/pdf' });
  // `assets` is null when the user canceled.
  const document = result.assets?.[0];
  if (document) {
    await open(document.uri, { displayName: document.name });
  }
} catch (e) {
  // error
}
```

### Pick up and open a local file #2 (using [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/))

```ts
import { launchImageLibraryAsync } from 'expo-image-picker';
import { open } from 'react-native-file-viewer-turbo';

try {
  const result = await launchImageLibraryAsync();
  // `assets` is null when the user canceled.
  const image = result.assets?.[0];
  if (image) {
    await open(image.uri, { displayName: 'Image' });
  }
} catch (e) {
  // error
}
```

### Prompt the user to choose an app to open the file with (if there are multiple installed apps that support the mimetype)

```ts
import { open } from 'react-native-file-viewer-turbo';

try {
  await open(path, { showOpenWithDialog: true }); // Android only
} catch (e) {
  // error
}
```

### Open a file from Android assets folder

Since the library works only with absolute paths and Android assets folder doesn't have any absolute path, the file needs to be copied first. Use [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/): on Android, `Paths.bundle` points to the assets folder of the app (`android/app/src/main/assets`).

Example (using expo-file-system):

```ts
import { File, Paths } from 'expo-file-system';
import { open } from 'react-native-file-viewer-turbo';

const fileName = 'file-to-open.pdf';
const asset = new File(Paths.bundle, fileName);
const destination = new File(Paths.document, fileName);

try {
  // Delete existing file if exists
  if (destination.exists) {
    destination.delete();
  }

  await asset.copy(destination);

  await open(destination.uri, { displayName: 'My Document' });
} catch (e) {
  // error
}
```

### Download and open a file (using [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/))

No function about file downloading has been implemented in this package.
Use [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) or any similar library for this purpose. The [example app](example/src/App.tsx) does the same without Expo, using [@dr.pogodin/react-native-fs](https://github.com/birdofpreyru/react-native-fs).

Example (using expo-file-system):

```ts
import { File, Paths } from 'expo-file-system';
import { open } from 'react-native-file-viewer-turbo';

const url =
  'https://github.com/Vadko/react-native-file-viewer-turbo/raw/main/docs/sample.pdf';

// *IMPORTANT*: The correct file extension is always required.
// You might encounter issues if the file's extension isn't included
// or if it doesn't match the mime type of the file.
// https://stackoverflow.com/a/47767860
function getUrlExtension(url: string): string {
  return url.split(/[#?]/)[0]?.split('.').pop()?.trim() ?? '';
}

const extension = getUrlExtension(url);

try {
  const destination = new File(Paths.document, `temporaryfile.${extension}`);

  // Delete existing file if exists
  if (destination.exists) {
    destination.delete();
  }

  await File.downloadFileAsync(url, destination);

  await open(destination.uri, { displayName: 'Downloaded PDF' });
} catch (e) {
  // error
}
```

## Upgrading from 0.7.x

- **Android FileProvider authority** is now `${applicationId}.fileviewerturbo.provider`. If you removed this library's provider with `tools:node="remove"` to work around a clash with another library, remove that workaround, otherwise `open()` fails.
- **`file://` URIs** are decoded with `decodeURIComponent`, so `%23`, `%26` and `%3F` now become `#`, `&` and `?`.
- **`<queries>`** on Android is only needed for `showOpenWithDialog`.

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
