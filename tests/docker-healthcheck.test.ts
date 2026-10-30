import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Dockerfile Multi-Stage & Security Standards', () => {
  it('validates backend Dockerfile contains multi-stage build and security hardening', () => {
    const dockerfile = fs.readFileSync(path.resolve(process.cwd(), 'Dockerfile'), 'utf8');
    
    // Check multi-stage
    expect(dockerfile).toContain('AS builder');
    expect(dockerfile).toContain('AS runner');
    
    // Check non-root user
    expect(dockerfile).toContain('USER nodejs');
    expect(dockerfile).toContain('adduser -S -u 1001');

    // Check healthcheck
    expect(dockerfile).toContain('HEALTHCHECK');
    expect(dockerfile).toContain('http://localhost:3000/health');

    // Check dumb-init
    expect(dockerfile).toContain('dumb-init');
  });

  it('validates frontend Dockerfile contains Nginx SPA configuration and security headers', () => {
    const dockerfile = fs.readFileSync(path.resolve(process.cwd(), 'docker/frontend.Dockerfile'), 'utf8');
    
    expect(dockerfile).toContain('FROM nginx:alpine');
    expect(dockerfile).toContain('try_files $uri $uri/ /index.html');
    expect(dockerfile).toContain('X-Frame-Options "DENY"');
    expect(dockerfile).toContain('HEALTHCHECK');
    expect(dockerfile).toContain('/healthz');
  });
});
