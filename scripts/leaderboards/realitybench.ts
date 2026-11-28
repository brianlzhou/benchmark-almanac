// realitybench (Kaggle Benchmarks, by neondev0): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'realitybench',
  url: 'https://www.kaggle.com/benchmarks/neondev0/realitybench',
  feed: kaggleFeed('neondev0', 'realitybench'),
  terms: KAGGLE_TERMS,
  parts: {
    checkout: 'Checkout',
    adminTable: 'Admin table',
    apiForm: 'API form',
    booking: 'Booking',
    chat: 'Chat',
    crudDashboard: 'CRUD dashboard',
    fileUpload: 'File upload',
    productPage: 'Product page',
    search: 'Search',
    settings: 'Settings',
    workflow: 'Workflow',
  },
  fetch: () => kaggleRowsWithBounds('neondev0', 'realitybench', "(Overall)", 1, {
    checkout: { task: 'realitybench-checkout' },
    adminTable: { task: 'realitybench-admin-table' },
    apiForm: { task: 'realitybench-api-form' },
    booking: { task: 'realitybench-booking' },
    chat: { task: 'realitybench-chat' },
    crudDashboard: { task: 'realitybench-crud-dashboard' },
    fileUpload: { task: 'realitybench-file-upload' },
    productPage: { task: 'realitybench-product-page' },
    search: { task: 'realitybench-search' },
    settings: { task: 'realitybench-settings' },
    workflow: { task: 'realitybench-workflow' },
  }),
};
export default board;
