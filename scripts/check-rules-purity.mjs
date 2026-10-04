// Fails if @thirtyone/rules declares any runtime dependency or imports anything
// outside its own source tree. The engine runs on the device and on the server,
// and must know nothing about React, Expo, Colyseus or Node.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const pkgDir = new URL('../packages/rules/', import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'));
const problems = [];

for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
  const deps = Object.keys(pkg[field] ?? {});
  if (deps.length) problems.push(`package.json "${field}" must be empty, has: ${deps.join(', ')}`);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mts|cts|js|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const importRe = /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;
for (const file of walk(join(pkgDir, 'src'))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(importRe)) {
    const spec = m[1];
    if (!spec.startsWith('.')) {
      problems.push(`${relative(pkgDir, file)} imports "${spec}" — only relative imports allowed`);
    }
  }
}

if (problems.length) {
  console.error('✗ @thirtyone/rules purity check failed:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('✓ @thirtyone/rules is pure');
