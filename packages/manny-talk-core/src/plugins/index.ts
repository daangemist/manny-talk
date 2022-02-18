import { SuperPlug } from 'superplug';
import Debug from 'debug';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { Express } from 'express'; // Only import the type, express is imported async.
import { stat, mkdir, writeFile } from 'fs/promises';
// @ts-expect-error npm-utils has no @types/npm-utils
import npmUtils from 'npm-utils';
import http from '../http';
import { readFromObject } from '../utils';
import BrainSelector from '../brain-selector';
import {
  Brain,
  Client,
  ClientStart,
  Config,
  isErrorWithCode,
  PluginHttp,
  LoadedPlugin,
  isDefaultExport,
} from '../types';

const debug = Debug('manny-talk:core:plugins');

export class Loader {
  private plugins: Record<string, LoadedPlugin> = {};
  private clients: Record<string, Client> = {};
  private httpEnabled = false;
  private location = ''; //value is initialized in startPlugins()
  private superPlug: SuperPlug | undefined;

  constructor(
    private config: Config,
    private clientStartObjectGenerator: (
      pluginName: string,
      plugin: LoadedPlugin
    ) => ClientStart,
    private brainSelector: BrainSelector,
    private eventEmitter: EventEmitter
  ) {}

  setHttpEnabled(value: boolean): Loader {
    this.httpEnabled = value;
    return this;
  }

  /**
   * Returns a promise that resolves when all plugins are loaded.
   * @return {Promise}
   */
  public async startPlugins(usePluginStore: boolean): Promise<void> {
    if (!usePluginStore) {
      await this.startFoundPlugins();
      return;
    }

    try {
      this.location = await this.getPluginStoreLocation();
      await stat(path.join(this.location, 'node_modules'));
    } catch (err) {
      if (isErrorWithCode(err) && err.code !== 'ENOENT') {
        throw err;
      }
      // TODO this is to to check if node_modules does not exist, but if a parent folder
      // also does not exist, it fails with weird errors.
      await this.npmInstall();
    }

    this.superPlug = new SuperPlug({
      location: this.location,
      packageProperty: 'mannyTalkPlugin',
    });
    await this.loadPlugins();
    await this.startFoundPlugins();
  }

  /**
   * If this a configured path, make sure we can access it, if it is the default, create it if it does not exists.
   * @return Promise
   */
  private async getPluginStoreLocation(): Promise<string> {
    const configuredPath = readFromObject(
      this.config,
      'pluginStore.location',
      false
    );
    if (configuredPath) {
      debug('Found configured path', configuredPath);
      await this.checkConfiguredPath(configuredPath);
      return configuredPath;
    }
    return this.useDefaultConfigurationPath();
  }

  private async checkConfiguredPath(configuredPath: string): Promise<void> {
    const result = await stat(configuredPath);
    if (!result.isDirectory()) {
      throw new Error('Configured pluginStore location is not a directory.');
    }
    await this.checkPluginLocation(configuredPath);
  }

  /**
   * Check if the default configuration path ($HOME/.manny-text) exists,
   * if not, create it.
   */
  private async useDefaultConfigurationPath() {
    const defaultPath = path.join(os.homedir(), '.manny-text');

    try {
      const result = await stat(defaultPath);
      debug(defaultPath, 'found');
      if (!result.isDirectory()) {
        throw new Error(`${defaultPath} exists, but is not a directory`);
      }
    } catch (err) {
      if (isErrorWithCode(err) && err.code !== 'ENOENT') {
        throw err;
      }

      debug(defaultPath, 'did not exist.');
      // Attempt to create the folder
      await mkdir(defaultPath);
      debug('Created', defaultPath);
    }

    await this.checkPluginLocation(defaultPath);
    return defaultPath;
  }

  private async checkPluginLocation(pluginPath: string) {
    debug(`Checking if ${pluginPath}/package.json exists`);

    try {
      const statResult = await stat(path.join(pluginPath, 'package.json'));
      if (!statResult.isFile()) {
        throw new Error(`${pluginPath}/package.json is not a file.`);
      }
      debug('Found package.json in ', pluginPath);
      return pluginPath; // It exists, we can return the Promise
    } catch (err) {
      if (isErrorWithCode(err) && err.code !== 'ENOENT') {
        throw err;
      }
    }

    // Create package.json
    debug('Creating package.json in folder', pluginPath);
    await writeFile(
      path.join(pluginPath, 'package.json'),
      JSON.stringify({
        name: 'manny-text-plugins',
        dependencies: {
          // Default dependencies
          'genie-router-cli-local':
            'github:matueranet/genie-router-plugin-cli-local',
          'genie-router-plugin-echo':
            'github:matueranet/genie-router-plugin-echo',
          'genie-router-plugin-brain-mentions':
            'github:matueranet/genie-router-plugin-brain-mentions',
        },
      })
    );

    return pluginPath;
  }

