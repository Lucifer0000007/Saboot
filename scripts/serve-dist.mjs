// Static server for dist/ with brotli/gzip, like a static host. Used by the Playwright QA web server.
import { serve } from './snap.mjs';

const port = +(process.argv[2] ?? 4330);
await serve('dist', port);
console.log(`serving dist/ on http://localhost:${port}`);
