// The Estonian AI Barometer rates models from anonymous votes. The Gradio configuration contains the default standings and 95% uncertainty intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const feed = "https://baromeeter.tartunlp.ai/config";

const board: Leaderboard = {
  benchmark: "estonian-ai-barometer",
  url: "https://baromeeter.tartunlp.ai",
  feed,
  terms: "The default score table has 55 visible rows. The terms discuss licensing conversation data but give no explicit score reuse license. https://baromeeter.tartunlp.ai The feed host publishes robots.txt at https://baromeeter.tartunlp.ai/robots.txt.",
  stats: { votes: { name: 'Votes', unit: 'count' } },
  async fetch() {
    type Component = { props: { elem_id?: string; value?: { headers: string[]; data: (string | number)[][] } } };
    const config = await fetchJson<{components: Component[]}>(feed);
    const table = config.components.find(c => c.props.elem_id === 'arena_leaderboard_dataframe')?.props.value;
    if (!table || table.data.length < 55 || table.headers.slice(1, 7).join('|') !== 'Mudel|Skoor|95% UI|Hääli|Looja|Litsents') throw new Error('Incomplete Gradio leaderboard');
    return table.data.map(cells => {
      const [, label, rating, uncertainty, votes, , license] = cells;
      const model = text(String(label)), score = Number(rating);
      const interval = String(uncertainty).match(/\+(\d+)\/-(\d+)/);
      if (!model || !Number.isFinite(score) || !interval) throw new Error('Invalid rating or interval');
      return { model, score, low: score - Number(interval[2]), high: score + Number(interval[1]), license: String(license),
        metrics: { votes: Number(votes) }, link: String(label).match(/href="([^"]+)"/)?.[1] };
    });
  },
};
export default board;
