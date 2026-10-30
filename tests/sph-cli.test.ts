import { describe, it, expect } from 'vitest';
import { parseCliArgs, executeCliCommand } from '../bin/sph-cli';

describe('Developer CLI (sph-cli)', () => {
  it('parses commands and key-value options correctly', () => {
    const parsed = parseCliArgs(['calculate-split', '--total=150', '--count=3']);
    expect(parsed.command).toBe('calculate-split');
    expect(parsed.options['total']).toBe('150');
    expect(parsed.options['count']).toBe('3');
  });

  it('executes health and version commands', () => {
    const healthOut = executeCliCommand('health', {});
    expect(healthOut).toContain('ONLINE');

    const versionOut = executeCliCommand('version', {});
    expect(versionOut).toContain('Protocol 22');
  });

  it('executes calculate-split command with options', () => {
    const splitOut = executeCliCommand('calculate-split', { total: '90', count: '3' });
    expect(splitOut).toContain('30.00 each');
  });
});
