#!/usr/bin/env node
// Connect to /events and print each LIVE event with its delivery latency
// (receive time minus the event's ts). Backlog frames are counted, not printed.
// Usage: node sse-probe.js [seconds=120] [port=7777]

'use strict';

const http = require('http');

const seconds = Number(process.argv[2]) || 120;
const port = Number(process.argv[3]) || 7777;
let live = false;
let backlog = 0;
let buf = '';

const req = http.get({ host: '127.0.0.1', port, path: '/events', headers: { Accept: 'text/event-stream' } }, (res) => {
  console.log(`connected: HTTP ${res.statusCode} ${res.headers['content-type']}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const event = (/^event: (.+)$/m.exec(frame) || [])[1] || 'message';
      const data = (/^data: (.+)$/m.exec(frame) || [])[1];
      if (event === 'live') {
        live = true;
        console.log(`backlog: ${backlog} events, now live`);
      } else if (event === 'message' && data) {
        if (!live) {
          backlog++;
          continue;
        }
        const e = JSON.parse(data);
        const ms = Date.now() - Date.parse(e.ts);
        console.log(`+${ms}ms  ${e.sessionId} ${e.repo}/${e.branch} ${e.event} ${e.tool} ${e.target}`.trimEnd());
      }
    }
  });
});
req.on('error', (e) => {
  console.error(`probe error: ${e.message}`);
  process.exit(1);
});
setTimeout(() => {
  console.log('probe done');
  process.exit(0);
}, seconds * 1000);
