import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { writeToPath } from 'fast-csv';
import { fileURLToPath } from 'url';

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, '..');
  const imagesDir = path.join(rootDir, 'assets', 'images');
  const metaDir = path.join(rootDir, 'meta');
  await fs.mkdir(metaDir, { recursive: true });

  async function walk(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const dirent of dirents) {
      const res = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        files.push(...await walk(res));
      } else {
        files.push(res);
      }
    }
    return files;
  }

  let files: string[] = [];
  try {
    files = await walk(imagesDir);
  } catch {
    console.error(`No images directory found at ${imagesDir}`);
    return;
  }

  const rows: any[] = [];
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) continue;
    const meta = await sharp(filePath).metadata();
    rows.push({
      name: path.basename(filePath, ext),
      file: path.relative(rootDir, filePath),
      width: meta.width ?? 0,
      height: meta.height ?? 0
    });
  }

  await new Promise<void>((resolve, reject) => {
    writeToPath(path.join(metaDir, 'images.csv'), rows, { headers: true })
      .on('error', reject)
      .on('finish', resolve);
  });

  console.log(`Wrote metadata for ${rows.length} images to ${path.join(metaDir, 'images.csv')}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
