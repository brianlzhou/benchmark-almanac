// GS-QA2 evaluates geospatial questions involving vector and raster data. The board first ranks entity-name answers
// by parsed token F1 on attempted questions. Other answer families use accuracy on all questions.
import type { Leaderboard, BoardPart, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://huggingface.co/spaces/Zoe/GS-QA-Leaderboard';
const feed = url + '/raw/main/data/results.json';
type Result = { system_label: string; task: string; output_family: string; n: number; accuracy: number | null; parsed_f1: number | null; parsed_recall: number | null };
const parts: Record<string, BoardPart> = {};
const board: Leaderboard = {
  benchmark: 'gs-qa-2', url, feed, parts, harnesses: 'system',
  terms: 'The authors provide these leaderboard results for reuse. https://huggingface.co/spaces/Zoe/GS-QA-Leaderboard',
  async fetch() {
    const rows = new Map<string, LeaderboardRow>();
    for (const r of await fetchJson<Result[]>(feed)) {
      if (r.task !== 'ALL') continue;
      if (!['CHESS-PostGIS (Gemini)', 'Gemini RAG', 'Gemini Text-to-SQL'].includes(r.system_label)) throw new Error('Review new system ' + r.system_label);
      const row = rows.get(r.system_label) ?? { model: 'Gemini', harness: r.system_label, score: NaN, metrics: {} };
      const key = r.output_family;
      const value = key === 'entity_name' ? r.parsed_f1 : r.accuracy;
      if (value == null || !Number.isFinite(value) || value < 0 || value > 1 || key in row.metrics!) throw new Error('Invalid group ' + key);
      row.metrics![key] = 100 * value;
      row.metrics![key + 'Questions'] = r.n;
      parts[key] = { name: key.replaceAll('_', ' '), unit: '%' };
      if (key === 'entity_name') {
        row.score = value * 100;
        if (r.parsed_recall !== null) row.metrics!.parsedRecall = r.parsed_recall * 100;
      }
      rows.set(r.system_label, row);
    }
    for (const row of rows.values()) if (!('raster_overall' in row.metrics!) || Object.keys(row.metrics!).filter(k => k.endsWith('Questions')).length !== 12) throw new Error('Incomplete answer families');
    return checked([...rows.values()], 3);
  },
};
export default board;
