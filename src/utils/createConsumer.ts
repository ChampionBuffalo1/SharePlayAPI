import rooms from '../rtcRelay/roomManager';
import type { ConsumerType, RtpCapabilities, RtpParameters, WebRtcTransport } from 'mediasoup/node/lib/types';

export default async function createConsumer(
  roomId: string,
  hostPeerId: string,
  transport: WebRtcTransport,
  recvRtpCapabilities: RtpCapabilities,
): Promise<Consumer | undefined> {
  const room = rooms.getRoom(roomId);
  const peer = room?.peers.get(hostPeerId);
  if (!room || !peer?.producer) {
    // this shouldn't be thrown in most cases because the caller of this function
    // verifies that room exists along with the peer producer
    throw new Error('Invalid-Room', {
      cause: `No room with id ${roomId} found`,
    });
  }
  const producer = peer.producer;

  if (
    !room.router.canConsume({
      producerId: producer.id,
      rtpCapabilities: recvRtpCapabilities,
    })
  ) {
    throw new Error(`client cannot consume data of ${producer.id}`);
  }

  // joinee's recv Transport
  const consumer = await transport.consume({
    producerId: producer.id,
    rtpCapabilities: recvRtpCapabilities,
    paused: false,
  });

  consumer.observer.on('close', () => {
    console.log('Consumer with id %s closed ', consumer.id);
  });
  consumer.on('transportclose', () => {
    console.log('Transport for consumer is closing : ', consumer.id);
    const idx = peer.consumers.findIndex(cms => cms.id === consumer.id);
    if (idx === -1) return;
    peer.consumers[idx].close();
    peer.consumers.splice(idx, 1);
  });

  peer.consumers.push(consumer);

  return {
    id: consumer.id,
    type: consumer.type,
    kind: consumer.kind,
    producerId: producer.id,
    producerPaused: producer.paused,
    rtpParameters: consumer.rtpParameters,
  };
}

export interface Consumer {
  producerId: string;
  id: string;
  kind: string;
  rtpParameters: RtpParameters;
  type: ConsumerType;
  producerPaused: boolean;
}
