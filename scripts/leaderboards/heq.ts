// HeQ tests extractive question answering in Hebrew. The Hebrew LLM Leaderboard reports QA TLNLS as a percentage.
// The visible Gradio table selects the entries. Its detailed table distinguishes evaluation precision for repeated checkpoints.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const feed = "https://hebrew-llm-leaderboard-leaderboard.hf.space/config";
interface Table { headers: string[]; data: (string | number | boolean | null)[][] }

const board: Leaderboard = {
  benchmark: "heq",
  url: "https://huggingface.co/spaces/hebrew-llm-leaderboard/leaderboard",
  feed,
  terms: "Use the QA TLNLS (HeQ) column. The Space declares Apache 2.0 for its code. The public table supplies scores without a separate results license. https://huggingface.co/spaces/hebrew-llm-leaderboard/leaderboard Both hosts permit crawling.",
  async fetch() {
    const config = await fetchJson<{components: {type:string;props:{value?: Table}}[]}>(feed);
    const tables = config.components.filter(c => c.type === 'dataframe').map(c => c.props.value).filter((t): t is Table => !!t?.headers.includes('QA TLNLS (HeQ)'));
    const visible = tables.find(t => !t.headers.includes('Precision')), full = tables.find(t => t.headers.includes('Precision'));
    if (!visible || !full) throw new Error('Missing Hebrew leaderboard tables');
    const field = (name: string) => {
      const i = full.headers.indexOf(name);
      if (i < 0) throw new Error('Missing column ' + name);
      return i;
    };
    const id = field('model_name_for_query'), score = field('QA TLNLS (HeQ)'), precision = field('Precision'), size = field('#Params (B)'), license = field('Hub License');
    const selected = new Set(visible.data.map(r => r[visible.headers.indexOf('model_name_for_query')]));
    const rows = full.data.filter(r => selected.has(r[id])).map(r => {
      if (typeof r[id] !== 'string' || typeof r[score] !== 'number') throw new Error('Incomplete HeQ result');
      return { model: String(r[id]), score: Number(r[score]), setting: String(r[precision]), params: Number(r[size]) || undefined,
        license: typeof r[license] === 'string' ? String(r[license]) : undefined };
    });
    if (rows.length < 203 || rows.length !== visible.data.length) throw new Error('Incomplete HeQ configurations');
    return rows;
  },
};
export default board;
