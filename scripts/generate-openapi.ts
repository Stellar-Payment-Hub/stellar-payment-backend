import fs from 'fs';
import path from 'path';

export function getOpenApiSpec(): Record<string, any> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Stellar Payment Hub API',
      version: '1.0.0',
      description: 'Enterprise Programmable Settlement Platform on Stellar & Soroban',
    },
    paths: {
      '/health': {
        get: {
          summary: 'Service Health Status',
          responses: {
            '200': { description: 'Healthy' },
          },
        },
      },
      '/api/payments': {
        get: { summary: 'List Payments' },
        post: { summary: 'Create Payment' },
      },
      '/api/settlements': {
        get: { summary: 'List Settlements' },
        post: { summary: 'Create Multi-Recipient Settlement' },
      },
    },
  };
}

export function exportOpenApiSpec(outputPath?: string): string {
  const spec = getOpenApiSpec();
  const json = JSON.stringify(spec, null, 2);
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, json, 'utf8');
  }
  return json;
}
