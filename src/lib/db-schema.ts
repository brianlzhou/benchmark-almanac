// The SQLite database that /sql/ queries and offers for download: its tables, its views and the credit text that
// travels with it. scripts/build-db.ts creates the tables from these definitions, and the /sql/ page documents
// them from the same list. This file imports no data, so a plain Node script can load it.

export const SITE_URL = 'https://www.benchmarkalmanac.com';
export const DB_PATH = '/data/almanac.db';
export const DB_GZ_PATH = '/data/almanac.db.gz';

export type ColType = 'TEXT' | 'INTEGER' | 'REAL';
export interface Col {
  name: string;
  type: ColType;
  doc: string;
  key?: boolean;
}
export interface Table {
  name: string;
  doc: string;
  cols: Col[];
}

const c = (name: string, type: ColType, doc: string, key = false): Col => ({ name, type, doc, ...(key ? { key } : {}) });

export const TABLES: Table[] = [
  {
    name: 'about',
    doc: 'What this file is, when we built it, and how to credit it. One row per key.',
    cols: [c('key', 'TEXT', 'name, url, built, data_as_of, credit, how_to_credit, citation, bibtex, license or dates', true), c('value', 'TEXT', 'The text for that key.')],
  },
  {
    name: 'labs',
    doc: 'The labs and companies that make models.',
    cols: [c('id', 'TEXT', 'Lab id, as in the site’s addresses.', true), c('name', 'TEXT', 'Lab name.'), c('country', 'TEXT', 'Country code.'), c('url', 'TEXT', 'Website.'), c('aliases', 'TEXT', 'Other names, as a JSON array.')],
  },
  {
    name: 'models',
    doc: 'One row per model snapshot.',
    cols: [
      c('id', 'TEXT', 'Model id.', true),
      c('name', 'TEXT', 'Model name.'),
      c('version', 'TEXT', 'Snapshot label when a lab shipped several versions under one name.'),
      c('lab', 'TEXT', 'Lab id (labs.id).'),
      c('family', 'TEXT', 'Model family.'),
      c('released', 'TEXT', 'Release date, YYYY-MM-DD.'),
      c('weights', 'TEXT', 'open or closed.'),
      c('tier', 'TEXT', 'flagship, mid, small or open-weights.'),
      c('card_url', 'TEXT', 'The lab’s own card for the model.'),
      c('epoch_name', 'TEXT', 'The model’s name in Epoch AI’s data.'),
      c('aliases', 'TEXT', 'Other names, as a JSON array.'),
    ],
  },
  {
    name: 'benchmarks',
    doc: 'Every benchmark we catalog. Versions of one test share a family.',
    cols: [
      c('id', 'TEXT', 'Benchmark id.', true),
      c('name', 'TEXT', 'Benchmark name.'),
      c('aliases', 'TEXT', 'Other names, as a JSON array.'),
      c('family', 'TEXT', 'Shared by every version of one test.'),
      c('version', 'TEXT', 'Version label within the family.'),
      c('area', 'TEXT', 'One of eight areas: knowledge, reasoning, code, agents, work, multimodal, safety or other.'),
      c('category', 'TEXT', 'Category id.'),
      c('category_name', 'TEXT', 'Category name.'),
      c('subcategory', 'TEXT', 'Finer category id.'),
      c('level', 'TEXT', 'Who could solve the tasks: everyday, school, university, competition, expert or frontier.'),
      c('scoring', 'TEXT', 'How a score is decided: verified, model-judged, expert-graded, preference, head-to-head or outcome.'),
      c('format', 'TEXT', 'What the model produces.'),
      c('org', 'TEXT', 'Who made it.'),
      c('released', 'TEXT', 'Release month, YYYY-MM.'),
      c('added', 'TEXT', 'The day it joined the almanac, for records added since November 2026.'),
      c('unit', 'TEXT', 'The unit of its scores: %, elo, score, index or usd.'),
      c('better', 'TEXT', 'higher or lower.'),
      c('access', 'TEXT', 'public, private or both.'),
      c('confidence', 'TEXT', 'How sure we are of the record: verified, likely or unverified.'),
      c('description', 'TEXT', 'What it tests, in our words.'),
      c('note', 'TEXT', 'Caveats and findings.'),
      c('successor', 'TEXT', 'The benchmark that replaced it.'),
      c('repo', 'TEXT', 'Code repository.'),
      c('github', 'TEXT', 'owner/name of a GitHub repository (repos.repo).'),
      c('dataset', 'TEXT', 'Dataset link.'),
      c('leaderboard', 'TEXT', 'Leaderboard link.'),
      c('paper', 'TEXT', 'Paper link.'),
      c('site', 'TEXT', 'Website.'),
      c('edi', 'REAL', 'Epoch Difficulty Index, on the ECI scale.'),
      c('epoch_name', 'TEXT', 'The benchmark’s name in Epoch AI’s data.'),
      c('refreshes', 'TEXT', 'Dated question refreshes that kept one record, as JSON.'),
      c('changes', 'TEXT', 'Dated changes that alter what a score means, as JSON.'),
    ],
  },
  {
    name: 'facets',
    doc: 'Each benchmark’s facets, one row per value (data/facets.json): what it measures, its risk and behavior, subject, language, input, output, interaction, environment, item source, refresh and who runs it, plus the occupations and human time a benchmark states. Allowed values are in data/facets-codebook.json.',
    cols: [
      c('benchmark', 'TEXT', 'Benchmark id (benchmarks.id).'),
      c('facet', 'TEXT', 'construct, risk, propensity, subject, language, input, output, interaction, environment, source, refresh, runner, occupations or humanTime.'),
      c('value', 'TEXT', 'One value. Environments may name an app or game after a colon, as application:Blender. Subjects are OECD field codes such as 1.6, and languages ISO 639 codes.'),
    ],
  },
  {
    name: 'boards',
    doc: 'The official leaderboards we read, one per benchmark, with the terms that apply to each.',
    cols: [
      c('benchmark', 'TEXT', 'Benchmark id.', true),
      c('url', 'TEXT', 'The page people read.'),
      c('feed', 'TEXT', 'The file or endpoint we read.'),
      c('host', 'TEXT', 'Who runs the board, when it isn’t the benchmark’s makers.'),
      c('terms', 'TEXT', 'The terms that apply to reading and reusing it.'),
      c('license', 'TEXT', 'A Creative Commons license the terms name, when there is one.'),
      c('noncommercial', 'INTEGER', '1 when the terms allow only non-commercial use.'),
      c('retrieved', 'TEXT', 'The day we last read it.'),
      c('rows', 'INTEGER', 'Rows it returned.'),
      c('unmatched', 'INTEGER', 'Board names we could not match to a model.'),
      c('cost_per', 'TEXT', 'What a cost covers: task, or run for the whole test set.'),
      c('chart', 'TEXT', 'The board’s own chart, as JSON.'),
      c('parts', 'TEXT', 'The parts of the benchmark the board scores on their own, as JSON: metric key to name, group and unit. Each row keeps its part scores in scores.metrics under these keys.'),
      c('last_failed', 'TEXT', 'The day reading it last failed, if it did.'),
    ],
  },
  {
    name: 'scores',
    doc: 'Every score from every source, one row per run. A model can have several rows on one benchmark.',
    cols: [
      c('id', 'INTEGER', 'Row number.', true),
      c('benchmark', 'TEXT', 'Benchmark id.'),
      c('model', 'TEXT', 'Model id, or empty for an unlisted entry.'),
      c('entry_name', 'TEXT', 'The board’s own name for an unlisted entry (a fine-tune, agent or product we don’t track).'),
      c('entry_kind', 'TEXT', 'model, or unlisted. Unlisted entries never count toward leaders on the site.'),
      c('source', 'TEXT', 'leaderboard, epoch (Epoch AI’s own run), collected (a score Epoch AI collected elsewhere) or card (a lab’s own document).'),
      c('via', 'TEXT', 'For a collected score: board, lab, paper or unknown.'),
      c('from_source', 'TEXT', 'For a collected score: the source Epoch AI names.'),
      c('independent', 'INTEGER', '1 for a leaderboard run, an Epoch AI run, or a board Epoch AI copied.'),
      c('claim', 'INTEGER', '1 for a lab’s own number or a claim Epoch AI collected.'),
      c('site_hidden', 'INTEGER', '1 for an Epoch AI copy of a board we read directly. The site leaves these out.'),
      c('setting', 'TEXT', 'Effort level, tools or another way of running the whole benchmark.'),
      c('harness', 'TEXT', 'Agent, scaffold or harness, when the source names one.'),
      c('value', 'REAL', 'The score, in the unit column. Percentages run from 0 to 100.'),
      c('unit', 'TEXT', 'The score’s unit.'),
      c('date', 'TEXT', 'For a board row on a model, the model’s release date. For an unlisted entry, the date the board gives. For a lab number, the document’s date.'),
      c('cost', 'REAL', 'US dollars per task as the board prices it, or per run where boards.cost_per says run. Compare within one board only.'),
      c('tokens', 'REAL', 'Output tokens per task, when the board reports them.'),
      c('metrics', 'TEXT', 'Other numbers the board reports for the run, as JSON.'),
      c('card', 'TEXT', 'For a lab number, the document id (cards.id).'),
      c('license', 'TEXT', 'The license of this score where we know it: CC BY 4.0 for Epoch AI, or the board’s Creative Commons license.'),
      c('noncommercial', 'INTEGER', '1 when the source allows only non-commercial use.'),
    ],
  },
  {
    name: 'cards',
    doc: 'Lab documents: launch posts, system cards, model cards and technical reports.',
    cols: [
      c('id', 'TEXT', 'Document id.', true),
      c('kind', 'TEXT', 'launch (a launch post) or system-card (a longer document).'),
      c('doc', 'TEXT', 'For a longer document: system card, model card, technical report or addendum.'),
      c('lab', 'TEXT', 'Lab id.'),
      c('model', 'TEXT', 'Model id.'),
      c('date', 'TEXT', 'Publication date.'),
      c('title', 'TEXT', 'Title.'),
      c('url', 'TEXT', 'Link.'),
      c('tier', 'TEXT', 'The model’s tier.'),
      c('release', 'TEXT', 'For a longer document, the launch post it goes with.'),
      c('notes', 'TEXT', 'Notes on how we read it.'),
    ],
  },
  {
    name: 'card_results',
    doc: 'Every result in every lab document, as the lab wrote it.',
    cols: [
      c('card', 'TEXT', 'Document id (cards.id).'),
      c('benchmark', 'TEXT', 'Benchmark id.'),
      c('score', 'REAL', 'The number, or empty when the document shows no number.'),
      c('unit', 'TEXT', 'The unit as written.'),
      c('as_written', 'TEXT', 'The row label or text the number came from.'),
      c('section', 'TEXT', 'For a longer document: capabilities, safety, bio-chem, cyber and so on.'),
    ],
  },
  {
    name: 'eci',
    doc: 'Epoch AI’s Capabilities Index (CC BY 4.0), one score per model.',
    cols: [c('model', 'TEXT', 'Model id.', true), c('eci', 'REAL', 'The index.'), c('low', 'REAL', 'Lower end of the interval.'), c('high', 'REAL', 'Upper end of the interval.')],
  },
  {
    name: 'abstracts',
    doc: 'The abstract of each benchmark’s own paper, in its authors’ words, under the license each row names.',
    cols: [
      c('benchmark', 'TEXT', 'Benchmark id.', true),
      c('title', 'TEXT', 'Paper title.'),
      c('url', 'TEXT', 'Paper link.'),
      c('source', 'TEXT', 'arxiv, acl, crossref or openreview.'),
      c('ref', 'TEXT', 'How to name the paper, such as arXiv:2406.19314.'),
      c('license', 'TEXT', 'CC0 1.0 or CC BY 4.0.'),
      c('fetched', 'TEXT', 'The day we read it.'),
      c('text', 'TEXT', 'The abstract.'),
    ],
  },
  {
    name: 'repos',
    doc: 'Facts about each benchmark’s GitHub repository.',
    cols: [c('repo', 'TEXT', 'owner/name.', true), c('stars', 'INTEGER', 'Stars.'), c('license', 'TEXT', 'The repository’s license.'), c('pushed', 'TEXT', 'Last push.'), c('archived', 'INTEGER', '1 when archived.')],
  },
];

