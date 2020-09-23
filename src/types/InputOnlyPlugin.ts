import {OutputPlugin, Plugin} from 'rollup';

export type InputOnlyPlugin = Omit<Plugin, keyof Omit<OutputPlugin, 'name'>>;
