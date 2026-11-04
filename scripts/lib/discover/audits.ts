// Audit detection: papers and posts that report problems in a benchmark we catalog, such as a broken grader,
// leaked answers or wrong labels. The discovery job's readers pass what they read (arXiv papers, AINews bullets,
// Prime Intellect's blog) to noteAudit(), and discover.ts saves the finds to data/discovered-audits.json for review
// on the New page. A find becomes an audit only after a person reads the source and adds it to data/audits.json.
import { existsSync } from 'node:fs';
import { dataPath, readJson, writeJson, key, daysAgo } from '../util.ts';
import { TODAY, knownId, names, phraseNames } from './core.ts';

export interface AuditFind {
  key: string;
  title: string;
  url: string;
  source: string;
  /** When the source published it. */
  date?: string;
  first: string;
  last: string;
  /** Cataloged benchmarks the source names. */
  benchmarks: string[];
  /** Kinds of problem its wording suggests (src/lib/audits.ts names them). */
  problems: string[];
  score: number;
}
interface AuditStore {
  updated: string | null;
  items: AuditFind[];
  /** Finds a person checked and set aside: {key, title, reason, date}. */
  dismissed: { key: string; title: string; reason: string; date: string }[];
}

// wording for each kind of problem
const HINTS: [string, RegExp][] = [
  ['broken-grader', /\b(grader|grading (?:bug|error|script)|scoring (?:bug|error|script)|false negatives?|rejects? (?:correct|valid)|evaluation script|answer extraction|regex)\b/i],
  ['leaked-answers', /\b(leak\w* (?:the )?(?:answers?|solutions?|test (?:set|data)|questions|ground truth)|answers? (?:leak\w*|are public|were public|are online|were online|are available)|data leakage|test[- ]set leakage|answer key)\b/i],
  ['wrong-labels', /\b(label errors?|mislabel\w*|incorrect (?:answers?|labels?|ground[- ]truth)|wrong (?:answers?|labels?)|annotation errors?|erroneous|ground[- ]truth errors?|(?:questions?|answers?|items?|examples?|samples?)(?: [\w-]+){0,4} contains? errors|errors in the (?:questions|answers|dataset|benchmark|test set))\b/i],
  ['contamination', /\b(contaminat\w*|memoriz\w*|seen (?:during|in) training|training data overlap|overfit\w* to)\b/i],
  ['reward-hacking', /\b(reward hack\w*|shortcuts?|cheat\w*|game[sd]? the (?:grader|benchmark|evaluation)|exploit\w* the (?:grader|benchmark|evaluation))\b/i],
  ['underspecified-tasks', /\b(underspecified|ambiguous|ambiguity|unclear (?:tasks?|questions?|instructions?)|unsolvable|impossible tasks?)\b/i],
  ['ignored-input', /\b(without (?:the )?(?:images?|video|audio|visual input)|blind (?:baseline|model)|text-only baseline|does not (?:need|require) the (?:image|video))\b/i],
  ['harness-differences', /\b(harness\w*|scaffold\w* (?:change|affect)|scoring rules?|evaluation (?:settings?|protocols?) (?:change|affect|matter))\b/i],
];
// a title that says the work examines benchmarks rather than introducing one
const TITLE = /\b(audit\w*|errors? in|flaws?|flawed|pitfalls?|contaminat\w*|leak\w*|mislabel\w*|label (?:errors?|noise)|revisit\w*|re-?evaluat\w*|re-?examin\w*|how reliable|are we done|broken|shortcuts?|validity|careful examination|sanity check\w*|what'?s wrong)\b/i;
const BODY = /\b(we (?:audit|re-?annotate|re-?examine|manually (?:review|inspect|check)|find that|found that|identify|uncover|discover)|our audit|upon (?:closer )?inspection)\b/i;
// an audit of models, not of a benchmark: "A Protocol for Auditing Demographic Bias in ..."
const MODEL_AUDIT = /\baudit\w*\s+(?:\w+\s+){0,3}(?:bias|fairness|models?|LLMs?|systems?|agents?|privacy|safety|alignment)\b/i;
// a release that has not happened, or a claim no one has checked
const RUMOR = /\b(unconfirmed|rumou?r\w*|reportedly|allegedly)\b/i;
const INTRODUCES = /\b(?:we|this (?:paper|work))\s+(?:introduce|present|propose|release|construct|build|curate|develop)s?\b/i;
// capitalized words that match a benchmark name but are rarely meant as one in prose
const GENERIC = new Set(['math', 'arc', 'race', 'piqa', 'drop', 'boolq', 'copa', 'story', 'trivia', 'humaneval+', 'webarena'].map(key));

/** Cataloged benchmarks a text names: Bench-style names, and names without a benchmark word (MMLU, GSM8K, GPQA). */
export function benchmarksIn(text: string): string[] {
  const out = new Set<string>();
  for (const n of [...names(text), ...phraseNames(text)]) {
    const id = knownId(n);
    if (id) out.add(id);
  }
  const toks = text.split(/[\s,;:()"“”[\]/]+/).map((t) => t.replace(/[.'’]+$/, '').replace(/[’']s$/, ''));
  // the longest name at each word wins, so "OfficeQA Pro v2" is not also OfficeQA and OfficeQA Pro
  for (let i = 0; i < toks.length; i++)
    for (let n = Math.min(4, toks.length - i); n >= 1; n--) {
      const g = toks.slice(i, i + n).join(' ');
      if (!/^[A-Z]/.test(g)) continue;
      // one word must look like a name: two capitals or a digit (MMLU, GSM8K, HumanEval)
      if (n === 1 && !/^[A-Z][\w.+-]*(?:[A-Z]|\d)/.test(g)) continue;
      if (GENERIC.has(key(g))) continue;
      const id = knownId(g);
      if (id) {
        out.add(id);
        i += n - 1;
        break;
      }
    }
  return [...out].filter((id) => !id.startsWith('left-out:'));
}

/** How strongly a title and text read as an audit of existing benchmarks, and the kinds of problem they suggest. */
export function auditSignal(title: string, text: string): { score: number; problems: string[] } {
  const all = `${title} ${text}`;
  const problems = HINTS.filter(([, re]) => re.test(all)).map(([p]) => p);
  let score = 0;
  if (RUMOR.test(all)) return { score: 0, problems };
  if (TITLE.test(title) && !(MODEL_AUDIT.test(title) && !/\b(benchmark|dataset|eval\w*|test set)\b/i.test(title))) score += 3;
  if (BODY.test(text)) score += 1;
  score += Math.min(problems.length, 3);
  // a paper that introduces its own benchmark is usually a benchmark launch that criticizes older ones
  if (INTRODUCES.test(text) && !TITLE.test(title)) score -= 2;
  return { score, problems };
}

// ---- the queue ---------------------------------------------------------------------------------------
const path = dataPath('discovered-audits.json');
const store: AuditStore = existsSync(path) ? readJson<AuditStore>(path) : { updated: null, items: [], dismissed: [] };
store.dismissed ??= [];
const finds = new Map(store.items.map((f) => [f.key, f]));
const touched = new Set<string>();
const dismissed = new Set(store.dismissed.map((d) => d.key));
// sources already written up as audits, and the benchmarks each audit covered with its date
const auditsJson = readJson<{ url: string; date: string; findings: { benchmark: string }[] }[]>(dataPath('audits.json'));
const published = new Set(auditsJson.map((a) => a.url.replace(/[#?].*$/, '').replace(/\/$/, '')));
const auditedOn = new Map<string, string>();
for (const a of auditsJson) for (const f of a.findings) if ((auditedOn.get(f.benchmark) ?? '') < a.date) auditedOn.set(f.benchmark, a.date);
/** True when every benchmark a find names had a published audit in the 30 days before it: news about that audit. */
const covered = (benchmarks: string[], date: string) => benchmarks.every((b) => (auditedOn.get(b) ?? '') >= daysAgo(30, new Date(`${date}T12:00:00Z`)));

/**
 * Records a source if it reads as an audit of a benchmark we catalog: it names one, and its wording scores 4 or
 * more. `title` is the paper title, the post title, or the bold lead of a newsletter bullet.
 */
export function noteAudit(x: { key?: string; title: string; text: string; url: string; source: string; date?: string }) {
  const k = x.key ?? x.url.replace(/[#?].*$/, '').replace(/\/$/, '');
  if (dismissed.has(k) || published.has(k)) return;
  const { score, problems } = auditSignal(x.title, x.text);
  if (score < 4) return;
  const benchmarks = benchmarksIn(`${x.title} ${x.text}`);
  if (!benchmarks.length || covered(benchmarks, x.date ?? TODAY)) return;
  const cur = finds.get(k) ?? { key: k, title: x.title, url: x.url, source: x.source, date: x.date, first: TODAY, last: TODAY, benchmarks: [], problems: [], score: 0 };
  cur.last = TODAY;
  cur.benchmarks = [...new Set([...cur.benchmarks, ...benchmarks])].slice(0, 12);
  cur.problems = [...new Set([...cur.problems, ...problems])];
  cur.score = Math.max(cur.score, score);
  finds.set(k, cur);
  touched.add(k);
}

/** Writes the queue: finds leave after 30 days with no new mention, or once dismissed or written up. */
export function saveAudits(dry: boolean): AuditFind[] {
  const items = [...finds.values()]
    .filter((f) => !dismissed.has(f.key) && !published.has(f.key) && f.last >= daysAgo(30))
    .sort((a, b) => b.score - a.score || (b.date ?? b.first).localeCompare(a.date ?? a.first));
  if (!dry) writeJson(path, { updated: TODAY, items, dismissed: store.dismissed } satisfies AuditStore);
  return items.filter((f) => touched.has(f.key));
}
