// P3B3 measures European Portuguese usage on a 0 to 100 scale. Table 2 reports the primary LLM judge and two classifiers under three prompts.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2606.16753v1";
const board: Leaderboard = {
  benchmark: "p3b3", static: 'paper',
  url: "https://arxiv.org/pdf/2606.16753#page=4",
  feed,
  terms: "Table 2 separates three prompt settings and three metrics. Higher favors European usage. The paper lists CC BY 4.0. arXiv allows HTML with a 15-second crawl delay.",
  aliases: { 'OLMo-3.1-32B': 'olmo-3-1-32b-instruct' },
  parts: { pv: 'PeroVaz', vid: 'PtBrVId' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[1]?.text === 'No-Prompt' && t[1]?.[1]?.text === 'PV');
    if (!table || table[1].map(c => c.text).join(',') !== 'Model,PV,VId,LLM,PV,VId,LLM,PV,VId,LLM' ||
      !table[0][2].text.startsWith('pt-BR') || !table[0][3].text.startsWith('pt-PT')) throw new Error('Missing Table 2 measures');
    let open = false;
    const rows = table.slice(2).flatMap(r => {
      const model = r[0].text;
      if (['Fully Open', 'Open Weight', 'Close Source'].includes(model)) { open = model !== 'Close Source'; return []; }
      if (r.length !== 10 || r.slice(1).some(c => !c.text || !Number.isFinite(Number(c.text)))) throw new Error('Incomplete P3B3 result for ' + model);
      return ['No-Prompt','pt-BR','pt-PT'].map((setting,i) => ({
        model, open, setting, score: Number(r[3+3*i].text), metrics: { pv: Number(r[1+3*i].text), vid: Number(r[2+3*i].text) },
      }));
    });
    if (rows.length < 60) throw new Error('Missing model or prompt results');
    return rows;
  },
};
export default board;
