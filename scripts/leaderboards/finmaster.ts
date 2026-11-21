// FinMaster tests financial workflows. The HTML table ranks models by Average.
// The table reports fractions, which this reader converts to percentages.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const url = "https://jianginsight.github.io/Finmaster_leaderboard/";
const feed = "https://jianginsight.github.io/Finmaster_leaderboard/";

const board: Leaderboard = {
  benchmark: 'finmaster', url, feed,
  terms: "The leaderboard page gives no separate reuse license. https://jianginsight.github.io/Finmaster_leaderboard/" ,
  aliases: { 'DeepSeek-V3-2503': 'deepseek-v3-mar-2025' },
  parts: { literacy: 'Financial Literacy', accounting: 'Accounting', auditing: 'Auditing', consulting: 'Consulting' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.[0]?.text.includes('Model'));
    const labels = ['Model','Rank','Average','Date','Financial Literacy','Accounting','Auditing','Consulting','Open-source','Reasoning','Link'];
    if (!table || table.length < 8 || labels.some((label, i) => table[0][i]?.text.replace('↕','').trim() !== label)) throw new Error('Incomplete FinMaster table');
    return table.slice(1).map(c => {
      const pct = (i: number) => {
        if (!/^\d+(\.\d+)?$/.test(c[i]?.text)) throw new Error('Invalid ' + labels[i]);
        return Number(c[i].text) * 100;
      };
      if (c.length !== labels.length || !c[0].text) throw new Error('Invalid FinMaster row');
      return { model: c[0].text, score: pct(2), setting: c[9].text, open: c[8].text === 'open-source',
        link: c[10].html.match(/href="([^"]+)"/)?.[1],
        metrics: { literacy: pct(4), accounting: pct(5), auditing: pct(6), consulting: pct(7) } };
    });
  },
};
export default board;
