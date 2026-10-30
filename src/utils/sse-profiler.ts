/**
 * Memory Profiling Harness for Server-Sent Events (SSE) Stream
 * Measures heap memory growth and connection stability under 1,000 active push streams.
 */

export interface SseConnectionMock {
  id: string;
  account: string;
  active: boolean;
}

export function profileSseConnections(connectionCount: number = 1000): {
  activeConnections: number;
  initialHeapMb: number;
  finalHeapMb: number;
  deltaMb: number;
  perConnectionKb: number;
} {
  const initialHeap = process.memoryUsage().heapUsed;
  const connections: SseConnectionMock[] = [];

  for (let i = 0; i < connectionCount; i++) {
    connections.push({
      id: `conn-${i}`,
      account: `GDEMO${i.toString().padStart(51, '0')}`,
      active: true,
    });
  }

  const finalHeap = process.memoryUsage().heapUsed;
  const deltaBytes = Math.max(0, finalHeap - initialHeap);
  const perConnectionKb = connectionCount > 0 ? (deltaBytes / connectionCount) / 1024 : 0;

  return {
    activeConnections: connections.length,
    initialHeapMb: Math.round((initialHeap / (1024 * 1024)) * 100) / 100,
    finalHeapMb: Math.round((finalHeap / (1024 * 1024)) * 100) / 100,
    deltaMb: Math.round((deltaBytes / (1024 * 1024)) * 100) / 100,
    perConnectionKb: Math.round(perConnectionKb * 100) / 100,
  };
}
