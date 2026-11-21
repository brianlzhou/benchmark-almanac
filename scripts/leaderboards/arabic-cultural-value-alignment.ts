// ACVA tests alignment with Arabic cultural knowledge and values. The Open Arabic
// LLM Leaderboard v1 publishes its ACVA percentage separately for each model.
import type { Leaderboard } from './types.ts';
import source from './open-arabic-llm-leaderboard-v1.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const board: Leaderboard = {
  benchmark:'arabic-cultural-value-alignment', url:source.url, feed:source.feed, host:'Open Arabic LLM Leaderboard v1',
  terms:'The Open Arabic LLM Leaderboard publishes the ACVA column in its public Space. ' + source.url,
  async fetch() {
    const sourceRows = await source.fetch();
    const rows = sourceRows.map(({model,setting,license,params,metrics}) => {
      const score = metrics?.ACVA;
      if (typeof score !== 'number' || !Number.isFinite(score)) throw new Error('Missing ACVA percentage');
      return {model,score,setting:setting?.replace('; ', ', ').replace(' (RLHF, DPO, IFT, ...)',''),license,params};
    });
    return checked(rows,749);
  },
};
export default board;
