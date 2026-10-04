/** Bundle the Platform engine directly into the deployed dashboard. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../../brew-helper-site/index.html', import.meta.url));
const bundle = readFileSync(fileURLToPath(new URL('../dist/brew-engine.js', import.meta.url)), 'utf8');
const html = readFileSync(target, 'utf8');
const block = `<!-- PLATFORM_ENGINE:START -->\n<script>\n${bundle}\n</script>\n<!-- PLATFORM_ENGINE:END -->`;
const hasSlot = html.includes('<!-- PLATFORM_ENGINE -->') || html.includes('<!-- PLATFORM_ENGINE:START -->');
if (!hasSlot) throw new Error('Platform engine slot not found in brew-helper-site/index.html');
const next = html.includes('<!-- PLATFORM_ENGINE -->')
  ? html.replace('<!-- PLATFORM_ENGINE -->', block)
  : html.includes('<!-- PLATFORM_ENGINE:END -->')
    ? html.replace(/<!-- PLATFORM_ENGINE:START -->[\s\S]*?<!-- PLATFORM_ENGINE:END -->/, block)
    : html.replace(/<!-- PLATFORM_ENGINE:START -->[\s\S]*?<\/script>/, block);
writeFileSync(target, next);
console.log('inlined Platform engine into brew-helper-site/index.html');
