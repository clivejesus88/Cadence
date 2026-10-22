#!/usr/bin/env node
// Generates PWA raster icons from public/cadence.svg.
// Run: node scripts/generate-icons.mjs

import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svg = readFileSync(resolve(root, "public/cadence.svg"));
const outDir = resolve(root, "public/icons");

mkdirSync(outDir, { recursive: true });

const background = { r: 0x18, g: 0x1c, b: 0x22, alpha: 1 };

const targets = [
  { name: "icon-192.png", size: 192, pad: 0 },
  { name: "icon-512.png", size: 512, pad: 0 },
  { name: "maskable-512.png", size: 512, pad: 0.22 },
  { name: "apple-touch-icon.png", size: 180, pad: 0 }
];

for (const { name, size, pad } of targets) {
  const inner = Math.round(size * (1 - pad * 2));
  const resized = await sharp(svg).resize(inner, inner).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background }
  })
    .composite([{ input: resized, top: Math.round((size - inner) / 2), left: Math.round((size - inner) / 2) }])
    .png()
    .toFile(resolve(outDir, name));
  console.log(`wrote public/icons/${name} (${size}x${size})`);
}
