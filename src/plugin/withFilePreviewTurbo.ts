import * as Expo from '@expo/config-plugins';

type Props = {
  mimeTypes: string[];
};

export const withFilePreviewTurbo: Expo.ConfigPlugin<Props> = (
  config,
  props
) => {
  const plugins: Expo.ConfigPlugin<Props>[] = [];
  const { platforms = [] } = config;

  const withAndroidManifest: Expo.ConfigPlugin<Props> = (config) =>
    Expo.withAndroidManifest(config, (config) => {
      config.modResults.manifest.queries.push({
        intent: props.mimeTypes.map((mimeType) => ({
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          data: [{ $: { 'android:mimeType': mimeType } }],
        })),
      });

      return config;
    });

  if (platforms.includes('android')) {
    plugins.push(withAndroidManifest);
  }

  return Expo.withPlugins(
    config,
    plugins.map((plugin) => [plugin, props])
  );
};
