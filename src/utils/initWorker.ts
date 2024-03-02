import os from 'node:os';
import Logger from './Logger';
import * as mediasoup from 'mediasoup';
import MediaSoupConfig from '../rtcRelay/MediaSoupConfig';

type IWorker = Array<{
  worker: mediasoup.types.Worker;
  router: mediasoup.types.Router;
}>;

export const workers: IWorker = [];

export async function startMediaSoup(): Promise<void> {
  for (let i = 0; i < Object.keys(os.cpus()).length; i++) {
    let worker = await mediasoup.createWorker(MediaSoupConfig.worker);
    worker.on('died', () => {
      Logger.error('Mediasoup worker died');
      process.exit(1);
    });
    const router = await worker.createRouter(MediaSoupConfig.router);
    workers.push({ worker, router });
  }
  Logger.info('Mediasoup started');
}

let workerIdx = 0;
export function getWorker() {
  const worker = workers[workerIdx++];
  workerIdx %= workers.length;
  return worker;
}
