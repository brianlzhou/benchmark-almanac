// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// AfriBED tests speech recognition across speaker groups. Table II gives combined character error rate per language.
// Both combined columns cover the same speakers. Their reported standard deviations are kept separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml,PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { grid,paperTables,checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.26821';
const languages = ['Bemba','Nyanja'];
const columns = ['Native male','Non-native male','Male CER gap','Native female','Non-native female','Female CER gap',
  'Male','Female','Gender combined','Gender CER gap','Native','Non-native','Speaker-type combined','Speaker-type CER gap'];
const parts = Object.fromEntries(languages.flatMap(l=>[l,...columns.map(c=>l+': '+c)].map(name=>
  [name,{name,unit:'%' as const,better:'lower' as const}])));
const board: Leaderboard = {
  benchmark:'afribed',url:feed,feed,terms:PAPER_TERMS,static:'paper',parts,
  headline:'The headline averages the combined character error rates for Bemba and Nyanja.',
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t=>t[1]?.join('|') === 'Language|Model|NM|NNM|CER-gap|NF|NNF|CER-gap|M|F|C|CER-gap|N|NN|C|CER-gap');
    if (!t) throw new Error('Missing AfriBED results table');
    const models = new Map<string,LeaderboardRow>();
    for (const [language,model,...values] of t.slice(2)) {
      if (!languages.includes(language) || values.length !== columns.length) throw new Error('Unexpected AfriBED columns');
      const row = models.get(model) ?? {model,score:0,metrics:{},trials:3,setting:'Fine-tuned'};
      for (const [i,s] of values.entries()) {
        const pair = s.match(/^([\d.]+) \(([\d.]+)\)$/);
        if (!pair) throw new Error('Missing CER or standard deviation');
        const key = language+': '+columns[i];
        row.metrics![key] = Number(pair[1]);
        row.metrics![key+'Std'] = Number(pair[2]);
      }
      row.metrics![language] = row.metrics![language+': Gender combined'];
      if (row.metrics![language] !== row.metrics![language+': Speaker-type combined']) throw new Error('Combined scores disagree');
      models.set(model,row);
    }
    return checked([...models.values()].map(r=>({...r,score:(r.metrics!.Bemba+r.metrics!.Nyanja)/2})),4);
  },
};
export default board;
