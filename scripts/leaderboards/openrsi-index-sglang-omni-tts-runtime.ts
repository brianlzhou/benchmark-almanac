// This archive holds the original continuation. Later dual-mode runs use a different protocol.
import type { Leaderboard } from './types.ts'
import { fetchJson } from '../lib/util.ts'
import { sourceBoard } from '../lib/boards/openrsi-index.ts'

const REPO = 'https://huggingface.co/datasets/OpenRSI-Foundation/OpenRSI-Index-Logs'
const ARCHIVE = '2ce5ad6aa6bf8e40180dd0f3721bf93fd7744acb/SGNOMI/sglang-omni-tts-runtime'
const FEED = REPO + '/raw/' + ARCHIVE + '/measurements.json'

interface Submission {
  segment: string
  complete: boolean
  official_reward: number | null
  throughput_qps: number | null
}

const board: Leaderboard = {
  benchmark: 'openrsi-index-sglang-omni-tts-runtime',
  url: REPO + '/blob/' + ARCHIVE + '/README.md',
  feed: FEED,
  terms: sourceBoard.terms,
  async fetch() {
    const archive = await fetchJson<{ schema: string, submissions: Submission[] }>(FEED)
    if (archive.schema !== 'sglang-recorded-measurements-v1') throw new Error('Unknown OpenRSI archive format')
    const runs = archive.submissions.filter(run => run.segment === 'Continuation')
    const scored = runs.filter(run => run.official_reward !== null)
    if (scored.length !== 1) throw new Error('Expected one official continuation reward in the OpenRSI archive')
    const { complete, official_reward: score, throughput_qps: throughput } = scored[0]
    if (!complete || typeof score !== 'number' || !Number.isFinite(score) ||
        typeof throughput !== 'number' || !Number.isFinite(throughput)) throw new Error('Invalid OpenRSI continuation result')
    return [{ model: 'GPT-6 Astra', harness: 'Codex', setting: 'xhigh; Continuation; archived continuation protocol, not v5',
      score, metrics: { requestsPerSecond: throughput, submissions: runs.length } }]
  },
}
export default board
