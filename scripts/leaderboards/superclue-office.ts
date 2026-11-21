// SuperCLUE-Office ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-office",
  url: "https://www.superclueai.com/agent/Office",
  feed: "https://www.superclueai.com/data/agent_list/Office/2026%E5%B9%B410%E6%9C%88.xlsx",
  roundFolder: "Office",
  sheet: "总榜",
  model: "底层模型",
  score: "总分",
  minimum: 8,
  parts: ["文档处理", "数据分析", "材料撰写"],
  harness: "产品名称",
  details: [{"sheet": "回复率统计", "model": "产品名称", "parts": ["回复率(%)", "总题量", "回复题数"]}],
});
