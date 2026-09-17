/**
 * Copies co-located content assets into public/ so the static export serves
 * them. Runs before build and before dev; safe to re-run.
 *
 * content/papers/dani/cover.png -> public/content/papers/dani/cover.png
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CONTENT = join(ROOT, "content");
const TARGET = join(ROOT, "public", "content");

/** Everything except the documents themselves counts as an asset. */
function isDocument(name: string): boolean {
  return name.endsWith(".md") || name.endsWith(".mdx");
}

/** Collects every non-document file or directory that sits beside a document. */
function collectAssets(
  dir: string,
  files: string[] = [],
  dirs: string[] = [],
): { files: string[]; dirs: string[] } {
  if (!existsSync(dir)) return { files, dirs };

  const entries = readdirSync(dir).filter((name) => !name.startsWith("."));
  const documentHere = entries.some(isDocument);

  for (const name of entries) {
    const path = join(dir, name);
    const directory = statSync(path).isDirectory();

    if (documentHere) {
      if (directory) dirs.push(path);
      else if (!isDocument(name)) files.push(path);
      continue;
    }

    if (directory) collectAssets(path, files, dirs);
  }

  return { files, dirs };
}

rmSync(TARGET, { recursive: true, force: true });

const { files, dirs } = collectAssets(CONTENT);

for (const dir of dirs) {
  const destination = join(TARGET, relative(CONTENT, dir));
  mkdirSync(destination, { recursive: true });
  cpSync(dir, destination, { recursive: true });
}

for (const file of files) {
  const destination = join(TARGET, relative(CONTENT, file));
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(file, destination);
}

console.log(
  `Synced ${dirs.length} asset directories and ${files.length} files to public/content`,
);
