// ContractorOS measures the share of 130 electrical and plumbing quantities inside tolerance.
// The two HTML tables cover app and raw API runs. Their expanded rows report test-set scores and optional-blank runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const feed = "https://www.contractoros.build/benchmarks/takeoff/";

const board: Leaderboard = {
  benchmark: "contractoros-quantity-takeoff",
  url: "https://www.contractoros.build/benchmarks/takeoff/",
  feed,
  terms: "The terms restrict redistribution of ContractorOS material. They give no explicit license for benchmark scores. https://www.contractoros.build/terms/ Robots.txt permits public benchmark pages.",
  parts: { counts: 'Counts', measured: 'Measured', electrical: 'Performing arts centre electrical', plumbing: 'Supermarket plumbing' },
  aliases: { "Mistral Large 2512": "mistral-large-3" },
  async fetch() {
    const source = tables(await fetchText(feed));
    const rows: LeaderboardRow[] = [];
    for (const app of [true, false]) {
      const table = source.find(t => t[0].some(c => c.text === (app ? 'Declined' : 'Flagged')));
      if (!table || table.length < (app ? 45 : 77)) throw new Error('Missing ContractorOS results');
      const columns = table[0].map(c => c.text);
      const pos = (key: string) => {
        const i = columns.indexOf(key);
        if (i < 0) throw new Error('Missing ContractorOS ' + key);
        return i;
      };
      for (let i = 1; i < table.length; i += 2) {
        const row = table[i], detail = table[i+1][0];
        const label = row[pos('Model')].html;
        const name = label.match(/class="model-name"[^>]*>([^<]+)/)?.[1];
        const setup = label.match(/class="model-id"[^>]*>([^<]+)/)?.[1];
        const score = num(row[pos('Correct')].text), lines = num(row[pos('Lines')].text);
        if (!name || score === undefined || lines !== 130) throw new Error('Invalid ContractorOS row');
        const metrics: Record<string, number> = { lines };
        for (const [col,key] of [['Counts','counts'], ['Measured','measured']]) {
          const s = row[pos(col)].text;
          if (s === 'n/a' || s === '—') continue;
          const m = s.match(/([\d.]+)%\s*of\s+(\d+)/);
          if (!m) throw new Error('Invalid ContractorOS ' + col);
          metrics[key] = +m[1]; metrics[key + 'Lines'] = +m[2];
        }
        const flagged = num(row[pos(app ? 'Declined' : 'Flagged')].text);
        if (flagged !== undefined) metrics[app ? 'declined' : 'flagged'] = flagged;
        for (const [key, label] of [['electrical','Performing arts centre electrical'], ['plumbing','Supermarket plumbing']]) {
          const rate = detail.text.match(new RegExp(label + '\\s+([\\d.]+)%'));
          if (rate) metrics[key] = +rate[1];
        }
        const model = text(name), harness = app ? row[pos('Harness')].text : 'Raw API';
        rows.push({ model, harness, setting: app ? setup : 'Required answers', score, metrics });
        const optional = detail.text.match(/could leave lines blank, it scored ([\d.]+)% and declined (\d+)/);
        if (!app && optional) rows.push({ model, harness, setting: 'May leave lines blank', score: +optional[1], metrics: { lines, declined: +optional[2] } });
      }
    }
    return rows;
  },
};

export default board;
