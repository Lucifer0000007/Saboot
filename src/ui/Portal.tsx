// Minimal portal (no preact/compat): renders children into a host element appended to <body>, so
// overlays escape panels that use container queries (layout containment would trap position: fixed).
import { render, type ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';

export function Portal({ children }: { children: ComponentChildren }) {
  const [host] = useState(() => document.createElement('div'));
  useEffect(() => {
    document.body.appendChild(host);
    return () => {
      render(null, host);
      host.remove();
    };
  }, []);
  useLayoutEffect(() => {
    render(<>{children}</>, host);
  });
  return null;
}
