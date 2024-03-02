import type { WebSocket } from 'ws';
import { incomingRequest } from '../schema/SignalingSchema';
import { handleMessage } from './messages';

export async function handleConnection(ws: WebSocket) {
  // TODO: Authentication steps

  ws.on('message', async (buffer: Buffer) => {
    const message = await incomingRequest.spa(JSON.parse(buffer.toString()));
    if (message.success) {
      handleMessage(ws, message.data);
    } else {
      const errors = message.error.issues.map(issue => ({
        param: issue.path[0] as string,
        message: issue.message,
        code: 'INVALID_INPUT',
      }));
      ws.send(
        JSON.stringify({
          errors,
        }),
      );
    }
  });
}
