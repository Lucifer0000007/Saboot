// Photo helpers: deterministic synthetic photos (canvas) and on-device downscaling of real photos.
export type ShotKind = 'wide' | 'close' | 'landmark';
export const SHOTS: ShotKind[] = ['wide', 'close', 'landmark'];

const MAX = 1280;

function toBlob(c: HTMLCanvasElement, q = 0.78): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', q));
}

/** Real photo: downscale to <= 1280 px JPEG on device (saves data); the stored bytes are what we hash. */
export async function normalizePhoto(file: Blob): Promise<{ blob: Blob; w: number; h: number }> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close?.();
    return { blob: await toBlob(c, 0.8), w: c.width, h: c.height };
  } catch {
    return { blob: file, w: 0, h: 0 };
  }
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Deterministic synthetic field photo, clearly watermarked as simulated. */
export async function syntheticPhoto(kind: ShotKind, label: string, seed: number): Promise<{ blob: Blob; w: number; h: number }> {
  const W = 960, H = 720;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const r = rng(seed + kind.length * 977);
  const horizon = kind === 'close' ? 140 : 300;
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#8d969c');
  sky.addColorStop(1, '#c7cbc8');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, horizon);
  // distant tree line
  g.fillStyle = '#4d5b46';
  for (let x = 0; x < W; x += 18) {
    const h = 18 + r() * 30;
    g.beginPath();
    g.ellipse(x, horizon - h / 3, 22, h / 2, 0, 0, Math.PI * 2);
    g.fill();
  }
  // flood water
  const water = g.createLinearGradient(0, horizon, 0, H);
  water.addColorStop(0, '#9fb0b3');
  water.addColorStop(1, '#6f8486');
  g.fillStyle = water;
  g.fillRect(0, horizon, W, H - horizon);
  // submerged paddy rows
  const rows = kind === 'close' ? 7 : 16;
  for (let i = 0; i < rows; i++) {
    const y = horizon + 10 + ((H - horizon) * (i + 0.5)) / rows;
    const scale = kind === 'close' ? 3.2 : 0.5 + (i / rows) * 1.6;
    for (let x = -20; x < W + 20; x += 14 * scale) {
      const lean = (r() - 0.5) * 6 * scale;
      g.strokeStyle = r() < 0.35 ? '#8a8f52' : '#4f7a3a';
      g.lineWidth = 1.2 * scale;
      for (let b = 0; b < 3; b++) {
        g.beginPath();
        g.moveTo(x + b * 2 * scale, y);
        g.lineTo(x + b * 2 * scale + lean + (b - 1) * 3 * scale, y - (10 + r() * 8) * scale);
        g.stroke();
      }
    }
    g.fillStyle = 'rgba(160,180,185,0.35)';
    g.fillRect(0, y - 2 * scale, W, 3 * scale);
  }
  if (kind === 'landmark') {
    // pump house
    g.fillStyle = '#b9a58a';
    g.fillRect(600, horizon - 70, 140, 110);
    g.fillStyle = '#7d4b35';
    g.beginPath();
    g.moveTo(590, horizon - 70);
    g.lineTo(670, horizon - 115);
    g.lineTo(750, horizon - 70);
    g.fill();
    g.fillStyle = '#3b3b36';
    g.fillRect(650, horizon - 20, 34, 60);
  }
  // watermark
  g.fillStyle = 'rgba(29,31,26,0.72)';
  g.fillRect(0, H - 64, W, 64);
  g.fillStyle = '#fffdf8';
  g.font = '600 26px system-ui, sans-serif';
  g.fillText('SIMULATED PHOTO · ' + label, 24, H - 24);
  return { blob: await toBlob(c, 0.72), w: W, h: H };
}

/** Rejects gallery uploads: a photo straight from the camera was written in the last few minutes. */
export function isFresh(file: File): boolean {
  return !file.lastModified || file.lastModified >= Date.now() - 10 * 60e3;
}
