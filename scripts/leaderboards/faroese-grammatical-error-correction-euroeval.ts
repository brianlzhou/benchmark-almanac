// EuroEval reports exact-match accuracy for correcting Faroese grammar. The Faroese generative leaderboard bundle contains test and validation rows. Read the test column and its interval.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://euroeval.com/leaderboards/faroese";
const board: Leaderboard = {
  benchmark: "faroese-grammatical-error-correction-euroeval",
  url: "https://euroeval.com/leaderboards/faroese",
  feed: FEED,
  terms: "Use the grammatical correction column. It has 248 test runs for 245 models and 183 validation runs. The source corpus restricts redistribution. https://mtd.setur.fo/resource/villugrunnur/ EuroEval robots.txt allows the leaderboard and bundle.",
  stats: {
    scored: { name: 'Scored examples', unit: 'count' },
    failures: { name: 'Failures', unit: 'count', better: 'lower' },
  },
  aliases: {"mistralai/Mistral-Small-3.2-24B-Instruct-2506": "mistral-small-3-2", "mistralai/Mistral-Small-3.1-24B-Instruct-2503": "mistral-small-3-1"},
  async fetch() {
    const html = await fetchText(FEED);
    const main = /<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(html)?.[1];
    if (!main) throw new Error('Missing EuroEval application bundle');
    const indexUrl = new URL(main, FEED);
    const index = await fetchText(indexUrl.href);
    const chunk = /(?:assets\/|\.\/)(faroese_generative-[^".]+\.js)/.exec(index)?.[1];
    if (!chunk) throw new Error('Missing EuroEval Faroese bundle');
    const bundle = await fetchText(new URL(chunk, indexUrl).href);
    const csv = bundle.match(/\n(Rank,Model,[\s\S]*?)\n`;export/)?.[1];
    if (!csv) throw new Error('Missing EuroEval CSV');
    const records = parseCsv(csv);
    const column = Object.keys(records[0]).find(k => text(k) === 'faroese_grammatical_correctness');
    if (!column) throw new Error('Missing Faroese grammatical correctness column');
    const rows = [];
    for (const r of records) {
      const label = text(r.Model);
      if (/\([^)]*\bval\)$/.test(label) || r[column] === '-') continue;
      const values = r[column].match(/^([\d.]+) ± ([\d.]+)$/);
      if (!values) throw new Error('Invalid Faroese exact match for ' + label);
      const score = Number(values[1]), margin = Number(values[2]);
      const setting = label.match(/ \(([^)]+)\)$/)?.[1];
      const params = Number(r.Parameters);
      rows.push({ model: label.replace(/ \([^)]+\)$/, ''), setting, score, low: score - margin, high: score + margin,
        open: r.Open === '✓', link: r.Model.match(/href='([^']+)'/)?.[1], params: Number.isFinite(params) && params > 0 ? params / 1e9 : undefined,
        metrics: { scored: Number(r.faroese_grammatical_correctness_scored), failures: Number(r.faroese_grammatical_correctness_failures) } });
    }
    if (rows.length < 248) throw new Error('Missing Faroese test runs: ' + rows.length);
    return rows;
  },
};
export default board;
