// The installed app opens in the page's own colours (audit R10): the manifest's colours match the light theme-color tag, and
// it lists PNG icons that exist, which Android needs to install the app reliably.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const m = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as { theme_color: string; background_color: string; icons: { src: string; sizes: string; type: string }[] };
const html = readFileSync('index.html', 'utf8');

test('the manifest colours match the light theme-color tag of the page', () => {
  const light = /<meta name="theme-color" content="(#[0-9a-f]{6})" media="\(prefers-color-scheme: light\)"/i.exec(html)?.[1];
  assert.ok(light);
  assert.equal(m.theme_color.toLowerCase(), light.toLowerCase());
  assert.equal(m.background_color.toLowerCase(), light.toLowerCase());
});

test('192 and 512 px PNG icons are listed, and the files exist', () => {
  for (const size of ['192x192', '512x512']) {
    const icon = m.icons.find((i) => i.sizes === size && i.type === 'image/png');
    assert.ok(icon, size);
    assert.ok(existsSync('public/' + icon.src), icon.src);
  }
});
