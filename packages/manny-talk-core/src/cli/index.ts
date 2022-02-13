import yargs from 'yargs';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { MannyTalk } from '../manny-talk';
import { isError } from '../types';

async function startApp(config: Record<string, any>) {
  // @ts-expect-error We should have validation here to verify that we are providing MannyTalk with a correct config.
  const app = new MannyTalk(config);

  app
    .start()
    .then(function () {
      console.log('Ready...');
    })
    .catch(function (error) {
      console.error('Unable to start genie-router!');
      console.error('Cause: ', error);
      process.exit(1);
    });
}

export default async function cli() {
  const { default: appPackage } = await import(
    join(__dirname, '../../package.json')
  );

  const argv = yargs
    .usage('Usage: $0 -c config.json')
    .option('c', {
      alias: 'config',
      describe: 'The location of the configuration file.',
    })
    .help('help', 'Show this help and exit')
    .demandOption('config')
    .version(appPackage.version).argv;

  try {
    const file = await readFile(argv.config as string, { encoding: 'utf-8' });
    const config = JSON.parse(file);

    try {
      await startApp(config);
    } catch (error) {
      console.error(
        'Error while running application:',
        isError(error) ? error.message : error
      );
    }
  } catch (error) {
    yargs.showHelp();
    console.log(
      'Unable to open',
      argv.config,
      ': ',
      isError(error) ? error.message : error
    );
    process.exit(1);
  }
}
