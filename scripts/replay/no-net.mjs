// A preload that makes every network call throw, so a replay run proves it reads only the files on disk.
//   node --import ./scripts/replay/no-net.mjs --import ./scripts/ts-resolve.mjs scripts/replay/run.ts
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';

const blocked = (what) => () => { throw new Error(`network blocked for this run: ${what}`); };
globalThis.fetch = blocked('fetch');
net.Socket.prototype.connect = blocked('socket connect');
net.createConnection = blocked('createConnection');
http.request = blocked('http.request');
https.request = blocked('https.request');
http.get = blocked('http.get');
https.get = blocked('https.get');
dns.lookup = blocked('dns.lookup');
dns.promises.lookup = async () => blocked('dns.promises.lookup')();
