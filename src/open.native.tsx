import type { EventSubscription } from 'react-native';
import FileViewerTurbo, {
  type Options as NativeOptions,
} from './NativeFileViewerTurbo';
import type { Options } from './types';

let dismissListener: EventSubscription | null = null;

function removeDismissListener() {
  dismissListener?.remove();
  dismissListener = null;
}

export async function open(path: string, options: Options = {}) {
  const { onDismiss, ...nativeOptions } = options;

  removeDismissListener();
  if (onDismiss) {
    dismissListener = FileViewerTurbo.onViewerDidDismiss(() => {
      removeDismissListener();
      onDismiss();
    });
  }

  try {
    await FileViewerTurbo.open(normalize(path), nativeOptions as NativeOptions);
  } catch (error) {
    removeDismissListener();
    throw error;
  }
}

function normalize(path: string) {
  const filePrefix = 'file://';
  if (path.startsWith(filePrefix)) {
    path = path.substring(filePrefix.length);
    try {
      path = decodeURIComponent(path);
    } catch {
      // ignore decode errors
    }
  }

  return path;
}
