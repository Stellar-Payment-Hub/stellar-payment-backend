import { Server } from 'http';

export function setupGracefulShutdown(server: Server): void {
  const handleSignal = (signal: string) => {
    console.log(`[Shutdown] Received ${signal}. Draining active HTTP connections...`);
    server.close(() => {
      console.log('[Shutdown] Server closed cleanly. Process exiting.');
      process.exit(0);
    });

    // Force exit if hanging
    setTimeout(() => {
      console.error('[Shutdown] Forceful shutdown deadline exceeded. Exiting.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleSignal('SIGTERM'));
  process.on('SIGINT', () => handleSignal('SIGINT'));
}
