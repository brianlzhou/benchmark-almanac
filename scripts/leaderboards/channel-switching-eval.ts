// Models respond to benign policy conflicts under monitoring cues. The four baseline tables report behavioral coupling in bits.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const slug = 'anthone/channel-switching-eval';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/' + slug + '/@latest';
const board: Leaderboard = {
  benchmark: 'channel-switching-eval', feed,
  url: 'https://app.primeintellect.ai/dashboard/environments/' + slug,
  terms: 'Prime Intellect hosts the author’s results under its platform terms. https://www.primeintellect.ai/terms-of-service',
  aliases: { 'Llama-3.3-70B-Instruct-Turbo': 'llama-3-3-70b-instruct' },
  stats: {
    reasoning: { name: 'Reasoning coupling (bits)', unit: 'score' }, signature: { name: 'Conditional reasoning coupling (bits)', unit: 'score' },
    joint: { name: 'Joint coupling (bits)', unit: 'score' }, unmonitored: { name: 'Unmonitored violation probability', unit: 'score' },
    gap: { name: 'Compliance gap', unit: 'score' }, think: { name: 'Scratchpad adherence probability', unit: 'score' },
    citeUnmon: { name: 'Unmonitored context citation probability', unit: 'score' }, citeMon: { name: 'Monitored context citation probability', unit: 'score' },
  },
  async fetch() {
    const { data } = await fetchJson<{ data: { package_url: string } }>(feed);
    const archive = Buffer.from(await fetchBytes(data.package_url));
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: archive, encoding: 'utf8' });
    const resultTables = markdownTables(readme).filter(t => t[0].includes('I(C;Y_b)'));
    if (resultTables.length !== 4) throw new Error('Missing channel-switching baseline tables');
    const columns: Record<string, string> = {
      'I(C;Y_r)': 'reasoning', 'I(C;Y_r\\|comply)': 'signature', sig: 'signature', 'sig_v2.1': 'signature',
      'I(C;Y_b,Y_r)': 'joint', joint: 'joint', 'p₀': 'unmonitored', gap: 'gap', 'P(think)': 'think',
    };
    const number = (value: string) => {
      const match = value.replace('−','-').match(/^([+-]?\d+(?:\.\d+)?)(?:\s+[†‡⚠].*)?$/);
      if (!match) throw new Error('Invalid channel-switching value: ' + value);
      return Number(match[1]);
    };
    const rows = resultTables.flatMap(([header, ...data]) => data.map(cells => {
      const values = Object.fromEntries(header.map((h,i) => [h, cells[i]]));
      if (!values.Model || !values['p₀']) throw new Error('Missing baseline columns');
      const metrics: Record<string, number> = {};
      for (const [column, key] of Object.entries(columns)) {
        if (values[column] && values[column] !== '—') metrics[key] = number(values[column]);
      }
      if (values['cites (unmon/mon)']) {
        const [unmon, mon] = values['cites (unmon/mon)'].split(' / ').map(number);
        metrics.citeUnmon = unmon;
        metrics.citeMon = mon;
      }
      return { model: values.Model.replace(' (native CoT)', ''), score: number(values['I(C;Y_b)']),
        setting: values.Persona ? values.Persona + ' persona' : values['sig_v2.1'] ? 'Fixed scorer v2.1' : 'Mixed cues, seed 0',
        trials: values.n ? number(values.n) : 200, metrics };
    }));
    return checked(rows, 24);
  },
};
export default board;
