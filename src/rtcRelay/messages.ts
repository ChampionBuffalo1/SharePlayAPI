import { WebSocket } from 'ws';
import { RequestContent } from '../schema/SignalingSchema';
import { createStream, transportConnect, transportProduce } from './EventHandlers';

export const eventMapping: Record<string, Function> = {
  'start-stream': createStream,
  'transport-connect': transportConnect,
  'transport-produce': transportProduce,
};

export function handleMessage(socket: WebSocket, data: RequestContent) {
  eventMapping[data.op](socket, data.d);
}
