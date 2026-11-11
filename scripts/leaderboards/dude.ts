// DUDE: the paper’s main model comparison gives whole-test ANLS on the 0 to 100 scale.
// Calibration error and selective-risk area remain secondary metrics.
// Live challenge submissions are added without losing the static paper baselines.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

import { rrcPage } from '../lib/boards/rrc.ts';
const RRC = 'https://rrc.cvc.uab.es/?ch=23&com=evaluation&task=1';
const FEED = "https://arxiv.org/html/2305.08455";
const board: Leaderboard = {
  benchmark: "dude",
  url: RRC,
  feed: `${RRC} + ${FEED}`,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const t=tables(await fetchText(FEED)).find(t=>t[0]?.[0]?.text==='Model' && t[0]?.some(c=>/^ANLS/.test(c.text)) && t[0]?.some(c=>/^ECE/.test(c.text)));
    if(!t)throw new Error('DUDE result table missing');
    const rows: LeaderboardRow[] = t.slice(1).filter(r=>r.length===4 && num(r[1].text)!==undefined && !/human/i.test(r[0].text)).map(r=>({model:r[0].text,score:num(r[1].text)!,metrics:{ece:num(r[2].text)!,aurc:num(r[3].text)!}}));
    const live = tables(await rrcPage(RRC)).find(t => t.some(r => r.some(c => c.text === 'Method') && r.some(c => c.text === 'ANLS')));
    if (!live) throw new Error('DUDE live challenge table missing');
    const index = live.findIndex(r => r.some(c => c.text === 'Method'));
    const head = live[index].map(c => c.text);
    for (const [i, r] of live.slice(index + 1).entries()) {
      const model = r[head.indexOf('Method')]?.text, value = num(r[head.indexOf('ANLS')]?.text);
      if (!model || /human/i.test(model) || value === undefined) continue;
      const metrics: Record<string, number> = {};
      for (let c = head.indexOf('ANLS') + 1; c < head.length; c++) {
        const v = num(r[c]?.text);
        if (v !== undefined) metrics[head[c]] = v;
      }
      rows.push({model: /^\d+$/.test(model) ? `RRC method ${model}` : model, score: value * 100,
        date: r[head.indexOf('Date')]?.text, setting: `RRC Task 1 submission ${i + 1}`, metrics});
    }
    return rows;
  },
};

// The shared resolver otherwise guesses the newest snapshot for an undated family name.
// Preserve these board labels as unlisted entries until the source identifies a snapshot.
const readRows = board.fetch;
board.fetch = async () => (await readRows()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, '').replace(/[ _]/g, '-');
  const ambiguous = /^(?:gpt-4o|gpt-4|gpt-4-turbo|gpt-3[.-]5-turbo|claude-3[.-]5-sonnet|claude-sonnet-3[.-]5|deepseek-v3|deepseek-r1|gemini-(?:1[.-]5|2[.-]0|2[.-]5)-(?:pro|flash)(?:-preview|-exp|-thinking|-thinking-exp)?)$/i.test(name);
  return ambiguous ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});

export default board;
