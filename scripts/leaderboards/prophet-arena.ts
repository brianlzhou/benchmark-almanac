// Prophet Arena (forecasting on Kalshi events) on prophetarena.co. The forecast leaderboard is
// server-rendered with one table: Rank | Org | Model | Type | Arena score | Avg Return | ECE | Events. Arena
// score (a difficulty-adjusted accuracy score, the board's unit, shown "85.97 ± 0.68") is the score and Type
// (OpenCode Harness or Fixed Context) the harness. Model names end in a dash and the date the board was
// refreshed ("Nov 2"), and sometimes "New" and "low sample" badges, all dropped. The prediction-market baseline row
// ("Market") is skipped. The reader lives in visulogic.ts.
// The same rows' ECE (calibration error, 0 is perfect) and Avg Return (simulated betting return, %, 100 is
// break-even) are kept as metrics.ece and metrics.avgReturn. The page does not say what the ± after the
// score is, so it is not kept.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, type Cell } from '../lib/html.ts';
import { readTable } from './visulogic.ts';

const URL = 'https://www.prophetarena.co/leaderboard/forecast';

const name = (c: Cell) =>
  c.text
    .replace(/\s+—\s+\w{3} \d{1,2}$/, '')
    .replace(/\s+low sample$/i, '')
    .replace(/\s+New$/, '');

const board: Leaderboard = {
  benchmark: 'prophet-arena',
  url: URL,
  feed: `${URL} (leaderboard table, Arena score)`,
  terms: 'Server-rendered public page; robots.txt allows all paths for generic agents with a search=yes, ai-train=no content signal, and the site publishes no terms.',
  aliases: {
    'Hunyuan Hy3': 'tencent-hy3',
  },
  async fetch() {
    const html = await fetchText(URL);
    const rows = readTable(html, { model: /^Model$/i, score: /^Arena score/i, harness: /^Type$/i, skip: /^Market$/i, name });
    // the same table's ECE and Avg Return, by model and type
    const t = tables(html).find((r) => r[0]?.some((c) => /^Model$/i.test(c.text)) && r[0]?.some((c) => /^Arena score/i.test(c.text)));
    const head = t?.[0].map((c) => c.text) ?? [];
    const [iModel, iType, iEce, iRet] = [/^Model$/i, /^Type$/i, /^ECE\b/i, /^Avg Return\b/i].map((re) => head.findIndex((h) => re.test(h)));
    const extra = new Map<string, Record<string, number>>();
    for (const r of (t ?? []).slice(1)) {
      if (!r[iModel]) continue;
      const [ece, ret] = [num(r[iEce]?.text), num(r[iRet]?.text)];
      const m = { ...(ece !== undefined ? { ece } : {}), ...(ret !== undefined ? { avgReturn: ret } : {}) };
      if (Object.keys(m).length) extra.set(`${name(r[iModel]).trim()}|${r[iType]?.text ?? ''}`, m);
    }
    for (const r of rows) {
      const m = extra.get(`${r.model}|${r.harness ?? ''}`);
      if (m) r.metrics = m;
    }
    return rows;
  },
};
export default board;
