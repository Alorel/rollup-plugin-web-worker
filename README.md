# rollup-plugin-web-worker

A somewhat opinionated Rollup plugin for emitting web workers as chunks.

[![CI](https://github.com/Alorel/rollup-plugin-web-worker/workflows/Core/badge.svg?branch=master)](https://github.com/Alorel/rollup-plugin-web-worker/actions?query=workflow%3ACore+branch%3Amaster+)
[![Coverage Status](https://coveralls.io/repos/github/Alorel/rollup-plugin-web-worker/badge.svg?branch=master)](https://coveralls.io/github/Alorel/rollup-plugin-web-worker)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Alorel/rollup-plugin-web-worker.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Alorel/rollup-plugin-web-worker/context:javascript)

-----

# Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Overview](#overview)
- [Installation](#installation)
- [Caveats and gotchas](#caveats-and-gotchas)
  - [Only Systemjs supported](#only-systemjs-supported)
  - [The module loader must be accessible by URL](#the-module-loader-must-be-accessible-by-url)
  - [There are 2 requests involved](#there-are-2-requests-involved)
- [Usage](#usage)
- [API](#api)
  - [RollupWebWorkerPluginOpts](#rollupwebworkerpluginopts)
  - [RollupWebWorkerPluginOutputOpts](#rollupwebworkerpluginoutputopts)
  - [Notes on the module loader](#notes-on-the-module-loader)
- [Notes for Typescript users](#notes-for-typescript-users)
- [Examples](#examples)
  - [Picking an emitted module loader](#picking-an-emitted-module-loader)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Overview

Instead of directly specifying the web worker's URL, you can import it through the plugin:

```javascript
import webWorkerUrl from 'web-worker-url:./path-including-extension.js';
```

# Installation

Add the registry to `.npmrc`:

```bash
@alorel:registry=https://npm.pkg.github.com
```

Then install it:

```bash
npm install @alorel/rollup-plugin-web-worker
```

This will create a chunk for `./path-including-extension.js`. 

# Caveats and gotchas

Of course there's caveats and gotchas...

## Only Systemjs supported

Feel free to open a PR if you want to add support for other output formats.

## The module loader must be accessible by URL

I.e. you must either load Systemjs from a static URL or emit it as a separate asset as part of your build. Since this
asset will be accessed twice - once by the main thread and once by the worker thread - it should really be cached so
it doesn't slow down the user experience.

## There are 2 requests involved

The worker chunk needs to be imported via `System.import` to make use of shared dependencies and generally work with
the output format. It also needs to import systemjs as the worker doesn't have access to the main thread's Systemjs
instance. As a result, each worker effectively results in two files:

1. The worker chunk containing worker code
2. A loader asset that imports the module loader and the worker:

```javascript
importScripts('/path-to-systemjs.js');
System.import('/path-to-worker.js');
```

# Usage

```javascript
// some-bundled-file.js

import webWorkerUrl from 'web-worker-url:./path-to-file-including-extension.js';

const worker = new Worker(webWorkerUrl);
```

```javascript
// rollup.config.js

import {RollupWebWorkerPlugin} from '@alorel/rollup-plugin-web-worker';

// Accepts an optional RollupWebWorkerPluginOpts object; see API below
const webWorkerPlugin = new RollupWebWorkerPlugin();

export default {
  // ...
  output: {
    // ...
    format: 'system', // only systemjs currently supported
    plugins: [
      webWorkerPlugin.createOutputPlugin({/* See RollupWebWorkerPluginOutputOpts API for required and optional options */})
    ]
  },
  plugins: [
    webWorkerPlugin.createPlugin()
  ]
}
```

# API

## RollupWebWorkerPluginOpts

```typescript
/** Worker chunk name generator function */
type NameFunction = (absolutePath: string) => string;

/** Plugin options */
interface RollupWebWorkerPluginOpts {
    /**
     * Worker chunk name.
     *
     * If given a string, [name] will be replaced with the worker file name.
     * If given a function, it'll be called with the worker file's absolute path and needs to return a string.
     * @default [name]
     */
    name?: string | NameFunction;
}
```

## RollupWebWorkerPluginOutputOpts

```typescript
/** Function for filtering through emitted chunks & asset to find the one for the module loader */
type ModuleLoaderFunction = (file: OutputAsset | OutputChunk) => boolean;

/** Output plugin options */
interface RollupWebWorkerPluginOutputOpts {
    /**
     * If given a string, this is the static URL of your module loader file
     * If given a function, it will be used to filter through all the emitted chunks and should return true for at least
     * one of them; that chunk's URL will then be used as an importScripts() arg.
     */
    moduleLoader: string | ModuleLoaderFunction;
    /**
     * Your asset output base path. If emitted chunks' and assets' URL is /assets/<filename> then this needs to be set
     * to /assets/
     * @default /
     */
    publicPath?: string;
}
```

## Notes on the module loader

If your module loader is located at a static URL then this can be set to a string. If you bundle your module loader as
part of the build then you'll need to specify a function.

The function will be passed as an `Array.prototype.filter` argument on the array of chunks and assets generated during
the Rollup build and *must* match exactly one chunk or asset. The matched chunk or asset's URL will then be used to
import the module loader in the web worker chunk.

# Notes for Typescript users

You can let typescript know how to handle `web-worker-url:*` imports by adding the following to your `tsconfig.json`:

```json
{
  "files": [
    "node_modules/@alorel/rollup-plugin-web-worker/moduledef.d.ts"
  ]
}
```

# Examples

See also: `src/**/*.spec.ts` files and `test/fixtures` directory.

## Picking an emitted module loader

```javascript
const webWorkerPlugin = new RollupWebWorkerPlugin();
const regex = /system(\..+)?\.js/
function isSystemjsAsset(chunk) {
  return chunk.type === 'asset' && regex.test(chunk.fileName);
}

export default {
  // ...
  output: {
    // ...
    plugins: [
       webWorkerPlugin.createOutputPlugin({moduleLoader: isSystemjsAsset})
    ]
  }
}
```
