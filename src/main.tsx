import { render } from 'preact';
import './styles/tokens.css';
import './styles/base.css';
import './styles/site.css';
import './styles/farmer.css';
import './styles/dashboard.css';
import './styles/pages.css';
import { Page } from './site/Page';
import { installQaHooks } from './qa-hooks';

// index.html already holds the prerendered shell; render() adopts those DOM nodes (no flash, no shift). This module
// is evaluated after the first paint (scripts/postbuild.mjs), so hydration never holds that paint back.
render(<Page />, document.getElementById('app')!);
installQaHooks();

// The service worker installs after the page has loaded. This module boots after the first paint, which on a fast
// load can be after the load event: then register right away. Every load also asks for an update check explicitly:
// browsers throttle the implicit check on navigation, and a judge who opened the site once must get the next deploy
// on their next reload (the worker skips waiting and claims clients; the cache name changes with every build).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const register = () => navigator.serviceWorker.register('./sw.js').then((r) => r.update()).catch(() => {});
  if (document.readyState === 'complete') register();
  else addEventListener('load', register);
}
