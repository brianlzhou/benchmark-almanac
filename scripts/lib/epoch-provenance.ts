// Where a score in Epoch AI's data came from. Epoch publishes two kinds of file: `<name>.csv` holds Epoch's own
// runs, and `<name>_external.csv` holds scores Epoch collected from elsewhere, with Source, Source link and Notes
// columns that vary by file. The almanac counts only some of the collected scores as independent:
//
//   epoch    Epoch ran the model itself.
//   board    copied from a leaderboard an evaluator or the benchmark's makers run (Vals.ai, LiveBench, HELM...).
//   lab      a lab's own number: a system card, model card, technical report, blog post or announcement.
//   paper    a research paper's number. Papers come from the people who trained or tested the models.
//   unknown  the file names no source.
//
// Only `epoch` and `board` count as independent runs. The rest are claims. The lists below are short on purpose,
// so a person can check them: `node scripts/sync-epoch.ts` prints the count of each kind per benchmark.

export type Via = 'epoch' | 'board' | 'lab' | 'paper' | 'unknown';

/** Leaderboards and evaluators Epoch copies from, by host (a host ending in one of these). */
const BOARD_HOSTS = [
  'aider.chat',
  'andonlabs.com',
  'arcprize.org',
  'arena.ai',
  'balrogai.com',
  'cbrower.dev',
  'cognition.com',
  'conceptualreasoning.ai',
  'crfm.stanford.edu',
  'cursor.com',
  'cybench.github.io',
  'datacurve.ai',
  'fiction.live',
  'frontierswe.com',
  'futuresearch.ai',
  'gbaeval.com',
  'geobench.org',
  'gso-bench.github.io',
  'htihle.github.io',
  'labs.scale.com',
  'livebench.ai',
  'lmarena.ai',
  'metr.org',
  'mind-cube.github.io',
  'os-world.github.io',
  'scienceqa.github.io',
  'simple-bench.com',
  'surgehq.ai',
  'tbench.ai',
  'the-agent-company.com',
  'vals.ai',
  'video-mme.github.io',
  'willpatrick.xyz',
  'xlang.ai',
  'yhenon.github.io',
];
/** A source named like a leaderboard, or a benchmark's own results repository on GitHub. */
const BOARD_WORDS = /\b(leaderboard|dashboard|helm|crfm|website|github repository|experiment results github)\b/i;
/** A lab's own report or post. Checked first: "Results from Opus 4.6 system card" is a claim, wherever it is listed. */
const LAB_WORDS = /\b(system card|model card|technical report|tech report|announcement|annoucement|blog|launch post)\b/i;
const LAB_HOSTS = ['anthropic.com', 'openai.com', 'x.ai', 'deepmind.google', 'storage.googleapis.com', 'inflection.ai', 'mistral.ai', 'ai.meta.com', 'qwenlm.github.io'];
const PAPER_HOSTS = ['arxiv.org', 'jmlr.org', 'aaai.org', 'neurips.cc', 'openreview.net', 'aclanthology.org', 'proceedings.mlr.press'];
/** Sites that gather other people's numbers, and posts on social media: never counted as a board. */
const OTHER_HOSTS = ['lmcouncil.ai', 'paperswithcode.com', 'x.com', 'twitter.com'];

const host = (s: string) => {
  const m = s.match(/https?:\/\/([^/\s?#]+)/i);
  return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
};
const on = (h: string, list: string[]) => !!h && list.some((d) => h === d || h.endsWith(`.${d}`));

/** The columns that name a source, which differ from file to file. */
function sourceOf(row: Record<string, string>): { name: string; link: string; notes: string } {
  const get = (re: RegExp) => Object.entries(row).find(([k]) => re.test(k))?.[1]?.trim() ?? '';
  return { name: get(/^source$/i), link: get(/^source link/i), notes: get(/^notes/i) };
}

/**
 * Files whose rows name no source, where Epoch AI's own page for the benchmark says which public leaderboard it
 * copies ("We source results from the public ... leaderboard"), checked on 2026-11-11. APEX-Agents, ARC-AGI-2 and
 * HLE name none, so their rows stay 'unknown'.
 */
const FILE_SOURCE: Record<string, string> = {
  'ale_bench_external.csv': 'ALE-Bench leaderboard',
  'algotune_external.csv': 'AlgoTune leaderboard',
  'cl_bench_external.csv': 'CL-bench leaderboard',
  'cl_bench_life_external.csv': 'CL-bench Life leaderboard',
  'exploitbench_external.csv': 'ExploitBench leaderboard',
  'forecastbench_external.csv': 'ForecastBench Tournament leaderboard',
  'gdpval_external.csv': 'GDPval leaderboard',
  'posttrainbench_external.csv': 'PostTrainBench leaderboard',
  'rli_external.csv': 'Remote Labor Index leaderboard',
  'vending_bench_2_external.csv': 'Vending-Bench 2 leaderboard',
};

/**
 * Files Epoch AI copies from Artificial Analysis, by Epoch's own page ("We source results from the public CritPt
 * leaderboard, hosted by Artificial Analysis", checked 2026-11-11). The almanac never imports Artificial
 * Analysis data, so scripts/sync-epoch.ts skips them, like any row that names Artificial Analysis.
 */
export const FROM_ARTIFICIAL_ANALYSIS = new Set(['critpt_external.csv']);

/** Where Epoch got one row. `file` is the CSV's name in Epoch's zip. */
export function provenance(file: string, row: Record<string, string>): { via: Via; from: string | null } {
  if (!file.endsWith('_external.csv')) return { via: 'epoch', from: null };
  const { name: named, link, notes } = sourceOf(row);
  const name = named || (link ? '' : (FILE_SOURCE[file] ?? ''));
  const url = /^https?:\/\//i.test(link) ? link : /^https?:\/\//i.test(name) ? name : '';
  const h = host(url);
  const from = name || url || null;
  const text = `${name} ${notes}`;
  if (!name && !url) return { via: 'unknown', from: null };
  if (on(h, OTHER_HOSTS) || /\btweet\b/i.test(name)) return { via: 'unknown', from };
  if (LAB_WORDS.test(text) || on(h, LAB_HOSTS)) return { via: 'lab', from };
  if (on(h, BOARD_HOSTS) || (h === 'github.com' && !on(h, PAPER_HOSTS)) || BOARD_WORDS.test(name)) return { via: 'board', from };
  if (on(h, PAPER_HOSTS)) return { via: 'paper', from };
  return { via: 'unknown', from };
}

/** The host of a source, for matching it to a leaderboard the almanac reads itself. */
export const sourceHost = (from: string | null | undefined) => host(from ?? '');
