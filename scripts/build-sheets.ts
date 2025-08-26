import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { parse } from 'fast-csv';
import Spritesmith from 'spritesmith';
import { fileURLToPath } from 'url';

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, '..');
  const metaFile = path.join(rootDir, 'meta', 'images.csv');
  if (!fs.existsSync(metaFile)) {
    console.error(`Metadata file not found: ${metaFile}`);
    return;
  }

  const images: string[] = await new Promise((resolve, reject) => {
    const arr: string[] = [];
    fs.createReadStream(metaFile)
      .pipe(parse({ headers: true }))
      .on('error', reject)
      .on('data', (row: any) => {
        if (row.file) arr.push(path.join(rootDir, row.file));
      })
      .on('end', () => resolve(arr));
  });

  if (images.length === 0) {
    console.error('No images found to build spritesheet.');
    return;
  }

  const result: any = await new Promise((resolve, reject) => {
    Spritesmith.run({ src: images }, (err: Error | null, res: any) => {
      if (err) reject(err); else resolve(res);
    });
  });

  const outDir = path.join(rootDir, 'assets');
  await sharp(result.image).png().toFile(path.join(outDir, 'sheet.png'));
  await fs.promises.writeFile(path.join(outDir, 'sheet.json'), JSON.stringify(result.coordinates, null, 2));
  console.log(`Spritesheet generated with ${images.length} images`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
