// Dutch CoLA tests grammatical acceptability of Dutch sentences.
// The headline is EuroEval's Matthews correlation coefficient, in percentage points.
// This importer reads the current Dutch all-models CSV bundle published by EuroEval.
import type {Leaderboard, LeaderboardRow} from './types.ts';
import {fetchText, parseCsv} from '../lib/util.ts';
import {checked} from '../lib/boards/arxiv-span-tables.ts';

const PAGE = 'https://euroeval.com/datasets/dutch';
const board: Leaderboard = {benchmark: 'dutch-cola', url: PAGE, feed: PAGE, terms: 'EuroEval public leaderboard. https://euroeval.com/faq/', async fetch() {
  const page = await fetchText(PAGE);
  const assets = [...page.matchAll(/(?:src|href)="\/assets\/([^"?]+\.js)"/g)].map(m => m[1]);
  const candidates = [...new Set(assets)].filter(x => x.startsWith('index-'));
  let body = '';
  for (const asset of candidates) {
    const t = await fetchText(`https://euroeval.com/assets/${asset}`);
    const chunk = t.match(/dutch_all_models-[A-Za-z0-9_-]+\.js/);
    if (chunk) {
      const csv = await fetchText(`https://euroeval.com/assets/${chunk[0]}`);
      if (csv.includes('dutch_cola') && csv.includes('Rank,Model')) { body = csv; break; }
    }
  }
  if (!body) throw new Error('EuroEval Dutch CSV bundle missing');
  const source = body.match(/var e=`([\s\S]*?)`;export/)?.[1];
  if (!source) throw new Error('EuroEval Dutch CSV payload missing');
  const csv = source.slice(source.indexOf('Rank,Model'));
  const rows = parseCsv(csv);
  const metricKey = Object.keys(rows[0] ?? {}).find(k => k.includes('dutch_cola'));
  if (!metricKey) throw new Error('EuroEval Dutch CoLA column missing');
  const result: LeaderboardRow[] = [];
  for (const row of rows) {
    const model = row.Model?.replace(/<[^>]+>/g, '').trim();
    const value = row[metricKey]?.match(/^(-?\d+(?:\.\d+)?)\s*±\s*\d+(?:\.\d+)?/);
    if (model && value) result.push({model, score: Number(value[1]), metrics: {macroF1: Number(row[metricKey].split('/')[1]?.match(/\d+(?:\.\d+)/)?.[0] ?? 0)}});
  }
  return checked(result, 2);
}};
export default board;
