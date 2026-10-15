// Make the judges' QR code (SVG + terminal preview). Encodes PUBLIC_URL + QR_PATH from src/config.ts, the single
// place the public address lives, so the code, the canonical link and the social tags can never disagree.
//   npm run qr                 → PUBLIC_URL + QR_PATH (refuses while PUBLIC_URL is still the placeholder)
//   npm run qr -- <url>        → an explicit URL (for a preview deploy)
import QRCode from 'qrcode';
import { writeFileSync } from 'node:fs';
import { PUBLIC_URL, QR_PATH } from '../src/config.ts';

const placeholder = /\.invalid(\/|$)/.test(PUBLIC_URL);
const url = process.argv[2] ?? (placeholder ? null : PUBLIC_URL.replace(/\/+$/, '') + '/' + QR_PATH);
if (!url) {
  console.error(`PUBLIC_URL in src/config.ts is still the placeholder (${PUBLIC_URL}). Set it, or pass a URL: npm run qr -- https://...`);
  process.exit(1);
}
const svg = await QRCode.toString(url, { type: 'svg', margin: 2, color: { dark: '#242424', light: '#f6f3f1' } });
writeFileSync('saboot-qr.svg', svg);
console.log(await QRCode.toString(url, { type: 'terminal', small: true }));
console.log('Wrote saboot-qr.svg for', url);
