import FileViewerTurbo, { type Options } from './NativeFileViewerTurbo';
import type { EventSubscription } from 'react-native';

let dismissListener: EventSubscription | null = null;

export async function open(
  path: string,
  options: Partial<Options & { onDismiss: () => void }> = {}
) {
  const { onDismiss, ...nativeOptions } = options;

  dismissListener = FileViewerTurbo.onViewerDidDismiss(() => {
    onDismiss?.();
    dismissListener?.remove();
  });

  await FileViewerTurbo.open(normalize(path), nativeOptions as Options);
}

function normalize(path: string) {
  const filePrefix = 'file://';
  if (path.startsWith(filePrefix)) {
    path = path.substring(filePrefix.length);
    try {
      path = decodeURI(path);
    } catch {
      // ignore decode errors
    }
  }

  return path;
}
