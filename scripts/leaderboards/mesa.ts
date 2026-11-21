// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The MESA site reports success and language following for single-arm MESA and bimanual BiMESA.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://pairlab.github.io/MESA/';
const board: Leaderboard = {
  benchmark: 'mesa', feed, url: feed,
  terms: 'The authors publish the tables on their project site. https://pairlab.github.io/MESA/',
  headline: 'The headline averages the published single-arm MESA and bimanual BiMESA success rates.',
  aliases: { 'π0': 'pi0', 'π0.5': 'pi0-5', FAST: 'pi0-fast' },
  async fetch() {
    const html = (await fetchText(feed)).replaceAll('&pi;', 'π').replaceAll('&ndash;', '–');
    const sections = [...html.matchAll(/(<table class="results-table">[\s\S]*?<\/table>)\s*<\/div>\s*<p class="table-caption"><strong>([^<]+)/g)];
    function scores(label: string) {
      const match = sections.find(m => m[2] === label);
      if (!match) throw new Error('Missing ' + label);
      return tables(match[1])[0].map(row => row.map(cell => cell.text));
    }
    const success = scores('Success rates (%)');
    const following = scores('Language following rate (%)');
    if (success[0].join('|') !== following[0].join('|') || success[0][0] !== 'Setting') throw new Error('Inconsistent model columns');
    const parts: NonNullable<Leaderboard['parts']> = {};
    const keys = success.slice(1).map(row => row[0]);
    if (keys.length !== 12 || !keys.includes('MESA Avg.') || !keys.includes('BiMESA Avg.')) throw new Error('Missing suite averages');
    const rows = success[0].slice(1).flatMap((model, i) => {
      const metrics: Record<string, number> = {};
      for (const [j, label] of keys.entries()) {
        if (following[j+1][0] !== label) throw new Error('Mismatched settings');
        const value = success[j+1][i+1];
        if (value === '–') return [];
        const key = label.replace(' Avg.', 'Avg');
        parts[key] = label;
        metrics[key] = numberCell(value);
        metrics[key+'LanguageFollowing'] = numberCell(following[j+1][i+1]);
      }
      return [{ model, score: (metrics.MESAAvg + metrics.BiMESAAvg)/2, metrics }];
    });
    board.parts = parts;
    return checked(rows,6);
  },
};
export default board;
