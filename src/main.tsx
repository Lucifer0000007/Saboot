import { render } from 'preact';
import './styles/tokens.css';
import './styles/base.css';
import './styles/site.css';
import './styles/farmer.css';
import './styles/dashboard.css';
import './styles/pages.css';
import { Page } from './site/Page';
import { installQaHooks } from './qa-hooks';
import { showToast, updateReady } from './lib/announce';
import { tr } from './lib/i18n';

// index.html already holds the prerendered shell; render() adopts those DOM nodes (no flash, no shift). This module
// is evaluated after the first paint (scripts/postbuild.mjs), so hydration never holds that paint back.
render(<Page />, document.getElementById('app')!);
// The inline boot script in index.html (scripts/postbuild.mjs) watches for a start that never comes; this tells it to stand down.
document.documentElement.dataset.booted = '1';
try { sessionStorage.removeItem('saboot.bootRetry'); } catch { /* storage unavailable */ }
installQaHooks();

// The service worker installs after the page has loaded. This module boots after the first paint, which on a fast
// load can be after the load event: then register right away. Every load also asks for an update check explicitly:
// browsers throttle the implicit check on navigation, and a judge who opened the site once must get the next deploy
// on their next reload (the worker skips waiting and claims clients; the cache name changes with every build).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // On a first visit, say when the worker has taken over: from then on the app opens with no signal. (A person who tests
  // airplane mode in the first seconds would otherwise see the browser's error page.)
  // On a later visit the page was served by the old worker from its cache: when the new build's worker takes over, say
  // so and offer a reload, instead of leaving the old build on screen until the next visit.
  const hadWorker = !!navigator.serviceWorker.controller;
  // the first-visit note waits while a sheet is open, so it never covers a verdict being read (audit OF-16)
  const offlineReady = () => (document.documentElement.classList.contains('sheet-open') ? void setTimeout(offlineReady, 1500) : showToast(tr('app.offlineReady'), 'ok'));
  navigator.serviceWorker.addEventListener('controllerchange', () => (hadWorker ? (updateReady.value = true) : offlineReady()), { once: true });
  const register = () => navigator.serviceWorker.register('./sw.js').then((r) => r.update()).catch(() => {});
  if (document.readyState === 'complete') register();
  else addEventListener('load', register);
}
