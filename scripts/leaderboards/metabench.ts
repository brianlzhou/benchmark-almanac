// MetaBench uses selected questions to reconstruct the Open LLM Leaderboard score. The authors publish their predictions in an R data file.
// Read the held-out models in the test frame of the primary fit. The training frame contains in-sample predictions.
// Base R decodes the reviewed file. The digest protects the R deserialization step if the upstream file changes.
import type { Leaderboard } from './types.ts';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fetchBytes, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://github.com/adkipnis/metabench';
const feed = 'https://raw.githubusercontent.com/adkipnis/metabench/main/analysis/gams/gam-grand-seed=1.rds';
const digest = '4679143835e450c602191e4aadae6274e1c9b91d9c734e64da2265ca16096dc1';
const parts = { 'arc.s': 'ARC', 'gsm8k.s': 'GSM8K', 'hs.s': 'HellaSwag', 'mmlu.s': 'MMLU', 'tfqa.s': 'TruthfulQA', 'wg.s': 'WinoGrande' };
const readFrame = `
  x <- readRDS(gzcon(file("stdin", "rb")))$test
  columns <- c("p", "grand.s", "grand", "arc.s", "gsm8k.s", "hs.s", "mmlu.s", "tfqa.s", "wg.s")
  stopifnot(is.data.frame(x), all(columns %in% names(x)), !anyDuplicated(rownames(x)))
  write.csv(data.frame(model = rownames(x), x[, columns]), row.names = FALSE)
`;
const board: Leaderboard = {
  benchmark: 'metabench', url, feed, parts,
  aliases: { 'mistralai/Mixtral-8x22B-Instruct-v0.1': 'mixtral-8x22b' },
  terms: 'The authors publish the fitted results under CC BY-NC-SA 4.0 at https://github.com/adkipnis/metabench/blob/main/LICENSE.',
  async fetch() {
    const bytes = Buffer.from(await fetchBytes(feed));
    if (createHash('sha256').update(bytes).digest('hex') !== digest) throw new Error('Review the changed MetaBench R data file');
    const csv = execFileSync('Rscript', ['--vanilla', '-e', readFrame], { input: bytes, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
    return checked(parseCsv(csv).map(row => ({
      model: row.model, score: numberCell(row.p), setting: 'Held-out reconstruction',
      metrics: { ...Object.fromEntries(Object.keys(parts).map(k => [k, numberCell(row[k])])),
        rawAverage: numberCell(row['grand.s']), originalLeaderboard: numberCell(row.grand) },
    })), 464);
  },
};
export default board;
