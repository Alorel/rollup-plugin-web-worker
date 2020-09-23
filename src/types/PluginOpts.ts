import {OutputAsset, OutputChunk} from 'rollup';

/** Worker chunk name generator function */
type NameFunction = (absolutePath: string) => string;

/** Function for filtering through emitted chunks & asset to find the one for the module loader */
type ModuleLoaderFunction = (file: OutputAsset | OutputChunk) => boolean;

/** Output plugin options */
interface RollupWebWorkerPluginOutputOpts {

  /**
   * If given a string, this is the static URL of your module loader file
   * If given a function, it will be used to filter through all the emitted chunks and should return true for at least
   * one of them; that chunk's URL will then be used as an importScripts() arg.
   * @see https://github.com/Alorel/rollup-plugin-web-worker#notes-on-the-module-loader
   */
  moduleLoader: string | ModuleLoaderFunction;

  /**
   * Your asset output base path. If emitted chunks' and assets' URL is /assets/<filename> then this needs to be set
   * to /assets/
   * @default /
   */
  publicPath?: string;
}

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

export {
  RollupWebWorkerPluginOpts,
  RollupWebWorkerPluginOutputOpts,
  NameFunction as RollupWebWorkerPluginNameFunction,
  ModuleLoaderFunction as RollupWebWorkerPluginModuleLoaderFunction
};
