import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Docker Compose Architecture Validation', () => {
  it('validates docker-compose.yml configuration and service networking', () => {
    const composeContent = fs.readFileSync(path.resolve(process.cwd(), 'docker-compose.yml'), 'utf8');
    
    // Services
    expect(composeContent).toContain('stellar-payment-backend:');
    expect(composeContent).toContain('stellar-payment-frontend:');

    // Healthcheck dependency
    expect(composeContent).toContain('condition: service_healthy');

    // Network
    expect(composeContent).toContain('stellar-hub-network:');
    expect(composeContent).toContain('driver: bridge');

    // Port mappings
    expect(composeContent).toContain('"3000:3000"');
    expect(composeContent).toContain('"80:80"');
  });
});
