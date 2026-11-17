/**
 * Parse each TEMA N.pdf in the parent folder, build a tema → section tree,
 * and upsert into Supabase.
 *
 *   pnpm run ingest
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string }>;

// --- env ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env — need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// --- types ---
type SectionDraft = {
  tema_id: number;
  parent_tmp: string | null;
  tmp_id: string;
  number: string;
  title: string;
  level: number;
  order_idx: number;
  content: string;
};

// --- PDF location ---
const PDF_DIR = path.join(process.cwd(), '..');
const TEMA_FILES = ['TEMA 1.pdf', 'TEMA 2.pdf', 'TEMA 5.pdf', 'TEMA 6.pdf', 'TEMA 7.pdf', 'TEMA 8.pdf'];

// --- helpers ---
function cleanLine(s: string): string {
  return s
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripFooter(text: string): string {
  return text
    .split('\n')
    .filter((l) => {
      const c = cleanLine(l);
      if (!c) return true;
      if (/^Preparadores:/i.test(c)) return false;
      if (/^Alejandro Gonz[aá]lez/i.test(c)) return false;
      if (/^Mar[ií]a Guerrero/i.test(c)) return false;
      if (/^\d{1,3}$/.test(c)) return false; // bare page numbers
      if (/^ACADEMIA/i.test(c)) return false;
      if (/^LUIS VIVES/i.test(c)) return false;
      if (/^LV$/i.test(c)) return false;
      return true;
    })
    .join('\n');
}

// Section-number patterns, e.g. "2.", "2.1.", "2.1.1.", "2.1.1.a."
const SECTION_RE = /^(\d+(?:\.\d+)*)\.?\s+(.+)$/;
const TEMA_TITLE_RE = /^TEMA\s+(\d+)\s*:\s*(.+)$/i;

function parseTema(pdfText: string, temaNumber: number) {
  const text = stripFooter(pdfText);
  const lines = text.split('\n').map(cleanLine).filter(Boolean);

  let fullTitle = `TEMA ${temaNumber}`;
  const sections: SectionDraft[] = [];
  let currentContent: string[] = [];

  // Find the full tema title (often spans multiple lines)
  const titleLineIdx = lines.findIndex((l) => TEMA_TITLE_RE.test(l));
  if (titleLineIdx >= 0) {
    const m = lines[titleLineIdx].match(TEMA_TITLE_RE)!;
    // Grab the title + continuation lines until a numeric section starts
    const titleParts = [m[2]];
    let j = titleLineIdx + 1;
    while (j < lines.length && !SECTION_RE.test(lines[j]) && !/^(INTRODUCCI[ÓO]N|CONCLUSI[ÓO]N|REFERENCIAS)/i.test(lines[j])) {
      titleParts.push(lines[j]);
      j++;
      if (j - titleLineIdx > 10) break;
    }
    fullTitle = `TEMA ${temaNumber}: ${titleParts.join(' ').trim()}`;
  }

  // Walk lines, detect section headings
  const startIdx = titleLineIdx >= 0 ? titleLineIdx + 1 : 0;
  let currentTmp: string | null = null;

  // Map section_number -> tmp_id for parent lookup
  const bySecNum = new Map<string, SectionDraft>();

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];

    // Flush content into current section
    const m = line.match(SECTION_RE);
    const isSpecial = /^(INTRODUCCI[ÓO]N(?:\s*[–-]\s*JUSTIFICACI[ÓO]N)?|CONCLUSI[ÓO]N|REFERENCIAS)/i.test(line);

    if (m || isSpecial) {
      // Save content to the previous section
      if (currentTmp) {
        const prev = sections.find((s) => s.tmp_id === currentTmp)!;
        prev.content = currentContent.join('\n').trim();
      }
      currentContent = [];

      let number: string;
      let title: string;
      if (m) {
        number = m[1];
        title = m[2];
      } else {
        // Special sections get synthetic numbers
        if (/INTRODUCCI/i.test(line)) number = '0';
        else if (/CONCLUSI/i.test(line)) number = '99';
        else number = '100'; // referencias
        title = line.replace(/^[^A-ZÁÉÍÓÚÑ]+/i, '').trim();
      }

      const level = number === '0' || number === '99' || number === '100' ? 1 : number.split('.').length;
      const parentNum = level > 1 ? number.split('.').slice(0, -1).join('.') : null;

      const draft: SectionDraft = {
        tema_id: temaNumber,
        parent_tmp: parentNum,
        tmp_id: number,
        number,
        title,
        level,
        order_idx: sections.length,
        content: '',
      };
      sections.push(draft);
      bySecNum.set(number, draft);
      currentTmp = number;
    } else {
      if (currentTmp) currentContent.push(line);
    }
  }
  // Flush last section
  if (currentTmp) {
    const prev = sections.find((s) => s.tmp_id === currentTmp)!;
    prev.content = currentContent.join('\n').trim();
  }

  return { fullTitle, sections };
}

async function main() {
  console.log('Ingesting PDFs → Supabase');

  // Clear temas (cascades to sections)
  const { error: delErr } = await sb.from('temas').delete().neq('id', -1);
  if (delErr) {
    console.error('Delete temas failed:', delErr.message);
    process.exit(1);
  }

  for (const file of TEMA_FILES) {
    const full = path.join(PDF_DIR, file);
    if (!fs.existsSync(full)) {
      console.warn(`  skip (missing): ${file}`);
      continue;
    }
    const numberMatch = file.match(/TEMA\s+(\d+)/i);
    if (!numberMatch) continue;
    const temaNumber = parseInt(numberMatch[1], 10);

    const buf = fs.readFileSync(full);
    const parsed = await pdfParse(buf);
    const { fullTitle, sections } = parseTema(parsed.text, temaNumber);
    const shortTitle = fullTitle.replace(/^TEMA\s+\d+:\s*/i, '').split('.')[0].trim();

    console.log(`  TEMA ${temaNumber} — ${sections.length} secciones`);

    // Upsert tema
    const { error: temaErr } = await sb.from('temas').upsert({
      id: temaNumber,
      number: temaNumber,
      title: shortTitle,
      full_title: fullTitle,
    });
    if (temaErr) {
      console.error('  tema upsert failed:', temaErr.message);
      continue;
    }

    // Insert sections in two passes to resolve parent_id
    const { data: insertedRows, error: secErr } = await sb
      .from('sections')
      .insert(
        sections.map((s) => ({
          tema_id: s.tema_id,
          parent_id: null,
          number: s.number,
          title: s.title,
          level: s.level,
          order_idx: s.order_idx,
          content: s.content,
        }))
      )
      .select('id, number');
    if (secErr) {
      console.error('  sections insert failed:', secErr.message);
      continue;
    }

    // Resolve parents
    const byNumber = new Map<string, number>();
    (insertedRows ?? []).forEach((r: any) => byNumber.set(r.number as string, r.id as number));

    const parentUpdates = sections
      .filter((s) => s.parent_tmp && byNumber.has(s.parent_tmp))
      .map((s) => ({ id: byNumber.get(s.number)!, parent_id: byNumber.get(s.parent_tmp!)! }));

    for (const u of parentUpdates) {
      const { error } = await sb.from('sections').update({ parent_id: u.parent_id }).eq('id', u.id);
      if (error) console.error('    parent update failed:', error.message);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
