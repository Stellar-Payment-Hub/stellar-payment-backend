function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSvgQrPlaceholder(data: string, size = 200): string {
  const safeData = escapeXml(data.substring(0, 48));
  // Generates lightweight SVG QR visual placeholder encoding data payload with XML entity escaping
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <text x="50%" y="45%" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#000000">Stellar Payment QR</text>
    <text x="50%" y="60%" text-anchor="middle" font-family="monospace" font-size="9" fill="#555555">${safeData}...</text>
  </svg>`;
}

