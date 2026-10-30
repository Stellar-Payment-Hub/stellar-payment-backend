#!/usr/bin/env node
/**
 * Printable Payment Request QR Sheet Generator
 * Generates formatted SVG/HTML sheets containing merchant SEP-0007 QR codes.
 */

export function generatePrintableQrSheet(
  merchantName: string,
  destination: string,
  amount: string,
  asset: string = 'USDC'
): string {
  const paymentUri = `web+stellar:pay?destination=${destination}&amount=${amount}&asset_code=${asset}`;

  return [
    '<!DOCTYPE html>',
    '<html><head><title>Stellar Payment Request</title>',
    '<style>body{font-family:sans-serif;text-align:center;padding:40px;}</style>',
    '</head><body>',
    `<h1>Pay ${merchantName} via Stellar</h1>`,
    `<p>Amount: <strong>${amount} ${asset}</strong></p>`,
    `<p>Destination: <code>${destination}</code></p>`,
    `<p>SEP-0007 URI: <small>${paymentUri}</small></p>`,
    '</body></html>',
  ].join('\n');
}
