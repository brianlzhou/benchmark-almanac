// Your LLM doesn't Know BOUNDARY!. (Kaggle Benchmarks, by trexbytes): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'your-llm-doesn-t-know-boundary',
  url: 'https://www.kaggle.com/benchmarks/trexbytes/your-llm-doesnt-know-boundary',
  feed: kaggleFeed('trexbytes', 'your-llm-doesnt-know-boundary'),
  terms: KAGGLE_TERMS,
  parts: {
    blockedRelease: 'Blocked release (v1)',
    monthEndTotal: 'Month-end total (v3)',
    escalationReport: 'Escalation report (v3)',
    issueFix: 'Issue fix (v3)',
    ticketCloseout: 'Ticket closeout (v3)',
    blockedReleaseV3: 'Blocked release (v3)',
  },
  fetch: () => kaggleRowsWithBounds('trexbytes', 'your-llm-doesnt-know-boundary', "(Overall)", 1, {
    blockedRelease: { task: 'boundary-t18-blocked-release' },
    monthEndTotal: { task: 'boundary-v3-t01-month-end-total' },
    escalationReport: { task: 'boundary-v3-t05-escalation-report' },
    issueFix: { task: 'boundary-v3-t08-issue-fix' },
    ticketCloseout: { task: 'boundary-v3-t11-ticket-closeout' },
    blockedReleaseV3: { task: 'boundary-v3-t18-blocked-release' },
  }),
};
export default board;
