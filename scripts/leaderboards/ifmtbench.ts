// IFMTBench: Table 1's IF_T column is the published item-count-weighted total IF_Score over all 7,344 items.
// Single/multiple-constraint IF and xCOMET scores are metrics, never separate leaderboard rows.
// These are static paper results and will not refresh with new models. The dataset is CC BY 4.0;
// that dataset license is not an automated-reading ban on the published paper's result table.
import type { Leaderboard } from './types.ts';
import { paperTables, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const FEED = 'https://arxiv.org/html/2605.28218';
const board: Leaderboard = {
  benchmark: 'ifmtbench', url: 'https://github.com/Tencent-Hunyuan/Hy-MT2', feed: FEED, terms: PAPER_TERMS,
  aliases: { 'gemma4 E2B': 'gemma-4-e2b-it', 'gemma4 E4B': 'gemma-4-e4b-it', 'gemma4 31B': 'gemma-4-31b-it' },
  async fetch() {
    const table = (await paperTables(FEED)).find(t => t[1]?.[1]?.text === 'S-IF' && t[1]?.[3]?.text === 'M-IF');
    if (!table || !table[1][5].text.replace(/\s/g, '').startsWith('IFT')) throw new Error('IFMTBench total column missing');
    const rows = table.slice(2).map(c => {
      if (c.length !== 9) throw new Error('IFMTBench table shape changed');
      return { model: c[0].text + (/^Gemini/i.test(c[0].text) ? ' (snapshot unspecified)' : ''), score: numberCell(c[5].text), metrics: {
        singleIF: numberCell(c[1].text), singleXComet: numberCell(c[2].text),
        multiIF: numberCell(c[3].text), multiXComet: numberCell(c[4].text),
      } };
    });
    if (rows.length < 15) throw new Error('IFMTBench model rows missing');
    return rows;
  },
};
export default board;
