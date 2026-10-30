#!/usr/bin/env node
/**
 * Git Commit History Certification Script
 * Verifies that all recent commits adhere strictly to author identity requirements.
 */
import { execSync } from 'child_process';

export function verifyCommitHistory(expectedAuthor: string = 'omolobamoyinoluwa-max'): {
  totalChecked: number;
  allMatch: boolean;
  mismatches: string[];
} {
  const logOutput = execSync('git log -n 50 --pretty=format:"%h|%an|%ae"', { encoding: 'utf8' });
  const lines = logOutput.trim().split('\n').filter(Boolean);
  const mismatches: string[] = [];

  for (const line of lines) {
    const [hash, name, email] = line.split('|');
    if (!name.includes(expectedAuthor) && !email.includes(expectedAuthor)) {
      mismatches.push(`${hash}: ${name} <${email}>`);
    }
  }

  return {
    totalChecked: lines.length,
    allMatch: mismatches.length === 0,
    mismatches,
  };
}

if (process.argv[1]?.endsWith('certify-git-history.ts')) {
  console.log('Verifying git commit history uniformity...');
  const res = verifyCommitHistory();
  console.log(`Checked ${res.totalChecked} commits. Uniform: ${res.allMatch}`);
}
