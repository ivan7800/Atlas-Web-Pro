import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const requiredFiles = [
  'index.html', 'style.css', 'app.js', 'data.js', 'manifest.json', 'sw.js',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'README.md', 'SECURITY.md', 'CHANGELOG.md', 'AUDIT_REPORT.md', 'LICENSE', '.nojekyll'
];
const fail = message => { throw new Error(message); };
const ok = message => console.log(`✓ ${message}`);

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) fail(`Falta ${file}`);
}
ok('archivos requeridos presentes');

for (const file of ['app.js', 'data.js', 'sw.js']) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}
ok('JavaScript sin errores de sintaxis');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('data.js', 'utf8'), context);
const tools = context.window.ATLAS_TOOLS;
if (!Array.isArray(tools)) fail('window.ATLAS_TOOLS no es un array');
if (tools.length !== 188) fail(`Se esperaban 188 herramientas y hay ${tools.length}`);

const seenIds = new Set();
const seenUrls = new Set();
const seenNames = new Set();
for (const [index, tool] of tools.entries()) {
  for (const key of ['id', 'name', 'url', 'desc', 'category']) {
    if (tool[key] === undefined || tool[key] === null || String(tool[key]).trim() === '') fail(`Herramienta ${index} sin ${key}`);
  }
  if (!Array.isArray(tool.tags)) fail(`${tool.name} no tiene tags como array`);
  const id = String(tool.id);
  const url = String(tool.url).trim();
  const normalizedUrl = url.toLowerCase().replace(/\/$/, '');
  const normalizedName = String(tool.name).trim().toLowerCase();
  if (seenIds.has(id)) fail(`ID duplicado: ${id}`);
  if (seenUrls.has(normalizedUrl)) fail(`URL duplicada: ${url}`);
  if (seenNames.has(normalizedName)) fail(`Nombre duplicado: ${tool.name}`);
  if (!url.startsWith('https://')) fail(`URL no HTTPS en catálogo base: ${tool.name} -> ${url}`);
  seenIds.add(id); seenUrls.add(normalizedUrl); seenNames.add(normalizedName);
}
ok('catálogo válido: 188 herramientas, sin duplicados y con HTTPS');

const html = fs.readFileSync('index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const dupIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (dupIds.length) fail(`IDs HTML duplicados: ${[...new Set(dupIds)].join(', ')}`);
if (!html.includes('Content-Security-Policy')) fail('Falta CSP');
if (!html.includes('name="referrer" content="no-referrer"')) fail('Falta política referrer segura');
if (!html.includes('rel="noopener noreferrer"') && !fs.readFileSync('app.js', 'utf8').includes('rel="noopener noreferrer"')) fail('Falta noopener noreferrer en enlaces externos');
ok('HTML endurecido: IDs únicos, CSP y referrer seguro');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
if (manifest.display !== 'standalone') fail('Manifest no está en standalone');
if (!Array.isArray(manifest.icons) || manifest.icons.length < 3) fail('Manifest sin iconos suficientes');
ok('manifest PWA correcto');

console.log('\nQA OK: Atlas Web Pro está listo para GitHub Pages.');
