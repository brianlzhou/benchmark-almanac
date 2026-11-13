# Benchmark Almanac

We track AI benchmarks from public leaderboards, lab launch posts, system cards and open-source GitHub repositories. The almanac
also records where each benchmark's code lives, how its best score has moved, and when labs stop reporting
it, and why.

The site is at [benchmarks.brianzhou.org](https://benchmarks.brianzhou.org). Daily jobs look for new
benchmarks and refresh every leaderboard, and each opens a pull request with what it found.

The site is static. Every page is built from the files in `data/`, and charts are drawn as SVG at build
time. Search, table filters, sorting and hover cards use about 40 KB of JavaScript in all. Search by
meaning is opt-in. It needs WebGPU and downloads a model of about 210 MB the first time a reader uses it.

## Data

| File | What it holds |
| --- | --- |
| `data/labs.json` | One record per lab, with the spellings other sources use. |
| `data/models.json` | One record per model, as its lab names it. A lab that shipped several versions under one name gets one record per snapshot (`GPT-4o`, `version: "May 2024"`). |
| `data/benchmarks.json` | One record per benchmark: what it tests, who made it, links, access, status notes, and aliases. Versions stay separate (`ARC-AGI-2` is not `ARC-AGI`). Each also has a finer category, a level, a scoring method and an answer format. |
| `data/taxonomy.json` | The allowed values for those four fields: subcategories under each category, six levels from everyday to research frontier, six scoring methods (from checked automatically to arenas and real events), and seven answer formats. |
| `data/cards.json` | Lab launch posts: the benchmarks in each post's headline table and the score the post reports. |
| `data/system-cards.json` | System cards, model cards and technical reports: every result each document reports for its model, with the section it sits in. |
| `data/scores/leaderboards.json` | Scores from each benchmark's own leaderboard, read by the importers in `scripts/leaderboards/`. |
| `data/scores/epoch.json` | Scores and the Epoch Capabilities Index from [Epoch AI](https://epoch.ai/benchmarks), CC BY 4.0. |
| `data/github.json` | Stars, license, last push and archived state for each benchmark repo. |
| `data/abstracts.json` | The abstract of each benchmark's own paper, in its authors' words, with the paper's source and license. |
| `data/sources.json` | Where new benchmarks appear, and how much each source tells you. |
| `data/audits.json` | Published audits that found problems in a benchmark, one finding per benchmark, with the kind of problem and whether anyone fixed it. Benchmark pages show them under Known issues. |
| `data/claim-notes.json` | Why a lab's own score and the leaderboard's score for the same model differ, when a source explains it: a different harness, effort, number of attempts or task subset. |
| `data/discovered.json` | The review queue the discovery job writes. |
| `data/discovered-models.json`, `data/discovered-audits.json` | The discovery job's queues of new models and of new audits, for review. |
| `data/reviewed.json` | Benchmarks added after a check at the source, and finds left out with the reason. The New page shows both, and the discovery job skips finds already left out. |
| `data/resources.json` | Harnesses, registries, guides and papers on building benchmarks. |

Every score names a model id and a benchmark id from these files. Reasoning effort and harness are
settings of a score, not separate models. The build fails if any reference does not resolve.

Scripts write `data/scores/`, `data/github.json`, `data/abstracts.json`, `data/discovered.json`,
`data/discovered-models.json`, `data/discovered-audits.json` and `public/meaning/`, so change those files only
by running the scripts. `sync-epoch.ts` also adds new Epoch AI
models and benchmarks to `data/models.json` and `data/benchmarks.json`.

## Scripts

These TypeScript files run directly with Node 22.23.4 or later. Only `embed.ts` needs a package installed.

| Command | What it does |
| --- | --- |
| `node scripts/discover.ts` | Reads every source in `data/sources.json` marked `automated`: paper feeds, newsletters, registries, leaderboards, lab model cards and lists. Scores each find and writes `data/discovered.json`. `--only <id> --dry` tests one reader. |
| `node scripts/discover-models.ts` | Looks for new models in Epoch AI's data, the lab feeds and the leaderboards, and writes `data/discovered-models.json`. |
| `node scripts/sync-leaderboards.ts` | Runs every importer in `scripts/leaderboards/` and rewrites `data/scores/leaderboards.json`. A board that fails, or that returns less than half its last rows, keeps its last rows. A full run drops the rows of boards whose importer is gone. `--only <id> --dry` tests one importer. `--allow-drop` accepts a board that really shrank. |
| `node scripts/sync-epoch.ts` | Downloads Epoch AI's data and rewrites `data/scores/epoch.json`. New models and benchmarks join the registries. It needs the `unzip` program, and it writes nothing if the download gives less than half the last row count (`--allow-drop` overrides). |
| `node scripts/sync-github.ts` | Refreshes `data/github.json`. Set `GITHUB_TOKEN` first. |
| `node scripts/abstracts.ts` | Adds abstracts to `data/abstracts.json` for benchmarks that have none. It reads arXiv (CC0), the ACL Anthology (CC BY 4.0 from 2016) and DOIs whose license is CC0 or CC BY, and OpenReview when `OPENREVIEW_USERNAME` and `OPENREVIEW_PASSWORD` are set. `--all` reads every paper again. |
| `node scripts/check-data.ts` | Checks references, allowed values and copy style in `data/`. |
| `npm test` | Runs the tests in `scripts/**/*.test.ts`, which cover how outside model names map to `data/models.json`. |
| `node scripts/embed.ts` | Rebuilds `public/meaning/`, the vectors behind search by meaning, for benchmarks whose text changed. Run `npm i --no-save @huggingface/transformers@4.3.1` first. The model downloads once into `.cache/`. |
| `npm run og:film` | Films the link-preview loops and posters in `public/og/`. It needs ffmpeg and a Chrome or Chromium. Rerun it after a sync that changes the charts. |
| `node scripts/submission.ts --list` | Prints the open benchmark submissions as JSON lines, with the same check the submission workflow runs. It needs the GitHub CLI, signed in. |
| `node scripts/tasks.ts` | Prints the open tasks on the Contribute page as JSON lines. `--kind <kind>` keeps one kind. `--issues <n> [--dry]` keeps up to n of them open as "good first issue" issues, and needs `GITHUB_TOKEN` and `GITHUB_REPOSITORY`. |

The discovery score has two stages. Stage A asks whether an item is a benchmark at all, from its title
and abstract. Stage B adds evidence across sources: released code or data, a known author organization,
early upvotes or stars, more than one feed, a newsletter mention, or a registry listing. Items scoring 8
or more are ready to catalog. Items scoring 5 to 7 stay on a watch list for 14 days.

To add a leaderboard, copy `scripts/leaderboards/aider-polyglot.ts`, point it at the board's published data
file, and run it with `--only <benchmark-id> --dry`. Names the shared resolver in `scripts/lib/models.ts`
cannot place go in the importer's `aliases` map. Write the terms that apply to the board in its `terms` field.
Readers that several importers share, such as one site's JSON feed or a paper's HTML tables, live in
`scripts/lib/boards/`.

Versions of one benchmark are separate records linked by `family` and labeled by `version`, so scores never
mix across versions.

## Workflows

| Workflow | When | What it does |
| --- | --- | --- |
| `check.yml` | Every pull request and every push to `main` | Runs the data check, the type check, the tests and the build. |
| `discover.yml` | Daily, 10:30 UTC | Runs the discovery job and keeps one pull request open with the new queue. |
| `sync.yml` | Daily, 12:00 UTC | Syncs Epoch AI, the leaderboards, GitHub facts and new abstracts, checks and builds, and keeps one pull request open with the changes. |
| `submission.yml` | A benchmark submission issue opens or changes | Replies to the issue and labels it. |
| `tasks.yml` | Only when run by hand | Keeps up to a chosen number of Contribute-page tasks open as "good first issue" issues. It never opens a second issue for a task, never reopens a closed one, and closes an issue once the data has the answer. |

`discover.yml` and `sync.yml` read OpenReview papers only when the `OPENREVIEW_USERNAME` and
`OPENREVIEW_PASSWORD` repository secrets are set. Every other step needs only the workflow's own token.
`submission.yml` links its replies to the site when the `SITE_URL` repository variable is set.

`discover.yml` and `sync.yml` open pull requests with the workflow token, so turn on "Allow GitHub Actions to
create and approve pull requests" in the repository's Actions settings. GitHub does not run other workflows on
pull requests that this token opens, so `sync.yml` runs the data check and the build itself before it opens one.

## Layout

| Folder | What it holds |
| --- | --- |
| `src/pages/` | One file per page or page type: benchmarks, arenas, leaders, models, labs, model cards, what labs report, the index builder, methodology and more. |
| `src/lib/` | The data layer (`data.ts` loads and joins `data/`), the taxonomy, and the math behind charts and indexes, such as the item response model in `irt.ts`. |
| `src/components/` | Charts and page parts, drawn as SVG at build time. |
| `src/scripts/` | The small browser scripts: search, sorting, filters, hover cards. |
| `scripts/leaderboards/` | One importer per leaderboard, named by benchmark id. |
| `scripts/lib/` | Helpers for the scripts: fetching, HTML tables, model-name matching, the discovery readers, and shared board readers. |
| `data/` | The catalog and every score. |
| `public/` | Static files: lab marks, link previews and the search-by-meaning vectors. |

## Development

```sh
npm install
npm run dev       # http://localhost:4321
npm run check     # data check and type check
npm run build     # static site in dist/
```

## Contributing

The [Contribute page](https://benchmarks.brianzhou.org/contribute/) lists open tasks, such as benchmarks with
no release date and official leaderboards we don't read yet. Each has a GitHub form that's already filled in,
and [`/contribute/tasks.json`](https://benchmarks.brianzhou.org/contribute/tasks.json) has the whole list.
`node scripts/tasks.ts` prints the same tasks as JSON lines.

- **Data changes:** edit the record in `data/*.json` (benchmarks, models, labs, launch posts, system cards and
  the rest) and give a source for each value. These files are the source of truth. `data/scores/` is written by
  the sync scripts, so don't edit it by hand. Fix the importer or the upstream source instead.
- **Forms:** to suggest a benchmark, add a score, log a known critique, or point us at your benchmark's results
  as its maker, use the issue forms. A maintainer reviews each one.
- **Code:** see [CONTRIBUTING.md](.github/CONTRIBUTING.md) for pull requests and the importer guide, and
  [SECURITY.md](.github/SECURITY.md) to report a vulnerability.

## Terms

The discovery job reads only official feeds and APIs, and only where a source's terms and robots.txt allow
it. It never scrapes X, whose terms forbid it. Each source in `data/sources.json` that the job does not read
says why in its `manual` field. Leaderboard importers read public pages and data files, and each records the
robots.txt and terms it relies on in its `terms` field. We are currently unable to feature Artificial
Analysis benchmarks due to their terms of service, so the almanac imports none of its numbers, including
rows that Epoch AI collected from it.

## License

The code is under the MIT License (see `LICENSE`). It covers the code, not the data.

The data in `data/` is not under one license. Each source keeps its own terms, and some allow only
non-commercial use: the SWE-bench boards are CC BY-NC 4.0 and MathArena's datasets are CC BY-NC-SA 4.0.
The terms are recorded in these places:

- Leaderboard scores: the `terms` field of each importer in `scripts/leaderboards/`, copied for each board
  into `data/scores/leaderboards.json`.
- Epoch AI scores: the `license` field of `data/scores/epoch.json` (CC BY 4.0).
- Paper abstracts: the `license` field of each entry in `data/abstracts.json`.
- Discovery sources: `data/sources.json`. The `manual` field says why a source is read by hand.
- Lab marks: `public/labs/LICENSE`.

## Credits

Scores and the capability index: Epoch AI, CC BY 4.0. Leaderboard scores: each board's makers. A
benchmark page with leaderboard scores links the board and says when it was read. Paper abstracts: arXiv metadata, CC0, and other
papers under the license each entry in `data/abstracts.json` names. Search by meaning: vectors from Google's
EmbeddingGemma 2, Apache 2.0. Lab marks: [LobeHub Icons](https://github.com/lobehub/lobe-icons), MIT, and the
labs' own websites and GitHub or Hugging Face organizations (`public/labs/LICENSE` holds the LobeHub license and the source of every other mark).
The marks are trademarks of their owners. Type: Newsreader and Geist, SIL Open Font License.
