#!/usr/bin/env node
// Generates a tiny pre-blurred version of the hero image so the app can render
// a soft background without a costly runtime CSS blur.
// Run: node scripts/generate-hero-blur.mjs

import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "public/2db10ed4-907b-405f-a887-1dfb58489242.jpg");
const outDir = resolve(root, "public");

mkdirSync(outDir, { recursive: true });

const out = resolve(outDir, "hero-blur.jpg");
await sharp(src)
  .resize(48, 86, { fit: "cover" })
  .blur(8)
  .jpeg({ quality: 60, mozjpeg: true })
  .toFile(out);

console.log("wrote public/hero-blur.jpg");
