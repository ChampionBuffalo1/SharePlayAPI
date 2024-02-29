import 'dotenv-safe/config';
import '@total-typescript/ts-reset';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import express from 'express';
import apiRouter from './api';
import { PORT } from './Constants';
import Logger from './utils/Logger';
import { createServer } from 'node:http';
import { createRelayServer } from './rtcRelay';

const app = express();
const server = createServer(app);
app
  .disable('x-powered-by')
  .set('trust proxy', 1)
  .use(helmet(), cors(), morgan('dev'), express.json({ limit: '500kb' }), express.urlencoded({ limit: '16kb' }));

app.use('/api', apiRouter);
app.get('/', (_, res) => res.sendStatus(200));
createRelayServer('/ws', server);

server.listen(PORT, () => Logger.info(`Listening on port ${PORT}`));