  getClients() {
    return this.clients;
  }

  private async getExpress(): Promise<Express> {
    if (!this.httpEnabled) {
      throw new Error('express is fetched, while http is not enabled.');
    }

    const { default: express } = await import('express');
    // @ts-expect-error The type of express is not properly recognized because of the dynamic import.
    return express;
  }

  public addPlugin(name: string, plugin: LoadedPlugin) {
    this.plugins[name] = plugin;
  }

  private async startFoundPlugins() {
    const plugins = Object.keys(this.plugins);
    debug('Found plugins: ', plugins);
    const promises: Promise<void>[] = [];
    const brains: Record<string, Brain> = {};

    plugins.forEach((pluginName) => {
      const pluginConfig = readFromObject(
        this.config,
        `plugins.${pluginName}`,
        {} // We've checked earlier that the plugin has a configuration.
      );
      const plugin = this.plugins[pluginName];
      debug(
        'Processing %s, with attributes %s',
        pluginName,
        Object.keys(plugin)
      );

      if (plugin.brain) {
        promises.push(
          plugin.brain.start(pluginConfig).then((brain: Brain) => {
            brains[pluginName] = brain;
          })
        );
      }
      if (plugin.client) {
        // thing here is that the startObject needs the speak function, which
        // is only available after the start function has been invoked. Needed
        // some trickery to make it work.
        const startObject = this.clientStartObjectGenerator(pluginName, plugin);
        promises.push(
          plugin.client
            .start(pluginConfig, startObject)
            .then((client: Client) => {
              this.clients[pluginName] = client;
            })
        );
      }
      if (plugin.brainSelector) {
        promises.push(
          plugin.brainSelector.start(pluginConfig).then((brainSelector) => {
            this.brainSelector.use(pluginName, brainSelector);
          })
        );
      }
      if (plugin.http) {
        if (!this.httpEnabled) {
          debug(
            'HTTP is not enabled, Ignoring http component of plugin',
            pluginName
          );
        } else {
          promises.push(
            http().then((app) =>
              this.getExpress().then((express) =>
                (plugin.http as PluginHttp).start(pluginConfig, app, express)
              )
            )
          );
        }
      }
      if (plugin.listener) {
        promises.push(plugin.listener.start(pluginConfig, this.eventEmitter));
      }
    });

    await Promise.all(promises);
    this.brainSelector.setBrains(brains);
  }

  private getSuperPlug(): SuperPlug {
    if (typeof this.superPlug === 'undefined') {
      throw new Error('SuperPlug was not initialized in plugin loader.');
    }
    return this.superPlug;
  }

  private async loadPlugins() {
    const foundPlugins = await this.getSuperPlug().getPlugins();
    const promises: Promise<void>[] = [];

    foundPlugins.forEach(async (foundPlugin) => {
      // Only load the plugins which have a configuration
      if (
        readFromObject(this.config, `plugins.${foundPlugin.name}`, {}) !==
        undefined
      ) {
        const p = foundPlugin
          .getPlugin()
          .then((pluginModule: LoadedPlugin | { default: LoadedPlugin }) => {
            if (isDefaultExport(pluginModule)) {
              this.plugins[foundPlugin.name] = pluginModule.default;
            }
            // We already checked whether it is a default export, its not, so it must be a LoadedPlugin
            this.plugins[foundPlugin.name] = pluginModule as LoadedPlugin;
          });
        promises.push(p);
      } else {
        debug(
          'Skipping loading plugin',
          foundPlugin.name,
          'configuration is missing.'
        );
      }
    });
    return Promise.all(promises);
  }

  /**
   * Runs 'npm install' without a module name, so that the modules are installed/updated.
   * @return Promise
   */
  private async npmInstall(): Promise<void> {
    const cwd = process.cwd();
    debug('Changing npm install folder to %s', this.location);
    process.chdir(this.location);
    debug('Installing modules.');
    await npmUtils.install({
      name: '',
      flags: ['--quiet', '--production'],
    });

    // move back to the old current dir
    process.chdir(cwd);
  }
}
