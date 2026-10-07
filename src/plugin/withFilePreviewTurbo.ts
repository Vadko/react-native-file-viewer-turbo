import { withAndroidManifest, type ConfigPlugin } from 'expo/config-plugins';

type Props = {
  mimeTypes?: string[];
};

const VIEW_ACTION = 'android.intent.action.VIEW';

export const withFilePreviewTurbo: ConfigPlugin<Props | void> = (
  config,
  props
) =>
  withAndroidManifest(config, (modConfig) => {
    const { manifest } = modConfig.modResults;
    manifest.queries ??= [];

    const declared = manifest.queries
      .flatMap((query) => query.intent ?? [])
      .flatMap((intent) => intent.data ?? [])
      .map((data) => data.$['android:mimeType']);
    const mimeTypes = (props?.mimeTypes ?? []).filter(
      (mimeType) => !declared.includes(mimeType)
    );

    if (mimeTypes.length > 0) {
      manifest.queries.push({
        intent: mimeTypes.map((mimeType) => ({
          action: [{ $: { 'android:name': VIEW_ACTION } }],
          data: [{ $: { 'android:mimeType': mimeType } }],
        })),
      });
    }

    return modConfig;
  });
