// DiscoX: the official overall table combines both translation directions and all seven domains.
// Overall is the published sum of accuracy, fluency and appropriateness rubric points, not a percentage.
// The three rubric parts are metrics. Names without a specific model snapshot remain unlisted.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const PAGE = 'https://randomtutu.github.io/DiscoX/';
const board: Leaderboard = {
  benchmark: 'discox', parts: {
  academic: {name: 'Academic papers', group: 'Domain'},
  humanities: {name: 'Humanities', group: 'Domain'},
  socialSciences: {name: 'Social Sciences', group: 'Domain'},
  appliedDisciplines: {name: 'Applied Disciplines', group: 'Domain'},
  naturalSciences: {name: 'Natural Sciences', group: 'Domain'},
  nonAcademic: {name: 'Non-academic tasks', group: 'Domain'},
  domainSpecific: {name: 'Domain-Specific', group: 'Domain'},
  literatureArts: {name: 'Literature & Arts', group: 'Domain'},
  newsInformation: {name: 'News & Information', group: 'Domain'},
  zhEn: {name: 'zh→en', group: 'Direction'}, enZh: {name: 'en→zh', group: 'Direction'},
  accuracy: { name: 'Accuracy', group: 'Dimension' },
  fluency: { name: 'Fluency', group: 'Dimension' },
  appropriateness: { name: 'Appropriateness', group: 'Dimension' },
}, url: PAGE, feed: PAGE,
  terms: 'The authors publish this public GitHub Pages table, with attribution retained and no separate score reuse license stated.',
  async fetch() {
    const all = tables(await fetchText(PAGE));
    const directions = all.find(t => t[0]?.some(c => c.text === 'zh→en') && t[0]?.[0].text === 'Models');
    const domains = all.find(t => t[0]?.some(c => c.text === 'Academic Papers'));
    const table = all.find(t => t.length > 1 && t[0][2]?.text === 'Overall' && t[0][3]?.text === 'Accuracy');
    if (!table) throw new Error('DiscoX overall table missing');
    return table.slice(1).filter(r => r[1]?.text && num(r[2]?.text) !== undefined).map(r => {
      let model = r[1].text;
      const effort = model.match(/-(high|T)$/);
      const setting = effort ? (effort[1] === 'T' ? 'thinking' : 'high') : undefined;
      if (effort) model = model.slice(0, effort.index);
      if (/^(?:GPT-4o|Gemini-2\.5-(?:Pro|Flash-Lite)|Kimi-K2|DeepSeek-(?:R1|V3)|Claude-4|Qwen-3-235B|Doubao-1\.6)$/i.test(model)) model += ' (snapshot unspecified)';
      const metrics: Record<string, number> = {};
      const direction = directions?.find(row => row[0].text === r[1].text);
      const domain = domains?.find(row => row[0].text === r[1].text);
      const read = (cells: typeof r | undefined, keys: string[]) => {
        keys.forEach((key,i) => { const n = num(cells?.[i+1]?.text); if (key && n !== undefined) metrics[key] = n; });
      };
      read(direction, ['zhEn','zhEnAccuracy','zhEnFluency','zhEnAppropriateness','enZh','enZhAccuracy','enZhFluency','enZhAppropriateness','directionDifference']);
      read(domain, ['','academic','humanities','socialSciences','appliedDisciplines','naturalSciences','','nonAcademic','domainSpecific','literatureArts','newsInformation']);
      const open = r[6]?.text === '✓' ? true : r[6]?.text === '×' ? false : undefined;
      return { model, setting, open, score: num(r[2].text)!, metrics: {...metrics,
        accuracy: num(r[3].text)!, fluency: num(r[4].text)!, appropriateness: num(r[5].text)!,
      } };
    });
  },
};
export default board;
