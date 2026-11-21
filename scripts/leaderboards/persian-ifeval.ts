// MIZAN ranks Persian IFEval by strict instruction accuracy. Its JSON Lines file also reports prompt accuracy and strict and loose results by category.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/raw/main/leaderboard/boards_data/ifeval.jsonl";
const board: Leaderboard = {
  benchmark: 'persian-ifeval',
  url: "https://mcinext-mizan-llm-leaderboard.hf.space/",
  feed,
  terms: "Both hosts allow crawling. Multiply strict_instruction_accuracy by 100 for percent accuracy. The Space lists no license for its scores. https://huggingface.co/spaces/MCINext/mizan-llm-leaderboard/blob/main/README.md",
  aliases: {"Llama-3.2-1B-Instruct": "llama-3-2-1b", "Llama-3.2-3B-Instruct": "llama-3-2-3b", "Mistral-Small-3.1-24B-Instruct-2503": "mistral-small-3-1", "c4ai-command-r-plus": "command-r-plus"},
  async fetch() {
    const lines = (await fetchText(feed)).trim().split(/\r?\n/);
    if (lines.length < 45) throw new Error('Incomplete Persian IFEval standings');
    board.parts = {};
    return lines.map(line => {
      const r = JSON.parse(line), model = r['Model Name'], primary = r.strict_instruction_accuracy;
      if (!model || !Number.isFinite(primary)) throw new Error('Invalid strict instruction accuracy');
      const metrics: Record<string, number> = {};
      for (const [k, value] of Object.entries(r)) {
        if (k === 'strict_instruction_accuracy' || !/^(loose|strict)_/.test(k)) continue;
        if (typeof value !== 'number') throw new Error('Missing ' + k);
        metrics[k] = value * 100;
        if (k.endsWith('_category')) board.parts![k] = k.replace(/_category$/, '').replace(/_/g, ' ');
      }
      const params = Number(r.parameters_count);
      return { model, score: primary * 100, setting: r.thinking_method === '✔️' ? 'Thinking' : 'Non-thinking',
        open: r.source_type === 'Open-Source', params: Number.isFinite(params) ? params / 1e9 : undefined,
        link: /^https?:\/\//.test(r.model_url) ? r.model_url : undefined, metrics };
    });
  },
};
export default board;
