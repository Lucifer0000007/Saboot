// Hand-drawn inline stroke icons on a 24-unit grid, rendered at 20px with a 1.5px stroke at any size
// (non-scaling stroke). One small module instead of an icon font or a sprite request.
// A tuple is [stroke path, filled path].
const P = {
  play: ['', 'M7 5v14l11-7z'],
  pause: ['', 'M7 5h3v14H7zM14 5h3v14h-3z'],
  reset: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  shield: 'M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6zM9 12l2 2 4-4',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6L6 18',
  alert: 'M12 4l9 16H3zM12 10v4M12 17.5h.01',
  water: 'M3 15c2 0 2-1.5 4.5-1.5S10 15 12 15s2-1.5 4.5-1.5S19 15 21 15M3 19c2 0 2-1.5 4.5-1.5S10 19 12 19s2-1.5 4.5-1.5S19 19 21 19M12 3s-4 4.5-4 7a4 4 0 0 0 8 0c0-2.5-4-7-4-7z',
  rain: 'M7 15a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 7.5a3.8 3.8 0 0 1 .5 7.5M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5',
  satellite: 'M13 7l4 4-6 6-4-4zM9.5 4.5l3 3M4.5 9.5l3 3M15 15l4 4M17 11l2.5-2.5M13 7l2.5-2.5M5 19c0-2 1-3 3-3',
  phone: 'M7 3h10v18H7zM11 18h2',
  volume: 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  mute: 'M4 9h4l5-4v14l-5-4H4zM17 9l4 6M21 9l-4 6',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1-2 3.4-1.8-.7a7 7 0 0 1-1.7 1L15 20h-4l-.5-1.8a7 7 0 0 1-1.7-1l-1.8.7-2-3.4 1.6-1a7 7 0 0 1 0-2l-1.6-1 2-3.4 1.8.7a7 7 0 0 1 1.7-1L11 4h4l.5 1.8a7 7 0 0 1 1.7 1l1.8-.7 2 3.4-1.6 1a7 7 0 0 1 0 2z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z',
  text: 'M4 19L9 5h1l5 14M6 14h7M16 19l2.5-7h.5l2.5 7M17 17h4',
  plane: 'M10.5 21l1.5-1.5V14l8 3v-2l-8-5V4.5a1.5 1.5 0 0 0-3 0V10l-8 5v2l8-3v5.5L10.5 21z',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1-4 4-6 8-6s7 2 8 6',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5c2 .7 3.2 2.6 3.5 5.5',
  hand: 'M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6.5 7S5 18 4 15.5l-1.5-3.5a1.4 1.4 0 0 1 2.4-1.4L8 14',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  right: 'M9 5l7 7-7 7',
  left: 'M15 5l-7 7 7 7',
  down: 'M6 9l6 6 6-6',
  arrow: 'M4 12h16M14 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5h.01',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  terrain: 'M3 19l6-9 4 5 3-4 5 8z',
  wifi: 'M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
  wifiOff: 'M2 9a15 15 0 0 1 5-3M22 9a15 15 0 0 0-11-3.9M5 12.5a10 10 0 0 1 4-2.3M19 12.5a10 10 0 0 0-3-2M8.5 16a5 5 0 0 1 7 0M12 19.5h.01M3 3l18 18',
  signal: 'M4 20v-3M9 20v-7M14 20V9M19 20V4',
  signalWeak: ['M14 20V9M19 20V4', 'M3 16.5h2v3.5H3zM8 12.5h2v7.5H8z'],
  hail: 'M7 14a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 6.5a3.8 3.8 0 0 1 .5 7.5M8 18h.01M12 17h.01M16 18h.01M10 21h.01M14 21h.01',
  sync: 'M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3M18 3v4h-4M6 21v-4h4',
  tour: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  skip: 'M6 5l8 7-8 7zM17 5v14',
  scale: 'M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0zM18 8l-3 6a3 3 0 0 0 6 0z',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
  inbox: 'M4 13l2.5-8h11L20 13v6H4zM4 13h5l1 2h4l1-2h5',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2.5v2.5H14zM18 18h2v2h-2zM17.5 14H20M14 20h2',
  scan: 'M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M4 12h16',
  paste: 'M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M9 12h6M9 16h4',
  zoomIn: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8M10.5 7.5v6M7.5 10.5h6',
  zoomOut: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8M7.5 10.5h6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  gavel: 'M13.5 4.5l6 6M11 7l6 6M12.2 5.8l-5.4 5.4 6 6 5.4-5.4M9.8 14.2L4 20',
  // status shapes: supported = check in circle, partial = half-filled circle, insufficient = ring with bar
  okShape: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.5l2.7 2.7L16.2 9.6',
  halfShape: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 3a9 9 0 0 1 0 18z'],
  barShape: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM6.5 12h11',
} satisfies Record<string, string | [string, string]>;

export type IconName = keyof typeof P;

export function Icon({ name, size = 20, class: cls }: { name: IconName; size?: number; class?: string }) {
  const d = P[name] as string | [string, string];
  const [stroke, fill] = typeof d === 'string' ? [d, ''] : d;
  return (
    <svg class={'ic' + (cls ? ' ' + cls : '')} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {stroke && (
        <path d={stroke} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      )}
      {fill && <path d={fill} fill="currentColor" />}
    </svg>
  );
}

/** Saboot mark: a circle with a dot — the moment the clock starts. */
export function Mark({ class: cls }: { class?: string }) {
  return (
    <svg class={cls} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <circle cx="14" cy="14" r="12.25" fill="none" stroke="currentColor" stroke-width="1.5" />
      <circle cx="14" cy="14" r="4.5" fill="currentColor" />
    </svg>
  );
}
