// MetroLLM ranks transit kiosk agents by composite score. Its HTML standings also report Tier-1 performance and reasoning settings.
import type { Leaderboard } from './types.ts';
import { tables, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://continker.ai/metrollm-bench";
const board: Leaderboard = {
  benchmark: 'metrollm-bench',
  url: "https://continker.ai/metrollm-bench",
  feed,
  terms: "The site's robots file allows crawling. Continker reserves rights on the leaderboard page. The repository uses Apache 2.0. https://continker.ai/metrollm-bench",
  parts: { tier1: 'Tier-1' },
  aliases: { 'GPT-5.4 full': 'gpt-5-4', 'Muse Glimmer 30B': 'muse-glimmer', 'Mistral Nemo 12B': 'mistral-nemo', 'Ministral 8B 2512': 'ministral-3-8b-instruct', 'Mistral Small 2603': 'mistral-small-4' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === '#|Model|Type|Composite|Tier-1');
    if (!table || table.length < 26) throw new Error('Missing MetroLLM standings');
    return table.slice(1).map(c => {
      const name = c[1].text.match(/^(.+?), (\w+) effort$/);
      const model = name?.[1] || c[1].text, score = num(c[3].text), tier1 = num(c[4].text);
      if (!model || score == null || tier1 == null) throw new Error('Missing MetroLLM result');
      return { model, setting: name?.[2], open: c[2].text !== 'proprietary', score, metrics: { tier1 } };
    });
  },
};
export default board;
