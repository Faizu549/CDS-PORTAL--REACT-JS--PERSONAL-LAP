const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

function isValidTarget(target) {
  if (!target || target.length > 253) return false;
  return /^(?:[a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$|^(?:\d{1,3}\.){3}\d{1,3}$/.test(target);
}

function streamEvent(res, type, payload) {
  res.write(`event: ${type}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function runNetworkUtility(req, res, tool, target) {
  if (!isValidTarget(target)) {
    send(res, 400, 'Enter a valid hostname or IPv4 address.');
    return;
  }

  const commandMap = {
    ping: { command: 'ping.exe', args: ['-n', '4', target] },
    tracert: { command: 'tracert.exe', args: ['-d', '-w', '1000', target] }
  };
  const utility = commandMap[tool];
  if (!utility) {
    send(res, 404, 'Unsupported network utility.');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  streamEvent(res, 'status', {
    text: `Running ${utility.command} ${utility.args.join(' ')}`
  });

  const child = spawn(utility.command, utility.args, { shell: false, windowsHide: true });

  child.stdout.on('data', chunk => {
    streamEvent(res, 'output', { text: chunk.toString() });
  });

  child.stderr.on('data', chunk => {
    streamEvent(res, 'output', { text: chunk.toString() });
  });

  child.on('error', error => {
    streamEvent(res, 'error', { text: `Failed to start ${utility.command}: ${error.message}` });
    res.end();
  });

  child.on('close', code => {
    streamEvent(res, 'done', { text: `\nCommand completed with exit code ${code}.` });
    res.end();
  });

  req.on('close', () => {
    if (!child.killed) child.kill();
  });
}

function serveStatic(req, res, pathname) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.normalize(path.join(PUBLIC_DIR, relativePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, 'Not found');
      return;
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const networkMatch = url.pathname.match(/^\/api\/network\/(ping|tracert)$/);

  if (networkMatch) {
    runNetworkUtility(req, res, networkMatch[1], (url.searchParams.get('target') || '').trim());
    return;
  }

  serveStatic(req, res, url.pathname);
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
