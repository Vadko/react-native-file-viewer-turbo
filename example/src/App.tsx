import { useState } from 'react';
import { View, StyleSheet, Button, ActivityIndicator } from 'react-native';
import {
  DocumentDirectoryPath,
  downloadFile,
} from '@dr.pogodin/react-native-fs';
import { open } from 'react-native-file-viewer-turbo';

function getUrlExtension(url: string) {
  return url.split(/[#?]/)[0]?.split('.').pop()?.trim() ?? '';
}

export default function App() {
  const [loading, setLoading] = useState(false);

  const press = async () => {
    const url =
      'https://github.com/Vadko/react-native-file-viewer-turbo/raw/main/docs/sample.pdf';

    // *IMPORTANT*: The correct file extension is always required.
    // You might encounter issues if the file's extension isn't included
    // or if it doesn't match the mime type of the file.
    // https://stackoverflow.com/a/47767860

    const extension = getUrlExtension(url);

    // Feel free to change main path according to your requirements.
    const localFile = `${DocumentDirectoryPath}/temporaryfile.${extension}`;

    const options = {
      fromUrl: url,
      toFile: localFile,
    };

    try {
      setLoading(true);
      await downloadFile(options).promise;
      setLoading(false);
      await open(localFile, {
        onDismiss: () => console.log('dismissed!'),
        doneButtonTitle: 'Custom done',
        doneButtonPosition: 'right',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button onPress={press} title="Open file" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
