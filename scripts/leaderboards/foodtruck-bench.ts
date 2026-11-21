// FoodTruck Bench ranks models by median-run net worth in dollars. The live board also publishes API costs per run, model sizes, and operating results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://foodtruckbench.com/";
const board: Leaderboard = {
 costPer: "run",
 benchmark: "foodtruck-bench",
 url: "https://foodtruckbench.com",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 stats: { netWorthUnrounded:{name:'Unrounded net worth',unit:'usd',better:'higher'}, revenue:{name:'Revenue',unit:'usd',better:'higher'}, profit:{name:'Profit',unit:'usd',better:'higher'}, foodWaste:{name:'Food waste',unit:'count',better:'lower'}, roi:{name:'Return on investment',unit:'score',better:'higher'}, margin:{name:'Net profit margin',unit:'%',better:'higher'}, balance:{name:'Cash balance',unit:'usd',better:'higher'}, expenses:{name:'Expenses',unit:'usd',better:'lower'}, daysPlayed:{name:'Days played',unit:'count'}, servingsPerDay:{name:'Servings per day',unit:'count',better:'higher'}, medianServingsSold:{name:'Median servings sold',unit:'count',better:'higher'}, averageRevenue:{name:'Average revenue',unit:'usd',better:'higher'}, averageProfit:{name:'Average profit',unit:'usd',better:'higher'}, averageFoodWaste:{name:'Average food waste',unit:'count',better:'lower'}, averageServingsPerDay:{name:'Average servings per day',unit:'count',better:'higher'}, efficiencyRatio:{name:'Efficiency ratio',unit:'score',better:'higher'}, activeParams:{name:'Active parameters',unit:'billions'}, toolCalls:{name:'Tool calls',unit:'count',better:'lower'} },
 aliases: {
  'Muse Glimmer 30B': 'muse-glimmer',
  'Nemotron-3 Ultra 550B': 'nemotron-3-ultra',
  'Nemotron-3 Super 120B': 'nemotron-3-super',
  'Qwen 3.8 27B NVFP4': 'qwen-3-8-27b',
 },

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const html=await fetchText(FEED);const stream=[...html.matchAll(/self\.__next_f\.push\((\[1,[\s\S]*?\])\)<\/script>/g)].map(m=>JSON.parse(m[1])[1]).join('');const models=jsonAfter<any[]>(stream,'"models":');if(!models)throw new Error('FoodTruck models missing');
return models.filter(r=>r.display_name&&typeof r.median_net_worth==='number').map(r=>({model: r.display_name, score: Math.round(r.median_net_worth), setting: 'median run; 30 days',
  cost: r.avg_api_cost ?? undefined, params: r.params_total_b ?? undefined,
  open: r.weights === 'open' ? true : r.weights === 'closed' ? false : undefined,
  metrics: Object.fromEntries(Object.entries({
    netWorthUnrounded: r.median_net_worth, revenue: r.median_revenue, profit: r.median_profit,
    foodWaste: r.median_food_waste, roi: r.median_roi,
    margin: typeof r.primary_net_profit_margin === 'number' ? r.primary_net_profit_margin * 100 : undefined,
    balance: r.primary_cash_balance,
    expenses: r.primary_total_expenses,
    daysPlayed: r.primary_days_played,
    servingsPerDay: r.primary_servings_per_day,
    medianServingsSold: r.median_servings_sold,
    averageRevenue: r.avg_revenue,
    averageProfit: r.avg_profit,
    averageFoodWaste: r.avg_food_waste,
    averageServingsPerDay: r.avg_servings_per_day,
    efficiencyRatio: r.efficiency_ratio,
    activeParams: r.params_active_b,
    toolCalls: r.tool_usage?.total_tool_calls,
  }).filter((entry): entry is [string, number] => typeof entry[1] === 'number'))}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, setting: / NVFP4$/.test(r.model) ? `${r.setting}; NVFP4` : r.setting, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
