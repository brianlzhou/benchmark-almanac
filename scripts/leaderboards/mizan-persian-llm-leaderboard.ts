// MIZAN evaluates Persian language models. Its JSONL feed reports the average across six tasks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

export const mizanTerms = 'The Space lists no license for its scores. Both hosts allow access in robots.txt.';
export const mizanAliases = {
  'Mistral-Small-3.1-24B-Instruct-2503': 'mistral-small-3-1',
  'gpt-oss:120b': 'gpt-oss-120b', 'gpt-oss:20b': 'gpt-oss-20b',
  'gpt-oss-120b-low-reasoning': 'gpt-oss-120b', 'gpt-oss-20b-low-reasoning': 'gpt-oss-20b',
  'gpt-5-mini-minimal-reasoning': 'gpt-5-mini', 'gpt-5-nano-minimal-reasoning': 'gpt-5-nano',
  'llama4:scout': 'llama-4-scout', 'c4ai-command-a-03-2025': 'cohere-command-a',
  'c4ai-command-r-v01': 'command-r-03-2024', 'c4ai-command-r-plus': 'command-r-plus',
};
export async function mizanRows(feed: string, headline: string, parts: Record<string,string>, scale: number, min: number): Promise<LeaderboardRow[]> {
  const rows = (await fetchText(feed)).trim().split(/\r?\n/).map(line => {
    const r = JSON.parse(line);
    const model = r['Model Name'];
    if (!model || !Number.isFinite(r[headline]) || !Object.values(parts).every(k => k in r && (r[k] === null || Number.isFinite(r[k])))) throw new Error('Incomplete MIZAN result');
    const effort = model.match(/-(low|minimal)-reasoning$/)?.[1];
    return { model, score: scale * r[headline], open: r.source_type === 'Open-Source',
      setting: effort ? effort + ' reasoning' : r.thinking_method.includes('✔') ? 'Thinking' : 'Non-thinking',
      params: Number(r.parameters_count) > 0 ? Number(r.parameters_count) / 1e9 : undefined,
      metrics: Object.fromEntries(Object.entries(parts).filter(([,name]) => r[name] !== null).map(([k, name]) => [k, scale * r[name]])) };
  });
  if (rows.length < min) throw new Error('Missing MIZAN entries');
  return rows;
}
const parts = { ifeval: 'Persian IFEval', mt: 'Persian MT-Bench', mmlu: 'PerMMLU', cor: 'PerCoR', nlu: 'Persian NLU', nlg: 'Persian NLG' };
const feed = "https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/raw/main/leaderboard/boards_data/all.jsonl";
const board: Leaderboard = {
  benchmark: "mizan-persian-llm-leaderboard", url: "https://mcinext-mizan-llm-leaderboard.hf.space/", feed, terms: mizanTerms, aliases: mizanAliases, parts,
  fetch: () => mizanRows(feed, 'Average', parts, 1, 45),
};
export default board;
