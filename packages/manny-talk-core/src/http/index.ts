import Debug from 'debug';
import { Express } from 'express';
import { Config } from '../types';

const debug = Debug('manny-talk:core:http');

let app: Express | null = null;

export default async function start(config?: Config['http']): Promise<Express> {
  // start has been invoked earlier and http is enabled, return the initialized app
  if (app !== null) {
    return app;
  }

  if (!config) {
    throw new Error('App was not set, but configuration is not provided.');
  }

  const { default: express } = await import('express');

  app = express();
  app.use(express.json());

  const port = config.port || 3001;
  app.listen(port);
  debug('Listening for HTTP on port %d', port);

  return app;
}
