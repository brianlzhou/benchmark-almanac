// The INVALSI leaderboard scores Italian school test questions. Its Gradio tables publish overall
// accuracy and separate scores by grade and question type, and by linguistic skill.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { fetchJson } from '../lib/util.ts';
const feed = "https://crisp-unimib-invalsibenchmark.hf.space/config";
const board: Leaderboard = {
  benchmark: 'invalsi-italian-llm-benchmark-crisp',
  url: "https://huggingface.co/spaces/Crisp-Unimib/INVALSIbenchmark",
  feed,
  terms: "Hugging Face robots.txt allows the Space. The app uses Apache 2.0. The separate results repository gives no explicit license.",
  aliases: {
    "mistralai/Mistral-Large-Instruct-2407": "mistral-large-2-jul-2024",
    "meta-llama/Meta-Llama-3.1-405B-Instruct": "llama-3-1-405b",
    "meta-llama/Meta-Llama-3.1-70B-Instruct": "llama-3-1-70b",
    "mistralai/Mixtral-8x22B-Instruct-v0.1": "mixtral-8x22b",
    "google/gemma-2-27b-it": "gemma-2-27b",
    "meta-llama/Meta-Llama-3-70B-Instruct": "llama-3-70b",
    "CohereForAI/c4ai-command-r-plus": "command-r-plus",
    "google/gemma-2-9b-it": "gemma-2-9b",
    "mistralai/Mixtral-8x7B-Instruct-v0.1": "mixtral-8x7b",
    "mistralai/Mistral-Nemo-Instruct-2407": "mistral-nemo",
    "meta-llama/Meta-Llama-3.1-8B-Instruct": "llama-3-1-8b",
    "meta-llama/Meta-Llama-3-8B-Instruct": "llama-3-8b",
    "meta-llama/Llama-3.2-3B-Instruct": "llama-3-2-3b",
    "meta-llama/Llama-3.2-1B-Instruct": "llama-3-2-1b"
  },
  async fetch() {
    type Table = { headers: string[]; data: (string | number)[][] };
    const config = await fetchJson<{ components: { type: string; props: { value: Table } }[] }>(feed);
    const tables = config.components.filter(c => c.type === 'dataframe').map(c => c.props.value);
    const main = tables.find(t => t.headers.join('|') === 'T|Model|Model Size|Overall|Eval Date');
    const breakdowns = [tables.find(t => t.headers.includes('2 - MC')), tables.find(t => t.headers.includes('LI (108)'))];
    if (!main || main.data.length < 45 || breakdowns.some(t => !t || t.data.length !== main.data.length)) throw new Error('Missing INVALSI tables');
    const short = (name: string) => name.split('/').at(-1)!.toLowerCase().replace(/^meta-|^c4ai-|:beta$|:nitro$|-v0\.[13]$|-instruct-2407$/g, '')
      .replace('dolphin-2.9.1-', 'dolphin-').replace('qwen2-', 'qwen-2-');
    return main.data.map(([type, label, , score]) => {
      const model = text(String(label)), metrics: Record<string, number> = {};
      if (!model || typeof score !== 'number') throw new Error('Invalid INVALSI score');
      for (const table of breakdowns) {
        const partRow = table!.data.find(r => short(String(r[0])) === short(model));
        if (!partRow) throw new Error('Missing INVALSI breakdown for ' + model);
        table!.headers.slice(1).forEach((h, i) => {
          const key = h.trim(), value = partRow[i + 1];
          if (value === '' || !Number.isFinite(Number(value))) throw new Error('Missing INVALSI part ' + key);
          (board.parts ??= {})[key] = key;
          metrics[key] = Number(value);
        });
      }
      return { model, score, open: type === '🟢', metrics };
    });
  },
};
export default board;
