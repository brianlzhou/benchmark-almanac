// SuperCLUE-200K ranks entries by 总分 on its SuperCLUE-8K sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-200k",
  url: "https://www.superclueai.com/specialized/200K",
  feed: "https://www.superclueai.com/data/specialized_list/200K/2024%E5%B9%B44%E6%9C%88.xlsx",
  roundFolder: "200K",
  sheet: "SuperCLUE-8K",
  model: "模型",
  score: "总分",
  minimum: 4,
  parts: [],
  details: [{"sheet": "SuperCLUE-32K", "model": "模型", "parts": ["分数"]}, {"sheet": "SuperCLUE-64K", "model": "模型", "parts": ["分数"]}, {"sheet": "SuperCLUE-128K", "model": "模型", "parts": ["分数"]}, {"sheet": "SuperCLUE-256K", "model": "模型", "parts": ["分数"]}],
});
