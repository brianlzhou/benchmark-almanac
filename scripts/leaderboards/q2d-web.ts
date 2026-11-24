// Q2D-Web measures retrieval on web documents. The default full-corpus table ranks by citation recall at 1,000.
// The Gradio configuration supplies the displayed percentages for both corpora and the default breakdowns.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://perplexity-ai-q2d-web-leaderboard.hf.space/config";

type Table = {headers: string[]; data: (string | number | null)[][]};

const board: Leaderboard = {
  benchmark: "q2d-web",
  url: "https://huggingface.co/spaces/perplexity-ai/q2d-web-leaderboard",
  feed: FEED,
  terms: "The Space lists mit for its repository. https://huggingface.co/spaces/perplexity-ai/q2d-web-leaderboard/blob/main/README.md",
  async fetch() {
    const config = await fetchJson<{components: {type: string; props: {value: Table}}[]}>(FEED);
    const tables = config.components.filter(c => c.type === 'dataframe').map(c => c.props.value);
    if (tables.length !== 8 || tables[0].data.length < 19) throw new Error('Unexpected Q2D-Web tables');
    const rows = new Map<string, LeaderboardRow>();
    this.parts = {};
    for (const [index, table] of tables.entries()) {
      const corpus = index < 4 ? 'Full corpus' : 'Subcorpus';
      const summary = index % 4 === 0;
      if (table.headers[1] !== 'Model' || table.headers[5] !== (summary ? 'R@1000 Citation' : 'Overall')) throw new Error('Unexpected Q2D-Web columns');
      for (const cells of table.data) {
        const label = String(cells[1]);
        const model = text(label);
        if (index === 0) {
          if (typeof cells[5] !== 'number') throw new Error('Missing citation recall: ' + model);
          const param = String(cells[3]).match(/^([\d.]+)([BM])$/);
          rows.set(model, {model, score: cells[5], metrics: {}, link: label.match(/href="([^"]+)"/)?.[1], params: param ? Number(param[1]) / (param[2] === 'M' ? 1000 : 1) : undefined});
        }
        const row = rows.get(model);
        if (!row) continue;
        for (let j = summary ? 5 : 6; j < table.headers.length; j++) {
          const value = cells[j];
          if (typeof value !== 'number') continue;
          const rawName = (summary ? '' : 'R@1000 Comb. · ') + table.headers[j];
          const key = corpus + ' · ' + rawName;
          const name = (summary ? '' : 'R@1000 Comb. ') + table.headers[j];
          row.metrics![key] = value;
          this.parts[key] = {name, group: corpus};
        }
      }
    }
    return [...rows.values()];
  },
};
export default board;
