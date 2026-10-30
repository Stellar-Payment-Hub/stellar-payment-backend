#!/usr/bin/env node
/**
 * Frontend Bundle Size Analyzer
 * Analyzes compiled Vite dist chunks and ensures chunks do not exceed size budgets.
 */
import fs from 'fs';
import path from 'path';

export interface ChunkAnalysis {
  name: string;
  sizeBytes: number;
  sizeKb: number;
  isOverBudget: boolean;
}

export function analyzeDistChunks(distDir: string, budgetKb: number = 500): ChunkAnalysis[] {
  if (!fs.existsSync(distDir)) {
    return [];
  }

  const files = fs.readdirSync(distDir);
  const analyses: ChunkAnalysis[] = [];

  for (const f of files) {
    const full = path.join(distDir, f);
    const stat = fs.statSync(full);
    if (stat.isFile() && (f.endsWith('.js') || f.endsWith('.css'))) {
      const sizeKb = Math.round((stat.size / 1024) * 100) / 100;
      analyses.push({
        name: f,
        sizeBytes: stat.size,
        sizeKb,
        isOverBudget: sizeKb > budgetKb,
      });
    }
  }

  return analyses;
}

if (process.argv[1]?.endsWith('analyze-bundle.ts')) {
  console.log('Analyzing frontend chunks...');
  const res = analyzeDistChunks(path.resolve(process.cwd(), '../stellar-payment-frontend/dist'));
  console.log('Chunk analysis:', res);
}
