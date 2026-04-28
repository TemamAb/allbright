import { WebSocketServer, WebSocket } from 'ws';
import { sharedEngineState } from './engineState';
import { logger } from './logger';

/**
 * Phase 4: Live Data & Alerts
 * High-performance WebSocket broadcaster that streams the shared engine state
 * directly to dashboard UI clients.
 */
export class WebsocketStream {
  private static wss: WebSocketServer | null = null;

  /**
   * Initialize the stream with an existing HTTP server
   */
  static init(server: any) {
    this.wss = new WebSocketServer({ server, path: '/api/v1/stream' });
    
    this.wss.on('connection', (ws) => {
      logger.info('Dashboard UI connected to live telemetry stream');
      
      // Immediately push a full snapshot upon connection
      ws.send(JSON.stringify({ type: 'SNAPSHOT', payload: sharedEngineState }));
    });

    logger.info('Live Telemetry Stream initialized on /api/v1/stream');
  }

  /**
   * Broadcasts the current sharedEngineState to all connected UI clients.
   * Invoked by mockRustBridge or real IPC heartbeats.
   */
  static broadcast() {
    if (!this.wss) return;
    const message = JSON.stringify({ type: 'UPDATE', payload: sharedEngineState });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}