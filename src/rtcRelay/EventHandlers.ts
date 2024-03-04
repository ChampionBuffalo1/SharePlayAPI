import { WebSocket } from 'ws';
import Logger from '../utils/Logger';
import rooms, { Peer } from './roomManager';
import createConsumer, { Consumer } from '../utils/createConsumer';
import createTransport, { ClientDirection } from '../utils/createTransport';
import type {
  AppData,
  DtlsRole,
  MediaKind,
  RtpParameters,
  DtlsFingerprint,
  WebRtcTransport,
  RtpCapabilities,
} from 'mediasoup/node/lib/types';

export async function createDeviceTransport(
  socket: WebSocket,
  data: { roomId: string; peerId: string; direction: ClientDirection },
) {
  if (!data) return;
  const room = await rooms.createRoom(data.roomId);
  const router = room.getRouter(data.roomId);
  if (!router) return;

  const transport = await createTransport(router, data.direction);
  const param: Record<string, WebRtcTransport> = {};
  param[data.direction === 'send' ? 'sendTransport' : 'recvTransport'] = transport;
  const peer = new Peer(param);
  room.addPeer(data.roomId, data.peerId, peer);

  socket.send(
    JSON.stringify({
      op: 'transport-created',
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

export async function consumeMediaTransport(
  socket: WebSocket,
  data: {
    roomId: string;
    peerId: string;
    rtpCapabilities: RtpCapabilities;
  },
) {
  const room = rooms.getRoom(data.roomId);
  // does the peerId needs to be the host peer id or my peer id
  const peer = room?.peers.get(data.peerId);
  if (!peer?.recvTransport) return;

  console.log(room, data.peerId);

  const consumerParameters: Consumer[] = [];
  try {
    for (const [senderPeerId, senderPeer] of room!.peers.entries()) {
      if (senderPeerId === data.peerId || !senderPeer?.producer) {
        continue;
      }
      const consumer = await createConsumer(data.roomId, senderPeerId, peer.recvTransport, data.rtpCapabilities);
      if (!consumer) continue;
      consumerParameters.push(consumer);
    }

    socket.send(
      JSON.stringify({
        op: 'media-consume',
        d: {
          roomId: data.roomId,
          parameters: consumerParameters,
        },
      }),
    );
  } catch (err) {
    // if (err instanceof Error && err.message === 'Invalid-Room') {
    //   socket.send(
    //     JSON.stringify({
    //       op: 'media-consume',
    //       d: {
    //         error: err.cause,
    //       },
    //     }),
    //   );
    //   return;
    // }
    console.log(err);
  }
}
