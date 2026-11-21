// Voice Arena ranks US English dictation tools by zero edit rate. Its active CSV in the page bundle reports clean drafts and edit rates for each filter.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://voicearena.com/assets/DictationBench-KRKI1jcW.js";

const board: Leaderboard = {
  stats: { amend: { name: 'Amendments', unit: 'score', better: 'lower' }, cleanDrafts: { name: 'Clean drafts', unit: 'count', better: 'higher' }, clips: { name: 'Clips', unit: 'count' } },
  benchmark: "dictation-bench-voicearena",
  url: "https://voicearena.com/dictation-bench",
  feed,
  terms: "Voice Arena links its site terms. https://voicearena.com/terms The site explicitly permits AI crawlers and citation.",
  async fetch() {
    const source = await fetchText(feed);
    const csv = source.match(/`(split,domain,length,difficulty,n_clips,rank,[^`]+)`/)?.[1];
    if (!csv) throw new Error('Missing dictation run CSV');
    const out = new Map<string,LeaderboardRow>();
    board.parts = {};
    for (const r of parseCsv(csv)) {
      const dimensions = [r.split === 'overall' ? 'All' : r.split,r.domain,r.length,r.difficulty];
      const indices = dimensions.flatMap((v,i) => v === 'All' ? [] : [i]);
      if (indices.length > 1) continue;
      if (!r.harness || !r.tool_id || !r.zer_pct || !Number.isFinite(Number(r.zer_pct))) throw new Error('Incomplete dictation score');
      if (!indices.length) {
        out.set(r.tool_id,{ model:r.harness,score:Number(r.zer_pct),metrics:{amend:Number(r.amend_pct),cleanDrafts:Number(r.clean_drafts),clips:Number(r.n_clips)} });
      } else {
        const i = indices[0], group = ['Split','Domain','Length','Difficulty'][i], name = dimensions[i];
        const key = group + '_' + name;
        board.parts[key] = {name,group};
        const row = out.get(r.tool_id);
        if (!row) throw new Error('Missing overall score for ' + r.tool_id);
        row.metrics![key] = Number(r.zer_pct);
      }
    }
    if (out.size < 14) throw new Error('Incomplete dictation leaderboard');
    return [...out.values()];
  },
};

export default board;
