import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export type Options = {
  displayName?: string;
  doneButtonTitle?: string;
  showOpenWithDialog?: boolean;
  showAppsSuggestions?: boolean;
  doneButtonPosition?: 'left' | 'right';
};

export interface Spec extends TurboModule {
  // not able to use options as typed object due to backward compatibility with iOS
  open(path: string, options: Object): Promise<void>;

  readonly onViewerDidDismiss: EventEmitter<void>;

  // https://github.com/react-native-community/RNNewArchitectureLibraries/tree/feat/swift-event-emitter?tab=readme-ov-file#codegen-update-codegen-specs
  addListener: (eventType: string) => void;
  removeListeners: (count: number) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FileViewerTurbo');
