import os from 'node:os';
import Logger from './Logger';
import mediasoup from 'mediasoup';

const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: { 'x-google-start-bitrate': 1000 },
  },
];

type IWorker = Array<{
  worker: mediasoup.types.Worker;
  router: mediasoup.types.Router;
}>;

export async function startMediaSoup(): Promise<IWorker> {
  const workers: IWorker = [];
  for (let i = 0; i < Object.keys(os.cpus()).length; i++) {
    let worker = await mediasoup.createWorker({
      rtcMinPort: 10000,
      rtcMaxPort: 11000,
    });
    worker.on('died', () => {
      Logger.error('Mediasoup worker died');
      process.exit(1);
    });
    const router = await worker.createRouter({
      mediaCodecs,
    });
    workers.push({ worker, router });
  }
  return workers;
}
