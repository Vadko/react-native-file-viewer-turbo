import { View, StyleSheet, Button } from 'react-native';
import {
  DocumentDirectoryPath,
  downloadFile,
} from '@dr.pogodin/react-native-fs';
import { open } from 'react-native-file-viewer-turbo';

function getUrlExtension(url: string) {
  return url.split(/[#?]/)[0]?.split('.').pop()?.trim() ?? '';
}

export default function App() {
  const press = () => {
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
    downloadFile(options).promise.then(() =>
      open(localFile, {
        onDismiss: () => console.log('dismissed!'),
        doneButtonTitle: 'Custom done',
        doneButtonPosition: 'right',
      })
        .then(console.log)
        .catch(console.error)
    );
  };

  return (
    <View style={styles.container}>
      <Button onPress={press} title="Open file" />
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
