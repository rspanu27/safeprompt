/**
 * Rasterise assets/icon.svg into the PNG sizes Chrome asks for.
 *
 * The PNGs are committed, so a build never depends on this script — run it
 * only after changing the SVG.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const SIZES = [16, 32, 48, 128];

const source = readFileSync(fileURLToPath(new URL('../assets/icon.svg', import.meta.url)), 'utf8');
const out = fileURLToPath(new URL('../public/icon/', import.meta.url));
mkdirSync(out, { recursive: true });

for (const size of SIZES) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(`${out}${size}.png`, png);
  console.log(`icon/${size}.png`);
}
