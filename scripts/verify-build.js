#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const requiredFiles = [
  'index.html',
  'community.html',
  'styles.css',
  'script.js',
  'js/communityLog.js',
  'js/communityLogApp.js',
  'js/logger.js',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));

if (missing.length) {
  console.error('Fichiers requis manquants :');
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log('Validation terminée : fichiers requis présents.');
