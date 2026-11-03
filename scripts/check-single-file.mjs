import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve('dist-single');
const files = readdirSync(directory);
if (files.length !== 1 || files[0] !== 'index.html') {
  console.error(`dist-single must contain only index.html, found: ${files.join(', ') || '(empty)'}`);
  process.exit(1);
}

const file = resolve(directory, 'index.html');
const html = readFileSync(file, 'utf8');
const size = statSync(file).size;
const problems = [];

if (!html.includes('<script') || !html.includes('<style')) {
  problems.push('missing inlined script or style');
}
if (!html.includes('data:image/png;base64,')) {
  problems.push('avatar images were not inlined');
}
if (!html.includes('data:font/woff2') && !html.includes('data:application/font-woff')) {
  problems.push('font files were not inlined');
}
if (html.includes('/avatars/')) problems.push('still references /avatars/');
if (/\ssrc\s*=\s*["'](?!data:)/i.test(html)) problems.push('has a non-data src');
if (/\shref\s*=\s*["'](?!data:)/i.test(html)) problems.push('has a non-data href');
if (html.includes('<?')) problems.push('contains <? which Apps Script treats as a scriptlet');
if (/<\/script>/i.test(html.replace(/<\/script>\s*$/i, '').slice(html.indexOf('<script')))) {
  const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
  if (scripts.length !== 1) problems.push(`expected one script block, found ${scripts.length}`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`dist-single/index.html OK (${size} bytes)`);
