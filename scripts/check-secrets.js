import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Report locations only; never print a credential into logs.
const patterns = [
  /AIza[0-9A-Za-z_-]{35}/,
  /(?:sk-proj-|sk-live-|sk_test_|sk_live_)[0-9A-Za-z_-]{20,}/,
  /\bgh[pousr]_[0-9A-Za-z]{30,}/,
  /\bgithub_pat_[0-9A-Za-z_]{30,}/,
  /\bxox[baprs]-[0-9A-Za-z-]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /["']private_key["']\s*:/,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][0-9A-Za-z_-]{24,}["']/i
];
const problems = [];
const scan = directory => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git', '.DS_Store'].includes(entry.name)) continue;
    if (directory === '.' && entry.name.startsWith('.env')) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) scan(path);
    else {
      const bytes = readFileSync(path);
      if (bytes.includes(0)) continue;
      const content = bytes.toString('utf8');
      if (patterns.some(pattern => pattern.test(content))) problems.push(path);
      if (path.startsWith('dist/') && entry.name.endsWith('.map')) problems.push(path);
    }
  }
};
scan('.');
if (problems.length) {
  console.error(`Potential exposed credentials or production source maps in:\n${[...new Set(problems)].join('\n')}`);
  process.exitCode = 1;
} else console.log('Credential scan passed: no known key patterns or production source maps found.');
