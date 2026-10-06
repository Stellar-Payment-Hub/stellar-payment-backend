import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
}

class PaymentStreamManager {
  private clients: Map<string, SSEClient> = new Map();

  public addClient(id: string, res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    this.clients.set(id, { id, res });
  }

  public removeClient(id: string): void {
    this.clients.delete(id);
  }

  public broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(payload);
      } catch (err) {
        console.warn(`[PaymentStream] Failed to write to client ${id}:`, err);
        this.clients.delete(id);
      }
    }
  }

  public getActiveClientCount(): number {
    return this.clients.size;
  }
}

export const paymentStream = new PaymentStreamManager();
