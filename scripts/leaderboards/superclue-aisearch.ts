// SuperCLUE-AISearch ranks entries by 总分 on its 总榜单 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-aisearch",
  url: "https://www.superclueai.com/specialized/AISearch",
  feed: "https://www.superclueai.com/data/specialized_list/AISearch/2024%E5%B9%B411%E6%9C%88.xlsx",
  roundFolder: "AISearch",
  sheet: "总榜单",
  model: "模型",
  score: "总分",
  minimum: 14,
  parts: ["基础能力", "场景应用"],
  settings: ["使用方式"],
  details: [{"sheet": "主观题", "model": "模型", "parts": ["主观题"]}, {"sheet": "客观题", "model": "模型", "parts": ["客观题"]}],
});
