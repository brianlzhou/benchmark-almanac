// SWT-Bench (ETH Zurich SRI Lab and LogicStar). swtbench.com is a static page with two leaderboard tables:
// SWT-Bench Lite (#leaderboard-table, shown by default) and Verified (#verified-leaderboard-table). Each row
// is tagged data-mode "unittest" (Unit Test Mode, checked by default) or "reproduction" (Script Mode), and
// its first cell names the agent with the model in <small>. The importer reads the default view, Lite in
// both Unit Test and Script modes. Verified is a different task set and is excluded.
// S (success rate, 0 to 100) is the score, the agent is the harness and the date is kept.
// ΔC, the mean change coverage of the generated tests (0 to 100), is kept as `coverageDelta`.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text } from '../lib/html.ts';

const URL = 'https://swtbench.com/';

const board: Leaderboard = {
  benchmark: 'swt-bench',
  url: URL,
  feed: `${URL} (default Lite table, Unit Test and Script modes, S)`,
  terms: 'Static public page; the site content is CC BY-SA 4.0 and robots.txt is absent.',
  aliases: {
    // Mistral Large 2 is the July 2024 release (the November update is Mistral Large 24.11)
    'Mistral Large 2': 'mistral-large-2-jul-2024',
  },
  async fetch() {
    const html = await fetchText(URL);
    const boards=[...html.matchAll(/<table id="((?:verified-)?leaderboard-table)"[\s\S]*?<\/table>/g)];
    if(boards.length!==2)throw new Error('Expected Lite and Verified tables');
    const rows:LeaderboardRow[]=[];
    for(const b of boards){if(b[1]!=='leaderboard-table')continue;const table=b[0];
    for (const tr of table.matchAll(/<tr data-mode="(unittest|reproduction)">([\s\S]*?)<\/tr>/g)) {
      const cells = [...tr[2].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
      const model = text(cells[0]?.match(/<small>([\s\S]*?)<\/small>/)?.[1] ?? '');
      const agent = text((cells[0] ?? '').replace(/<small>[\s\S]*?<\/small>|<sup>[\s\S]*?<\/sup>/g, '')).replace(/^[^\w(]+/u, '').trim();
      const score = num(text(cells[2] ?? ''));
      const date = text(cells[4] ?? '');
      const coverage = num(text(cells[3] ?? ''));
      if (!model || score === undefined) continue;
      // "Cl. Sonnet 3.5, CI setup": "Cl." abbreviates Claude, and a setup note follows the comma.
      // "GPT-4 + BM25": the retriever joins the harness.
      let [name, note] = model.split(/,\s*/, 2);
      name = name.replace(/^Cl\.\s*/, 'Claude ');
      const plus = name.match(/^(.*?)\s*\+\s*(.+)$/);
      if (plus && /^BM25$/i.test(plus[2])) name = plus[1];
      else if (plus) name += ' [combined system]';
      const harness = [agent, plus && /^BM25$/i.test(plus[2]) ? plus[2] : undefined, note].filter(Boolean).join(', ');
      rows.push({
        model: name,
        score,
        setting:tr[1]==='unittest'?'Unit Test Mode':'Script Mode',
        harness: harness || undefined,
        date: /^\d{4}-\d\d-\d\d$/.test(date) ? date : undefined,
        ...(coverage !== undefined ? { metrics: { coverageDelta: coverage } } : {}),
      });
    }
    }
    return rows;
  },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
