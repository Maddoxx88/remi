/**
 * Generates Expo publishing assets from assets/remi-logo.png (1024×1024, black bg).
 * Run: node scripts/generate-brand-assets.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');
const src = path.join(assetsDir, 'remi-logo.png');

const BG = { r: 10, g: 10, b: 15, alpha: 1 }; // #0A0A0F — matches app.json

async function main() {
  const iconSize = 1024;
  const iconOpts = { fit: 'contain', background: BG };

  await sharp(src).resize(iconSize, iconSize, iconOpts).png().toFile(path.join(assetsDir, 'icon.png'));

  // Android adaptive foreground (safe zone ~66% center; logo is already centered)
  await sharp(src)
    .resize(iconSize, iconSize, iconOpts)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));

  await sharp(src)
    .resize(iconSize, iconSize, iconOpts)
    .png()
    .toFile(path.join(assetsDir, 'android-icon-foreground.png'));

  const logoBuffer = await sharp(src).resize(320, 320, iconOpts).png().toBuffer();

  await sharp({
    create: { width: 1284, height: 2778, channels: 4, background: BG },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));

  await sharp(src).resize(200, 200, iconOpts).png().toFile(path.join(assetsDir, 'splash-icon.png'));

  await sharp(src).resize(48, 48, iconOpts).png().toFile(path.join(assetsDir, 'favicon.png'));

  // Android 13+ themed icon (white silhouette)
  await sharp(src)
    .resize(iconSize, iconSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .grayscale()
    .linear(2.5, -80)
    .png()
    .toFile(path.join(assetsDir, 'android-icon-monochrome.png'));

  console.log(
    'Generated: icon.png, adaptive-icon.png, android-icon-foreground.png, android-icon-monochrome.png, splash.png, splash-icon.png, favicon.png',
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