export interface View {
  name: string;
  doc: string;
  sql: string;
}

export const VIEWS: View[] = [
  {
    name: 'model_scores',
    doc: 'Scores on tracked models with benchmark, model and lab names, leaving out the copies the site hides.',
    sql: `select s.benchmark, b.name as benchmark_name, b.area, s.model, m.name as model_name, m.lab, l.name as lab_name,
  m.released, s.source, s.independent, s.claim, s.value, s.unit, b.better, s.setting, s.harness, s.date, s.cost, s.tokens, s.card
from scores s
join benchmarks b on b.id = s.benchmark
join models m on m.id = s.model
left join labs l on l.id = m.lab
where s.entry_kind = 'model' and s.site_hidden = 0`,
  },
  {
    name: 'best_independent',
    doc: 'Each model’s best independent score on each benchmark, the way the site ranks a board: best setting and harness.',
    sql: `select benchmark, benchmark_name, area, model, model_name, lab, lab_name, value, unit, better, source, setting, harness, date
from (
  select ms.*, row_number() over (
    partition by ms.benchmark, ms.model
    order by case when ms.better = 'lower' then ms.value else -ms.value end
  ) as rn
  from model_scores ms
  where ms.independent = 1
)
where rn = 1`,
  },
];

// ---- credit ---------------------------------------------------------------------------------------------
/** One line to put under anything made with the data. */
export const CREDIT_LINE = 'Data: Benchmark Almanac (benchmarkalmanac.com), from the original source of each score.';

