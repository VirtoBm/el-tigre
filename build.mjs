// Bundles src/*.js + Three.js into a single standalone, offline HTML file (el-tigre-adventures.html).
// Usage: npm install && npm run build
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const js = readdirSync(src).filter((f) => f.endsWith('.js')).sort()
  .map((f) => `// ---- ${f} ----\n` + readFileSync(join(src, f), 'utf8')).join('\n');

const result = await build({
  stdin: { contents: js, resolveDir: root, sourcefile: 'game.js', loader: 'js' },
  bundle: true, format: 'esm', minify: true, target: 'es2020', write: false, legalComments: 'none',
});
const code = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const logo = readFileSync(join(root, 'assets', 'el-tigre-logo.svg'), 'utf8');
// Music tracks (assets/audio/game/*.mp3) are embedded as base64 so the game stays a single offline file.
const audioDir = join(root, 'assets', 'audio', 'game');
const audio = {};
if (existsSync(audioDir)) for (const f of readdirSync(audioDir).filter((n) => n.endsWith('.mp3'))) audio[f.replace(/\.mp3$/, '')] = readFileSync(join(audioDir, f)).toString('base64');
const html = readFileSync(join(src, 'template.html'), 'utf8')
  .replace('<!--__LOGO_SVG__-->', () => logo)
  .replace('/*__AUDIO__*/', () => JSON.stringify(audio))
  .replace('/*__GAME__*/', () => code);
writeFileSync(join(root, 'el-tigre-adventures.html'), html);
console.log('OK -> el-tigre-adventures.html', (html.length / 1024).toFixed(1) + ' KB');
