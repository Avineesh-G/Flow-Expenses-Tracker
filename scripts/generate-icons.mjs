import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../public/icon-512.jpg');
const outDir = path.join(__dirname, '../public');

await sharp(src).resize(512, 512).toFile(path.join(outDir, 'icon-512.png'));
await sharp(src).resize(192, 192).toFile(path.join(outDir, 'icon-192.png'));
await sharp(src).resize(180, 180).toFile(path.join(outDir, 'apple-touch-icon.png'));
await sharp(src).resize(32, 32).toFile(path.join(outDir, 'favicon-32.png'));

console.log('Icons generated successfully!');
