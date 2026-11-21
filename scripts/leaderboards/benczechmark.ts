// BenCzechMark ranks Czech-language models by Overall Duel Win Score. Its Space publishes category scores, submission dates and evaluation settings in the default table.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://czlc-benczechmark.hf.space/config";
interface Frame { headers: string[]; data: (string | number | boolean | null)[][] }
const metadata = ['Model', 'Submitted', 'Type', '# θ (B)', 'Precision', 'N-shot', 'ML', 'CHAT', 'FAM', 'Average ⬆️'];

const board: Leaderboard = {
  benchmark: "benczechmark",
  url: "https://huggingface.co/spaces/CZLC/BenCzechMark",
  feed: FEED,
  terms: "The Space does not state a license for the leaderboard results. https://huggingface.co/spaces/CZLC/BenCzechMark/blob/main/README.md",
  aliases: {"CohereLabs/c4ai-command-a-03-2025":"cohere-command-a","mistralai/Mistral-Large-Instruct-2411":"mistral-large-2-nov-2024","anex.sh/swiss-ai/Apertus-8B-Instruct-2509":"apertus-8b","allenai/OLMo-7B-Instruct-hf":"olmo-7b-instruct","meta-llama/Llama-3.1-405B-Instruct":"llama-3-1-405b"},
  async fetch() {
    const { components } = await fetchJson<{components: {type: string; props: {value: Frame}}[]}>(FEED);
    const frame = components.find(c => c.type === 'dataframe' && c.props.value.headers[0] === 'Model')?.props.value;
    if (!frame || frame.data.length < 79 || !metadata.every((k, i) => frame.headers[i] === k) || frame.headers.length < 17)
      throw new Error('Incomplete BenCzechMark overall table');
    const categories = frame.headers.slice(metadata.length);
    board.parts = Object.fromEntries(categories.map(k => [k, k]));
    return frame.data.map(row => {
      const [cell, date, , params, precision, shots, length, chat, multiturn, score] = row;
      const html = String(cell);
      const model = html.match(/title="([^"]+)"/)?.[1] || text(html);
      if (!model || typeof score !== 'number' || row.length !== frame.headers.length) throw new Error('Incomplete Czech evaluation');
      const metrics: Record<string, number> = {};
      for (const [i, k] of categories.entries()) {
        const v = row[metadata.length + i];
        if (typeof v === 'number') metrics[k] = v;
      }
      return { model, score, date: String(date), params: typeof params === 'number' ? params : undefined, metrics,
        setting: [precision, shots + '-shot', 'max input ' + length, chat && 'chat template', multiturn && 'multiturn'].filter(Boolean).join(', '),
        link: html.match(/href="([^"]+)"/)?.[1] };
    });
  },
};
export default board;
