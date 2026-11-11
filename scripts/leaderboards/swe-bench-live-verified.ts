import board, {fetchLiveRows} from './swe-bench-live.ts';
export default {...board, benchmark: 'swe-bench-live-verified', feed: 'https://swe-bench-live.github.io/reports-0605.jsonl (set verified)', fetch: () => fetchLiveRows('verified')};
