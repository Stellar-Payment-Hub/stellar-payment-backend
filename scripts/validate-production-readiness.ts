#!/usr/bin/env node
/**
 * Production Environment Readiness Validator
 * Validates presence of necessary configuration, files, and build outputs for launch.
 */
import fs from 'fs';
import path from 'path';

export function validateProductionReadiness(): { ready: boolean; checks: Record<string, boolean> } {
  const checks = {
    packageJson: fs.existsSync(path.resolve(process.cwd(), 'package.json')),
    dockerfile: fs.existsSync(path.resolve(process.cwd(), 'Dockerfile')),
    dockerCompose: fs.existsSync(path.resolve(process.cwd(), 'docker-compose.yml')),
    envProductionExample: fs.existsSync(path.resolve(process.cwd(), '.env.production.example')),
    docsDir: fs.existsSync(path.resolve(process.cwd(), 'docs')),
    readme: fs.existsSync(path.resolve(process.cwd(), 'README.md')),
  };

  const ready = Object.values(checks).every(Boolean);
  return { ready, checks };
}

if (process.argv[1]?.endsWith('validate-production-readiness.ts')) {
  console.log('Validating production readiness...');
  const res = validateProductionReadiness();
  console.log('Readiness result:', res);
}
