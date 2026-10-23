// Webcam QR scanning: the browser's BarcodeDetector when present, otherwise jsQR (Apache-2.0), loaded on demand.
type Detect = (src: HTMLVideoElement, canvas: HTMLCanvasElement) => Promise<string | null>;

interface BarcodeDetectorLike { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> }
declare global { interface Window { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike } }

async function detector(): Promise<Detect> {
  if (window.BarcodeDetector) {
    try {
      const bd = new window.BarcodeDetector({ formats: ['qr_code'] });
      return async (v) => (await bd.detect(v))[0]?.rawValue ?? null;
    } catch { /* fall through to jsQR */ }
  }
  const jsQR = (await import('jsqr')).default;
  return async (v, c) => {
    const w = Math.min(720, v.videoWidth), h = Math.round((v.videoHeight * w) / v.videoWidth);
    if (!w || !h) return null;
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(v, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    return jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' })?.data ?? null;
  };
}

/** Start the camera on `video` and resolve with the first QR text found. Call the returned stop() to cancel. */
export function scanQr(video: HTMLVideoElement, onText: (t: string) => void, onError: (e: unknown) => void) {
  let stream: MediaStream | null = null;
  let alive = true;
  const canvas = document.createElement('canvas');
  (async () => {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
    // stopped before the camera answered: the answer must not leave the camera on
    if (!alive) { s.getTracks().forEach((t) => t.stop()); return; }
    stream = s;
    video.srcObject = s;
    await video.play();
    const detect = await detector();
    while (alive) {
      const text = await detect(video, canvas).catch(() => null);
      if (text && alive) { onText(text); break; }
      await new Promise((r) => setTimeout(r, 180));
    }
  })().catch((e) => alive && onError(e));
  return () => {
    alive = false;
    stream?.getTracks().forEach((t) => t.stop());
  };
}
