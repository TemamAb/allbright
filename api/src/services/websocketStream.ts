import { sharedEngineState } from './engineState';
import { logger } from './logger';

const wsLib = require('ws') as {
  WebSocketServer: any;
  WebSocket: { OPEN: number };
};
const WebSocketServer = wsLib.WebSocketServer;
const WebSocket = wsLib.WebSocket;

/**
 * Phase 4: Live Data & Alerts
 * High-performance WebSocket broadcaster with message ordering guarantees
 * that streams the shared engine state directly to dashboard UI clients.
 */
export class WebsocketStream {
  private static wss: any = null;
  private static sequenceNumber = 0;
  private static lastBroadcastState: string = '';

  /**
   * Initialize the stream with an existing HTTP server
   */
  static init(server: any) {
    this.wss = new WebSocketServer({ server, path: '/api/v1/stream' });

    this.wss.on('connection', (ws: any) => {
      logger.info('Dashboard UI connected to live telemetry stream');

      // Immediately push a full snapshot upon connection with sequence number
      const snapshotMessage = {
        type: 'SNAPSHOT',
        sequence: this.sequenceNumber,
        timestamp: Date.now(),
        payload: sharedEngineState
      };
      ws.send(JSON.stringify(snapshotMessage));
    });

    logger.info('Live Telemetry Stream initialized on /api/v1/stream');
  }

  /**
   * Broadcasts the current sharedEngineState to all connected UI clients.
   * Includes sequence numbers and state change detection to prevent race conditions.
   */
  static broadcast() {
    if (!this.wss) return;

    // Increment sequence number for ordering
    this.sequenceNumber++;

    // Create message with ordering guarantees
    const stateString = JSON.stringify(sharedEngineState);
    const message = {
      type: 'UPDATE',
      sequence: this.sequenceNumber,
      timestamp: Date.now(),
      checksum: require('crypto').createHash('md5').update(stateString).digest('hex').substring(0, 8),
      payload: sharedEngineState
    };

    // Only broadcast if state actually changed (prevents redundant messages)
    if (stateString !== this.lastBroadcastState) {
      const messageString = JSON.stringify(message);

      // Send to all clients with error handling
      this.wss.clients.forEach((client: any) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(messageString);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn({ error: message }, 'WebSocket send failed');
          }
        }
      });

      this.lastBroadcastState = stateString;

      // Log sequence info occasionally
      if (this.sequenceNumber % 100 === 0) {
        logger.info({
          sequence: this.sequenceNumber,
          clients: this.wss.clients.size,
          checksum: message.checksum
        }, 'WebSocket broadcast');
      }
    }
  }
}
