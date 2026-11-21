// Read test and development character error rates, plus the mobile and THCHS30 evaluations.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/1709.05522';
const board: Leaderboard = {
  benchmark: 'aishell-1', static: 'paper', parts: {
  devCER: { name: 'Development', group: 'Split' },
  iosCER: { name: 'iOS character error rate', unit: '%', better: 'lower' },
  androidCER: { name: 'Android character error rate', unit: '%', better: 'lower' },
  thchs30CER: { name: 'THCHS-30 character error rate', unit: '%', better: 'lower' },
}, url: URL, feed: URL + ' (test-set CER, lower is better)', terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(URL));
    const t = tables.find(t => t[0]?.[2] === 'CER of test');
    if (!t || t.length < 4) throw new Error('AISHELL-1 results missing');
    const mobile = tables.find(t => t[0]?.join('|') === 'Model|CER of iOS|CER of Android');
    const thchs = tables.find(t => t[0]?.join('|') === 'Model|CER');
    return t.slice(1).map(([model,dev,test]) => {
      const phone = mobile?.find(r => r[0] === model);
      const external = thchs?.find(r => r[0] === model);
      const metrics: Record<string,number> = {devCER:parseFloat(dev)};
      if (phone) { metrics.iosCER = parseFloat(phone[1]); metrics.androidCER = parseFloat(phone[2]); }
      if (external) metrics.thchs30CER = parseFloat(external[1]);
      return {model, score:parseFloat(test), setting:'supervised; AISHELL-1 test', harness:'Kaldi', metrics};
    });
  },
};
export default board;
