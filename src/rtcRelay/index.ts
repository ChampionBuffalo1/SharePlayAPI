import { Server } from 'http';
import { PORT } from '../Constants';
import Logger from '../utils/Logger';
import { WebSocketServer } from 'ws';
import { handleConnection } from './connection';

export function createRelayServer(path: string, server: Server) {
  const signalingServer = new WebSocketServer({ path, server });
  signalingServer.on('connection', handleConnection);
  signalingServer.on('error', err => Logger.error('Websocket server error: ' + err));
  signalingServer.on('listening', () => Logger.info(`Websocket server listening ${path} at port: ${PORT}`));
}
