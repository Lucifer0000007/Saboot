// Types for the standalone verifier (scripts/verify-packet.mjs), so the tests can import it.
export interface StandalonePayload {
  formatVersion: number;
  plot: string;
  eventHour: number;
  sealHour: number;
  phoneClockUtc: string;
  lat: number;
  lon: number;
  photos: { kind: string; captureHour: number; sha256: string }[];
  chainHead: string;
  publicKey: string;
}
export interface StandaloneResult {
  ok: boolean;
  failed: 'decode' | 'chain' | 'signature' | null;
  reason?: string;
  payload?: StandalonePayload;
}
export function verify(input: string): Promise<StandaloneResult>;
export function inputToCode(arg: string): string;
