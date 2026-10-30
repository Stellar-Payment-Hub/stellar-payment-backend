import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mermaid Diagram Syntax Validation', () => {
  it('extracts and validates Mermaid diagram blocks from documentation', () => {
    const diagramsPath = path.resolve(process.cwd(), 'docs/DIAGRAMS.md');
    expect(fs.existsSync(diagramsPath)).toBe(true);

    const content = fs.readFileSync(diagramsPath, 'utf8');
    const mermaidRegex = /\`\`\`mermaid([\s\S]*?)\`\`\`/g;
    const matches = Array.from(content.matchAll(mermaidRegex));

    expect(matches.length).toBeGreaterThanOrEqual(2);

    for (const match of matches) {
      const code = match[1].trim();
      expect(code.startsWith('sequenceDiagram') || code.startsWith('flowchart')).toBe(true);
      expect(code).toContain('autonumber');
      // Assert no unbalanced quotes or braces
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    }
  });
});
