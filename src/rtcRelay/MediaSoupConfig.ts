import { RtpCodecCapability, TransportListenInfo, WorkerSettings } from 'mediasoup/node/lib/types';

const MediaSoupConfig = {
  worker: {
    rtcMinPort: 25000,
    rtcMaxPort: 32000,
    logLevel: 'debug',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp', 'message'],
  } as WorkerSettings,
  router: {
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48_000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90_000,
        parameters: { 'x-google-start-bitrate': 1000 },
      },
    ] as RtpCodecCapability[],
  },
  webRtcTransport: {
    listenIps: [
      {
        ip: process.env.LISTEN_IP || '192.168.29.92',
        announcedIp: process.env.ANNOUNCED_IP,
      },
    ] as TransportListenInfo[],
    initialAvailableOutgoingBitrate: 800000,
  },
} as const;

export default MediaSoupConfig;