/** What to do when you use the data, in the order a reader needs it. */
export const HOW_TO_CREDIT = [
  'Credit Benchmark Almanac and link to benchmarkalmanac.com.',
  'Credit the source of each score you use. The boards table names each leaderboard and its terms.',
  'Some sources allow only non-commercial use, such as the SWE-bench boards (CC BY-NC 4.0) and MathArena’s datasets (CC BY-NC-SA 4.0). Filter on the noncommercial column before any commercial use.',
];

/** The license notes, as README.md states them. */
export const LICENSE_NOTE =
  'Our code is under the MIT License, which doesn’t cover the data. Each data source keeps its own terms, listed in boards.terms and abstracts.license. Epoch AI’s scores are CC BY 4.0.';

export const DATES_NOTE =
  'Board scores on models we track are dated by the model’s release, not by when the board ran them. Lab numbers are dated by their document.';

const longDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** The citation the site's cite button gives for the almanac as a whole. */
export function citation(built: string): { text: string; bibtex: string } {
  const year = built.slice(0, 4);
  const accessed = longDate(built);
  return {
    text: `Zhou, B. (${year}). Benchmark Almanac. Retrieved ${accessed}, from ${SITE_URL}/`,
    bibtex: [`@misc{zhou${year}benchmarkalmanac,`, `  author = {Zhou, Brian},`, `  title = {Benchmark Almanac},`, `  year = {${year}},`, `  url = {${SITE_URL}/},`, `  note = {Accessed ${accessed}}`, `}`].join('\n'),
  };
}

