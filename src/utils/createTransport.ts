import { Router, WebRtcTransport } from 'mediasoup/node/lib/types';
import MediaSoupConfig from '../rtcRelay/MediaSoupConfig';

export type ClientDirection = 'send' | 'recv';

export default async function createTransport(router: Router, direction: ClientDirection): Promise<WebRtcTransport> {
  const transport = await router.createWebRtcTransport({
    listenIps: MediaSoupConfig.webRtcTransport.listenIps,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    appData: { clientDirection: direction },
  });

  return transport;
}
