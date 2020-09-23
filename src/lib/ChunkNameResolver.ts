import {basename, extname} from 'path';
import type {RollupWebWorkerPluginNameFunction as NameFn} from '../types/PluginOpts';

function resolveConstantName(absolute: string): string {
  return basename(absolute, extname(absolute));
}

/** @internal */
export class ChunkNameResolver {
  public readonly resolve: NameFn;

  public constructor(private readonly name: string | NameFn) {
    switch (typeof name) {
      case 'string':
        if (!name) {
          throw new Error('Chunk name resolve function can\'t be an empty string');
        }
        this.resolve = this.resolveStringFunction();
        break;
      case 'function':
        this.resolve = this.resolveByFunction;
        break;
      default:
        throw new Error('Invalid name option');
    }
  }

  private resolveByFunction(absolute: string): string {
    return (this.name as NameFn)(absolute);
  }

  private resolveConstant(): string {
    return this.name as string;
  }

  private resolvePlaceholdered(absolute: string): string {
    return (this.name as string).replace(/\[name]/g, resolveConstantName(absolute));
  }

  private resolveStringFunction(): NameFn {
    if (this.name === '[name]') {
      return resolveConstantName;
    } else if ((this.name as string).includes('[name]')) {
      return this.resolvePlaceholdered;
    }

    return this.resolveConstant;
  }
}
