// The narrative probe rates game masters on a five-point scale. The project guide lists overall judge scores, dimensions and automatic checks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://raw.githubusercontent.com/Bobby-Gray/open-tabletop-gm/main/docs/LLM-GUIDE.md";

const board: Leaderboard = {
  benchmark: "open-tabletop-gm-narrative-probe-2",
  stats: { IRA: { name: 'Inter-rater agreement', unit: 'score' }, autoPass: { name: 'Automatic checks passed', unit: 'count', better: 'higher' }, autoWarn: { name: 'Automatic checks with warnings', unit: 'count', better: 'lower' }, autoFail: { name: 'Automatic checks failed', unit: 'count', better: 'lower' } },
  url: "https://github.com/Bobby-Gray/open-tabletop-gm/blob/main/docs/LLM-GUIDE.md#narrative-quality-probe-v2-april-2026",
  feed,
  terms: "The repository uses AGPL-3.0-or-later. The guide gives no separate license for model outputs. https://github.com/Bobby-Gray/open-tabletop-gm#license GitHub requests a one-second crawl delay.",
  parts: { Atm: 'Atm', NPC: 'NPC', GM: 'GM' },
  aliases: {
    "mistralai/ministral-8b-2512": "ministral-3-8b-instruct",
    "mistralai/mistral-large-2512": "mistral-large-3",
    "mistralai/mistral-small-3.2-24b-instruct": "mistral-small-3-2",
    "mistralai/mixtral-8x22b-instruct": "mixtral-8x22b",
    "nvidia/nemotron-3-super-120b-a12b": "nemotron-3-super",
  },
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === 'Model|Overall|Auto P/W/F|Atm|NPC|GM|IRA|Notes');
    if (!table || table.length < 38) throw new Error('Missing narrative probe results');
    return table.slice(1).map(([model, overall, auto, ...rest]) => {
      const metrics: Record<string, number> = {};
      for (const [i, k] of ['Atm', 'NPC', 'GM', 'IRA'].entries()) {
        if (!rest[i] || !Number.isFinite(Number(rest[i]))) throw new Error('Missing ' + k);
        metrics[k] = Number(rest[i]);
      }
      auto.split('/').forEach((s, i) => { if (/^\d+$/.test(s)) metrics[['autoPass', 'autoWarn', 'autoFail'][i]] = Number(s); });
      if (!overall || !Number.isFinite(Number(overall))) throw new Error('Invalid Overall');
      return { model, score: Number(overall), metrics };
    });
  },
};

export default board;
