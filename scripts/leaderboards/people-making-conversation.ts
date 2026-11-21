// People Making Conversation tests real-time speech systems at recorded conversational boundaries.
// Table 3 has no overall score. The headline is its first measure, the fraction of pause points at which the system stayed silent.
// Table 14 supplies the conversation-level bootstrap intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2610.12802';
const keys = ['silent','takeover','after','pauseLatency','turnLatency','censored','durationRatio','wordRatio','tokenF1','cosine','conversationRecall','factRecall'];
const ciKeys = ['silent','takeover','after','pauseLatency','conversationRecall','factRecall'];
const board: Leaderboard = {
  benchmark: 'people-making-conversation', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'The paper reports no overall score. The headline is the fraction of pause points at which the system stayed silent.',
  parts: { takeover: { name: 'Pause takeover', better: 'lower' }, after: { name: 'After pause', better: 'lower' },
    turnLatency: { name: 'Turn-end latency', unit: 'score', note: 'Milliseconds.', better: 'lower' },
    censored: { name: 'Censored turn ends', better: 'lower' }, tokenF1: 'Token F1', cosine: 'Cosine',
    conversationRecall: 'Conversation recall at 120 s', factRecall: 'Fact recall at 120 s' },
  aliases: { 'gpt-realtime-2025-08-28': 'gpt-realtime' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.join('|') === 'System|silent|takeover|after|lat. (ms)|lat. (ms)|cens.|dur. ratio|word ratio|token F1|cosine|conv.|fact');
    const ci = tables.find(t => t[1]?.join('|') === 'System|silent|takeover|after|takeover lat. (ms)|recall conv.|recall fact');
    const turnCi = tables.find(t => t[1]?.join('|') === 'System|lat. (ms)|cens.|dur. ratio|word ratio|token F1|cosine');
    if (!main || !ci || !turnCi) throw Error('Missing main results or bootstrap intervals');
    const rows: LeaderboardRow[] = [];
    for (const [system,...cells] of main.slice(2)) {
      if (system === 'better' || system === 'person / ceiling') continue;
      const metrics: Record<string,number> = {};
      if (cells.length !== keys.length) throw Error('Missing conversational measure');
      cells.forEach((v,i) => { if (v !== '–') metrics[keys[i]] = numberCell(v); });
      const first = ci.find(r => r[0] === system);
      if (!first) throw Error('Missing pause interval');
      for (const [tableRow, names] of [[first, ciKeys], [turnCi.find(r => r[0] === system), keys.slice(4,10)]] as const) {
        if (!tableRow) continue;
        tableRow.slice(1).forEach((v,i) => {
          if (v === '–') return;
          const m = v.match(/^\[([\d.]+), ([\d.]+)\]$/);
          if (!m) throw Error('Invalid interval for ' + system);
          metrics[names[i]+'Low'] = numberCell(m[1]);
          metrics[names[i]+'High'] = numberCell(m[2]);
        });
      }
      const realtime = system.match(/^GPT Realtime \((.+)\)/);
      rows.push({ model: realtime ? 'gpt-realtime-2025-08-28' : system, setting: realtime?.[1],
        score: metrics.silent, low: metrics.silentLow, high: metrics.silentHigh, metrics });
    }
    return checked(rows, 7);
  },
};
export default board;
