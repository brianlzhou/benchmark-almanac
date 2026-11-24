// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// OmniDocBench v1.0 (Shanghai AI Lab, OpenDataLab).
// Evaluates end-to-end document parsing across 981 diverse English and Chinese PDF pages. Reads the end-to-end
// HTML table and the Model Weights table in the README on the v1_0 branch of opendatalab/OmniDocBench.
// The source reports Overall Edit Distance (0 to 1, lower is better) separately for English and Chinese without
// a combined column, so the headline is the plain unweighted mean of English and Chinese Overall Edit Distance
// scaled to percent (0 to 100, lower is better). Per-language overall and element edit distances go in parts,
// higher-is-better Formula CDM and Table TEDS go in stats, and open weights plus model sizes come from the
// README's Model Weights table and model labels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/opendatalab/OmniDocBench/v1_0/README.md';
const TYPE = /^(Pipeline Tools|Expert VLMs|General VLMs)$/i;

function paramsFromName(name: string): number | undefined {
  const b = name.match(/(?:^|[-_\s])(\d+(?:\.\d+)?)B\b/i);
  if (b) return Number(b[1]);
  const m = name.match(/(?:^|[-_\s])(\d+(?:\.\d+)?)M\b/i);
  if (m) return Number(m[1]) / 1000;
  return undefined;
}

const board: Leaderboard = {
  benchmark: 'omnidocbench',
  url: 'https://github.com/opendatalab/OmniDocBench/tree/v1_0',
  feed: FEED,
  terms: 'README on the v1_0 branch of opendatalab/OmniDocBench, released under Apache-2.0.',
  headline: 'The v1.0 table reports English and Chinese overall edit distance separately, so this is the plain mean of both scaled to percent (lower is better).',
  aliases: {
    // Verified from the README Model Weights table: GPT4o is 2024-08-06, Gemini2.5-Pro is 2025-03-25
    GPT4o: 'gpt-4o-aug-2024',
    'Gemini2.5-Pro': 'gemini-2-5-pro-mar-2025',
    'Qwen2-VL-72B': 'qwen2-vl-72b-instruct',
    'Qwen2.5-VL-7B': 'qwen2-5-vl-7b',
    'Qwen2.5-VL-72B': 'qwen2-5-vl-72b',
    'InternVL2-76B': 'internvl2-llama3-76b',
    'InternVL3-78B': 'internvl3-78b',
  },
  parts: {
    overall_en: { name: 'Overall edit distance: English', group: 'Language', better: 'lower' },
    overall_zh: { name: 'Overall edit distance: Chinese', group: 'Language', better: 'lower' },
    text_en: { name: 'Text edit distance: English', group: 'Element', better: 'lower' },
    text_zh: { name: 'Text edit distance: Chinese', group: 'Element', better: 'lower' },
    formula_edit_en: { name: 'Formula edit distance: English', group: 'Element', better: 'lower' },
    formula_edit_zh: { name: 'Formula edit distance: Chinese', group: 'Element', better: 'lower' },
    table_edit_en: { name: 'Table edit distance: English', group: 'Element', better: 'lower' },
    table_edit_zh: { name: 'Table edit distance: Chinese', group: 'Element', better: 'lower' },
    read_order_en: { name: 'Reading order edit distance: English', group: 'Element', better: 'lower' },
    read_order_zh: { name: 'Reading order edit distance: Chinese', group: 'Element', better: 'lower' },
  },
  stats: {
    formula_cdm_en: { name: 'Formula CDM: English', unit: '%', better: 'higher' },
    formula_cdm_zh: { name: 'Formula CDM: Chinese', unit: '%', better: 'higher' },
    table_teds_en: { name: 'Table TEDS: English', unit: '%', better: 'higher' },
    table_teds_zh: { name: 'Table TEDS: Chinese', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const allTables = tables(await fetchText(FEED));
    const t = allTables.find((rows) => rows[0]?.some((c) => /^Overall/i.test(c.text)) && rows[0]?.some((c) => c.text === 'Methods'));
    if (!t || t.length < 10) throw new Error('OmniDocBench v1.0 end-to-end table missing');

    // Read open-weight markers and links from the README's Model Weights table.
    const openByKey = new Map<string, boolean>();
    const weightsTable = allTables.find((rows) => rows[0]?.some((c) => /Evaluation Version\/Model Weights/i.test(c.text)));
    for (const row of weightsTable?.slice(1) ?? []) {
      for (let i = 0; i + 2 < row.length; i += 3) {
        const name = row[i].text.trim().toLowerCase();
        const href = row[i + 2].html.match(/href="(https?:\/\/[^"]+)"/)?.[1]
          ?? row[i + 1].html.match(/href="(https?:\/\/[^"]+)"/)?.[1];
        if (name && href?.startsWith('https://huggingface.co/')) openByKey.set(name, true);
      }
    }

    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const cells = r.map((c) => c.text.trim());
      if (cells.length < 15) continue;
      const offset = TYPE.test(cells[0]) ? 1 : 0;
      const model = cells[offset];
      if (!model || TYPE.test(model)) continue;

      const nums = cells.slice(offset + 1).map(num);
      const [oEn, oZh, tEn, tZh, fEn, fZh, fCdmEn, fCdmZh, tbTedsEn, tbTedsZh, tbEdEn, tbEdZh, roEn, roZh] = nums;
      if (oEn === undefined || oZh === undefined) continue;

      const metrics: Record<string, number> = {
        overall_en: oEn * 100,
        overall_zh: oZh * 100,
      };
      if (tEn !== undefined) metrics.text_en = tEn * 100;
      if (tZh !== undefined) metrics.text_zh = tZh * 100;
      if (fEn !== undefined) metrics.formula_edit_en = fEn * 100;
      if (fZh !== undefined) metrics.formula_edit_zh = fZh * 100;
      if (fCdmEn !== undefined) metrics.formula_cdm_en = fCdmEn;
      if (fCdmZh !== undefined) metrics.formula_cdm_zh = fCdmZh;
      if (tbTedsEn !== undefined) metrics.table_teds_en = tbTedsEn;
      if (tbTedsZh !== undefined) metrics.table_teds_zh = tbTedsZh;
      if (tbEdEn !== undefined) metrics.table_edit_en = tbEdEn * 100;
      if (tbEdZh !== undefined) metrics.table_edit_zh = tbEdZh * 100;
      if (roEn !== undefined) metrics.read_order_en = roEn * 100;
      if (roZh !== undefined) metrics.read_order_zh = roZh * 100;

      const lk = model.toLowerCase();
      const open = openByKey.get(lk)
        ?? (lk.startsWith('ocrflux') ? openByKey.get('ocrflux') : undefined)
        ?? (lk.startsWith('smoldocling') ? openByKey.get('smoldocling') : undefined)
        ?? (lk === 'internvl2-76b' ? openByKey.get('internvl2-llama3-76b') : undefined);

      rows.push({
        model,
        score: ((oEn + oZh) / 2) * 100,
        params: paramsFromName(model),
        open,
        metrics,
      });
    }
    if (rows.length < 20) throw new Error(`Only ${rows.length} OmniDocBench v1.0 rows parsed`);
    return rows;
  },
};

export default board;
