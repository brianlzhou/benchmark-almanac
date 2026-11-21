// SuperCLUE-SWE with mini-swe-agent ranks entries by 总分（通过率%） on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-swe-with-mini-swe-agent",
  url: "https://www.superclueai.com/specialized/SWE-Agent",
  feed: "https://www.superclueai.com/data/specialized_list/SWE-Agent/2026%E5%B9%B410%E6%9C%88.xlsx",
  roundFolder: "SWE-Agent",
  sheet: "总榜",
  model: "模型名称",
  score: "总分（通过率%）",
  minimum: 10,
  parts: [],
  metrics: {"steps": "单题平均步数", "inputTokens": "单题平均输入Token", "cachedTokens": "单题平均缓存命中Token", "cacheHitFraction": "整体缓存命中率", "outputTokens": "单题平均输出Token", "costPerTaskCny": "平均每题价格(元)"},
  fixedHarness: "mini-swe-agent",
});
