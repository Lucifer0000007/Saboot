// QR code (error correction M) rendered as one SVG path. Encoder: uqr (MIT), bundled in a lazy chunk.
import { encode } from 'uqr';

export function qrPath(text: string): { size: number; d: string; version: number } {
  const qr = encode(text, { ecc: 'M', border: 2 });
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
