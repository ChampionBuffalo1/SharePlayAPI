import { WebSocket } from 'ws';
import Logger from '../utils/Logger';
import rooms, { Peer } from './roomManager';
import createTransport, { ClientDirection } from '../utils/createTransport';
import type { AppData, DtlsFingerprint, DtlsRole, MediaKind, RtpParameters } from 'mediasoup/node/lib/types';

export async function createStream(socket: WebSocket, data: { roomId: string; peerId: string }) {
  if (!data) return;
  const room = await rooms.createRoom(data.roomId);
  const router = room.getRouter(data.roomId);
  if (!router) return;

  const transport = await createTransport(router, 'send');
  const peer = new Peer({
    sendTransport: transport,
  });
  room.addPeer(data.roomId, data.peerId, peer);

  socket.send(
    JSON.stringify({
      op: 'stream-started',
      d: {
        router: {
          rtpCapabilities: router.rtpCapabilities,
        },
        transport: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      },
    }),
  );
}

export async function transportConnect(
  socket: WebSocket,
  data: {
    roomId: string;
    peerId: string;
    direction: ClientDirection;
    dtlsParameters: {
      role?: DtlsRole;
      fingerprints: DtlsFingerprint[];
    };
  },
): Promise<void> {
  const room = rooms.getRoom(data.roomId);
  const peer = room?.peers.get(data.peerId);
  if (!peer) return;
  const transport = data.direction === 'send' ? peer.sendTransport : peer.recvTransport;
  if (!transport) {
    // send some type of error back to the client
    return;
  }
  try {
    await transport.connect({ dtlsParameters: data.dtlsParameters });
    socket.send(JSON.stringify({ op: 'transport-connected' }));
  } catch (err) {
    // TODO
  }
}

export async function transportProduce(
  socket: WebSocket,
  data: {
    roomId: string;
    peerId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    appData: AppData;
  },
): Promise<void> {
  const room = rooms.getRoom(data.roomId);
  const peer = room?.peers.get(data.peerId);
  if (!peer?.sendTransport) return;

  const producer = await peer.sendTransport.produce({
    kind: data.kind,
    rtpParameters: data.rtpParameters,
  });

  peer.producer = producer;

  producer.on('transportclose', () => {
    Logger.info('Tranport of the producer closed');
    producer.close();
  });

  socket.send(
    JSON.stringify({
      op: 'transport-produced',
      d: {
        id: producer.id,
      },
    }),
  );
}
