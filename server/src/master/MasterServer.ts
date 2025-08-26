import express, { Express, Request, Response } from 'express';
import { Server } from 'http';

/**
 * Simple master server wrapper using Express and HTTP.
 * Provides typed start and stop methods to manage the server lifecycle.
 */
export default class MasterServer {
  private readonly app: Express;
  private httpServer: Server | null = null;

  constructor() {
    this.app = express();

    this.app.get('/status', (_req: Request, res: Response): void => {
      res.json({ status: 'ok' });
    });
  }

  /**
   * Start listening on the provided port.
   * @param port The port to listen on.
   */
  public start(port: number): void {
    this.httpServer = this.app.listen(port, () => {
      console.log(`Master server listening on http://localhost:${port}`);
    });
  }

  /**
   * Stop the server if it is running.
   */
  public stop(): void {
    this.httpServer?.close();
    this.httpServer = null;
  }
}
