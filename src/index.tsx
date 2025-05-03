import type { Options } from './NativeFileViewerTurbo';

import {
  NativeModules,
  NativeEventEmitter,
  type EmitterSubscription,
} from 'react-native';
import { createRef, type MutableRefObject } from 'react';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const FileViewerTurbo = isTurboModuleEnabled
  ? require('./NativeFileViewerTurbo').default
  : NativeModules.FileViewerTurbo;

const eventEmitter = new NativeEventEmitter(FileViewerTurbo);

const dismissListener: MutableRefObject<EmitterSubscription | null> =
  createRef();

export async function open(
  path: string,
  options: Partial<Options & { onDismiss: () => void }> = {}
) {
  const { onDismiss, ...nativeOptions } = options;
  try {
    dismissListener.current = eventEmitter.addListener(
      'onViewerDidDismiss',
      () => {
        onDismiss?.();
        dismissListener.current?.remove();
      }
    );

    await FileViewerTurbo.open(normalize(path), nativeOptions);
  } catch (error) {
    throw error;
  }
}

function normalize(path: string) {
  const filePrefix = 'file://';
  if (path.startsWith(filePrefix)) {
    path = path.substring(filePrefix.length);
    try {
      path = decodeURI(path);
    } catch (e) {}
  }

  return path;
}
