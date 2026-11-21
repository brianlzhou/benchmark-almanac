// AudioMC evaluates multi-turn spoken dialogue. The score is conversation pass rate averaged across ten languages.
// Tables A.2 and A.3 give primary-model instance and rubric scores. Table B.2 gives both for local models.
// Table 2 reports the dispersion across languages for the primary models using direct audio.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.04390';
const board: Leaderboard = {
  benchmark: 'omnilingua-audiomc', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2611.04390.',
  parts: { EN: 'English', ZH: 'Chinese', JA: 'Japanese', ES: 'Spanish', FR: 'French', RU: 'Russian', DE: 'German', IT: 'Italian', TH: 'Thai', VI: 'Vietnamese' },
  stats: { rubric: { name: 'Rubric success', unit: '%', better: 'higher' }, ENRubric: { name: 'English rubric success', unit: '%', better: 'higher' }, ZHRubric: { name: 'Chinese rubric success', unit: '%', better: 'higher' }, JARubric: { name: 'Japanese rubric success', unit: '%', better: 'higher' }, ESRubric: { name: 'Spanish rubric success', unit: '%', better: 'higher' }, FRRubric: { name: 'French rubric success', unit: '%', better: 'higher' }, RURubric: { name: 'Russian rubric success', unit: '%', better: 'higher' }, DERubric: { name: 'German rubric success', unit: '%', better: 'higher' }, ITRubric: { name: 'Italian rubric success', unit: '%', better: 'higher' }, THRubric: { name: 'Thai rubric success', unit: '%', better: 'higher' }, VIRubric: { name: 'Vietnamese rubric success', unit: '%', better: 'higher' }, range: { name: 'Language success range', unit: '%', note: 'Difference between the maximum and minimum language instance success rates, in percentage points.' } },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = paperTables(html).map(grid);
    const langs = Object.keys(board.parts!);
    const pair = tables.filter(t => t[0].join() === ['Model','Input','Avg.',...langs].join());
    const summary = tables.find(t => t[0].join() === ['Model',...langs,'Avg.','Std.','Range'].join());
    const local = tables.find(t => t[0][0] === 'Direct Audio' && t[1]?.join() === ['Model','Avg.',...langs].join());
    if (pair.length !== 2 || !summary || !local || pair[0].length !== pair[1].length) throw new Error('Missing AudioMC tables');
    const rows = [];
    let model = '';
    for (let i = 1; i < pair[0].length; i++) {
      const r = pair[0][i], rubric = pair[1][i];
      model = r[0] || model;
      if (r[0] !== rubric[0] || r[1] !== rubric[1]) throw new Error('Misaligned rubric table');
      const metrics: Record<string, number> = {rubric: numberCell(rubric[2])};
      langs.forEach((key,j) => { metrics[key] = numberCell(r[3+j]); metrics[key+'Rubric'] = numberCell(rubric[3+j]); });
      if (r[1] === 'Direct Audio') {
        const stats = summary.find(s => s[0] === model);
        if (!stats || stats[11] !== r[2]) throw new Error('AudioMC summary disagrees');
        metrics.std = numberCell(stats[12]);
        metrics.range = numberCell(stats[13]);
      }
      rows.push({ model, setting: r[1], score: numberCell(r[2]), metrics });
    }
    let setting = '';
    for (const r of local) {
      if (r[0] === r[1]) { setting = r[0]; continue; }
      if (r[0] === 'Model') continue;
      const metrics: Record<string, number> = {};
      const scores = r.slice(1).map(v => {
        const cells = v.split('/');
        if (cells.length !== 2) throw new Error('Invalid rubric/instance pair');
        return cells.map(numberCell);
      });
      metrics.rubric = scores[0][0];
      langs.forEach((key,i) => { [metrics[key+'Rubric'], metrics[key]] = scores[i+1]; });
      rows.push({ model: r[0], setting, score: scores[0][1], metrics });
    }
    return checked(rows, 38);
  },
};
export default board;
