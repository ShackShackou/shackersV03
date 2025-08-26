import express, { Express } from 'express';
import { Server } from 'http';

/**
 * Basic master server that exposes an Express instance.
 * It can be started and stopped programmatically.
 */
export default class MasterServer {
  private readonly app: Express;
  private readonly port: number;
  private httpServer: Server | null = null;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
  }

  /** Start listening on the configured port. */
  start(): void {
    if (this.httpServer) {
      throw new Error('MasterServer is already running');
    }

    this.httpServer = this.app.listen(this.port, () => {
      console.log(`MasterServer listening on port ${this.port}`);
    });
  }

  /** Stop the server if it is running. */
  stop(): void {
    this.httpServer?.close();
    this.httpServer = null;
  }
}
