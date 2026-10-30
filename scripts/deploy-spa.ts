#!/usr/bin/env node
/**
 * SPA Deployment & Verification Automation Script
 * Verifies build artifacts and routing configurations for static hosting providers.
 */
import fs from 'fs';
import path from 'path';

export function verifySpaConfiguration(buildDir: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const indexHtml = path.join(buildDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    errors.push(`Missing index.html entrypoint at ${indexHtml}`);
  }

  const vercelConfig = path.join(buildDir, 'vercel.json');
  if (fs.existsSync(vercelConfig)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(vercelConfig, 'utf8'));
      if (!Array.isArray(parsed.rewrites)) {
        errors.push('vercel.json must specify rewrites array for client-side routing');
      }
    } catch {
      errors.push('Invalid JSON syntax in vercel.json');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

if (process.argv[1]?.endsWith('deploy-spa.ts')) {
  console.log('Verifying SPA deployment config...');
  const res = verifySpaConfiguration(process.cwd());
  if (!res.valid) {
    console.error('SPA config verification failed:', res.errors);
    process.exit(1);
  }
  console.log('SPA deployment configuration is valid.');
}
