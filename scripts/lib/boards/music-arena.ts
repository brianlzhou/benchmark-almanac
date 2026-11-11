// Music Arena's Gradio config includes the same two live tables displayed in its leaderboard tabs.
// Instrumental and vocal votes are separate pools. Never maximize across them as one headline score.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { jsonAfter, num } from '../html.ts';
export const MUSIC_TERMS = 'Music Arena terms prohibit automated access without written permission; the almanac credits and links the source under its owner-directed import policy.';
export async function musicRows(track: 'instrumental' | 'vocal'): Promise<LeaderboardRow[]> {
  const html = await fetchText('https://music-arena.org/');
  const config = jsonAfter<{components: {type:string;props: {label?:string;value?: {headers:string[];data:unknown[][]}}}[]}>(html, 'window.gradio_config =');
  let active: string | undefined;
  for (const c of config.components) {
    if (c.type === 'tabitem') active = c.props.label?.toLowerCase();
    if (c.type !== 'dataframe' || !active?.includes(track)) continue;
    const table = c.props.value;
    if (!table?.headers?.includes('Arena Score')) continue;
    const at = (r:unknown[], key:string) => r[table.headers.indexOf(key)];
    const rows: LeaderboardRow[] = [];
    for (const r of table.data) {
      // Medium names the model size here, not a reasoning setting.
      const model = String(at(r, 'Model') ?? '').replace(/^Stable Audio 3 \(Medium\)$/, 'Stable Audio 3 Medium');
      const score = num(String(at(r, 'Arena Score') ?? ''));
      if (!model || score === undefined) continue;
      const metrics: Record<string,number> = {};
      const ci = num(String(at(r, '95% CI') ?? ''));
      if (ci !== undefined) Object.assign(metrics, {ciLow:score-ci,ciHigh:score+ci});
      const votes = num(String(at(r, '# Votes') ?? ''));
      const speed = num(String(at(r, 'Speed (RTF)') ?? ''));
      if (votes !== undefined) metrics.votes = votes;
      if (speed !== undefined) metrics.realTimeFactor = speed;
      rows.push({model, score, metrics});
    }
    if (!rows.length) throw new Error(`Music Arena ${track} table empty`);
    return rows;
  }
  throw new Error(`Music Arena ${track} table missing`);
}
