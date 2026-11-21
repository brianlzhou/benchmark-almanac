// SuperCLUE-Math6o ranks entries by 总分 on its 总榜单 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-math6o",
  url: "https://www.superclueai.com/specialized/Math6o",
  feed: "https://www.superclueai.com/data/specialized_list/Math6o/2025%E5%B9%B41%E6%9C%88.xlsx",
  roundFolder: "Math6o",
  sheet: "总榜单",
  model: "模型",
  score: "总分",
  minimum: 37,
  parts: [],
  settings: ["使用方式"],
  details: [{"sheet": "七大任务榜单", "model": "模型", "parts": ["行程", "数论", "几何", "计数", "应用题", "计算", "奥数杂题"]}],
});
