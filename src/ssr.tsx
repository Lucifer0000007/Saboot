// Build-time prerender entry (scripts/postbuild.mjs loads this through Vite's SSR loader).
// Renders the static English shell so the first paint is real content, not a spinner.
import { renderToString } from 'preact-render-to-string';
import { Page } from './site/Page';

export function renderShell(): string {
  return renderToString(<Page ssr />);
}
