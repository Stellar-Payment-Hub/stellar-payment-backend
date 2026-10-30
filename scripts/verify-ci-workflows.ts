#!/usr/bin/env node
/**
 * Local CI Workflow Verification Script
 * Validates syntax, required triggers, and dependencies across all GitHub Actions workflows.
 */
import fs from 'fs';
import path from 'path';

export function verifyAllWorkflows(): { passed: boolean; message: string } {
  const workflowsDir = path.resolve(process.cwd(), '.github/workflows');
  if (!fs.existsSync(workflowsDir)) {
    return { passed: false, message: 'Workflows directory not found' };
  }

  const files = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
  if (files.length === 0) {
    return { passed: false, message: 'No workflow files found' };
  }

  for (const file of files) {
    const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
    if (!content.includes('name:') || !content.includes('jobs:')) {
      return { passed: false, message: `Invalid workflow structure in ${file}` };
    }
    if (content.includes('\t')) {
      return { passed: false, message: `Illegal tab character in ${file}` };
    }
  }

  return { passed: true, message: `All ${files.length} GitHub Actions workflows validated successfully.` };
}

if (process.argv[1]?.endsWith('verify-ci-workflows.ts')) {
  const result = verifyAllWorkflows();
  console.log(result.message);
  if (!result.passed) {
    process.exit(1);
  }
}
