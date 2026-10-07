# react-native-file-viewer-turbo example

A bare React Native app that demonstrates the library. [`src/App.tsx`](src/App.tsx) downloads [`docs/sample.pdf`](../docs/sample.pdf) with [@dr.pogodin/react-native-fs](https://github.com/birdofpreyru/react-native-fs) and opens it with `open()`.

The app is part of the repository's Yarn workspace and uses the library straight from [`../src`](../src), so don't install its dependencies with npm. Run everything from the repository root:

```sh
yarn                 # install dependencies for the library and the example
yarn example start   # start Metro
yarn example android # build and run on Android
yarn example ios     # build and run on iOS (installs pods automatically)
```

See the [contributing guide](../CONTRIBUTING.md#development-workflow) for details.
