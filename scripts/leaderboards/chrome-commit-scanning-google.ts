// Chrome Production Commit Scanning: the maker’s pass@1 success-rate chart.
// The chart configuration is embedded as URL-encoded JSON in the article. No image transcription is used.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://deepmind.google/blog/introducing-gemini-3-5-flash-cyber/";
const board: Leaderboard = {
  benchmark: "chrome-commit-scanning-google",
  url: "https://deepmind.google/blog/introducing-gemini-3-5-flash-cyber/",
  feed: FEED,
  terms: "Public maker-published results. Robots rules checked on 2026-11-08. Scores remain credited to the source.",
  
  async fetch() {
    const s=await fetchText(FEED);const tag=s.match(/<deepai-demo\b[^>]*iframe-title="Chrome Production Commit Scanning Pipeline - Chart"[^>]*>/)?.[0];
    const url=tag?.match(/src="([^"]+)"/)?.[1];if(!url)throw new Error('Chrome scanning chart missing');
    const config=JSON.parse(new URL(url.replace(/&amp;/g,'&')).searchParams.get('config')!);
    return config.data.map((r:any)=>({model:r.label==='Opus 4.6'?'Claude Opus 4.6':r.label,score:r.y,setting:'pass@1'}));
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
