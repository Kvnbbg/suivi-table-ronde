#!/usr/bin/env node
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function printHelp() {
  console.log(`\nUsage: node scripts/serve.js [options]\n\nOptions:\n  --port <number>   Port to listen on (default: 8080 or PORT env)\n  --root <path>     Root directory to serve (default: repo root)\n  --help            Show this help message\n\nExamples:\n  node scripts/serve.js --port 8080\n  PORT=3000 node scripts/serve.js\n`);
}

function parseArgs(args) {
  return args.reduce((acc, arg, index) => {
    if (arg === '--help' || arg === '-h') {
      acc.help = true;
      return acc;
    }
    if (arg === '--port') {
      acc.port = args[index + 1];
    }
    if (arg === '--root') {
      acc.root = args[index + 1];
    }
    return acc;
  }, {});
}

function loadEnvFile(baseDir) {
  const envPath = path.join(baseDir, '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) return;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
}

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const root = path.resolve(options.root || process.cwd());
if (!fs.existsSync(root)) {
  console.error(`Répertoire introuvable : ${root}`);
  process.exit(1);
}

loadEnvFile(root);

const port = Number(options.port || process.env.PORT || 8080);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error('Port invalide. Utilisez --port <nombre entre 1 et 65535>.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const unsafePath = decodeURIComponent(requestUrl.pathname);
  const normalizedPath = path.normalize(unsafePath).replace(/^([/\\])*../, '');
  let filePath = path.join(root, normalizedPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Requête invalide.');
    return;
  }

  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Fichier introuvable.');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erreur serveur lors de la lecture du fichier.');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(content);
  });
});

server.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
  console.log(`Racine servie : ${root}`);
});
