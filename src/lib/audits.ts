// Audits: published reviews that found problems in a benchmark, from data/audits.json. Each audit is one source (a
// write-up or a paper), and each of its findings is about one benchmark. A finding needs a primary source that
// explains the method. A post or a newsletter line alone is not enough.
import auditsJson from '../../data/audits.json';

export type Problem =
  | 'broken-grader'
  | 'leaked-answers'
  | 'wrong-labels'
  | 'contamination'
  | 'reward-hacking'
  | 'ignored-input'
  | 'harness-differences'
  | 'underspecified-tasks'
  | 'content-filter';
export type Status = 'fixed-by-maker' | 'fixed-in-fork' | 'new-version' | 'open' | 'disputed';

export interface Finding {
  benchmark: string;
  problems: Problem[];
  summary: string;
  numbers?: string;
  status: Status;
  fixes?: { label: string; url: string }[];
  response?: { text: string; url: string };
  quote?: string;
  /** A record in the almanac that fixes or replaces the benchmark, such as SWE-bench Verified. */
  see?: string;
}
export interface Audit {
  id: string;
  title: string;
  author: string;
  people?: string[];
  date: string;
  url: string;
  source: 'write-up' | 'paper';
  findings: Finding[];
}

export const PROBLEMS: Record<Problem, { name: string; what: string }> = {
  'broken-grader': { name: 'Broken grader', what: 'The grader rejects right answers or accepts wrong ones.' },
  'leaked-answers': { name: 'Leaked answers', what: 'Models can find the answers, for example on the web or in logs.' },
  'wrong-labels': { name: 'Wrong labels', what: 'Some reference answers are wrong.' },
  contamination: { name: 'Contamination', what: 'Models saw the test, or something close to it, in training.' },
  'reward-hacking': { name: 'Reward hacking', what: 'Models pass by gaming the setup instead of solving the task.' },
  'ignored-input': { name: 'Input that does not matter', what: 'Models score the same without a part of the input.' },
  'harness-differences': { name: 'Harness differences', what: 'Scores change with the harness or settings, not the model.' },
  'underspecified-tasks': { name: 'Unclear tasks', what: 'Tasks leave out details a correct answer depends on.' },
  'content-filter': { name: 'Trips content filters', what: 'A prompt sets off a provider’s safety filter, so some models fail for that reason.' },
};
export const STATUSES: Record<Status, { name: string; tone: 'good' | 'warn' | 'bad' }> = {
  'fixed-by-maker': { name: 'Fixed by the maker', tone: 'good' },
  'new-version': { name: 'Replaced by a new version', tone: 'good' },
  'fixed-in-fork': { name: 'Fixed in a copy', tone: 'warn' },
  open: { name: 'Still open', tone: 'bad' },
  disputed: { name: 'Disputed', tone: 'warn' },
};

/** Audits, newest first. */
export const audits = [...(auditsJson as Audit[])].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

/** A finding with the audit it comes from. */
export interface Issue {
  audit: Audit;
  finding: Finding;
}
export const issuesByBenchmark = new Map<string, Issue[]>();
for (const audit of audits)
  for (const finding of audit.findings) issuesByBenchmark.set(finding.benchmark, [...(issuesByBenchmark.get(finding.benchmark) ?? []), { audit, finding }]);

/** Issues that no one has fixed in the benchmark itself: open, disputed, or fixed only in a copy. */
export const unresolved = (issues: Issue[]) => issues.filter((i) => i.finding.status === 'open' || i.finding.status === 'disputed' || i.finding.status === 'fixed-in-fork');
