// WorldState-Bench tests whether both video twins show the endings required by their rules.
// The authors lead with rule-only PairFollow and also headline rule+end PairStrict.
// Read both percentages and the four supporting measures from the main results table.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const url = "https://ivg-yanranzhang.github.io/StateWorldModel/#results";
const feed = url;

const board: Leaderboard = {
  benchmark: 'worldstate-bench', url, feed,
  terms: "The project states no separate terms for the scores. Its GitHub Pages host provides no applicable robots rules.",
  aliases: { 'Wan2.2 A14B': 'wan2-2-i2v-a14b' },
  harnesses: 'system',
  async fetch() {
    const page = await fetchText(feed);
    const table = tables(page.match(/<table id="results-table">[\s\S]*?<\/table>/)?.[0] ?? '')[0];
    if (table?.[0]?.map(c => c.text).join('|') !== 'Backend|A / Rule-only probe|B / Rule+end probe' ||
      table[1]?.map(c => c.text.replace(/\s/g,'')).join('|') !== 'EndFollow↑|PairFollow↑|TwinContrast↑|Strict↑|CntAbsent↑|PairStrict↑') {
      throw new Error('WorldState-Bench probe columns changed');
    }
    const rows = table.slice(2).filter(c => c[0]?.attrs.scope !== 'rowgroup').map(c => {
      if (c.length !== 7 || !c[0].text || c.slice(1).some(x => !/^\d+(\.\d+)?$/.test(x.text))) throw new Error('Invalid WorldState-Bench result');
      const [endFollow, pairFollow, twinContrast, strict, cntAbsent, pairStrict] = c.slice(1).map(x => Number(x.text));
      const wrapped = c[0].text === 'Stateful Harness Ours';
      return { model: wrapped ? 'MiniMax-H3' : c[0].text, harness: wrapped ? 'Stateful Harness' : undefined,
        score: pairFollow, metrics: { endFollow, twinContrast, strict, cntAbsent, pairStrict } };
    });
    if (rows.length < 12) throw new Error('Incomplete WorldState-Bench ranking');
    return rows;
  },
};
export default board;
