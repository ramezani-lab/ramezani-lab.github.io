/**
 * Writes public/search-index.json from the content graph.
 *
 * Runs before build (and before dev) so the browser has a static, prebuilt
 * MiniSearch index to fetch — nothing is indexed at request time.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getGraph } from "../lib/content";
import { createSearchIndex, serializeSearchIndex } from "../lib/search";
import { collectSearchDocs } from "../lib/search-docs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

const docs = collectSearchDocs(getGraph());
const json = serializeSearchIndex(createSearchIndex(docs));

mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public", "search-index.json"), json, "utf8");

console.log(
  `Wrote search index: ${docs.length} documents, ${(json.length / 1024).toFixed(1)} kB`,
);
