// Voice Arena ranks US English dictation tools by zero edit rate. Its active CSV in the page bundle reports clean drafts and edit rates for each filter.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://voicearena.com/dictation-bench";

const board: Leaderboard = {
  parts: {
    Difficulty_Easy: { name: 'Easy', group: 'Difficulty' },
    Difficulty_Medium: { name: 'Medium', group: 'Difficulty' },
    Difficulty_Hard: { name: 'Hard', group: 'Difficulty' },
    Length_Micro: { name: 'Micro', group: 'Length' },
    Length_Short: { name: 'Short', group: 'Length' },
    Length_Medium: { name: 'Medium', group: 'Length' },
    Length_Long: { name: 'Long', group: 'Length' },
    'Domain_AI prompt': { name: 'AI prompt', group: 'Domain' },
    Domain_Code: { name: 'Code', group: 'Domain' },
    'Domain_Docs / notes': { name: 'Docs / notes', group: 'Domain' },
    Domain_Email: { name: 'Email', group: 'Domain' },
    'Domain_Personal messaging': { name: 'Personal messaging', group: 'Domain' },
    'Domain_Work chat': { name: 'Work chat', group: 'Domain' },
    'Domain_Long form': { name: 'Long form', group: 'Domain' },
    Split_public: { name: 'Public', group: 'Split' },
    Split_private: { name: 'Private', group: 'Split' },
  },
  stats: { amend: { name: 'Amendment rate', unit: '%', better: 'lower' }, cleanDrafts: { name: 'Clean drafts', unit: 'count', better: 'higher' } },
  benchmark: "dictation-bench-voicearena",
  url: "https://voicearena.com/dictation-bench",
  feed,
  terms: "Voice Arena links its site terms. https://voicearena.com/terms The site explicitly permits AI crawlers and citation.",
  async fetch() {
    const html = await fetchText(feed);
    const main = /<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/.exec(html)?.[1];
    if (!main) throw new Error('Missing application bundle');
    const indexUrl = new URL(main, feed);
    const index = await fetchText(indexUrl.href);
    const chunk = /assets\/(DictationBench-[^".]+\.js)/.exec(index)?.[1];
    if (!chunk) throw new Error('Missing dictation bundle');
    const source = await fetchText(new URL(chunk, indexUrl).href);
    const csv = source.match(/`(split,domain,length,difficulty,n_clips,rank,[^`]+)`/)?.[1];
    if (!csv) throw new Error('Missing dictation run CSV');
    const out = new Map<string,LeaderboardRow>();
    for (const r of parseCsv(csv)) {
      const dimensions = [r.split === 'overall' ? 'All' : r.split,r.domain,r.length,r.difficulty];
      const indices = dimensions.flatMap((v,i) => v === 'All' ? [] : [i]);
      if (indices.length > 1) continue;
      if (!r.harness || !r.tool_id || !r.zer_pct || !Number.isFinite(Number(r.zer_pct))) throw new Error('Incomplete dictation score');
      if (!indices.length) {
        out.set(r.tool_id,{ model:r.harness,score:Number(r.zer_pct),metrics:{amend:Number(r.amend_pct),cleanDrafts:Number(r.clean_drafts)} });
      } else {
        const i = indices[0], group = ['Split','Domain','Length','Difficulty'][i], name = dimensions[i];
        const key = group + '_' + name;
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
