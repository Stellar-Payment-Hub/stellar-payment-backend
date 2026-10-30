import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Documentation Files & Integrity Verification', () => {
  const docsDir = path.resolve(process.cwd(), 'docs');

  const requiredDocFiles = [
    'architecture.md',
    'DIAGRAMS.md',
    'SECURITY.md',
    'STELLAR_INTEGRATION.md',
    'SPLIT_MATH.md',
    'HACKATHON_PITCH.md',
    'GETTING_STARTED.md',
    'RUNBOOK.md',
    'GAS_ECONOMICS.md',
    'STELLAR_STANDARDS.md',
    'stellar-payment-hub.postman_collection.json',
  ];

  it('contains all required architectural and specification documentation files', () => {
    expect(fs.existsSync(docsDir)).toBe(true);
    for (const file of requiredDocFiles) {
      const fullPath = path.join(docsDir, file);
      expect(fs.existsSync(fullPath), `Doc file missing: ${file}`).toBe(true);
    }
  });

  it('contains root community documentation files', () => {
    const rootFiles = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md'];
    for (const rf of rootFiles) {
      expect(fs.existsSync(path.resolve(process.cwd(), rf)), `Root file missing: ${rf}`).toBe(true);
    }
  });

  it('validates Postman collection has valid JSON syntax and items', () => {
    const jsonPath = path.join(docsDir, 'stellar-payment-hub.postman_collection.json');
    const content = fs.readFileSync(jsonPath, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed.info.name).toContain('Stellar Payment Hub');
    expect(Array.isArray(parsed.item)).toBe(true);
    expect(parsed.item.length).toBeGreaterThanOrEqual(4);
  });
});
