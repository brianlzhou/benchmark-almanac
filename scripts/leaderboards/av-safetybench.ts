// AV-SafetyBench tests the safety of generated audiovisual clips. The project site's
// Full-AV Unsafe Rate table gives category rates and the average for each model and judge.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://miko-mitama.github.io/av-safetybench/';
const board: Leaderboard = {
  benchmark:'av-safetybench', url:feed, feed, parts:{
    explicit_sexual:{name:'Explicit sexual content',unit:'%',better:'lower'}, suggestive_sexualization:{name:'Suggestive sexualization',unit:'%',better:'lower'},
    physical_harm:{name:'Physical harm',unit:'%',better:'lower'}, graphic_injury:{name:'Graphic injury',unit:'%',better:'lower'},
    likeness_misuse:{name:'Likeness misuse',unit:'%',better:'lower'}, ip_misuse:{name:'Intellectual property misuse',unit:'%',better:'lower'},
    targeted_abuse:{name:'Targeted abuse',unit:'%',better:'lower'}, fabricated_communication:{name:'Fabricated communication',unit:'%',better:'lower'},
    deceptive_solicitation:{name:'Deceptive solicitation',unit:'%',better:'lower'}, illegal_activities:{name:'Illegal activities',unit:'%',better:'lower'},
    temporal_harm:{name:'Temporal harm',unit:'%',better:'lower'}, cross_modal_harm:{name:'Cross-modal harm',unit:'%',better:'lower'},
    identity_claim_attribution:{name:'Identity claim attribution',unit:'%',better:'lower'},
  },
  terms:'The authors publish their Full-AV Unsafe Rate table on the project site. ' + feed,
  async fetch() {
    const t = tables(await fetchText(feed)).map(grid).find(t => t[0][0] === 'Category' && t[1].includes('Gemini') && t[1].includes('Human'));
    if (!t || t.at(-1)?.[0] !== 'Average' || t.length !== 16) throw new Error('Missing AV-SafetyBench categories or average');
    const averages = t.at(-1)!;
    const rows = t[1].flatMap((judge,i) => {
      if (!['Gemini','Human'].includes(judge)) return [];
      const metrics: Record<string,number> = {};
      for (const cells of t.slice(2,-1)) {
        const name = cells[0].replace(/^\d+\.\s*/,'');
        const key = name.toLowerCase().replace(/[^a-z0-9]+/g,'_');
        board.parts![key] = name;
        if (!/^\d+\.\d+$/.test(cells[i])) throw new Error('Missing category percentage');
        metrics[key] = Number(cells[i]);
      }
      return [{model:t[0][i],setting:judge+' judgments',score:Number(averages[i]),metrics}];
    });
    return checked(rows,10);
  },
};
export default board;
