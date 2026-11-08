// OmniDocBench v1.5 (OpenDataLab). The repository README holds the leaderboard as HTML tables. Since the
// v1.6 update (2026-04-10) the main branch shows v1.6 and later results, and the v1.5 board stays on the
// v1_5 branch, whose README is read here. The first table is end-to-end parsing: Model Type (a rowspan
// group), Methods, Size, Overall (higher is better: the mean of (1 - text edit distance) × 100, formula CDM
// and table TEDS), then the parts. Overall is the score. General models named without their size
// ("Qwen2.5-VL", Size 72B) are placed through aliases. Plain "GPT-4o" does not say which snapshot ran and is
// retained as snapshot-unspecified. Size-qualified family names prevent ambiguous matches.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const FEED = 'https://raw.githubusercontent.com/opendatalab/OmniDocBench/v1_5/README.md';

const TYPE = /^(Specialized VLMs|General VLMs|Pipeline Tools|Expert VLMs|General MLLMs)$/i;

/**
 * Rows of the end-to-end table in an OmniDocBench README: the method name and Overall. The Model Type cell
 * may be a rowspan (shorter rows) or sit beside the method in either order, so the method is the first cell
 * that is not a type label. Names in `skip` are left out.
 */
export async function omnidocRows(feed: string, skip: string[] = [], identifyFamilies = false): Promise<LeaderboardRow[]> {
  const t = tables(await fetchText(feed)).find((rows) => rows[0]?.some((c) => /^Overall/.test(c.text)) && rows[0]?.some((c) => c.text === 'Methods'));
  if (!t) throw new Error('end-to-end table not found');
  const head = t[0].map((c) => c.text);
  const iOverall = head.findIndex((h) => /^Overall/.test(h));
  if (iOverall !== 3 || head[2] !== 'Size') throw new Error(`unexpected columns: ${head.join(' | ')}`);
  const rows: LeaderboardRow[] = [];
  for (const r of t.slice(1)) {
    const full = r.length === head.length;
    const cells = r.map((c) => c.text.trim());
    let model = full ? (TYPE.test(cells[0]) ? cells[1] : cells[0]) : cells[0];
    const score = num(cells[full ? iOverall : iOverall - 1]);
    if (!model || TYPE.test(model) || score === undefined || skip.includes(model)) continue;
    if (identifyFamilies) {
      const size = cells[full ? 2 : 1];
      if (/^(Qwen2\.5-VL|InternVL3(?:\.5)?)$/.test(model) && /^\d+(?:\.\d+)?B$/.test(size)) model += `-${size}`;
      if (model === 'GPT-4o') model += ' (snapshot unspecified)';
    }
    rows.push({ model, score });
  }
  if (!rows.length) throw new Error(`no rows in ${feed}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'omnidocbench-1-5',
  url: 'https://github.com/opendatalab/OmniDocBench/tree/v1_5#end-to-end-evaluation',
  feed: `${FEED} (end-to-end table, Overall)`,
  terms: 'README on the v1_5 branch of opendatalab/OmniDocBench, which is Apache-2.0.',
  aliases: {
    'Gemini-3 Pro': 'gemini-3-pro',
    'Gemini-3 Flash': 'gemini-3-flash',
    'Gemini-2.5 Pro': 'gemini-2-5-pro-jun-2025',
    GPT5: 'gpt-5',
    'GPT5.2': 'gpt-5-2',
    'GLM-OCR': 'glm-ocr',
    'Qwen2.5-VL-72B': 'qwen2-5-vl-72b',
    'InternVL3-78B': 'internvl3-78b',
    'InternVL3.5-241B': 'internvl3-5-241b-a28b',
    // the 2025-10-28 update names the run Qwen3-VL-235B-A22B-Instruct
    'Qwen3-VL-235B': 'qwen3-vl-235b-a22b-instruct',
  },
  fetch: () => omnidocRows(FEED, [], true),
};
export default board;
