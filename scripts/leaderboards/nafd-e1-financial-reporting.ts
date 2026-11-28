// NAFD E1 Financial Reporting (Kaggle Benchmarks, by nelsonvikou): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'nafd-e1-financial-reporting',
  url: 'https://www.kaggle.com/benchmarks/nelsonvikou/nafd-e1-financial-reporting',
  feed: kaggleFeed('nelsonvikou', 'nafd-e1-financial-reporting'),
  terms: KAGGLE_TERMS,
  parts: {
    financialReporting: 'Financial reporting',
    performanceManagement: 'Performance management',
    businessPlanning: 'Business planning',
    taxation: 'Taxation',
    corporateLaw: 'Corporate law',
    riskManagement: 'Risk management',
    investmentManagement: 'Investment management',
    technologyData: 'Technology and data',
  },
  fetch: () => kaggleRowsWithBounds('nelsonvikou', 'nafd-e1-financial-reporting', "(Overall)", 1, {
    financialReporting: { task: 'nafd_e1_financial_reporting' },
    performanceManagement: { task: 'performance_management_exam' },
    businessPlanning: { task: 'business_planning_exam' },
    taxation: { task: 'taxation_exam' },
    corporateLaw: { task: 'corporate_law_exam' },
    riskManagement: { task: 'risk_management_exam' },
    investmentManagement: { task: 'investment_management_exam' },
    technologyData: { task: 'technology_data_exam' },
  }),
};
export default board;
