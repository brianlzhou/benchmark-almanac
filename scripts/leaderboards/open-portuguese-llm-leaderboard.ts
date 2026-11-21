// The Open Portuguese LLM Leaderboard ranks models by Average over nine tasks.
// Read the archived CSV and its metadata for model settings, evaluation dates and task labels.
import type { Leaderboard } from './types.ts';
import { gunzipSync } from 'node:zlib';
import { fetchBytes, fetchJson, parseCsv } from '../lib/util.ts';

const url = "https://huggingface.co/spaces/eduagarcia/open_pt_llm_leaderboard";
const feed = "https://huggingface.co/spaces/eduagarcia/open_pt_llm_leaderboard/resolve/main/data/leaderboard.csv.gz";

const board: Leaderboard = {
  benchmark: 'open-portuguese-llm-leaderboard', url, feed,
  terms: "The Space declares Apache 2.0. https://huggingface.co/spaces/eduagarcia/open_pt_llm_leaderboard/blob/main/README.md" ,
  stats: {
    npm: { name: 'Normalized performance mean', unit: '%', better: 'higher', note: 'Mean task score normalized against each task baseline.' },
    evalTime: { name: 'Evaluation time', unit: 'seconds', better: 'lower' },
  },
  aliases: {
    "Claude 3.7 Sonnet (2025-02-19)": "claude-3-7-sonnet",
    "GPT 5 Mini (2025-08-07)": "gpt-5-mini",
    "GPT 5 (2025-08-07)": "gpt-5",
    "GPT 5 Nano (2025-08-07)": "gpt-5-nano",
    "GPT-4o (2024-08-06)": "gpt-4o-aug-2024",
    "Grok 3 Mini (API)": "grok-3-mini",
    "Gemini 2.0 Flash (001)": "gemini-2-0-flash-feb-2025",
    "Qwen/Qwen2.5-72B-Instruct (API)": "qwen2-5-72b",
    "Qwen/Qwen2.5-VL-72B-Instruct (API)": "qwen2-5-vl-72b",
    "deepseek-ai/DeepSeek-V3-0324 (API)": "deepseek-v3-mar-2025",
    "deepseek-ai/DeepSeek-V3.1 (API)": "deepseek-v3-1",
    "meta-llama/Llama-2-70b-hf": "llama-2-70b",
    "meta-llama/Llama-3.3-70B-Instruct (Vertex AI)": "llama-3-3-70b-instruct",
    "meta-llama/Llama-4-Maverick-17B-128E-Instruct (FireworksAI API)": "llama-4-maverick",
    "moonshotai/Kimi-K2-Instruct (API)": "kimi-k2-jul-2025",
    "nvidia/Nemotron-4-340B-Instruct (Nvidia API)": "nemotron-4-340b-instruct"
  },
  async fetch() {
    const metadata = await fetchJson<{row_count:number;tasks:{key:string;label:string}[]}>(feed.replace('leaderboard.csv.gz','metadata.json'));
    await new Promise(resolve=>setTimeout(resolve,1000));
    const rows = parseCsv(gunzipSync(await fetchBytes(feed)).toString('utf8'));
    if (rows.length !== metadata.row_count || rows.length < 1254 || metadata.tasks.length < 9) throw new Error('Incomplete Portuguese leaderboard snapshot');
    board.parts = Object.fromEntries(metadata.tasks.map(t=>[t.key,t.label]));
    return rows.filter(r => r.source !== 'baseline' && r.flagged !== 'True').map(r => {
      const number = (key:string) => {
        if (!r[key]?.trim() || !Number.isFinite(Number(r[key]))) throw new Error('Invalid ' + key + ' for ' + r.display_name);
        return Number(r[key]);
      };
      const model = r.hf_path || r.display_name.replace(/\s*\[\d{4}-\d\d-\d\d\]$/,'').replace(/\s*\[reasoning[^\]]*\]/i,'').trim();
      const setting = [r.display_name.match(/\[(reasoning[^\]]*)\]/i)?.[1], r.precision === '?' ? '' : r.precision].filter(Boolean).join(' · ');
      if (!model || !r.date || !r.display_name) throw new Error('Missing model details');
      const metrics = Object.fromEntries(metadata.tasks.map(t=>[t.key,number(t.key)]));
      metrics.npm = number('npm');
      if (number('eval_time') > 0) metrics.evalTime = number('eval_time');
      return {model, score:number('average'), setting:setting || undefined, date:r.date, params:number('params') || undefined,
        license:r.license && r.license !== '?' ? r.license : undefined, link:r.details_url || r.link || undefined, metrics};
    });
  },
};
export default board;
