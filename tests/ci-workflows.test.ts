import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('GitHub Actions CI Workflows Validation', () => {
  const workflowsDir = path.resolve(process.cwd(), '.github/workflows');

  const requiredWorkflows = [
    'contracts.yml',
    'backend.yml',
    'frontend.yml',
    'wasm-size.yml',
    'coverage.yml',
    'e2e-simulation.yml',
    'testnet-deploy.yml',
    'pr-lint.yml',
    'codeql.yml',
  ];

  it('contains all required CI/CD workflow definition files', () => {
    expect(fs.existsSync(workflowsDir)).toBe(true);
    for (const file of requiredWorkflows) {
      const fullPath = path.join(workflowsDir, file);
      expect(fs.existsSync(fullPath), `Workflow file missing: ${file}`).toBe(true);
    }
  });

  it('validates workflow files have required triggers and valid YAML structure', () => {
    for (const file of requiredWorkflows) {
      const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
      expect(content).toContain('name:');
      expect(content).toContain('on:');
      expect(content).toContain('jobs:');
      // Ensure no raw tab characters in YAML files
      expect(content).not.toMatch(/\t/);
    }
  });

  it('contracts workflow targets wasm32-unknown-unknown', () => {
    const contractsYaml = fs.readFileSync(path.join(workflowsDir, 'contracts.yml'), 'utf8');
    expect(contractsYaml).toContain('wasm32-unknown-unknown');
    expect(contractsYaml).toContain('cargo test');
  });

  it('backend and frontend workflows test across Node matrix', () => {
    const backendYaml = fs.readFileSync(path.join(workflowsDir, 'backend.yml'), 'utf8');
    expect(backendYaml).toContain('node-version: [18.x, 20.x]');
    expect(backendYaml).toContain('npm test');

    const frontendYaml = fs.readFileSync(path.join(workflowsDir, 'frontend.yml'), 'utf8');
    expect(frontendYaml).toContain('node-version: [18.x, 20.x]');
    expect(frontendYaml).toContain('npm run build');
  });
});
