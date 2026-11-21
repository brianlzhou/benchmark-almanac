import { setTimeout as delay } from 'node:timers/promises'
import type { Leaderboard } from './types.ts'
import { studyRows, STUDY_TERMS, STUDY_TEXT_STATS } from '../lib/boards/studyarena.ts'

const PAGE = 'https://studyarena.com/leaderboard'

const board: Leaderboard = {
  benchmark: 'studyarena-text',
  url: PAGE,
  feed: PAGE,
  terms: STUDY_TERMS,
  stats: STUDY_TEXT_STATS,
  async fetch() {
    try {
      return await studyRows('text')
    } catch (error) {
      // The page asks readers to try again shortly during a server outage.
      // Give it one longer recovery interval after the shared reader's short retries.
      if (!(error instanceof Error) || error.message !== `500 ${PAGE}`) throw error
      await delay(30_000)
      return studyRows('text')
    }
  },
}
export default board
