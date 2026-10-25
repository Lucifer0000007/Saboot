// QR code rendered as one SVG path. Encoder: uqr (MIT), bundled in a lazy chunk. Fewer squares scan better from a phone screen
// through a webcam, so the share sheet encodes the bare code (version 10) at the lowest error correction, not the longer link.
import { encode } from 'uqr';

export function qrPath(text: string, o: { ecc?: 'L' | 'M'; border?: number } = {}): { size: number; d: string; version: number } {
  const qr = encode(text, { ecc: o.ecc ?? 'M', border: o.border ?? 2 });
  let d = '';
  qr.data.forEach((row, y) => {
    let run = -1;
    for (let x = 0; x <= row.length; x++) {
      const on = x < row.length && row[x];
      if (on && run < 0) run = x;
      if (!on && run >= 0) { d += `M${run} ${y}h${x - run}v1h${run - x}z`; run = -1; }
    }
  });
  return { size: qr.size, d, version: qr.version };
}
