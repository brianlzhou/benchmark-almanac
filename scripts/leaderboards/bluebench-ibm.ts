// BlueBench is IBM's enterprise-use benchmark across thirteen language and safety tasks.
// The headline score is the mean percentage across the thirteen task scores, with higher values better.
// This importer reads the evaluation JSON files and model map in the Hugging Face Space repository.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const API = 'https://huggingface.co/api/spaces/ibm-research/bluebench/tree/main?recursive=true';
const ROOT = 'https://huggingface.co/spaces/ibm-research/bluebench/resolve/main/';
const TASKS = ['bias', 'chatbot_abilities', 'entity_extraction', 'knowledge', 'legal', 'news_classification', 'product_help', 'qa_finance', 'rag_general', 'reasoning', 'safety', 'summarization', 'translation'];
interface TreeEntry { path: string; type: string }
interface EvalFile { environment_info?: { parsed_arguments?: { model?: string } }; results?: Record<string, { score?: number }> }
const pct = (x: number) => Math.round(x * 1000) / 10;

const board: Leaderboard = {
  benchmark: 'bluebench-ibm',
  url: 'https://huggingface.co/spaces/ibm-research/bluebench',
  feed: `${API} plus each evaluation_results.json and modelmap.csv file in the Space`,
  terms: 'The Space README declares Apache 2.0. Results are credited to IBM Research with a link to the Space.',
  parts: Object.fromEntries(TASKS.map((k) => [k, { name: k === 'qa_finance' ? 'QA Finance' : k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), group: 'BlueBench task' }])),
  async fetch() {
    const tree = await fetchJson<TreeEntry[]>(API);
    const paths = tree.filter((x) => x.type === 'file' && /results\/bluebench\/.*_evaluation_results\.json$/.test(x.path)).map((x) => x.path).sort();
    if (paths.length < 18) throw new Error(`BlueBench: found ${paths.length} evaluation files, expected at least 18`);
    const mapText = await (await fetch(`${ROOT}results/bluebench/modelmap.csv`)).text();
    const modelMap = new Map<string, string>(mapText.trim().split('\n').map((line) => { const [raw, model] = line.split(','); return [raw, model] as [string, string]; }));
    const rows: LeaderboardRow[] = [];
    for (const path of paths) {
      const d = await fetchJson<EvalFile>(ROOT + path);
      const raw = d.environment_info?.parsed_arguments?.model;
      if (!raw || !d.results) continue;
      const scores = TASKS.map((k) => d.results?.[k]?.score);
      if (scores.some((x) => typeof x !== 'number' || !Number.isFinite(x))) throw new Error(`BlueBench: incomplete task scores in ${path}`);
      const values = scores as number[];
      const metrics = Object.fromEntries(TASKS.map((k, i) => [k, pct(values[i])]));
      rows.push({ model: modelMap.get(raw) ?? raw, score: pct(values.reduce((a, b) => a + b, 0) / values.length), metrics });
    }
    if (rows.length < 18) throw new Error(`BlueBench: ${rows.length} complete model rows, expected at least 18`);
    return rows;
  },
};
export default board;
