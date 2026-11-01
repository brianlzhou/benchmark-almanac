# Benchmark Almanac

A reference for AI benchmarks: what each one tests, where its code lives, which lab model cards report
it, and how the best score has moved. It also tracks when labs stop reporting a benchmark, and why.

The site is static. Every page is built from the files in `data/`, and charts are drawn at build time,
so pages ship almost no JavaScript.

## Data

| File | What it holds |
| --- | --- |
| `data/labs.json` | One record per lab, with the spellings other sources use. |
| `data/models.json` | One record per model, as its lab names it. A lab that shipped several versions under one name gets one record per snapshot (`GPT-4o`, `version: "May 2024"`). |
| `data/benchmarks.json` | One record per benchmark: what it tests, who made it, links, access, status notes, and aliases. Versions stay separate (`ARC-AGI-2` is not `ARC-AGI`). Each also has a finer category, a level, a scoring method and an answer format. |
| `data/taxonomy.json` | The allowed values for those four fields: subcategories under each category, six levels from everyday to research frontier, six scoring methods (from checked automatically to arenas and real events), and seven answer formats. |
| `data/cards.json` | Lab model cards: the benchmarks in each card's headline table and the score the card reports. |
| `data/scores/leaderboards.json` | Scores from each benchmark's own leaderboard, read by the importers in `scripts/leaderboards/`. |
| `data/scores/epoch.json` | Scores and the Epoch Capabilities Index from [Epoch AI](https://epoch.ai/benchmarks), CC BY 4.0. |
| `data/github.json` | Stars, license, last push and archived state for each benchmark repo. |
| `data/sources.json` | Where new benchmarks appear, and how much each source tells you. |
| `data/discovered.json` | The review queue the discovery job writes. |
| `data/resources.json` | Harnesses, registries, guides and papers on building benchmarks. |

Every score names a model id and a benchmark id from these files. Reasoning effort and harness are
settings of a score, not separate models. The build fails if any reference does not resolve.

## Scripts

Node 22.18 or later runs these TypeScript files directly. None has dependencies.

| Command | What it does |
| --- | --- |
| `node scripts/discover.ts` | Reads every source in `data/sources.json` marked `automated`: paper feeds, newsletters, registries, leaderboards, lab model cards and lists. Scores each find and writes `data/discovered.json`. `--only <id> --dry` tests one reader. |
| `node scripts/sync-leaderboards.ts` | Runs every importer in `scripts/leaderboards/` and rewrites `data/scores/leaderboards.json`. A board that fails keeps its last rows. `--only <id> --dry` tests one importer. |
| `node scripts/sync-epoch.ts` | Downloads Epoch AI's data and rewrites `data/scores/epoch.json`. New models and benchmarks join the registries. |
| `node scripts/sync-github.ts` | Refreshes `data/github.json`. Set `GITHUB_TOKEN` first. |
| `node scripts/check-data.ts` | Checks references, allowed values and copy style in `data/`. |

The discovery score has two stages. Stage A asks whether an item is a benchmark at all, from its title
and abstract. Stage B adds evidence across sources: released code or data, a known author organization,
early upvotes or stars, more than one feed, a newsletter mention, or a registry listing. Items scoring 8
or more are ready to catalogue. Items scoring 5 to 7 stay on a watch list for 14 days.

Two GitHub Actions keep the data current. `discover.yml` and `sync.yml` both run every day. Each keeps one
pull request open with its changes.

To add a leaderboard, copy `scripts/leaderboards/aider-polyglot.ts`, point it at the board's published data
file, and run it with `--only <benchmark-id> --dry`. Names the shared resolver in `scripts/lib/models.ts`
cannot place go in the importer's `aliases` map.

Versions of one benchmark are separate records linked by `family` and labelled by `version`, so scores never
mix across versions.

## Development

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
```

## Terms

The discovery job reads only official feeds and APIs, and only where a source's terms and robots.txt
allow it. It never scrapes X, whose terms forbid it. Artificial Analysis's terms do not allow its data in
other ranking products, so the almanac links to Artificial Analysis and imports none of its numbers,
including rows that Epoch AI collected from it. Scale's SEAL pages and some lab sites are checked by hand
for the same reason. Each source that the job does not read says why in its `manual` field.

## Credits

Scores and the capability index: Epoch AI, CC BY 4.0. Lab marks: [LobeHub Icons](https://github.com/lobehub/lobe-icons),
MIT, and the labs' own websites and GitHub or Hugging Face organizations (each file's source is in
`public/labs/LICENSE`). The marks are trademarks of their owners. Type: Newsreader and
Geist, SIL Open Font License.
