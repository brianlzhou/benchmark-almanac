# Contributing

## Suggest a benchmark or a correction

Open an issue with one of the two forms: **Submit a benchmark** or **Correct a record**. A workflow
checks each submission against the catalog and replies within a minute. A person then reviews it.

A benchmark joins the catalog when it passes at least one of four tests: a major lab reports it, an
independent leaderboard runs it, an established evaluation group made it, or people use it. The site's
Submit page explains each test.

## Pull requests

1. Edit the files in `data/` that people keep by hand: `labs.json`, `models.json`, `benchmarks.json`,
   `taxonomy.json`, `cards.json`, `system-cards.json`, `sources.json`, `reviewed.json` and `resources.json`.
2. Leave the files that scripts write to the scripts: `data/scores/`, `data/github.json`,
   `data/abstracts.json`, `data/discovered.json` and `public/meaning/`.
3. Give a source for each new or changed value: the paper, the leaderboard or the model card that reports it.
4. Run `npm run check` and `npm run build`. Both must pass.

To add a leaderboard importer, follow the steps in the README. Each importer reads one board and states
the board's terms in its `terms` field. Read only data that the board's terms and robots.txt allow.

## Style

Descriptions and notes in `data/benchmarks.json` use American spelling and short sentences, with no
semicolons and no dashes as punctuation. `node scripts/check-data.ts` fails on British spelling, semicolons
and dashes in those fields. Text quoted
from a source, such as a paper title or a model card's own wording, keeps its original spelling.
