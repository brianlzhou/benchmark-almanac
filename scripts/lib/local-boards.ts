// Boards GitHub's runners can't read. Their sites answer a computer at home but refuse the runners' data center
// addresses: some sit behind a Cloudflare bot check that answers the runners with 403, and the CodaLab competitions
// sit on a network where the runners' connections never open. The daily sync on GitHub skips them, so they don't
// show as failing every day, and a maintainer's computer reads them once a day with
// `node scripts/sync-leaderboards.ts --local`. Their board facts carry `local: true`, so a benchmark page says its
// scores are no longer updated automatically once seven days pass without a read.
// Keyed by importer file name (without .ts), with what refuses the runners. Found 2026-11-22: each answered the
// runner with the error below on every sync since 2026-11-19 and answered a Mac with 200.
export const LOCAL_BOARDS: Record<string, string> = {
  anima: 'compassionbench.com: 403 from Cloudflare',
  harvestbench: 'compassionbench.com: 403 from Cloudflare',
  'travel-agent-compassion': 'compassionbench.com: 403 from Cloudflare',
  'clocktower-radio': 'clocktower-radio.com: 403 from Cloudflare',
  'evalatro-2': 'evalatro.dev: 403 from Cloudflare',
  exploitbench: 'exploitbench.ai: 403 from Cloudflare',
  'foodtruck-bench': 'foodtruckbench.com: 403 from Cloudflare',
  glee: 'glee-competition.com: 403 from Cloudflare',
  'wildlifebench-wildlife-knowledge': 'wildlifebench.org: 403 from Cloudflare',
  'ref-youtube-vos': 'competitions.codalab.org: the connection never opens',
  storycloze: 'competitions.codalab.org: the connection never opens',
  'storycloze-2018': 'competitions.codalab.org: the connection never opens',
  'finsbd-2021': 'competitions.codalab.org: the connection never opens',
};
