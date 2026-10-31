// Aider's polyglot leaderboard: a YAML list in the aider repository, one entry per run.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/Aider-AI/aider/main/aider/website/_data/polyglot_leaderboard.yml';

/** The file is a flat list of "- key: value" maps, so a line parser is enough. */
function parse(yaml: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  let cur: Record<string, string> | null = null;
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(- |  )(\w+):\s*(.*)$/);
    if (!m) continue;
    if (m[1] === '- ') out.push((cur = {}));
    if (cur) cur[m[2]] = m[3].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const board: Leaderboard = {
  benchmark: 'aider-polyglot',
  url: 'https://aider.chat/docs/leaderboards/',
  feed: FEED,
  terms: 'Apache-2.0 repository file on GitHub.',
  aliases: {
    'gemini-2.5-pro-preview-06-05 (32k think)': 'gemini-2-5-pro-jun-2025',
  },
  async fetch() {
    return parse(await fetchText(FEED)).map((r) => ({
      model: r.model,
      score: Number(r.pass_rate_2),
      harness: r.edit_format ? `aider, ${r.edit_format} edits` : 'aider',
      date: r.date,
    }));
  },
};
export default board;
