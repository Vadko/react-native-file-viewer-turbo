import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  DocumentDirectoryPath,
  downloadFile,
} from '@dr.pogodin/react-native-fs';
import { open } from 'react-native-file-viewer-turbo';

const SAMPLE_URL =
  'https://github.com/Vadko/react-native-file-viewer-turbo/raw/main/docs/sample.pdf';

// *IMPORTANT*: The correct file extension is always required.
// You might encounter issues if the file's extension isn't included
// or if it doesn't match the mime type of the file.
// https://stackoverflow.com/a/47767860
function getUrlExtension(url: string) {
  return url.split(/[#?]/)[0]?.split('.').pop()?.trim() ?? '';
}

async function downloadSample(): Promise<string> {
  const extension = getUrlExtension(SAMPLE_URL);

  // Feel free to change main path according to your requirements.
  const localFile = `${DocumentDirectoryPath}/temporaryfile.${extension}`;

  const { statusCode } = await downloadFile({
    fromUrl: SAMPLE_URL,
    toFile: localFile,
  }).promise;

  if (statusCode !== 200) {
    throw new Error(`Download failed with HTTP status ${statusCode}`);
  }

  return localFile;
}

type Mode = 'default' | 'alternative';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const openSample = async (mode: Mode) => {
    setStatus(null);

    const onDismiss = () => {
      console.log('dismissed!');
      setStatus('Viewer dismissed');
    };

    try {
      setLoading(true);
      const localFile = await downloadSample();
      setLoading(false);

      if (mode === 'default') {
        await open(localFile, {
          displayName: 'Sample PDF',
          onDismiss,
          doneButtonTitle: 'Custom done',
          doneButtonPosition: 'right',
        });
      } else if (Platform.OS === 'android') {
        await open(localFile, {
          onDismiss,
          showOpenWithDialog: true,
          showAppsSuggestions: true,
        });
      } else {
        await open(localFile, {
          onDismiss,
          doneButtonPosition: 'left',
        });
      }
    } catch (error) {
      console.error(error);
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Button onPress={() => openSample('default')} title="Open file" />
          <Button
            onPress={() => openSample('alternative')}
            title={
              Platform.OS === 'android'
                ? 'Open with dialog'
                : 'Open with Done button on the left'
            }
          />
        </>
      )}
      {status != null && <Text style={styles.status}>{status}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 16,
  },
  status: {
    textAlign: 'center',
  },
});
