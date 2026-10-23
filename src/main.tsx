import { render } from 'preact';
import './styles/tokens.css';
import './styles/base.css';
import './styles/site.css';
import './styles/farmer.css';
import './styles/dashboard.css';
import './styles/pages.css';
import { Page } from './site/Page';
import { installQaHooks } from './qa-hooks';
import { showToast } from './lib/announce';
import { tr } from './lib/i18n';

// index.html already holds the prerendered shell; render() adopts those DOM nodes (no flash, no shift). This module
// is evaluated after the first paint (scripts/postbuild.mjs), so hydration never holds that paint back.
render(<Page />, document.getElementById('app')!);
installQaHooks();

// The service worker installs after the page has loaded. This module boots after the first paint, which on a fast
// load can be after the load event: then register right away. Every load also asks for an update check explicitly:
// browsers throttle the implicit check on navigation, and a judge who opened the site once must get the next deploy
// on their next reload (the worker skips waiting and claims clients; the cache name changes with every build).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // On a first visit, say when the worker has taken over: from then on the app opens with no signal. (A person who tests
  // airplane mode in the first seconds would otherwise see the browser's error page.)
  if (!navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', () => showToast(tr('app.offlineReady'), 'ok'), { once: true });
  const register = () => navigator.serviceWorker.register('./sw.js').then((r) => r.update()).catch(() => {});
  if (document.readyState === 'complete') register();
  else addEventListener('load', register);
}
