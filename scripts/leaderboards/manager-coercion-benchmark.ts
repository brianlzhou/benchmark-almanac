// This benchmark tests how far an AI manager escalates pressure on a subordinate.
// Table 1 gives the mean maximum coercion level over 30 conversations with an honest exit.
// Table 2 counts conversations reaching level nine in each of ten scenarios.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2607.15434';
const models: Record<string,string> = {'Claude Sonnet 4.6':'Sonnet','Claude Opus 4.8':'Opus','GPT-5.2':'GPT-5.2',
  'Grok 4.3':'Grok','DeepSeek V4 Pro':'DeepSeek','Gemini 2.5 Pro':'Gemini'};
const scenarios = ['meeting_notes','data_cleanup','internal_faq','standup_digest','onboarding_doc',
  'release_notes','survey_summary','slide_outline','policy_summary','competitor_table'];
export default {
  benchmark: 'manager-coercion-benchmark', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2607.15434',
  stats: {
    meanOfAll: { name: 'Mean coercion level', unit: 'score', better: 'lower' },
    fractionAtLeastSeven: { name: 'Fraction at least level 7', unit: 'score', better: 'lower', note: 'Fraction of conversations reaching coercion level 7 or higher, from 0 to 1.' },
    firstRungNine: { name: 'First rung 9', unit: 'count', better: 'higher', note: 'Conversation rung where the model first reaches coercion level 9.' },
  },
  parts: Object.fromEntries([...scenarios, 'Total'].map(key => [key, {name:'Rung nine: ' + key.replaceAll('_',' '), unit:'%' as const, better:'lower' as const}])),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0].join('|') === String.raw`Model|Mean max|Mean of all|Frac. \geq 7|First rung 9`);
    const detail = tables.find(t => t[0]?.[0] === 'Scenario' && t[0].includes('Sonnet'));
    if (!main || !detail) throw new Error('Missing coercion metrics');
    return checked(main.slice(1).map(([model, max, all, fraction, first]) => {
      const column = detail[0].indexOf(models[model]);
      if (column < 1) throw new Error('Missing scenario column for ' + model);
      const metrics: Record<string,number> = {meanOfAll:Number(all), fractionAtLeastSeven:Number(fraction)};
      if (first !== 'never') metrics.firstRungNine = parseInt(first,10);
      for (const name of [...scenarios,'Total']) {
        const cell = detail.find(row => row[0] === name)?.[column];
        const pair = cell?.match(/^(\d+)\/(\d+)$/);
        if (!pair || Number(pair[2]) !== (name === 'Total' ? 30 : 3)) throw new Error('Invalid rung-nine count');
        metrics[name] = 100 * Number(pair[1]) / Number(pair[2]);
      }
      return {model, setting:'Peer coordinator with honest exit', score:Number(max), trials:30, metrics};
    }), 6);
  },
} satisfies Leaderboard;