// ---- example queries --------------------------------------------------------------------------------------
export interface Example {
  id: string;
  label: string;
  sql: string;
}

export const EXAMPLES: Example[] = [
  {
    id: 'apps-agents-drive',
    label: 'Apps that agents drive',
    sql: `-- Which named apps do benchmarks have models operate, and how many benchmarks use each?
select substr(value, length('application:') + 1) as app, count(*) as benchmarks,
  group_concat(b.name, ', ') as names
from facets f join benchmarks b on b.id = f.benchmark
where f.facet = 'environment' and f.value like 'application:%'
group by app
order by benchmarks desc, app
limit 25`,
  },
  {
    id: 'fable-vs-opus',
    label: 'Fable 5.2 against Opus 5.5',
    sql: `-- Where did Claude Fable 5.2 gain most over Claude Opus 5.5, by Anthropic's own numbers?
-- headroom_closed_pct is the share of the gap to 100% that the new model closed.
with best as (
  select c.model, r.benchmark, max(r.score) as score
  from card_results r join cards c on c.id = r.card
  where r.score is not null
  group by c.model, r.benchmark
)
select b.name as benchmark, b.area,
       o.score as opus_5_5, f.score as fable_5_2,
       round(f.score - o.score, 1) as gain,
       round(100.0 * (f.score - o.score) / (100 - o.score)) as headroom_closed_pct
from best f
join best o on o.benchmark = f.benchmark and o.model = 'claude-opus-5-5'
join benchmarks b on b.id = f.benchmark
where f.model = 'claude-fable-5-2' and b.unit = '%' and b.better = 'higher'
  and o.score < 100 and b.category <> 'safety-alignment'
order by gain desc
limit 20;`,
  },
  {
    id: 'leaders',
    label: 'Leaders of the most-cited benchmarks',
    sql: `-- Who leads the 20 benchmarks that lab documents cite most, by independent runs?
-- Only benchmarks with an independent score on a model from the last 12 months count,
-- so retired ones like MMLU drop out. A tie goes to the model released first.
with cited as (
  select benchmark, count(distinct card) as lab_documents
  from card_results group by benchmark
), live as (
  select benchmark from model_scores
  where independent = 1 and released >= date('now', '-12 months')
  group by benchmark
), ranked as (
  select *, row_number() over (
    partition by benchmark
    order by case when better = 'lower' then value else -value end, released
  ) as place
  from model_scores
  where independent = 1
)
select benchmark_name as benchmark, model_name as leader, lab_name as lab,
       released, round(value, 1) as score, unit, source, lab_documents
from ranked join cited using (benchmark) join live using (benchmark)
where place = 1
order by lab_documents desc
limit 20;`,
  },
  {
    id: 'most-scored',
    label: 'Benchmarks by number of models',
    sql: `-- Which benchmarks have scores for the most models, and how often do labs cite them?
select b.name as benchmark, b.area, substr(b.released, 1, 4) as released,
       count(distinct s.model) as models,
       count(distinct s.source) as sources,
       (select count(distinct r.card) from card_results r
        where r.benchmark = b.id) as lab_documents
from scores s join benchmarks b on b.id = s.benchmark
where s.entry_kind = 'model' and s.site_hidden = 0
group by s.benchmark
order by models desc
limit 25;`,
  },
  {
    id: 'harness',
    label: 'Where the harness matters',
    sql: `-- Same model, same board, different harness: where is the spread widest?
select b.name as benchmark, m.name as model, l.name as lab,
       count(distinct s.harness) as harnesses,
       round(max(s.value), 1) as best, round(min(s.value), 1) as worst,
       round(max(s.value) - min(s.value), 1) as spread
from scores s
join benchmarks b on b.id = s.benchmark
join models m on m.id = s.model
left join labs l on l.id = m.lab
where s.source = 'leaderboard' and s.harness is not null and b.unit = '%'
group by s.benchmark, s.model
having harnesses > 1
order by spread desc
limit 25;`,
  },
  {
    id: 'cost',
    label: 'Boards that publish cost',
    sql: `-- Which boards price their runs, and what does a run cost?
select b.name as benchmark, coalesce(bo.cost_per, 'task') as cost_per,
       count(*) as runs_with_cost, count(distinct s.model) as models,
       round(min(s.cost), 3) as cheapest_usd,
       round(max(s.cost), 2) as priciest_usd
from scores s
join benchmarks b on b.id = s.benchmark
join boards bo on bo.benchmark = s.benchmark
where s.source = 'leaderboard' and s.cost > 0
group by s.benchmark
order by runs_with_cost desc
limit 25;`,
  },
  {
    id: 'claims',
    label: 'Lab numbers against boards',
    sql: `-- Where does a lab's own number differ most from the official board?
with lab as (
  select benchmark, model, max(value) as v from scores
  where source = 'card' group by benchmark, model
), board as (
  select benchmark, model, max(value) as v from scores
  where source = 'leaderboard' and entry_kind = 'model' group by benchmark, model
)
select b.name as benchmark, m.name as model, l.name as lab,
       round(lab.v, 1) as lab_says, round(board.v, 1) as board_says,
       round(lab.v - board.v, 1) as gap
from lab join board using (benchmark, model)
join benchmarks b on b.id = benchmark
join models m on m.id = model
left join labs l on l.id = m.lab
where b.unit = '%'
order by abs(lab.v - board.v) desc
limit 25;`,
  },
  {
    id: 'eci',
    label: 'Top models by ECI',
    sql: `-- The 20 models with the highest Epoch Capabilities Index, with the low and high ends of its interval
select m.name as model, l.name as lab, m.released,
       round(e.eci, 1) as eci, round(e.low, 1) as low, round(e.high, 1) as high
from eci e
join models m on m.id = e.model
left join labs l on l.id = m.lab
where e.eci is not null
order by e.eci desc
limit 20;`,
  },
  {
    id: 'noncommercial',
    label: 'Non-commercial sources',
    sql: `-- Boards whose terms allow only non-commercial use
select b.name as benchmark, bo.license, count(s.id) as scores, bo.terms
from boards bo
join benchmarks b on b.id = bo.benchmark
left join scores s on s.benchmark = bo.benchmark and s.source = 'leaderboard'
where bo.noncommercial = 1
group by bo.benchmark
order by scores desc;`,
  },
];
