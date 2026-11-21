// SuperCLUE-R1 Search ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-r1-search",
  url: "https://www.superclueai.com/specialized/R1_s",
  feed: "https://www.superclueai.com/data/specialized_list/R1_s/2025%E5%B9%B43%E6%9C%88.xlsx",
  roundFolder: "R1_s",
  sheet: "总榜",
  model: "名称",
  score: "总分",
  minimum: 10,
  parts: ["基础检索能力", "分析推理能力"],
  metrics: {"latency": "平均耗时（秒/题）"},
  stats: { latency: { name: 'Average time per question', unit: 'seconds', better: 'lower' } },
  details: [{"sheet": "基础检索能力榜单", "model": "名称", "parts": ["文化生活", "时政新闻", "经济生活"]}, {"sheet": "分析推理能力榜单", "model": "名称", "parts": ["推理计算", "数据检索与分析", "分析排序"]}, {"sheet": "回复率榜单", "model": "名称", "parts": ["完整回复率(%)", "截断率(%)", "无回复率(%)"]}, {"sheet": "平均耗时榜单", "model": "名称", "parts": ["基础检索能力平均耗时（秒/题）", "分析推理能力平均耗时（秒/题）"]}],
});
