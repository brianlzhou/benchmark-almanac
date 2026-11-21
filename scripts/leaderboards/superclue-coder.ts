// SuperCLUE-Coder ranks entries by 总分 on its 总榜 sheet.
// The importer reads the results workbook published by SuperCLUE.
import { workbookBoard } from './agentclue.ts';

export default workbookBoard({
  benchmark: "superclue-coder",
  url: "https://www.superclueai.com/agent/Coder",
  feed: "https://www.superclueai.com/data/agent_list/Coder/2024%E5%B9%B49%E6%9C%88.xlsx",
  roundFolder: "Coder",
  sheet: "总榜",
  model: "模型名称",
  score: "总分",
  minimum: 7,
  parts: ["代码生成与改写", "代码理解与分析", "代码优化与修复", "跨函数与跨文件编程"],
  details: [{"sheet": "代码生成与改写", "model": "模型名称", "parts": ["代码生成", "代码转换"]}, {"sheet": "代码理解与分析", "model": "模型名称", "parts": ["代码注释", "代码理解", "测试用例生成", "文档生成"]}, {"sheet": "代码优化与修复", "model": "模型名称", "parts": ["代码纠错", "性能优化", "安全性检查"]}, {"sheet": "跨函数与跨文件编程", "model": "模型名称", "parts": ["函数调用", "跨文件能力"]}],
});
