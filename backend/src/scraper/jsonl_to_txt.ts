/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import readline from "readline";

/**
 * Usage:
 * npx ts-node scripts/jsonl_to_txt.ts --in uploads/mao-red-book.jsonl --out uploads/mao-red-book.txt [--dedupe=true]
 */

function getArg(name: string, def?: string): string {
  const idx = process.argv.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return def ?? "";
  const val = process.argv[idx].includes("=")
    ? process.argv[idx].split("=")[1]
    : process.argv[idx + 1];
  return val ?? (def ?? "");
}
function getFlag(name: string, def = false): boolean {
  const idx = process.argv.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return def;
  const a = process.argv[idx];
  if (a.includes("=")) {
    const v = a.split("=")[1].toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }
  // no explicit value means true
  return true;
}

const inPath = getArg("in");
const outPath = getArg("out");
const deDupe = getFlag("dedupe", true); // default: remove duplicate paragraphs

if (!inPath || !outPath) {
  console.error("Usage: ts-node scripts/jsonl_to_txt.ts --in <input.jsonl> --out <output.txt> [--dedupe=true]");
  process.exit(1);
}

// Patterns to drop non-paragraph noise
const DROP_PATTERNS: RegExp[] = [
  /^\s*Mao Tse Tung\s+Quotations from Mao Tse Tung\s*$/i,
  /^\s*Table of Contents:/i,
  /^\s*\[The End\]\s*$/i,
  /^\s*Chapter\s+(?:\d+|[A-Za-z]+)\s*:/i,
];

(async () => {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const rl = readline.createInterface({
    input: fs.createReadStream(inPath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  const out = fs.createWriteStream(outPath, { encoding: "utf8" });

  const seen = new Set<string>();
  let read = 0, written = 0, skipped = 0, duped = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    read++;

    let obj: any;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      skipped++;
      continue;
    }

    const text: string = typeof obj?.text === "string" ? obj.text.trim() : "";
    if (!text) { skipped++; continue; }

    // drop boilerplate
    if (DROP_PATTERNS.some(re => re.test(text))) {
      skipped++;
      continue;
    }

    // de-duplicate globally (by exact text)
    if (deDupe) {
      if (seen.has(text)) {
        duped++;
        continue;
      }
      seen.add(text);
    }

    // write paragraph followed by a blank line
    out.write(text + "\n\n");
    written++;
  }

  out.end();
  out.on("finish", () => {
    console.log(`Done.
  Read lines:   ${read}
  Written paras:${written}
  Skipped noise:${skipped}
  Duplicates:   ${duped}
  Output:       ${outPath}`);
  });
})();


/*
# if you use ts-node (no build step)
npx ts-node scripts/jsonl_to_txt.ts \
  --in uploads/mao-red-book.jsonl \
  --out uploads/mao-red-book.txt \
  --dedupe=true

*/