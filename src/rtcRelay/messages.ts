import { WebSocket } from 'ws';
import { RequestContent } from '../schema/SignalingSchema';
import { transportConnect, transportProduce, consumeMediaTransport, createDeviceTransport } from './EventHandlers';

export const eventMapping: Record<string, Function> = {
  'create-transport': createDeviceTransport,
  'transport-connect': transportConnect,
  'transport-produce': transportProduce,
  'consume-media': consumeMediaTransport,
};

export function handleMessage(socket: WebSocket, data: RequestContent) {
  eventMapping[data.op](socket, data.d);
}
