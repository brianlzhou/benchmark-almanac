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
| `data/benchmarks.json` | One record per benchmark: what it tests, who made it, links, access, status notes, and aliases. Versions stay separate (`ARC-AGI-2` is not `ARC-AGI`). |
| `data/cards.json` | Lab model cards: the benchmarks in each card's headline table and the score the card reports. |
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
| `node scripts/discover.ts` | Reads Hugging Face Daily Papers, arXiv, AINews, Epoch AI, the Inspect Evals register and Hugging Face's official benchmark datasets. Scores each find and writes `data/discovered.json`. |
| `node scripts/sync-epoch.ts` | Downloads Epoch AI's data and rewrites `data/scores/epoch.json`. New models and benchmarks join the registries. |
| `node scripts/sync-github.ts` | Refreshes `data/github.json`. Set `GITHUB_TOKEN` first. |
| `node scripts/check-data.ts` | Checks references, allowed values and copy style in `data/`. |

The discovery score has two stages. Stage A asks whether an item is a benchmark at all, from its title
and abstract. Stage B adds evidence across sources: released code or data, a known author organization,
early upvotes or stars, more than one feed, a newsletter mention, or a registry listing. Items scoring 8
or more are ready to catalogue. Items scoring 5 to 7 stay on a watch list for 14 days.

Two GitHub Actions keep the data current. `discover.yml` runs every morning, and `sync.yml` runs every
Monday. Each keeps one pull request open with its changes.

## Development

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
```

## Terms

The discovery job reads only official feeds and APIs. It never scrapes X, whose terms forbid it.
Artificial Analysis's terms do not allow its data in other ranking products, so the almanac links to
Artificial Analysis and imports none of its numbers, including rows that Epoch AI collected from it.

## Credits

Scores and the capability index: Epoch AI, CC BY 4.0. Lab marks: [LobeHub Icons](https://github.com/lobehub/lobe-icons),
MIT (see `src/assets/labs/LICENSE`). The marks are trademarks of their owners. Type: Newsreader and
Geist, SIL Open Font License.
