// RelayForge ranks model runs by the IUK 1.6 two-tier composite. Its ranking CSV includes both tier percentages, their intervals and provisional flags.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/ryan-relayforge/iuk-v1.6-results/raw/main/IUK_v1.6_ranking_table.csv";

const board: Leaderboard = {
  benchmark: "iuk-1-6",
  url: "https://www.relayforge.tools/dawes/#v16-refresh",
  feed,
  terms: "RelayForge licenses its aggregate results under CC BY 4.0 with attribution. https://www.relayforge.tools/dawes/ Hugging Face allows the file in robots.txt.",
  parts: { t1: 'T1', t3: 'T3' },
  async fetch() {
    const records = parseCsv(await fetchText(feed));
    const keys = ['Model', 'T1 %', 'T1 95% CI', 'T3 % (97)', 'T3 95% CI', 'T1+T3 composite', 'Flags'];
    if (records.length < 31 || keys.some(k => !(k in records[0]))) throw new Error('Missing IUK rankings or columns');
    return records.map(r => {
      const numeric = (k: string) => { if (!r[k] || !Number.isFinite(Number(r[k]))) throw new Error('Invalid IUK ' + k); return Number(r[k]); };
      const ci = (k: string) => { const m = r[k].match(/^([\d.]+)–([\d.]+)$/); if (!m) throw new Error('Invalid IUK interval'); return [Number(m[1]), Number(m[2])]; };
      const [t1Low, t1High] = ci('T1 95% CI'), [t3Low, t3High] = ci('T3 95% CI');
      return { model: r.Model, score: numeric('T1+T3 composite'), setting: r.Flags || undefined,
        metrics: { t1: numeric('T1 %'), t3: numeric('T3 % (97)'), t1Low, t1High, t3Low, t3High } };
    });
  },
};

export default board;
