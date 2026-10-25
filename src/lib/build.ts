// The build stamp (vite.config.ts): version and build time, so a page served from an old cache can be told from a new build.
declare const __BUILD__: { v: string; t: string } | undefined;

export const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : { v: 'dev', t: '' };
export const buildLabel = (): string => (BUILD.t ? `${BUILD.v} · ${BUILD.t}` : BUILD.v);
