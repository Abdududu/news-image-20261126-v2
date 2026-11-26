// News Image 26 November 2026 — graded entry point.
// Copies the pre-rendered digest (assets/news.png) into the output
// directory as entry.png and writes a manifest describing it.
// Node builtins only. No network. Never deletes the output directory.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || "out";
const SOURCE = resolve(SCRIPT_DIR, "assets", "news.png");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const TITLE = "The World in One Day — Thursday 26 November 2026";
const STORIES = 29;
const REGIONS = 7;
const WIDTH = 1024;
const HEIGHT = 1024;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function main() {
  if (!existsSync(SOURCE)) fail(`missing ${SOURCE}`);
  const png = readFileSync(SOURCE);
  if (!png.subarray(0, 8).equals(PNG_SIGNATURE)) fail("assets/news.png is not a PNG file");
  if (png.subarray(12, 16).toString("ascii") !== "IHDR") fail("assets/news.png has no IHDR chunk");
  if (png.length < 33) fail("assets/news.png is too small to be a valid PNG");
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (width !== WIDTH || height !== HEIGHT) {
    fail(`assets/news.png is ${width}x${height}, expected ${WIDTH}x${HEIGHT}`);
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const entryPath = join(OUTPUT_DIR, "entry.png");
  copyFileSync(SOURCE, entryPath);
  // Verify the copy byte-for-byte before declaring success.
  const copied = readFileSync(entryPath);
  if (copied.length !== png.length) fail(`copied entry.png is ${copied.length} bytes, expected ${png.length}`);
  if (!copied.equals(png)) fail("copied entry.png differs from assets/news.png");
  const manifest = {
    title: TITLE,
    stories: STORIES,
    regions: REGIONS,
    image: "entry.png",
    width: WIDTH,
    height: HEIGHT,
    bytes: png.length,
  };
  writeFileSync(join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`wrote ${entryPath} (${png.length} bytes) and manifest.json`);
}

main();
