// Surge's primary Webflow leaderboard uses data-leaderboard-row and data-score attributes.
// Limit parsing to the leading board: the same page embeds unrelated benchmark previews below it.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { text } from '../html.ts';
export const SURGE_TERMS = "Surge AI's terms of service prohibit automated data extraction; the almanac credits Surge AI and links the original source.";
export const SURGE_ALIASES = {'Muse Glimmer 30B': 'muse-glimmer', 'DeepSeek V4 Flash Vision (experimental)': 'deepseek-v4-flash-vision-exp'};
export function surgeName(raw: string): {model: string; setting?: string} {
  const m = raw.match(/\s*\((Adaptive\/?\s*Max|Adaptive\/Max|Max(?: reasoning)?|xHigh(?: reasoning)?|High(?: reasoning)?|Medium(?: reasoning)?|Thinking on)\)$/i);
  return { model: m ? raw.slice(0,m.index).trim() : raw.trim(), setting: m ? m[1].replace(/ reasoning/i,'').toLowerCase() : undefined };
}
export function surgeRows(html: string): LeaderboardRow[] {
 const end = html.search(/More benchmarks/i);
 const main = end >= 0 ? html.slice(0,end) : html;
 const rows: LeaderboardRow[]=[];
 for(const part of main.split(/data-leaderboard-row=""/).slice(1)) {
  const brand=part.match(/class="head-rank-table-brand"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/)?.[1];
  const name=part.match(/class="head-rank-table-name"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/)?.[1];
  const score=part.match(/data-score="([\d.]+)"/)?.[1] ?? part.match(/data-score=""[^>]*>\s*([\d.]+)/)?.[1];
  if(brand && name && score!==undefined)rows.push({...surgeName((text(name).toLowerCase().startsWith(text(brand).toLowerCase()) ? text(name) : `${text(brand)} ${text(name)}`)),score:Number(score)});
 }
 if(!rows.length)throw new Error('Surge primary leaderboard rows missing');
 return rows;
}
