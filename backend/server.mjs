import { createServer } from 'node:http';

import { createApp } from './app.mjs';
import { loadConfig } from './config.mjs';

const config = loadConfig();
const server = createServer(createApp(config));

server.listen(config.port, config.host, () => {
  console.log(`RN Mall mobile API listening on http://${config.host}:${config.port}`);
});
