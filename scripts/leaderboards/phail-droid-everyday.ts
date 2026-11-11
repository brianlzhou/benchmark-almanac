// PhAIL: DROID Everyday tasks (Positronic Robotics). phail.ai serves its leaderboard as one server-rendered
// HTML table: a model column and one column per benchmark, "DROID: Everyday tasks" (Reliability, % of task
// done, from an item-response model over 286 tasks) and "Pick and Place" (Reliability, % items placed).
// Each cell holds the value and a bootstrap margin; the value is the score. Models are robot policies; the
// short name in the model cell is kept. phail.ts reads the Pick and Place column through phailRows. The
// teleoperated reference row is skipped. With `margin` (on for this board), the cell's ± bootstrap margin
// becomes the interval bounds metrics.ciLow and ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

export const PHAIL_PAGE = 'https://phail.ai/';
export const PHAIL_TERMS = 'Server-rendered public page; phail.ai robots.txt (Cloudflare content-signal preamble) sets no signals and disallows nothing, and the site publishes no terms.';

/** Scores from the PhAIL home table column whose header starts with `column`; `margin` adds the ± as bounds. */
export async function phailRows(column: string, margin = false): Promise<LeaderboardRow[]> {
  const t = tables(await fetchText(PHAIL_PAGE)).find((rows) => rows[0]?.[0]?.text === 'Model');
  if (!t) throw new Error('PhAIL table not found');
  const col = t[0].findIndex((c) => c.text.startsWith(column));
  if (col < 0) throw new Error(`no "${column}" column: ${t[0].map((c) => c.text).join(' | ')}`);
  const rows: LeaderboardRow[] = [];
  for (const r of t.slice(1)) {
    // "π₀.₅" becomes "pi0.5": subscript digits to digits, then the Greek letter spelled out
    const name = text(r[0]?.html.match(/<span class="model-short-name">([\s\S]*?)<\/span>/)?.[1] ?? r[0]?.text ?? '')
      .normalize('NFKC')
      .replace(/π/g, 'pi');
    const score = num(text(r[col]?.html.match(/<span class="score-value">([\s\S]*?)<\/span>/)?.[1] ?? ''));
    if (!name || score === undefined || /teleop|human/i.test(r[0]?.text ?? '')) continue;
    const pm = margin ? num(text(r[col]?.html.match(/<span class="score-margin">([\s\S]*?)<\/span>/)?.[1] ?? '')) : undefined;
    rows.push({ model: name, score, ...(pm ? { metrics: { ciLow: Number((score - pm).toFixed(2)), ciHigh: Number((score + pm).toFixed(2)) } } : {}) });
  }
  if (!rows.length) throw new Error(`no PhAIL rows for ${column}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: 'phail-droid-everyday',
  url: `${PHAIL_PAGE}benchmark/droid`,
  feed: `${PHAIL_PAGE} (server-rendered table, "DROID: Everyday tasks" Reliability)`,
  terms: PHAIL_TERMS,
  aliases: {
    // the model page names the DROID run as GR00T N1.7 DROID
    'GR00T': 'gr00t-n1-7',
  },
  chart: {title:'Reliability vs. speed at 240 seconds',x:{key:'speed',label:'Speed',unit:'tasks/min',better:'higher'},y:{key:'score',label:'Reliability',unit:'%',better:'higher'}},
  async fetch() {
    const rows=await phailRows('DROID',true);
    const html=await fetchText(`${PHAIL_PAGE}benchmark/droid`);
    const config=JSON.parse(html.match(/window.PHAIL_BENCHMARK = (\{[^\n]+\});/)?.[1]??'null');
    if(!config)throw new Error('PhAIL benchmark config missing');
    const data=await fetchJson<any>(new URL(config.chartsUrl,PHAIL_PAGE).href);
    const at=data.windows.indexOf(config.defaultTime);if(at<0)throw new Error('PhAIL default time missing');
    for(const row of rows){const model=config.models.find((m:any)=>m.label.normalize('NFKC').replace(/π/g,'pi')===row.model);const d=model&&data.models[model.name];
      if(!d)throw new Error(`PhAIL chart model missing: ${row.model}`);
      if(Math.abs(d.leaderboard.value-row.score)>0.011)throw new Error('PhAIL table and API score differ');
      row.metrics={...row.metrics,speed:d.speed.value[at],speedLow:d.speed.low[at],speedHigh:d.speed.high[at],episodes:d.runs};
    }return rows;
  },
};
export default board;
