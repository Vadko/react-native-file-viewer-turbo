/**
 * @jest-environment node
 */
import { describe, expect, it } from '@jest/globals';
import type { AndroidConfig, ExportedConfig } from 'expo/config-plugins';

import { withFilePreviewTurbo } from '../withFilePreviewTurbo';

type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;

// The <queries> element of the default Expo template.
const createManifest = (): AndroidManifest => ({
  manifest: {
    $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
    queries: [
      {
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            category: [
              { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
            ],
            data: [{ $: { 'android:scheme': 'https' } }],
          },
        ],
      },
    ],
  },
});

const mimeTypesOf = (manifest: AndroidManifest) =>
  manifest.manifest.queries
    .flatMap((query) => query.intent ?? [])
    .flatMap((intent) => intent.data ?? [])
    .map((data) => data.$['android:mimeType'])
    .filter(Boolean);

// Applies the plugin and runs its android.manifest mod, like `expo prebuild` does.
async function prebuild(
  manifest: AndroidManifest,
  props?: Parameters<typeof withFilePreviewTurbo>[1]
): Promise<AndroidManifest> {
  const config: ExportedConfig = withFilePreviewTurbo(
    { name: 'test-app', slug: 'test-app' },
    props
  );
  const mod = config.mods?.android?.manifest;
  if (typeof mod !== 'function') {
    throw new Error('android.manifest mod is not registered');
  }

  const result = await mod({
    ...config,
    modResults: manifest,
    modRequest: {
      projectRoot: '/app',
      platformProjectRoot: '/app/android',
      modName: 'manifest',
      platform: 'android',
      introspect: true,
    },
    modRawConfig: { name: 'test-app', slug: 'test-app' },
  });

  return result.modResults;
}

describe('withFilePreviewTurbo', () => {
  it('adds a VIEW intent for every MIME type', async () => {
    const manifest = await prebuild(createManifest(), {
      mimeTypes: ['application/pdf', 'image/*'],
    });

    expect(mimeTypesOf(manifest)).toEqual(['application/pdf', 'image/*']);
    expect(manifest.manifest.queries[1]?.intent?.[0]).toEqual({
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      data: [{ $: { 'android:mimeType': 'application/pdf' } }],
    });
  });

  it('does not add duplicates when prebuild runs again', async () => {
    const manifest = createManifest();

    await prebuild(manifest, { mimeTypes: ['application/pdf'] });
    await prebuild(manifest, { mimeTypes: ['application/pdf', 'image/*'] });

    expect(mimeTypesOf(manifest)).toEqual(['application/pdf', 'image/*']);
  });

  it('creates <queries> when the manifest has none', async () => {
    const manifest = createManifest();
    // @ts-expect-error simulate a manifest without <queries>
    delete manifest.manifest.queries;

    await prebuild(manifest, { mimeTypes: ['application/pdf'] });

    expect(mimeTypesOf(manifest)).toEqual(['application/pdf']);
  });

  it('does nothing without options', async () => {
    const manifest = await prebuild(createManifest());

    expect(manifest).toEqual(createManifest());
  });
});
