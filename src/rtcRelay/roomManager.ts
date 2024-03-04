import { getWorker } from '../utils/initWorker';
import type { Consumer, Producer, Router, Worker, WebRtcTransport } from 'mediasoup/node/lib/types';

export class Peer {
  sendTransport: WebRtcTransport | null;
  recvTransport: WebRtcTransport | null;
  producer: Producer | null = null;
  consumers: Consumer[] = [];
  constructor({ sendTransport, recvTransport }: { sendTransport?: WebRtcTransport; recvTransport?: WebRtcTransport }) {
    this.sendTransport = sendTransport ?? null;
    this.recvTransport = recvTransport ?? null;
    this.sendTransport?.on('dtlsstatechange', dtls => {
      if (dtls === 'closed') this.close();
    });
  }

  close() {
    this.producer?.close();
    this.recvTransport?.close();
    this.sendTransport?.close();
    this.consumers.forEach(c => c.close());
  }
}

type Room = {
  worker: Worker;
  router: Router;
  peers: Map<string, Peer>;
};
class RoomService {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map();
  }
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRouter(roomId: string) {
    return this.rooms.get(roomId)?.router;
  }

  async createRoom(roomId: string): Promise<RoomService> {
    const room = this.rooms.get(roomId);
    if (room) {
      return this;
    }
    const { worker, router } = getWorker();
    this.rooms.set(roomId, {
      worker,
      router,
      peers: new Map(),
    });

    return this;
  }

  removeRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.peers.forEach(peer => peer.close());
    this.rooms.delete(roomId);
    return this;
  }

  addPeer(roomId: string, peerId: string, peer: Peer) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    room.peers.set(peerId, peer);
    return this;
  }

  removePeer(roomId: string, peerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const peer = room.peers.get(peerId);
    if (!peer) return;
    peer.close();

    return this;
  }
}

const rooms = new RoomService();

export default rooms;
