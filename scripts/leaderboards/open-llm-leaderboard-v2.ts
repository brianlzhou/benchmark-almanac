// Open LLM Leaderboard v2 (Hugging Face, archived in 2025), read from its public results dataset
// open-llm-leaderboard/contents through the Hugging Face dataset viewer's /rows API. The score is "Average ⬆️",
// the normalized mean of the six tasks, and the six task scores go in metrics. CO2 is not a cost, so it is not read.
// Read every unflagged entry, including community fine-tunes and merges. Keep untracked models under their source names.
// The viewer's /filter endpoint fails on this dataset, so the importer pages through /rows and filters itself.
// Flagged entries are skipped, as the board hides them. Precision is the setting when it is not 16-bit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard%2Fcontents&config=default&split=train';
const MAKERS = new Set(['Qwen', 'meta-llama', 'google', 'microsoft', 'mistralai', 'deepseek-ai', 'CohereForAI', 'CohereLabs', 'nvidia', 'allenai', 'tiiuae', 'ibm-granite', '01-ai']);
const TASKS = ['IFEval', 'BBH', 'MATH Lvl 5', 'GPQA', 'MUSR', 'MMLU-PRO'];

// Every unflagged entry of the results dataset, as the viewer returns it. Other importers read single task
// columns from it, such as musr.ts.
export async function openLlmEntries(): Promise<Record<string, any>[]> {
  const out: Record<string, any>[] = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    if (offset) await new Promise((resolve) => setTimeout(resolve, 6000));
    let page: { rows: { row: Record<string, any> }[]; num_rows_total: number } | undefined;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        page = await fetchJson<typeof page>(`${FEED}&offset=${offset}&length=100`);
        break;
      } catch (error) {
        // the viewer answers 429 when busy and sometimes 502 to 504 on the last pages
        if (!/\b(429|50[234])\b/.test(String(error)) || attempt === 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }
    }
    if (!page?.rows?.length) throw new Error(`Incomplete Open LLM results at ${offset}/${total}`);
    total = page.num_rows_total;
    for (const { row: r } of page.rows) if (r.fullname && !r.Flagged) out.push(r);
    offset += page.rows.length;
  }
  if (!out.length) throw new Error('Open LLM results missing');
  return out;
}

export const openLlmOwner = (r: Record<string, any>) => String(r.fullname).split('/')[0];
export const openLlmModel = (r: Record<string, any>) => (MAKERS.has(openLlmOwner(r)) ? r.fullname : r.fullname.replace('/', ' '));
export const openLlmPrecision = (r: Record<string, any>) => (/^b?float16$/.test(r.Precision ?? '') ? undefined : r.Precision || undefined);
export { MAKERS as OPEN_LLM_MAKERS };

const board: Leaderboard = {
  benchmark: 'open-llm-leaderboard-v2',
  url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
  feed: `${FEED} (all unflagged entries)`,
  terms: 'Public results dataset published by the board on Hugging Face, read through the dataset viewer API.',
  aliases: {},
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const r of await openLlmEntries()) {
      if (typeof r['Average ⬆️'] !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const k of TASKS) if (typeof r[k] === 'number') metrics[k] = r[k];
      out.push({ model: openLlmModel(r), score: r['Average ⬆️'], setting: openLlmPrecision(r), date: r['Submission Date'] || undefined, metrics });
    }
    if (!out.length) throw new Error('Open LLM results missing');
    return out;
  },
};
export default board;
