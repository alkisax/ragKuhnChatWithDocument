/* eslint-disable no-console */
import type { Request, Response } from "express";
import axios from "axios";
import { load as loadHtml } from "cheerio";
import fs from "fs";            // 🔹 NEW: αποθήκευση αρχείου
import path from "path";        // 🔹 NEW: διαδρομή uploads

/**
 * Βοηθητικό: κατεβάζει HTML ως κείμενο (UTF-8).
 * Για απλότητα δεν κάνουμε iconv εδώ.
 */
const fetchHtmlUtf8 = async (url: string): Promise<string> => {
  const res = await axios.get<string>(url, {
    responseType: "text",
    headers: { "User-Agent": "tiny-scraper/1.0", Accept: "text/html" },
    validateStatus: (s) => s >= 200 && s < 400, // “Θεώρησε επιτυχία όλα τα HTTP status από 200 έως 399.”
    timeout: 15000, // 🔹 NEW: για να μη «κρεμάει» επ' άπειρον
  });
  return res.data ?? "";
};

/**
 * Από το index HTML βρίσκει όλα τα <a href="..."> που ταιριάζουν στο regex.
 * Επιστρέφει absolute URLs.
 */
// linkRe είναι μια Regular Expression (RegExp) που λες στη discoverLinks “ποια links θεωρούνται subpages για scraping”.
function discoverLinks(indexHtml: string, baseUrl: string, linkRe: RegExp): string[] {
  // αυτό είναι εντολή του cheerio με συνταξη JQuery. Aποθηκεύουμε σε μεταβλητή που ονομάζεται $ για συντομία. Έτσι μπορείς να γράφεις $('a[href]'), $('p') κ.λπ.
  const $ = loadHtml(indexHtml);
  const base = new URL(baseUrl);
  const out: string[] = [];
  const seen = new Set<string>();

  /*
    $("a[href]"): με τη Cheerio επιλέγεις όλα τα <a> που έχουν href (CSS selector a[href]). Δεν πιάνει <a> χωρίς href.
    .each((index, element) => { ... }): κάνει loop σε κάθε αποτέλεσμα.
    Η υπογραφή είναι (index, element).
    Εσύ γράφεις (_, a) γιατί αγνοείς το index (γι’ αυτό _) και κρατάς μόνο το DOM element a.
    Το a είναι το ακατέργαστο element (όχι Cheerio wrapper). Για να χρησιμοποιήσεις μεθόδους τύπου jQuery, το τυλίγεις: const $a = $(a).
  */
  $("a[href]").each((_, a) => {
    const href = String($(a).attr("href") || "").trim();
    if (!href) return;
    const abs = new URL(href, base).toString();
    const leaf = (new URL(abs)).pathname.split("/").pop() || "";
    if (!linkRe.test(leaf)) return;
    if (!seen.has(abs)) { seen.add(abs); out.push(abs); }
  });

  return out;
}

/**
 * Παίρνει όλο το κείμενο από <p> tags, καθαρισμένο.
 */
const extractParagraphs = (html: string): string[] => {
  const $ = loadHtml(html);
  $("script, style").remove();
  return $("p")
    .map((_, p) => $(p).text().replace(/\s+/g, " ").trim())
    .get()
    .filter((t) => t.length > 0);
};

/**
 * POST /api/scraper/scrape
 * Body:
 * {
 *   "index": "https://.../index.htm",        // απαιτείται
 *   "linkPattern": "^ch\\d{2}\\.htm$",       // προαιρετικό (default)
 *   "limit": 0,                              // 0 = όλα, αλλιώς κόβει στα πρώτα N subpages
 *   "delayMs": 300,                          // καθυστέρηση μεταξύ αιτημάτων
 *   "save": true,                            // 🔹 NEW: αν true, σώζει JSONL στο /uploads
 *   "outFilename": "mao-red-book.jsonl",     // 🔹 NEW: όνομα αρχείου (αν save)
 *   "returnFile": false                      // 🔹 NEW: αν true, κάνει stream το αρχείο
 * }
 */
const scrapeTinyController = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      index,
      linkPattern = "^ch\\d{2}\\.htm$",
      limit = 0,
      delayMs = 300,
      save = false,                 // 🔹 NEW
      outFilename = "scrape.jsonl", // 🔹 NEW
      returnFile = false,           // 🔹 NEW
    } = (req.body || {}) as {
      index?: string;
      linkPattern?: string;
      limit?: number;
      delayMs?: number;
      save?: boolean;
      outFilename?: string;
      returnFile?: boolean;
    };

    if (!index) {
      res.status(400).json({ status: false, message: "`index` URL is required" });
      return;
    }

    // 🔹 NEW: ασφαλής δημιουργία RegExp από input
    let linkRegex: RegExp;
    try {
      linkRegex = new RegExp(linkPattern, "i");
    } catch (e: any) {
      res.status(400).json({ status: false, message: "Invalid linkPattern", detail: String(e?.message || e) });
      return;
    }

    // 1) Κατέβασε index & βρες subpage links
    const indexHtml = await fetchHtmlUtf8(index);
    let links = discoverLinks(indexHtml, index, linkRegex);
    if (limit && limit > 0) links = links.slice(0, limit);
    if (!links.length) {
      res.status(400).json({ status: false, message: "No subpage links matched." });
      return;
    }

    // 2) Για κάθε link: κατέβασε & τράβα <p> κείμενα
    const rows: Array<{ url: string; paragraphIndex: number; text: string }> = [];
    for (const url of links) {
      const html = await fetchHtmlUtf8(url);
      const paras = extractParagraphs(html);
      paras.forEach((text, i) => rows.push({ url, paragraphIndex: i, text }));
      if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs)); // ευγένεια
    }

    // 🔹 NEW: save/stream JSONL, αλλιώς επέστρεψε JSON data όπως πριν
    if (save) {
      const uploadsDir = path.resolve(process.cwd(), "uploads");
      fs.mkdirSync(uploadsDir, { recursive: true });
      const outPath = path.join(uploadsDir, outFilename);
      fs.writeFileSync(outPath, rows.map(o => JSON.stringify(o)).join("\n"), "utf8");

      if (returnFile) {
        res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${path.basename(outPath)}"`);
        res.status(200).send(fs.readFileSync(outPath));
        return;
      }

      res.status(200).json({
        status: true,
        pages: links.length,
        paragraphs: rows.length,
        filePath: outPath,
        sample: rows.slice(0, 10),
      });
      return;
    }

    // 3) Απάντηση (δείχνουμε και ένα μικρό δείγμα)
    res.status(200).json({
      status: true,
      pages: links.length,
      paragraphs: rows.length,
      sample: rows.slice(0, 10),
      data: rows, // Αν θες να είναι «ελαφρύ», αφαίρεσέ το ή κάνε paginate.
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ status: false, message: err?.message || "Server error" });
  }
};

export const scraperControler = {
  scrapeTinyController
};


/*
curl -X POST http://localhost:3001/api/scraper/scrape \
  -H "Content-Type: application/json" \
  --data-binary @- <<'JSON'
{
  "index": "https://www.marxists.org/reference/archive/mao/works/red-book/index.htm",
  "linkPattern": "^ch\\d{2}\\.htm$",
  "limit": 0,
  "delayMs": 400,
  "save": true,
  "outFilename": "mao-red-book.jsonl",
  "returnFile": false
}
JSON
*/