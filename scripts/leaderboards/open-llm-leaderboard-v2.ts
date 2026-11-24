// Read the Open LLM Leaderboard v2 results from the board's published Parquet file.
// Keep each unflagged submission, its normalized headline and task scores, raw task scores,
// evaluation emissions, precision, and the evaluated model revision with its Hub metadata.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { parquetReadObjects } from 'hyparquet';
import { fetchBytes } from '../lib/util.ts';

const FEED = 'https://huggingface.co/datasets/open-llm-leaderboard/contents/resolve/main/data/train-00000-of-00001.parquet';
const MAKERS = new Set(['Qwen', 'meta-llama', 'google', 'microsoft', 'mistralai', 'deepseek-ai', 'CohereForAI', 'CohereLabs', 'nvidia', 'allenai', 'tiiuae', 'ibm-granite', '01-ai']);
const TASKS = ['IFEval', 'BBH', 'MATH Lvl 5', 'GPQA', 'MUSR', 'MMLU-PRO'];

// MuSR also uses the raw task scores from these unflagged results.
export async function openLlmEntries(): Promise<Record<string, any>[]> {
  const rows = await parquetReadObjects({ file: await fetchBytes(FEED) });
  const entries = rows.flatMap((r, index) => r.fullname && !r.Flagged ? [{
    ...r, resultUrl: 'https://huggingface.co/datasets/open-llm-leaderboard/contents/viewer/default/train?row=' + index,
  }] : []);
  if (!entries.length) throw new Error('Open LLM results missing');
  return entries;
}

export const openLlmOwner = (r: Record<string, any>) => String(r.fullname).split('/')[0];
export const openLlmModel = (r: Record<string, any>) => (MAKERS.has(openLlmOwner(r)) ? r.fullname : r.fullname.replace('/', ' '));
export const openLlmPrecision = (r: Record<string, any>) => (/^b?float16$/.test(r.Precision ?? '') ? undefined : r.Precision || undefined);
export { MAKERS as OPEN_LLM_MAKERS };

const board: Leaderboard = {
  benchmark: 'open-llm-leaderboard-v2',
  parts: {
    IFEval: { name: 'IFEval', group: 'Split' },
    BBH: { name: 'BBH', group: 'Split' },
    'MATH Lvl 5': { name: 'MATH Level 5', group: 'Split' },
    GPQA: { name: 'GPQA', group: 'Split' },
    MUSR: { name: 'MuSR', group: 'Split' },
    'MMLU-PRO': { name: 'MMLU-Pro', group: 'Split' },
  },
  stats: {
    'IFEval Raw': { name: 'IFEval raw score', unit: '%', better: 'higher' },
    'BBH Raw': { name: 'BBH raw score', unit: '%', better: 'higher' },
    'MATH Lvl 5 Raw': { name: 'MATH Level 5 raw score', unit: '%', better: 'higher' },
    'GPQA Raw': { name: 'GPQA raw score', unit: '%', better: 'higher' },
    'MUSR Raw': { name: 'MuSR raw score', unit: '%', better: 'higher' },
    'MMLU-PRO Raw': { name: 'MMLU-Pro raw score', unit: '%', better: 'higher' },
    co2Kg: { name: 'CO2 emissions (kg)', better: 'lower' },
    hubLikes: { name: 'Hub likes', unit: 'count' },
  },
  url: 'https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard',
  feed: `${FEED} (all unflagged entries)`,
  terms: 'Public results dataset published by the board on Hugging Face, read from its archived train split.',
  aliases: {},
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const r of await openLlmEntries()) {
      if (typeof r['Average ⬆️'] !== 'number') continue;
      const metrics: Record<string, number> = {};
      for (const k of TASKS) {
        if (typeof r[k] === 'number') metrics[k] = r[k];
        const raw = r[`${k} Raw`];
        if (typeof raw === 'number') metrics[`${k} Raw`] = raw;
      }
      if (Number.isFinite(r['CO₂ cost (kg)'])) metrics.co2Kg = r['CO₂ cost (kg)'];
      if (r['Hub ❤️'] != null) metrics.hubLikes = Number(r['Hub ❤️']);
      out.push({
        model: openLlmModel(r),
        score: r['Average ⬆️'],
        setting: r.Precision || undefined,
        date: r['Submission Date'] || undefined,
        link: r.resultUrl,
        open: true,
        license: r['Hub License'] && r['Hub License'] !== 'unknown' ? r['Hub License'] : undefined,
        params: r['#Params (B)'] > 0 ? r['#Params (B)'] : undefined,
        metrics,
      });
    }
    if (!out.length) throw new Error('Open LLM results missing');
    return out;
  },
};
export default board;
